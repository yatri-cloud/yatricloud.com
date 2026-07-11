import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Download, Trash2, Mail, Upload, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import { uploadResumeSource, resumeDownloadUrl } from "@/lib/resume-api";
import {
  getJobProfile,
  saveJobProfile,
  listApplications,
  removeApplication,
  buildSelected,
  applicationMailto,
  type JobProfile,
  type ApplicationRow,
} from "@/lib/job-apply-api";

/**
 * My applications — the tabular phase-3 dashboard: your job profile (one
 * resume + target roles), every job you selected on /jobs, one tailored
 * resume per job built by the Mac worker, downloads and a per-company
 * email draft. In-app OAuth sending is phase 4.
 */

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  queued: { label: "Queued", cls: "bg-brand-50 text-primary border-brand-100" },
  processing: { label: "Building", cls: "bg-brand-50 text-primary border-brand-100" },
  ready: { label: "Ready", cls: "bg-success/10 text-success border-success/20" },
  failed: { label: "Failed", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

const JobApplications = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [roles, setRoles] = useState("");
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [p, a] = await Promise.all([getJobProfile(), listApplications()]);
    setProfile(p);
    setRoles(p?.roles || "");
    setApps(a);
    setLoaded(true);
  };
  useEffect(() => {
    if (user) refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const building = apps.some((a) =>
    ["queued", "processing"].includes(a.resume_requests?.status || "")
  );
  useEffect(() => {
    if (!building) return;
    const t = window.setInterval(refresh, 7000);
    return () => window.clearInterval(t);
  }, [building]); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadProfileResume = async (file: File | null) => {
    if (!file || !user) return;
    setBusy(true);
    const up = await uploadResumeSource(file);
    setBusy(false);
    if ("error" in up) {
      toast.error("The file did not upload.");
      return;
    }
    const p: JobProfile = {
      full_name: user.fullName || "",
      resume_path: up.path,
      roles,
    };
    if (await saveJobProfile(p)) {
      setProfile(p);
      toast.success("Profile resume saved.");
    }
  };

  const saveRoles = async () => {
    if (!profile) return;
    if (await saveJobProfile({ ...profile, roles })) toast.success("Roles saved.");
  };

  const build = async () => {
    if (!profile?.resume_path) {
      toast.error("Upload your profile resume first.");
      return;
    }
    setBusy(true);
    const n = await buildSelected(profile);
    setBusy(false);
    if (n === 0) {
      toast.error("Nothing new to build. Select jobs on the board first.");
      return;
    }
    toast.success(`Building ${n} tailored ${n === 1 ? "resume" : "resumes"}. Watch the table.`);
    refresh();
  };

  const download = async (path: string | null | undefined) => {
    if (!path) return;
    const url = await resumeDownloadUrl(path);
    if (url) window.open(url, "_blank", "noopener");
  };

  const pendingCount = apps.filter((a) => !a.resume_request_id).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="My Job Applications · Tailored Resumes | Yatri Cloud"
        description="Your selected openings, one tailored resume per job, and application email drafts in one dashboard."
        noindex
      />
      <div className="noise-overlay" />
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 pb-20 pt-28 md:px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
              My <span className="gradient-text">applications</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              One tailored resume per selected job, ready to send.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/jobs">Browse the job board</Link>
          </Button>
        </div>

        {!user ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">Sign in to build your application pipeline.</p>
            <Button asChild className="mt-4 shadow-inset-btn">
              <Link to="/certifiedyatris">Sign in</Link>
            </Button>
          </div>
        ) : !loaded ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" /> Loading…
          </div>
        ) : (
          <>
            {/* Job profile */}
            <div className="mb-8 grid gap-3 rounded-2xl border border-brand-100 bg-gradient-to-br from-primary/[0.06] via-brand-50/40 to-card p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <label className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 font-medium transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-primary ${busy ? "pointer-events-none opacity-60" : ""}`}>
                <Upload className="h-4 w-4" aria-hidden="true" />
                {profile?.resume_path ? "Replace profile resume" : "Upload profile resume"}
                <input type="file" accept=".pdf,.docx" className="sr-only" onChange={(e) => uploadProfileResume(e.target.files?.[0] || null)} />
              </label>
              <Input
                value={roles}
                onChange={(e) => setRoles(e.target.value)}
                onBlur={saveRoles}
                placeholder="Target roles, comma separated (Cloud Engineer, DevOps Engineer…)"
                aria-label="Target roles"
              />
              <Button onClick={build} disabled={busy || pendingCount === 0} className="shadow-inset-btn">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Build {pendingCount > 0 ? `${Math.min(pendingCount, 10)} ` : ""}tailored {pendingCount === 1 ? "resume" : "resumes"}
              </Button>
            </div>

            {/* Applications table */}
            {apps.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                Nothing selected yet. Tick jobs on the board and they land here.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-brand-50/60 text-left">
                        <th className="px-4 py-3 font-semibold">Role</th>
                        <th className="px-4 py-3 font-semibold">Company</th>
                        <th className="px-4 py-3 font-semibold">Resume</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apps.map((a) => {
                        const st = a.resume_requests?.status;
                        const meta = st ? STATUS_LABEL[st] : null;
                        const mailto = profile ? applicationMailto(a, profile) : null;
                        return (
                          <tr key={a.id} className="border-b border-border/60 last:border-0 hover:bg-brand-50/30">
                            <td className="max-w-[280px] px-4 py-3">
                              <p className="truncate font-semibold">{a.job_postings?.title}</p>
                              <p className="truncate text-xs text-muted-foreground">{a.job_postings?.location}</p>
                            </td>
                            <td className="px-4 py-3">{a.job_postings?.job_companies?.name}</td>
                            <td className="px-4 py-3">
                              {meta ? (
                                <Badge variant="outline" className={meta.cls}>
                                  {(st === "queued" || st === "processing") && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                  {meta.label}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not built yet</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {mailto ? (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={mailto}>
                                    <Mail className="mr-1.5 h-3.5 w-3.5" /> Draft email
                                  </a>
                                </Button>
                              ) : (
                                <a
                                  href={a.job_postings?.apply_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                  Apply on site <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {st === "ready" && (
                                  <>
                                    <Button variant="outline" size="sm" className="h-8" onClick={() => download(a.resume_requests?.docx_path)}>
                                      <Download className="mr-1 h-3.5 w-3.5" /> Word
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8" onClick={() => download(a.resume_requests?.pdf_path)}>
                                      <Download className="mr-1 h-3.5 w-3.5" /> PDF
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Remove this application"
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  onClick={async () => {
                                    if (await removeApplication(a.id)) refresh();
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default JobApplications;
