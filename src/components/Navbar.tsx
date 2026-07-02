import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Settings, LogOut, Calendar, BookOpen, Info, List } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, getStoredUser, logout } from "@/lib/yatris-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check authentication on mount and when location changes
    const checkAuth = () => {
      if (isAuthenticated()) {
        const storedUser = getStoredUser();
        setUser(storedUser);
      } else {
        setUser(null);
      }
    };

    checkAuth();
    // Check auth when location changes
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#certification-process", label: "Get Certified" },
    { href: "#courses", label: "Practice Tests" },
    { href: "/training", label: "Training" },
    { href: "/examdumps", label: "Exam Dumps" },
    { href: "/events", label: "Events" },
    { href: "/community", label: "Community" },
    { href: "/partners", label: "Partners" },
    { href: "/achievements", label: "Achievements" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "glass-nav shadow-card"
          : "bg-transparent"
          }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20 gap-3 md:gap-6 flex-wrap">
            {/* Logo */}
            <a href="/" className="group flex items-center gap-2.5">
              <img
                src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
                alt="Yatri Cloud"
                className="h-8 w-8 transition-transform duration-300 ease-out-expo group-hover:scale-110 group-hover:rotate-6"
              />
              <span className="font-display text-xl font-bold tracking-tight text-foreground">Yatri Cloud</span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4 lg:gap-8 max-w-full overflow-x-auto scrollbar-hide">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href.startsWith('#')) {
                      e.preventDefault();
                      // Check if we're on the homepage
                      const isHomePage = location.pathname === '/' || location.pathname === '';

                      if (isHomePage) {
                        // On homepage, just scroll to section
                        const element = document.querySelector(link.href);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      } else {
                        // On other pages, navigate to homepage first, then scroll after a delay
                        navigate('/');
                        setTimeout(() => {
                          const element = document.querySelector(link.href);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }
                    } else {
                      // For non-hash links like /achievements, use React Router navigation
                      e.preventDefault();
                      navigate(link.href);
                      // Scroll to top when navigating to a new page
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`group relative py-1 text-sm font-medium transition-colors ${location.pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px rounded-full bg-primary transition-all duration-300 ease-out-expo ${location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"}`}
                  />
                </a>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="w-4 h-4" />
                      {user.fullName || user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/edit-profile")}>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile/my-events")}>
                      <Calendar className="w-4 h-4 mr-2" />
                      My Events
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-trainings")}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      My Trainings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile/guide")}>
                      <Info className="w-4 h-4 mr-2" />
                      User Guide
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile/sitemap")}>
                      <List className="w-4 h-4 mr-2" />
                      User Sitemap
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/manage-certifications")}>
                      <User className="w-4 h-4 mr-2" />
                      Manage Certifications
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        logout();
                        setUser(null);
                        navigate("/certifiedyatris");
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <motion.a
                  href="/certifiedyatris"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 overflow-hidden"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="relative z-10 text-sm">Get Started</span>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/20 blur-xl transition-all duration-300" />
                </motion.a>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-20 md:hidden"
          >
            <div className="flex flex-col items-center gap-6 p-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href.startsWith('#')) {
                      e.preventDefault();
                      // Check if we're on the homepage
                      const isHomePage = location.pathname === '/' || location.pathname === '';

                      if (isHomePage) {
                        // On homepage, just scroll to section
                        const element = document.querySelector(link.href);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      } else {
                        // On other pages, navigate to homepage first, then scroll after a delay
                        navigate('/');
                        setTimeout(() => {
                          const element = document.querySelector(link.href);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }
                    } else {
                      // For non-hash links like /achievements, use React Router navigation
                      e.preventDefault();
                      navigate(link.href);
                      // Scroll to top when navigating to a new page
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xl font-medium text-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex items-center gap-4 mt-4">
                {user ? (
                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate("/manage-certifications");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate("/profile/sitemap");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      <List className="w-4 h-4 mr-2" />
                      User Sitemap
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        logout();
                        setUser(null);
                        setIsMobileMenuOpen(false);
                        navigate("/certifiedyatris");
                      }}
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <motion.a
                    href="/certifiedyatris"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group relative bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 overflow-hidden"
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10">Get Started</span>
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/20 blur-xl transition-all duration-300" />
                  </motion.a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;