import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { courseAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AddCourseFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  tech: string;
  courseUrl: string;
  imageUrl?: string;
}

const AddCourse = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<AddCourseFormData>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: AddCourseFormData) => courseAPI.create(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course added successfully!",
      });
      navigate("/courses");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add course",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AddCourseFormData) => {
    setLoading(true);
    mutation.mutate(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-3xl font-bold">Add New Course</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder="Enter course title"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register("description", { required: "Description is required" })}
                placeholder="Enter course description"
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  {...register("price", { required: "Price is required" })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  {...register("category", { required: "Category is required" })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select Category</option>
                  <option value="cloud">Cloud</option>
                  <option value="devops">DevOps</option>
                  <option value="ai">AI</option>
                  <option value="data">Data</option>
                  <option value="security">Security</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tech">Technology</Label>
                <select
                  id="tech"
                  {...register("tech", { required: "Technology is required" })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select Technology</option>
                  <option value="AWS">AWS</option>
                  <option value="Azure">Azure</option>
                  <option value="Google Cloud">Google Cloud</option>
                  <option value="GitHub">GitHub</option>
                </select>
              </div>

              <div>
                <Label htmlFor="courseUrl">Course URL</Label>
                <Input
                  id="courseUrl"
                  {...register("courseUrl", { required: "Course URL is required" })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input
                id="imageUrl"
                {...register("imageUrl")}
                placeholder="https://..."
              />
            </div>

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Adding..." : "Add Course"}
            </Button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AddCourse;
