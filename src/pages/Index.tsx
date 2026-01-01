import Navbar from "@/components/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import PainPointsSection from "@/components/sections/PainPointsSection";
import CurriculumSection from "@/components/sections/CurriculumSection";
import PricingSection from "@/components/sections/PricingSection";
import CertificationFlowSection from "@/components/sections/CertificationFlowSection";
import InstructorSection from "@/components/sections/InstructorSection";
import { TrustSection } from "@/components/TrustSection";
import FAQSection from "@/components/sections/FAQSection";
import CommunitySection from "@/components/sections/CommunitySection";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO />
      <div className="noise-overlay" />
      <Navbar />
      <main>
        <HeroSection />
        <CurriculumSection />
        <PainPointsSection />
        <TrustSection />
        <PricingSection />
        <CertificationFlowSection />
        <InstructorSection />
        <FAQSection />
        <CommunitySection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;