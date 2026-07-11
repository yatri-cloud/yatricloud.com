/*
 * build_resume.js — Data-driven ATS-safe resume generator.
 * Usage:  node build_resume.js <resume.json> [output.docx]
 * Requires: npm install docx
 *
 * Reads a JSON resume spec and emits a clean, single-column, ATS-friendly .docx:
 *   - centered name + tagline + contact line
 *   - navy section headings with underline rules
 *   - justified body prose (summary, bullets) with hyphenation
 *   - left-aligned, non-hyphenated keyword lists (skills, tech, certs, education)
 *   - right-aligned dates aligned to the true right margin
 * After running this, run post_process.py on the .docx to enable hyphenation,
 * set language, and inject the no-hyphen paragraph styles (kwlist, nohyp).
 */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat,
  BorderStyle, TabStopType, ExternalHyperlink
} = require("docx");

const inPath = process.argv[2];
if (!inPath) { console.error("Usage: node build_resume.js <resume.json> [output.docx]"); process.exit(1); }
const R = JSON.parse(fs.readFileSync(inPath, "utf8"));
const outPath = process.argv[3] || R.output || "Resume.docx";

// ---- theme + density -----------------------------------------------------
const NAVY = R.accentColor || "1F3A5F";
const GRAY = "333333";
const FONT = R.font || "Arial";
const RIGHT = 12240 - 936 - 936; // content width for right-aligned tab stops

const D = (R.density === "compact") ? {
  mTop: 540, mBottom: 504, secBefore: 88, secAfter: 40, bullet: 8, projBefore: 50,
  projAfter: 16, tech: 12, skill: 11, edu: 12, summary: 36, name: 38
} : {
  mTop: 720, mBottom: 648, secBefore: 150, secAfter: 70, bullet: 18, projBefore: 90,
  projAfter: 30, tech: 28, skill: 24, edu: 22, summary: 56, name: 40
};

// ---- helpers -------------------------------------------------------------
const T = (text, opts = {}) => new TextRun(Object.assign({ text, size: 20, font: FONT }, opts));
const para = (o) => new Paragraph(o);

// ---- clickable links -----------------------------------------------------
// Render a contact/link entry as a real clickable hyperlink when it is a URL
// or email. Accepts a plain string ("linkedin.com/in/x", "name@mail.com",
// "https://..."), or an object { text, url }/{ text, link } for explicit
// label + destination. Non-links fall through to normal styled text.
function normLink(item) {
  if (item && typeof item === "object") {
    const url = item.url || item.link || "";
    return { text: item.text || url, url: url || null };
  }
  const s = String(item).trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { text: s, url: "mailto:" + s };
  if (/^https?:\/\//i.test(s)) return { text: s.replace(/^https?:\/\//i, "").replace(/\/+$/, ""), url: s };
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(s)) return { text: s.replace(/\/+$/, ""), url: "https://" + s };
  return { text: s, url: null };
}
// One hyperlink run (navy + underline so it reads as clickable, ATS-safe text).
function linkRun(text, url, size = 18) {
  return new ExternalHyperlink({ link: url,
    children: [new TextRun({ text, size, font: FONT, color: NAVY, underline: {} })] });
}
function contactLine(items) {
  const children = [];
  [].concat(items).forEach((it, i) => {
    if (i) children.push(T(SEP, { size: 18, color: GRAY }));
    const { text, url } = normLink(it);
    children.push(url ? linkRun(text, url, 18) : T(text, { size: 18, color: GRAY }));
  });
  return para({ alignment: AlignmentType.CENTER, style: "nohyp", spacing: { after: R.availability ? 18 : 40 }, children });
}

function nameP(t) { return para({ alignment: AlignmentType.CENTER, spacing: { after: 16 },
  children: [T(t, { bold: true, size: D.name, color: NAVY })] }); }
function center(t, size, color, after, bold = false) {
  return para({ alignment: AlignmentType.CENTER, spacing: { after }, children: [T(t, { size, color, bold })] }); }
function section(t) { return para({ spacing: { before: D.secBefore, after: D.secAfter },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 2 } },
  children: [T(t, { bold: true, size: 22, color: NAVY })] }); }
function bullet(t) { return para({ numbering: { reference: "b", level: 0 },
  alignment: AlignmentType.JUSTIFIED, spacing: { after: D.bullet }, children: [T(t, { color: "000000" })] }); }
