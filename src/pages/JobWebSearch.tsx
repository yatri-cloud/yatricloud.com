import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import { getJobProfile, type JobProfile } from "@/lib/job-apply-api";

/**
 * Jobs on the web — searches the owner's job-finder PSE (LinkedIn jobs,
 * careers.google, amazon.jobs, Naukri, ATS boards…) and renders results in
 * OUR table. Same off-screen-widget → parse pattern as the referral finder
 * (no JSON API key/quota). Paginates ONE page (10 results) at a time via the
 * widget's own cursor, so it never over-fetches — the API-saving design.
 */

const CSE_CX = "e3b4730ad9f744115"; // yatri-job-finder engine

interface WebJob {
  title: string;
  company: string;
  location: string;
  posted: string;
  url: string;
  snippet: string;
  source: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __gcse?: { parsetags?: string; callback?: () => void };
  }
}
const gcseApi = () => (window as any).google?.search?.cse?.element;

/** Company logo: Clearbit → Google favicon → initial. */
const CompanyLogo = ({ name }: { name: string }) => {
  const [stage, setStage] = useState(0);
  const domain = name
    ? name.toLowerCase().replace(/\b(inc|llc|ltd|technologies|labs|india|pvt|private|limited|global)\b/g, "").replace(/[^a-z0-9]/g, "") + ".com"
    : "";
  const sources = domain
    ? [`https://logo.clearbit.com/${domain}`, `https://www.google.com/s2/favicons?domain=${domain}&sz=64`]
    : [];
  if (!domain || stage >= sources.length) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-primary">
        {(name || "?").slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-1">
      <img src={sources[stage]} alt="" width={24} height={24} loading="lazy" className="h-6 w-6 object-contain" onError={() => setStage((s) => s + 1)} />
    </span>
  );
};

