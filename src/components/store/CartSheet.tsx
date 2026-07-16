import { useState, useEffect, ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, Trash2, IndianRupee, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCart } from "@/contexts/CartContext";
import { initiatePayment, isTestMode } from "@/lib/razorpay";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import { validateCoupon, redeemCoupon, discountedInr, type AppliedCoupon } from "@/lib/coupons";
import { Input } from "@/components/ui/input";
import { sendEmail } from "@/lib/email";
import { getProductPurchaseEmail } from "@/lib/email-templates";
import { CurrencySelect } from "@/components/CurrencySelect";
import { DEFAULT_CURRENCY, convertFromInr, formatMoney, toSmallestUnit, getInitialCurrency, setPreferredCurrency, type CurrencyOption } from "@/lib/currency";

interface CartSheetProps {
  trigger?: ReactNode;
  /** Open this sheet when a Buy Now button fires the yc:open-cart event.
      Enable on exactly ONE instance per page or several sheets stack. */
  openOnBuy?: boolean;
}

// One-shot flag so Buy Now still opens the sheet when its CartSheet mounts
// lazily (e.g. the floating pill's chunk loads after the click).
const OPEN_PENDING_KEY = "yc:open-cart-pending";

export const CartSheet = ({ trigger, openOnBuy }: CartSheetProps) => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!openOnBuy) return;
    const openNow = () => {
      try {
        sessionStorage.removeItem(OPEN_PENDING_KEY);
      } catch {
        /* private mode */
      }
      setIsOpen(true);
    };
    try {
      if (sessionStorage.getItem(OPEN_PENDING_KEY)) openNow();
    } catch {
      /* private mode */
    }
    window.addEventListener("yc:open-cart", openNow);
    return () => window.removeEventListener("yc:open-cart", openNow);
  }, [openOnBuy]);
  const [guestEmail, setGuestEmail] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [purchasedDumps, setPurchasedDumps] = useState<any[]>([]);
  const [currency, setCurrency] = useState<CurrencyOption>(DEFAULT_CURRENCY);
  // Default to the visitor's local currency (geo detected, or their last choice).
  useEffect(() => {
    let active = true;
    getInitialCurrency().then((c) => {
      if (active) setCurrency(c);
    });
    return () => {
      active = false;
    };
  }, []);
  const testMode = isTestMode();
  const user = getStoredUser();
  // Coupon: discount applies to the INR total before currency conversion.
  // Guests can use codes too; usage counting only runs for signed-in buyers
  // (the redeem RPC is authenticated-only), so caps under-count, never over.
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState("");

  const applyCoupon = async () => {
    setCouponChecking(true);
    setCouponError("");
    const result = await validateCoupon(couponInput, "store", items.map((i) => i.id));
    setCouponChecking(false);
    if (result) setCoupon(result);
    else { setCoupon(null); setCouponError("That code did not work. Check the spelling or try another."); }
  };

  // Item-pinned coupons discount only their matching line; universal and
  // store-wide codes discount the whole total, as before.
  const effectiveTotalInr = (() => {
    if (!coupon) return totalPrice;
    if (!coupon.entityId) return discountedInr(totalPrice, coupon);
    const line = items.find((i) => i.id === coupon.entityId);
    if (!line) return totalPrice;
    const lineInr = line.discountedPrice * line.quantity;
    return Math.max(0, totalPrice - lineInr + discountedInr(lineInr, coupon));
  })();
  const convertedTotal = convertFromInr(effectiveTotalInr, currency);
  const totalLabel = formatMoney(convertedTotal, currency);
  const originalTotalLabel = formatMoney(convertFromInr(totalPrice, currency), currency);
  // Anchoring, display only: what the strike-through prices add up to vs
  // what is actually paid (item discounts + any coupon).
  const anchorInr = items.reduce(
    (sum, item) => sum + (item.originalPrice || item.discountedPrice) * item.quantity,
    0
  );
  const savedLabel =
    anchorInr > effectiveTotalInr
      ? formatMoney(convertFromInr(anchorInr - effectiveTotalInr, currency), currency)
      : null;

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);
    try {
      // Amount in the smallest unit of the chosen currency (converted from INR).
      const chargeAmount = convertFromInr(effectiveTotalInr, currency);
      const amountInSmallestUnit = toSmallestUnit(chargeAmount, currency);
      const amountLabel = formatMoney(chargeAmount, currency);

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
        amount: amountInSmallestUnit,
        currency: currency.code,
        receipt: `receipt_${Date.now()}`,
        notes: {
          email: customerEmail,
          customerName: user?.fullName || "Yatris",
          products: productNames,
          items: JSON.stringify(items.map(item => ({ id: item.id, title: item.title, quantity: item.quantity })))
        }
      });

      const customerName = user?.fullName || "Yatris";
      const customerPhone = user?.phoneNumber || "";

      await initiatePayment(
        orderId,
        amountInSmallestUnit,
        productNames,
        customerName,
        customerEmail,
        customerPhone,
        async (paymentId) => {
          if (coupon) void redeemCoupon(coupon.code);
          // Check if any item is an exam dump for both email and success popup
          const examDumps = items.filter(item => item.downloadUrl);
          
          // Send Confirmation Email
          if (customerEmail) {
            try {
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
                  amountLabel,
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
                const emailHtml = getProductPurchaseEmail(customerName, productNames, amountLabel, paymentId);

                const emailResult = await sendEmail({
                  to: customerEmail,
                  subject: "Order Confirmation - Yatri Cloud",
                  html: emailHtml
                });

                if (!emailResult.success) {
                  throw new Error(emailResult.error || "Email delivery failed");
                }
              }
            } catch (emailErr) {
              console.error("Failed to send order email:", emailErr);
              toast.error("Payment successful, but failed to send email.");
            }
          }

          setPurchasedDumps(examDumps);
          setIsSuccessModalOpen(true);
          clearCart();
          setIsProcessing(false);
        },
        (error) => {
          toast.error(`Payment failed: ${error}`);
          setIsProcessing(false);
        },
        currency.code,
        {
          buyer_name: customerName,
          buyer_email: customerEmail,
          item: productNames,
        }
      );
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="relative gap-2 font-medium">
            <ShoppingCart className="h-5 w-5" />
            Cart
            {totalItems > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
              >
                {totalItems}
              </motion.div>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Your cart
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-1">
                {totalItems}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Nothing here yet." : "Review and pay."}
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
              <Button asChild className="mt-6" onClick={() => setIsOpen(false)}>
                <Link to="/examdumps">Browse exam dumps</Link>
              </Button>
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
                      <div className="relative flex w-20 h-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/40 p-1.5">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="max-h-full max-w-full object-contain"
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
                              aria-label="Remove from cart"
                              className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
                  <div className="space-y-1.5">
                    <label htmlFor="cart-guest-email" className="text-sm text-muted-foreground">
                      Email for your downloads
                    </label>
                    <input
                      id="cart-guest-email"
                      type="email"
                      placeholder="you@email.com"
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <CurrencySelect
                    className="w-full justify-between"
                    value={currency.code}
                    onChange={(code, option) => { setCurrency(option); setPreferredCurrency(code); }}
                    disabled={isProcessing}
                  />
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                        placeholder="Coupon code (optional)"
                        className="h-9 uppercase"
                        disabled={isProcessing || !!coupon}
                      />
                      {coupon ? (
                        <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => { setCoupon(null); setCouponInput(""); }} disabled={isProcessing}>
                          Remove
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" size="sm" className="h-9" onClick={applyCoupon} disabled={couponChecking || !couponInput.trim() || isProcessing}>
                          Apply
                        </Button>
                      )}
                    </div>
                    {coupon && <p className="text-xs text-success">{coupon.code} applied — you save {coupon.percentOff}%.</p>}
                    {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                  </div>
                  {savedLabel && (
                    <div className="flex justify-between text-sm font-medium text-success">
                      <span>You save today</span>
                      <span>{savedLabel}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      {totalLabel}
                      {coupon && <s className="ml-2 text-sm font-normal text-muted-foreground">{originalTotalLabel}</s>}
                    </span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full font-semibold shadow-inset-btn"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing…" : `Pay ${totalLabel}`}
                </Button>
                {/* One quiet line says it all */}
                <p className="text-center text-xs text-muted-foreground">
                  Secure Razorpay payment · files by email
                </p>
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={isProcessing}
                  className="mx-auto block text-xs text-muted-foreground transition-colors hover:text-destructive"
                >
                  Clear cart
                </button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-600">Payment Successful!</DialogTitle>
          <DialogDescription>
            Your order has been processed successfully. 
            {purchasedDumps.length > 0 ? "You can access your exam dumps below." : "A confirmation email has been sent to you."}
          </DialogDescription>
        </DialogHeader>
        
        {purchasedDumps.length > 0 && (
          <div className="space-y-4 my-4">
            <p className="text-sm font-semibold">Purchased Exam Dumps:</p>
            {purchasedDumps.map((dump, idx) => (
              <div key={idx} className="p-3 bg-secondary/30 rounded-lg border border-border flex flex-col gap-2">
                <p className="text-sm font-medium">{dump.title}</p>
                <Button asChild size="sm" className="w-full">
                  <a href={dump.downloadUrl} target="_blank" rel="noopener noreferrer">
                    Access Exam Dump
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => setIsSuccessModalOpen(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};


