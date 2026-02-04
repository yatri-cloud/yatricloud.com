import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Loader2, Plus, Upload, RefreshCw, Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getUserCertifications, getStoredUser } from "@/lib/yatris-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/ThemeProvider";

// Base URL for certification logos
const LOGO_BASE_URL = "https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications";

// Provider logos mapping
const PROVIDER_LOGOS: Record<string, { logo: string; logoLight?: string }> = {
  aws: { logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  azure: { logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  gcp: { logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  github: { logo: `${LOGO_BASE_URL}/github-white-icon.webp`, logoLight: `${LOGO_BASE_URL}/github-white-icon.webp` },
  oracle: { logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  salesforce: { logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  servicenow: { logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
};

const ManageCertifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [userCertifications, setUserCertifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/certifiedyatris");
      return;
    }
    setUser(storedUser);

    // Load certifications (handles cache internally)
    loadCertifications();

    // Listen for storage events to update when cache changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('yatris_user_certifications_') && e.key.includes(storedUser.email)) {
        if (e.newValue) {
          try {
            const certs = JSON.parse(e.newValue);
            setUserCertifications(certs);
            setIsLoading(false);
          } catch (error) {
            console.warn("Error parsing updated cache:", error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events for same-tab updates
    const handleCacheUpdate = (e: CustomEvent) => {
      if (e.detail && Array.isArray(e.detail)) {
        setUserCertifications(e.detail);
        setIsLoading(false);
      }
    };

    window.addEventListener('certificationsUpdated', handleCacheUpdate as EventListener);

    // Poll for cache updates every 3 seconds for real-time updates
    const pollInterval = setInterval(() => {
      const cacheKey = `yatris_user_certifications_${storedUser.email}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const certs = JSON.parse(cachedData);
          if (certs && Array.isArray(certs)) {
            setUserCertifications(certs);
            setIsLoading(false);
          }
        } catch (error) {
          // Ignore parse errors
        }
      }
    }, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('certificationsUpdated', handleCacheUpdate as EventListener);
      clearInterval(pollInterval);
    };
  }, [navigate]);


  const loadCertifications = async () => {
    try {
      setIsLoading(true);
      setHasLoadedOnce(false); // Reset flag when starting new load

      const storedUser = getStoredUser();
      if (!storedUser?.email) {
        setIsLoading(false);
        setHasLoadedOnce(true);
        return;
      }

      // First, try to load from cache for instant display
      const cacheKey = `yatris_user_certifications_${storedUser.email}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const cachedCerts = JSON.parse(cachedData);
          if (cachedCerts && Array.isArray(cachedCerts) && cachedCerts.length > 0) {
            // Show cached data immediately
            setUserCertifications(cachedCerts);
            setHasLoadedOnce(true);
            // Keep loading true to fetch fresh data
          }
        } catch (parseError) {
          // Ignore parse errors, continue to fetch
        }
      }

      // Always fetch fresh data
      const certs = await getUserCertifications();

      // Update with fresh data
      if (certs && Array.isArray(certs)) {
        setUserCertifications(certs);
        setHasLoadedOnce(true);

        // Dispatch event to update cache listeners
        window.dispatchEvent(new CustomEvent('certificationsUpdated', { detail: certs }));
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading certifications:", error);
      setIsLoading(false);
      setHasLoadedOnce(true);
      toast({
        title: "Error",
        description: "Failed to load certifications. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Group certifications by provider
  const groupedCerts = userCertifications.reduce((acc, cert) => {
    const provider = cert.certificationProvider?.toLowerCase() || "other";
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(cert);
    return acc;
  }, {} as Record<string, any[]>);

  const handleEditCertification = (cert: any) => {
    // Navigate to certification form with pre-filled data
    sessionStorage.setItem("editingCertification", JSON.stringify({
      certificationName: cert.certificationName,
      examCode: cert.examCode,
      certificationDate: cert.certificationDate,
      certificationProvider: cert.certificationProvider,
      verifiedCredential: cert.verifiedCredential || "",
      additionalNotes: cert.additionalNotes || "",
    }));

    navigate("/certifiedyatris");
  };

  const handleDeleteCertification = async (cert: any) => {
    if (!confirm("Are you sure you want to delete this certification?\n\nNote: This action cannot be undone.")) {
      return;
    }

    toast({
      title: "Delete Not Available",
      description: "Certification deletion requires updating the provider's Apps Script. Please contact support or resubmit with updated information.",
      variant: "destructive",
    });

    // Reload certifications
    await loadCertifications();
  };

  const providerLabels: Record<string, string> = {
    aws: "AWS",
    azure: "Azure",
    gcp: "Google Cloud",
    github: "GitHub",
    oracle: "Oracle",
    salesforce: "Salesforce",
    servicenow: "ServiceNow",
    other: "Other",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO />
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="max-w-6xl mx-auto">
            {/* Header with Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl mb-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Manage Certifications</h1>
                  <p className="text-muted-foreground">
                    View and manage your certifications by provider
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/edit-profile")}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    onClick={() => navigate("/certifiedyatris?addNew=true")}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Add More Certifications
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Certifications Section */}
            <div>
              {isLoading && !hasLoadedOnce ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="ml-4 text-muted-foreground">Loading certifications...</p>
                </div>
              ) : !isLoading && hasLoadedOnce && userCertifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      No certifications submitted yet.
                    </p>
                    <Button onClick={() => navigate("/certifiedyatris?addNew=true")}>
                      Submit Certification
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedCerts).map(([provider, certs]) => {
                    const providerLogo = PROVIDER_LOGOS[provider];
                    return (
                      <Card key={provider}>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            {providerLogo && (
                              <img
                                src={
                                  providerLogo.logo.includes('github-white-icon')
                                    ? (theme === 'dark' ? providerLogo.logo : (providerLogo.logoLight || providerLogo.logo))
                                    : (theme === 'dark' && providerLogo.logoLight ? providerLogo.logoLight : providerLogo.logo)
                                }
                                alt={providerLabels[provider] || provider}
                                className={`h-8 w-auto object-contain ${providerLogo.logo.includes('github-white-icon') && theme === 'light'
                                  ? 'invert'
                                  : ''
                                  } ${providerLogo.logo.includes('Oracle') || providerLogo.logo.includes('ServiceNow')
                                    ? 'max-w-[80px]'
                                    : ''
                                  }`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <CardTitle>
                                {providerLabels[provider] || provider.toUpperCase()} Certifications
                              </CardTitle>
                              <CardDescription>
                                {certs.length} certification{certs.length !== 1 ? "s" : ""}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {certs.map((cert) => (
                              <div
                                key={cert.id}
                                className="p-4 border border-border rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h4 className="font-semibold text-lg">
                                          {cert.certificationName}
                                        </h4>
                                        {cert.verifiedCredential && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 mt-1">
                                            Verified
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">Exam Code:</span>
                                        {cert.examCode}
                                      </div>

                                      {cert.certificationDate && (
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4" />
                                          <span className="font-medium text-foreground">Date:</span>
                                          {new Date(cert.certificationDate).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </div>
                                      )}

                                      {cert.verifiedCredential && (
                                        <div className="md:col-span-2">
                                          <span className="font-medium text-foreground">Credential: </span>
                                          <a
                                            href={cert.verifiedCredential}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline break-all"
                                          >
                                            {cert.verifiedCredential}
                                          </a>
                                        </div>
                                      )}

                                      {cert.additionalNotes && (
                                        <div className="md:col-span-2 mt-2 p-2 bg-background rounded border border-border/50 text-xs">
                                          <span className="font-semibold block mb-1">Notes:</span>
                                          {cert.additionalNotes}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex md:flex-col gap-2 shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditCertification(cert)}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ManageCertifications;
