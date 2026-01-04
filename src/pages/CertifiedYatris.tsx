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
      <section className="relative pt-32 md:pt-40 pb-20 overflow-hidden">
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
                  src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
                  alt="Yatri Cloud"
                  className="w-24 h-24"
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

          {/* Stats - Dynamic from actual data */}
          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/5 border border-amber-500/20 rounded-2xl p-6 text-center backdrop-blur-sm hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BadgeCheck className="w-8 h-8 text-amber-500" strokeWidth={2.5} />
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  {isLoading ? "..." : totalCertifications}
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Achievements</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-violet-500/5 border border-purple-500/20 rounded-2xl p-6 text-center backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-8 h-8 text-purple-500" strokeWidth={2.5} />
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                  {isLoading ? "..." : uniqueProviders}
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Certification Providers</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-green-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center backdrop-blur-sm hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-emerald-500" strokeWidth={2.5} />
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-clip-text text-transparent">
                  {isLoading ? "..." : thisMonth}
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">This Month</div>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
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

