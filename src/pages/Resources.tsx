import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { LoginModal } from "@/components/LoginModal";
import {
  listResources,
  unlockResource,
  listMyResources,
  type Resource,
} from "@/lib/resources-api";
import { getStoredUser, isAuthenticated } from "@/lib/yatris-api";
import { getCachedUser } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";
import { ListPager } from "@/components/ui/list-pager";
import { useSearchTracker } from "@/hooks/usePageTracker";

const PAGE_SIZE = 12;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function Resources() {
  const navigate = useNavigate();
  const trackSearch = useSearchTracker("Resource");
  const [searchParams, setSearchParams] = useSearchParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(getStoredUser());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingResource, setPendingResource] = useState<Resource | null>(null);
  const handledPendingRef = useRef(false);

  // Filters
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [freeFilter, setFreeFilter] = useState<"all" | "free" | "paid">("all");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, providerFilter, categoryFilter, freeFilter]);

  // Keep user in sync if changed in another tab or component
  useEffect(() => {
    const checkUser = () => {
      if (isAuthenticated()) {
        setUser(getStoredUser());
      } else {
        setUser(null);
      }
    };
    const interval = setInterval(checkUser, 1500);
    return () => clearInterval(interval);
  }, []);

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
  }, [user?.email]);

  const handleAccess = async (resource: Resource) => {
    // If already unlocked, open directly
    if (unlockedIds.has(resource.id)) {
      // Re-fetch access url from my-resources
      const mine = await listMyResources().catch(() => []);
      const found = mine.find((m) => m.resourceId === resource.id);
      if (found?.accessUrl) {
        trackEvent("download", "Resource", resource.id, { name: resource.name, provider: resource.provider });
        window.open(found.accessUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (!user) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pending_access_resource_id", resource.id);
      }
      setPendingResource(resource);
      setShowLoginModal(true);
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
      trackEvent("download", "Resource", resource.id, { name: resource.name, provider: resource.provider });
      toast.success("Access granted! Opening material…");
      window.open(accessUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to access resource");
    } finally {
      setUnlockingId(null);
    }
  };

  // Auto-access resource if redirected from login with pending access param
  useEffect(() => {
    const pendingId = searchParams.get("accessResource") || (typeof window !== "undefined" ? sessionStorage.getItem("pending_access_resource_id") : null);
    if (pendingId && user && !isLoading && resources.length > 0 && !handledPendingRef.current) {
      const target = resources.find((r) => r.id === pendingId);
      if (target) {
        handledPendingRef.current = true;
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("pending_access_resource_id");
        }
        if (searchParams.has("accessResource")) {
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("accessResource");
          setSearchParams(newParams, { replace: true });
        }
        handleAccess(target);
      }
    }
  }, [user, isLoading, resources, searchParams]);

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

  const handleLoginSuccess = async (loggedInUser: any) => {
    setUser(loggedInUser);
    setShowLoginModal(false);
    toast.success(`Welcome, ${loggedInUser.fullName || "Yatri"}!`);

    try {
      const mine = await listMyResources();
      setUnlockedIds(new Set(mine.map((m) => m.resourceId)));

      if (pendingResource) {
        const found = mine.find((m) => m.resourceId === pendingResource.id);
        if (found?.accessUrl) {
          window.open(found.accessUrl, "_blank", "noopener,noreferrer");
        } else if (pendingResource.isFree) {
          setUnlockingId(pendingResource.id);
          const accessUrl = await unlockResource(
            { id: pendingResource.id, name: pendingResource.name, description: pendingResource.description, provider: pendingResource.provider },
            loggedInUser.email,
            loggedInUser.fullName || "Yatri",
          );
          setUnlockedIds((prev) => new Set([...prev, pendingResource.id]));
          trackEvent("download", "Resource", pendingResource.id, { name: pendingResource.name, provider: pendingResource.provider });
          toast.success("Access granted! Opening material…");
          window.open(accessUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to access resource");
    } finally {
      setUnlockingId(null);
      setPendingResource(null);
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  trackSearch(e.target.value);
                }}
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
                  <ListPager page={page} pageCount={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingResource(null);
        }}
        onSuccess={handleLoginSuccess}
      />

      <Footer />
    </div>
  );
}
