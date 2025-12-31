import Marquee from "@/components/Marquee";
import ScrollReveal from "@/components/ScrollReveal";

const companies = [
  "Tesla",
  "Adobe",
  "Salesforce",
  "IBM",
  "Oracle",
  "Intel",
  "Nvidia",
  "Zoom",
  "Shopify",
  "Dropbox",
  "Pinterest",
  "LinkedIn",
];

export const GraduatesMarquee = () => {
  return (
    <section className="py-16 border-y border-border/50 overflow-hidden bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6 mb-8">
        <ScrollReveal>
          <p className="text-center text-muted-foreground text-sm uppercase tracking-wider">
            Our graduates now work at
          </p>
        </ScrollReveal>
      </div>
      
      <Marquee speed="normal" direction="right" className="py-4">
        {companies.map((company, index) => (
          <div
            key={index}
            className="flex items-center justify-center px-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          >
            <span className="text-2xl md:text-3xl font-bold text-foreground whitespace-nowrap">
              {company}
            </span>
          </div>
        ))}
      </Marquee>
    </section>
  );
};

export default GraduatesMarquee;