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
 * Referral finder — the manual way. Embeds the owner's Google Programmable
 * Search Engine (restricted to linkedin.com/in/*) so a signed-in Yatri
 * searches for people at a target company right on the page, then generates
 * a personalised connection note and a post-accept follow-up from their
 * profile. No scraping, no LinkedIn API — just Google search + local text.
 */

const CSE_ID = "22c8ca52ab7fa46e6"; // owner's LinkedIn-profiles PSE

const JobReferrals = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const cseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) getJobProfile().then(setProfile);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the Google PSE widget script once.
  useEffect(() => {
    if (document.querySelector(`script[src*="cse.js?cx=${CSE_ID}"]`)) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://cse.google.com/cse.js?cx=${CSE_ID}`;
    document.body.appendChild(s);
  }, []);

  // Note generator inputs
  const [person, setPerson] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");
  const [followup, setFollowup] = useState("");

  const firstName = (person.trim().split(/\s+/)[0] || "there").replace(/[^\w'-]/g, "");
  const me = profile?.full_name || user?.fullName || "";
  const myRoles = profile?.roles || role;

  const generate = () => {
    if (!company.trim() && !role.trim()) {
      toast.error("Add at least the company or the role.");
      return;
    }
    const target = [role.trim(), company.trim() && `at ${company.trim()}`].filter(Boolean).join(" ");
    setNote(
      `Hi ${firstName}, I really admire the work ${company.trim() || "your team"} is doing. ` +
      `I'm exploring ${target || "opportunities"} and your path stood out to me. ` +
      `Would you be open to connecting? I'd value any pointers. Thanks! — ${me}`
    );
    setFollowup(
      `Thanks for connecting, ${firstName}! I'm applying for ${target || "a role on your team"} ` +
      `and have tailored my resume to it (attached). If it looks like a fit, I'd be grateful for a referral or any advice on the process. ` +
      `Either way, thank you for your time. — ${me}`
    );
    toast.success("Note and follow-up ready. Edit freely, then copy.");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied."));
  };

  const linkedInSearch = () => {
    const q = [role.trim(), company.trim(), profile?.locations?.split(",")[0]?.trim()]
      .filter(Boolean)
      .join(" ");
    if (cseRef.current && q) {
      // Prefill the embedded search box if the widget is ready.
      const input = cseRef.current.querySelector<HTMLInputElement>("input.gsc-input");
      if (input) {
        input.value = q;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      toast.message(`Search the box for: ${q}`);
    }
  };

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
            Search LinkedIn profiles for people at your target company, then generate a
            note to connect and a follow-up to send with your resume.
          </p>
        </div>

        {/* Target */}
        <section className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (e.g. Stripe)" aria-label="Company" />
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Cloud Engineer)" aria-label="Role" />
          <Button variant="outline" onClick={linkedInSearch}><Search className="mr-1.5 h-4 w-4" /> Search LinkedIn</Button>
        </section>

        {/* Embedded Google PSE (LinkedIn profiles) */}
        <section className="mb-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-display text-lg font-bold">LinkedIn people search</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Try: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{role || "Software Engineer"} {company || "Stripe"} {profile?.locations?.split(",")[0]?.trim() || "Bangalore"}</code>.
            Results are public LinkedIn profiles via Google.
          </p>
          <div ref={cseRef} className="gcse-search" />
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
                  <label className="text-sm font-semibold">Connection note (with the request)</label>
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
                Grab your tailored resume for this company from{" "}
                <Link to="/jobs/applications" className="font-semibold text-primary hover:underline">My applications</Link>{" "}
                and attach it to the follow-up.
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
