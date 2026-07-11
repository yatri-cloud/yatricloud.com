#!/usr/bin/env node
// Resume worker — runs on YOUR machine, not a server.
//
//   node scripts/resume-worker.mjs
//
// Polls resume_requests (service role), and for each queued row:
//   1. writes input.txt / jd.txt to a job dir under ~/.yatri-resume-jobs
//   2. runs `claude -p` headless to distill them into resume.json
//      (schema + quality rules from resume-maker/)
//   3. runs resume-maker/scripts/make_resume.sh → .docx + .pdf
//   4. uploads to the private `resumes` bucket and marks the row ready
//
// Prerequisites: claude CLI, node 18+, python3, LibreOffice (soffice).
// Stop with Ctrl+C. Rows stay one of queued/processing/ready/failed.

import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, ""),
    ])
);

const URL = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const JOBS = join(homedir(), ".yatri-resume-jobs");
mkdirSync(JOBS, { recursive: true });

const SCHEMA = readFileSync(
  join(ROOT, "resume-maker/scripts/resume.example.json"),
  "utf8"
);
const RULES = readFileSync(
  join(ROOT, "resume-maker/references/best_practices.md"),
  "utf8"
);

async function api(path, init = {}) {
  const res = await fetch(`${URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path} → ${res.status} ${await res.text()}`);
  return res;
}

async function claimNext() {
  // Oldest queued row; mark processing so a second worker won't grab it.
  const res = await api(
    `/rest/v1/resume_requests?status=eq.queued&order=created_at.asc&limit=1`
  );
  const [row] = await res.json();
  if (!row) return null;
  const upd = await api(
    `/rest/v1/resume_requests?id=eq.${row.id}&status=eq.queued`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ status: "processing", updated_at: new Date().toISOString() }),
    }
  );
  const claimed = await upd.json();
  return claimed.length ? claimed[0] : null; // raced by another worker → skip
}

async function fetchSourceFile(job, dir) {
  if (!job.input_file_path) return null;
  const res = await api(`/storage/v1/object/resumes/${job.input_file_path}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const isPdf = job.input_file_path.toLowerCase().endsWith(".pdf");
  const local = join(dir, isPdf ? "uploaded-resume.pdf" : "uploaded-resume.docx");
  writeFileSync(local, buf);
  if (isPdf) return "uploaded-resume.pdf"; // Claude reads PDFs directly
  // DOCX: extract text with python stdlib (docx = zip with document.xml)
  const py = [
    "import zipfile,re,sys",
    "xml = zipfile.ZipFile(sys.argv[1]).read('word/document.xml').decode('utf-8','ignore')",
    "xml = re.sub(r'</w:p>', chr(10), xml)",
    "print(re.sub(r'<[^>]+>', '', xml))",
  ].join("\n");
  const text = execFileSync("python3", ["-c", py, local], { encoding: "utf8" });
  writeFileSync(join(dir, "uploaded-resume.txt"), text);
  return "uploaded-resume.txt";
}

function buildJson(job, dir, sourceName) {
  writeFileSync(join(dir, "input.txt"), job.input_text || "");
  writeFileSync(join(dir, "jd.txt"), job.jd_text || "");
  const sourceLine = sourceName
    ? `Their uploaded resume is ${sourceName} in this directory — Read it; input.txt may add extra notes on top.`
    : `input.txt contains their pasted resume or notes.`;
  const prompt = [
    `You are filling a resume JSON for a person. ${sourceLine}`,
    `${job.jd_text ? "jd.txt contains the job description to tailor toward — mirror its honest keywords, never invent experience." : "There is no job description; make the strongest honest general resume."}`,
    ``,
    `Follow these quality rules strictly:`,
    RULES,
    ``,
    `Output schema — copy this shape exactly (all sections optional, omit empties):`,
    SCHEMA,
    ``,
    `The person's name is: ${job.full_name}`,
    `Include "${job.email}" in the contact line${job.email ? "" : " if a contact email appears in the source"}.`,
    `NEVER output the literal strings "undefined" or "null" anywhere. If a`,
    `field is unknown (an institution, a date, a location), OMIT that key`,
    `entirely instead of guessing or writing a placeholder.`,
    `Set "output" to "${job.full_name.replace(/[^\w ]+/g, "").replace(/ +/g, "_")}_Resume.docx".`,
    `HARD RULE: the resume must fit ONE page. If content is rich, set`,
    `"density":"compact", keep the summary to 3 lines, at most 3-4 bullets`,
    `per role, and drop the weakest project rather than overflowing.`,
    `Read the source files in this directory now, then WRITE the finished`,
    `resume.json here. Write ONLY resume.json. No commentary.`,
  ].join("\n");
  execFileSync("claude", ["-p", prompt, "--permission-mode", "acceptEdits", "--allowedTools", "Read,Write"], {
    cwd: dir,
    stdio: ["ignore", "inherit", "inherit"],
    timeout: 10 * 60 * 1000,
  });
  if (!existsSync(join(dir, "resume.json"))) {
    throw new Error("claude did not produce resume.json");
  }
  scrubResumeJson(join(dir, "resume.json"));
}

// Belt and braces: strip literal "undefined"/"null"/empty values so the
// docx never prints them (seen once: "Computer Engineering, undefined").
function scrubResumeJson(path) {
  const clean = (v) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "string") {
      const t = v.trim();
      return t === "" || t.toLowerCase() === "undefined" || t.toLowerCase() === "null"
        ? undefined
        : v;
    }
    if (Array.isArray(v)) {
      const arr = v.map(clean).filter((x) => x !== undefined);
      return arr.length ? arr : undefined;
    }
    if (typeof v === "object") {
      const out = {};
      for (const [k, val] of Object.entries(v)) {
        const c = clean(val);
        if (c !== undefined) out[k] = c;
      }
      return Object.keys(out).length ? out : undefined;
    }
    return v;
  };
  const scrubbed = clean(JSON.parse(readFileSync(path, "utf8"))) || {};
  writeFileSync(path, JSON.stringify(scrubbed, null, 2));
}

