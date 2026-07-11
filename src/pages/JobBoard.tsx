import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, MapPin, Building2, ExternalLink, BriefcaseBusiness, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListPager } from "@/components/ui/list-pager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import { uploadResumeSource } from "@/lib/resume-api";
import {
  createJobMatch,
  deleteJobMatch,
  latestJobMatch,
  type JobMatchRequest,
} from "@/lib/job-match-api";
import { selectedJobIds, toggleJobSelection } from "@/lib/job-apply-api";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Job board — postings ingested from companies' OFFICIAL ATS APIs
 * (Greenhouse/Lever) by scripts/jobs-sync.mjs. Filtering happens server
 * side: with thousands of rows the client never downloads the full set,
 * and descriptions load only when a job is opened.
 */

const PAGE_SIZE = 20;

interface JobRow {
  id: string;
  title: string;
  location: string;
  level: string;
  department: string;
  remote: boolean;
  apply_url: string;
  posted_at: string | null;
  job_companies: { name: string; website: string | null } | null;
}

interface CompanyOpt {
  id: string;
  name: string;
  jobs_count: number;
}

/** Auto company logo from the website's favicon (no manual uploads). */
const CompanyLogo = ({ name, website }: { name: string; website: string | null }) => {
  const [failed, setFailed] = useState(false);
  let host = "";
  try {
    host = website ? new URL(website).hostname : "";
  } catch {
    host = "";
  }
  if (!host || failed) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-brand-50 text-sm font-bold text-primary">
        {name.slice(0, 1)}
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-1.5">
      <img
        src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
        alt=""
        width={28}
        height={28}
        loading="lazy"
        className="h-7 w-7 object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
};

const LEVEL_LABEL: Record<string, string> = {
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior",
};

