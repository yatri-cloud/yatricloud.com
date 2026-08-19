import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { toast } from "sonner";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  title = "Coming Soon",
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await subscribeToNewsletter(email.trim(), name.trim() || undefined);
      if (res.ok) {
        setIsSubmitted(true);
        toast.success("You are on the waitlist!");
      } else {
        toast.error(res.error || "Could not join waitlist. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title={`${title} | Coming Soon | Yatri Cloud`}
        description="Join the waitlist to receive early access and launch updates."
      />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full mx-auto text-center"
        >
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            <span className="block">{title}</span>
            <span className="gradient-text block">Coming Soon</span>
          </h1>

          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">
            We are putting the finishing touches on this experience. Join the priority waitlist to receive early access and launch updates directly.
          </p>

          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="submitted"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-border bg-card/70 backdrop-blur-md p-6 text-center shadow-xs"
              >
                <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 text-success flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h2 className="font-display font-semibold text-lg text-foreground mb-1">
                  You are on the priority list!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5">
                  Thank you for signing up. As soon as <span className="text-foreground font-medium">{title}</span> launches, we will notify you at <span className="font-medium text-foreground">{email}</span>.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                  <Button asChild variant="outline" className="h-10 rounded-xl text-xs font-medium">
                    <Link to="/resources">Explore Resources</Link>
                  </Button>
                  <Button asChild className="h-10 rounded-xl text-xs font-medium">
                    <Link to="/">
                      Back to Home <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 sm:p-6 shadow-xs space-y-3"
              >
                <Input
                  type="text"
                  placeholder="Your Name (Optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl bg-background/80 border-border text-sm"
                  disabled={isSubmitting}
                />
                <Input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl bg-background/80 border-border text-sm"
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl font-display font-semibold tracking-wide text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                >
                  {isSubmitting ? "Securing your spot..." : "Join the Waitlist"}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ComingSoon;