function buildFiles(job, dir) {
  const outName = job.full_name.replace(/[^\w ]+/g, "").replace(/ +/g, "_") + "_Resume";
  execSync(
    `bash "${join(ROOT, "resume-maker/scripts/make_resume.sh")}" resume.json "${outName}"`,
    { cwd: dir, stdio: "inherit", timeout: 5 * 60 * 1000 }
  );
  const docx = join(dir, `${outName}.docx`);
  const pdf = join(dir, `${outName}.pdf`);
  // make_resume.sh may write into ./output — check both spots.
  const find = (p) => (existsSync(p) ? p : existsSync(join(dir, "output", `${outName}${p.endsWith(".pdf") ? ".pdf" : ".docx"}`)) ? join(dir, "output", `${outName}${p.endsWith(".pdf") ? ".pdf" : ".docx"}`) : null);
  return { docx: find(docx), pdf: find(pdf), outName };
}

async function upload(job, localPath, ext, mime) {
  const path = `${job.user_id}/${job.id}/${job.full_name.replace(/[^\w ]+/g, "").replace(/ +/g, "_")}_Resume.${ext}`;
  await api(`/storage/v1/object/resumes/${path}`, {
    method: "POST",
    headers: { "Content-Type": mime, "x-upsert": "true" },
    body: readFileSync(localPath),
  });
  return path;
}

async function finish(id, patch) {
  await api(`/rest/v1/resume_requests?id=eq.${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
}

function pdfPages(path) {
  // Parse the PDF directly (mdls returns null on files Spotlight has not
  // indexed yet, which is every freshly built job). /Count on the page tree
  // root is authoritative for LibreOffice output; page objects are backup.
  try {
    const raw = readFileSync(path).toString("latin1");
    const counts = (raw.match(/\/Count\s+(\d+)/g) || []).map((s) =>
      parseInt(s.replace(/\D+/g, ""), 10)
    );
    if (counts.length) return Math.max(...counts);
    const pageObjs = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
    return pageObjs || null;
  } catch {
    return null;
  }
}

function compactJson(dir, pages) {
  // Second pass: the built PDF overflowed — have Claude tighten the SAME
  // resume.json down to one page (never invent, only condense/trim).
  const prompt = [
    `resume.json in this directory produced a ${pages}-page PDF. It must fit`,
    `EXACTLY ONE page. Edit resume.json in place: set "density":"compact",`,
    `shorten the summary to 3 lines, cut each role to its 3 strongest`,
    `bullets, tighten wording, and drop the weakest project or extra section`,
    `if still needed. Do not invent or reword facts into stronger claims.`,
    `Write ONLY resume.json. No commentary.`,
  ].join("\n");
  execFileSync("claude", ["-p", prompt, "--permission-mode", "acceptEdits", "--allowedTools", "Read,Write"], {
    cwd: dir,
    stdio: ["ignore", "inherit", "inherit"],
    timeout: 10 * 60 * 1000,
  });
}

async function processJob(job) {
  const dir = join(JOBS, job.id);
  mkdirSync(dir, { recursive: true });
  console.log(`▶ ${job.id} — ${job.full_name}`);
  const sourceName = await fetchSourceFile(job, dir);
  buildJson(job, dir, sourceName);
  let { docx, pdf } = buildFiles(job, dir);
  if (!docx) throw new Error("build produced no .docx");

  // One-page guarantee: rebuild once (twice max) with compaction if over.
  for (let attempt = 0; attempt < 2; attempt++) {
    const pages = pdf ? pdfPages(pdf) : null;
    if (pages === null || pages <= 1) break;
    console.log(`  ${pages} pages — compacting (attempt ${attempt + 1})`);
    compactJson(dir, pages);
    ({ docx, pdf } = buildFiles(job, dir));
    if (!docx) throw new Error("compaction rebuild produced no .docx");
  }
  const docxPath = await upload(job, docx, "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  const pdfPath = pdf ? await upload(job, pdf, "pdf", "application/pdf") : null;
  await finish(job.id, { status: "ready", docx_path: docxPath, pdf_path: pdfPath, error: null });
  console.log(`✔ ready — ${docxPath}`);
  await notifyReady(job);
}

// Friendly heads-up mail via the production mailer; never fails the job.
async function notifyReady(job) {
  if (!job.email) return;
  try {
    await fetch("https://www.yatricloud.com/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: job.email,
        subject: "Your resume is ready · Yatri Cloud",
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#007CFF;margin:0 0 12px">Your resume is ready, ${job.full_name.split(" ")[0]}!</h2>
          <p>Your polished, one page resume is waiting as Word and PDF.</p>
          <p><a href="https://www.yatricloud.com/resume-maker" style="display:inline-block;background:#007CFF;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Download your resume</a></p>
          <p style="color:#666;font-size:13px">It stays private to your Yatri Cloud account.</p>
        </div>`,
      }),
    });
  } catch (err) {
    console.log(`  (ready email skipped: ${err.message})`);
  }
}

console.log("Yatri resume worker watching the queue… (Ctrl+C to stop)");
for (;;) {
  try {
    const job = await claimNext();
    if (!job) {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    try {
      await processJob(job);
    } catch (err) {
      console.error(`✖ ${job.id}:`, err.message);
      await finish(job.id, {
        status: "failed",
        error: "Build failed. The team has been notified, please try again.",
      });
    }
  } catch (err) {
    console.error("worker loop error:", err.message);
    await new Promise((r) => setTimeout(r, 10000));
  }
}
