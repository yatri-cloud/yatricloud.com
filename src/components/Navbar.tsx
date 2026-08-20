import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FEATURE_FLAGS } from "@/config/features";
import { LoginModal } from "@/components/LoginModal";

export const Navbar = ({ heroTheme }: { heroTheme?: 'light' | 'dark' } = {}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMentor, setIsMentor] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // When not scrolled and overlaying a hero, use heroTheme to determine text colours.
  // 'light' means the bg is dark  → use white text.
  // 'dark'  means the bg is light → use dark text (default behaviour).
  const isLightText = !isScrolled && heroTheme === 'light';

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

  // Hide Jobs, Mentorship, Blog, Training, Events from the nav (both desktop + mobile).
  const HIDDEN_NAV_HREFS = new Set(["/jobs", "/mentorship", "/blog", "/training", "/events"]);
  const HIDDEN_NAV_LABELS = new Set(["jobs", "mentorship", "blog", "training", "events"]);
  const visibleNavLinks = useMemo(() => {
    const filtered = navLinks.filter(
      (l) => !HIDDEN_NAV_HREFS.has(l.href) && !HIDDEN_NAV_LABELS.has(l.label?.toLowerCase()?.trim())
    );
    if (!filtered.some((l) => l.href === "/resources" || l.label?.toLowerCase() === "resources")) {
      const dumpsIdx = filtered.findIndex((l) => l.href === "/examdumps");
      if (dumpsIdx !== -1) {
        filtered.splice(dumpsIdx + 1, 0, { href: "/resources", label: "Resources" });
      } else {
        filtered.push({ href: "/resources", label: "Resources" });
      }
    }
    return filtered;
  }, [navLinks]);

  const handleLogout = () => {
    logout();
    setUser(null);
    if (
      location.pathname.startsWith("/profile") ||
      location.pathname.startsWith("/edit-profile") ||
      location.pathname.startsWith("/manage-certifications")
    ) {
      navigate("/");
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "glass-nav shadow-card" : "bg-transparent"
          }`}
      >
        <div className="container mx-auto px-4 md:px-6">
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
              <span
                className={`font-display text-xl font-bold tracking-tight transition-colors ${isLightText ? "text-white" : "text-foreground"
                  }`}
              >
                Yatri Cloud
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex min-w-0 flex-1 items-center gap-4 lg:gap-8 overflow-x-auto scrollbar-hide lg:justify-center">
              {visibleNavLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href.startsWith("#")) {
                      e.preventDefault();
                      const isHomePage = location.pathname === "/" || location.pathname === "";
                      if (isHomePage) {
                        const element = document.querySelector(link.href);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      } else {
                        navigate("/");
                        setTimeout(() => {
                          const element = document.querySelector(link.href);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }, 100);
                      }
                    } else {
                      e.preventDefault();
                      navigate(link.href);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`group relative shrink-0 whitespace-nowrap py-1 text-sm font-medium transition-colors ${location.pathname === link.href
                    ? isLightText
                      ? "text-white"
                      : "text-primary"
                    : isLightText
                      ? "text-white/80 hover:text-white"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px rounded-full bg-primary transition-all duration-300 ease-out-expo ${location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                  />
                </a>
              ))}
            </div>

            {/* Right cluster: search + account/CTA + hamburger */}
            <div className="flex shrink-0 items-center gap-2 md:gap-4">
              <GlobalSearch isLightText={isLightText} />

              {/* Desktop Actions */}
              <div className="hidden md:flex shrink-0 items-center gap-4">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className={`gap-2 max-w-[220px] rounded-full font-medium shadow-2xs transition-all ${isLightText
                          ? "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md"
                          : "border-border bg-card text-foreground hover:bg-muted"
                          }`}
                      >
                        <span className="truncate">{user.fullName || user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 max-h-[calc(100vh-5.5rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shadow-xl"
                    >
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {isMentor && (
                        <DropdownMenuItem onClick={() => navigate("/mentor/dashboard")}>
                          Mentor Dashboard
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => navigate("/edit-profile")}>
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/certificates")}>
                        My Certificates
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/profile/purchases")}>
                        My Receipts
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/manage-certifications")}>
                        Manage Certifications
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/support")}>
                        Help & Support
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer">
                          <span>Coming Soon</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-52">
                          <DropdownMenuItem
                            onClick={() => {
                              toast.info("My Dashboard is coming soon!");
                              navigate("/dashboard");
                            }}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span>My Dashboard</span>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast.info("My Events is coming soon!");
                              navigate("/profile/my-events");
                            }}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span>My Events</span>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast.info("My Trainings is coming soon!");
                              navigate("/my-trainings");
                            }}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span>My Trainings</span>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast.info("User Guide is coming soon!");
                              navigate("/profile/guide");
                            }}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span>User Guide</span>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast.info("User Sitemap is coming soon!");
                              navigate("/profile/sitemap");
                            }}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span>User Sitemap</span>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast.info("My Blogs is coming soon!");
                              navigate("/blog/dashboard");
                            }}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span>My Blogs</span>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <motion.button
                    type="button"
                    onClick={() => setShowLoginModal(true)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 overflow-hidden cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10 text-sm">Sign In</span>
                    <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/20 blur-xl transition-all duration-300" />
                  </motion.button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className={`md:hidden p-2 transition-colors ${isLightText ? "text-white" : "text-foreground"
                  }`}
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
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-20 md:hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="flex flex-col items-center gap-6 p-8">
              {visibleNavLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href.startsWith("#")) {
                      e.preventDefault();
                      const isHomePage = location.pathname === "/" || location.pathname === "";
                      if (isHomePage) {
                        const element = document.querySelector(link.href);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      } else {
                        navigate("/");
                        setTimeout(() => {
                          const element = document.querySelector(link.href);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }, 100);
                      }
                    } else {
                      e.preventDefault();
                      navigate(link.href);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xl font-medium text-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex items-center gap-4 mt-4 w-full">
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
                        navigate("/support");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Help & Support
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!FEATURE_FLAGS.userSitemap) {
                          toast.info("User Sitemap is coming soon!");
                        }
                        navigate("/profile/sitemap");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between"
                    >
                      <span>User Sitemap</span>
                      {!FEATURE_FLAGS.userSitemap && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          Soon
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!FEATURE_FLAGS.myBlogs) {
                          toast.info("My Blogs is coming soon!");
                        }
                        navigate("/blog/dashboard");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between"
                    >
                      <span>My Blogs</span>
                      {!FEATURE_FLAGS.myBlogs && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          Soon
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowLoginModal(true);
                    }}
                    className="group relative bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 overflow-hidden w-full cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10">Sign In</span>
                    <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/20 blur-xl transition-all duration-300" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global In-Page Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(loggedInUser) => {
          setShowLoginModal(false);
          setUser(loggedInUser);
        }}
      />
    </>
  );
};

export default Navbar;