import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Briefcase, Zap, LogOut, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { CertificationForm } from "@/components/certified-yatris/CertificationForm";
import { LoginSignup } from "@/components/certified-yatris/LoginSignup";
import { UserActionChoice } from "@/components/certified-yatris/UserActionChoice";
import { fetchCertifications } from "@/lib/google-sheets";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { isAuthenticated, getStoredUser, getCurrentUser, logout as logoutUser } from "@/lib/yatris-api";
import { Button } from "@/components/ui/button";

interface CertificationEntry {
  id: string;
  fullName: string;
  certificationProvider: string;
  certificationDate: string;
}

const CertifiedYatris = () => {
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  // Default to showing choice when logged in
  const [showChoice, setShowChoice] = useState(true);

  useEffect(() => {
    checkAuthentication();
    loadCertifications();
  }, []);

  const checkAuthentication = async () => {
    setCheckingAuth(true);
    try {
      // Always check stored user first (persistent login)
      const storedUser = getStoredUser();
      const token = localStorage.getItem('yatris_token');

      if (storedUser && token) {
        // User is logged in, verify token is still valid
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            // Token expired, but keep user logged in with stored data
            setUser(storedUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          // If API call fails, still use stored user (persistent login)
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // On error, try to use stored user
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } finally {
      setCheckingAuth(false);
    }
  };

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

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowChoice(true); // Show choice after fresh login
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
    setShowChoice(false);
  };

  // Show login/signup if not authenticated
  if (!isAuthenticated && !checkingAuth) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO />
        <Navbar />
        <LoginSignup onSuccess={handleLoginSuccess} />
        <Footer />
      </div>
    );
  }

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated and showing choice
  if (isAuthenticated && showChoice) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO />
        <Navbar />
        <div className="pt-20">
          <UserActionChoice
            userFullName={user?.fullName || 'Yatri'}
            onShareAchievement={() => setShowChoice(false)}
          />
        </div>
        <Footer />
      </div>
    );
  }

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

                {/* User Info & Logout */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-4 mb-6"
                  >
                    <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-lg">
                      <User className="w-5 h-5 text-primary" />
                      <span className="font-semibold">{user.fullName}</span>
                      <span className="text-muted-foreground">({user.email})</span>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </motion.div>
                )}
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
              <CertificationForm user={user} />
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CertifiedYatris;

