import React from "react";

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultTheme?: "dark" | "light";
}> = ({ children, defaultTheme = "dark" }) => {
  const [theme, setTheme] = React.useState(defaultTheme);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme as "dark" | "light");
    }
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

const ThemeContext = React.createContext<{
  theme: string;
  setTheme: (theme: "dark" | "light") => void;
}>({
  theme: "dark",
  setTheme: () => {},
});

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
