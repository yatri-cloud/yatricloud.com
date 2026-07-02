import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const AdminAddProduct = () => {
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

    const parseNumber = (value: string) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    };

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

    const onSubmit = async (data: ProductFormData) => {
        setIsSubmitting(true);
        try {
            await submitProduct(data);
            toast.success("Product added successfully!");
            // navigate("/admin/products"); // If we had a product list
        } catch (error) {
            console.error("Error submitting product:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add product");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 md:px-8 py-8 md:py-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Add New Product</h1>
                <p className="text-muted-foreground mt-1.5">
                    Add a new certification voucher product to the store.
                </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Product details */}
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
                    <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">1</span>
                        <div className="min-w-0">
                            <h2 className="font-display text-lg font-semibold tracking-tight">Product Details</h2>
                            <p className="text-sm text-muted-foreground">The basics learners will see in the store.</p>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="title" className="block text-sm font-medium mb-1.5">Product Title *</Label>
                        <Input
                            id="title"
                            {...register("title")}
                            placeholder="e.g., AWS Certified Solutions Architect - Associate (SAA-C03)"
                            className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary"
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <Label htmlFor="category" className="block text-sm font-medium mb-1.5">Category *</Label>
                            <Select
                                value={category}
                                onValueChange={(value) => setValue("category", value as any)}
                            >
                                <SelectTrigger className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
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
                                <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="level" className="block text-sm font-medium mb-1.5">Level *</Label>
                            <Select
                                onValueChange={(value) => setValue("level", value as any)}
                                defaultValue="Associate"
                            >
                                <SelectTrigger className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
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
                                <p className="text-sm text-destructive mt-1">{errors.level.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="examCode" className="block text-sm font-medium mb-1.5">Exam Code</Label>
                        <Input
                            id="examCode"
                            {...register("examCode")}
                            placeholder="e.g., SAA-C03"
                            className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Optional.</p>
                    </div>

                    <div>
                        <Label htmlFor="description" className="block text-sm font-medium mb-1.5">Description *</Label>
                        <Textarea
                            id="description"
                            {...register("description")}
                            placeholder="Product description..."
                            rows={6}
                            className="min-h-[110px] rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary"
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                        )}
                    </div>
                </div>

                {/* Pricing */}
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
                    <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">2</span>
                        <div className="min-w-0">
                            <h2 className="font-display text-lg font-semibold tracking-tight">Pricing</h2>
                            <p className="text-sm text-muted-foreground">Set the list price, offer price, and discount — they stay in sync.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        <div>
                            <Label htmlFor="originalPrice" className="block text-sm font-medium mb-1.5">Original Price (₹) *</Label>
                            <Input
                                id="originalPrice"
                                type="text"
                                inputMode="decimal"
                                {...register("originalPrice", { valueAsNumber: true })}
                                onChange={(e) => {
                                    const nextOriginal = parseNumber(e.target.value);
                                    setValue("originalPrice", nextOriginal);
                                    if (discountValue > 0) {
                                        updateDiscountedFromOriginalAndPercent(nextOriginal, discountValue);
                                    } else if (discountedPrice > 0) {
                                        updateFromOriginalAndDiscounted(nextOriginal, discountedPrice);
                                    }
                                }}
                                className="h-11 rounded-xl border border-input bg-background tabular-nums focus:ring-2 focus:ring-ring focus:border-primary"
                            />
                            {errors.originalPrice && (
                                <p className="text-sm text-destructive mt-1">{errors.originalPrice.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="discountedPrice" className="block text-sm font-medium mb-1.5">Discounted Price (₹) *</Label>
                            <Input
                                id="discountedPrice"
                                type="text"
                                inputMode="decimal"
                                {...register("discountedPrice", { valueAsNumber: true })}
                                onChange={(e) => {
                                    const nextDiscounted = parseNumber(e.target.value);
                                    setValue("discountedPrice", nextDiscounted);
                                    if (originalPrice > 0) {
                                        updateFromOriginalAndDiscounted(originalPrice, nextDiscounted);
                                    }
                                }}
                                className="h-11 rounded-xl border border-input bg-background tabular-nums focus:ring-2 focus:ring-ring focus:border-primary"
                            />
                            {errors.discountedPrice && (
                                <p className="text-sm text-destructive mt-1">{errors.discountedPrice.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="discount" className="block text-sm font-medium mb-1.5">Discount (%) *</Label>
                            <Input
                                id="discount"
                                type="text"
                                inputMode="decimal"
                                {...register("discount", { valueAsNumber: true })}
                                onChange={(e) => {
                                    const value = parseNumber(e.target.value);
                                    const safeValue = isNaN(value) ? 0 : value;
                                    setValue("discount", safeValue);
                                    if (originalPrice > 0) {
                                        updateDiscountedFromOriginalAndPercent(originalPrice, safeValue);
                                    }
                                }}
                                className="h-11 rounded-xl border border-input bg-background tabular-nums focus:ring-2 focus:ring-ring focus:border-primary"
                            />
                            {errors.discount && (
                                <p className="text-sm text-destructive mt-1">{errors.discount.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Media */}
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
                    <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">3</span>
                        <div className="min-w-0">
                            <h2 className="font-display text-lg font-semibold tracking-tight">Media</h2>
                            <p className="text-sm text-muted-foreground">A cover image shown on the product card.</p>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="image" className="block text-sm font-medium mb-1.5">Image URL *</Label>
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
                        {errors.image && (
                            <p className="text-sm text-destructive mt-1">{errors.image.message}</p>
                        )}
                        {imagePreview && (
                            <div className="mt-3">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-xl border border-border"
                                    onError={() => setImagePreview("")}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full md:w-auto min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring"
                    >
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
        </div>
    );
};

export default AdminAddProduct;
