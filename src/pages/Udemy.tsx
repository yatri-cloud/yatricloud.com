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
import { Loader2, CheckCircle2, Upload, X, LogOut, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import LoginForm from "@/components/udemy/LoginForm";
import { supabase } from "@/lib/supabase";
import { useSiteContent, getOptionList, FALLBACK_OPTION_LISTS } from "@/lib/site-content";

interface UdemyCourseFormData {
  courseTitle: string;
  courseLink: string;
  imageFile: File | null;
  creator: string;
  tech: string;
  category: string;
}

const Udemy = () => {
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const token = sessionStorage.getItem("udemy_auth_token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("udemy_auth_token");
    sessionStorage.removeItem("udemy_auth_email");
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
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
      
      // Create preview
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
      // 1) Upload cover image to Storage.
      const path = `udemy/${Date.now()}-${data.imageFile.name.replace(/[^\w.-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, data.imageFile, { upsert: true });
      if (upErr) throw new Error("Image upload failed: " + upErr.message);
      const imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;

      // 2) Insert the course (admin-only via RLS).
      const { error } = await supabase.from("udemy_courses").insert({
        title: data.courseTitle,
        course_url: data.courseLink,
        image_url: imageUrl,
        creator: data.creator,
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

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO
          title="Udemy Cloud Courses · Yatri Cloud"
          description="Free and discounted Udemy courses for AWS, Azure, GCP and Kubernetes. Share a great course and help 50K+ Yatris learn cloud for less."
        />
        <Navbar />
        <LoginForm onLoginSuccess={handleLoginSuccess} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Udemy Cloud Courses · Yatri Cloud"
        description="Free and discounted Udemy courses for AWS, Azure, GCP and Kubernetes. Share a great course and help 50K+ Yatris learn cloud for less."
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <ScrollReveal>
              <div className="mb-10">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-brand-50 px-4 py-1.5 text-sm font-medium text-primary">
                    <GraduationCap className="h-4 w-4" aria-hidden="true" />
                    Udemy Courses
                  </span>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    aria-label="Log out"
                    className="flex min-h-[44px] items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Logout
                  </Button>
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                  Share a course with the <span className="gradient-text">Yatris</span>
                </h1>
                <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                  Add a Udemy course to the catalog. Once it's in, 50,000+ Yatris can find it,
                  learn from it, and level up their cloud careers.
                </p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <li className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                    Seen by 50,000+ learners
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                    Reviewed before it goes live
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-10"
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
                      className="w-full min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg shadow-inset-btn"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Publishing your course…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Publish course
                        </>
                      )}
                    </Button>
                    <p className="mt-3 text-center text-sm text-muted-foreground">
                      No stress — you can edit or resubmit anytime.
                    </p>
                  </div>
                </form>
              </motion.div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Udemy;

