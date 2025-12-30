import { motion } from "framer-motion";
import { Shield, Zap, Target, Award } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Expert-Crafted Content",
    description: "Created by certified cloud professionals with hands-on industry experience.",
  },
  {
    icon: Zap,
    title: "Instant Access",
    description: "Start practicing immediately. No registration or payment required.",
  },
  {
    icon: Target,
    title: "Exam-Aligned Questions",
    description: "Questions mirror actual certification exam patterns and difficulty.",
  },
  {
    icon: Award,
    title: "Proven Success Rate",
    description: "Join thousands who passed their certification on the first attempt.",
  },
];

export const TrustSection = () => {
  return (
    <section className="py-24 bg-surface-subtle border-y border-border/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Why Learners Trust Us
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Built with care by cloud experts who understand what it takes to pass certification exams.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/20 hover:shadow-lg transition-all duration-500"
            >
              {/* Icon */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-2xl bg-card border border-border/60"
        >
          {[
            { value: "50K+", label: "Learners" },
            { value: "6+", label: "Practice Tests" },
            { value: "4.8", label: "Avg. Rating" },
            { value: "95%", label: "Success Rate" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
