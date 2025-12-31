import { motion } from "framer-motion";
import { ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";

const teamMembers = [
  {
    name: "Yatharth Chauhan",
    role: "Founder – Yatri Cloud",
    avatar: "👨‍💼",
  },
  {
    name: "Nensi Ravaliya",
    role: "Creator - Yatri Cloud",
    avatar: "👩‍💼",
  },
];

export const InstructorSection = () => {
  return (
    <section id="team" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              The Team
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Meet the <span className="gradient-text">Team</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The passionate cloud professionals behind Yatri Cloud
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {teamMembers.map((member, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <motion.div
                className="bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="w-24 h-24 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center text-5xl">
                  {member.avatar}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {member.name}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {member.role}
                </p>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary group"
                >
                  Let's Connect
                  <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstructorSection;