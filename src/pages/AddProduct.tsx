import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, Upload, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitProduct } from "@/lib/store-products";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(["AWS", "Azure", "GCP", "Oracle", "Salesforce", "ServiceNow", "GitHub"]),
  originalPrice: z.number().min(0, "Price must be positive"),
  discountedPrice: z.number().min(0, "Price must be positive"),
  discount: z.number().min(0).max(100, "Discount must be between 0-100"),
  image: z.string().url("Must be a valid URL"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  examCode: z.string().optional(),
  level: z.enum(["Associate", "Practitioner", "Professional", "Specialty"]),
});

type ProductFormData = z.infer<typeof productSchema>;

const AddProduct = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: "AWS",
      level: "Associate",
      originalPrice: 15900,
      discountedPrice: 1,
      discount: 50,
    },
  });

  const category = watch("category");
  const originalPrice = watch("originalPrice");
  const discountedPrice = watch("discountedPrice");
  const discountValue = watch("discount");

  // Auto-calculate discount
  const calculateDiscount = () => {
    if (originalPrice > 0 && discountedPrice > 0) {
      const discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
      setValue("discount", discount);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      await submitProduct(data);
      toast.success("Product added successfully!");
      navigate("/yatristore");
    } catch (error) {
      console.error("Error submitting product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO />
      <div className="noise-overlay" />
      <Navbar />
      
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">Add New Product</h1>
            <p className="text-muted-foreground">
              Add a new certification voucher product to the store
            </p>
          </motion.div>

          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Fill in the details below to add a new product to the store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="e.g., AWS Certified Solutions Architect - Associate (SAA-C03)"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Category and Level */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={category}
                      onValueChange={(value) => setValue("category", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AWS">AWS</SelectItem>
                        <SelectItem value="Azure">Azure</SelectItem>
                        <SelectItem value="GCP">GCP</SelectItem>
                        <SelectItem value="Oracle">Oracle</SelectItem>
                        <SelectItem value="Salesforce">Salesforce</SelectItem>
                        <SelectItem value="ServiceNow">ServiceNow</SelectItem>
                        <SelectItem value="GitHub">GitHub</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level *</Label>
                    <Select
                      onValueChange={(value) => setValue("level", value as any)}
                      defaultValue="Associate"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Associate">Associate</SelectItem>
                        <SelectItem value="Practitioner">Practitioner</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Specialty">Specialty</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.level && (
                      <p className="text-sm text-destructive">{errors.level.message}</p>
                    )}
                  </div>
                </div>

                {/* Exam Code */}
                <div className="space-y-2">
                  <Label htmlFor="examCode">Exam Code (Optional)</Label>
                  <Input
                    id="examCode"
                    {...register("examCode")}
                    placeholder="e.g., SAA-C03"
                  />
                </div>

                {/* Pricing */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Original Price (₹) *</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="1"
                      {...register("originalPrice", { valueAsNumber: true })}
                      onChange={(e) => {
                        setValue("originalPrice", parseFloat(e.target.value) || 0);
                        calculateDiscount();
                      }}
                    />
                    {errors.originalPrice && (
                      <p className="text-sm text-destructive">{errors.originalPrice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountedPrice">Discounted Price (₹) *</Label>
                    <Input
                      id="discountedPrice"
                      type="number"
                      step="1"
                      {...register("discountedPrice", { valueAsNumber: true })}
                      onChange={(e) => {
                        setValue("discountedPrice", parseFloat(e.target.value) || 0);
                        calculateDiscount();
                      }}
                    />
                    {errors.discountedPrice && (
                      <p className="text-sm text-destructive">{errors.discountedPrice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (%) *</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="1"
                      {...register("discount", { valueAsNumber: true })}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        const safeValue = isNaN(value) ? 0 : value;
                        setValue("discount", safeValue);
                        // When discount changes, recalculate discounted price from original
                        if (originalPrice > 0) {
                          const newDiscounted = Math.round(originalPrice * (1 - safeValue / 100));
                          setValue("discountedPrice", newDiscounted);
                        }
                      }}
                    />
                    {errors.discount && (
                      <p className="text-sm text-destructive">{errors.discount.message}</p>
                    )}
                  </div>
                </div>

                {/* Image */}
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL *</Label>
                  <Input
                    id="image"
                    {...register("image")}
                    placeholder="https://example.com/image.jpg"
                    onChange={(e) => {
                      setValue("image", e.target.value);
                      setImagePreview(e.target.value);
                    }}
                  />
                  {errors.image && (
                    <p className="text-sm text-destructive">{errors.image.message}</p>
                  )}
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                        onError={() => setImagePreview("")}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Product description..."
                    rows={6}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                {/* Info Alert */}
                <Alert>
                  <AlertDescription>
                    <strong>Note:</strong> If category is AWS, a subsheet named "aws-certifications" will be created automatically.
                    The product will be added to both the main "add-product" sheet and the category-specific subsheet.
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/yatristore")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Product...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AddProduct;


