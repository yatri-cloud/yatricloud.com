import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
// Removed dropdown Select import — using star-based UI instead
import { useToast } from "@/hooks/use-toast";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { COUNTRY_OPTIONS, getCountryFlag } from "@/lib/country-flag";
import {
  useCertCatalog,
  getReviewProviders,
  FALLBACK_REVIEW_PROVIDERS,
} from "@/lib/cert-catalog";

type ReviewFormData = {
  name: string;
  feedback: string;
  rating: string;
  linkedinProfile?: string;
  provider?: string;
  country?: string;
};

const RATINGS = [1, 2, 3, 4, 5];

const Review = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Provider list from the certification catalog (labels and hex colors)
  const PROVIDERS = useCertCatalog(getReviewProviders, FALLBACK_REVIEW_PROVIDERS);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ReviewFormData>({
    defaultValues: {
      name: "",
      feedback: "",
      rating: "",
      linkedinProfile: "",
      provider: "",
      country: "",
    },
  });

  const rating = watch("rating");

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      // Public review submit → Supabase `reviews` (RLS: anyone may insert).
      // Extra context lives in `context` JSON so the review wall can show it.
      const { error } = await supabase.from("reviews").insert({
        name: data.name,
        review: data.feedback,
        rating: Number(data.rating) || null,
        context: JSON.stringify({
          provider: data.provider || "",
          country: data.country || "",
          linkedin: data.linkedinProfile || "",
          source: "web",
        }),
        is_public: true,
      });
      if (error) throw new Error(error.message);

      toast({
        title: "Thank you for your feedback!",
        description: "Your review has been submitted — it'll appear on the wall shortly.",
      });
      reset();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Share Your Feedback · Yatri Cloud"
        description="Tell us how Yatri Cloud helped you get certified. Your honest words guide thousands of learners on the same journey."
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <ScrollReveal>
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Add Your <span className="gradient-text">Review</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Share your experience with us!
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...register("name", { required: "Name is required" })}
                      placeholder="Your Name"
                      className="w-full"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Feedback */}
                  <div className="space-y-2">
                    <Label htmlFor="feedback">
                      Feedback <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="feedback"
                      {...register("feedback", { required: "Feedback is required" })}
                      placeholder="Share your thoughts..."
                      className="w-full"
                    />
                    {errors.feedback && (
                      <p className="text-sm text-destructive">{errors.feedback.message}</p>
                    )}
                  </div>

                  {/* Certificate Provider */}
                  <div className="space-y-2">
                    <Label htmlFor="provider">
                      Certificate Provider <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="provider"
                      {...register("provider", { required: "Please select a certificate provider" })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- Select a provider --</option>
                      {PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    {errors.provider && (
                      <p className="text-sm text-destructive">{errors.provider.message}</p>
                    )}
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <Label htmlFor="country">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="country"
                      {...register("country", { required: "Please select your country" })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- Select country --</option>
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {getCountryFlag(c.value)} {c.label}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="text-sm text-destructive">{errors.country.message}</p>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="space-y-6">
                    <Label id="rating-label" htmlFor="rating-stars">
                      Rating <span className="text-destructive">*</span>
                    </Label>

                    {/* Star-based Rating UI */}
                    <div id="rating-stars" className="flex items-center space-x-2" role="group" aria-labelledby="rating-label">
                      {RATINGS.map((n, i) => {
                        const selected = parseInt(watch("rating") || "0", 10);
                        const filled = selected >= n;
                        return (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={filled}
                            aria-label={`${n} star${n === 1 ? '' : 's'}`}
                            onClick={() => setValue("rating", String(n))}
                            className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-300"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              className={`w-7 h-7 transition-colors ${filled ? 'text-amber-400' : 'text-muted-foreground'}`}
                              fill={filled ? 'currentColor' : 'none'}
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </button>
                        );
                      })}
                      <span className="ml-3 text-sm text-muted-foreground">{watch("rating") ? `${watch("rating")} Star${watch("rating") === '1' ? '' : 's'}` : 'No rating'}</span>
                    </div>

                    {/* Dropdown removed — star UI used for rating selection */}

                    {errors.rating && (
                      <p className="text-sm text-destructive">{errors.rating.message}</p>
                    )}
                  </div>

                  {/* LinkedIn Profile */}
                  <div className="space-y-2">
                    <Label htmlFor="linkedinProfile">
                      LinkedIn Profile <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="linkedinProfile"
                      type="url"
                      {...register("linkedinProfile", {
                        required: "LinkedIn Profile is required",
                        pattern: {
                          value: /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/.*$/,
                          message: "Please enter a valid LinkedIn profile URL",
                        },
                      })}
                      placeholder="https://www.linkedin.com/in/..."
                      className="w-full"
                    />
                    {errors.linkedinProfile && (
                      <p className="text-sm text-destructive">
                        {errors.linkedinProfile.message}
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
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </div>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Review;


