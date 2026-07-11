import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Download, Trash2, Mail, Upload, ExternalLink, Send, Sparkle, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import { uploadResumeSource, resumeDownloadUrl } from "@/lib/resume-api";
import { latestJobMatch, type JobMatchRequest } from "@/lib/job-match-api";
import {
  getJobProfile,
  saveJobProfile,
  listApplications,
  removeApplication,
  buildSelected,
  draftEmailsForSelected,
  saveEmailDraft,
  markEmailSent,
  gmailComposeUrl,
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

  const [aiMatch, setAiMatch] = useState<JobMatchRequest | null>(null);
  const refresh = async () => {
    const [p, a, m] = await Promise.all([getJobProfile(), listApplications(), latestJobMatch()]);
    setProfile(p);
    setRoles(p?.roles || "");
    setApps(a);
    setAiMatch(m);
    setLoaded(true);
  };
  useEffect(() => {
    if (user) refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const building = apps.some(
    (a) =>
      ["queued", "processing"].includes(a.resume_requests?.status || "") ||
      a.email_status === "drafting"
  );
  useEffect(() => {
    if (!building) return;
    const t = window.setInterval(refresh, 7000);
    return () => window.clearInterval(t);
  }, [building]); // eslint-disable-line react-hooks/exhaustive-deps

  // Email drafting + preview/edit — works for every application
  const [draftable, drafted] = useMemo(() => {
    return [
      apps.filter((a) => a.email_status === "none").length,
      apps.filter((a) => a.email_status === "drafted" || a.email_status === "sent"),
    ];
  }, [apps]);
  const [preview, setPreview] = useState<ApplicationRow | null>(null);
  const [pTo, setPTo] = useState("");
  const [pSubject, setPSubject] = useState("");
  const [pBody, setPBody] = useState("");
  const openPreview = (a: ApplicationRow) => {
    setPreview(a);
    setPTo(a.email_to || a.job_postings?.job_companies?.contact_email || "");
    setPSubject(a.email_subject || "");
    setPBody(a.email_body || "");
  };

  const generateEmails = async () => {
    const n = await draftEmailsForSelected();
    if (n === 0) {
      toast.error("No new emails to draft. Select some jobs first.");
      return;
    }
    toast.success(`Drafting ${n} ${n === 1 ? "email" : "emails"}. They appear as you refresh.`);
    refresh();
  };

  const sendOne = async (a: ApplicationRow) => {
    if (!profile) return;
    const url = gmailComposeUrl(a, profile);
    if (!url) return;
    window.open(url, "_blank", "noopener");
    await markEmailSent(a.id);
    refresh();
  };

  const sendAll = async () => {
    if (!profile) return;
    const ready = drafted.filter((a) => a.email_status === "drafted");
    if (ready.length === 0) {
      toast.error("No drafted emails ready to send.");
      return;
    }
    // Open Gmail compose per email; browsers may ask to allow multiple tabs.
    ready.forEach((a, i) => {
      const url = gmailComposeUrl(a, profile);
      if (url) window.setTimeout(() => window.open(url, "_blank", "noopener"), i * 600);
    });
    for (const a of ready) await markEmailSent(a.id);
    toast.success(`Opened ${ready.length} Gmail drafts. Review and send each.`);
    refresh();
  };

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
            {/* Job profile — the user's full picture */}
            <div className="mb-8 rounded-2xl border border-brand-100 bg-gradient-to-br from-primary/[0.06] via-brand-50/40 to-card p-5 md:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {(profile?.full_name || user.fullName || "Y").slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold">{profile?.full_name || user.fullName || "Your profile"}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                    {profile?.resume_path ? " · Resume on file" : " · No resume yet"}
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
                  {profile?.resume_path && (
                    <Button variant="outline" size="sm" className="h-8" onClick={() => download(profile.resume_path)}>
                      <FileText className="mr-1 h-3.5 w-3.5" /> View resume
                    </Button>
                  )}
                  <Badge variant="outline" className="border-brand-100 bg-brand-50 text-primary">
                    {apps.length} selected
                  </Badge>
                  <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                    {apps.filter((a) => a.resume_requests?.status === "ready").length} resumes ready
                  </Badge>
                  <Badge variant="outline">{drafted.length} emails drafted</Badge>
                </div>
              </div>

              {/* What the AI read from the resume — the job-seeker snapshot */}
              {aiMatch?.status === "ready" && aiMatch.result && (
                <div className="mb-4 rounded-xl border border-border bg-background/60 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Your profile at a glance</p>
                  {aiMatch.result.summary && (
                    <p className="mb-3 text-sm text-muted-foreground">{aiMatch.result.summary}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {aiMatch.result.level && (
                      <Badge variant="secondary" className="capitalize">{aiMatch.result.level} level</Badge>
                    )}
                    {(aiMatch.result.roles || []).slice(0, 8).map((r) => (
                      <Badge key={r} variant="outline">{r}</Badge>
                    ))}
                  </div>
                  {(aiMatch.result.job_ids?.length || 0) > 0 && (
                    <p className="mt-3 text-sm">
                      <Link to="/jobs" className="font-semibold text-primary hover:underline">
                        {aiMatch.result.job_ids?.length} matching openings on the board →
                      </Link>
                    </p>
                  )}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <label className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 font-medium transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-primary ${busy ? "pointer-events-none opacity-60" : ""}`}>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {profile?.resume_path ? "Replace resume" : "Upload resume"}
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
            </div>

            {/* Outreach actions */}
            {apps.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <Button variant="outline" onClick={generateEmails} disabled={draftable === 0}>
                  <Sparkle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Draft {draftable > 0 ? `${draftable} ` : ""}application {draftable === 1 ? "email" : "emails"}
                </Button>
                <Button onClick={sendAll} disabled={!drafted.some((a) => a.email_status === "drafted")} className="shadow-inset-btn">
                  <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Open all in Gmail
                </Button>
                <p className="text-xs text-muted-foreground">
                  Emails open in your logged-in Gmail to review and send. Nothing is sent automatically.
                </p>
              </div>
            )}

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
                              {a.email_status === "drafting" ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-primary">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting…
                                </span>
                              ) : a.email_status === "drafted" || a.email_status === "sent" ? (
                                <div className="flex items-center gap-1.5">
                                  <Button variant="outline" size="sm" className="h-8" onClick={() => openPreview(a)}>
                                    <Mail className="mr-1 h-3.5 w-3.5" /> {a.email_status === "sent" ? "View" : "Preview"}
                                  </Button>
                                  {a.email_status === "sent" && <Badge variant="secondary">Sent</Badge>}
                                </div>
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

      {/* Email preview / edit */}
      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email to {preview?.job_postings?.job_companies?.name}</DialogTitle>
            <DialogDescription>
              Review and edit, then open it in Gmail to send. Your name signs off automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={pTo} onChange={(e) => setPTo(e.target.value)} placeholder="Recipient email (recruiter, referral or careers@…)" aria-label="Recipient email" type="email" />
            <Input value={pSubject} onChange={(e) => setPSubject(e.target.value)} placeholder="Subject" aria-label="Email subject" />
            <Textarea value={pBody} onChange={(e) => setPBody(e.target.value)} rows={10} aria-label="Email body" />
            <p className="text-xs text-muted-foreground">Signature: {profile?.full_name} · Sends from your logged-in Gmail.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                if (preview) {
                  await saveEmailDraft(preview.id, pSubject, pBody, pTo);
                  toast.success("Saved.");
                  refresh();
                  setPreview(null);
                }
              }}
            >
              Save draft
            </Button>
            <Button
              className="shadow-inset-btn"
              onClick={async () => {
                if (!preview) return;
                await saveEmailDraft(preview.id, pSubject, pBody, pTo);
                await sendOne({ ...preview, email_to: pTo, email_subject: pSubject, email_body: pBody });
                setPreview(null);
              }}
            >
              <Send className="mr-1.5 h-4 w-4" /> Open in Gmail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default JobApplications;
