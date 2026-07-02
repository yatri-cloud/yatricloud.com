import { Link } from "react-router-dom";
import {
  MentorshipService,
  formatServicePrice,
  serviceMeta,
} from "@/lib/mentorship";

interface ServiceCardProps {
  service: MentorshipService;
  mentorSlug: string;
}

/**
 * One bookable service on a mentor profile. Slash pricing shows the
 * struck compare price next to the real price. The badge is a small
 * brand tinted pill.
 */
export const ServiceCard = ({ service, mentorSlug }: ServiceCardProps) => {
  return (
    <Link
      to={`/mentorship/${mentorSlug}/${service.slug}`}
      className="group flex flex-col h-full rounded-3xl border border-border bg-card p-6 hover:border-brand-200 hover:shadow-card transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {serviceMeta(service)}
        </p>
        {service.badge && (
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
            {service.badge}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
        {service.title}
      </h3>
      {service.short_description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {service.short_description}
        </p>
      )}

      <div className="mt-auto pt-5 flex items-center justify-between gap-3">
        <p className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-foreground">
            {formatServicePrice(service.price)}
          </span>
          {service.compare_at_price !== null &&
            service.compare_at_price > service.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatServicePrice(service.compare_at_price)}
              </span>
            )}
        </p>
        <span className="inline-flex items-center min-h-[44px] px-4 rounded-xl bg-primary/10 text-primary text-sm font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {service.cta_label}
        </span>
      </div>
    </Link>
  );
};

export default ServiceCard;
