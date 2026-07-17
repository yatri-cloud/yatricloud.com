import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { unsubscribeByToken, getSubscriberByToken } from "@/lib/newsletter";
import { Button } from "@/components/ui/button";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "already" | "invalid">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      const sub = await getSubscriberByToken(token);
      if (!sub) { setStatus("invalid"); return; }
      if (sub.status === "unsubscribed") { setStatus("already"); return; }
      const result = await unsubscribeByToken(token);
      setStatus(result.ok ? "success" : "invalid");
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-6"
      >
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary motion-reduce:animate-none" />
            <p className="text-muted-foreground text-sm">Processing your request...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              You've been unsubscribed
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              We'll miss you, Yatri! You've been removed from our newsletter list.
            </p>
          </div>
        )}

        {status === "already" && (
          <div className="space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              You're already unsubscribed
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              No further action needed — you're already off the list.
            </p>
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-4">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Link expired or invalid
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              This unsubscribe link is no longer valid. If you still wish to unsubscribe, please contact us.
            </p>
          </div>
        )}

        <Link to="/">
          <Button className="min-h-[44px] rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold">
            Return to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default Unsubscribe;
