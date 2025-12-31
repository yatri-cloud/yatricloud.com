import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import CountdownTimer from "@/components/CountdownTimer";

export const FinalCTASection = () => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Ace Your <span className="gradient-text">Certification</span>?</h2>
            <p className="text-lg text-muted-foreground mb-8">Join 50,000+ learners who've passed their certification exams with our free practice tests.</p>
            <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full px-6 py-3 mb-8">
              <span className="text-primary font-semibold">🔥 Limited Time Offer:</span>
              <CountdownTimer targetDate={targetDate} />
            </div>
            <div className="flex justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-lg glow-orange group">
                Get 50% OFF on Certification Vouchers
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FinalCTASection;