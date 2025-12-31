import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

const features = [
  { text: "Always Free", description: "No payment required", gradient: "from-blue-500/20 to-purple-500/20" },
  { text: "Exam Dumps", description: "Start immediately", gradient: "from-purple-500/20 to-pink-500/20" },
  { text: "Updated Weekly", description: "Fresh content regularly", gradient: "from-pink-500/20 to-orange-500/20" },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
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
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 0.15}>
              <motion.div
                className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/60 rounded-3xl p-10 overflow-hidden hover:border-primary/40 transition-all duration-500"
                whileHover={{ y: -10, scale: 1.03 }}
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Decorative corner elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-16 -translate-y-16 group-hover:bg-primary/10 transition-colors duration-500" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-12 translate-y-12 group-hover:bg-primary/10 transition-colors duration-500" />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Number badge */}
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl font-bold text-primary">{index + 1}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                    {feature.text}
                  </h3>
                  
                  <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/0 rounded-full mb-4 group-hover:w-24 transition-all duration-500" />
                  
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;