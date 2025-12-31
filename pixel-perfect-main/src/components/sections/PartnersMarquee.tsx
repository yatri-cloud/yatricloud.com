import Marquee from "@/components/Marquee";
import ScrollReveal from "@/components/ScrollReveal";

const partners = [
  "Google",
  "Microsoft",
  "OpenAI",
  "Meta",
  "Amazon",
  "Apple",
  "Netflix",
  "Spotify",
  "Airbnb",
  "Uber",
  "Stripe",
  "Slack",
];

export const PartnersMarquee = () => {
  return (
    <section className="py-16 border-y border-border/50 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 mb-8">
        <ScrollReveal>
          <p className="text-center text-muted-foreground text-sm uppercase tracking-wider">
            Trusted by professionals at leading companies
          </p>
        </ScrollReveal>
      </div>
      
      <Marquee speed="slow" className="py-4">
        {partners.map((partner, index) => (
          <div
            key={index}
            className="flex items-center justify-center px-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          >
            <span className="text-2xl md:text-3xl font-bold text-foreground whitespace-nowrap">
              {partner}
            </span>
          </div>
        ))}
      </Marquee>
    </section>
  );
};

export default PartnersMarquee;