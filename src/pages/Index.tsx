import Navbar from "@/components/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import CurriculumSection from "@/components/sections/CurriculumSection";
import { LatestExamDumpsSection } from "@/components/sections/LatestExamDumpsSection";
import CertificationFlowSection from "@/components/sections/CertificationFlowSection";
import InstructorSection from "@/components/sections/InstructorSection";
import { TrustSection } from "@/components/TrustSection";
import { HomeReviewsSection } from "@/components/sections/HomeReviewsSection";
import { VoucherPromoSection } from "@/components/sections/VoucherPromoSection";
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
        <CertificationFlowSection />
        <CurriculumSection />
        <LatestExamDumpsSection />
        <TrustSection />
        <VoucherPromoSection />
        <HomeReviewsSection />
        <InstructorSection />
        <FAQSection />
        <CommunitySection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;