import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, Trash2, IndianRupee, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCart } from "@/contexts/CartContext";
import { initiatePayment, isTestMode } from "@/lib/razorpay";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import { sendEmail } from "@/lib/email";
import { getProductPurchaseEmail } from "@/lib/email-templates";

interface CartSheetProps {
  trigger?: ReactNode;
}

export const CartSheet = ({ trigger }: CartSheetProps) => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const testMode = isTestMode();
  const user = getStoredUser();

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);
    try {
      // Calculate total amount in paise (no GST)
      const amountInPaise = totalPrice * 100;

      // Create order description
      const productNames = items.map(item => item.title).join(", ");

      // Get customer details (logged in or guest)
      const user = getStoredUser();
      const rawEmail = user?.email || guestEmail;
      const customerEmail = rawEmail?.trim();
      
      if (!customerEmail || !customerEmail.includes('@')) {
        toast.error("Please provide a valid email address for your order");
        setIsProcessing(false);
        return;
      }

      console.log(`🛒 Starting checkout for: ${customerEmail} (${user ? 'Member' : 'Guest'})`);

      const { createRazorpayOrder } = await import("@/lib/razorpay");
      const orderId = await createRazorpayOrder({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          email: customerEmail,
          customerName: user?.fullName || "Guest Customer",
          products: productNames,
          items: JSON.stringify(items.map(item => ({ id: item.id, title: item.title, quantity: item.quantity })))
        }
      });

      const customerName = user?.fullName || "Guest Customer";
      const customerPhone = user?.phoneNumber || "";

      await initiatePayment(
        orderId,
        amountInPaise,
        productNames,
        customerName,
        customerEmail,
        customerPhone,
        async (paymentId) => {
          // toast.success(`Payment successful! Payment ID: ${paymentId}`); // Removed per request

          // Send Confirmation Email
          if (customerEmail) {
            try {
              // Check if any item is an exam dump
              const examDumps = items.filter(item => item.downloadUrl);
              console.log("🛒 Purchase Items:", JSON.stringify(items.map(i => ({ title: i.title, hasUrl: !!i.downloadUrl }))));
              console.log("📦 Detected Exam Dumps:", examDumps.length);
              
              if (examDumps.length > 0) {
                // Send Exam Dump Email
                console.log("📧 Sending Exam Dump email to:", customerEmail);
                const { getExamDumpPurchaseEmail } = await import("@/lib/email-templates");
                const firstDump = examDumps[0];
                console.log("🔗 Using download URL:", firstDump.downloadUrl);

                const emailHtml = getExamDumpPurchaseEmail(
                  customerName, 
                  firstDump.title, 
                  `₹${totalPrice.toLocaleString("en-IN")}`, 
                  firstDump.downloadUrl!, 
                  paymentId
                );
                
                const emailResult = await sendEmail({
                  to: customerEmail,
                  subject: "Your Exam Dump Download Link - Yatri Cloud",
                  html: emailHtml
                });

                if (!emailResult.success) {
                  throw new Error(emailResult.error || "Email delivery failed");
                }
              } else {
                // Send Standard Product Email
                console.log("📧 Sending Standard Product email to:", customerEmail);
                const emailHtml = getProductPurchaseEmail(customerName, productNames, `₹${totalPrice.toLocaleString("en-IN")}`, paymentId);
                
                const emailResult = await sendEmail({
                  to: customerEmail,
                  subject: "Order Confirmation - Yatri Cloud",
                  html: emailHtml
                });

                if (!emailResult.success) {
                  throw new Error(emailResult.error || "Email delivery failed");
                }
              }
              // toast.success("Confirmation email sent!"); // Removed per request
            } catch (emailErr) {
              console.error("Failed to send order email:", emailErr);
              toast.error("Payment successful, but failed to send email.");
            }
          }

          clearCart();
          setIsProcessing(false);
        },
        (error) => {
          toast.error(`Payment failed: ${error}`);
          setIsProcessing(false);
        }
      );
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
              >
                {totalItems}
              </motion.div>
            )}
            <span className="sr-only">Shopping cart</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {totalItems === 0
              ? "Your cart is empty"
              : `Review your items and proceed to checkout`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col h-[calc(100vh-200px)]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground mb-2">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Add some certification vouchers to get started!
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm line-clamp-2 mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {item.category} • {item.level}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              ₹{(item.discountedPrice * item.quantity).toLocaleString("en-IN")}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-auto pt-4 border-t space-y-4">
                {testMode && (
                  <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200 font-semibold">
                      Payment sandbox active
                    </AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                      This checkout session is configured for non-production testing. In production, real payments will be processed securely via Razorpay.
                    </AlertDescription>
                  </Alert>
                )}
                {!user && (
                  <div className="space-y-2 p-3 bg-secondary/30 rounded-lg border border-border/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Delivery Email</p>
                    <div className="flex flex-col gap-1">
                      <input 
                        type="email" 
                        placeholder="your@email.com" 
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                      />
                      <p className="text-[10px] text-muted-foreground">This is where we will send your download links.</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearCart}
                    disabled={isProcessing}
                  >
                    Clear Cart
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Checkout"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};


