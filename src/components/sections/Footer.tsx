import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

export const Footer = () => {
  const currentYear = 2026;

  const quickLinks = [
    { href: "#certification-process", label: "Get Certified" },
    { href: "#benefits", label: "Benefits" },
    { href: "#courses", label: "Practice Tests" },
    { href: "#team", label: "Team" },
    { href: "#faq", label: "FAQ" },
  ];

  const resources = [
    { href: "#resources", label: "Resources" },
    { href: "#courses", label: "Udemy Courses" },
  ];

  const legalLinks = [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-of-service", label: "Terms of Service" },
  ];

  const contactLinks = [
    {
      href: "https://certification.yatricloud.com/yatristore",
      label: "Payment & Registration",
      external: true,
    },
    {
      href: "https://chat.whatsapp.com/EEAZws1rcr6CkiATivaikf",
      label: "WhatsApp Support Group",
      external: true,
    },
  ];


  return (
    <footer className="relative bg-gradient-to-b from-background via-card/30 to-background border-t border-border/50 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/2 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="py-16 md:py-20">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <a href="/" className="flex items-center gap-3 group">
                <img
                  src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
                  alt="Yatri Cloud"
                  className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
                />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    Yatri Cloud
                  </span>
                </div>
              </a>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Get AWS Associate certified at 50% OFF. Complete support package with exam dumps, resources, and personalized guidance.
              </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        if (link.href.startsWith('#')) {
                          e.preventDefault();
                          const element = document.querySelector(link.href);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }
                      }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Resources</h3>
              <ul className="space-y-3">
                {resources.map((resource) => (
                  <li key={resource.href}>
                    <a
                      href={resource.href}
                      onClick={(e) => {
                        if (resource.href.startsWith('#')) {
                          e.preventDefault();
                          const element = document.querySelector(resource.href);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }
                      }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                      {resource.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact & Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Contact & Support</h3>
              <ul className="space-y-3">
                {contactLinks.map((contact) => (
                  <li key={contact.href}>
                    <a
                      href={contact.href}
                      target={contact.external ? "_blank" : undefined}
                      rel={contact.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                      <span className="flex-1">{contact.label}</span>
                      {contact.external && (
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Legal Links */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {legalLinks.map((legal) => (
                  <a
                    key={legal.href}
                    href={legal.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {legal.label}
                  </a>
                ))}
              </div>

              {/* Copyright */}
              <p className="text-sm text-muted-foreground text-center md:text-right">
                © {currentYear}{' '}
                <a 
                  href="https://yatricloud.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Yatri Cloud
                </a>
                {' '}· Designed by{' '}
                <a 
                  href="https://uimitra.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Uimitra
                </a>
              </p>
            </div>

          </div>
      </div>
    </div>
  </footer>
);
};

export default Footer;
