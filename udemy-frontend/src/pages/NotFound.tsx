import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24">
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <p className="mb-8 text-xl text-muted-foreground">Page not found</p>
        <p className="mb-8 text-center text-muted-foreground max-w-md">
          Sorry, the page you're looking for doesn't exist. Let's get you back on track.
        </p>
        <Button asChild>
          <Link to="/">Return Home</Link>
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
