import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";
import { fetchExamDumps, type ExamDump } from "@/lib/exam-dumps";
import { ExamDumpCard } from "@/components/exam-dumps/ExamDumpCard";

export const LatestExamDumpsSection = () => {
  const [dumps, setDumps] = useState<ExamDump[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDumps = async () => {
      try {
        const data = await fetchExamDumps();
        // Only show top 3 for homepage
        setDumps(data.slice(0, 3));
      } catch (error) {
        console.error("Error loading dumps:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDumps();
  }, []);

  if (isLoading || dumps.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
              <div className="max-w-2xl">
                <h2 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em] mb-4">
                  Latest <span className="gradient-text">Exam Dumps</span>
                </h2>
                <p className="text-muted-foreground text-lg">
                  Get the most recent and updated certification exam resources.
                  Instant delivery to your email after purchase.
                </p>
              </div>
              <Link
                to="/examdumps"
                className="group inline-flex items-center gap-2 text-primary font-semibold min-h-[44px] transition-colors hover:text-primary/80"
              >
                View All Dumps
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dumps.map((dump, index) => (
              <ScrollReveal key={dump.id} delay={index * 0.06}>
                <ExamDumpCard dump={dump} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LatestExamDumpsSection;
