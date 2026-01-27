import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Company */}
          <div>
            <h3 className="font-bold">Udemy Yatri</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Learn cloud certifications from industry experts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link to="/courses" className="hover:text-primary">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary">
                  Home
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold">Legal</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link to="/privacy-policy" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-primary">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold">Contact</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Email: contact@yatricloud.com
            </p>
          </div>
        </div>

        <div className="border-t border-border py-4 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Udemy Yatri. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
