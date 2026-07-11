import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingCart, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";
import { fetchExamDumps, type ExamDump } from "@/lib/exam-dumps";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export const LatestExamDumpsSection = () => {
  const [dumps, setDumps] = useState<ExamDump[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

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
                <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
                  Premium Resources
                </span>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {dumps.map((dump, index) => {
              const discount = Math.round(
                ((dump.originalPrice - dump.price) / dump.originalPrice) * 100
              );
              return (
              <ScrollReveal key={dump.id} delay={index * 0.06}>
                <motion.div
                  className="group relative h-full flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-card transition-colors duration-300"
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {/* Square image stage — artwork contained and centered,
                      matching ExamDumpCard on /examdumps. The image links to
                      the dumps page, same as the Details button. */}
                  <Link
                    to="/examdumps"
                    aria-label={`View details of ${dump.title}`}
                    className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50/60 via-card to-brand-50/30 p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img
                      src={dump.image || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60"}
                      alt={dump.title}
                      width={800}
                      height={800}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Provider document tag */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />
                        {dump.provider}
                      </span>
                    </div>
                    {/* Discount rubber-stamp */}
                    <div className="absolute top-3 right-3 rotate-[-8deg] group-hover:rotate-[-4deg] transition-transform duration-300">
                      <span className="flex flex-col items-center justify-center rounded-full border-2 border-primary/60 bg-background/80 backdrop-blur-sm px-3 py-2 text-primary leading-none tabular-nums">
                        <span className="text-base font-extrabold">-{discount}%</span>
                        <span className="text-[9px] font-semibold uppercase tracking-widest">Off</span>
                      </span>
                    </div>
                  </Link>

                  {/* Ruled exam-paper body */}
                  <div
                    className="relative flex flex-col flex-1 p-6 pl-8"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, transparent, transparent 31px, hsl(var(--border) / 0.6) 31px, hsl(var(--border) / 0.6) 32px)",
                    }}
                  >
                    {/* Margin rule */}
                    <span className="pointer-events-none absolute inset-y-0 left-5 w-px bg-primary/30" aria-hidden="true" />

                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      Exam Paper
                    </span>
                    <h3 className="text-xl font-bold text-foreground mb-4 line-clamp-1 group-hover:text-primary transition-colors">
                      <Link
                        to="/examdumps"
                        className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {dump.title}
                      </Link>
                    </h3>

                    <div className="flex items-end justify-between mb-6 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground line-through tabular-nums">
                          ₹{dump.originalPrice}
                        </span>
                        <span className="text-2xl font-bold text-primary tabular-nums">
                          ₹{dump.price}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Instant delivery
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          addToCart({
                            id: dump.id,
                            title: dump.title,
                            discountedPrice: dump.price,
                            originalPrice: dump.originalPrice,
                            image: dump.image,
                            type: 'exam-dump',
                            downloadUrl: dump.downloadUrl
                          });
                          toast.success("Added to cart");
                        }}
                        className="flex items-center justify-center gap-2 min-h-[44px] bg-primary text-primary-foreground font-semibold py-3 rounded-xl shadow-inset-btn hover:bg-primary/90 transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add
                      </button>
                      <Link
                        to="/examdumps"
                        className="flex items-center justify-center gap-2 min-h-[44px] border border-border text-foreground font-semibold py-3 rounded-xl hover:border-primary/40 hover:bg-secondary transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LatestExamDumpsSection;
