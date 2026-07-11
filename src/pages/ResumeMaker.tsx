import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, FileText, Download, Clock, CircleAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import {
  createResumeRequest,
  listMyResumeRequests,
  resumeDownloadUrl,
  type ResumeRequest,
} from "@/lib/resume-api";

/**
 * Resume maker — paste your current resume or notes (plus an optional job
 * description) and get a polished, ATS safe .docx + .pdf. Requests queue in
 * Supabase; a worker builds the files and this page flips to Ready.
 */

const STATUS_META: Record<ResumeRequest["status"], { label: string; cls: string }> = {
  queued: { label: "Queued", cls: "bg-brand-50 text-primary border-brand-100" },
  processing: { label: "Building", cls: "bg-brand-50 text-primary border-brand-100" },
  ready: { label: "Ready", cls: "bg-success/10 text-success border-success/20" },
  failed: { label: "Failed", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

const ResumeMaker = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [inputText, setInputText] = useState("");
  const [jdText, setJdText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<ResumeRequest[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    const rows = await listMyResumeRequests();
    setRequests(rows);
    setLoaded(true);
  };

  useEffect(() => {
    if (!user) return;
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll while anything is still in the oven.
  useEffect(() => {
    if (!user) return;
    if (!requests.some((r) => r.status === "queued" || r.status === "processing")) return;
    const t = window.setInterval(refresh, 6000);
    return () => window.clearInterval(t);
  }, [requests, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!user) return;
    if (!fullName.trim() || inputText.trim().length < 40) {
      toast.error("Add your name and paste your resume or notes first.");
      return;
    }
    setSubmitting(true);
    const result = await createResumeRequest({
      fullName: fullName.trim(),
      email: user.email || "",
      inputText: inputText.trim(),
      jdText: jdText.trim(),
    });
    setSubmitting(false);
    if ("error" in result) {
      toast.error("That did not save. Please try again.");
      return;
    }
    toast.success("In the queue. Your resume will be ready here shortly.");
    setInputText("");
    setJdText("");
    refresh();
  };

  const download = async (path: string | null) => {
    if (!path) return;
    const url = await resumeDownloadUrl(path);
    if (!url) {
      toast.error("Could not fetch the file. Try again in a moment.");
      return;
    }
    window.open(url, "_blank", "noopener");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Free Resume Maker · ATS Safe Word + PDF | Yatri Cloud"
        description="Paste your resume or notes and get a clean, ATS safe resume as matching Word and PDF files. Tailor it to a job description too."
        noindex={false}
      />
      <div className="noise-overlay" />
      <Navbar />

      <main className="pb-20">
        {/* Header band */}
        <section className="relative overflow-hidden pt-28 pb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.02em] mb-4">
              Your resume, <span className="gradient-text">recruiter ready</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Paste what you have. We turn it into a clean, ATS safe resume as
              matching Word and PDF files. Add a job description and we tailor
              it honestly.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-6">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_1fr]">
            {/* Request form */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {!user ? (
                <div className="py-10 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-primary" />
                  <h2 className="font-display text-2xl font-bold">Sign in to build your resume</h2>
                  <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
                    Your files stay private to your account, ready to download
                    any time.
                  </p>
                  <Button asChild className="mt-6 shadow-inset-btn">
                    <Link to="/certifiedyatris">Sign in</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="rm-name" className="mb-1.5 block text-sm font-medium">
                      Name on the resume
                    </label>
                    <Input
                      id="rm-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="rm-input" className="mb-1.5 block text-sm font-medium">
                      Your current resume or notes
                    </label>
                    <Textarea
                      id="rm-input"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={10}
                      placeholder="Paste your existing resume text, LinkedIn about section, or rough notes about your work, skills, projects and education."
                    />
                  </div>
                  <div>
                    <label htmlFor="rm-jd" className="mb-1.5 block text-sm font-medium">
                      Job description <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <Textarea
                      id="rm-jd"
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      rows={5}
                      placeholder="Paste the job post here and we tailor the resume to it."
                    />
                  </div>
                  <Button
                    size="lg"
                    className="w-full font-semibold shadow-inset-btn"
                    onClick={submit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      "Build my resume"
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Word and PDF land here and stay private to your account.
                  </p>
                </div>
              )}
            </div>

            {/* My requests */}
            {user && (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <h2 className="font-display text-xl font-bold">Your resumes</h2>
                {!loaded ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    Loading…
                  </div>
                ) : requests.length === 0 ? (
                  <div className="py-10 text-center">
                    <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Nothing here yet. Your first resume shows up right after
                      you submit.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {requests.map((r) => {
                      const meta = STATUS_META[r.status];
                      return (
                        <li
                          key={r.id}
                          className="rounded-xl border border-border bg-background p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{r.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(r.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline" className={meta.cls}>
                              {(r.status === "queued" || r.status === "processing") && (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              )}
                              {meta.label}
                            </Badge>
                          </div>
                          {r.status === "failed" && r.error && (
                            <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              {r.error}
                            </p>
                          )}
                          {r.status === "ready" && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => download(r.docx_path)}
                                disabled={!r.docx_path}
                              >
                                <Download className="mr-1.5 h-3.5 w-3.5" /> Word
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => download(r.pdf_path)}
                                disabled={!r.pdf_path}
                              >
                                <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                              </Button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ResumeMaker;
