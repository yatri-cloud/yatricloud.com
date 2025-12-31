import { motion } from "framer-motion";
import { ExternalLink, BookOpen, FileText, Video, Download, Globe } from "lucide-react";

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
    role: "Creator - Yatri Cloud",
    image: "https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Team%20Yatri%20Cloud/Nensi%20Ravaliya/profile-nensi-ravaliya.png",
    portfolioUrl: "https://nensi.yatricloud.com/",
  },
];

const resources = [
  {
    icon: FileText,
    title: "Exam Guides",
    description: "Step-by-step certification roadmaps",
    link: "#",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BookOpen,
    title: "Study Materials",
    description: "Curated notes and cheat sheets",
    link: "#",
    color: "from-emerald-500 to-green-500",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "In-depth concept explanations",
    link: "#",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Download,
    title: "Downloadable PDFs",
    description: "Offline study resources",
    link: "#",
    color: "from-amber-500 to-orange-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

const TeamCard = ({ member, index }: { member: TeamMember; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, rotateY: -10 }}
    whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
    viewport={{ once: true }}
    transition={{ 
      duration: 0.7, 
      delay: index * 0.2,
      ease: [0.25, 0.1, 0.25, 1]
    }}
    whileHover={{ 
      y: -12,
      transition: { duration: 0.3 }
    }}
    className="group relative flex flex-col items-center text-center p-10 rounded-3xl bg-card border border-border/60 hover:border-primary/30 transition-all duration-500 overflow-hidden"
  >
    {/* Animated background gradient */}
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileHover={{ opacity: 0.6, scale: 1.5 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"
    />
    
    {/* Image with glow effect */}
    <div className="relative mb-8">
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-primary/30 blur-2xl"
      />
      <motion.div 
        className="relative overflow-hidden rounded-full border-4 border-primary/20 shadow-2xl"
        whileHover={{ 
          scale: 1.08,
          borderColor: "hsl(var(--primary))"
        }}
        transition={{ duration: 0.4 }}
      >
        <img
          src={member.image}
          alt={member.name}
          className="h-36 w-36 object-cover"
          loading="lazy"
        />
      </motion.div>
    </div>
    
    <motion.h3 
      className="text-xl font-bold text-foreground mb-2 relative"
      whileHover={{ scale: 1.02 }}
    >
      {member.name}
    </motion.h3>
    <p className="text-sm text-text-secondary mb-6 relative">{member.role}</p>
    
    <motion.a
      href={member.portfolioUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.08, boxShadow: "0 20px 40px -15px hsl(var(--primary) / 0.4)" }}
      whileTap={{ scale: 0.95 }}
      className="relative inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
    >
      Let's Connect
      <ExternalLink className="h-4 w-4" />
    </motion.a>
  </motion.div>
);

export const Footer = () => {
  return (
    <footer id="team" className="bg-gradient-to-b from-background via-surface-subtle/50 to-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]"
        />
      </div>
      
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container relative py-28">
        {/* Resources Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6"
            >
              <Globe className="h-4 w-4" />
              Learning Hub
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Free Resources
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Everything you need to prepare for your certification journey
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {resources.map((resource, index) => (
              <motion.a
                key={resource.title}
                href={resource.link}
                variants={itemVariants}
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
                className="group relative p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/30 transition-all duration-500 overflow-hidden cursor-pointer"
              >
                {/* Gradient overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 0.1 }}
                  className={`absolute inset-0 bg-gradient-to-br ${resource.color}`}
                />
                
                <div className="relative">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${resource.color} bg-opacity-20`}
                  >
                    <resource.icon className="h-6 w-6 text-foreground" />
                  </motion.div>
                  
                  <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {resource.description}
                  </p>
                </div>
                
                {/* Arrow indicator */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="absolute top-6 right-6"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                </motion.div>
              </motion.a>
            ))}
          </motion.div>
        </motion.div>

        {/* Team section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6"
          >
            ✨ The Team
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Meet the Team
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            The passionate cloud professionals behind Yatri Cloud
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-24">
          {team.map((member, index) => (
            <TeamCard key={member.name} member={member} index={index} />
          ))}
        </div>

        {/* Bottom footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="pt-10 border-t border-border/30"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.a 
              href="/"
              className="flex items-center gap-4 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <motion.img
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
                alt="Yatri Cloud"
                className="h-11 w-11"
              />
              <div className="flex flex-col">
                <span className="text-base font-semibold text-foreground">
                  Yatri Cloud
                </span>
                <span className="text-xs text-text-muted">
                  © {new Date().getFullYear()} Yatri Cloud. All rights reserved.
                </span>
              </div>
            </motion.a>
            
            <div className="flex items-center gap-8 text-sm">
              {["Privacy Policy", "Terms of Service"].map((item) => {
                const href = item === "Privacy Policy" ? "/privacy-policy" : "/terms-of-service";
                return (
                  <motion.a
                    key={item}
                    href={href}
                    whileHover={{ y: -2, color: "hsl(var(--primary))" }}
                    className="text-text-muted hover:text-primary transition-colors duration-200"
                  >
                    {item}
                  </motion.a>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
