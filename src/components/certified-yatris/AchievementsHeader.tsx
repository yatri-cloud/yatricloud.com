import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Linkedin, Calendar, Award, Sparkles } from "lucide-react";
import { fetchCertifications } from "@/lib/google-sheets";

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

export const AchievementsHeader = () => {
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Calculate stats from actual data
  const totalCertifications = certifications.length;
  const uniqueProviders = new Set(certifications.map((c) => c.certificationProvider)).size;
  const thisMonth = certifications.filter((c) => {
    const certDate = new Date(c.certificationDate);
    const now = new Date();
    return certDate.getMonth() === now.getMonth() && certDate.getFullYear() === now.getFullYear();
  }).length;

  // Don't show header if no data or loading
  if (isLoading || totalCertifications === 0) {
    return null;
  }

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-40">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold text-foreground">
                {totalCertifications} {totalCertifications === 1 ? "Achievement" : "Achievements"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {uniqueProviders} {uniqueProviders === 1 ? "Provider" : "Providers"}
              </span>
            </div>
            {thisMonth > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">
                  {thisMonth} This Month
                </span>
              </div>
            )}
          </div>

          {/* Recent Achievements */}
          {certifications.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              {certifications.slice(0, 5).map((cert, index) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 min-w-fit"
                >
                  <div className="relative">
                    <img
                      src={cert.photoUrl || "https://via.placeholder.com/32"}
                      alt={cert.fullName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/32";
                      }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                      <Award className="w-1.5 h-1.5 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground leading-tight">
                      {cert.fullName.split(" ")[0]}
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {cert.examCode}
                    </span>
                  </div>
                </motion.div>
              ))}
              {certifications.length > 5 && (
                <div className="text-xs text-muted-foreground px-2">
                  +{certifications.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

