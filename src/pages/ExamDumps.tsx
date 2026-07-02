import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, FileSearch, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { ExamDumpCard } from "@/components/exam-dumps/ExamDumpCard";
import { CartSheet } from "@/components/store/CartSheet";
import { MobileCartBar } from "@/components/store/MobileCartBar";
import { fetchExamDumps, ExamDump } from "@/lib/exam-dumps";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ExamDumps = () => {
  const navigate = useNavigate();
  const [dumps, setDumps] = useState<ExamDump[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>("All");

  useEffect(() => {
    const loadDumps = async () => {
      try {
        setIsLoading(true);
        const fetchedDumps = await fetchExamDumps();
        setDumps(fetchedDumps);
      } catch (error) {
        console.error("Error loading exam dumps:", error);
        setDumps([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadDumps();
  }, []);

  const providers = useMemo(() => {
    const p = new Set(dumps.map(d => d.provider));
    return ["All", ...Array.from(p)];
  }, [dumps]);

  const filteredDumps = useMemo(() => {
    if (selectedProvider === "All") return dumps;
    return dumps.filter(d => d.provider === selectedProvider);
  }, [selectedProvider, dumps]);

  return (
    <>
      <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
        <SEO
          title="Verified Exam Dumps · AWS, Azure, GCP | Yatri Cloud"
          description="Real, verified exam dumps for AWS, Azure and GCP certifications. Practice with the same style of questions and pass on your first attempt."
          jsonLd={
            dumps.length > 0
              ? {
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  name: "Verified Cloud Certification Exam Dumps",
                  itemListElement: dumps.slice(0, 20).map((d, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    name: d.title,
                    url: "https://www.yatricloud.com/examdumps",
                  })),
                }
              : undefined
          }
        />
        <div className="noise-overlay" />
        <Navbar />

        {/* Header Section */}
        <section className="relative pt-28 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.02em] mb-4">
                Pass on your <span className="gradient-text">first attempt</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Verified, high-quality exam dumps and practice materials — trusted by 50,000+ Yatris preparing for AWS, Azure & GCP. No guesswork, just confidence.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="container mx-auto px-4 md:px-6 flex items-center justify-between py-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {providers.map((provider) => (
                <Button
                  key={provider}
                  variant={selectedProvider === provider ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProvider(provider)}
                  className="whitespace-nowrap rounded-full"
                >
                  {provider}
                </Button>
              ))}
            </div>
            <CartSheet />
          </div>
        </section>

        {/* Grid Section */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            {isLoading ? (
              <div className="text-center py-20">
                <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-2xl font-semibold">Loading your dumps…</h3>
              </div>
            ) : filteredDumps.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileSearch className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-bold">No dumps here yet, Yatris</h3>
                <p className="mt-2 max-w-md mx-auto text-muted-foreground">
                  Fresh, verified sets drop regularly. Tell us which exam you're chasing and we'll prioritise it.
                </p>
                <Button onClick={() => navigate("/requestvoucher")} className="mt-6 rounded-xl shadow-inset-btn">
                  Request a dump <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredDumps.map((dump) => (
                  <ExamDumpCard key={dump.id} dump={dump} />
                ))}
              </div>
            )}
          </div>
        </section>

        <Footer />
        <MobileCartBar />
      </div>
    </>
  );
};

export default ExamDumps;
