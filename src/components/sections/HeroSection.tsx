import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import ScrollReveal from "@/components/ScrollReveal";

export const HeroSection = () => {
  // Set target date to January 1, 2026
  const targetDate = new Date('2026-01-01T23:59:59');

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Countdown Badge */}
          <ScrollReveal delay={0.1}>
            <motion.div
              className="inline-flex items-center gap-3 bg-card border border-border rounded-full px-4 py-2 mb-8"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-primary text-sm font-semibold">🔥 Limited Time Offer</span>
              <div className="w-px h-4 bg-border" />
              <CountdownTimer targetDate={targetDate} className="scale-75 origin-left" />
            </motion.div>
          </ScrollReveal>

          {/* Main Headline */}
          <ScrollReveal delay={0.2}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Get 50% OFF on
              <br />
              <span className="gradient-text">Certification Vouchers</span>
            </h1>
          </ScrollReveal>

          {/* Subheadline */}
          <ScrollReveal delay={0.3}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Get AWS Associate certified at 50% OFF. Register, join WhatsApp, and we'll schedule your exam. Dumps, resources, and support included!
            </p>
          </ScrollReveal>

          {/* CTA Buttons */}
          <ScrollReveal delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <motion.a
                href="https://pages.razorpay.com/stores/yatricloud"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary px-10 py-6 text-lg font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-all duration-300 hover:shadow-3xl hover:shadow-primary/40 overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <span className="relative z-10">Get Your 50% OFF</span>
                <ArrowRight className="relative z-10 ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-primary/0 group-hover:bg-primary/25 blur-2xl transition-all duration-300" />
              </motion.a>
            </div>
          </ScrollReveal>

          {/* Trust Badges - Modern UI without icons */}
          <ScrollReveal delay={0.5}>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                "50% OFF Vouchers",
                "Exam Dumps",
                "Free Udemy Access",
                "Topmate Connect",
                "LinkedIn Recommendation",
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="relative px-6 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-full backdrop-blur-sm"
                >
                  <span className="text-sm font-semibold text-foreground relative z-10">{item}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </div>
          </ScrollReveal>

          {/* Practice Tests Mockup */}
          <ScrollReveal delay={0.6}>
            <motion.div
              className="mt-16 relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="bg-card border border-border rounded-2xl p-6 max-w-3xl mx-auto shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground text-left">
                        <span className="text-primary font-medium">Get Certified Now</span> - Register, join WhatsApp, and we'll schedule your exam. Get dumps, resources, and support included!
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-semibold">50% OFF</span>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-semibold">Exam Dumps</span>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-semibold">Free Udemy</span>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-semibold" style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="Free Topmate Connect">Free Topmate...</span>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-semibold" style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="LinkedIn Recommendation">LinkedIn Rec...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements - Modern UI without icons */}
              <motion.div
                className="absolute -top-4 -right-4 md:right-10 bg-card border border-primary/20 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-sm"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <span className="text-sm font-semibold text-foreground">Study Resources</span>
              </motion.div>
              
              <motion.div
                className="absolute -bottom-4 -left-4 md:left-10 bg-card border border-primary/20 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-sm"
                animate={{ rotate: [0, -5, 0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
              >
                <span className="text-sm font-semibold text-foreground">Personal Support</span>
              </motion.div>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;