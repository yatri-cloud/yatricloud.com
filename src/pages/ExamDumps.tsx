import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, BookOpen, Star } from "lucide-react";
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
        <SEO title="Exam Dumps - Yatri Cloud" description="Get the latest and verified exam dumps for your cloud certifications." />
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
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary mb-6 shadow-sm">
                Exam Dumps
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                Verified Certification <span className="text-primary">Dumps</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Pass your certification exams on the first attempt with our high-quality, verified practice materials.
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
                <h3 className="text-2xl font-semibold">Loading Exam Dumps...</h3>
              </div>
            ) : filteredDumps.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-semibold">No dumps found</h3>
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
