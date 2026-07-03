import { useState, useEffect } from "react";
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
import AddProductLoginForm from "@/components/store/AddProductLoginForm";
import { useSiteContent, getOptionList, FALLBACK_OPTION_LISTS } from "@/lib/site-content";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  /* Select options come from Supabase `option_lists` (seeded identical
   * to the fallbacks, so nothing visibly changes). */
  const storeCategories = useSiteContent(
    () => getOptionList("store_category"),
    FALLBACK_OPTION_LISTS.store_category
  );
  const productLevels = useSiteContent(
    () => getOptionList("product_level"),
    FALLBACK_OPTION_LISTS.product_level
  );

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

  // Helpers to safely parse numbers from text inputs
  const parseNumber = (value: string) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Keep the three pricing fields in sync:
  // - When original or discounted changes -> update discount %
  // - When original or discount % changes -> update discounted
  const updateFromOriginalAndDiscounted = (nextOriginal: number, nextDiscounted: number) => {
    if (nextOriginal > 0 && nextDiscounted >= 0) {
      const nextDiscount = Math.round(((nextOriginal - nextDiscounted) / nextOriginal) * 100);
      setValue("discount", nextDiscount);
    }
  };

  const updateDiscountedFromOriginalAndPercent = (nextOriginal: number, nextDiscount: number) => {
    if (nextOriginal > 0 && nextDiscount >= 0 && nextDiscount <= 100) {
      const nextDiscounted = Math.round(nextOriginal * (1 - nextDiscount / 100));
      setValue("discountedPrice", nextDiscounted);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const token = sessionStorage.getItem("yatri_store_auth_token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      // zod validates all required fields at runtime; with strictNullChecks off,
      // z.infer marks every field optional, so re-assert the validated shape here.
      await submitProduct(data as Parameters<typeof submitProduct>[0]);
      toast.success("Product added successfully!");
      navigate("/yatristore");
    } catch (error) {
      console.error("Error submitting product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gate Add Product behind admin login, similar to /udemy
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO />
        <div className="noise-overlay" />
        <Navbar />
        <AddProductLoginForm onLoginSuccess={handleLoginSuccess} />
        <Footer />
      </div>
    );
  }

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
                        {storeCategories.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
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
                        {productLevels.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
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
                      type="text"
                      inputMode="decimal"
                      {...register("originalPrice", { valueAsNumber: true })}
                      onChange={(e) => {
                        const nextOriginal = parseNumber(e.target.value);
                        setValue("originalPrice", nextOriginal);

                        // If discount % is set, recompute discounted price from original + discount
                        if (discountValue > 0) {
                          updateDiscountedFromOriginalAndPercent(nextOriginal, discountValue);
                        } else if (discountedPrice > 0) {
                          // Otherwise, if discounted already present, recompute discount %
                          updateFromOriginalAndDiscounted(nextOriginal, discountedPrice);
                        }
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
                      type="text"
                      inputMode="decimal"
                      {...register("discountedPrice", { valueAsNumber: true })}
                      onChange={(e) => {
                        const nextDiscounted = parseNumber(e.target.value);
                        setValue("discountedPrice", nextDiscounted);

                        // When discounted price changes, update discount % based on current original
                        if (originalPrice > 0) {
                          updateFromOriginalAndDiscounted(originalPrice, nextDiscounted);
                        }
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
                      type="text"
                      inputMode="decimal"
                      {...register("discount", { valueAsNumber: true })}
                      onChange={(e) => {
                        const value = parseNumber(e.target.value);
                        const safeValue = isNaN(value) ? 0 : value;
                        setValue("discount", safeValue);
                        // When discount changes, recalculate discounted price from original
                        if (originalPrice > 0) {
                          updateDiscountedFromOriginalAndPercent(originalPrice, safeValue);
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


