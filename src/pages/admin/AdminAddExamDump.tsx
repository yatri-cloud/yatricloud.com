import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { submitExamDump } from "@/lib/exam-dumps";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const dumpSchema = z.object({
  title: z.string().min(1, "Title is required"),
  provider: z.string().min(1, "Provider is required (e.g. AWS, Azure)"),
  originalPrice: z.number().min(0, "Price must be positive"),
  price: z.number().min(0, "Price must be positive"),
  image: z.string().url("Must be a valid URL"),
  downloadUrl: z.string().url("Must be a valid JioAICloud link URL"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type DumpFormData = z.infer<typeof dumpSchema>;

const AdminAddExamDump = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DumpFormData>({
    resolver: zodResolver(dumpSchema),
    defaultValues: {
      originalPrice: 499,
      price: 99,
    },
  });

  const onSubmit = async (data: DumpFormData) => {
    setIsSubmitting(true);
    try {
      // zod validates all required fields at runtime; with strictNullChecks off,
      // z.infer marks every field optional, so re-assert the validated shape here.
      await submitExamDump(data as Parameters<typeof submitExamDump>[0]);
      toast.success("Exam dump added successfully!");
      navigate("/admin/exam-dumps");
    } catch (error) {
      console.error("Error submitting dump:", error);
      toast.error("Failed to add exam dump");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-8 md:py-10">
      <Button variant="ghost" onClick={() => navigate("/admin/exam-dumps")} className="mb-6 min-h-[44px] rounded-xl hover:bg-brand-50 hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Add New Exam Dump</h1>
        <p className="text-muted-foreground mt-1.5">Fill in the details for the certification exam dump.</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dump details */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
          <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">1</span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold tracking-tight">Dump Details</h2>
              <p className="text-sm text-muted-foreground">Title, provider, resource link, and description — all required.</p>
            </div>
          </div>

          <div>
            <Label htmlFor="title" className="block text-sm font-medium mb-1.5">Exam Title</Label>
            <Input id="title" {...register("title")} placeholder="e.g., AWS Solutions Architect Associate SAA-C03" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="provider" className="block text-sm font-medium mb-1.5">Certification Provider</Label>
              <Input id="provider" {...register("provider")} placeholder="e.g., AWS, Azure, GCP" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
              {errors.provider && <p className="text-sm text-destructive mt-1">{errors.provider.message}</p>}
            </div>
            <div>
              <Label htmlFor="downloadUrl" className="block text-sm font-medium mb-1.5">JioAICloud Resource Link</Label>
              <Input id="downloadUrl" {...register("downloadUrl")} placeholder="https://jioaicloud.com/s/..." className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
              <p className="text-xs text-muted-foreground mt-1">Sent to buyers via email after purchase.</p>
              {errors.downloadUrl && <p className="text-sm text-destructive mt-1">{errors.downloadUrl.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="block text-sm font-medium mb-1.5">Description</Label>
            <Textarea id="description" {...register("description")} placeholder="Details about the exam dump..." rows={5} className="min-h-[110px] rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
          <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">2</span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold tracking-tight">Pricing</h2>
              <p className="text-sm text-muted-foreground">List price and the offer buyers pay.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="originalPrice" className="block text-sm font-medium mb-1.5">Original Price (₹)</Label>
              <Input id="originalPrice" type="number" {...register("originalPrice", { valueAsNumber: true })} className="h-11 rounded-xl border border-input bg-background tabular-nums focus:ring-2 focus:ring-ring focus:border-primary" />
              {errors.originalPrice && <p className="text-sm text-destructive mt-1">{errors.originalPrice.message}</p>}
            </div>
            <div>
              <Label htmlFor="price" className="block text-sm font-medium mb-1.5">Offer Price (₹)</Label>
              <Input id="price" type="number" {...register("price", { valueAsNumber: true })} className="h-11 rounded-xl border border-input bg-background tabular-nums focus:ring-2 focus:ring-ring focus:border-primary" />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
          <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">3</span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold tracking-tight">Media</h2>
              <p className="text-sm text-muted-foreground">A cover image shown on the listing.</p>
            </div>
          </div>

          <div>
            <Label htmlFor="image" className="block text-sm font-medium mb-1.5">Image URL</Label>
            <Input
              id="image"
              {...register("image")}
              placeholder="https://example.com/image.jpg"
              onChange={(e) => {
                setValue("image", e.target.value);
                setImagePreview(e.target.value);
              }}
              className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary"
            />
            {errors.image && <p className="text-sm text-destructive mt-1">{errors.image.message}</p>}
            {imagePreview && (
              <div className="mt-3 h-32 w-32 border border-border rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : <><Plus className="mr-2 h-4 w-4" /> Add Exam Dump</>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddExamDump;
