import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ResourceCard } from "@/components/resources/ResourceCard";
import {
  listResources,
  unlockResource,
  listMyResources,
  type Resource,
} from "@/lib/resources-api";
import { getStoredUser } from "@/lib/yatris-api";
import { ListPager } from "@/components/ui/list-pager";

const PAGE_SIZE = 9;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [freeFilter, setFreeFilter] = useState<"all" | "free" | "paid">("all");
  const [page, setPage] = useState(1);

  const user = getStoredUser();

  useEffect(() => { setPage(1); }, [search, providerFilter, categoryFilter, freeFilter]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [allRes, mine] = await Promise.all([
          listResources(),
          user ? listMyResources() : Promise.resolve([]),
        ]);
        setResources(allRes);
        setUnlockedIds(new Set(mine.map((m) => m.resourceId)));
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load resources");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const providers = useMemo(() => {
    const set = new Set(resources.map((r) => r.provider).filter(Boolean));
    return Array.from(set).sort();
  }, [resources]);

  const categories = useMemo(() => {
    const set = new Set(resources.map((r) => r.category).filter(Boolean));
    return Array.from(set).sort();
  }, [resources]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      if (providerFilter !== "all" && r.provider !== providerFilter) return false;
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (freeFilter === "free" && !r.isFree) return false;
      if (freeFilter === "paid" && r.isFree) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q) && !r.provider.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resources, search, providerFilter, categoryFilter, freeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAccess = async (resource: Resource) => {
    // If already unlocked, open directly
    if (unlockedIds.has(resource.id)) {
      // Re-fetch access url from my-resources
      const mine = await listMyResources().catch(() => []);
      const found = mine.find((m) => m.resourceId === resource.id);
      if (found?.accessUrl) window.open(found.accessUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!user) {
      toast.error("Sign in to access this resource.");
      return;
    }

    if (!resource.isFree) {
      toast.info("Paid resources — payment integration coming soon. Contact us to get access.");
      return;
    }

    setUnlockingId(resource.id);
    try {
      const accessUrl = await unlockResource(
        { id: resource.id, name: resource.name, description: resource.description, provider: resource.provider },
        user.email,
        user.fullName || "Yatri",
      );
      setUnlockedIds((prev) => new Set([...prev, resource.id]));
      toast.success("Access granted! Check your email too.");
      window.open(accessUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to access resource");
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Resources | Yatri Cloud"
        description="Free and premium exam guides, practice tests, cheat sheets and more curated for cloud and tech certification learners."
      />
      <Navbar />

      <main className="pt-20 pb-12">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/[0.05] via-background to-background py-5 md:py-7">
          <div aria-hidden="true" className="pointer-events-none absolute -top-16 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-center"
            >
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Study smarter, certify faster
              </h1>
              {!user && (
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-medium text-primary">Sign in</span> to unlock and access resources instantly.
                </p>
              )}
            </motion.div>
          </div>
        </section>

        {/* Filters + Grid */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-5 md:py-6">
          {/* Filter bar */}
          <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Input
                placeholder="Search resources…"
                className="min-h-[38px] h-9.5 rounded-lg text-xs sm:text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Certification Provider */}
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full sm:w-[170px] min-h-[38px] h-9.5 rounded-lg text-xs sm:text-sm">
                <SelectValue placeholder="All Certifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Certifications</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Resource Type */}
            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[160px] min-h-[38px] h-9.5 rounded-lg text-xs sm:text-sm">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Free / Paid */}
            <div className="flex gap-1.5">
              {(["all", "free", "paid"] as const).map((v) => (
                <Button
                  key={v}
                  variant={freeFilter === v ? "default" : "outline"}
                  onClick={() => setFreeFilter(v)}
                  className="min-h-[38px] h-9.5 rounded-lg capitalize text-xs px-3"
                  size="sm"
                >
                  {v === "all" ? "All" : v === "free" ? "Free" : "Paid"}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Loading resources…</p>
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-border rounded-xl bg-card text-center">
              <h2 className="font-display text-base font-semibold tracking-tight">No resources found</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {search || providerFilter !== "All" || categoryFilter !== "All" || freeFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Resources are being added, check back soon!"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {paged.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    isUnlocked={unlockedIds.has(r.id)}
                    onAccess={handleAccess}
                    isLoading={unlockingId === r.id}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <ListPager page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
