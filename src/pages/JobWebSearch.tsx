import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, ExternalLink, MapPin, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [rows, setRows] = useState<WebJob[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [searched, setSearched] = useState(false);

  const buildQuery = () =>
    [title.trim(), location.trim() || profile?.locations?.split(",")[0]?.trim() || ""]
      .filter(Boolean).join(" ").trim();

  const cleanTitle = (t: string) =>
    t.replace(/\s*[|\-–]\s*(LinkedIn|Indeed|Naukri|Glassdoor).*$/i, "").replace(/\s+/g, " ").trim();

  const parsePage = (): { jobs: WebJob[]; pages: number } => {
    const host = document.getElementById("gcse-jobs");
    if (!host) return { jobs: [], pages: 1 };
    const jobs: WebJob[] = [];
    const seen = new Set<string>();
    host.querySelectorAll(".gsc-webResult.gsc-result").forEach((el) => {
      const a = el.querySelector<HTMLAnchorElement>("a.gs-title");
      const url = a?.href || "";
      if (!url || seen.has(url)) return;
      seen.add(url);
      const raw = cleanTitle(a?.textContent || "");
      const snippet = (el.querySelector(".gs-snippet")?.textContent || "").replace(/\s+/g, " ").trim();
      const domain = (el.querySelector(".gs-visibleUrl, .gsc-url-top")?.textContent || "").trim();
      // Company: "Title - Company", "Company hiring Title", or the domain host.
      const dash = raw.match(/^(.*?)\s+[-–]\s+(.+)$/);
      const hiring = raw.match(/^(.+?)\s+hiring\s+/i);
      let jobTitle = raw, company = "";
      if (hiring) { company = hiring[1].trim(); jobTitle = raw.replace(/^.+?hiring\s+/i, "").trim(); }
      else if (dash) { jobTitle = dash[1].trim(); company = dash[2].trim(); }
      const locMatch = snippet.match(/\b(?:in|·)\s*([A-Z][A-Za-z .,'-]+?(?:,\s*[A-Z][A-Za-z .]+)?)\b/);
      let source = "Web";
      try { source = new URL(url).hostname.replace(/^www\./, "").split(".")[0]; } catch { /* */ }
      jobs.push({
        title: jobTitle || raw,
        company: company || domain,
        location: (locMatch?.[1] || "").trim(),
        url,
        snippet,
        source: source.charAt(0).toUpperCase() + source.slice(1),
      });
    });
    const pageEls = host.querySelectorAll(".gsc-cursor-page");
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

  const runSearch = () => {
    const q = buildQuery();
    if (!q) { toast.error("Enter a job title or keyword."); return; }
    const control = gcseApi()?.getElement("webjobs");
    if (!control) { toast.error("Search is still loading, try again."); return; }
    setBusy(true); setSearched(true); setRows(null); setPage(1);
    control.execute(q);
    pollParse(({ jobs, pages }) => { setRows(jobs); setMaxPage(pages); setBusy(false); });
  };

  // Go to a page by clicking the widget's own cursor (fetches just that page).
  const goToPage = (n: number) => {
    const host = document.getElementById("gcse-jobs");
    const cursor = host?.querySelectorAll<HTMLElement>(".gsc-cursor-page");
    if (!cursor || !cursor[n - 1]) return;
    setBusy(true); setRows(null);
    cursor[n - 1].click();
    pollParse(({ jobs, pages }) => { setRows(jobs); setMaxPage(pages); setPage(n); setBusy(false); window.scrollTo({ top: 0, behavior: "smooth" }); });
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
      <SEO title="Jobs on the Web | Yatri Cloud" description="Search jobs across LinkedIn, company careers and Naukri in one place." noindex />
      <div className="noise-overlay" />
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 pb-20 pt-28 md:px-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Jobs on the web</p>
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
              Search <span className="gradient-text">everywhere</span>
            </h1>
            <p className="mt-2 text-muted-foreground">LinkedIn, company careers and Naukri — in one place.</p>
          </div>
          <Button variant="outline" asChild><Link to="/jobs">Yatri job board</Link></Button>
        </div>

        {/* Filter row */}
        <section className="mb-6 rounded-2xl border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title or keywords" aria-label="Job title" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" aria-label="Location" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <Button className="shadow-inset-btn" onClick={runSearch} disabled={!ready || busy}>
              {busy || !ready ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
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
                No jobs found. Try different words.
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="border-b border-border bg-brand-50/40 px-4 py-2.5 text-sm font-semibold">
                    Page {page} of {maxPage}
                  </div>
                  <ul className="divide-y divide-border/60">
                    {rows.map((j) => (
                      <li key={j.url} className="flex flex-col gap-2 px-4 py-3 hover:bg-brand-50/30 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <a href={j.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary">
                            {j.title}
                          </a>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                            {j.company && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{j.company}</span>}
                            {j.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.location}</span>}
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{j.source}</span>
                          </p>
                        </div>
                        <Button size="sm" className="shrink-0 shadow-inset-btn" asChild>
                          <a href={j.url} target="_blank" rel="noopener noreferrer">Apply <ExternalLink className="ml-1 h-3.5 w-3.5" /></a>
                        </Button>
                      </li>
                    ))}
                  </ul>
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
