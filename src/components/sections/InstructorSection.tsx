import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const teamMembers = [
  {
    name: "Yatharth Chauhan",
    role: "Founder – Yatri Cloud",
    image: "https://raw.githubusercontent.com/YatharthChauhan2362/prod-public-images/refs/heads/main/yatharth-chauhan-profile1.png",
    portfolio: "https://yatharthchauhan.me/",
  },
  {
    name: "Nensi Ravaliya",
    role: "Creator - Yatri Cloud",
    image: "https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Team%20Yatri%20Cloud/Nensi%20Ravaliya/profile-nensi-ravaliya.png",
    portfolio: "https://nensi.yatricloud.com/",
  },
];

export const InstructorSection = () => {
  return (
    <section id="team" className="py-24 relative overflow-hidden">
      {/* Blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-blue-500/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-blue-500 font-semibold text-sm uppercase tracking-wider mb-4 block">
              The Team
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Meet the <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">Team</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The passionate cloud professionals behind Yatri Cloud
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => (
            <ScrollReveal key={index} delay={index * 0.2}>
              <motion.div
                className="group relative bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/60 rounded-3xl overflow-hidden hover:border-blue-500/40 transition-all duration-500"
                whileHover={{ y: -10, scale: 1.02 }}
              >
                {/* Blue gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Decorative blue elements */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-600/10 rounded-full blur-xl group-hover:bg-blue-600/20 transition-colors duration-500" />
                
                {/* Content */}
                <div className="relative z-10 p-10">
                  {/* Profile Image with blue accent */}
                  <div className="relative mb-8 flex justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative w-32 h-32 rounded-full border-4 border-blue-500/30 group-hover:border-blue-500/60 transition-all duration-300 overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=3B82F6&color=fff&size=128`;
                        }}
                      />
                      {/* Blue glow on hover */}
                      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors duration-300" />
                    </div>
                  </div>
                  
                  {/* Name */}
                  <h3 className="text-3xl font-bold text-foreground mb-3 text-center group-hover:text-blue-500 transition-colors duration-300">
                    {member.name}
                  </h3>
                  
                  {/* Role with blue accent */}
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-500" />
                    <p className="text-muted-foreground font-medium">
                      {member.role}
                    </p>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-500" />
                  </div>
                  
                  {/* Connect Button */}
                  <div className="flex justify-center">
                    <motion.a
                      href={member.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                      
                      <span className="relative z-10">Let's Connect</span>
                      <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-blue-400/0 group-hover/btn:bg-blue-400/20 blur-xl transition-all duration-300" />
                    </motion.a>
                  </div>
                </div>
                
                {/* Bottom blue accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstructorSection;
