import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Linkedin, Award, Sparkles, Trophy } from "lucide-react";
import { fetchCertifications } from "@/lib/google-sheets";
import ScrollReveal from "@/components/ScrollReveal";

interface CertificationEntry {
  id: string;
  fullName: string;
  email: string;
  certificationProvider: string;
  certificationName: string;
  examCode: string;
  certificationDate: string;
  linkedinUrl: string;
  photoUrl: string;
  additionalNotes?: string;
}

export const AchievementsSection = () => {
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");

  useEffect(() => {
    loadCertifications();
  }, []);

  const loadCertifications = async () => {
    // Load from cache immediately for instant display
    const cacheKey = 'yatri_certifications_cache';
    const cacheTimestampKey = 'yatri_certifications_cache_timestamp';
    const cacheMaxAge = 5 * 60 * 1000; // 5 minutes
    
    try {
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
      
      if (cachedData && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp, 10);
        if (age < cacheMaxAge) {
          const parsedData = JSON.parse(cachedData);
          setCertifications(parsedData);
          setIsLoading(false); // Show cached data immediately
          console.log("📊 Loaded certifications from cache:", parsedData.length);
        }
      }
    } catch (error) {
      console.warn("⚠️ Error loading from cache:", error);
    }

    // Fetch fresh data in the background
    try {
      const data = await fetchCertifications();
      setCertifications(data);
      
      // Cache the fresh data
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
      } catch (cacheError) {
        console.warn("⚠️ Error caching data:", cacheError);
      }
    } catch (error) {
      console.error("Error loading certifications:", error);
      // Only show loading error if we don't have cached data
      if (certifications.length === 0) {
        setIsLoading(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Group certifications by provider
  const groupedByProvider = certifications.reduce((acc, cert) => {
    const provider = cert.certificationProvider.toUpperCase();
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(cert);
    return acc;
  }, {} as Record<string, CertificationEntry[]>);

  // Get unique providers
  const providers = Object.keys(groupedByProvider).sort();

  // Filter based on selected provider
  const displayGroups = selectedProvider === "all" 
    ? groupedByProvider 
    : { [selectedProvider]: groupedByProvider[selectedProvider] || [] };

  if (isLoading) {
    return (
      <section id="achievements" className="py-24 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading achievements...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="achievements" className="py-24 relative">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6"
            >
              <Trophy className="w-10 h-10 text-primary" />
            </motion.div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Our <span className="gradient-text">Achievements</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Celebrating the success of our certified Yatris (In Testing Mode)
            </p>
          </div>
        </ScrollReveal>

        {/* Provider Filter */}
        {providers.length > 1 && (
          <ScrollReveal delay={0.1}>
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-muted rounded-xl p-1 border border-border">
                <button
                  onClick={() => setSelectedProvider("all")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedProvider === "all"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({certifications.length})
                </button>
                {providers.map((provider) => (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      selectedProvider === provider
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {provider} ({groupedByProvider[provider]?.length || 0})
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Achievements by Category */}
        {certifications.length === 0 ? (
          <ScrollReveal delay={0.2}>
            <div className="text-center py-24">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No achievements yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your certification success!
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="space-y-12">
            {Object.entries(displayGroups).map(([provider, certs], groupIndex) => (
              <ScrollReveal key={provider} delay={0.1 + groupIndex * 0.1}>
                <div>
                  {/* Provider Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{provider} Certifications</h3>
                      <p className="text-sm text-muted-foreground">
                        {certs.length} {certs.length === 1 ? "achievement" : "achievements"}
                      </p>
                    </div>
                  </div>

                  {/* Achievements Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certs.map((cert, index) => (
                      <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -5 }}
                        className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all shadow-lg hover:shadow-xl"
                      >
                        {/* Photo and Name */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative">
                            <img
                              src={cert.photoUrl || "https://via.placeholder.com/80"}
                              alt={cert.fullName}
                              className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/80";
                              }}
                            />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                              <Award className="w-3.5 h-3.5 text-primary-foreground" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-foreground">{cert.fullName}</h4>
                            <a
                              href={cert.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                            >
                              <Linkedin className="w-4 h-4" />
                              LinkedIn
                            </a>
                          </div>
                        </div>

                        {/* Certification Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" />
                            <span className="font-medium text-foreground text-sm line-clamp-2">
                              {cert.certificationName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">
                              {cert.examCode}
                            </span>
                            <span className="px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground">
                              {cert.certificationProvider.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Additional Notes */}
                        {cert.additionalNotes && (
                          <div className="pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground italic line-clamp-2">
                              "{cert.additionalNotes}"
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

