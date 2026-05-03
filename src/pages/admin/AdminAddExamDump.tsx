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
      await submitExamDump(data);
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
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin/exam-dumps")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Add New Exam Dump</h1>
        <p className="text-muted-foreground">Fill in the details for the certification exam dump</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Dump Information</CardTitle>
          <CardDescription>All fields are required</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title</Label>
              <Input id="title" {...register("title")} placeholder="e.g., AWS Solutions Architect Associate SAA-C03" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Certification Provider</Label>
                <Input id="provider" {...register("provider")} placeholder="e.g., AWS, Azure, GCP" />
                {errors.provider && <p className="text-sm text-destructive">{errors.provider.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="downloadUrl">JioAICloud Resource Link (Sent via email)</Label>
                <Input id="downloadUrl" {...register("downloadUrl")} placeholder="https://jioaicloud.com/s/..." />
                {errors.downloadUrl && <p className="text-sm text-destructive">{errors.downloadUrl.message}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price (₹)</Label>
                <Input id="originalPrice" type="number" {...register("originalPrice", { valueAsNumber: true })} />
                {errors.originalPrice && <p className="text-sm text-destructive">{errors.originalPrice.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Offer Price (₹)</Label>
                <Input id="price" type="number" {...register("price", { valueAsNumber: true })} />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input 
                id="image" 
                {...register("image")} 
                placeholder="https://example.com/image.jpg"
                onChange={(e) => {
                  setValue("image", e.target.value);
                  setImagePreview(e.target.value);
                }}
              />
              {errors.image && <p className="text-sm text-destructive">{errors.image.message}</p>}
              {imagePreview && (
                <div className="mt-2 h-32 w-32 border rounded-lg overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} placeholder="Details about the exam dump..." rows={5} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : <><Plus className="mr-2 h-4 w-4" /> Add Exam Dump</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAddExamDump;
