import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, MessageCircle, Calendar, CreditCard, Users } from "lucide-react";
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
  "Exam Dumps",
  "Study Resources and materials",
  "Exam Guide",
  "Personal Support for doubt",
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
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Get Certified with Yatri Cloud
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Your Path to <span className="gradient-text">AWS Certification</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Follow these simple steps to get your AWS Associate certification with our support
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-5xl mx-auto">
          {/* Eligible Exams */}
          <ScrollReveal delay={0.1}>
            <div className="bg-gradient-to-br from-card via-card/95 to-card/90 border-2 border-border/60 rounded-3xl p-8 md:p-10 mb-8 hover:border-primary/40 transition-all duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-primary/10">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Eligible AWS Associate Exams</h3>
              </div>
              <ul className="space-y-3">
                {eligibleExams.map((exam, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <span className="text-primary mt-1.5">•</span>
                    <span className="text-base leading-relaxed">{exam}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Bonus Features */}
          <ScrollReveal delay={0.2}>
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 rounded-3xl p-8 md:p-10 mb-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-primary/20">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Bonus Features</h3>
                  <span className="ml-auto px-4 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-semibold">
                    Available from 01/01/2026
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  {bonusFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/40 hover:border-primary/40 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <ScrollReveal key={index} delay={0.3 + index * 0.1}>
                <motion.div
                  className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border-2 border-border/60 rounded-3xl p-8 md:p-10 overflow-hidden hover:border-primary/40 transition-all duration-500"
                  whileHover={{ y: -4, scale: 1.01 }}
                >
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:bg-primary/10 transition-colors duration-500 blur-2xl" />
                  
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Step Number */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-primary/10">
                          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            {step.number}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <step.icon className="w-6 h-6 text-primary" />
                          <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {step.title}
                            {step.action?.mandatory && (
                              <span className="ml-3 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                                Mandatory
                              </span>
                            )}
                          </h3>
                        </div>
                        
                        <div className="h-1.5 w-20 bg-gradient-to-r from-primary via-primary/50 to-primary/0 rounded-full mb-4 group-hover:w-28 transition-all duration-500" />
                        
                        <p className="text-muted-foreground text-base leading-relaxed mb-6">
                          {step.description}
                        </p>

                        {/* Action Button */}
                        {step.action && (
                          <motion.a
                            href={step.action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="group/btn relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 overflow-hidden"
                          >
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                            
                            <span className="relative z-10">{step.action.label}</span>
                            <ExternalLink className="relative z-10 w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                            
                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover/btn:bg-primary/20 blur-xl transition-all duration-300" />
                          </motion.a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.div>
              </ScrollReveal>
            ))}
          </div>

          {/* Thank You Message */}
          <ScrollReveal delay={0.6}>
            <motion.div
              className="mt-12 text-center p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Thank you for trusting <span className="gradient-text">Yatri Cloud</span>
              </h3>
              <p className="text-lg text-muted-foreground">
                Let's get you certified! 🚀
              </p>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default CertificationFlowSection;

