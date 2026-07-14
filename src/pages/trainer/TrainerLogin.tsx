import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { verifyTrainerAccess } from "@/lib/training-api";
import { signInWithGoogleIdToken } from "@/lib/auth";
import { loadGoogleIdentity } from "@/lib/third-party";

/** Google Identity Services attaches itself to window.google at runtime. */
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
                    renderButton: (parent: HTMLElement | null, options: Record<string, unknown>) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

/**
 * Trainer portal sign-in. "Continue with Google" now performs a REAL Supabase
 * sign-in (signInWithIdToken) — establishing a session as that Google account —
 * then gates on the profile role. Previously the Google popup didn't create a
 * session; it only verified a pre-existing one, so trainers who weren't already
 * signed into Yatri Cloud were stuck. Uses Google Identity Services directly,
 * the same flow as the main login.
 */
const TrainerLogin = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const btnRef = useRef<HTMLDivElement>(null);

    // Initialize GSI and render Google's official button into btnRef.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (!client_id || client_id.includes("YOUR_GOOGLE")) {
                console.warn("Google Client ID missing in .env");
                return;
            }
            const ready = await loadGoogleIdentity();
            if (!ready || cancelled || !window.google || !btnRef.current) return;
            try {
                window.google.accounts.id.initialize({ client_id, callback: handleGoogleResponse });
                window.google.accounts.id.renderButton(btnRef.current, {
                    theme: "outline",
                    size: "large",
                    width: 320,
                    text: "continue_with",
                    shape: "pill",
                });
            } catch (e) {
                console.error("Google Auth init error", e);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGoogleResponse = async (response: { credential: string }) => {
        try {
            setIsLoading(true);
            // 1. Establish a real Yatri Cloud (Supabase) session from the Google ID token.
            const { user, error } = await signInWithGoogleIdToken(response.credential);
            if (error || !user) {
                toast({ title: "Sign-in failed", description: error || "Could not sign in with Google.", variant: "destructive" });
                return;
            }
            // 2. Gate on the profile role (trainer/admin) — reads the live role + RLS.
            const result = await verifyTrainerAccess();
            localStorage.setItem("trainerData", JSON.stringify(result.trainer));
            localStorage.setItem("trainerAssignments", JSON.stringify(result.assignments));
            toast({ title: "Welcome back!", description: `Signed in as ${result.trainer.fullName || user.email}.` });
            navigate("/trainer/dashboard");
        } catch (err: any) {
            // Signed in, but not an approved trainer — keep the session (they can use
            // the main site), just deny the trainer portal.
            toast({
                title: "No trainer access",
                description: err?.message || "This account isn't an approved trainer yet.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 pt-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                                <GraduationCap className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Trainer Portal</h1>
                            <p className="text-muted-foreground">
                                Sign in with Google to reach your trainer dashboard.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex min-h-[44px] items-center justify-center">
                                {isLoading ? (
                                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Signing you in…
                                    </span>
                                ) : (
                                    <div ref={btnRef} />
                                )}
                            </div>
                        </div>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            <p>Don't have trainer access?</p>
                            <a href="/trainer" className="text-primary hover:underline">
                                Apply to become a trainer
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
};

export default TrainerLogin;
