import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-colors"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 0 : 180, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {theme === "dark" ? (
          <Moon className="h-4 w-4 text-foreground" />
        ) : (
          <Sun className="h-4 w-4 text-foreground" />
        )}
      </motion.div>
    </Button>
  );
};

