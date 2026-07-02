import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signInWithPassword, sendPasswordReset, hasSession } from "@/lib/auth";

/**
 * Mentor sign in. Mentors use their normal Yatri Cloud account (the email
 * on their approved application). After sign in we send them to the mentor
 * dashboard, which opens their tools or shows the apply screen if they are
 * not a mentor yet.
 */
export const MentorLogin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Already signed in? Go straight to the dashboard.
    useEffect(() => {
        if (hasSession()) navigate("/mentor/dashboard", { replace: true });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { user, error } = await signInWithPassword(email, password);
        setLoading(false);
        if (error || !user) {
            toast({ title: "Sign in failed", description: error || "Please check your email and password.", variant: "destructive" });
            return;
        }
        navigate("/mentor/dashboard");
    };

    const handleForgot = async () => {
        if (!email) {
            toast({ title: "Enter your email first", description: "Type your email above, then tap reset password.", variant: "destructive" });
            return;
        }
        const { error } = await sendPasswordReset(email);
        toast({
            title: error ? "Could not send the email" : "Check your inbox",
            description: error || "We sent you a link to set a new password.",
            variant: error ? "destructive" : "default",
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO title="Mentor Sign In · Yatri Cloud" description="Sign in to your Yatri Cloud mentor dashboard to manage your services, availability and bookings." noindex />
            <Navbar />
            <main className="flex items-center justify-center px-4 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-lg">
                        <div className="mb-8">
                            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Mentor</span>
                            <h1 className="font-display text-3xl font-bold tracking-tight mt-2">Welcome back</h1>
                            <p className="text-muted-foreground mt-2">
                                Sign in with your Yatri Cloud account to open your mentor dashboard.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="mentor-email">Email</Label>
                                <Input id="mentor-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mentor-password">Password</Label>
                                <Input id="mentor-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="h-11" />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
                            </Button>
                        </form>

                        <div className="mt-6 flex flex-col gap-2 text-sm text-center text-muted-foreground">
                            <button type="button" onClick={handleForgot} className="text-primary hover:underline">
                                Forgot your password?
                            </button>
                            <p>
                                Not a mentor yet?{" "}
                                <a href="/mentorship/apply" className="text-primary hover:underline">
                                    Apply to mentor Yatris
                                </a>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
};

export default MentorLogin;
