import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const TrainerLogin = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                    body: JSON.stringify({
                        action: "trainerLogin",
                        username: formData.username,
                        password: formData.password,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                // Store trainer data in localStorage
                localStorage.setItem("trainerData", JSON.stringify(result.trainer));
                localStorage.setItem("trainerAssignments", JSON.stringify(result.assignments));

                toast({
                    title: "Login Successful!",
                    description: `Welcome back, ${result.trainer.fullName}!`,
                });

                // Redirect to trainer dashboard
                navigate("/trainer/dashboard");
            } else {
                throw new Error(result.error || "Login failed");
            }
        } catch (error: any) {
            toast({
                title: "Login Failed",
                description: error.message || "Please check your credentials",
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
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                                <GraduationCap className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Trainer Login</h1>
                            <p className="text-muted-foreground">
                                Access your trainer dashboard
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => handleChange("username", e.target.value)}
                                    placeholder="Your username"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    placeholder="Your password"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                                size="lg"
                            >
                                {isLoading ? (
                                    "Logging in..."
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Login
                                    </>
                                )}
                            </Button>
                        </form>

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

export default TrainerLogin;
