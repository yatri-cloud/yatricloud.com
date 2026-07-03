import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, GraduationCap, Users, Award, Send, Upload, LogIn, CheckCircle, Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Country } from "country-state-city";
import { useGoogleLogin } from "@react-oauth/google";
import Navbar from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { listProviders, submitTrainerApplication } from "@/lib/training-api";
import { sendEmail } from "@/lib/email";

interface GoogleUser {
    name: string;
    email: string;
    picture: string;
}

export const BecomeTrainer = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [providers, setProviders] = useState<{ name: string; exams: string[] }[]>([]);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        countryCode: "",
        phoneNumber: "",
        linkedinUrl: "",
        expertise: "",
        certificationProvider: "",
        customProvider: "",
        credentials: [{ providerName: "", link: "" }] as { providerName: string; link: string }[],
        yearsOfExperience: "",
        motivation: "",
        resume: null as File | null,
    });

    // Fetch certification providers
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const result = await listProviders();
                setProviders(result);
            } catch (e) {
                console.error("Failed to fetch providers", e);
            }
        };
        fetchProviders();
    }, []);

    const countries = Country.getAllCountries().map((country) => ({
        value: country.isoCode,
        label: country.name,
        phoneCode: country.phonecode,
    }));

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCountryChange = (countryCode: string) => {
        const country = countries.find((c) => c.value === countryCode);
        setFormData((prev) => ({
            ...prev,
            countryCode: country ? `+${country.phoneCode}` : "",
        }));
    };

    // Google Login handler
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setIsLoggingIn(true);
                // Fetch user profile from Google
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await res.json();

                const user: GoogleUser = {
                    name: profile.name || "",
                    email: profile.email || "",
                    picture: profile.picture || "",
                };

                setGoogleUser(user);
                // Pre-fill form with Google data
                setFormData((prev) => ({
                    ...prev,
                    fullName: user.name,
                    email: user.email,
                }));

                toast({
                    title: "Signed in successfully!",
                    description: `Welcome, ${user.name}`,
                });
            } catch (error) {
                toast({
                    title: "Login Failed",
                    description: "Could not fetch Google profile. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsLoggingIn(false);
            }
        },
        onError: () => {
            toast({
                title: "Login Failed",
                description: "Google sign-in was cancelled or failed.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await submitTrainerApplication({
                fullName: formData.fullName,
                email: formData.email,
                countryCode: formData.countryCode,
                phoneNumber: formData.phoneNumber,
                linkedinUrl: formData.linkedinUrl,
                expertise: formData.expertise,
                certificationProvider: formData.certificationProvider === "Other"
                    ? formData.customProvider
                    : formData.certificationProvider,
                credentialsLinks: JSON.stringify(formData.credentials.filter(c => c.providerName && c.link)),
                yearsOfExperience: formData.yearsOfExperience,
                motivation: formData.motivation,
                resumeFile: formData.resume,
            });

            setIsSubmitted(true);

            // Confirmation email to the applicant, matching the on screen promise.
            sendEmail({
                to: formData.email,
                subject: "Thanks for applying to mentor with Yatri Cloud",
                html: `
                    <div style="font-family: 'Inter Tight', Arial, sans-serif; color: #0f172a; line-height: 1.6;">
                        <h2 style="margin: 0 0 12px;">Thanks for applying, ${formData.fullName || "Yatri"}</h2>
                        <p>We have received your application to mentor with Yatri Cloud.</p>
                        <p>Our team will review it and get back to you soon. Once you are approved, you can start creating trainings.</p>
                        <p style="margin-top: 24px;">Warmly,<br/>The Yatri Cloud Team</p>
                    </div>
                `,
            }).catch(() => { /* email is best effort; the application is already saved */ });
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.message || "Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title="Become a Trainer · Teach with Yatri Cloud"
                description="Love cloud and DevOps? Teach what you know, reach 50K+ learners and grow your name as a cloud trainer with Yatri Cloud."
            />
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
                <div className="container mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                            <GraduationCap className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Become a Yatri Trainer
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Share your expertise and help aspiring professionals achieve their
                            certification goals. Join our community of expert trainers.
                        </p>
                    </motion.div>

                    {/* Benefits */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="grid md:grid-cols-3 gap-6 mt-12"
                    >
                        <div className="bg-card border border-border rounded-xl p-6">
                            <Users className="w-8 h-8 text-primary mb-4 mx-auto" />
                            <h3 className="font-semibold mb-2">Reach Students Globally</h3>
                            <p className="text-sm text-muted-foreground">
                                Connect with learners from around the world
                            </p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <Award className="w-8 h-8 text-primary mb-4 mx-auto" />
                            <h3 className="font-semibold mb-2">Build Your Brand</h3>
                            <p className="text-sm text-muted-foreground">
                                Establish yourself as an industry expert
                            </p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <GraduationCap className="w-8 h-8 text-primary mb-4 mx-auto" />
                            <h3 className="font-semibold mb-2">Flexible Schedule</h3>
                            <p className="text-sm text-muted-foreground">
                                Create content on your own time
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Application Form Section */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                            {isSubmitted ? (
                                /* Success Screen */
                                <div className="text-center py-12 space-y-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    >
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                                        </div>
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        Application Submitted! 🎉
                                    </h2>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Thank you for applying to become a Yatri Trainer, <strong>{googleUser?.name}</strong>!
                                        We've received your application and our team will review it shortly.
                                    </p>
                                    <div className="bg-muted/50 rounded-xl p-6 max-w-sm mx-auto text-left space-y-3">
                                        <h3 className="font-semibold text-sm">What happens next?</h3>
                                        <ul className="text-sm text-muted-foreground space-y-2">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                                                Our team will review your application
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                                                You'll receive an email at <strong>{googleUser?.email}</strong>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                                                Once approved, you can start creating trainings
                                            </li>
                                        </ul>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.href = "/"}
                                        className="mt-4"
                                    >
                                        Back to Home
                                    </Button>
                                </div>
                            ) : !googleUser ? (
                                /* Step 1: Google Login */
                                <div className="text-center py-8 space-y-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                                        <LogIn className="w-8 h-8 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold">
                                        Sign in to Apply
                                    </h2>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Please sign in with your Google account to get started.
                                        Your name and email will be pre-filled from your Google profile.
                                    </p>
                                    <Button
                                        size="lg"
                                        className="gap-3 px-8"
                                        onClick={() => googleLogin()}
                                        disabled={isLoggingIn}
                                    >
                                        {isLoggingIn ? (
                                            "Signing in..."
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                                Continue with Google
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                /* Step 2: Application Form (after Google login) */
                                <>
                                    {/* Logged-in user info */}
                                    <div className="flex items-center gap-4 mb-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                        <img
                                            src={googleUser.picture}
                                            alt={googleUser.name}
                                            className="w-12 h-12 rounded-full border-2 border-green-500/30"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold">{googleUser.name}</p>
                                            <p className="text-sm text-muted-foreground">{googleUser.email}</p>
                                        </div>
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>

                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <UserPlus className="w-6 h-6 text-primary" />
                                        Application Form
                                    </h2>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Full Name (pre-filled, read-only) */}
                                        <div>
                                            <Label htmlFor="fullName">Full Name *</Label>
                                            <Input
                                                id="fullName"
                                                value={formData.fullName}
                                                onChange={(e) => handleChange("fullName", e.target.value)}
                                                placeholder="John Doe"
                                                required
                                                readOnly
                                                className="bg-muted/50"
                                            />
                                        </div>

                                        {/* Email (pre-filled, read-only) */}
                                        <div>
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleChange("email", e.target.value)}
                                                placeholder="john@example.com"
                                                required
                                                readOnly
                                                className="bg-muted/50"
                                            />
                                        </div>

                                        {/* Phone Number */}
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="md:col-span-1">
                                                <Label htmlFor="countryCode">Country Code *</Label>
                                                <Select onValueChange={handleCountryChange} required>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {countries.map((country) => (
                                                            <SelectItem key={country.value} value={country.value}>
                                                                {country.label} (+{country.phoneCode})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label htmlFor="phoneNumber">Phone Number *</Label>
                                                <Input
                                                    id="phoneNumber"
                                                    type="tel"
                                                    value={formData.phoneNumber}
                                                    onChange={(e) =>
                                                        handleChange("phoneNumber", e.target.value)
                                                    }
                                                    placeholder="1234567890"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* LinkedIn URL */}
                                        <div>
                                            <Label htmlFor="linkedinUrl">LinkedIn Profile URL *</Label>
                                            <Input
                                                id="linkedinUrl"
                                                type="url"
                                                value={formData.linkedinUrl}
                                                onChange={(e) =>
                                                    handleChange("linkedinUrl", e.target.value)
                                                }
                                                placeholder="https://linkedin.com/in/yourprofile"
                                                required
                                            />
                                        </div>

                                        {/* Expertise */}
                                        <div>
                                            <Label htmlFor="expertise">
                                                Area of Expertise / Certifications *
                                            </Label>
                                            <Input
                                                id="expertise"
                                                value={formData.expertise}
                                                onChange={(e) => handleChange("expertise", e.target.value)}
                                                placeholder="AWS, Azure, Kubernetes, etc."
                                                required
                                            />
                                        </div>


                                        {/* Credentials — Provider Name + Link pairs */}
                                        <div>
                                            <Label className="flex items-center gap-1 mb-3">
                                                <Link2 className="w-3 h-3" />
                                                Credentials / Certification Links *
                                            </Label>
                                            <div className="space-y-3">
                                                {formData.credentials.map((cred, idx) => (
                                                    <div key={idx} className="flex gap-2 items-start">
                                                        <div className="flex-1 space-y-2">
                                                            <Input
                                                                value={cred.providerName}
                                                                onChange={(e) => {
                                                                    const updated = [...formData.credentials];
                                                                    updated[idx].providerName = e.target.value;
                                                                    setFormData((prev) => ({ ...prev, credentials: updated }));
                                                                }}
                                                                placeholder="Provider name (e.g. AWS, Microsoft, Linux Foundation)"
                                                                required
                                                            />
                                                            <Input
                                                                type="url"
                                                                value={cred.link}
                                                                onChange={(e) => {
                                                                    const updated = [...formData.credentials];
                                                                    updated[idx].link = e.target.value;
                                                                    setFormData((prev) => ({ ...prev, credentials: updated }));
                                                                }}
                                                                placeholder="Credential link (e.g. https://credly.com/badges/...)"
                                                                required
                                                            />
                                                        </div>
                                                        {formData.credentials.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="mt-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => {
                                                                    const updated = formData.credentials.filter((_, i) => i !== idx);
                                                                    setFormData((prev) => ({ ...prev, credentials: updated }));
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            credentials: [...prev.credentials, { providerName: "", link: "" }],
                                                        }));
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Add Another Credential
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Add your Credly badges, Microsoft Learn profile, AWS certification links, etc.
                                            </p>
                                        </div>

                                        {/* Years of Experience */}
                                        <div>
                                            <Label htmlFor="yearsOfExperience">
                                                Years of Experience *
                                            </Label>
                                            <Select
                                                onValueChange={(value) =>
                                                    handleChange("yearsOfExperience", value)
                                                }
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select years" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1-2">1-2 years</SelectItem>
                                                    <SelectItem value="3-5">3-5 years</SelectItem>
                                                    <SelectItem value="6-10">6-10 years</SelectItem>
                                                    <SelectItem value="10+">10+ years</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Motivation */}
                                        <div>
                                            <Label htmlFor="motivation">
                                                Why do you want to be a Yatri Trainer? *
                                            </Label>
                                            <Textarea
                                                id="motivation"
                                                value={formData.motivation}
                                                onChange={(e) => handleChange("motivation", e.target.value)}
                                                placeholder="Share your motivation and teaching philosophy..."
                                                rows={5}
                                                required
                                            />
                                        </div>

                                        {/* Resume Upload */}
                                        <div>
                                            <Label htmlFor="resume">Upload Resume (PDF) *</Label>
                                            <div className="mt-2">
                                                <Input
                                                    id="resume"
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        setFormData((prev) => ({ ...prev, resume: file }));
                                                    }}
                                                    required
                                                    className="cursor-pointer"
                                                />
                                                {formData.resume && (
                                                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                                                        <Upload className="w-4 h-4" />
                                                        {formData.resume.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isSubmitting}
                                            size="lg"
                                        >
                                            {isSubmitting ? (
                                                "Submitting..."
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Submit Application
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default BecomeTrainer;