const JobWebSearch = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [ready, setReady] = useState(false);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (user) getJobProfile().then(setProfile);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.__gcse = { parsetags: "explicit", callback: () => setReady(true) };
    if (!document.querySelector(`script[src*="cse.js?cx=${CSE_CX}"]`)) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://cse.google.com/cse.js?cx=${CSE_CX}`;
      document.body.appendChild(s);
    } else if (gcseApi()) setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || renderedRef.current) return;
    const el = gcseApi();
    if (!el) return;
    el.render({ div: "gcse-jobs", tag: "searchresults-only", gname: "webjobs" });
    renderedRef.current = true;
  }, [ready]);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [region, setRegion] = useState("any");
  const [level, setLevel] = useState("any");
  const [empType, setEmpType] = useState("any");
  const [remote, setRemote] = useState(false);
  const [source, setSource] = useState("any");
  const [showMore, setShowMore] = useState(false);
  const [rows, setRows] = useState<WebJob[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [searched, setSearched] = useState(false);

  const REGIONS: Record<string, string> = {
    any: "", india: "India", us: "United States", uk: "United Kingdom",
    europe: "Europe", canada: "Canada", australia: "Australia",
    singapore: "Singapore", uae: "UAE Dubai", remote: "remote",
  };
  const LEVEL_TERMS: Record<string, string> = {
    any: "", intern: "intern", entry: "entry level", mid: "", senior: "senior",
  };
  const EMP_TERMS: Record<string, string> = {
    any: "", fulltime: "full-time", internship: "internship", contract: "contract", parttime: "part-time",
  };
  // Source filter → a site: operator that narrows within the engine's sites.
  const SOURCE_SITE: Record<string, string> = {
    any: "", linkedin: "site:linkedin.com/jobs", naukri: "site:naukri.com",
    google: "site:careers.google.com", microsoft: "site:jobs.careers.microsoft.com",
    amazon: "site:amazon.jobs", greenhouse: "site:greenhouse.io",
    lever: "site:lever.co", ashby: "site:ashbyhq.com",
  };

  const buildQuery = () =>
    [
      title.trim(),
      company.trim(),
      LEVEL_TERMS[level],
      EMP_TERMS[empType],
      remote ? "remote" : "",
      location.trim() || REGIONS[region] || profile?.locations?.split(",")[0]?.trim() || "",
      SOURCE_SITE[source],
    ]
      .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  const cleanTitle = (t: string) =>
    t
      // Everything after a pipe or middot is site/benefits noise ("… | Great pay").
      .replace(/\s*[|·]\s.*$/, "")
      // Drop trailing requisition IDs ("… - Job ID 12345", "(Job ID: …)").
      .replace(/\s*[-–(]\s*Job\s*ID\b.*$/i, "")
      .replace(/\s*[-–]\s*(LinkedIn|Indeed|Naukri(\.com)?|Glassdoor|Amazon\.jobs|Careers?)\b.*$/i, "")
      // Trim a trailing org/division tail ("…, Amazon Business", "…, AWS Sales").
      .replace(/,\s*[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+(Business|Group|Team|Services|Division|Org|Sales|Operations)\b.*$/, "")
      .replace(/\s+/g, " ")
      .trim();

  // Known cities/regions — used both to validate a "… in <place>" title tail and
  // to pull a clean location out of a snippet (never a tech word or team name).
  const CITY_RE = /\b(Bengaluru|Bangalore|Mumbai|New Delhi|Delhi|Gurgaon|Gurugram|Hyderabad|Pune|Chennai|Noida|Kolkata|Ahmedabad|Jaipur|Remote|London|Dublin|Singapore|Toronto|Sydney|Berlin|Dubai|San Francisco|New York|Seattle|Austin|Amsterdam|India|United States|United Kingdom|USA|UAE|Canada|Australia|Germany|Ireland)\b(?:,\s*(?:Karnataka|Maharashtra|Telangana|Haryana|Tamil Nadu|India|UK|USA?|Ireland|Canada|Germany|Australia|Netherlands|Singapore))?/;

  const sourceName = (host: string): string => {
    if (/linkedin/.test(host)) return "LinkedIn";
    if (/naukri/.test(host)) return "Naukri";
    if (/amazon\.jobs/.test(host)) return "Amazon";
    if (/careers\.google/.test(host)) return "Google";
    if (/microsoft/.test(host)) return "Microsoft";
    if (/greenhouse|job-boards/.test(host)) return "Greenhouse";
    if (/lever/.test(host)) return "Lever";
    if (/ashby/.test(host)) return "Ashby";
    const base = host.replace(/^www\./, "").split(".")[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  const parsePage = (): { jobs: WebJob[]; pages: number } => {
    // Read from the whole document — the widget may render inline OR in an
    // overlay (kept off-screen via CSS); either way we find its results here.
    const jobs: WebJob[] = [];
    const seen = new Set<string>();
    document.querySelectorAll(".gsc-webResult.gsc-result").forEach((el) => {
      const a = el.querySelector<HTMLAnchorElement>("a.gs-title");
      const url = a?.href || "";
      if (!url || seen.has(url)) return;
      seen.add(url);
      const raw = cleanTitle(a?.textContent || "");
      const snippet = (el.querySelector(".gs-snippet")?.textContent || "").replace(/\s+/g, " ").trim();
      // Skip closed postings.
      if (/no longer accepting|closed for applications|position (has been )?filled/i.test(snippet)) return;
      // Source first — it decides how the title is shaped per board.
      let host = "";
      try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* */ }
      const source = host ? sourceName(host) : "Web";
      const isLinkedIn = source === "LinkedIn";
      const isSource = (s: string) => /^(LinkedIn|Naukri|Indeed|Glassdoor|Jobs?)\b/i.test(s.trim());
      // Pull a trailing "… in Bengaluru, Karnataka, India" off the WHOLE title first
      // so the role reads clean and it never leaks into a dash-split company.
      let work = raw, titleLoc = "";
      const inLoc = work.match(/\s+in\s+([A-Z][A-Za-z .,'/-]+)$/);
      // Only strip the tail when it's genuinely a place ("… in Bengaluru"),
      // not a team/role phrase ("… in Test, Alexa Global Quality").
      if (inLoc && CITY_RE.test(inLoc[1])) { titleLoc = inLoc[1].trim(); work = work.slice(0, inLoc.index).trim(); }
      // Amazon/careers landing pages title themselves with just a place — skip them.
      const looksLikeLocation = /^[A-Z][A-Za-z .]+,\s*(India|USA?|UK|United\b|Canada|Australia|Singapore|UAE|Germany|Ireland)/i.test(work) && !/engineer|manager|developer|analyst|designer|lead|architect|scientist|consultant|specialist|intern|director|officer|administrator|sde/i.test(work);
      if (looksLikeLocation) return;
      let jobTitle = work, company = "";
      const hiring = work.match(/^(.+?)\s+hiring\s+/i);
      if (hiring) {
        company = hiring[1].trim();
        jobTitle = work.replace(/^.+?hiring\s+/i, "").trim();
      } else if (!isLinkedIn) {
        // "Role - Company" only off LinkedIn, and only when the right side really
        // looks like a company (≤4 words, no stray "in"/level suffix like "II").
        const dash = work.match(/^(.+?)\s+[-–]\s+(.+)$/);
        if (dash && !isSource(dash[2]) && dash[2].split(/\s+/).length <= 4 && !/\bin\b/i.test(dash[2]) && !/^[IVX]+\b/.test(dash[2])) {
          jobTitle = dash[1].trim();
          company = dash[2].trim();
        }
      }
      // Company from snippet ("Google Bengaluru, Karnataka …") if not in title.
      if (!company) {
        const m = snippet.match(/^([A-Z][A-Za-z0-9&.'\- ]{1,40}?)\s+(?:Bengaluru|Bangalore|Mumbai|Delhi|Gurgaon|Gurugram|Hyderabad|Pune|Chennai|Noida|Kolkata|India|Remote|United|London|New York|San |Dublin|Singapore)/);
        if (m && !isSource(m[1])) company = m[1].trim();
      }
      // Anchor location to a real city so we never pick up a tech-stack word
      // ("Python") or a team name ("Test, Alexa Global Quality …") from the snippet.
      const cityMatch = snippet.match(CITY_RE);
      const postedMatch = snippet.match(/(\d+\s+(?:hour|day|week|month|year)s?\s+ago)/i) || snippet.match(/(\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4})/);
      // When the source IS the employer (amazon.jobs, careers.google, MS jobs),
      // the company is that employer — override snippet noise like "Amazon Careers".
      if (/^(Amazon|Google|Microsoft)$/.test(source)) company = source;
      // Otherwise tidy trailing "Careers"/"Jobs" that leaked in from a snippet.
      company = company.replace(/\s+(Careers?|Jobs?|Hiring)$/i, "").trim();
      jobs.push({
        title: jobTitle || work,
        company,
        location: (titleLoc || cityMatch?.[0] || "").trim(),
        posted: (postedMatch?.[1] || "").trim(),
        url,
        snippet,
        source,
      });
    });
    const pageEls = document.querySelectorAll(".gsc-cursor-page");
    return { jobs, pages: Math.max(1, pageEls.length) };
  };

  const pollParse = (onDone: (r: { jobs: WebJob[]; pages: number }) => void) => {
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      const r = parsePage();
      if (r.jobs.length > 0 || tries >= 20) { window.clearInterval(timer); onDone(r); }
    }, 300);
  };

  // The widget doesn't reliably honour the `site:` operator, so enforce the
  // chosen source ourselves: keep only rows whose parsed source matches.
  const SOURCE_LABEL: Record<string, string> = {
    linkedin: "LinkedIn", naukri: "Naukri", google: "Google", microsoft: "Microsoft",
    amazon: "Amazon", greenhouse: "Greenhouse", lever: "Lever", ashby: "Ashby",
  };
  const applySourceFilter = (jobs: WebJob[]) =>
    source === "any" ? jobs : jobs.filter((j) => j.source === SOURCE_LABEL[source]);

  const runSearch = () => {
    const q = buildQuery();
    if (!q) { toast.error("Enter a job title or keyword."); return; }
    const control = gcseApi()?.getElement("webjobs");
    if (!control) { toast.error("Search is still loading, try again."); return; }
    setBusy(true); setSearched(true); setRows(null); setPage(1);
    control.execute(q);
    pollParse(({ jobs, pages }) => { setRows(applySourceFilter(jobs)); setMaxPage(pages); setBusy(false); });
  };

  // Go to a page by clicking the widget's own cursor (fetches just that page).
  const goToPage = (n: number) => {
    const host = document.getElementById("gcse-jobs");
    const cursor = host?.querySelectorAll<HTMLElement>(".gsc-cursor-page");
    if (!cursor || !cursor[n - 1]) return;
    setBusy(true); setRows(null);
    cursor[n - 1].click();
    pollParse(({ jobs, pages }) => { setRows(applySourceFilter(jobs)); setMaxPage(pages); setPage(n); setBusy(false); window.scrollTo({ top: 0, behavior: "smooth" }); });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="noise-overlay" /><Navbar />
        <main className="container mx-auto max-w-2xl px-4 py-32 text-center">
          <p className="text-muted-foreground">Sign in to search jobs on the web.</p>
          <Button asChild className="mt-4 shadow-inset-btn"><Link to="/certifiedyatris">Sign in</Link></Button>
        </main><Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Jobs on the Web | Yatri Cloud" description="Search jobs across LinkedIn, Amazon, Google and top company boards in one place." noindex />
      <div className="noise-overlay" />
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 pb-20 pt-28 md:px-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Jobs on the web</p>
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
              Search <span className="gradient-text">everywhere</span>
            </h1>
            <p className="mt-2 text-muted-foreground">LinkedIn, Amazon, Google and top company boards — in one place.</p>
          </div>
          <Button variant="outline" asChild><Link to="/jobs">Yatri job board</Link></Button>
        </div>

        {/* Filter panel */}
        <section className="mb-6 rounded-2xl border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title or keywords" aria-label="Job title" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (or use region)" aria-label="Location" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger aria-label="Region"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any region</SelectItem>
                <SelectItem value="india">India</SelectItem>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="canada">Canada</SelectItem>
                <SelectItem value="australia">Australia</SelectItem>
                <SelectItem value="singapore">Singapore</SelectItem>
                <SelectItem value="uae">UAE / Dubai</SelectItem>
                <SelectItem value="remote">Remote (global)</SelectItem>
              </SelectContent>
            </Select>
            <Button className="shadow-inset-btn" onClick={runSearch} disabled={!ready || busy}>
              {busy || !ready ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>

          {showMore && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" aria-label="Company" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger aria-label="Source"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  {/* Only sources Google actually indexes for job pages — Naukri,
                      Microsoft careers and Ashby return ~0 via search, so they'd
                      just show "No jobs found" and are intentionally omitted. */}
                  <SelectItem value="any">Any source</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="google">Google Careers</SelectItem>
                  <SelectItem value="greenhouse">Greenhouse</SelectItem>
                  <SelectItem value="lever">Lever</SelectItem>
                </SelectContent>
              </Select>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger aria-label="Experience level"><SelectValue placeholder="Experience" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any experience</SelectItem>
                  <SelectItem value="intern">Internship</SelectItem>
                  <SelectItem value="entry">Entry level</SelectItem>
                  <SelectItem value="mid">Mid level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
              <Select value={empType} onValueChange={setEmpType}>
                <SelectTrigger aria-label="Employment type"><SelectValue placeholder="Job type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any type</SelectItem>
                  <SelectItem value="fulltime">Full-time</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="parttime">Part-time</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm">
                <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} className="h-4 w-4 accent-primary" />
                Remote only
              </label>
            </div>
          )}
          <button type="button" onClick={() => setShowMore((v) => !v)} className="mt-2.5 text-xs font-medium text-primary hover:underline">
            {showMore ? "Fewer filters" : "More filters (company, experience, type, remote)"}
          </button>
        </section>

        {/* Off-screen widget host (real width so Google renders it) */}
        <div id="gcse-jobs" aria-hidden style={{ position: "absolute", left: "-10000px", top: 0, width: "760px" }} />

        {searched && (
          <section>
            {busy ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" /> Searching…
              </div>
            ) : !rows || rows.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                {source !== "any"
                  ? "No results from this source. Try “Any source” or a broader keyword."
                  : "No jobs found. Try different words."}
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="border-b border-border bg-brand-50/40 px-4 py-2.5 text-sm font-semibold">
                    Page {page} of {maxPage}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-4 py-2.5 font-semibold">Role</th>
                          <th className="px-4 py-2.5 font-semibold">Company</th>
                          <th className="px-4 py-2.5 font-semibold">Location</th>
                          <th className="px-4 py-2.5 font-semibold">Posted</th>
                          <th className="px-4 py-2.5 font-semibold">Source</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((j) => (
                          <tr key={j.url} className="border-b border-border/60 align-middle last:border-0 hover:bg-brand-50/30">
                            <td className="max-w-[280px] px-4 py-3">
                              <a href={j.url} target="_blank" rel="noopener noreferrer" title={j.title} className="line-clamp-2 font-semibold text-foreground hover:text-primary">{j.title}</a>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-2">
                                {j.company && <CompanyLogo name={j.company} />}
                                <span className="font-medium">{j.company || "—"}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{j.location || "—"}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{j.posted || "—"}</td>
                            <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{j.source}</span></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                {j.company && (
                                  <Button variant="outline" size="sm" className="h-8" asChild>
                                    <Link to={`/jobs/referrals?company=${encodeURIComponent(j.company)}&role=${encodeURIComponent(j.title)}`}>Referrals</Link>
                                  </Button>
                                )}
                                <Button size="sm" className="h-8 shadow-inset-btn" asChild>
                                  <a href={j.url} target="_blank" rel="noopener noreferrer">Apply <ExternalLink className="ml-1 h-3.5 w-3.5" /></a>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {maxPage > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <Button variant="outline" size="sm" disabled={page <= 1 || busy} onClick={() => goToPage(page - 1)}>
                      <ChevronLeft className="mr-1 h-4 w-4" /> Prev
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {maxPage}</span>
                    <Button variant="outline" size="sm" disabled={page >= maxPage || busy} onClick={() => goToPage(page + 1)}>
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default JobWebSearch;
