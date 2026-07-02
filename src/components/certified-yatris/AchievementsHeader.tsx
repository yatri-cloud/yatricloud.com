import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Award, Trophy, Building2 } from "lucide-react";
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
  const prefersReducedMotion = useReducedMotion();

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
    <div className="border-b border-brand-100 bg-white/70 backdrop-blur-md sticky top-16 z-40">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Live Wall of Fame stats — real, honest counts */}
          <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" strokeWidth={2.5} />
              <span className="text-sm font-semibold font-display text-foreground tabular-nums">
                {totalCertifications} {totalCertifications === 1 ? "Yatri win" : "Yatri wins"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground tabular-nums">
                {uniqueProviders} {uniqueProviders === 1 ? "cloud provider" : "cloud providers"}
              </span>
            </div>
            {thisMonth > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-muted-foreground tabular-nums">
                  {thisMonth} celebrated this month
                </span>
              </div>
            )}
          </div>

          {/* Freshly certified Yatris — real faces */}
          {certifications.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              <span className="hidden sm:inline text-xs font-medium uppercase tracking-wide text-primary/70 min-w-fit">
                Just certified
              </span>
              {certifications.slice(0, 5).map((cert, index) => (
                <motion.div
                  key={cert.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : index * 0.08 }}
                  className="flex items-center gap-2 min-w-fit"
                >
                  <div className="relative">
                    <img
                      src={cert.photoUrl || "https://via.placeholder.com/32"}
                      alt={`${cert.fullName}, certified Yatri`}
                      className="w-8 h-8 rounded-full object-cover border-2 border-brand-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/32";
                      }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                      <Award className="w-1.5 h-1.5 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground leading-tight">
                      {cert.fullName.split(" ")[0]}
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {cert.examCode}
                    </span>
                  </div>
                </motion.div>
              ))}
              {certifications.length > 5 && (
                <div className="text-xs font-medium text-primary px-2 min-w-fit">
                  +{certifications.length - 5} more Yatris
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

