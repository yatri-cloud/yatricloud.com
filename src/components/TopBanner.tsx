import { ANNOUNCEMENT } from "@/config/announcement";

export function TopBanner() {
  if (!ANNOUNCEMENT.enabled || !ANNOUNCEMENT.message) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Maintenance Announcement"
      className="w-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium py-2 px-4 border-b border-primary-foreground/10 shadow-xs relative z-50 transition-all"
    >
      <div className="container mx-auto flex items-center justify-center gap-2 text-center flex-wrap">
        {ANNOUNCEMENT.badge && (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
            {ANNOUNCEMENT.badge}
          </span>
        )}
        <span className="leading-tight">{ANNOUNCEMENT.message}</span>
        {ANNOUNCEMENT.linkHref && ANNOUNCEMENT.linkText && (
          <a
            href={ANNOUNCEMENT.linkHref}
            className="underline font-semibold hover:opacity-90 transition-opacity ml-1 shrink-0"
          >
            {ANNOUNCEMENT.linkText}
          </a>
        )}
      </div>
    </div>
  );
}
