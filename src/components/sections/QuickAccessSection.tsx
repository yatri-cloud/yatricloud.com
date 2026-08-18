import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";

const SHORTCUTS = [
  { to: "/yatristore", label: "50% OFF vouchers" },
  { to: "/examdumps", label: "Exam dumps" },
  { to: "#courses", label: "Practice tests" },
  { to: "/training", label: "Live training" },
  { to: "/events", label: "Events" },
  { to: "/mentorship", label: "Mentorship" },
  { to: "/paths", label: "Certification paths" },
  { to: "/jobs", label: "Job board" },
  { to: "/jobs/applications", label: "My job profile" },
  { to: "/resume-maker", label: "Resume maker" },
  { to: "/achievements", label: "Wall of fame" },
];

const chipClass =
  "group inline-flex min-h-[44px] items-center rounded-full border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-primary hover:shadow-xs motion-reduce:hover:translate-y-0";

export const QuickAccessSection = () => {
  const scrollToHash = (hash: string) => {
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative border-y border-blue-200/60 bg-gradient-to-r from-blue-50/70 via-sky-50/50 to-indigo-50/30 py-10 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollReveal>
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
            Where do you want to go, Yatris?
          </p>
          <nav aria-label="Quick access" className="flex flex-wrap items-center justify-center gap-2.5">
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
                  {s.label}
                </a>
              ) : (
                <Link key={s.label} to={s.to} className={chipClass}>
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
