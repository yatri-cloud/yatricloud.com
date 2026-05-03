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
    <section className="py-24 relative overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
                Premium Resources
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Latest <span className="gradient-text">Exam Dumps</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Get the most recent and updated certification exam resources. 
                Instant delivery to your email after purchase.
              </p>
            </div>
            <Link 
              to="/examdumps" 
              className="group flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
            >
              View All Dumps
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dumps.map((dump, index) => (
            <ScrollReveal key={dump.id} delay={index * 0.1}>
              <motion.div
                className="group relative bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-500 shadow-xl"
                whileHover={{ y: -10 }}
              >
                {/* Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img 
                    src={dump.image || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60"} 
                    alt={dump.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-primary/90 backdrop-blur-md text-white text-xs font-bold rounded-full">
                      {dump.provider}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-1 group-hover:text-primary transition-colors">
                    {dump.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{dump.originalPrice}
                      </span>
                      <span className="text-2xl font-black text-primary">
                        ₹{dump.price}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-md">
                      <span>-{Math.round(((dump.originalPrice - dump.price) / dump.originalPrice) * 100)}%</span>
                    </div>
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
                      className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add
                    </button>
                    <Link
                      to="/examdumps"
                      className="flex items-center justify-center gap-2 bg-secondary text-foreground font-bold py-3 rounded-xl hover:bg-secondary/80 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestExamDumpsSection;
