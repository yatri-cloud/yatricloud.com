# JD Tailoring — Method

How to tailor a resume to a specific job description so it ranks well in ATS and
reads as an obvious fit to a human — without ever fabricating.

## The principle
ATS scores a resume against the JD's literal keywords and required skills. A
recruiter then skims for a fast yes/no on fit. Tailoring optimizes both — by
**surfacing the true matches** the JD cares about, in the JD's own words, near the
top. It is emphasis and wording, never invention.

## Step 1 — Parse the JD into a checklist
Pull out, in the JD's exact phrasing:
- **Role + seniority** (e.g. "Senior Backend Engineer").
- **Must-have skills/tech** (languages, frameworks, cloud, tools).
- **Nice-to-haves.**
- **Core responsibilities** (what you'd actually do).
- **Domain** (fintech, health, devtools, etc.).
- **Recurring keywords** — terms repeated or in the title are weighted heavily.

## Step 2 — Map against the candidate's TRUE profile
For each JD must-have, find genuine evidence in the base resume. Three buckets:
- **Match** → surface it, in the JD's wording, high up.
- **Adjacent** → the candidate has a closely related/transferable skill → present
  it accurately (don't relabel it as the exact JD skill if it isn't).
- **Gap** → the candidate lacks it → do NOT invent it. Record it for the report.

## Step 3 — Rewrite with emphasis (not fabrication)
- **Summary:** 3–4 lines aimed at this role and seniority, leading with the
  candidate's strongest JD-relevant truths.
- **Skills:** reorder groups and items so JD must-haves come first. Use the JD's
  exact term when the candidate genuinely has it ("REST APIs" vs "RESTful APIs",
  "CI/CD", "TypeScript", "Kubernetes").
- **Experience/projects:** reorder bullets so the most JD-relevant impact leads;
  rephrase true bullets to use JD vocabulary; trim bullets the JD doesn't value.
- **Title/tagline:** echo the target role if the candidate legitimately fits it.
- Keep all real metrics; never inflate them to match the JD.

## Step 4 — The honesty line (do not cross it)
- Never add a tool, skill, certification, or responsibility the candidate hasn't
  actually used. Keyword-stuffing things they can't defend fails the interview and
  burns trust.
- Don't relabel a gap as a match. "Exposure to X" ≠ "Expert in X".
- If the candidate is a weak fit, say so in the match report rather than masking it.

## Step 5 — Match report (`output/<name>_match_report.md`)
Give the candidate a clear, candid picture:
- **Covered must-haves** — and where each is shown on the resume.
- **Gaps** — JD requirements not met; suggest options (upskill, address in cover
  letter, or skip).
- **Keyword coverage** — the literal JD terms now present.
- **Honest fit read** — a short, candid strength-of-match assessment.

## Practical notes
- One base resume → many tailored variants. Keep a master `resume.json` and derive
  a per-JD copy; name outputs `Lastname_Company_Role`.
- Tailoring is also a length tool: cutting JD-irrelevant content is the cleanest
  way to hit one page.
- Re-mirror terminology per JD: the same true skill may be "GenAI", "LLMs", or
  "generative AI" depending on the posting — match the posting.
