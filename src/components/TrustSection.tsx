import { motion } from "framer-motion";
import { Shield, Zap, Target, Award, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Expert-Crafted Content",
    description: "Created by certified cloud professionals with hands-on industry experience.",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Zap,
    title: "Instant Access",
    description: "Start practicing immediately. No registration or payment required.",
    color: "from-amber-500/20 to-orange-500/20",
  },
  {
    icon: Target,
    title: "Exam-Aligned Questions",
    description: "Questions mirror actual certification exam patterns and difficulty.",
    color: "from-emerald-500/20 to-green-500/20",
  },
  {
    icon: Award,
    title: "Proven Success Rate",
    description: "Join thousands who passed their certification on the first attempt.",
    color: "from-purple-500/20 to-pink-500/20",
  },
];

const stats = [
  { value: "50K+", label: "Learners", icon: "👥" },
  { value: "6+", label: "Practice Tests", icon: "📝" },
  { value: "4.8", label: "Avg. Rating", icon: "⭐" },
  { value: "95%", label: "Success Rate", icon: "🎯" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export const TrustSection = () => {
  return (
    <section className="py-28 bg-gradient-to-b from-background via-surface-subtle to-background relative overflow-hidden">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"
        />
      </div>
      
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6"
          >
            <TrendingUp className="h-4 w-4" />
            Trusted by Professionals
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-5">
            Why Learners Trust Us
          </h2>
          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Built with care by cloud experts who understand what it takes to pass certification exams.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ 
                y: -10, 
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className="group relative p-7 rounded-2xl bg-card border border-border/60 hover:border-primary/30 transition-all duration-500 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1.2 }}
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} blur-xl`}
              />
              
              {/* Content */}
              <div className="relative">
                {/* Icon with animation */}
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300"
                >
                  <feature.icon className="h-7 w-7 text-primary" />
                </motion.div>
                
                <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats bar with counter animation */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl blur-xl" />
          
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 p-10 rounded-3xl bg-card/80 backdrop-blur-sm border border-border/60">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center group cursor-default"
              >
                <motion.span
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.2 }}
                  className="text-2xl mb-2 block"
                >
                  {stat.icon}
                </motion.span>
                <motion.div 
                  className="text-3xl md:text-4xl font-bold text-primary mb-1"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.5 + index * 0.1,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-text-muted group-hover:text-text-secondary transition-colors">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
