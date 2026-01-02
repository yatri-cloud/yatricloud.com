import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, MessageCircle, Calendar, CreditCard, Users, Sparkles, ArrowRight, Award, BookOpen, Headphones } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const eligibleExams = [
  "AWS Cloud Practitioner",
  "AWS AI Practitioner",
  "AWS Certified Solutions Architect – Associate (SAA-C03)",
  "AWS Certified Developer – Associate (DVA-C02)",
  "AWS Certified CloudOps Engineer – Associate (SOA-C03)",
  "AWS Certified Data Engineer – Associate (DEA-C01)",
  "AWS Certified Machine Learning Engineer – Associate (MLA-C01)",
];

const bonusFeatures = [
  { icon: BookOpen, text: "Exam Dumps", description: "Comprehensive exam preparation materials" },
  { icon: Award, text: "Study Resources and materials", description: "Curated study guides and resources" },
  { icon: Sparkles, text: "Exam Guide", description: "Step-by-step certification roadmap" },
  { icon: Headphones, text: "Personal Support for doubt", description: "Direct access to our expert team" },
];

const steps = [
  {
    number: 1,
    title: "Complete Your Registration",
    description: "Make your payment to get started with the certification process",
    icon: CreditCard,
    action: {
      label: "Payment Link",
      url: "https://pages.razorpay.com/stores/yatricloud",
    },
  },
  {
    number: 2,
    title: "Join the WhatsApp Group",
    description: "This group is used for exam scheduling coordination, important updates, and direct support from our team",
    icon: MessageCircle,
    action: {
      label: "WhatsApp Group Link",
      url: "https://chat.whatsapp.com/EEAZws1rcr6CkiATivaikf",
      mandatory: true,
    },
  },
  {
    number: 3,
    title: "Exam Scheduling",
    description: "After payment confirmation, our team will schedule your exam only during a meeting call. The meeting will be arranged by our team, and exam date and time will be finalized inside the meeting itself. This ensures correct exam selection and avoids any mistakes.",
    icon: Calendar,
    action: null,
  },
];

