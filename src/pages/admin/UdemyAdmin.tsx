import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import ScrollReveal from "@/components/ScrollReveal";

interface UdemyCourseFormData {
    courseTitle: string;
    courseLink: string;
    imageFile: File | null;
    creator: string;
    tech: string;
    category: string;
}

const CREATORS = [
    { value: "yatharth-chauhan", label: "Yatharth Chauhan" },
    { value: "nensi-ravaliya", label: "Nensi Ravaliya" },
];

const TECH_OPTIONS = [
    { value: "AWS", label: "AWS" },
    { value: "Azure", label: "Azure" },
    { value: "Google Cloud", label: "Google Cloud" },
    { value: "GitHub", label: "GitHub" },
    { value: "Oracle", label: "Oracle" },
    { value: "Salesforce", label: "Salesforce" },
    { value: "ServiceNow", label: "ServiceNow" },
];

const CATEGORY_OPTIONS = [
    { value: "cloud", label: "Cloud" },
    { value: "devops", label: "DevOps" },
    { value: "ai", label: "AI" },
    { value: "data", label: "Data" },
    { value: "security", label: "Security" },
    { value: "networking", label: "Networking" },
    { value: "other", label: "Other" },
];

const UdemyAdmin = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<UdemyCourseFormData>({
        defaultValues: {
            courseTitle: "",
            courseLink: "",
            imageFile: null,
            creator: "",
            tech: "",
            category: "",
        },
    });

    const creator = watch("creator");

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Error",
                    description: "Please select an image file",
                    variant: "destructive",
                });
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "Error",
                    description: "Image size should be less than 5MB",
                    variant: "destructive",
                });
                return;
            }

            setSelectedImage(file);
            setValue("imageFile", file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setValue("imageFile", null);
    };

    const getWebhookUrl = (creator: string): string => {
        if (creator === "yatharth-chauhan") {
            return import.meta.env.VITE_UDEMY_YATHARTH_WEBHOOK_URL || "";
        } else if (creator === "nensi-ravaliya") {
            return import.meta.env.VITE_UDEMY_NENSI_WEBHOOK_URL || "";
        }
        return "";
    };

    const onSubmit = async (data: UdemyCourseFormData) => {
        if (!data.creator) {
            toast({
                title: "Error",
                description: "Please select a creator",
                variant: "destructive",
            });
            return;
        }

        if (!data.imageFile) {
            toast({
                title: "Error",
                description: "Please select an image",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const webhookUrl = getWebhookUrl(data.creator);
            if (!webhookUrl) {
                throw new Error("Webhook URL not configured for this creator");
            }

            const imageBase64 = await fileToBase64(data.imageFile);

            const response = await fetch(webhookUrl, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    courseTitle: data.courseTitle,
                    courseLink: data.courseLink,
                    imageLink: imageBase64,
                    creator: data.creator,
                    tech: data.tech,
                    category: data.category,
                }),
            });

            toast({
                title: "Success!",
                description: "Course submitted successfully",
            });
            reset();
            setSelectedImage(null);
            setImagePreview(null);
        } catch (error: any) {
            console.error("Error submitting course:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit course. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (

        <div className="p-8">
            <ScrollReveal>
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">
                        Add <span className="gradient-text">Udemy Course</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Submit a new course to be displayed in the course section
                    </p>
                </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-xl max-w-4xl"
                >
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Course Title */}
                        <div className="space-y-2">
                            <Label htmlFor="courseTitle">
                                Course Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="courseTitle"
                                {...register("courseTitle", {
                                    required: "Course title is required",
                                })}
                                placeholder="e.g., AWS Certified Solutions Architect - Associate"
                                className="w-full"
                            />
                            {errors.courseTitle && (
                                <p className="text-sm text-destructive">
                                    {errors.courseTitle.message}
                                </p>
                            )}
                        </div>

                        {/* Course Link */}
                        <div className="space-y-2">
                            <Label htmlFor="courseLink">
                                Course Link (Udemy URL) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="courseLink"
                                type="url"
                                {...register("courseLink", {
                                    required: "Course link is required",
                                    pattern: {
                                        value: /^https?:\/\/.+/,
                                        message: "Please enter a valid URL",
                                    },
                                })}
                                placeholder="https://www.udemy.com/course/..."
                                className="w-full"
                            />
                            {errors.courseLink && (
                                <p className="text-sm text-destructive">
                                    {errors.courseLink.message}
                                </p>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="imageFile">
                                Course Image <span className="text-destructive">*</span>
                            </Label>
                            {!imagePreview ? (
                                <div className="relative">
                                    <Input
                                        id="imageFile"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full cursor-pointer"
                                        required
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Upload className="w-4 h-4" />
                                            <span className="text-sm">Click to upload image</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="relative rounded-lg overflow-hidden border-2 border-border mx-auto" style={{ width: '750px', maxWidth: '100%', aspectRatio: '750/422' }}>
                                        <img
                                            src={imagePreview}
                                            alt="Course preview"
                                            className="w-full h-full object-cover"
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {selectedImage?.name} ({selectedImage ? ((selectedImage.size / 1024 / 1024).toFixed(2)) : '0.00'} MB)
                                    </p>
                                </div>
                            )}
                            {errors.imageFile && (
                                <p className="text-sm text-destructive">
                                    {errors.imageFile.message}
                                </p>
                            )}
                        </div>

                        {/* Creator */}
                        <div className="space-y-2">
                            <Label htmlFor="creator">
                                Creator <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={creator}
                                onValueChange={(value) => setValue("creator", value)}
                            >
                                <SelectTrigger id="creator" className="w-full">
                                    <SelectValue placeholder="Select creator" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CREATORS.map((creator) => (
                                        <SelectItem key={creator.value} value={creator.value}>
                                            {creator.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.creator && (
                                <p className="text-sm text-destructive">
                                    {errors.creator.message}
                                </p>
                            )}
                        </div>

                        {/* Tech */}
                        <div className="space-y-2">
                            <Label htmlFor="tech">
                                Tech Name <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={watch("tech")}
                                onValueChange={(value) => setValue("tech", value)}
                            >
                                <SelectTrigger id="tech" className="w-full">
                                    <SelectValue placeholder="Select tech" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TECH_OPTIONS.map((tech) => (
                                        <SelectItem key={tech.value} value={tech.value}>
                                            {tech.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.tech && (
                                <p className="text-sm text-destructive">
                                    {errors.tech.message}
                                </p>
                            )}
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">
                                Category <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={watch("category")}
                                onValueChange={(value) => setValue("category", value)}
                            >
                                <SelectTrigger id="category" className="w-full">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORY_OPTIONS.map((category) => (
                                        <SelectItem key={category.value} value={category.value}>
                                            {category.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-sm text-destructive">
                                    {errors.category.message}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-5 w-5" />
                                        Submit Course
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </ScrollReveal>
        </div>

    );
};

export default UdemyAdmin;
