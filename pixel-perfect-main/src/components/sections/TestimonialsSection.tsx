import { motion } from "framer-motion";
import { Users, BookOpen, Star, TrendingUp } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const stats = [
  { icon: Users, value: "50K+", label: "Learners" },
  { icon: BookOpen, value: "6+", label: "Practice Tests" },
  { icon: Star, value: "4.8", label: "Avg. Rating" },
  { icon: TrendingUp, value: "95%", label: "Success Rate" },
];

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Trusted by Professionals
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why Learners <span className="gradient-text">Trust Us</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with care by cloud experts who understand what it takes to pass certification exams.
            </p>
          </div>
        </ScrollReveal>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 max-w-5xl mx-auto">
          <ScrollReveal delay={0.1}>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">Expert-Crafted Content</div>
              <p className="text-xs text-muted-foreground">Created by certified cloud professionals with hands-on industry experience.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">Instant Access</div>
              <p className="text-xs text-muted-foreground">Start practicing immediately. No registration or payment required.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">Exam-Aligned Questions</div>
              <p className="text-xs text-muted-foreground">Questions mirror actual certification exam patterns and difficulty.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.4}>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">Proven Success Rate</div>
              <p className="text-xs text-muted-foreground">Join thousands who passed their certification</p>
            </div>
          </ScrollReveal>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <motion.div
                className="bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-all duration-300"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;