function jobHeader(company, dates, role, location) {
  return [
    para({ spacing: { before: 90, after: 0 }, tabStops: [{ type: TabStopType.RIGHT, position: RIGHT }],
      children: [T(company, { bold: true, size: 21, color: GRAY }), T("\t" + (dates || ""), { size: 19, color: GRAY })] }),
    para({ spacing: { after: 40 }, children: [
      T(role || "", { italics: true, size: 20, color: NAVY }),
      T(location ? "   |   " + location : "", { italics: true, size: 19, color: GRAY })] }),
  ];
}
function projTitle(title, context, link) {
  const runs = [link
    ? new ExternalHyperlink({ link, children: [new TextRun({ text: title, bold: true, size: 20, font: FONT, color: NAVY, underline: {} })] })
    : T(title, { bold: true, color: GRAY })];
  if (context) {
    const c = normLink(context);
    runs.push(T("   |   ", { italics: true, size: 19, color: GRAY }));
    runs.push(c.url ? linkRun(c.text, c.url, 19) : T(c.text, { italics: true, size: 19, color: GRAY }));
  }
  return para({ spacing: { before: D.projBefore, after: D.projAfter }, children: runs });
}
function techLine(t) { return para({ style: "kwlist", spacing: { before: 2, after: D.tech },
  children: [T("Tech Stack: ", { bold: true, size: 19, color: NAVY }), T(t, { size: 19, color: "000000" })] }); }
function skillLine(label, rest) { return para({ style: "kwlist", spacing: { after: D.skill },
  children: [T(label + "  ", { bold: true, color: NAVY }), T(rest, { color: "000000" })] }); }
function eduLine(degree, inst, extra) { return para({ style: "kwlist", spacing: { after: D.edu },
  tabStops: [{ type: TabStopType.RIGHT, position: RIGHT }],
  children: [T(degree, { bold: true, color: "000000" }), T(inst ? ", " + inst : "", { color: "000000" }),
    T(extra ? "\t" + extra : "", { size: 19, color: GRAY })] }); }
function bodyKw(t, after) { return para({ style: "kwlist", spacing: { after }, children: [T(t, { color: "000000" })] }); }
function summaryP(t) { return para({ alignment: AlignmentType.JUSTIFIED, style: "nohyp",
  spacing: { after: D.summary }, children: [T(t, { color: "000000" })] }); }

const SEP = "   \u2022   ";
const kids = [];

// ---- header --------------------------------------------------------------
kids.push(nameP((R.name || "").toUpperCase()));
if (R.title) kids.push(center(R.title, 21, GRAY, R.availability ? 18 : 40));
if (R.contact) kids.push(contactLine(R.contact));
if (R.availability) kids.push(center("Availability: " + R.availability, 18, NAVY, 40, true));

// ---- summary -------------------------------------------------------------
if (R.summary) { kids.push(section("PROFESSIONAL SUMMARY")); kids.push(summaryP(R.summary)); }

// ---- skills --------------------------------------------------------------
if (R.skills && R.skills.length) {
  kids.push(section("TECHNICAL SKILLS"));
  R.skills.forEach(([label, val]) => kids.push(skillLine(label + ":", val)));
}

// ---- experience ----------------------------------------------------------
if (R.experience && R.experience.length) {
  kids.push(section(R.experienceHeading || "PROFESSIONAL EXPERIENCE"));
  R.experience.forEach(j => {
    jobHeader(j.company, j.dates, j.role, j.location).forEach(p => kids.push(p));
    (j.bullets || []).forEach(b => kids.push(bullet(b)));
  });
}

// ---- projects ------------------------------------------------------------
if (R.projects && R.projects.length) {
  kids.push(section("KEY PROJECTS"));
  R.projects.forEach(p => {
    kids.push(projTitle(p.title, p.context, p.link));
    (p.bullets || []).forEach(b => kids.push(bullet(b)));
    if (p.tech) kids.push(techLine(p.tech));
  });
}

// ---- education -----------------------------------------------------------
if (R.education && R.education.length) {
  kids.push(section("EDUCATION"));
  R.education.forEach(e => kids.push(eduLine(e.degree, e.institution, e.extra)));
}

// ---- certifications ------------------------------------------------------
// Each cert is a plain string, or { text, url } to render a clickable
// verification link (kept as ATS-safe underlined text).
if (R.certifications) {
  kids.push(section("CERTIFICATIONS"));
  const certChildren = [];
  [].concat(R.certifications).forEach((it, i) => {
    if (i) certChildren.push(T(SEP, { color: "000000" }));
    if (it && typeof it === "object" && it.url) {
      certChildren.push(linkRun(it.text || it.url, it.url, 20));
    } else {
      certChildren.push(T(String(it), { color: "000000" }));
    }
  });
  kids.push(para({ style: "kwlist", spacing: { after: 0 }, children: certChildren }));
}

// ---- extra free-form sections -------------------------------------------
// Each: { "heading": "...", "lines": ["..."] }  -> left-aligned kw lines
(R.extraSections || []).forEach(s => {
  kids.push(section(s.heading.toUpperCase()));
  (s.lines || []).forEach(l => kids.push(bodyKw(l, D.skill)));
});

// ---- assemble ------------------------------------------------------------
const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 20 } } } },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET,
    text: "\u2022", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 230, hanging: 170 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 },
    margin: { top: D.mTop, right: 936, bottom: D.mBottom, left: 936 } } }, children: kids }],
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync(outPath, buf); console.log("Wrote " + outPath); });
