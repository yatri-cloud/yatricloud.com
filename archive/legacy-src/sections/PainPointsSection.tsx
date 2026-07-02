import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

const resources = [
  {
    title: "Complete Registration",
    description: "Make your payment and get started with the certification process",
    gradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
    accent: "blue",
  },
  {
    title: "Join Support Group",
    description: "Get exam scheduling coordination and direct support from our team",
    gradient: "from-purple-500/20 via-pink-500/20 to-orange-500/20",
    accent: "purple",
  },
  {
    title: "Schedule Your Exam",
    description: "We'll arrange a meeting call to finalize your exam date and time",
    gradient: "from-pink-500/20 via-orange-500/20 to-yellow-500/20",
    accent: "pink",
  },
  {
    title: "Get Certified",
    description: "Receive exam dumps, study resources, and personal support to ace your exam",
    gradient: "from-orange-500/20 via-yellow-500/20 to-green-500/20",
    accent: "orange",
  },
];

export const PainPointsSection = () => {
  return (
    <section id="resources" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Certification Process
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              How to Get <span className="gradient-text">Certified</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Follow these simple steps to get your AWS Associate certification with our full support
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {resources.map((resource, index) => (
            <ScrollReveal key={index} delay={index * 0.15}>
              <motion.div
                className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/60 rounded-3xl p-8 overflow-hidden hover:border-primary/40 transition-all duration-500 h-full"
                whileHover={{ y: -12, scale: 1.03 }}
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${resource.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Decorative corner elements */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-500" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors duration-500" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Number indicator with gradient */}
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors duration-300">
                    {resource.title}
                  </h3>
                  
                  {/* Decorative line */}
                  <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/0 rounded-full mb-4 group-hover:w-24 transition-all duration-500" />
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                    {resource.description}
                  </p>
                  
                  {/* Bottom accent */}
                  <div className="mt-6 pt-4 border-t border-border/30 group-hover:border-primary/30 transition-colors duration-300">
                    <div className="flex items-center gap-2 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Learn More</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-1 h-1 rounded-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;