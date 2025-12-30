import { motion } from "framer-motion";
import { ExternalLink, Linkedin, Github } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  image: string;
  portfolioUrl: string;
}

const team: TeamMember[] = [
  {
    name: "Yatharth Chauhan",
    role: "Founder – Yatri Cloud",
    image: "https://raw.githubusercontent.com/YatharthChauhan2362/prod-public-images/refs/heads/main/yatharth-chauhan-profile1.png",
    portfolioUrl: "https://yatharthchauhan.me/",
  },
  {
    name: "Nensi Ravaliya",
    role: "Cloud Architect – Yatri Cloud",
    image: "https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Team%20Yatri%20Cloud/Nensi%20Ravaliya/profile-nensi-ravaliya.png",
    portfolioUrl: "https://nensi.yatricloud.com/",
  },
];

const TeamCard = ({ member, index }: { member: TeamMember; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: index * 0.15 }}
    whileHover={{ y: -8 }}
    className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border/60 hover:border-primary/20 hover:shadow-xl transition-all duration-500"
  >
    {/* Image with glow effect */}
    <div className="relative mb-6">
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
      <motion.div 
        className="relative overflow-hidden rounded-full border-4 border-border/50 shadow-lg"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        <img
          src={member.image}
          alt={member.name}
          className="h-32 w-32 object-cover"
          loading="lazy"
        />
      </motion.div>
    </div>
    
    <h3 className="text-xl font-semibold text-foreground mb-1">{member.name}</h3>
    <p className="text-sm text-text-secondary mb-6">{member.role}</p>
    
    <motion.a
      href={member.portfolioUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
    >
      View Portfolio
      <ExternalLink className="h-4 w-4" />
    </motion.a>
  </motion.div>
);

export const Footer = () => {
  return (
    <footer id="team" className="bg-background relative overflow-hidden">
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container py-24">
        {/* Team section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Meet the Team
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            The passionate cloud professionals behind Yatri Cloud
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-20">
          {team.map((member, index) => (
            <TeamCard key={member.name} member={member} index={index} />
          ))}
        </div>

        {/* Bottom footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-10 border-t border-border/50"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
                alt="Yatri Cloud"
                className="h-10 w-10"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  Yatri Udemy
                </span>
                <span className="text-xs text-text-muted">
                  © {new Date().getFullYear()} Yatri Cloud
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-text-muted">
              <a href="#" className="hover:text-foreground transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#courses" className="hover:text-foreground transition-colors duration-200">
                Practice Tests
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
