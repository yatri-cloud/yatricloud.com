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

function buildJson(job, dir) {
  writeFileSync(join(dir, "input.txt"), job.input_text);
  writeFileSync(join(dir, "jd.txt"), job.jd_text || "");
  const prompt = [
    `You are filling a resume JSON for the person described in input.txt`,
    `(their pasted resume or notes). ${job.jd_text ? "jd.txt contains the job description to tailor toward — mirror its honest keywords, never invent experience." : "There is no job description; make the strongest honest general resume."}`,
    ``,
    `Follow these quality rules strictly:`,
    RULES,
    ``,
    `Output schema — copy this shape exactly (all sections optional, omit empties):`,
    SCHEMA,
    ``,
    `The person's name is: ${job.full_name}`,
    `Set "output" to "${job.full_name.replace(/[^\w ]+/g, "").replace(/ +/g, "_")}_Resume.docx".`,
    `Read input.txt and jd.txt in this directory now, then WRITE the finished`,
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

async function processJob(job) {
  const dir = join(JOBS, job.id);
  mkdirSync(dir, { recursive: true });
  console.log(`▶ ${job.id} — ${job.full_name}`);
  buildJson(job, dir);
  const { docx, pdf } = buildFiles(job, dir);
  if (!docx) throw new Error("build produced no .docx");
  const docxPath = await upload(job, docx, "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  const pdfPath = pdf ? await upload(job, pdf, "pdf", "application/pdf") : null;
  await finish(job.id, { status: "ready", docx_path: docxPath, pdf_path: pdfPath, error: null });
  console.log(`✔ ready — ${docxPath}`);
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
