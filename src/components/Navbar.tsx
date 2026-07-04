import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Settings, LogOut, Calendar, BookOpen, Info, List, LayoutDashboard, Receipt, Award } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, getStoredUser, logout } from "@/lib/yatris-api";
import { useSiteContent, getNavLinks, FALLBACK_NAV_LINKS } from "@/lib/site-content";
import { GlobalSearch } from "@/components/GlobalSearch";
import { supabase } from "@/lib/supabase";
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
  const [isMentor, setIsMentor] = useState(false);
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

  // Does this signed in user have a mentor profile? If so, surface their dashboard.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setIsMentor(false); return; }
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      if (!uid) { if (!cancelled) setIsMentor(false); return; }
      const { data } = await supabase.from("mentors").select("id").eq("user_id", uid).maybeSingle();
      if (!cancelled) setIsMentor(Boolean(data));
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Nav links come from Supabase `nav_links` (seeded identical to the
   * fallback, so nothing visibly changes). */
  const navLinks = useSiteContent(() => getNavLinks("navbar"), FALLBACK_NAV_LINKS.navbar);

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
          {/* flex-nowrap: with wrap, the account button fell out of the
              fixed-height bar onto a second row at mid widths. The links
              region scrolls instead of wrapping. */}
          <div className="flex flex-nowrap items-center justify-between h-16 md:h-20 gap-3 md:gap-6">
            {/* Logo */}
            <a href="/" className="group flex shrink-0 items-center gap-2.5">
              <img
                src="/logo-64.png"
                alt="Yatri Cloud"
                width={32}
                height={32}
                className="h-8 w-8 transition-transform duration-300 ease-out-expo group-hover:scale-110 group-hover:rotate-6"
              />
              <span className="font-display text-xl font-bold tracking-tight text-foreground">Yatri Cloud</span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex min-w-0 flex-1 items-center gap-4 lg:gap-8 overflow-x-auto scrollbar-hide">
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
                  className={`group relative shrink-0 whitespace-nowrap py-1 text-sm font-medium transition-colors ${location.pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px rounded-full bg-primary transition-all duration-300 ease-out-expo ${location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"}`}
                  />
                </a>
              ))}
            </div>

            {/* Right cluster: search + account/CTA + hamburger stay grouped —
                without the wrapper, justify-between floated the search icon
                into the middle of the bar on mobile. */}
            <div className="flex shrink-0 items-center gap-2 md:gap-4">
            {/* Search — one instance for every screen size (its trigger
                collapses to icon-only below lg, and mounting it twice would
                double-toggle the Cmd+K listener). */}
            <GlobalSearch />

            {/* Desktop Actions */}
            <div className="hidden md:flex shrink-0 items-center gap-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 max-w-[200px]">
                      <span className="truncate">{user.fullName || user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isMentor && (
                      <DropdownMenuItem onClick={() => navigate("/mentor/dashboard")}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Mentor Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      My Dashboard
                    </DropdownMenuItem>
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
                    <DropdownMenuItem onClick={() => navigate("/certificates")}>
                      <Award className="w-4 h-4 mr-2" />
                      My Certificates
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile/purchases")}>
                      <Receipt className="w-4 h-4 mr-2" />
                      My Receipts
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
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            </div>
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