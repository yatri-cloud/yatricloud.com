import Navbar from "@/components/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import CurriculumSection from "@/components/sections/CurriculumSection";
import { LatestExamDumpsSection } from "@/components/sections/LatestExamDumpsSection";
import CertificationFlowSection from "@/components/sections/CertificationFlowSection";
import { IndustryLeadersSection } from "@/components/sections/IndustryLeadersSection";
import { RecognitionsSection } from "@/components/sections/RecognitionsSection";
import InstructorSection from "@/components/sections/InstructorSection";
import { TrustSection } from "@/components/TrustSection";
import { HomeReviewsSection } from "@/components/sections/HomeReviewsSection";
import { VoucherPromoSection } from "@/components/sections/VoucherPromoSection";
import FAQSection from "@/components/sections/FAQSection";
import CommunitySection from "@/components/sections/CommunitySection";
import { ContactSection } from "@/components/sections/ContactSection";
import { QuickAccessSection } from "@/components/sections/QuickAccessSection";
import { YatrisWorldwideSection } from "@/components/sections/YatrisWorldwideSection";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Yatri Cloud · 50% OFF Cloud Certification Vouchers"
        description="Free AWS practice tests, verified exam dumps and 50% OFF certification vouchers for AWS, Azure, GCP and Kubernetes. Trusted by 50K+ learners."
      />
      <div className="noise-overlay" />
      <Navbar />
      {/* Flow follows the buying journey: promise (hero) → instant access
          (launchpad) → proof (trust) → process → offer → product → authority
          → belief (reviews + worldwide) → objections (FAQ) → belonging
          (community) → contact. */}
      <main>
        <HeroSection />
        <QuickAccessSection />
        <TrustSection />
        <CertificationFlowSection />
        <VoucherPromoSection />
        <CurriculumSection />
        <LatestExamDumpsSection />
        <IndustryLeadersSection />
        <InstructorSection />
        <HomeReviewsSection />
        <YatrisWorldwideSection />
        <RecognitionsSection />
        <FAQSection />
        <CommunitySection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;