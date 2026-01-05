import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ScrollReveal from "@/components/ScrollReveal";

interface LoginFormData {
  email: string;
  password: string;
}

interface AddProductLoginFormProps {
  onLoginSuccess: () => void;
}

// Admin login form for Yatri Store product management
const AddProductLoginForm = ({ onLoginSuccess }: AddProductLoginFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const webhookUrl = import.meta.env.VITE_ADDPRODUCT_CREDENTIALS_WEBHOOK_URL || "";

      if (!webhookUrl) {
        throw new Error("Authentication service not configured. Please check environment variables.");
      }

      console.log("🔐 Attempting Yatri Store login for:", data.email);
      console.log("🌐 Webhook URL:", webhookUrl);

      // Prefer URL-encoded form data for Apps Script compatibility
      const formData = new URLSearchParams();
      formData.append("email", data.email);
      formData.append("password", data.password);

      let response: Response;
      try {
        response = await fetch(webhookUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });
      } catch (corsError) {
        console.warn("⚠️ Form data CORS failed, trying JSON:", corsError);
        response = await fetch(webhookUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        });
      }

      if (!response || !response.ok) {
        throw new Error(`HTTP error! status: ${response?.status || "unknown"}`);
      }

      const result = await response.json();
      console.log("✅ Yatri Store login response:", result);

      if (result.success) {
        // Store authentication token in sessionStorage
        sessionStorage.setItem("yatri_store_auth_token", result.token || "authenticated");
        sessionStorage.setItem("yatri_store_auth_email", data.email);

        toast({
          title: "Success!",
          description: "Yatri Store admin login successful",
        });

        onLoginSuccess();
      } else {
        toast({
          title: "Authentication Failed",
          description: result.error || "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ Yatri Store login error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-16">
      <div className="container mx-auto px-4 md:px-6 max-w-md">
        <ScrollReveal>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-xl"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="gradient-text">Yatri Store Admin</span>
              </h1>
              <p className="text-muted-foreground">
                Please login to manage store products
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address",
                      },
                    })}
                    placeholder="email@example.com"
                    className="w-full pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    {...register("password", {
                      required: "Password is required",
                    })}
                    placeholder="Enter your password"
                    className="w-full pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-5 w-5" />
                      Login
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default AddProductLoginForm;


