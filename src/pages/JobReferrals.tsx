import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Copy, Search, Sparkle, Linkedin, UserPlus } from "lucide-react";
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
 * Referral finder — OUR interface, OUR results. A custom search form calls
 * the Google Custom Search JSON API (owner's LinkedIn-profiles engine) and we
 * render the profiles as our own cards. The API key is REFERRER-RESTRICTED to
 * our domains (VITE_GOOGLE_CSE_KEY), so it is safe in the browser and useless
 * elsewhere. Public Google results only — no scraping, no LinkedIn login.
 */

const CSE_CX = "22c8ca52ab7fa46e6";
const CSE_KEY = import.meta.env.VITE_GOOGLE_CSE_KEY as string | undefined;

interface Profile {
  name: string;
  headline: string;
  location: string;
  url: string;
  snippet: string;
}

const cleanName = (title: string) =>
  title.replace(/\s*[|\-–—].*$/, "").replace(/ - LinkedIn.*/i, "").trim();

// LinkedIn result titles are usually "Name - Headline - Location | LinkedIn".
const parseTitle = (title: string) => {
  const t = title.replace(/\s*\|\s*LinkedIn.*$/i, "").replace(/ - LinkedIn.*/i, "");
  const parts = t.split(/\s+[-–—]\s+/);
  return {
    name: (parts[0] || "").trim(),
    headline: (parts[1] || "").trim(),
    location: (parts[2] || "").trim(),
  };
};

const JobReferrals = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [profile, setProfile] = useState<JobProfile | null>(null);
  useEffect(() => {
    if (user) getJobProfile().then(setProfile);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<Profile[] | null>(null);
  const [searching, setSearching] = useState(false);

  const runSearch = async () => {
    const q = [role.trim(), company.trim(), location.trim() || profile?.locations?.split(",")[0]?.trim()]
      .filter(Boolean)
      .join(" ");
    if (!q) { toast.error("Add a company or role to search."); return; }
    if (!CSE_KEY) {
      toast.error("Search key not set yet. Add VITE_GOOGLE_CSE_KEY to enable in-app results.");
      return;
    }
    setSearching(true);
    setResults(null);
    try {
      // Paginate: 5 pages × 10 = up to 50 profiles (JSON API caps at start=91).
      const all: Profile[] = [];
      const seen = new Set<string>();
      for (let start = 1; start <= 41; start += 10) {
        const res = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${CSE_KEY}&cx=${CSE_CX}&num=10&start=${start}&q=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const items = (data.items || []).filter((it: { link?: string }) =>
          (it.link || "").includes("linkedin.com/in/")
        );
        for (const it of items as { title: string; link: string; snippet: string }[]) {
          if (seen.has(it.link)) continue;
          seen.add(it.link);
          const parsed = parseTitle(it.title);
          all.push({
            name: parsed.name || cleanName(it.title),
            headline: parsed.headline,
            location: parsed.location,
            url: it.link,
            snippet: it.snippet || "",
          });
        }
        if (items.length < 10) break; // no more pages
      }
      setResults(all);
      if (all.length === 0) toast.message("No profiles found. Try different words.");
      else toast.success(`${all.length} profiles found.`);
    } catch (e) {
      toast.error(`Search failed: ${e instanceof Error ? e.message : "try again"}`);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Note generator (fills from a chosen profile)
  const [person, setPerson] = useState("");
  const [note, setNote] = useState("");
  const [followup, setFollowup] = useState("");
  const me = profile?.full_name || user?.fullName || "";

  const generate = (name?: string) => {
    const who = (name || person).trim();
    const first = (who.split(/\s+/)[0] || "there").replace(/[^\w'-]/g, "");
    if (name) setPerson(name);
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

        {/* Our own search form */}
        <section className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (e.g. Stripe)" aria-label="Company" />
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Cloud Engineer)" aria-label="Role" />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" aria-label="Location" />
          </div>
          <Button className="mt-3 shadow-inset-btn" onClick={runSearch} disabled={searching}>
            {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Find people
          </Button>
          {!CSE_KEY && (
            <p className="mt-3 text-xs text-muted-foreground">
              In-app results need a search key. Add <code className="rounded bg-muted px-1 py-0.5">VITE_GOOGLE_CSE_KEY</code> (referrer-restricted) to enable them — see docs/features/programmable-search.md.
            </p>
          )}
        </section>

        {/* Our own result TABLE */}
        {results !== null && (
          <section className="mb-8">
            {results.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                No profiles found. Try different words.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border bg-brand-50/40 px-4 py-2.5">
                  <p className="text-sm font-semibold">{results.length} people found</p>
                  <p className="text-xs text-muted-foreground">Public LinkedIn profiles via Google</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Headline</th>
                        <th className="px-4 py-3 font-semibold">Location</th>
                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.url} className="border-b border-border/60 last:border-0 hover:bg-brand-50/30 align-top">
                          <td className="px-4 py-3 font-semibold">{r.name || "—"}</td>
                          <td className="max-w-[320px] px-4 py-3 text-muted-foreground">
                            {r.headline || <span className="line-clamp-2">{r.snippet}</span>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{r.location || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button variant="outline" size="sm" className="h-8" asChild>
                                <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${r.name} on LinkedIn`}>
                                  <Linkedin className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                              <Button size="sm" className="h-8 shadow-inset-btn" onClick={() => generate(r.name)}>
                                <UserPlus className="mr-1 h-3.5 w-3.5" /> Note
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Note generator */}
        <section id="note-block" className="rounded-2xl border border-brand-100 bg-gradient-to-br from-primary/[0.06] via-brand-50/40 to-card p-5 md:p-6">
          <h2 className="mb-3 font-display text-lg font-bold">Personalised outreach</h2>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Person's name" aria-label="Person name" />
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
