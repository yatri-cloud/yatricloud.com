# Resume Maker (Claude Code edition)

Data-driven, ATS-safe resume generator. Fill a JSON file, get matching
`.docx` + `.pdf`. Driven by `CLAUDE.md` in the project root; see `SETUP.md`
to install, and `references/best_practices.md` for the content/quality rules.

## Build
```bash
bash scripts/make_resume.sh resume.json OutputName
```

## JSON schema
Copy `scripts/resume.example.json` and edit. All sections optional — omit empties.

| Key | Type | Notes |
|---|---|---|
| `output` | string | output filename, e.g. `"Name_Resume.docx"` |
| `density` | `"normal"` \| `"compact"` | use `compact` to help fit one page |
| `name` | string | auto-uppercased |
| `title` | string | tagline under the name |
| `contact` | string[] | joined with ` • ` (city, phone, email, LinkedIn, GitHub) |
| `availability` | string | optional; e.g. `"Immediate Joiner"` — ONLY if accurate |
| `summary` | string | 3–4 lines; justified, never splits words |
| `skills` | `[label, value][]` | left-aligned keyword lines |
| `experience` | `{company,dates,role,location,bullets[]}[]` | dates right-aligned |
| `projects` | `{title,context,bullets[],tech}[]` | `context` shows after the title |
| `education` | `{degree,institution,extra}[]` | `extra` (CGPA/year) right-aligned; keep `institution` short so it doesn't collide with `extra` |
| `certifications` | string \| string[] | one keyword line |
| `extraSections` | `{heading,lines[]}[]` | e.g. Community, Volunteering |
| `accentColor` | hex | optional; default navy `1F3A5F` |

## Pipeline
`build_resume.js` (JSON → .docx) → `post_process.py` (hyphenation + en-US +
`kwlist`/`nohyp` no-hyphen styles, via stdlib zipfile) → LibreOffice (→ .pdf).
