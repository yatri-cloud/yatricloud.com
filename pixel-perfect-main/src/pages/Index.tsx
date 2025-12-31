import Navbar from "@/components/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import PainPointsSection from "@/components/sections/PainPointsSection";
import CurriculumSection from "@/components/sections/CurriculumSection";
import PricingSection from "@/components/sections/PricingSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import InstructorSection from "@/components/sections/InstructorSection";
import FAQSection from "@/components/sections/FAQSection";
import FinalCTASection from "@/components/sections/FinalCTASection";
import Footer from "@/components/sections/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="noise-overlay" />
      <Navbar />
      <main>
        <HeroSection />
        <PainPointsSection />
        <CurriculumSection />
        <PricingSection />
        <TestimonialsSection />
        <InstructorSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;