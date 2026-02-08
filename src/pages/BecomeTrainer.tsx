import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, GraduationCap, Users, Award, Send, Upload } from "lucide-react";
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
import { parsePhoneNumber } from "libphonenumber-js";
import { sendEmail } from "@/lib/email";
import { getWelcomeEmail } from "@/lib/email-templates";
import Navbar from "@/components/Navbar";

export const BecomeTrainer = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        countryCode: "",
        phoneNumber: "",
        linkedinUrl: "",
        expertise: "",
        yearsOfExperience: "",
        motivation: "",
        resume: null as File | null,
    });

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Convert resume to base64 if present
            let resumeBase64 = "";
            if (formData.resume) {
                const reader = new FileReader();
                resumeBase64 = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(formData.resume!);
                });
            }

            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                    body: JSON.stringify({
                        action: "submitTrainerApplication",
                        fullName: formData.fullName,
                        email: formData.email,
                        countryCode: formData.countryCode,
                        phoneNumber: formData.phoneNumber,
                        linkedinUrl: formData.linkedinUrl,
                        expertise: formData.expertise,
                        yearsOfExperience: formData.yearsOfExperience,
                        motivation: formData.motivation,
                        resumeData: resumeBase64,
                        resumeFileName: formData.resume?.name || "",
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Application Submitted! 🎉",
                    description:
                        "We'll review your application and get back to you soon.",
                });
                // Reset form
                setFormData({
                    fullName: "",
                    email: "",
                    countryCode: "",
                    phoneNumber: "",
                    linkedinUrl: "",
                    expertise: "",
                    yearsOfExperience: "",
                    motivation: "",
                    resume: null,
                });
                // Reset file input
                const fileInput = document.getElementById("resume") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            } else {
                throw new Error(result.error || "Submission failed");
            }
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

            {/* Application Form */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <UserPlus className="w-6 h-6 text-primary" />
                                Application Form
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Full Name */}
                                <div>
                                    <Label htmlFor="fullName">Full Name *</Label>
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={(e) => handleChange("fullName", e.target.value)}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        placeholder="john@example.com"
                                        required
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
                        </div>
                    </motion.div>
                </div>
            </section>


        </div>
    );
};

export default BecomeTrainer;
