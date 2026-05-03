import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchExamDumps, updateExamDump, type ExamDump } from "@/lib/exam-dumps";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";

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

const AdminEditExamDump = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<DumpFormData>({
    resolver: zodResolver(dumpSchema),
  });

  useEffect(() => {
    const loadDump = async () => {
      try {
        setIsLoading(true);
        const dumps = await fetchExamDumps();
        const dump = dumps.find(d => d.id === id);
        
        if (dump) {
          reset({
            title: dump.title,
            provider: dump.provider,
            originalPrice: dump.originalPrice,
            price: dump.price,
            image: dump.image,
            downloadUrl: dump.downloadUrl,
            description: dump.description,
          });
          setImagePreview(dump.image);
        } else {
          toast.error("Exam dump not found");
          navigate("/admin/exam-dumps");
        }
      } catch (error) {
        console.error("Error loading dump:", error);
        toast.error("Failed to load exam dump");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadDump();
    }
  }, [id, reset, navigate]);

  const onSubmit = async (data: DumpFormData) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateExamDump(id, data);
      toast.success("Exam dump updated successfully!");
      navigate("/admin/exam-dumps");
    } catch (error) {
      console.error("Error updating dump:", error);
      toast.error("Failed to update exam dump");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p>Loading exam dump details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin/exam-dumps")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Edit Exam Dump</h1>
        <p className="text-muted-foreground">Update the details for this certification exam dump</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Dump Information</CardTitle>
          <CardDescription>Update fields as needed</CardDescription>
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
                <Label htmlFor="downloadUrl">JioAICloud Resource Link</Label>
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
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEditExamDump;
