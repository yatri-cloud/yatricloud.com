import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  {
    text: "50% OFF Vouchers",
    description: "Get AWS Associate exam vouchers at half price - limited time offer",
    gradient: "from-blue-500/20 to-purple-500/20"
  },
  {
    text: "Exam Dumps & Resources",
    description: "Comprehensive exam dumps and study resources to help you prepare effectively",
    gradient: "from-purple-500/20 to-pink-500/20"
  },
  {
    text: "Udemy Course Free Access",
    description: "Get free access to our premium Udemy certification courses",
    gradient: "from-pink-500/20 to-orange-500/20"
  },
  {
    text: "Topmate Free Connect",
    description: "Free Topmate sessions with Yatharth Chauhan and Nensi Ravaliya for personalized guidance",
    gradient: "from-orange-500/20 to-yellow-500/20"
  },
  {
    text: "LinkedIn Recommendation",
    description: "Get a professional LinkedIn recommendation from us after certification",
    gradient: "from-yellow-500/20 to-green-500/20"
  },
  {
    text: "Yatri Wall of Fame",
    description: "Get featured on our Wall of Fame after successfully passing your AWS certification",
    gradient: "from-green-500/20 to-teal-500/20"
  },
];

const steps = [
  {
    number: 1,
    title: "Select Time",
    description: "Select a suitable time slot to schedule your meeting",
    gradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
    action: {
      label: "Book Now",
      isPopup: true,
      url: "#",
    },
  },
  {
    number: 2,
    title: "Book a Meet",
    description: "Confirm your booking through the Calendly widget below",
    gradient: "from-green-500/20 via-emerald-500/20 to-teal-500/20",
    action: null,
  },
  {
    number: 3,
    title: "Exam Scheduling",
    description: "We will start processing ahead to schedule the exam during our meeting",
    gradient: "from-purple-500/20 via-pink-500/20 to-rose-500/20",
    action: null,
  },
];

export const CertificationFlowSection = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
              Schedule a meeting at your suitable time to start the certification scheduling process
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

          {/* Bonus Features - Matching PricingSection UI */}
          <ScrollReveal delay={0.2}>
            <div id="benefits" className="mb-12 scroll-mt-20">
              {/* Header */}
              <div className="text-center mb-10">
                <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
                  Certification Package
                </span>
                <h3 className="text-3xl md:text-5xl font-bold mb-4">
                  What's <span className="gradient-text">Included</span>
                </h3>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  These benefits are available only after getting 50% OFF. Get everything you need to succeed with our comprehensive support package.
                </p>
              </div>

              {/* Individual Benefit Boxes */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {bonusFeatures.map((feature, index) => {
                  const [isFlipped, setIsFlipped] = React.useState(false);

                  return (
                    <ScrollReveal key={index} delay={0.2 + index * 0.15}>
                      <div
                        className="group relative h-full min-h-[320px] cursor-pointer"
                        onClick={() => setIsFlipped(!isFlipped)}
                        style={{ perspective: 1000 }}
                      >
                        <motion.div
                          className="w-full h-full relative"
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          {/* Front of card */}
                          <div
                            className="absolute inset-0 bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/60 hover:border-primary/40 rounded-3xl p-10 overflow-hidden text-left flex flex-col"
                            style={{ backfaceVisibility: "hidden" }}
                          >
                            {/* Animated gradient background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            {/* Decorative corner elements */}
                            <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-full -translate-x-20 -translate-y-20 group-hover:bg-primary/10 transition-colors duration-500 blur-xl" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 translate-y-16 group-hover:bg-primary/10 transition-colors duration-500 blur-xl" />

                            {/* Content */}
                            <div className="relative z-10 flex-1 flex flex-col h-full">
                              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-primary/10">
                                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{index + 1}</span>
                              </div>

                              <h4 className="text-2xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors duration-300">
                                {feature.text}
                              </h4>

                              <div className="h-1.5 w-20 bg-gradient-to-r from-primary via-primary/50 to-primary/0 rounded-full mt-auto group-hover:w-28 transition-all duration-500" />
                            </div>

                            {/* Bottom accent line */}
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          </div>

                          {/* Back of card */}
                          <div
                            className="absolute inset-0 bg-card border-2 border-primary/30 rounded-3xl p-8 shadow-xl flex flex-col justify-center text-center overflow-auto"
                            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                          >
                            <p className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">
                              {index === 0
                                ? "DURING MEET YOU WILL GET NOT AFTER:"
                                : index >= 4
                                  ? "IF YOU PASS EXAM AND POST ON LINKEDIN WITH TAGGING YATRI CLOUD AND TEAMMATES YOU WILL GET THESE BENEFITS:"
                                  : "AFTER SCHEDULING EXAM YOU WILL GET:"}
                            </p>
                            <p className="text-base md:text-lg text-foreground leading-relaxed font-medium">
                              {feature.description}
                            </p>
                            <div className="mt-6 text-xs text-muted-foreground flex items-center justify-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Click to flip back
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Steps - Enhanced Timeline Design */}
          <div className="relative pl-0 md:pl-20 mb-20">

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
                          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-card via-card to-card border-4 border-primary/40 flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative backdrop-blur-sm"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          {/* Solid background to cover the line */}
                          <div className="absolute inset-0 rounded-2xl bg-card" />
                          {/* Background circle behind number */}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10" />
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
                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-card via-card to-card border-4 border-primary/40 flex items-center justify-center shadow-lg backdrop-blur-sm">
                              {/* Solid background */}
                              <div className="absolute inset-0 rounded-2xl bg-card" />
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10" />
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
                              {/* Action required logic removed since no steps are mandatory in this new flow */}
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
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (step.action?.isPopup && window.Calendly) {
                                  window.Calendly.initPopupWidget({ url: 'https://calendly.com/yatricloud/40min' });
                                } else if (step.action?.url?.startsWith('#')) {
                                  const element = document.querySelector(step.action.url);
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }
                              }}
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

          {/* Calendly Widget Section */}
          <ScrollReveal delay={0.3}>
            <div id="schedule-meeting" className="relative mt-20 mb-12 scroll-mt-20">
              <div className="text-center mb-10">
                <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
                  Schedule Meeting
                </span>
                <h3 className="text-3xl md:text-5xl font-bold mb-4">
                  Let's Schedule Your <span className="gradient-text">Exam</span>
                </h3>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Select a suitable time slot and schedule a meeting with us. We will assist you with the complete exam scheduling process.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20 bg-card backdrop-blur-sm relative z-20"
              >
                <div
                  className="calendly-inline-widget w-full"
                  data-url="https://calendly.com/yatricloud/40min?hide_gdpr_banner=1"
                  style={{ minWidth: "320px", height: "700px" }}
                />
              </motion.div>
            </div>
          </ScrollReveal>

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
