import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-subtle to-background">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>
      
      <div className="container relative">
        <div className="flex flex-col items-center justify-center min-h-[85vh] py-20 text-center">
          {/* Animated badge */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary mb-8 shadow-lg shadow-primary/10"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            Limited Time Offer
          </motion.div>

          {/* Main heading with gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-5xl text-balance leading-[1.1]"
          >
            Get{" "}
            <span className="relative inline-block">
              <span className="text-primary">50% OFF</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/30 rounded-full origin-left"
              />
            </span>
            {" "}on
            <br />
            Certification Vouchers
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-8 text-lg md:text-xl text-text-secondary max-w-2xl text-balance leading-relaxed"
          >
            Limited-time discounts for cloud and associate-level certifications. 
            Start with our free practice tests and ace your exam.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <motion.a
              href="https://pages.razorpay.com/stores/yatricloud"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary px-10 py-5 text-lg font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-all duration-300 hover:shadow-3xl hover:shadow-primary/40 overflow-hidden"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <span className="relative z-10">Get Your 50% OFF</span>
              <motion.span
                className="relative z-10"
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <ArrowDown className="h-5 w-5" />
              </motion.span>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-primary/0 group-hover:bg-primary/25 blur-2xl transition-all duration-300" />
            </motion.a>
          </motion.div>

          {/* Trust indicators - modern UI without icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-4"
          >
            {[
              "Always Free",
              "Exam Dumps",
              "Updated Weekly",
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
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-text-muted"
            >
              <span className="text-xs uppercase tracking-wider">Scroll</span>
              <div className="w-5 h-8 rounded-full border-2 border-border flex justify-center pt-1.5">
                <motion.div
                  animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-1 h-1 rounded-full bg-text-muted"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
