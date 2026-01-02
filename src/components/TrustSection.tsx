import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const forYouPoints = [
  "You want to get AWS Associate certified with 50% OFF vouchers",
  "You're ready to complete registration and join our WhatsApp group",
  "You need exam dumps, study resources, and personal support",
  "You value guided exam scheduling through our team's meeting calls",
  "You want a complete certification package with full support",
];

const notForYouPoints = [
  "You're looking for completely free vouchers (we offer 50% OFF with full support package)",
  "You prefer handling exam scheduling yourself (we provide guided support to ensure success)",
  "You're hesitant about joining our support group (it's essential for coordination and direct help)",
  "You don't need additional resources (we include exam dumps, Udemy access, and study materials)",
  "You want to go solo (we're here to support you every step of the way)",
];

export const TrustSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Is this for you Section */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-muted-foreground text-lg mb-2">Is this for you?</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              This Certification Program Is a <span className="text-primary">Perfect</span> Fit If You're Ready to...
            </h2>
          </div>
        </ScrollReveal>

        {/* Two Column Comparison */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-20">
          {/* For You Box */}
          <ScrollReveal delay={0.1}>
        <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="border-2 border-primary rounded-2xl overflow-hidden bg-card"
            >
              <div className="bg-primary px-6 py-4">
                <h3 className="text-white font-bold text-lg uppercase tracking-wide">
                  This is for you if:
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {forYouPoints.map((point, index) => (
        <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-foreground text-sm md:text-base leading-relaxed">{point}</p>
                  </motion.div>
                ))}
      </div>
            </motion.div>
          </ScrollReveal>
      
          {/* Not For You Box */}
          <ScrollReveal delay={0.2}>
        <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="border-2 border-foreground rounded-2xl overflow-hidden bg-card"
            >
              <div className="bg-foreground px-6 py-4">
                <h3 className="text-background font-bold text-lg uppercase tracking-wide">
                  Consider Our Offer If:
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {notForYouPoints.map((point, index) => (
          <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <X className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-foreground text-sm md:text-base leading-relaxed">{point}</p>
                  </motion.div>
                ))}
              </div>
          </motion.div>
          </ScrollReveal>
        </div>

        {/* Why Learners Trust Us Section */}
        <ScrollReveal delay={0.3}>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Trusted by Professionals
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why Learners <span className="gradient-text">Trust Us</span>
          </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Complete certification support from exam scheduling to study resources and personal guidance.
            </p>
          </div>
        </ScrollReveal>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-16 max-w-6xl mx-auto">
          <ScrollReveal delay={0.4}>
        <motion.div
              className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/60 rounded-2xl p-8 hover:border-primary/40 transition-all duration-500 overflow-hidden"
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-foreground mb-3 leading-tight">
                  50% OFF Vouchers
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Get AWS Associate exam vouchers at half price - limited time offer.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors duration-500" />
            </motion.div>
          </ScrollReveal>
          <ScrollReveal delay={0.5}>
            <motion.div
              className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/60 rounded-2xl p-8 hover:border-primary/40 transition-all duration-500 overflow-hidden"
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-foreground mb-3 leading-tight">
                  Complete Support Package
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Exam dumps, study resources, guides, and personal support included.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors duration-500" />
            </motion.div>
          </ScrollReveal>
          <ScrollReveal delay={0.6}>
              <motion.div
              className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/60 rounded-2xl p-8 hover:border-primary/40 transition-all duration-500 overflow-hidden"
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-foreground mb-3 leading-tight">
                  Guided Exam Scheduling
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our team schedules your exam via personal meeting call for correct setup.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors duration-500" />
            </motion.div>
          </ScrollReveal>
          <ScrollReveal delay={0.7}>
            <motion.div
              className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/60 rounded-2xl p-8 hover:border-primary/40 transition-all duration-500 overflow-hidden"
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-foreground mb-3 leading-tight">
                  Personal Support
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Direct support from our team via WhatsApp group for guidance and assistance.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors duration-500" />
            </motion.div>
          </ScrollReveal>
          <ScrollReveal delay={0.8}>
            <motion.div
              className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/60 rounded-2xl p-8 hover:border-primary/40 transition-all duration-500 overflow-hidden"
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-foreground mb-3 leading-tight">
                  Yatri Wall of Fame
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Get featured on our Wall of Fame after successfully passing your AWS certification.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors duration-500" />
            </motion.div>
          </ScrollReveal>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {[
            { value: "50K+", label: "Learners" },
            { value: "6+", label: "Practice Tests" },
            { value: "4.8", label: "Avg. Rating" },
            { value: "95%", label: "Success Rate" },
          ].map((stat, index) => (
            <ScrollReveal key={index} delay={0.8 + index * 0.1}>
              <motion.div
                className="group relative bg-gradient-to-br from-card via-card to-card/80 border border-border/60 rounded-2xl p-8 text-center overflow-hidden hover:border-primary/40 transition-all duration-500"
                whileHover={{ y: -8, scale: 1.03 }}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent mb-3 leading-none">
                  {stat.value}
                  </div>
                  <div className="text-base font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                  </div>
                </div>
                
                {/* Decorative accent line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-3/4 transition-all duration-500" />
              </motion.div>
            </ScrollReveal>
            ))}
          </div>
      </div>
    </section>
  );
};

export default TrustSection;
