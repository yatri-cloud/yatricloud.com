# Resume Maker (/resume-maker)

Signed-in Yatris paste their current resume or notes (plus an optional job
description) and get a polished, ATS safe resume as matching Word + PDF,
private to their account.

## Architecture (local worker, user-chosen)

```
/resume-maker page ──insert──▶ resume_requests (status: queued)
                                     │  polled every 5s (service role)
                        scripts/resume-worker.mjs  ← runs on the OWNER's Mac
                                     │
              claude -p (headless) fills resume.json from input + rules
              resume-maker/scripts/make_resume.sh → .docx + .pdf
                                     │
                 upload → storage bucket `resumes/<user_id>/<request_id>/…`
                 row → status ready (docx_path/pdf_path)
                                     │
        page polls listMyResumeRequests → Ready → signed-URL downloads
```

- **Migration 040? No — 039_resume_requests.sql** (applied live): table +
  RLS (authenticated insert/select own, admin select; worker mutates via
  service role) + private `resumes` bucket with owner-folder read policy.
- **Frontend:** `src/pages/ResumeMaker.tsx` (lazy route), `src/lib/resume-api.ts`
  (insert resolves `auth.getUser()` for user_id — the localStorage mirror has
  no id), QuickAccess chip on the homepage, sitemap entry.
- **Worker:** `scripts/resume-worker.mjs` — `node scripts/resume-worker.mjs`.
  Needs: `claude` CLI, node 18+, python3, LibreOffice (`soffice`), repo `.env`
  with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. One job at a time,
  claim-with-guard PATCH so two workers never double-build.
- **Engine:** `resume-maker/` at repo root (copied from the user's local
  project; scripts/node_modules git-ignored). `resume.example.json` doubles
  as the schema shown to Claude; `references/best_practices.md` are the
  quality rules.

## Constraints and honest limits

- Resumes only generate **while the worker is running on the owner's Mac**.
  If it's off, requests sit politely in `queued` and the UI says so.
- Requests carry PII (name, work history) — the table is never
  anon-readable, files are in a private bucket, downloads are signed URLs.
- `claude -p` runs with `--allowedTools Read,Write` in an isolated job dir
  under `~/.yatri-resume-jobs/<request-id>`.

## Gotchas

- The `resume-maker/scripts/make_resume.sh` writes output either next to
  resume.json or into `./output/` — the worker checks both.
- Vercel Hobby 12-function cap: this feature deliberately adds **zero**
  `api/` functions; everything flows through Supabase + the local worker.
