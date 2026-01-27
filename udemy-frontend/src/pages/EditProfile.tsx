import { useForm } from "react-hook-form";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface EditProfileFormData {
  name: string;
  email: string;
  bio?: string;
}

const EditProfile = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<EditProfileFormData>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: EditProfileFormData) => {
    setLoading(true);
    try {
      await userAPI.updateProfile(data);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-3xl font-bold">Edit Profile</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                placeholder="Your name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                {...register("bio")}
                placeholder="Tell us about yourself"
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EditProfile;
