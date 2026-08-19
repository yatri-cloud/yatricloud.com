import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  // Do not show popup on admin or authentication/test pages
  const isAdmin = location.pathname.startsWith("/admin");

  // Exit intent detection (desktop)
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (isAdmin) return;
    if (e.clientY <= 0 && !sessionStorage.getItem("yc_exit_shown")) {
      setShow(true);
      sessionStorage.setItem("yc_exit_shown", "1");
    }
  }, [isAdmin]);

  // Mobile: show after 35 seconds on public pages
  useEffect(() => {
    if (isAdmin) return;
    if (sessionStorage.getItem("yc_exit_shown")) return;
    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem("yc_exit_shown", "1");
    }, 35000);

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timer);
    };
  }, [handleMouseLeave, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubscribing(true);
    const { error } = await supabase.from("subscribers").insert({
      email: email.toLowerCase().trim(),
      source: "exit-popup",
    });
    setSubscribing(false);
    if (error && !error.message.includes("duplicate")) {
      toast({ title: "Could not subscribe", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "You are on the list!" });
  };

  if (isAdmin) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22 }}
            className="relative w-full max-w-md rounded-3xl bg-card/95 border border-border/80 shadow-2xl backdrop-blur-xl p-7 text-center"
          >
            <button
              type="button"
              onClick={() => setShow(false)}
              aria-label="Close"
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {submitted ? (
              <div className="py-2">
                <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-bold tracking-tight text-foreground mb-1.5">
                  You are in!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Check your inbox for a welcome email with free resources to get started.
                </p>
              </div>
            ) : (
              <div>
                <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="3" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-bold tracking-tight text-foreground mb-2">
                  Wait, before you go!
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                  Get our free AWS certification guide and exclusive 50% discount on exam vouchers.
                </p>
                <p className="text-xs text-muted-foreground/80 mb-6">
                  Join 50,000+ Yatris who are already mastering cloud certifications.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl bg-background/80 border-border text-sm px-3.5 focus-visible:ring-primary/20"
                  />
                  <Button
                    type="submit"
                    disabled={subscribing}
                    className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-display font-semibold tracking-wide text-sm px-5 shrink-0 shadow-sm transition-all"
                  >
                    {subscribing ? "Sending..." : "Get it free"}
                  </Button>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
