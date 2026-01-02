import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
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
  "50% OFF AWS Associate Exam Vouchers",
  "Comprehensive Exam Dumps",
  "Study Resources & Materials",
  "Free Udemy Course Access",
  "Free Topmate Sessions with Yatharth & Nensi",
  "LinkedIn Recommendation",
];

const steps = [
  {
    number: 1,
    title: "Complete Your Registration",
    description: "Make your payment to get started with the certification process",
    gradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
    action: {
      label: "Payment Link",
      url: "https://pages.razorpay.com/stores/yatricloud",
    },
  },
  {
    number: 2,
    title: "Join the WhatsApp Group",
    description: "This group is used for exam scheduling coordination, important updates, and direct support from our team",
    gradient: "from-green-500/20 via-emerald-500/20 to-teal-500/20",
    action: {
      label: "WhatsApp Group Link",
      url: "https://chat.whatsapp.com/EEAZws1rcr6CkiATivaikf",
      mandatory: true,
    },
  },
  {
    number: 3,
    title: "Exam Scheduling",
    description: "Our team will schedule your exam during a meeting call. We'll arrange the call and finalize the date and time together to ensure correct exam selection.",
    gradient: "from-purple-500/20 via-pink-500/20 to-rose-500/20",
    action: null,
  },
];

