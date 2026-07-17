import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { unsubscribeByToken, getSubscriberByToken } from "@/lib/newsletter";
import type { Subscriber } from "@/lib/newsletter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const REASONS = [
  "Too many emails",
  "Content isn't relevant to me",
  "I never signed up",
  "I'm switching to another platform",
  "Other",
] as const;

type UnsubStatus =
  | "loading"
  | "confirm"
  | "unsubscribing"
  | "success"
  | "already"
  | "invalid";

const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 2) return email;
  return `${local[0]}${"*".repeat(Math.max(local.length - 2, 1))}${local[local.length - 1]}@${domain}`;
};

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<UnsubStatus>("loading");
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      const sub = await getSubscriberByToken(token);
      if (!sub) {
        setStatus("invalid");
        return;
      }
      if (sub.status === "unsubscribed") {
        setStatus("already");
        return;
      }
      setSubscriber(sub);
      // Restore previously saved reason from localStorage
      const savedReason = localStorage.getItem(`yc_unsub_reason_${token}`);
      if (savedReason) {
        try {
          setSelectedReasons(JSON.parse(savedReason));
        } catch {
          // ignore malformed data
        }
      }
      setStatus("confirm");
    })();
  }, [token]);

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );
  };

  const handleUnsubscribe = async () => {
    if (!token) return;
    // Persist selected reasons in localStorage
    if (selectedReasons.length > 0) {
      try {
        localStorage.setItem(
          `yc_unsub_reason_${token}`,
          JSON.stringify(selectedReasons),
        );
      } catch {
        // localStorage may be unavailable — non-critical
      }
    }
    setStatus("unsubscribing");
    const result = await unsubscribeByToken(token);
    setStatus(result.ok ? "success" : "invalid");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Branded header */}
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold tracking-tight text-primary">
            Yatri Cloud
          </h2>
          <div className="h-px w-10 mx-auto bg-border" />
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary motion-reduce:animate-none" />
            <p className="text-muted-foreground text-sm">
              Looking up your subscription...
            </p>
          </div>
        )}

        {/* Confirm step */}
        {status === "confirm" && subscriber && (
          <div className="space-y-5">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Unsubscribe from Yatri Cloud
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                You are about to unsubscribe{" "}
                <span className="font-medium text-foreground">
                  {maskEmail(subscriber.email)}
                </span>{" "}
                from our newsletter.
              </p>
            </div>

            {/* Reason-for-leaving survey */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-left space-y-3">
              <p className="text-sm font-medium text-foreground">
                Mind telling us why?
                <span className="text-muted-foreground font-normal ml-1">
                  (optional)
                </span>
              </p>
              <div className="space-y-2.5">
                {REASONS.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <Checkbox
                      checked={selectedReasons.includes(reason)}
                      onCheckedChange={() => toggleReason(reason)}
                      className="transition-colors"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {reason}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Confirm button */}
            <Button
              onClick={handleUnsubscribe}
              className="min-h-[44px] rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold transition-colors"
            >
              Confirm Unsubscribe
            </Button>
          </div>
        )}

        {/* Unsubscribing spinner */}
        {status === "unsubscribing" && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary motion-reduce:animate-none" />
            <p className="text-muted-foreground text-sm">
              Unsubscribing you now...
            </p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="space-y-5">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                You've been unsubscribed
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                We'll miss you, Yatri!
              </p>
            </div>
            <div className="space-y-2.5">
              <Link to="/#subscribe" className="block">
                <Button className="min-h-[44px] w-full rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold transition-colors">
                  Changed your mind? Subscribe again
                </Button>
              </Link>
              <Link to="/" className="block">
                <Button
                  variant="ghost"
                  className="min-h-[44px] w-full rounded-xl font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Already unsubscribed */}
        {status === "already" && (
          <div className="space-y-5">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                You're already unsubscribed
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                No further action needed — you're already off the list.
              </p>
            </div>
            <div className="space-y-2.5">
              <Link to="/#subscribe" className="block">
                <Button className="min-h-[44px] w-full rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold transition-colors">
                  Changed your mind? Subscribe again
                </Button>
              </Link>
              <Link to="/" className="block">
                <Button
                  variant="ghost"
                  className="min-h-[44px] w-full rounded-xl font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Invalid / expired */}
        {status === "invalid" && (
          <div className="space-y-5">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Link expired or invalid
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Contact us at{" "}
                <a
                  href="mailto:info@yatricloud.com"
                  className="text-primary hover:underline font-medium"
                >
                  info@yatricloud.com
                </a>{" "}
                for help.
              </p>
            </div>
            <Link to="/" className="block">
              <Button className="min-h-[44px] w-full rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold transition-colors">
                Return to Home
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Unsubscribe;
