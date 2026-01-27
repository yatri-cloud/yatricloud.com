import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paymentAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CheckoutFormData {
  email: string;
  fullName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

const Checkout = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const courseId = location.state?.courseId;

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true);
    try {
      const response = await paymentAPI.createOrder({
        courseId,
        email: data.email,
        fullName: data.fullName,
        amount: 99.99, // Replace with actual course price
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Payment processed successfully!",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Payment failed. Please try again.",
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
          <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 font-bold">Order Summary</h2>
              <div className="flex justify-between">
                <span>Course</span>
                <span className="font-bold">$99.99</span>
              </div>
              <div className="border-t border-border py-4 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>$99.99</span>
              </div>
            </div>

            <h2 className="text-xl font-bold">Billing Details</h2>

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
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                {...register("fullName", { required: "Full name is required" })}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <h2 className="text-xl font-bold">Payment Information</h2>

            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                {...register("cardNumber", { required: "Card number is required" })}
                placeholder="1234 5678 9012 3456"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  {...register("expiryDate", { required: "Expiry date is required" })}
                  placeholder="MM/YY"
                />
              </div>

              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  {...register("cvv", { required: "CVV is required" })}
                  placeholder="123"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Complete Purchase"}
            </Button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
