import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useGoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { verifyTrainerAccess } from "@/lib/training-api";

export const TrainerLogin = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setIsLoading(true);
                // 1. Get Google User Info
                const userInfoRes = await fetch(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    {
                        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                    }
                );
                const googleUser = await userInfoRes.json();

                // 2. Verify Trainer Access against Supabase (role must be 'trainer')
                const result = await verifyTrainerAccess(googleUser.email);

                // Store trainer data in localStorage
                localStorage.setItem("trainerData", JSON.stringify(result.trainer));
                localStorage.setItem("trainerAssignments", JSON.stringify(result.assignments));

                toast({
                    title: "Login Successful!",
                    description: `Welcome back, ${result.trainer.fullName}!`,
                });

                // Redirect to trainer dashboard
                navigate("/trainer/dashboard");
            } catch (error: any) {
                console.error("Login Error:", error);
                toast({
                    title: "Login Failed",
                    description: error.message || "Failed to verify trainer access.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => {
            toast({
                title: "Login Failed",
                description: "Google Login failed. Please try again.",
                variant: "destructive",
            });
            setIsLoading(false);
        },
    });

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
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                                <GraduationCap className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Trainer Portal</h1>
                            <p className="text-muted-foreground">
                                Access your trainer dashboard with Google
                            </p>
                        </div>

                        <div className="space-y-6">
                            <Button
                                onClick={() => login()}
                                className="w-full"
                                disabled={isLoading}
                                size="lg"
                                variant="outline"
                            >
                                {isLoading ? (
                                    "Verifying Access..."
                                ) : (
                                    <>
                                        <svg
                                            className="w-5 h-5 mr-3"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Continue with Google
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            <p>Don't have trainer access?</p>
                            <a href="/creator" className="text-primary hover:underline">
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

/* GoogleOAuthProvider is scoped here (and BecomeTrainer) instead of main.tsx —
   mounting it app-wide loaded Google's 95 KB gsi/client on every page. */
const TrainerLoginPage = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
        <TrainerLogin />
    </GoogleOAuthProvider>
);

export default TrainerLoginPage;
