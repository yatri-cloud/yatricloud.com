import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Upload, FileText, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import { uploadResumeSource, resumeDownloadUrl } from "@/lib/resume-api";
import { getJobProfile, saveJobProfile, type JobProfile } from "@/lib/job-apply-api";

/**
 * Job seeker profile — the manual builder. Everything the seeker enters up
 * front (resume, roles, area, locations, target companies, seniority, mode,
 * notes) so the rest of the job flow (matching, tailored resumes, referral
 * outreach) works from one saved profile.
 */

const EMPTY: JobProfile = {
  full_name: "", resume_path: "", roles: "", headline: "", locations: "",
  work_area: "", seniority: "", work_mode: "", target_companies: "", notes: "",
};

const JobSeekerProfile = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [p, setP] = useState<JobProfile>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    getJobProfile().then((existing) => {
      setP({ ...EMPTY, full_name: user.fullName || "", ...(existing || {}) });
      setLoaded(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof JobProfile, v: string) => setP((prev) => ({ ...prev, [k]: v }));

  const uploadResume = async (file: File | null) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      toast.error("Upload a PDF or Word (.docx) file.");
      return;
    }
    setBusy(true);
    const up = await uploadResumeSource(file);
    setBusy(false);
    if ("error" in up) { toast.error("The file did not upload."); return; }
    set("resume_path", up.path);
    toast.success("Resume uploaded. Remember to Save.");
  };

  const viewResume = async () => {
    if (!p.resume_path) return;
    const url = await resumeDownloadUrl(p.resume_path);
    if (url) window.open(url, "_blank", "noopener");
  };

  const save = async () => {
    if (!p.full_name.trim()) { toast.error("Add your name."); return; }
    setSaving(true);
    const ok = await saveJobProfile(p);
    setSaving(false);
    toast[ok ? "success" : "error"](ok ? "Profile saved." : "Could not save. Try again.");
  };

  const completeness = useMemo(() => {
    const fields = [p.resume_path, p.roles, p.work_area, p.locations, p.seniority, p.work_mode];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [p]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="My Job Profile | Yatri Cloud" description="Build your job seeker profile: resume, target roles, area, locations and more." noindex />
      <div className="noise-overlay" />
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 pb-20 pt-28 md:px-6">
        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Job seeker profile</p>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            Tell us what you're <span className="gradient-text">looking for</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Fill this once. It powers your matches, tailored resumes and referral outreach.
          </p>
        </div>

        {!user ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">Sign in to build your profile.</p>
            <Button asChild className="mt-4 shadow-inset-btn"><Link to="/certifiedyatris">Sign in</Link></Button>
          </div>
        ) : !loaded ? (
          <div className="py-16 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" /> Loading…</div>
        ) : (
          <div className="space-y-6">
            {/* Completeness */}
            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Profile {completeness}% complete</span>
                {completeness === 100 && <span className="inline-flex items-center gap-1 text-success"><Check className="h-4 w-4" /> Ready</span>}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness}%` }} />
              </div>
            </div>

            {/* Resume */}
            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <h2 className="mb-3 font-display text-lg font-bold">Your resume</h2>
              <div className="flex flex-wrap items-center gap-3">
                <label className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-inset-btn hover:bg-primary/90 ${busy ? "pointer-events-none opacity-60" : ""}`}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {p.resume_path ? "Replace resume" : "Upload resume (PDF/Word)"}
                  <input type="file" accept=".pdf,.docx" className="sr-only" onChange={(e) => uploadResume(e.target.files?.[0] || null)} />
                </label>
                {p.resume_path && (
                  <Button variant="outline" onClick={viewResume}><FileText className="mr-1.5 h-4 w-4" /> View uploaded resume</Button>
                )}
              </div>
            </section>

            {/* Details */}
            <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:p-6">
              <h2 className="font-display text-lg font-bold">About you & what you want</h2>
              <Field label="Full name"><Input value={p.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
              <Field label="Headline" hint="e.g. Cloud Engineer · AWS · 3 yrs"><Input value={p.headline || ""} onChange={(e) => set("headline", e.target.value)} placeholder="One line about you" /></Field>
              <Field label="Target roles" hint="comma separated"><Input value={p.roles} onChange={(e) => set("roles", e.target.value)} placeholder="Cloud Engineer, DevOps Engineer, SRE" /></Field>
              <Field label="Work area / field"><Input value={p.work_area || ""} onChange={(e) => set("work_area", e.target.value)} placeholder="Cloud, Data, Frontend, ML…" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Seniority">
                  <Select value={p.seniority || ""} onValueChange={(v) => set("seniority", v)}>
                    <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intern">Internship</SelectItem>
                      <SelectItem value="entry">Entry level</SelectItem>
                      <SelectItem value="mid">Mid level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Work mode">
                  <Select value={p.work_mode || ""} onValueChange={(v) => set("work_mode", v)}>
                    <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On site</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Preferred locations" hint="comma separated"><Input value={p.locations || ""} onChange={(e) => set("locations", e.target.value)} placeholder="Bengaluru, Remote, Pune" /></Field>
              <Field label="Target companies" hint="wishlist, comma separated"><Input value={p.target_companies || ""} onChange={(e) => set("target_companies", e.target.value)} placeholder="Stripe, Postman, PhonePe" /></Field>
              <Field label="Anything else" hint="visa needs, notice period, preferences"><Textarea rows={3} value={p.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="shadow-inset-btn" onClick={save} disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save profile"}
              </Button>
              <Button size="lg" variant="outline" asChild><Link to="/jobs">Find matching jobs</Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/jobs/applications">My applications</Link></Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium">
      {label} {hint && <span className="text-muted-foreground">({hint})</span>}
    </label>
    {children}
  </div>
);

export default JobSeekerProfile;
