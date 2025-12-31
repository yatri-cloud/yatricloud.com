
export const Footer = () => (
  <footer className="py-12 border-t border-border">
    <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-2">
          <img
            src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
            alt="Yatri Cloud"
            className="h-8 w-8"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold">Yatri Cloud</span>
          </div>
        </a>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</a>
        </div>
        <p className="text-sm text-muted-foreground">© 2025 Yatri Cloud. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;