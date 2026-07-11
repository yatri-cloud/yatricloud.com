# Resume Best Practices (ATS + India Market + Editorial Review)

This is the judgment layer. Formatting is the easy part; this is what actually
makes a resume credible. Read it before reviewing any resume's content.

## 1. ATS (Applicant Tracking System) safety
- **Single column only.** Two-column / sidebar designs get scrambled or dropped
  by many parsers — the sidebar (often skills + certs) can vanish entirely.
- **Real text, not graphics.** No text inside images/icons/text-boxes for
  anything that must be parsed. Standard fonts (Arial/Calibri). No headshot.
- **Standard section headings:** Professional Summary, Technical Skills,
  Professional Experience, Key Projects, Education, Certifications.
- **Simple bullets** (•), standard month-year dates, no tables for layout.
- Keyword lists as comma/•-separated text parse fine.

## 2. Length by seniority
- 0–8 years → **one page**. A nearly empty second page reads as weak; fix it.
- 8+ years → up to two pages; ending partway down page 2 is normal and fine.
- Never pad to fill a page — padding is what weakens a resume.

## 3. India-market conventions (what to INCLUDE)
- **City + country** (e.g. "Bengaluru, India") — city only, not full address.
- **Availability / notice period** when it helps: "Immediate Joiner" is a real
  advantage **only if the person is actually between jobs or free to join**. Do
  not add it for someone currently employed unless they give a notice period.
- **10th/12th (Class X/XII)** are commonly listed by freshers — but **drop them
  for any graduate who has work experience** (saves space, looks senior).
- **CGPA/percentage** with each degree is normal and expected.

## 4. India-market conventions (what to OMIT for modern MNC/product/startup roles)
Omitting these *is* the current best practice; their presence dates a resume:
- Photo, date of birth, age, marital status, gender, nationality, religion.
- Full postal address (city only).
- "Declaration" block with signature/place/date — traditional, but skip for
  MNC/product/startup roles. **Offer to add it only if the person targets PSU /
  government / very traditional employers.**
- "References available on request" — filler; recruiters assume it.
- Current/expected CTC — never on the resume; negotiate later.
- Graduation year can be omitted for very senior candidates to avoid age bias
  (optional — keep for juniors).

## 5. Editorial review checklist (apply to every resume)
1. **De-duplicate.** The same bullet often appears in both the summary and a
   project, or a "project" repeats the day-job bullets. Keep one home for each.
2. **Professionalize informal lines.** Rewrite "I work on these metrics…",
   "I am also managing…" into parallel, verb-first bullets. Fix typos
   (e.g. "esscliation" → "escalation").
3. **Accuracy of employer/client.** "Supporting … at <BigBank>" when the person
   works for a vendor → reframe as "(client: <BigBank>)". Misrepresenting the
   employer fails background checks.
4. **Tone down overclaims.** "Expert in architecting scalable systems" for a
   1-year engineer invites skepticism → "Skilled in building…". Keep the
   person's metrics, but right-size the adjectives.
5. **Strong verbs, quantified results.** Directed, Architected, Engineered,
   Institutionalized, Built, Reduced, Delivered — each bullet ends on impact.
6. **Casing/spelling consistency.** `React.js` not `React.JS`; fix double commas
   and spacing; standardize cert names.
7. **Fix PDF-extraction artifacts.** Ligatures often corrupt on extraction
   ("so,ware", "integraEon", dropped labels). Use the rendered page as truth.

## 6. Known bad-template bullets — SCAN AND SCRUB
A batch of templated resumes circulating in the Indian junior-dev market contains
fabricated/mismatched bullets. If you see these, they are almost certainly wrong:
- **"Travellie – Smart Tour & Travel Booking Platform"** described as a
  *"HIPAA-compliant patient-provider portal… improved referral efficiency by 35%
  … medical staff."* This healthcare text is pasted into a TRAVEL project and has
  appeared verbatim on multiple different people's resumes. Rewrite the travel
  project honestly from its real stack (React/Express/Node/MongoDB, JWT/OAuth,
  RESTful APIs) **with no invented metric**, and tell the user to supply the real
  description and numbers.
- More generally: if two unrelated candidates share an identical, oddly specific
  achievement bullet, treat it as template contamination and flag it. Identical
  bullets across applicants to the same company are an instant credibility kill.

## 7. Handling aggressive metrics
Keep the person's own numbers (don't delete their claims), but when a resume is
metric-heavy relative to experience (e.g. many big percentages for ~1 year), tell
the user plainly: be ready to explain how each was measured. Never fabricate a
metric to fill a gap — leave it out and flag it for the person to provide.

## 8. What only the candidate can supply (always flag these)
- Real project descriptions + verified metrics for anything you rewrote.
- Actual LinkedIn / GitHub URLs (resumes often show them only as hyperlinks).
- Current city / relocation / remote preference.
- Confirmation of availability / notice period.
- Which version/emphasis to use if they target different role types
  (e.g. developer vs. application-support) — offer a tailored variant.
