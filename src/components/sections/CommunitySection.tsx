import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import Marquee from "@/components/Marquee";
import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

// Base URL for certification logos (same as used in certification form)
const LOGO_BASE_URL = "https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications";

// Company logos with image URLs (using same logos as certification form)
const companies = [
  {
    name: "AWS",
    logo: `${LOGO_BASE_URL}/aws.svg`,
    logoLight: `${LOGO_BASE_URL}/aws-light.png`,
  },
  {
    name: "Google Cloud",
    logo: `${LOGO_BASE_URL}/google_cloud.svg`,
  },
  {
    name: "Azure",
    logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg`,
  },
  {
    name: "Salesforce",
    logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg`,
  },
  {
    name: "Oracle",
    logo: `${LOGO_BASE_URL}/Oracle_logo.svg`,
  },
  {
    name: "GitHub",
    logo: `${LOGO_BASE_URL}/github-white-icon.webp`,
    logoLight: `${LOGO_BASE_URL}/github-white-icon.webp`,
  },
];

// Profile pictures for the globe - mix of actual and real profile images
const profilePictures = [
  "https://raw.githubusercontent.com/YatharthChauhan2362/prod-public-images/refs/heads/main/yatharth-chauhan-profile1.png",
  "https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Team%20Yatri%20Cloud/Nensi%20Ravaliya/profile-nensi-ravaliya.png",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
];

// Generate sphere points
const generateSpherePoints = (count: number, radius: number) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    const theta = (Math.PI * 2 * i) / count;
    const phi = Math.acos(-1 + (2 * i) / count);
    const x = Math.cos(theta) * Math.sin(phi) * radius;
    const y = Math.sin(theta) * Math.sin(phi) * radius;
    const z = Math.cos(phi) * radius;
    points.push({ x, y, z, theta, phi });
  }
  return points;
};

