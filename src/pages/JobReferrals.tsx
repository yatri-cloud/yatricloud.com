import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Copy, Search, Sparkle } from "lucide-react";
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

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __gcse?: { parsetags?: string; callback?: () => void };
    google?: any;
  }
}

const JobReferrals = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const rendered = useRef(false);

  useEffect(() => {
    if (user) getJobProfile().then(setProfile);
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
    } else if (window.google?.search?.cse?.element) {
      setWidgetReady(true);
    }
  }, []);

  // Render the results-only element once the widget API is ready.
  useEffect(() => {
    if (!widgetReady || rendered.current) return;
    const el = window.google?.search?.cse?.element;
    if (!el) return;
    el.render({ div: "gcse-results", tag: "searchresults-only", gname: "referrals" });
    rendered.current = true;
  }, [widgetReady]);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = () => {
    const q = [role.trim(), company.trim(), location.trim() || profile?.locations?.split(",")[0]?.trim()]
      .filter(Boolean)
      .join(" ");
    if (!q) { toast.error("Add a company or role to search."); return; }
    const control = window.google?.search?.cse?.element?.getElement("referrals");
    if (!control) { toast.error("Search is still loading, try again in a moment."); return; }
    control.execute(q);
    setHasSearched(true);
    document.getElementById("gcse-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Note generator
  const [person, setPerson] = useState("");
  const [note, setNote] = useState("");
  const [followup, setFollowup] = useState("");
  const me = profile?.full_name || user?.fullName || "";

  const generate = () => {
    const first = (person.trim().split(/\s+/)[0] || "there").replace(/[^\w'-]/g, "");
    const target = [role.trim(), company.trim() && `at ${company.trim()}`].filter(Boolean).join(" ");
    setNote(
      `Hi ${first}, I really admire the work ${company.trim() || "your team"} is doing. ` +
      `I'm exploring ${target || "opportunities"} and your path stood out to me. ` +
      `Would you be open to connecting? I'd value any pointers. Thanks! — ${me}`
    );
    setFollowup(
      `Thanks for connecting, ${first}! I'm applying for ${target || "a role on your team"} ` +
      `and have tailored my resume to it (attached). If it looks like a fit, I'd be grateful for a referral or any advice. ` +
      `Either way, thank you for your time. — ${me}`
    );
    toast.success("Note and follow-up ready. Edit freely, then copy.");
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
      <main className="container mx-auto max-w-3xl px-4 pb-20 pt-28 md:px-6">
        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Referrals</p>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            Find someone who can <span className="gradient-text">refer you</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Search people at your target company, then generate a note to connect and a
            follow-up to send with your resume.
          </p>
        </div>

        {/* Our search form drives the results widget */}
        <section className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (e.g. Stripe)" aria-label="Company" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Cloud Engineer)" aria-label="Role" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" aria-label="Location" onKeyDown={(e) => e.key === "Enter" && runSearch()} />
          </div>
          <Button className="mt-3 shadow-inset-btn" onClick={runSearch} disabled={!widgetReady}>
            {widgetReady ? <Search className="mr-2 h-4 w-4" /> : <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {widgetReady ? "Find people" : "Loading search…"}
          </Button>
        </section>

        {/* Results widget (LinkedIn profiles). Styled to sit in our card. */}
        <section className={`mb-8 rounded-2xl border border-border bg-card p-5 ${hasSearched ? "" : "hidden"}`}>
          <div id="gcse-results" className="yc-cse" />
        </section>

        {/* Note generator */}
        <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-primary/[0.06] via-brand-50/40 to-card p-5 md:p-6">
          <h2 className="mb-3 font-display text-lg font-bold">Personalised outreach</h2>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Person's name (from a profile above)" aria-label="Person name" />
            <Button onClick={generate} className="shadow-inset-btn"><Sparkle className="mr-1.5 h-4 w-4" /> Generate note & follow-up</Button>
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
