import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const faqs = [
  { question: "Will I get all resources and exam dumps after scheduling my exam with you?", answer: "Yes! When you schedule your certification exam with us, you'll receive comprehensive exam dumps, study resources, exam guides, and personal support to help you prepare effectively and pass your exam with confidence. All bonus features are available from 01/01/2026." },
  { question: "Which AWS Associate exams are eligible for the 50% OFF discount?", answer: "We offer 50% OFF on the following AWS Associate exams: AWS Cloud Practitioner, AWS AI Practitioner, AWS Certified Solutions Architect – Associate (SAA-C03), AWS Certified Developer – Associate (DVA-C02), AWS Certified CloudOps Engineer – Associate (SOA-C03), AWS Certified Data Engineer – Associate (DEA-C01), and AWS Certified Machine Learning Engineer – Associate (MLA-C01)." },
  { question: "How does the exam scheduling process work?", answer: "After you complete your payment and join our WhatsApp group, our team will arrange a meeting call with you. During this call, we'll schedule your exam, finalize the date and time, and ensure the correct exam is selected. This process helps avoid any mistakes and ensures everything is set up correctly." },
  { question: "Is joining the WhatsApp group mandatory?", answer: "Yes, joining the WhatsApp group is mandatory. This group is used for exam scheduling coordination, important updates, and direct support from our team. It's essential for smooth communication throughout your certification journey." },
  { question: "What happens after I make the payment?", answer: "After payment confirmation, you'll receive instructions to join our WhatsApp group. Once you're in the group, our team will contact you to arrange a meeting call where we'll schedule your exam and provide you with all the study resources and exam dumps you need." },
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