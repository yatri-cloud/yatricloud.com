import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowUpRight } from "lucide-react";
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
    <section id="faq" className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-start">
          {/* LEFT — sticky large-type panel */}
          <div className="lg:sticky lg:top-24">
            <ScrollReveal direction="right">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-5 block">
                FAQ
              </span>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.02] mb-6">
                Certification
                <br className="hidden sm:block" />{" "}
                Process{" "}
                <span className="gradient-text">Questions</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md mb-8">
                Everything you need to know about getting certified with Yatri Cloud.
              </p>

              {/* Still have questions? — CTA */}
              <div className="pt-6 border-t border-border max-w-md">
                <p className="text-foreground font-semibold text-lg mb-3">
                  Still have questions?
                </p>
                <a
                  href="#schedule-meeting"
                  className="group inline-flex items-center gap-2 min-h-[44px] text-primary font-semibold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors hover:text-brand-600"
                >
                  <span>Book a scheduling meeting</span>
                  <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* RIGHT — accordion */}
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              const panelId = `faq-panel-${index}`;
              const buttonId = `faq-button-${index}`;
              return (
                <ScrollReveal key={index} delay={index * 0.05}>
                  <div
                    className={`border rounded-xl transition-colors duration-300 ${
                      isOpen
                        ? "border-primary/50 bg-card"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <button
                      id={buttonId}
                      className="w-full min-h-[44px] p-5 md:p-6 flex items-center justify-between text-left gap-5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span
                        className={`font-display text-lg md:text-xl font-semibold tracking-[-0.01em] transition-colors ${
                          isOpen ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {faq.question}
                      </span>
                      <motion.span
                        aria-hidden="true"
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={`flex-shrink-0 grid place-items-center w-9 h-9 rounded-full border transition-colors ${
                          isOpen
                            ? "border-primary/40 bg-primary/10"
                            : "border-border bg-secondary"
                        }`}
                      >
                        <Plus className="w-5 h-5 text-primary" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 md:px-6 pb-6">
                            <div className="h-px bg-border mb-5" />
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
                              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-[68ch]">
                                {faq.answer}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
