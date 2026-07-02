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
import { supabase } from "@/lib/supabase";
import { useSiteContent, getOptionList, FALLBACK_OPTION_LISTS } from "@/lib/site-content";

import ScrollReveal from "@/components/ScrollReveal";

interface UdemyCourseFormData {
    courseTitle: string;
    courseLink: string;
    imageFile: File | null;
    creator: string;
    tech: string;
    category: string;
}

const UdemyAdmin = () => {
    const { toast } = useToast();

    /* Select options come from Supabase `option_lists` (seeded identical
     * to the fallbacks, so nothing visibly changes). */
    const CREATORS = useSiteContent(
        () => getOptionList("udemy_creator"),
        FALLBACK_OPTION_LISTS.udemy_creator
    );
    const TECH_OPTIONS = useSiteContent(
        () => getOptionList("course_tech"),
        FALLBACK_OPTION_LISTS.course_tech
    );
    const CATEGORY_OPTIONS = useSiteContent(
        () => getOptionList("course_category"),
        FALLBACK_OPTION_LISTS.course_category
    );
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

    const CREATOR_DISPLAY: Record<string, string> = {
        "yatharth-chauhan": "Yatharth Chauhan",
        "nensi-ravaliya": "Nensi Ravaliya",
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
            // 1) Upload cover image to Storage (admin-only bucket policy)
            const path = `udemy/${Date.now()}-${data.imageFile.name.replace(/[^\w.-]+/g, "_")}`;
            const { error: upErr } = await supabase.storage
                .from("product-images")
                .upload(path, data.imageFile, { upsert: true });
            if (upErr) throw new Error("Image upload failed: " + upErr.message);
            const imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;

            // 2) Insert the course (admin-only via RLS)
            const { error } = await supabase.from("udemy_courses").insert({
                title: data.courseTitle,
                course_url: data.courseLink,
                image_url: imageUrl,
                creator: CREATOR_DISPLAY[data.creator] ?? data.creator,
                tech: data.tech || null,
                category: data.category || null,
                status: "published",
            });
            if (error) {
                throw new Error(
                    error.message.includes("duplicate")
                        ? "A course with this link already exists."
                        : error.message.includes("row-level security")
                        ? "You need an admin account to add courses — please sign in as admin."
                        : error.message
                );
            }

            toast({
                title: "Success!",
                description: "Course published — it's live on the site immediately.",
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

        <div className="px-4 md:px-8 py-8 md:py-10">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <ScrollReveal>
                {/* Header band — distinct blue-tinted workspace panel */}
                <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                    <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Udemy management
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                                Add <span className="gradient-text">Udemy Course</span>
                            </h1>
                            <p className="text-muted-foreground">
                                Submit a new course to feature in the course section.
                            </p>
                        </div>
                    </div>
                </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-5 md:p-6"
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
                                className="w-full min-h-[44px] rounded-xl"
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
                                className="w-full min-h-[44px] rounded-xl"
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
                                        className="w-full min-h-[44px] rounded-xl cursor-pointer"
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
                                    <div className="relative rounded-xl overflow-hidden border border-border mx-auto" style={{ width: '750px', maxWidth: '100%', aspectRatio: '750/422' }}>
                                        <img
                                            src={imagePreview}
                                            alt="Course preview"
                                            className="w-full h-full object-cover"
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            aria-label="Remove selected image"
                                            className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
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
                                <SelectTrigger id="creator" className="w-full min-h-[44px] rounded-xl">
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
                                <SelectTrigger id="tech" className="w-full min-h-[44px] rounded-xl">
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
                                <SelectTrigger id="category" className="w-full min-h-[44px] rounded-xl">
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
                                className="w-full min-h-[44px] rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn py-6 text-lg"
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
        </div>

    );
};

export default UdemyAdmin;
