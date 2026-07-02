import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const faqs = [
  { question: "Are the practice tests really free?", answer: "Yes! All our practice tests are 100% free forever. No payment, no signup required. Just start practicing immediately." },
  { question: "Do I need to create an account?", answer: "No, you don't need to sign up or create an account. You can access all practice tests instantly without any registration." },
  { question: "How often are the practice tests updated?", answer: "We update our practice tests weekly to ensure they align with the latest certification exam patterns and difficulty levels." },
  { question: "Which certifications are covered?", answer: "We cover AWS and Azure certifications, including associate-level and professional-level exams. New certifications are added regularly." },
  { question: "Can I use these for exam preparation?", answer: "Absolutely! Our practice tests are designed by certified cloud professionals and mirror actual certification exam patterns to help you ace your exam." },
];

export const FAQSection = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">FAQ</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Common <span className="gradient-text">Questions</span></h2>
          </div>
        </ScrollReveal>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <ScrollReveal key={index} delay={index * 0.05}>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <button className="w-full p-5 flex items-center justify-between text-left" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <span className="font-semibold text-foreground">{faq.question}</span>
                  <motion.div animate={{ rotate: openFaq === index ? 180 : 0 }}><ChevronDown className="w-5 h-5 text-muted-foreground" /></motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }}>
                      <p className="px-5 pb-5 text-muted-foreground">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;