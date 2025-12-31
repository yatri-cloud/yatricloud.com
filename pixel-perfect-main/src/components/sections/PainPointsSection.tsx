import { motion } from "framer-motion";
import { 
  BookOpen, 
  FileText, 
  Video, 
  Download,
  Search,
  Users
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const resources = [
  {
    icon: BookOpen,
    title: "Exam Guides",
    description: "Step-by-step certification roadmaps",
  },
  {
    icon: FileText,
    title: "Study Materials",
    description: "Curated notes and cheat sheets",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "In-depth concept explanations",
  },
  {
    icon: Download,
    title: "Downloadable PDFs",
    description: "Offline study resources",
  },
];

export const PainPointsSection = () => {
  return (
    <section id="resources" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Learning Hub
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Free <span className="gradient-text">Resources</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to prepare for your certification journey
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((resource, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <motion.div
                className="group bg-card border border-border rounded-2xl p-6 h-full hover:border-primary/50 transition-all duration-300"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <resource.icon className="w-6 h-6 text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {resource.title}
                </h3>
                <p className="text-muted-foreground">
                  {resource.description}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;