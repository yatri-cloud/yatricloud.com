import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const faqs = [
  { 
    question: "Step 1: How do I complete my registration?", 
    answer: "To complete your registration, simply make your payment through our payment link. This is the first step to get started with the certification process. Once your payment is confirmed, you'll proceed to the next step of joining our WhatsApp group." 
  },
  { 
    question: "Step 2: Why is joining the WhatsApp group mandatory?", 
    answer: "Joining the WhatsApp group is mandatory because it's used for exam scheduling coordination, important updates, and direct support from our team. This group ensures smooth communication throughout your certification journey and allows us to coordinate your exam scheduling effectively." 
  },
  { 
    question: "Step 3: How does the exam scheduling process work?", 
    answer: "Our team will schedule your exam during a meeting call. We'll arrange the call and finalize the date and time together to ensure correct exam selection. We handle everything for you to make the process smooth and error-free." 
  },
  { 
    question: "Which AWS Associate exams are eligible for the 50% OFF discount?", 
    answer: "We offer 50% OFF on the following AWS Associate exams: AWS Cloud Practitioner, AWS AI Practitioner, AWS Certified Solutions Architect – Associate (SAA-C03), AWS Certified Developer – Associate (DVA-C02), AWS Certified CloudOps Engineer – Associate (SOA-C03), AWS Certified Data Engineer – Associate (DEA-C01), and AWS Certified Machine Learning Engineer – Associate (MLA-C01)." 
  },
  { 
    question: "What bonus features are included with my certification?", 
    answer: "When you complete the certification process with us, you'll receive the following bonus features (available from 01/01/2026): Exam Dumps, Study Resources and materials, Exam Guide, and Personal Support for doubt. These resources are designed to help you prepare effectively and pass your exam with confidence." 
  },
  { 
    question: "What happens after I make the payment?", 
    answer: "After payment confirmation, you'll need to join our mandatory WhatsApp group using the provided link. Once you're in the group, our team will contact you to arrange a meeting call. During this call, we'll schedule your exam, finalize the date and time, and ensure everything is set up correctly. You'll also receive all the study resources and exam dumps you need." 
  },
  { 
    question: "Can I schedule my exam without joining the WhatsApp group?", 
    answer: "No, joining the WhatsApp group is mandatory. This group is essential for exam scheduling coordination, receiving important updates, and getting direct support from our team. We use this group to communicate with you and arrange the meeting call for exam scheduling." 
  },
  { 
    question: "How long does the entire certification process take?", 
    answer: "The process is straightforward: Step 1 (Payment) can be completed immediately, Step 2 (Joining WhatsApp group) takes just a few minutes, and Step 3 (Exam scheduling) happens during a meeting call that our team arranges. The timeline depends on your availability for the scheduling meeting, but we work to make it as quick as possible." 
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
                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                          {faq.answer}
                        </p>
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