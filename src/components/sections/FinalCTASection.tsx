import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import CountdownTimer from "@/components/CountdownTimer";

export const FinalCTASection = () => {
  // Set target date to January 1, 2026
  const targetDate = new Date('2026-01-01T23:59:59');

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Ace Your <span className="gradient-text">Certification</span>?</h2>
            <p className="text-lg text-muted-foreground mb-8">Join 50,000+ learners who've passed their certification exams with our free practice tests.</p>
            <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full px-6 py-3 mb-8">
              <span className="text-primary font-semibold">🔥 Limited Time Offer:</span>
              <CountdownTimer targetDate={targetDate} />
            </div>
            <div className="flex justify-center">
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
                
                <span className="relative z-10">Get 50% OFF on Certification Vouchers</span>
                <ArrowRight className="relative z-10 ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-primary/0 group-hover:bg-primary/25 blur-2xl transition-all duration-300" />
              </motion.a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FinalCTASection;