export const CertificationFlowSection = () => {
  return (
    <section id="certification-flow" className="py-32 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-20">
            <motion.div
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 mb-6"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                Get Certified with Yatri Cloud
              </span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Your Path to <span className="gradient-text">AWS Certification</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Follow these simple steps to get your AWS Associate certification with our comprehensive support
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto">
          {/* Eligible Exams - Clean Card Design */}
          <ScrollReveal delay={0.1}>
            <motion.div
              className="group relative bg-gradient-to-br from-card via-card/98 to-card/95 border-2 border-border/60 rounded-[2rem] p-10 md:p-12 mb-10 overflow-hidden hover:border-primary/50 transition-all duration-700 shadow-2xl"
              whileHover={{ y: -8, scale: 1.01 }}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Decorative corner accents */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-24 -translate-x-24 blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
              
              <div className="relative z-10">
                <div className="mb-8">
                  <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Eligible AWS Associate Exams</h3>
                  <div className="h-1.5 w-32 bg-gradient-to-r from-primary via-primary/50 to-transparent rounded-full" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {eligibleExams.map((exam, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08, duration: 0.5 }}
                      className="group/item flex items-start gap-4 p-5 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/40 hover:border-primary/40 hover:bg-card/70 transition-all duration-300"
                    >
                      <div className="flex-shrink-0 mt-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary group-hover/item:scale-150 transition-transform duration-300" />
                      </div>
                      <span className="text-foreground text-base leading-relaxed font-medium">{exam}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.div>
          </ScrollReveal>

          {/* Bonus Features - Premium Box Design */}
          <ScrollReveal delay={0.2}>
            <div className="mb-12">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
                <div>
                  <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Bonus Features</h3>
                  <div className="h-1.5 w-32 bg-gradient-to-r from-primary via-primary/50 to-transparent rounded-full" />
                </div>
                <motion.div
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-primary/30 to-primary/20 border-2 border-primary/40 backdrop-blur-sm"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-primary font-bold text-sm md:text-base">Available from 01/01/2026</span>
                </motion.div>
              </div>
              
              {/* Individual Benefit Boxes */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bonusFeatures.map((feature, index) => {
                  const gradients = [
                    "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
                    "from-purple-500/20 via-pink-500/20 to-rose-500/20",
                    "from-orange-500/20 via-amber-500/20 to-yellow-500/20",
                    "from-green-500/20 via-emerald-500/20 to-teal-500/20",
                    "from-indigo-500/20 via-blue-500/20 to-purple-500/20",
                    "from-red-500/20 via-pink-500/20 to-rose-500/20",
                  ];
                  
                  return (
                    <ScrollReveal key={index} delay={0.2 + index * 0.1}>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 0.6, type: "spring" }}
                        whileHover={{ y: -8, scale: 1.03 }}
                        className="group relative bg-gradient-to-br from-card via-card/98 to-card/95 border-2 border-border/60 rounded-2xl p-8 overflow-hidden hover:border-primary/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/10"
                      >
                        {/* Animated gradient background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        
                        {/* Decorative corner elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-12 -translate-x-12 blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                        
                        <div className="relative z-10">
                          {/* Number badge */}
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-primary/10">
                            <span className="text-xl font-black bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                              {index + 1}
                            </span>
                          </div>
                          
                          {/* Feature text */}
                          <h4 className="text-xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors duration-300">
                            {feature}
                          </h4>
                          
                          {/* Decorative line */}
                          <div className="h-1 w-16 bg-gradient-to-r from-primary via-primary/50 to-transparent rounded-full group-hover:w-24 transition-all duration-500" />
                        </div>
                        
                        {/* Bottom accent line */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </motion.div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Steps - Enhanced Timeline Design */}
          <div className="relative pl-0 md:pl-20">
            {/* Connecting line for steps - Behind the numbers */}
            <div className="hidden md:block absolute left-10 top-0 bottom-0 w-0.5">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10 rounded-full" />
              {/* Animated progress line */}
              <motion.div
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-primary/80 to-primary rounded-full origin-top"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            
            <div className="space-y-12">
              {steps.map((step, index) => (
                <ScrollReveal key={index} delay={0.3 + index * 0.15}>
                  <motion.div
                    className="group relative"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, type: "spring" }}
                  >
                    <div className="flex gap-6 md:gap-8 items-start">
                      {/* Step Number Badge - Desktop */}
                      <div className="hidden md:flex flex-shrink-0 relative z-20 -ml-10">
                        <motion.div
                          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-card via-card/95 to-card/90 border-4 border-primary/40 flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          {/* Background circle behind number */}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 blur-sm" />
                          <span className="relative z-10 text-3xl font-black bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                            {step.number}
                          </span>
                        </motion.div>
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                      </div>

                      {/* Content Card */}
                      <motion.div
                        className="flex-1 relative bg-gradient-to-br from-card via-card/98 to-card/95 border-2 border-border/60 rounded-[2rem] p-8 md:p-10 overflow-hidden hover:border-primary/50 transition-all duration-700 shadow-2xl group-hover:shadow-primary/10"
                        whileHover={{ y: -8, scale: 1.02 }}
                      >
                        {/* Animated gradient background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                        
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-20 translate-x-20 blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-16 -translate-x-16 blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
                        
                        <div className="relative z-10">
                          {/* Step Number Badge - Mobile */}
                          <div className="md:hidden flex items-center gap-4 mb-6">
                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-card via-card/95 to-card/90 border-4 border-primary/40 flex items-center justify-center shadow-lg">
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 blur-sm" />
                              <span className="relative z-10 text-2xl font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                {step.number}
                              </span>
                            </div>
                            <div className="h-1 flex-1 bg-gradient-to-r from-primary via-primary/50 to-transparent rounded-full" />
                          </div>

                          {/* Header */}
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                                {step.title}
                              </h3>
                              {step.action?.mandatory && (
                                <motion.span
                                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/30"
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                  Mandatory
                                </motion.span>
                              )}
                            </div>
                            <div className="h-1.5 w-32 bg-gradient-to-r from-primary via-primary/50 to-transparent rounded-full group-hover:w-40 transition-all duration-500" />
                          </div>
                          
                          {/* Description */}
                          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 group-hover:text-foreground/80 transition-colors">
                            {step.description}
                          </p>

                          {/* Action Button */}
                          {step.action && (
                            <motion.a
                              href={step.action.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.05, y: -3 }}
                              whileTap={{ scale: 0.95 }}
                              className="group/btn relative inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-all duration-300 hover:shadow-3xl hover:shadow-primary/40 overflow-hidden"
                            >
                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                              
                              <span className="relative z-10">{step.action.label}</span>
                              <ExternalLink className="relative z-10 w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                              
                              {/* Glow effect */}
                              <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover/btn:bg-primary/25 blur-2xl transition-all duration-300" />
                            </motion.a>
                          )}
                        </div>
                        
                        {/* Bottom accent line */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </motion.div>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Thank You Message - Clean Design */}
          <ScrollReveal delay={0.7}>
            <motion.div
              className="mt-16 relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <div className="relative bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-2 border-primary/40 rounded-[2rem] p-12 md:p-16 text-center overflow-hidden shadow-2xl">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10 opacity-50" />
                
                {/* Floating orbs */}
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                
                <div className="relative z-10">
                  <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Thank you for trusting <span className="gradient-text">Yatri Cloud</span>
                  </h3>
                  <p className="text-xl md:text-2xl text-muted-foreground">
                    Let's get you certified!
                  </p>
                </div>
                
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default CertificationFlowSection;