const JobBoard = () => {
  const [companies, setCompanies] = useState<CompanyOpt[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [company, setCompany] = useState("all");
  const [level, setLevel] = useState("all");
  const [workMode, setWorkMode] = useState("all");
  const [locationQ, setLocationQ] = useState("");
  const [debouncedLoc, setDebouncedLoc] = useState("");
  const [page, setPage] = useState(1);

  // ——— resume matching (built by the Mac worker) ———
  const user = useMemo(() => getStoredUser(), []);
  const [match, setMatch] = useState<JobMatchRequest | null>(null);
  const [matchBusy, setMatchBusy] = useState(false);
  const [matchMode, setMatchMode] = useState(false);
  const matchIds = useMemo(() => match?.result?.job_ids || [], [match]);

  useEffect(() => {
    if (!user) return;
    latestJobMatch().then(setMatch);
  }, [user]);
  useEffect(() => {
    if (!match || (match.status !== "queued" && match.status !== "processing")) return;
    const t = window.setInterval(() => latestJobMatch().then(setMatch), 6000);
    return () => window.clearInterval(t);
  }, [match]);

  const startMatch = async (file: File | null) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      toast.error("Upload a PDF or Word (.docx) resume.");
      return;
    }
    setMatchBusy(true);
    const uploaded = await uploadResumeSource(file);
    if ("error" in uploaded) {
      setMatchBusy(false);
      toast.error("The file did not upload. Please try again.");
      return;
    }
    const created = await createJobMatch(uploaded.path);
    setMatchBusy(false);
    if ("error" in created) {
      toast.error("Could not start matching. Please try again.");
      return;
    }
    toast.success("Reading your resume. Matches appear here in a minute or two.");
    latestJobMatch().then(setMatch);
  };

  const clearMatch = async () => {
    if (match) await deleteJobMatch(match.id);
    setMatch(null);
    setMatchMode(false);
  };

  // ——— selections feeding /jobs/applications (phase 3) ———
  const [picks, setPicks] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (user) selectedJobIds().then(setPicks);
  }, [user]);
  const togglePick = async (jobId: string) => {
    const on = !picks.has(jobId);
    setPicks((prev) => {
      const next = new Set(prev);
      if (on) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
    const ok = await toggleJobSelection(jobId, on);
    if (!ok) {
      toast.error(on ? "Could not select that job." : "Already built — remove it from My applications.");
      selectedJobIds().then(setPicks);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedLoc(locationQ.trim()), 350);
    return () => window.clearTimeout(t);
  }, [locationQ]);
  useEffect(() => {
    setPage(1);
  }, [debounced, company, level, workMode, debouncedLoc, matchMode]);

  useEffect(() => {
    supabase
      .from("job_companies")
      .select("id, name, jobs_count")
      .eq("active", true)
      .gt("jobs_count", 0)
      .order("name")
      .then(({ data }) => setCompanies((data as CompanyOpt[]) || []));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      let q = supabase
        .from("job_postings")
        .select(
          "id, title, location, level, department, remote, apply_url, posted_at, job_companies(name, website)",
          { count: "exact" }
        )
        .eq("is_active", true);
      if (matchMode && matchIds.length) q = q.in("id", matchIds);
      if (company !== "all") q = q.eq("company_id", company);
      if (level !== "all") q = q.eq("level", level);
      if (workMode === "remote") q = q.eq("remote", true);
      if (workMode === "onsite") q = q.eq("remote", false);
      if (debounced) q = q.ilike("title", `%${debounced}%`);
      if (debouncedLoc) q = q.ilike("location", `%${debouncedLoc}%`);
      const from = (page - 1) * PAGE_SIZE;
      const { data, count, error } = await q
        .order("posted_at", { ascending: false, nullsFirst: false })
        .range(from, from + PAGE_SIZE - 1);
      if (cancelled) return;
      if (!error) {
        setJobs((data as unknown as JobRow[]) || []);
        setTotal(count || 0);
      }
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, company, level, workMode, debouncedLoc, page, matchMode, matchIds]);

  // Detail dialog — description fetched on open only
  const [detail, setDetail] = useState<JobRow | null>(null);
  const [detailDesc, setDetailDesc] = useState<string>("");
  const openDetail = async (job: JobRow) => {
    setDetail(job);
    setDetailDesc("");
    const { data } = await supabase
      .from("job_postings")
      .select("description")
      .eq("id", job.id)
      .single();
    setDetailDesc((data as { description: string } | null)?.description || "");
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const totalLabel = useMemo(() => total.toLocaleString("en-IN"), [total]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Job Board · Cloud & Tech Openings | Yatri Cloud"
        description="Live openings from top tech companies and startups, pulled straight from their official career boards. Filter by company, level, location and remote."
      />
      <div className="noise-overlay" />
      <Navbar />

      <main className="pb-20">
        <section className="relative overflow-hidden pt-28 pb-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.02em] mb-4">
              Your next role is <span className="gradient-text">already posted</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {totalLabel} live openings, pulled straight from official company
              career boards and job feeds. No stale listings, no logins.
            </p>
          </div>
        </section>

        {/* Match panel — upload a resume, the worker shortlists real jobs */}
        <section className="container mx-auto max-w-5xl px-4 pb-8 md:px-6">
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-primary/[0.06] via-brand-50/40 to-card p-5 md:p-6">
            {!user ? (
              <p className="text-center text-sm text-muted-foreground">
                <a href="/certifiedyatris" className="font-semibold text-primary hover:underline">
                  Sign in
                </a>{" "}
                and upload your resume. We shortlist the openings that fit you.
              </p>
            ) : !match || match.status === "failed" ? (
              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                <div>
                  <p className="font-display text-lg font-bold">Let your resume pick the jobs</p>
                  <p className="text-sm text-muted-foreground">
                    Upload it once. We read it and shortlist matching openings from this board.
                    {match?.status === "failed" && " Last try failed, go again."}
                  </p>
                </div>
                <label className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-inset-btn transition-colors hover:bg-primary/90 ${matchBusy ? "pointer-events-none opacity-60" : ""}`}>
                  {matchBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
                  {matchBusy ? "Uploading…" : "Upload resume"}
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    className="sr-only"
                    onChange={(e) => startMatch(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            ) : match.status !== "ready" ? (
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Reading your resume and shortlisting openings… this takes a minute or two.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                <div>
                  <p className="font-display text-lg font-bold">
                    {matchIds.length} openings match your resume
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {match.result?.summary}{" "}
                    {match.result?.roles?.length ? `Target roles: ${match.result.roles.join(", ")}.` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    className={matchMode ? "" : "shadow-inset-btn"}
                    variant={matchMode ? "outline" : "default"}
                    onClick={() => setMatchMode((v) => !v)}
                    disabled={matchIds.length === 0}
                  >
                    {matchMode ? "Show all jobs" : "Show my matches"}
                  </Button>
                  <button
                    type="button"
                    onClick={clearMatch}
                    className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            {user && picks.size > 0 && (
              <p className="mt-3 border-t border-border/60 pt-3 text-center text-sm">
                <span className="font-semibold text-primary">{picks.size}</span>{" "}
                {picks.size === 1 ? "job" : "jobs"} selected ·{" "}
                <Link to="/jobs/applications" className="font-semibold text-primary hover:underline">
                  Build tailored resumes →
                </Link>
              </p>
            )}
          </div>
        </section>

        {/* Filters */}
        <section className="sticky top-16 z-40 border-b border-border/50 bg-background/95 shadow-sm backdrop-blur-xl">
          <div className="container mx-auto flex flex-col gap-2 px-4 py-3 md:px-6 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job titles"
                aria-label="Search job titles"
                className="h-10 rounded-full pl-9"
              />
            </div>
            <div className="relative w-full lg:max-w-[200px]">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={locationQ}
                onChange={(e) => setLocationQ(e.target.value)}
                placeholder="Location"
                aria-label="Filter by location"
                className="h-10 rounded-full pl-9"
              />
            </div>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger className="h-10 w-full rounded-full lg:w-[190px]" aria-label="Filter by company">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.jobs_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="h-10 w-full rounded-full lg:w-[150px]" aria-label="Filter by level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="entry">Entry level</SelectItem>
                <SelectItem value="mid">Mid level</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
            <Select value={workMode} onValueChange={setWorkMode}>
              <SelectTrigger className="h-10 w-full rounded-full lg:w-[140px]" aria-label="Filter by work mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any mode</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="onsite">On site</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Results */}
        <section className="container mx-auto max-w-5xl px-4 pt-8 md:px-6">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
              Finding openings…
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-20 text-center">
              <BriefcaseBusiness className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="font-display text-2xl font-bold">No openings match</h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Loosen a filter or two. New roles land every sync.
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    className="group rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 md:p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        {user && (
                          <Checkbox
                            checked={picks.has(job.id)}
                            onCheckedChange={() => togglePick(job.id)}
                            aria-label={`Select ${job.title} for applications`}
                            className="shrink-0"
                          />
                        )}
                        <CompanyLogo
                          name={job.job_companies?.name || "?"}
                          website={job.job_companies?.website || null}
                        />
                        <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openDetail(job)}
                          className="rounded text-left font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {job.title}
                        </button>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {job.job_companies?.name || ""}
                          </span>
                          {job.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="truncate max-w-[280px]">{job.location}</span>
                            </span>
                          )}
                        </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="outline" className="border-brand-100 bg-brand-50 text-primary">
                          {LEVEL_LABEL[job.level] || job.level}
                        </Badge>
                        {job.remote && <Badge variant="secondary">Remote</Badge>}
                        <Button variant="outline" size="sm" onClick={() => openDetail(job)}>
                          Details
                        </Button>
                        <Button size="sm" asChild className="shadow-inset-btn">
                          <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                            Apply <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <ListPager page={currentPage} pageCount={pageCount} onPageChange={setPage} />
            </>
          )}
        </section>
      </main>

      {/* Job detail */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8 text-xl">{detail?.title}</DialogTitle>
            <DialogDescription>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{detail?.job_companies?.name}</span>
                {detail?.location && <span>· {detail.location}</span>}
                {detail && <span>· {LEVEL_LABEL[detail.level] || detail.level}</span>}
              </span>
            </DialogDescription>
          </DialogHeader>
          {detailDesc === "" ? (
            <div className="py-10 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
              Loading description…
            </div>
          ) : (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {detailDesc}
            </p>
          )}
          {detail && (
            <Button asChild size="lg" className="w-full font-semibold shadow-inset-btn">
              <a href={detail.apply_url} target="_blank" rel="noopener noreferrer">
                Apply at {detail.job_companies?.name}
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default JobBoard;
