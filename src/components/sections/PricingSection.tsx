import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

const features = [
  { text: "50% OFF Vouchers", description: "Get AWS Associate exam vouchers at half price", gradient: "from-blue-500/20 to-purple-500/20" },
  { text: "Exam Dumps & Resources", description: "Comprehensive study materials included", gradient: "from-purple-500/20 to-pink-500/20" },
  { text: "Personal Support", description: "Direct support from our team for your doubts", gradient: "from-pink-500/20 to-orange-500/20" },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Certification Package
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              What's <span className="gradient-text">Included</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get everything you need to pass your AWS Associate certification exam with our comprehensive support package
            </p>
          </div>
        </ScrollReveal>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 0.15}>
              <motion.div
                className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/60 rounded-3xl p-10 overflow-hidden hover:border-primary/40 transition-all duration-500"
                whileHover={{ y: -12, scale: 1.04 }}
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Decorative corner elements */}
                <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-full -translate-x-20 -translate-y-20 group-hover:bg-primary/10 transition-colors duration-500 blur-xl" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 translate-y-16 group-hover:bg-primary/10 transition-colors duration-500 blur-xl" />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Modern badge with number */}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-primary/10">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{index + 1}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors duration-300">
                  {feature.text}
                </h3>
                  
                  <div className="h-1.5 w-20 bg-gradient-to-r from-primary via-primary/50 to-primary/0 rounded-full mb-5 group-hover:w-28 transition-all duration-500" />
                  
                  <p className="text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                </div>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;