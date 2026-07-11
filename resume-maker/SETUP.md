# SETUP — Resume Maker for Claude Code

One-time setup so the resume maker runs locally in any IDE where you use
Claude Code (terminal, VS Code, JetBrains, Claude Desktop).

## 1. Put these files in your project
Your project root should look like:
```
your-project/
├── CLAUDE.md                      ← Claude Code reads this automatically
├── pdf/                           ← put base resume(s) here (PDF/DOCX)
├── jd/                            ← put job description(s) here (.pdf/.md/.txt)
├── output/                        ← tailored resumes + match reports land here
└── resume-maker/
    ├── README.md
    ├── SETUP.md                   ← this file
    ├── scripts/
    │   ├── build_resume.js
    │   ├── post_process.py
    │   ├── make_resume.sh
    │   └── resume.example.json
    └── references/
        ├── best_practices.md
        └── jd_tailoring.md
```

## 2. Install the prerequisites

**Node.js** (18+). The `docx` package installs itself on first run, or do it now:
```bash
cd resume-maker/scripts && npm install docx
```

**Python 3** — already on macOS/Linux; on Windows install from python.org. No pip
packages needed (uses the standard library only).

**LibreOffice** — needed to export the PDF (provides the `soffice` command):
- macOS:    `brew install --cask libreoffice`
- Ubuntu/Debian: `sudo apt-get install -y libreoffice`
- Windows:  download from libreoffice.org (or run the whole thing under WSL)

**English hyphenation dictionary** (so justified text hyphenates cleanly in the PDF):
- Ubuntu/Debian: `sudo apt-get install -y hyphen-en-us`
- macOS: bundled with LibreOffice; if needed, add the English dictionary via
  LibreOffice → Tools → Language → Writing Aids.
Without it the PDF still builds; the right edge of justified prose just shows
slightly larger gaps.

## 3. Use it
Put your base resume in `pdf/` and the target job description in `jd/`, open
Claude Code, and say:
> "Tailor my resume in pdf/ to the JD in jd/ — ATS resume, Word + PDF."

Claude Code reads `CLAUDE.md`, parses the JD, tailors the content honestly to it,
builds the resume into `output/`, fits it to the right page count, and writes a
match report (`output/<name>_match_report.md`) showing covered vs. missing
requirements.

Or run the build yourself once `resume.json` exists:
```bash
bash resume-maker/scripts/make_resume.sh resume.json output/Name_Company_Role
```

## Notes
- **Windows:** the `.sh` wrapper expects bash — use Git Bash or WSL, or run the
  three steps manually: `node build_resume.js resume.json out.docx` →
  `python3 post_process.py out.docx` → open in LibreOffice/Word and Save As PDF.
- The `.docx` is fully editable in Word/Google Docs; hyphenation and the
  no-hyphen styles travel with the file, so reflow stays clean as you edit.
- Everything is local — no calls to any external service.
