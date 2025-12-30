import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

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
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="flex flex-col items-center text-center"
  >
    <div className="relative mb-4 overflow-hidden rounded-2xl border-2 border-border/50 shadow-md">
      <img
        src={member.image}
        alt={member.name}
        className="h-40 w-40 object-cover"
        loading="lazy"
      />
    </div>
    <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
    <p className="text-sm text-text-secondary mb-4">{member.role}</p>
    <a
      href={member.portfolioUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
    >
      View Portfolio
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  </motion.div>
);

export const Footer = () => {
  return (
    <footer id="team" className="bg-background border-t border-border">
      <div className="container py-20">
        {/* Team section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
            Meet the Team
          </h2>
          <p className="text-text-secondary">
            The cloud professionals behind Yatri Cloud
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-16 mb-16">
          {team.map((member, index) => (
            <TeamCard key={member.name} member={member} index={index} />
          ))}
        </div>

        {/* Bottom footer */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
                alt="Yatri Cloud"
                className="h-8 w-8"
              />
              <span className="text-sm text-text-secondary">
                © {new Date().getFullYear()} Yatri Cloud. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
