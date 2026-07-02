import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowUpRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { useSiteContent, getFaqs, FALLBACK_FAQS } from "@/lib/site-content";

export const FAQSection = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* FAQs come from Supabase (seeded identical to the fallback list). */
  const faqs = useSiteContent(getFaqs, FALLBACK_FAQS);

  /* FAQPage structured data for search engines — built from the same list. */
  const faqJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text:
          faq.answer === "list" && faq.listItems
            ? faq.listItems.join(", ")
            : faq.answer,
      },
    })),
  });

  return (
    <section id="faq" className="py-20 md:py-28 bg-background overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqJsonLd }}
      />
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
