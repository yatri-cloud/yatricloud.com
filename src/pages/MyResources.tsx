import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, BookMarked } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listMyResources, type MyResource } from "@/lib/resources-api";
import { getStoredUser } from "@/lib/yatris-api";
import { getProviderMeta } from "@/lib/exam-dumps";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.25 },
  }),
};

export default function MyResources() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam === "dumps" ? "dumps" : tabParam === "resources" ? "resources" : "all";

  const user = getStoredUser();
  const [resources, setResources] = useState<MyResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "dumps" | "resources">(initialTab);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    listMyResources()
      .then(setResources)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDump = (r: MyResource) =>
    r.accessUrl.startsWith("/examdumps/practice") ||
    r.category?.toLowerCase().includes("dump") ||
    r.name.toLowerCase().includes("redis") ||
    r.name.toLowerCase().includes("exam");

  const dumpCount = useMemo(() => resources.filter(isDump).length, [resources]);
  const resourceCount = useMemo(() => resources.filter((r) => !isDump(r)).length, [resources]);

  const filteredResources = useMemo(() => {
    if (activeTab === "dumps") return resources.filter(isDump);
    if (activeTab === "resources") return resources.filter((r) => !isDump(r));
    return resources;
  }, [resources, activeTab]);

  const handleTabChange = (tab: "all" | "dumps" | "resources") => {
    setActiveTab(tab);
    setSearchParams(tab === "all" ? {} : { tab });
  };

  const getLogo = (r: MyResource) => {
    if (r.imageUrl) return r.imageUrl;
    if (r.provider) {
      const meta = getProviderMeta(r.provider);
      if (meta.logoUrl) return meta.logoUrl;
    }
    if (r.name.toLowerCase().includes("redis")) return "/logos/redis.svg";
    return null;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO title="My Resources | Yatri Cloud" description="Your unlocked learning resources and exam dumps." />
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="container mx-auto max-w-lg px-4 py-20 text-center">
            <h1 className="mb-2 text-2xl font-bold font-display">Sign in to see your resources</h1>
            <p className="mb-6 text-sm text-muted-foreground">Your unlocked materials live here once you sign in.</p>
            <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground font-semibold shadow-inset-btn">
              Go to home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="My Resources | Yatri Cloud" description="Your unlocked learning resources and exam dumps." />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Minimal Header */}
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-border/80">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                My Learning Materials
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-xl font-semibold text-xs border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition">
                <Link to="/examdumps">
                  Browse Dumps
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl font-semibold text-xs border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition">
                <Link to="/resources">
                  Browse Resources
                </Link>
              </Button>
            </div>
          </div>

          {/* Clean Segment Tabs */}
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => handleTabChange("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              All ({resources.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("dumps")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                activeTab === "dumps"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Exam Dumps ({dumpCount})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("resources")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                activeTab === "resources"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Study Guides ({resourceCount})
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Loading materials…</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-border rounded-2xl bg-card text-center p-8">
              <h2 className="font-display text-base font-semibold">
                {activeTab === "dumps"
                  ? "No exam dumps unlocked yet"
                  : activeTab === "resources"
                  ? "No study guides unlocked yet"
                  : "No materials yet"}
              </h2>
              <Button asChild className="mt-4 min-h-[40px] rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 text-xs font-semibold">
                <Link to={activeTab === "dumps" ? "/examdumps" : "/resources"}>
                  {activeTab === "dumps" ? "Explore Exam Dumps" : "Explore Resources"}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredResources.map((r, i) => {
                const logo = getLogo(r);
                return (
                  <motion.div
                    key={r.id}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                  >
                    <Card className="overflow-hidden border border-border/80 rounded-2xl bg-card hover:border-primary/40 transition shadow-xs">
                      <CardContent className="p-4 md:p-5">
                        <div className="flex items-center justify-between gap-4">
                          {/* Logo & Name */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="h-12 w-12 rounded-xl border border-border/60 bg-muted/30 p-2 shrink-0 flex items-center justify-center">
                              {logo ? (
                                <img src={logo} alt={r.name} className="h-full w-full object-contain" />
                              ) : (
                                <BookMarked className="h-5 w-5 text-muted-foreground/60" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm md:text-base text-foreground truncate">
                                {r.name}
                              </h3>
                            </div>
                          </div>

                          {/* Minimal Action Buttons */}
                          {/* Single Access Button */}
                          <div className="shrink-0">
                            {isDump(r) ? (
                              <Button
                                asChild
                                size="sm"
                                className="rounded-xl min-h-[38px] px-5 text-xs font-semibold bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600"
                              >
                                <Link to={r.accessUrl.startsWith("/examdumps/practice") ? r.accessUrl : "/examdumps/practice/redis-certified-developer"}>
                                  Access
                                </Link>
                              </Button>
                            ) : r.accessUrl?.startsWith("http") ? (
                              <a
                                href={r.accessUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  size="sm"
                                  className="rounded-xl min-h-[38px] px-5 text-xs font-semibold bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600"
                                >
                                  Access
                                </Button>
                              </a>
                            ) : (
                              <Button
                                asChild
                                size="sm"
                                className="rounded-xl min-h-[38px] px-5 text-xs font-semibold bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600"
                              >
                                <Link to={r.accessUrl || "/resources"}>
                                  Access
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
