import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Copy, Search, Sparkle, Linkedin, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import { getJobProfile, type JobProfile } from "@/lib/job-apply-api";

/**
 * Referral finder. Our own search form drives Google's Programmable Search
 * Engine results widget (restricted to linkedin.com/in/* profiles). The
 * widget renders results with no API key and no GCP project setup — reliable
 * out of the box — and we style the surrounding page. Below it, a note
 * generator writes a connection request + a post-accept follow-up from the
 * user's profile. Public results only; no scraping, no LinkedIn login.
 */

const CSE_CX = "d214cfcea7a57404d"; // linkedin-people-finder engine

interface Person {
  name: string;
  headline: string;
  role: string;
  company: string;
  location: string;
  photo: string;
  url: string;
  snippet: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __gcse?: { parsetags?: string; callback?: () => void };
  }
}
const gcseApi = () => (window as any).google?.search?.cse?.element;

/** Official LinkedIn logo mark (icon only). */
const LinkedInLogo = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const JobReferrals = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const rendered = useRef(false);

  useEffect(() => {
    if (user) getJobProfile().then(setProfile);
    // Prefill from a job's "Referrals" link (/jobs/referrals?company=&role=).
    const params = new URLSearchParams(window.location.search);
    const c = params.get("company");
    const r = params.get("role");
    if (c) setCompany(c);
    if (r) setRole(r);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the PSE widget in EXPLICIT mode so we render + drive it ourselves.
  useEffect(() => {
    window.__gcse = {
      parsetags: "explicit",
      callback: () => setWidgetReady(true),
    };
    if (!document.querySelector(`script[src*="cse.js?cx=${CSE_CX}"]`)) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://cse.google.com/cse.js?cx=${CSE_CX}`;
      document.body.appendChild(s);
    } else if (gcseApi()) {
      setWidgetReady(true);
    }
  }, []);

  // Render the results-only element once the widget API is ready.
  useEffect(() => {
    if (!widgetReady || rendered.current) return;
    const el = gcseApi();
    if (!el) return;
    el.render({ div: "gcse-results", tag: "searchresults-only", gname: "referrals" });
    rendered.current = true;
  }, [widgetReady]);

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [pastCompany, setPastCompany] = useState("");
  const [school, setSchool] = useState("");
  const [industry, setIndustry] = useState("");
  const [keywords, setKeywords] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [rows, setRows] = useState<Person[] | null>(null);
  const [busy, setBusy] = useState(false);

  // Compose a Google query over linkedin.com/in profiles from the filters.
  // Quoted phrases keep multi-word titles/companies together.
  const buildQuery = () => {
    const phrase = (s: string) => {
      const t = s.trim();
      if (!t) return "";
      return /\s/.test(t) ? `"${t}"` : t;
    };
    return [
      phrase(role),
      phrase(company),
      phrase(pastCompany),
      phrase(school),
      phrase(industry),
      location.trim() || profile?.locations?.split(",")[0]?.trim() || "",
      keywords.trim(),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
  };

  // Parse the widget's rendered results (which it fetches from the PSE) into
  // our own structured rows: photo, name, headline, company, url, snippet.
  const parseWidget = (): Person[] => {
    const host = document.getElementById("gcse-results");
    if (!host) return [];
    const out: Person[] = [];
    const seen = new Set<string>();
    host.querySelectorAll(".gsc-webResult.gsc-result").forEach((el) => {
      const a = el.querySelector<HTMLAnchorElement>("a.gs-title");
      const url = a?.href || "";
      if (!url.includes("linkedin.com/in") || seen.has(url)) return;
      seen.add(url);
      const rawTitle = (a?.textContent || "").replace(/\s+/g, " ").trim();
      const title = rawTitle.replace(/\s*[-–|]\s*LinkedIn.*$/i, "");
      const [namePart, ...rest] = title.split(/\s+[-–]\s+/);
      const headline = rest.join(" - ").trim();
      const snippet = (el.querySelector(".gs-snippet")?.textContent || "").replace(/\s+/g, " ").trim();
      const text = `${headline} ${snippet}`;
      // Role = first segment of the headline before a company marker.
      const role = headline.split(/\s*(?:@|\bat\b|\||•|·|-)\s*/)[0]?.trim() || "";
      // Company from "@X", "at X", or "X | Ex" patterns.
      const companyMatch =
        text.match(/@\s*([A-Z][\w&.\- ]+?)(?:\s*[|•·]|$)/) ||
        text.match(/\bat\s+([A-Z][\w&.\- ]+?)(?:\s*[|•·]|,|$)/);
      // Location — LinkedIn snippets usually start with "City · N connections".
      const locMatch = snippet.match(/^([A-Za-z .,'-]+?)\s*·/);
      const img =
        el.querySelector<HTMLImageElement>(".gsc-thumbnail img, img.gs-image, .gs-image-box img, img");
      out.push({
        name: namePart.trim(),
        headline: headline || snippet,
        role,
        company: (companyMatch?.[1] || "").trim(),
        location: (locMatch?.[1] || "").trim(),
        photo: img?.src || "",
        url,
        snippet,
      });
    });
    return out;
  };

  const runSearch = () => {
    const q = buildQuery();
    if (!q) { toast.error("Fill at least one filter to search."); return; }
    const control = gcseApi()?.getElement("referrals");
    if (!control) { toast.error("Search is still loading, try again in a moment."); return; }
    setBusy(true);
    setHasSearched(true);
    setRows(null);
    control.execute(q);
    // Widget renders into the off-screen host; poll its DOM into our table.
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      const parsed = parseWidget();
      if (parsed.length > 0 || tries >= 20) {
        window.clearInterval(timer);
        setRows(parsed);
        setBusy(false);
      }
    }, 300);
  };

  const TITLE_SUGGESTIONS = [
    "Software Engineer", "Senior Software Engineer", "Platform Engineer",
    "AI Engineer", "Staff Software Engineer", "Engineering Manager", "Recruiter",
  ];

  // Note generator
  const [person, setPerson] = useState("");
  const [note, setNote] = useState("");
  const [followup, setFollowup] = useState("");
  const me = profile?.full_name || user?.fullName || "";

  const generate = (fromName?: string, fromCompany?: string) => {
    if (fromName) setPerson(fromName);
    const first = ((fromName || person).trim().split(/\s+/)[0] || "there").replace(/[^\w'-]/g, "");
    const co = fromCompany || company;
    const target = [role.trim(), co.trim() && `at ${co.trim()}`].filter(Boolean).join(" ");
    setNote(
      `Hi ${first}, I really admire the work ${co.trim() || "your team"} is doing. ` +
      `I'm exploring ${target || "opportunities"} and your path stood out to me. ` +
      `Would you be open to connecting? I'd value any pointers. Thanks! — ${me}`
    );
    setFollowup(
      `Thanks for connecting, ${first}! I'm applying for ${target || "a role on your team"} ` +
      `and have tailored my resume to it (attached). If it looks like a fit, I'd be grateful for a referral or any advice. ` +
      `Either way, thank you for your time. — ${me}`
    );
    toast.success("Note and follow-up ready. Edit freely, then copy.");
    document.getElementById("note-block")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => toast.success("Copied."));

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="noise-overlay" /><Navbar />
        <main className="container mx-auto max-w-2xl px-4 py-32 text-center">
          <p className="text-muted-foreground">Sign in to find referrals.</p>
          <Button asChild className="mt-4 shadow-inset-btn"><Link to="/certifiedyatris">Sign in</Link></Button>
        </main><Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Find a Referral | Yatri Cloud" description="Find people at your target company and generate a personalised connection note." noindex />
      <div className="noise-overlay" />
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 pb-20 pt-28 md:px-6">
        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Referrals</p>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            Find someone who can <span className="gradient-text">refer you</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Filter people at your target companies, then generate a note to connect and a
            follow-up to send with your resume.
          </p>
        </div>

        {/* Minimal filter row */}
        <section className="mb-6 rounded-2xl border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Job title" aria-label="Job title" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" aria-label="Company" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" aria-label="Location" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <Button className="shadow-inset-btn" onClick={runSearch} disabled={!widgetReady || busy}>
              {busy || !widgetReady ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Find
            </Button>
          </div>
          {showMore && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input value={pastCompany} onChange={(e) => setPastCompany(e.target.value)} placeholder="Past company" aria-label="Past company" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
              <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="School" aria-label="School" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry" aria-label="Industry" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
              <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords" aria-label="Keywords" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            </div>
          )}
          <button type="button" onClick={() => setShowMore((v) => !v)} className="mt-2.5 text-xs font-medium text-primary hover:underline">
            {showMore ? "Fewer filters" : "More filters"}
          </button>
        </section>

        {/* Off-screen widget host (real width so Google renders it; we parse
            it into our own table below). Not display:none / zero-size. */}
        <div
          id="gcse-results"
          aria-hidden
          style={{ position: "absolute", left: "-10000px", top: 0, width: "760px" }}
        />

        {/* OUR custom table */}
        {hasSearched && (
          <section className="mb-8">
            {busy ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" /> Finding people…
              </div>
            ) : !rows || rows.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                No profiles found. Try different filters.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border bg-brand-50/40 px-4 py-2.5 text-sm font-semibold">
                  {rows.length} people found
                </div>
                <ul className="divide-y divide-border/60">
                  {rows.map((p) => (
                    <li key={p.url} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50/30">
                      {p.photo ? (
                        <img src={p.photo} alt="" width={44} height={44} loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.replaceWith(Object.assign(document.createElement("span"), { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-primary", textContent: p.name.slice(0, 1) })); }} />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-primary">{p.name.slice(0, 1)}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p.name || "—"}</p>
                        <p className="truncate text-sm text-foreground/80">
                          {p.role || p.headline}
                          {p.company && <span className="text-muted-foreground"> · {p.company}</span>}
                        </p>
                        {p.location && (
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" /> {p.location}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                          <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} on LinkedIn`}>
                            <LinkedInLogo className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="sm" className="h-8 shadow-inset-btn" onClick={() => generate(p.name, p.company)}>Note</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Note generator */}
        <section id="note-block" className="rounded-2xl border border-brand-100 bg-gradient-to-br from-primary/[0.06] via-brand-50/40 to-card p-5 md:p-6">
          <h2 className="mb-3 font-display text-lg font-bold">Personalised outreach</h2>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Person's name (from a profile above)" aria-label="Person name" />
            <Button onClick={() => generate()} className="shadow-inset-btn"><Sparkle className="mr-1.5 h-4 w-4" /> Generate note & follow-up</Button>
          </div>
          {note && (
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-semibold">Connection note (send with the request)</label>
                  <Button variant="ghost" size="sm" onClick={() => copy(note)}><Copy className="mr-1 h-3.5 w-3.5" /> Copy</Button>
                </div>
                <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-semibold">Follow-up (after they accept, send with your resume)</label>
                  <Button variant="ghost" size="sm" onClick={() => copy(followup)}><Copy className="mr-1 h-3.5 w-3.5" /> Copy</Button>
                </div>
                <Textarea rows={4} value={followup} onChange={(e) => setFollowup(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Grab your tailored resume from{" "}
                <Link to="/jobs/applications" className="font-semibold text-primary hover:underline">My applications</Link>{" "}and attach it to the follow-up.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default JobReferrals;
