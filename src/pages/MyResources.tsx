import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, BookMarked, ExternalLink, ArrowRight, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
};

export default function MyResources() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [resources, setResources] = useState<MyResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    listMyResources()
      .then(setResources)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO title="My Resources | Yatri Cloud" description="Your unlocked learning resources." />
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="container mx-auto max-w-lg px-4 py-20 text-center">
            <BookMarked className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="mb-2 text-2xl font-bold">Sign in to see your resources</h1>
            <p className="mb-6 text-muted-foreground">Your unlocked study materials live here once you sign in.</p>
            <Button onClick={() => navigate("/")}>Go to home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="My Resources | Yatri Cloud" description="Your unlocked learning resources on Yatri Cloud." />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                <BookMarked className="h-7 w-7 text-primary" />
                My Resources
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                All the resources you've unlocked — free and purchased.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-xl min-h-[44px]">
              <Link to="/resources">
                Browse more <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading your resources…</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border border-border rounded-2xl bg-card text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-4">
                <BookMarked className="h-6 w-6" />
              </div>
              <h2 className="font-display text-lg font-semibold tracking-tight">No resources yet</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Browse the resource library and unlock free materials or purchase premium ones.
              </p>
              <Button asChild className="mt-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600">
                <Link to="/resources">Browse resources</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {resources.map((r, i) => (
                <motion.div
                  key={r.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                >
                  <Card className="overflow-hidden border border-border rounded-2xl bg-card hover:border-brand-200 hover:shadow-card transition">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                          {r.imageUrl ? (
                            <img src={r.imageUrl} alt={r.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <BookMarked className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold truncate">{r.name}</h3>
                            {r.provider && (
                              <Badge className="rounded-full bg-primary text-white text-xs font-medium border-transparent hover:bg-primary/10">
                                {r.provider}
                              </Badge>
                            )}
                            {r.category && (
                              <Badge variant="outline" className="rounded-full text-xs font-medium">
                                {r.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              Added{" "}
                              {format(new Date(r.accessedAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons (both interactive practice and cloud link preserved) */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          {(r.accessUrl.startsWith("/examdumps/practice") || r.category?.toLowerCase().includes("dump") || r.name.toLowerCase().includes("redis")) && (
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
                              className="flex-shrink-0"
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

                          {r.accessUrl && !r.accessUrl.startsWith("http") && !r.accessUrl.startsWith("/examdumps/practice") && !r.category?.toLowerCase().includes("dump") && !r.name.toLowerCase().includes("redis") && (
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
