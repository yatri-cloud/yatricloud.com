import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Briefcase, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { CertificationForm } from "@/components/certified-yatris/CertificationForm";
import { fetchCertifications } from "@/lib/google-sheets";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";

interface CertificationEntry {
  id: string;
  fullName: string;
  certificationProvider: string;
  certificationDate: string;
}

const CertifiedYatris = () => {
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCertifications();
  }, []);

  const loadCertifications = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCertifications();
      setCertifications(data);
    } catch (error) {
      console.error("Error loading certifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from actual data
  const totalCertifications = certifications.length;
  const uniqueProviders = new Set(certifications.map((c) => c.certificationProvider)).size;
  const thisMonth = certifications.filter((c) => {
    const certDate = new Date(c.certificationDate);
    const now = new Date();
    return certDate.getMonth() === now.getMonth() && certDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO />
      <div className="noise-overlay" />
      <Navbar />
      
      <main>
      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="inline-flex items-center justify-center mb-6"
              >
                <img
                  src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/All/yatri-certified.png"
                  alt="Yatri Cloud"
                  className="w-auto h-20 md:h-28 object-contain"
                />
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Share Your <span className="gradient-text">Achievement</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Celebrate your certification success with the Yatri Cloud community
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Form Section */}
      <section className="pt-4 pb-12">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CertificationForm />
          </motion.div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
};

export default CertifiedYatris;

