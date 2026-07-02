import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Youtube, Linkedin, MessageCircle, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  useSiteContent,
  getSiteSettings,
  getNavLinks,
  FALLBACK_SETTINGS,
  FALLBACK_NAV_LINKS,
} from "@/lib/site-content";

export const Footer = () => {
  const currentYear = 2026;
  const reduce = useReducedMotion();
  const { toast } = useToast();
  const [subscribing, setSubscribing] = useState(false);

  /* Social links + brand tagline come from Supabase site_settings
   * (seeded identical to the fallbacks, so nothing visibly changes). */
  const settings = useSiteContent(getSiteSettings, FALLBACK_SETTINGS);
  const social = settings.social || FALLBACK_SETTINGS.social;
  const brandTagline = settings.brand?.tagline || FALLBACK_SETTINGS.brand.tagline;

  const handleSubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") || "").trim().toLowerCase();
    if (!email.includes("@")) return;
    setSubscribing(true);
    const { error } = await supabase.from("subscribers").insert({ email });
    setSubscribing(false);
    if (error && !error.message.includes("duplicate")) {
      toast({ title: "Couldn't subscribe", description: "Please try again in a moment.", variant: "destructive" });
      return;
    }
    toast({ title: "You're in, Yatri! 🎉", description: "We'll keep you posted on new dumps, events, and offers." });
    form.reset();
  };

  /* Footer link columns come from Supabase `nav_links` (seeded identical
   * to the fallbacks, so nothing visibly changes). */
  const exploreLinks = useSiteContent(
    () => getNavLinks("footer_explore"),
    FALLBACK_NAV_LINKS.footer_explore
  );
  const quickLinks = useSiteContent(
    () => getNavLinks("footer_quick"),
    FALLBACK_NAV_LINKS.footer_quick
  );
  const legalLinks = useSiteContent(
    () => getNavLinks("footer_legal"),
    FALLBACK_NAV_LINKS.footer_legal
  );

  const socialLinks = [
    { name: "YouTube", href: social.youtube || FALLBACK_SETTINGS.social.youtube, icon: <Youtube className="w-5 h-5" /> },
    { name: "LinkedIn", href: social.linkedin || FALLBACK_SETTINGS.social.linkedin, icon: <Linkedin className="w-5 h-5" /> },
    { name: "WhatsApp", href: social.whatsapp || FALLBACK_SETTINGS.social.whatsapp, icon: <MessageCircle className="w-5 h-5" /> },
  ];

  const handleHashScroll = (e: React.MouseEvent, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // Anchor lives on the homepage — navigate there with the hash.
        window.location.href = `/${href}`;
      }
    }
  };

  const LinkColumn = ({ title, links }: { title: string; links: { href: string; label: string }[] }) => (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <a
              href={link.href}
              onClick={(e) => handleHashScroll(e, link.href)}
              className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="h-px w-0 bg-primary transition-all duration-300 ease-out group-hover:w-4" />
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="relative isolate overflow-hidden bg-background text-foreground">
      {/* ── Light background with soft blue accents ── */}
      {/* Blue seam + top wash so the footer reads distinct from the section above */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/[0.07] to-transparent" />
      {/* Dotted texture fading downward */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--primary) / 0.14) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, black, transparent 45%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 45%)",
        }}
      />
      {/* Drifting soft-blue aurora */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-[15%] h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-[130px]"
        animate={reduce ? undefined : { x: [0, 50, 0], y: [0, 24, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={reduce ? undefined : { duration: 13, ease: "easeInOut", repeat: Infinity }}
      />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        {/* ── Main footer: brand + link columns ── */}
        <div className="grid grid-cols-2 gap-10 pb-14 pt-16 md:grid-cols-12">
          {/* Brand */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-2 space-y-6 md:col-span-4"
          >
            <a href="/" className="group flex w-fit items-center gap-3">
              <img
                src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
                alt="Yatri Cloud"
                className="h-10 w-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              />
              <span className="font-display text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                Yatri Cloud
              </span>
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {brandTagline}
            </p>
            {/* Newsletter — saves to Supabase `subscribers` */}
            <form onSubmit={handleSubscribe} className="flex max-w-xs items-center gap-2">
              <label htmlFor="footer-subscribe" className="sr-only">Email address</label>
              <input
                id="footer-subscribe"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={subscribing}
                aria-label="Subscribe for updates"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-inset-btn transition-colors hover:bg-brand-600"
              >
                {subscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={reduce ? undefined : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          <div className="col-span-1 md:col-span-3">
            <LinkColumn title="Explore" links={exploreLinks} />
          </div>
          <div className="col-span-1 md:col-span-3">
            <LinkColumn title="Company" links={quickLinks} />
          </div>
          <div className="col-span-2 md:col-span-2">
            <LinkColumn title="Legal" links={legalLinks} />
          </div>
        </div>
      </div>

      {/* ── Blue statement finale: tagline over the giant fitted "Yatri Cloud" wordmark ── */}
      <div className="relative overflow-hidden pt-12 pb-8 md:pt-16 md:pb-10">
        {/* Soft blue glow behind the statement */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-44 w-2/3 rounded-full bg-primary/10 blur-[120px]" />
        </div>
        {/* Tagline */}
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-foreground md:text-5xl lg:text-6xl">
            Focus on learning,
            <br className="hidden sm:block" /> <span className="gradient-text">not the price tag.</span>
          </h2>
        </div>
        {/* Giant blue "Yatri Cloud" wordmark — in-flow & fitted to width so the full text always shows (never clipped) */}
        <div className="relative z-0 mt-2 flex items-center justify-center">
          <span className="block w-full whitespace-nowrap bg-gradient-to-r from-primary/15 via-primary/40 to-primary/15 bg-[length:200%_auto] bg-clip-text px-4 pb-[0.12em] text-center font-display text-[12.5vw] font-black leading-[1.12] tracking-[-0.03em] text-transparent animate-shimmer [animation-duration:9s] [animation-timing-function:ease-in-out] motion-reduce:animate-none">
            Yatri Cloud
          </span>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative z-10 border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-sm md:flex-row md:px-6">
          <p className="text-muted-foreground">
            © {currentYear}{" "}
            <a href="https://www.yatricloud.com" target="_blank" rel="noopener noreferrer" className="text-foreground/80 transition-colors hover:text-primary">
              Yatri Cloud
            </a>{" "}
            · All rights reserved.
          </p>
          <p className="text-muted-foreground">
            Designed by{" "}
            <a href="https://uimitra.com" target="_blank" rel="noopener noreferrer" className="text-foreground/80 transition-colors hover:text-primary">
              Uimitra
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