// Globe component with 3D effect
const GlobeVisualization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dots = generateSpherePoints(80, 150);
  const profiles = generateSpherePoints(profilePictures.length, 150);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let angle = 0;
    const animate = () => {
      angle += 0.005;
      if (container) {
        container.style.transform = `rotateY(${angle}rad) rotateX(0.2rad)`;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // Generate connections between nearby profiles
  const connections = [];
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const dx = profiles[i].x - profiles[j].x;
      const dy = profiles[i].y - profiles[j].y;
      const dz = profiles[i].z - profiles[j].z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance < 200) {
        connections.push({ from: profiles[i], to: profiles[j] });
      }
    }
  }

  return (
    <div className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden" style={{ perspective: '1200px', boxShadow: 'none' }}>
      <div
        ref={containerRef}
        className="relative w-[300px] h-[300px] mx-auto"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Connection lines between profiles */}
        {connections.map((conn, i) => {
          const midX = (conn.from.x + conn.to.x) / 2;
          const midY = (conn.from.y + conn.to.y) / 2;
          const midZ = (conn.from.z + conn.to.z) / 2;
          const length = Math.sqrt(
            Math.pow(conn.to.x - conn.from.x, 2) +
            Math.pow(conn.to.y - conn.from.y, 2) +
            Math.pow(conn.to.z - conn.from.z, 2)
          );
          const angle = Math.atan2(conn.to.y - conn.from.y, conn.to.x - conn.from.x);
          const angleZ = Math.atan2(
            Math.sqrt(Math.pow(conn.to.x - conn.from.x, 2) + Math.pow(conn.to.y - conn.from.y, 2)),
            conn.to.z - conn.from.z
          );

          return (
            <div
              key={`conn-${i}`}
              className="absolute border-t border-primary/30"
              style={{
                left: '50%',
                top: '50%',
                width: `${length}px`,
                height: '1px',
                transformOrigin: 'left center',
                transform: `translate3d(${conn.from.x}px, ${conn.from.y}px, ${conn.from.z}px) rotateZ(${angle}rad) rotateY(${angleZ}rad)`,
                opacity: 0.3,
              }}
            />
          );
        })}

        {/* Dots */}
        {dots.map((dot, i) => (
          <div
            key={`dot-${i}`}
            className="absolute w-1 h-1 bg-primary/60 rounded-full"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate3d(${dot.x - 2}px, ${dot.y - 2}px, ${dot.z}px)`,
              boxShadow: dot.z > 0 ? '0 0 4px rgba(0, 124, 255, 0.5)' : 'none',
            }}
          />
        ))}
        
        {/* Profile pictures */}
        {profiles.map((profile, i) => (
          <div
            key={`profile-${i}`}
            className="absolute cursor-pointer"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate3d(${profile.x - 28}px, ${profile.y - 28}px, ${profile.z}px)`,
              zIndex: profile.z > 0 ? 10 : 5,
              transformStyle: 'preserve-3d',
            }}
            onMouseEnter={(e) => {
              const element = e.currentTarget;
              element.style.zIndex = '9999';
            }}
            onMouseLeave={(e) => {
              const element = e.currentTarget;
              element.style.zIndex = profile.z > 0 ? '10' : '5';
            }}
          >
            <motion.div
              className="w-14 h-14 rounded-full border-2 border-primary/50 overflow-hidden shadow-lg"
              whileHover={{ 
                scale: 1.3,
              }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              style={{
                transformOrigin: 'center center',
              }}
            >
              <img
                src={profilePictures[i % profilePictures.length]}
                alt={`Community member ${i + 1}`}
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=User+${i + 1}&background=007CFF&color=fff&size=128`;
                }}
              />
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow: profile.z > 0 
                    ? `0 0 20px rgba(0, 124, 255, 0.4), inset 0 0 20px rgba(0, 124, 255, 0.1)` 
                    : 'none',
                }}
              />
            </motion.div>
          </div>
        ))}
      </div>
      
      {/* Blur effect on the left side for depth - only in dark mode */}
      <div 
        className="absolute inset-0 pointer-events-none dark:block hidden"
        style={{
          background: 'radial-gradient(circle at 30% 50%, transparent 0%, rgba(0, 0, 0, 0.3) 40%, transparent 70%)',
        }}
      />
    </div>
  );
};

export const CommunitySection = () => {
  const { theme } = useTheme();
  const reduce = useReducedMotion();

  return (
    <section className="relative band-tint text-foreground overflow-hidden">
      {/* Top Section - Join Our Community (Permanent Dark Closing Band) */}
      <div className="relative py-20 md:py-28 overflow-hidden">
        {/* Dotted-grid backdrop — kinetic community field */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(hsl(var(--primary) / 0.7) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            maskImage: "radial-gradient(ellipse 62% 58% at 50% 38%, black, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 62% 58% at 50% 38%, black, transparent 80%)",
          }}
        />

        {/* Decorative blue glow blobs — top blob breathes */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] bg-primary/10 blur-3xl rounded-full"
          animate={reduce ? undefined : { opacity: [0.55, 1, 0.55], scale: [1, 1.08, 1] }}
          transition={reduce ? undefined : { duration: 6.5, ease: "easeInOut", repeat: Infinity }}
        />
        <div className="pointer-events-none absolute -bottom-16 right-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] mb-6 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <motion.span
                    aria-hidden
                    className="absolute inline-flex h-full w-full rounded-full bg-primary"
                    animate={reduce ? undefined : { scale: [1, 2.4], opacity: [0.7, 0] }}
                    transition={reduce ? undefined : { duration: 2, ease: "easeOut", repeat: Infinity }}
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Join Our Community
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-[-0.03em] leading-[0.95] text-foreground mb-6">
                Join an <span className="gradient-text">Exclusive</span> Network of Cloud Innovators
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Join our private community to access discussions, job opportunities, and insights you won't find on Twitter or any public forum.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                {["50% OFF vouchers", "Exam dumps & resources", "Personal 1:1 support"].map((b) => (
                  <span key={b} className="inline-flex items-center gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    {b}
                  </span>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <Button
                size="lg"
                className="group bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-inset-btn"
                asChild
              >
                <a
                  href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Our Community - It's Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </ScrollReveal>
          </div>

          {/* Globe Visualization */}
          <ScrollReveal delay={0.4}>
            <div className="mt-16 relative">
              {/* Soft blue glow behind photos */}
              <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-2xl -z-10" />
              <GlobeVisualization />
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Bottom Section - Company Logos (light, flows into the footer) */}
      <div className="py-12 md:py-20 bg-background border-t border-border relative overflow-hidden">
        {/* Decorative glow */}
        <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[36rem] h-40 bg-primary/10 blur-[100px]" />
        <div className="container mx-auto px-2 sm:px-4 md:px-6 relative z-10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-8 md:mb-10">
            Certifications we help you master
          </p>
          {/* Scrolling Company Logos - single row, right to left */}
          <div>
            <Marquee speed="normal" direction="right" className="py-2 md:py-4">
              {[...companies, ...companies].map((company, index) => (
                <div
                  key={`${company.name}-2-${index}`}
                  className="flex items-center justify-center px-4 sm:px-8 md:px-12 h-12 sm:h-16 md:h-20 opacity-60 hover:opacity-100 transition-opacity duration-300"
                >
                  <img
                    src={
                      company.name === 'AWS'
                        ? (theme === 'dark' ? company.logoLight || company.logo : company.logo)
                        : company.name === 'GitHub'
                        ? (theme === 'dark' ? company.logo : (company.logoLight || company.logo))
                        : company.logo
                    }
                    alt={company.name}
                    className={`h-6 sm:h-8 md:h-12 w-auto object-contain max-w-[120px] sm:max-w-[150px] md:max-w-none opacity-60 hover:opacity-100 transition-opacity ${
                      company.name === 'GitHub' && theme === 'light' ? 'invert' : ''
                    }`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.createElement('span');
                      fallback.className = 'text-sm sm:text-lg md:text-2xl font-bold text-foreground whitespace-nowrap';
                      fallback.textContent = company.name;
                      target.parentElement?.appendChild(fallback);
                    }}
                  />
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
