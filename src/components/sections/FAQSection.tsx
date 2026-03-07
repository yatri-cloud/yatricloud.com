import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const faqs = [
  {
    question: "Step 1: How do I schedule my exam meeting?",
    answer: "To schedule your certification processing meeting, simply select a suitable time slot and book a meet through our Calendly widget on the website. This is the first step to get started with the certification process."
  },
  {
    question: "Step 2: What happens during the scheduling meeting?",
    answer: "During the meeting call, our team will coordinate with you to start processing your exam scheduling ahead. We'll finalize the date and time together to ensure correct exam selection. We handle everything for you to make the process smooth and error-free."
  },
  {
    question: "Is there still a WhatsApp group requirement?",
    answer: "No, we have streamlined our process! You no longer need to join a WhatsApp group beforehand. Simply schedule a meeting directly through our Calendly widget at your convenience to get started."
  },
  {
    question: "Which AWS Associate exams are eligible for the 50% OFF discount?",
    answer: "list",
    listItems: [
      "AWS Cloud Practitioner",
      "AWS AI Practitioner",
      "AWS Certified Solutions Architect – Associate (SAA-C03)",
      "AWS Certified Developer – Associate (DVA-C02)",
      "AWS Certified CloudOps Engineer – Associate (SOA-C03)",
      "AWS Certified Data Engineer – Associate (DEA-C01)",
      "AWS Certified Machine Learning Engineer – Associate (MLA-C01)"
    ]
  },
  {
    question: "What bonus features are included with my certification?",
    answer: "These benefits are available only after getting 50% OFF. You'll receive: 50% OFF Vouchers, Exam Dumps & Resources, Udemy Course Free Access, Topmate Free Connect with Yatharth & Nensi, and LinkedIn Recommendation. These resources are designed to help you prepare effectively and pass your exam with confidence."
  },
  {
    question: "What happens after I schedule the meet?",
    answer: "Once you book a slot through our Calendly widget, you will receive a calendar invitation. Please join the meeting at the scheduled time where our team will help you finalize your exam date, ensure everything is set up correctly, and process your certification request."
  },
  {
    question: "How long does the entire certification process take?",
    answer: "The process is straightforward: Simply book a meeting slot (takes just a minute!), and attend the short meeting where we schedule your exam. The timeline depends entirely on your availability for the scheduling meeting, but we work to make it as quick as possible."
  },
];

export const FAQSection = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="faq" className="py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">FAQ</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Certification Process <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to know about getting certified with Yatri Cloud
            </p>
          </div>
        </ScrollReveal>
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <ScrollReveal key={index} delay={index * 0.08}>
              <motion.div
                className="group relative bg-gradient-to-br from-card via-card/98 to-card/95 border-2 border-border/60 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-500 shadow-xl"
                whileHover={{ y: -4, scale: 1.01 }}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <button
                  className="w-full p-6 md:p-8 flex items-center justify-between text-left relative z-10"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-bold text-lg md:text-xl text-foreground pr-8 group-hover:text-primary transition-colors">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <ChevronDown className="w-5 h-5 text-primary" />
                    </div>
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative z-10"
                    >
                      <div className="px-6 md:px-8 pb-6 md:pb-8">
                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
                        {faq.answer === "list" && faq.listItems ? (
                          <div className="text-muted-foreground text-base md:text-lg leading-relaxed">
                            <p className="mb-4">We offer 50% OFF on the following AWS Associate exams:</p>
                            <ul className="space-y-2 list-none">
                              {faq.listItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                            {faq.answer}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;