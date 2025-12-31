import { motion } from "framer-motion";

const Logo = () => (
  <img
    src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
    alt="Yatri Cloud"
    className="h-10 w-10"
  />
);

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <Logo />
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Yatri Cloud
            </span>
          </div>
        </a>
        
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#courses"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Practice Tests
          </a>
          <a
            href="#team"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Team
          </a>
        </nav>
      </div>
    </motion.header>
  );
};
