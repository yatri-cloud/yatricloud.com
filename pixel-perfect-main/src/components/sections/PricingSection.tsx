import { motion } from "framer-motion";
import { Check, Sparkles, Zap, RefreshCw, Gift } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const features = [
  { icon: Gift, text: "Always Free", description: "No payment required" },
  { icon: Zap, text: "No Sign-up Required", description: "Start immediately" },
  { icon: RefreshCw, text: "Updated Weekly", description: "Fresh content regularly" },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              100% Free Forever
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Practice Tests & <span className="gradient-text">Exam Prep</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Master your certification exams with expert-curated practice tests. No payment, no signup — just start learning.
            </p>
          </div>
        </ScrollReveal>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <motion.div
                className="bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.text}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;