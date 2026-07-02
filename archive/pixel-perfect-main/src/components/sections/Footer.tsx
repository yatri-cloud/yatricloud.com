import { Sparkles } from "lucide-react";

export const Footer = () => (
  <footer className="py-12 border-t border-border">
    <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold">Yatri Cloud</span>
            <span className="text-sm text-muted-foreground">Yatri Udemy</span>
          </div>
        </a>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact Us</a>
        </div>
        <p className="text-sm text-muted-foreground">© 2025 Yatri Cloud. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;