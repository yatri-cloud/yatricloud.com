import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail } from "lucide-react";
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

  // Exit intent detection (desktop)
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0 && !sessionStorage.getItem("yc_exit_shown")) {
      setShow(true);
      sessionStorage.setItem("yc_exit_shown", "1");
    }
  }, []);

  // Mobile: show after 30 seconds
  useEffect(() => {
    if (sessionStorage.getItem("yc_exit_shown")) return;
    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem("yc_exit_shown", "1");
    }, 30000);

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timer);
    };
  }, [handleMouseLeave]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubscribing(true);
    const { error } = await supabase.from("subscribers").insert({ email: email.toLowerCase().trim(), source: "exit-popup" });
    setSubscribing(false);
    if (error && !error.message.includes("duplicate")) {
      toast({ title: "Couldn't subscribe", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "You're in, Yatri!" });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-8 text-center"
          >
            <button
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>

            {submitted ? (
              <>
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">You're in!</h3>
                <p className="text-muted-foreground">Check your inbox for a welcome email with free resources to get started.</p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Wait, before you go!</h3>
                <p className="text-muted-foreground mb-1">Get our free AWS certification guide + exclusive 50% discount on exam vouchers.</p>
                <p className="text-xs text-muted-foreground mb-6">Join 50,000+ Yatris who are already mastering cloud certifications.</p>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 h-11 rounded-xl"
                  />
                  <Button
                    type="submit"
                    disabled={subscribing}
                    className="h-11 rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold px-6"
                  >
                    {subscribing ? "..." : "Get it free"}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
