import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, BookMarked, ExternalLink, ArrowRight, Calendar, FileText, Sparkles } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listMyResources, type MyResource } from "@/lib/resources-api";
import { getStoredUser } from "@/lib/yatris-api";
import { format } from "date-fns";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function MyResources() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "dumps" ? "dumps" : searchParams.get("tab") === "resources" ? "resources" : "all";

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO title="My Resources | Yatri Cloud" description="Your unlocked learning resources and exam dumps." />
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="container mx-auto max-w-lg px-4 py-20 text-center">
            <BookMarked className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="mb-2 text-2xl font-bold">Sign in to see your resources</h1>
            <p className="mb-6 text-muted-foreground">Your unlocked materials live here once you sign in.</p>
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
      <SEO title="My Resources & Exam Dumps | Yatri Cloud" description="Your unlocked learning resources and exam dumps." />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                My Learning Library
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Access your unlocked exam dumps, practice simulators, and study resources.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="rounded-xl min-h-[40px] text-xs font-semibold">
                <Link to="/examdumps">
                  Browse Dumps
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl min-h-[40px] text-xs font-semibold">
                <Link to="/resources">
                  Browse Resources
                </Link>
              </Button>
            </div>
          </div>

          {/* Separation Tabs */}
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border/70">
            <button
              type="button"
              onClick={() => handleTabChange("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              All Items ({resources.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("dumps")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === "dumps"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Exam Dumps & Practice ({dumpCount})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("resources")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === "resources"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Study Guides & PDFs ({resourceCount})
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading your materials…</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-border rounded-2xl bg-card text-center p-8">
              <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {activeTab === "dumps"
                  ? "No exam dumps unlocked yet"
                  : activeTab === "resources"
                  ? "No study resources unlocked yet"
                  : "No materials yet"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {activeTab === "dumps"
                  ? "Browse verified exam question dumps to start practicing with our interactive engine."
                  : "Browse our curated study guides, cheat sheets, and blueprints."}
              </p>
              <Button asChild className="mt-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 font-semibold">
                <Link to={activeTab === "dumps" ? "/examdumps" : "/resources"}>
                  {activeTab === "dumps" ? "Explore Exam Dumps" : "Explore Resources"}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredResources.map((r, i) => (
                <motion.div
                  key={r.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                >
                  <Card className="overflow-hidden border border-border/80 rounded-2xl bg-card hover:border-primary/40 transition">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                          {r.imageUrl ? (
                            <img src={r.imageUrl} alt={r.name} className="h-full w-full object-cover" />
                          ) : (
                            <BookMarked className="h-6 w-6 text-muted-foreground/40" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold truncate">{r.name}</h3>
                            {r.provider && (
                              <Badge className="rounded-full bg-primary/10 text-primary text-xs font-semibold border-transparent">
                                {r.provider}
                              </Badge>
                            )}
                            {isDump(r) ? (
                              <Badge className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium border-transparent">
                                Exam Dump
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-full text-xs font-medium">
                                Study Guide
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              Unlocked {format(new Date(r.accessedAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons (Practice Online vs Cloud Link) */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          {isDump(r) && (
                            <Button
                              asChild
                              size="sm"
                              className="rounded-xl min-h-[40px] font-semibold bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 shrink-0"
                            >
                              <Link to={r.accessUrl.startsWith("/examdumps/practice") ? r.accessUrl : "/examdumps/practice/redis-certified-developer"}>
                                Practice Online
                              </Link>
                            </Button>
                          )}

                          {r.accessUrl && (r.accessUrl.startsWith("http://") || r.accessUrl.startsWith("https://")) && (
                            <a
                              href={r.accessUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl min-h-[40px] font-medium border-border hover:bg-muted transition gap-1.5"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Cloud Link
                              </Button>
                            </a>
                          )}

                          {!isDump(r) && r.accessUrl && !r.accessUrl.startsWith("http") && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="rounded-xl min-h-[40px] font-medium border-border hover:bg-muted transition"
                            >
                              <Link to={r.accessUrl}>
                                Open
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
