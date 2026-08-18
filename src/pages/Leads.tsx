import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

import { submitLead } from "@/lib/crm-leads";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contact: z.string().min(5, "Please enter a valid contact number"),
  email: z.string().email("Please enter a valid email address").or(z.literal("")),
  linkedin_profile: z.string().url("Please enter a valid LinkedIn URL").or(z.literal("")),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export default function Leads() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      linkedin_profile: "",
      notes: "",
    },
  });

  const onSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);
    try {
      await submitLead({
        name: data.name,
        contact: data.contact,
        email: data.email || null,
        linkedin_profile: data.linkedin_profile || null,
        notes: data.notes || null,
      });
      setIsSuccess(true);
      toast.success("Thank you! We have received your details.");
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO title="Partner With Us · Yatri Cloud" description="Submit your details to partner with Yatri Cloud." />
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-24 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-brand-200/20 rounded-full blur-[128px] pointer-events-none -z-10" />

        <section className="container mx-auto max-w-2xl px-4 md:px-6 relative z-10">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Partner With <span className="text-primary">Us</span>
            </h1>
            <p className="mx-auto max-w-xl text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
              Ready to collaborate? Leave your details below and our team will connect with you shortly.
            </p>
          </div>

          <div className="group bg-background/60 backdrop-blur-xl border border-border/50 hover:border-primary/20 hover:bg-background/80 transition-all duration-500 rounded-[32px] p-8 md:p-12 shadow-2xl shadow-primary/5 hover:shadow-primary/10 relative overflow-hidden">
            {isSuccess ? (
              <div className="relative z-10 text-center py-16">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-600 mb-8">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display text-3xl font-bold mb-4">Request Received!</h3>
                <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
                  Thank you for reaching out. Our team is reviewing your details and will get back to you soon.
                </p>
                <Button onClick={() => setIsSuccess(false)} variant="outline" size="lg" className="h-12 px-8 rounded-full font-medium">
                  Submit another response
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-foreground/80">Full Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" className="h-14 rounded-2xl bg-card text-base px-5 border-border/40 hover:border-border/80 transition-colors focus-visible:ring-primary/20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-foreground/80">Contact Number <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 000-0000" className="h-14 rounded-2xl bg-card text-base px-5 border-border/40 hover:border-border/80 transition-colors focus-visible:ring-primary/20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-foreground/80">Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="jane@example.com" type="email" className="h-14 rounded-2xl bg-card text-base px-5 border-border/40 hover:border-border/80 transition-colors focus-visible:ring-primary/20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="linkedin_profile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-foreground/80">LinkedIn Profile URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/in/..." className="h-14 rounded-2xl bg-card text-base px-5 border-border/40 hover:border-border/80 transition-colors focus-visible:ring-primary/20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-foreground/80">Additional Notes or Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us what you're looking for..." 
                            className="min-h-[140px] rounded-2xl bg-card text-base p-5 border-border/40 hover:border-border/80 transition-colors focus-visible:ring-primary/20 resize-y"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 flex justify-center">
                    <Button 
                      type="submit" 
                      size="lg"
                      className="w-full md:w-auto min-w-[240px] h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Details
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
