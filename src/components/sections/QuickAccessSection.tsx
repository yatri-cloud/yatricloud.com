import { Link } from "react-router-dom";
import {
  Ticket,
  FileText,
  ListChecks,
  GraduationCap,
  CalendarDays,
  Users,
  Route,
  Trophy,
  FilePen,
  BriefcaseBusiness,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

/**
 * Launchpad — every key surface reachable from the top of the homepage in
 * one tap. A slim chip rail (not a card grid): icon + label pills that lift
 * on hover. Pure navigation, no data.
 */

const SHORTCUTS = [
  { to: "/yatristore", label: "50% OFF vouchers", icon: Ticket },
  { to: "/examdumps", label: "Exam dumps", icon: FileText },
  { to: "#courses", label: "Practice tests", icon: ListChecks },
  { to: "/training", label: "Live training", icon: GraduationCap },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/mentorship", label: "Mentorship", icon: Users },
  { to: "/paths", label: "Certification paths", icon: Route },
  { to: "/jobs", label: "Job board", icon: BriefcaseBusiness },
  { to: "/resume-maker", label: "Resume maker", icon: FilePen },
  { to: "/achievements", label: "Wall of fame", icon: Trophy },
];

const chipClass =
  "group inline-flex min-h-[44px] items-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground/85 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:text-primary hover:shadow-sm motion-reduce:hover:translate-y-0";

export const QuickAccessSection = () => {
  const scrollToHash = (hash: string) => {
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative border-y border-border/60 bg-background py-10 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollReveal>
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Where do you want to go, Yatris?
          </p>
          <nav aria-label="Quick access" className="flex flex-wrap items-center justify-center gap-3">
            {SHORTCUTS.map((s) =>
              s.to.startsWith("#") ? (
                <a
                  key={s.label}
                  href={s.to}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToHash(s.to);
                  }}
                  className={chipClass}
                >
                  <s.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {s.label}
                </a>
              ) : (
                <Link key={s.label} to={s.to} className={chipClass}>
                  <s.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {s.label}
                </Link>
              )
            )}
          </nav>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default QuickAccessSection;