export const CertificationFlowSection = () => {
  return (
    <section id="certification-flow" className="py-24 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                Get Certified with Yatri Cloud
              </span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Your Path to <span className="gradient-text">AWS Certification</span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Follow these simple steps to get your AWS Associate certification with our complete support package
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto">
          {/* Eligible Exams - Enhanced Design */}
          <ScrollReveal delay={0.1}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border-2 border-border/60 rounded-3xl p-8 md:p-12 mb-10 hover:border-primary/50 transition-all duration-500 overflow-hidden"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Decorative corner elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-20 translate-x-20 group-hover:bg-primary/10 transition-colors duration-500 blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10">
                    <Award className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Eligible AWS Associate Exams</h3>
                    <p className="text-sm text-muted-foreground">Choose from these eligible certification exams</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-3">
                  {eligibleExams.map((exam, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08 }}
                      className="group/item flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-background/50 to-background/30 border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5 text-primary group-hover/item:scale-110 transition-transform" />
                      </div>
                      <span className="text-foreground font-medium leading-relaxed group-hover/item:text-primary transition-colors">
                        {exam}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.div>
          </ScrollReveal>

          {/* Bonus Features - Enhanced Design */}
          <ScrollReveal delay={0.2}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative bg-gradient-to-br from-primary/15 via-primary/8 to-primary/5 border-2 border-primary/40 rounded-3xl p-8 md:p-12 mb-12 relative overflow-hidden shadow-2xl shadow-primary/10"
            >
              {/* Animated background effects */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -translate-y-48 translate-x-48 blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full translate-y-32 -translate-x-32 blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-primary/40 shadow-lg">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Bonus Features</h3>
                      <p className="text-sm text-muted-foreground">Everything you need to succeed</p>
                    </div>
                  </div>
                  <motion.div
                    initial={{ scale: 0.9 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/30 to-primary/20 border-2 border-primary/40 text-primary font-bold text-sm shadow-lg"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Available from 01/01/2026</span>
                  </motion.div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {bonusFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="group/item relative bg-gradient-to-br from-card/80 via-card/60 to-card/40 border-2 border-border/50 rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden"
                    >
                      {/* Background gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative z-10 flex items-start gap-4">
                        <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 group-hover/item:scale-110 group-hover/item:rotate-6 transition-all duration-300">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-foreground mb-1 group-hover/item:text-primary transition-colors">
                            {feature.text}
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </ScrollReveal>

          {/* Steps - Enhanced with Connection Lines */}
          <div className="relative">
            {/* Connection line between steps (desktop only) */}
            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary/20 to-primary/30" />
            
            <div className="space-y-8 relative">
              {steps.map((step, index) => (
                <ScrollReveal key={index} delay={0.3 + index * 0.15}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group relative"
                  >
                    {/* Step connector dot (desktop only) */}
                    <div className="hidden md:block absolute left-8 top-8 w-4 h-4 rounded-full bg-primary border-4 border-background shadow-lg shadow-primary/30 z-20" />
                    
                    <motion.div
                      className="relative bg-gradient-to-br from-card via-card/95 to-card/90 border-2 border-border/60 rounded-3xl p-8 md:p-10 overflow-hidden hover:border-primary/50 transition-all duration-500 ml-0 md:ml-16"
                      whileHover={{ y: -6, scale: 1.02 }}
                    >
                      {/* Enhanced decorative elements */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-20 translate-x-20 group-hover:bg-primary/15 transition-colors duration-500 blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-16 -translate-x-16 group-hover:bg-primary/10 transition-colors duration-500 blur-2xl" />
                      
                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                          {/* Enhanced Step Number */}
                          <div className="flex-shrink-0 flex items-center gap-4 md:block">
                            <div className="relative">
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/10 border-2 border-primary/40 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl shadow-primary/20">
                                <span className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                                  {step.number}
                                </span>
                              </div>
                              {/* Glow effect */}
                              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                            {/* Arrow connector (mobile only) */}
                            {index < steps.length - 1 && (
                              <div className="md:hidden flex-1 flex items-center justify-center py-2">
                                <ArrowRight className="w-6 h-6 text-primary/40" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                                <step.icon className="w-6 h-6 text-primary" />
                              </div>
                              <h3 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                                {step.title}
                              </h3>
                              {step.action?.mandatory && (
                                <motion.span
                                  initial={{ scale: 0.8 }}
                                  whileInView={{ scale: 1 }}
                                  viewport={{ once: true }}
                                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30 text-primary text-xs font-bold uppercase tracking-wider shadow-lg"
                                >
                                  Mandatory
                                </motion.span>
                              )}
                            </div>
                            
                            <div className="h-2 w-24 bg-gradient-to-r from-primary via-primary/60 to-primary/0 rounded-full mb-6 group-hover:w-32 transition-all duration-500" />
                            
                            <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
                              {step.description}
                            </p>

                            {/* Enhanced Action Button */}
                            {step.action && (
                              <motion.a
                                href={step.action.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05, y: -3 }}
                                whileTap={{ scale: 0.95 }}
                                className="group/btn relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-all duration-300 hover:shadow-3xl hover:shadow-primary/40 overflow-hidden"
                              >
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                
                                <span className="relative z-10">{step.action.label}</span>
                                <ExternalLink className="relative z-10 w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                                
                                {/* Glow effect */}
                                <div className="absolute inset-0 rounded-2xl bg-primary/0 group-hover/btn:bg-primary/25 blur-2xl transition-all duration-300" />
                              </motion.a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced bottom accent line */}
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </motion.div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Thank You Message - Enhanced */}
          <ScrollReveal delay={0.6}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 relative"
            >
              <div className="relative text-center p-10 md:p-12 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-2 border-primary/40 overflow-hidden shadow-2xl shadow-primary/20">
                {/* Animated background effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-primary/40 mb-6 shadow-lg"
                  >
                    <Sparkles className="w-8 h-8 text-primary" />
                  </motion.div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Thank you for trusting <span className="gradient-text">Yatri Cloud</span>
                  </h3>
                  <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                    Let's get you certified! 🚀
                  </p>
                  
                  {/* Decorative elements */}
                  <div className="flex items-center justify-center gap-2 mt-6">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ 
                          delay: 0.4 + i * 0.1,
                          duration: 1.5, 
                          repeat: Infinity, 
                          repeatDelay: i * 0.2 
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default CertificationFlowSection;

