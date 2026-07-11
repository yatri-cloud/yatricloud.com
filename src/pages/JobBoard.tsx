import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, MapPin, Building2, ExternalLink, BriefcaseBusiness } from "lucide-react";
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
  job_companies: { name: string } | null;
}

interface CompanyOpt {
  id: string;
  name: string;
  jobs_count: number;
}

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
  }, [debounced, company, level, workMode, debouncedLoc]);

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
          "id, title, location, level, department, remote, apply_url, posted_at, job_companies(name)",
          { count: "exact" }
        )
        .eq("is_active", true);
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
  }, [debounced, company, level, workMode, debouncedLoc, page]);

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
              {totalLabel} live openings, pulled straight from the official
              career boards of {companies.length} companies. No stale listings.
            </p>
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
