import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import ScrollReveal from "@/components/ScrollReveal";

export const HeroSection = () => {
  // Set target date to January 31, 2026 (end of New Year offer)
  const targetDate = new Date('2026-01-31T23:59:59');

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
              <span className="text-primary text-sm font-semibold">🎉 New Year 2026 Offer</span>
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
                href="https://certification.yatricloud.com/yatristore"
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

          {/* Certification Process Section */}
          <ScrollReveal delay={0.7}>
            <div id="certification-process" className="mt-20 max-w-6xl mx-auto">
              <div className="text-center mb-12">
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

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    number: "01",
                    title: "Complete Registration",
                    description: "Make your payment and get started with the certification process",
                  },
                  {
                    number: "02",
                    title: "Join Support Group",
                    description: "Get exam scheduling coordination and direct support from our team",
                  },
                  {
                    number: "03",
                    title: "Schedule Your Exam",
                    description: "We'll arrange a meeting call to finalize your exam date and time",
                  },
                  {
                    number: "04",
                    title: "Get Certified",
                    description: "Receive exam dumps, study resources, and personal support to ace your exam",
                  },
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group relative bg-gradient-to-br from-card via-card/98 to-card/95 border-2 border-border/60 rounded-2xl p-6 overflow-hidden hover:border-primary/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/10"
                  >
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Decorative corner elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary/5 rounded-full translate-y-10 -translate-x-10 blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                    
                    <div className="relative z-10">
                      {/* Step Number */}
                      <div className="mb-4">
                        <span className="text-4xl font-black bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                          {step.number}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {step.title}
                      </h3>
                      
                      {/* Decorative line */}
                      <div className="h-1 w-12 bg-gradient-to-r from-primary via-primary/50 to-transparent rounded-full mb-4 group-hover:w-16 transition-all duration-500" />
                      
                      {/* Description */}
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4 group-hover:text-foreground/80 transition-colors">
                        {step.description}
                      </p>
                      
                      {/* Learn More Link */}
                      <motion.a
                        href="#certification-flow"
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.querySelector('#certification-flow');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        whileHover={{ x: 5 }}
                        className="inline-flex items-center gap-2 text-primary font-semibold text-sm group/link"
                      >
                        Learn More
                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                      </motion.a>
                    </div>
                    
                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;