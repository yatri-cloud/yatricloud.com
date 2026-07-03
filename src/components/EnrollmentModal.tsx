import { useState, useEffect } from "react";
import { X, Loader2, CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { openRazorpayCheckout, createRazorpayOrder } from "@/lib/razorpay";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/email";
import { getStoredUser, isProfileComplete } from "@/lib/yatris-api";
import { enroll, createTrainingOrder } from "@/lib/training-api";
import { Country } from "country-state-city";
import { CurrencySelect } from "@/components/CurrencySelect";
import {
    DEFAULT_CURRENCY,
    convertFromInr,
    formatMoney,
    toSmallestUnit,
    type CurrencyOption,
} from "@/lib/currency";

interface EnrollmentModalProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    courseName: string;
    price: string | number;
    currency?: string;
    isPaid: boolean;
    onSuccess: () => void;
}

interface FormData {
    name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    country: string;
    linkedIn: string;
}

export function EnrollmentModal({ open, onClose, courseId, courseName, price, currency, isPaid, onSuccess }: EnrollmentModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoSubmitting, setAutoSubmitting] = useState(false);
    const [payCurrency, setPayCurrency] = useState<CurrencyOption>(DEFAULT_CURRENCY);
    const inrPrice = typeof price === "string" ? parseFloat(String(price).replace(/[^\d.]/g, "")) || 0 : (price || 0);
    const convertedPrice = convertFromInr(inrPrice, payCurrency);
    const priceLabel = formatMoney(convertedPrice, payCurrency);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        country: "",
        linkedIn: "",
    });

    // Helper to resolve country ISO code to country name
    const getCountryName = (code: string): string => {
        if (!code) return "";
        const country = Country.getAllCountries().find(c => c.isoCode === code);
        return country ? country.name : code;
    };

    // When modal opens, pre-fill from stored user and auto-submit if profile is complete
    useEffect(() => {
        if (!open) {
            setAutoSubmitting(false);
            return;
        }

        const user = getStoredUser();
        if (user) {
            const prefilled: FormData = {
                name: user.fullName || "",
                email: user.email || "",
                phone: user.countryCode && user.phoneNumber
                    ? `${user.countryCode} ${user.phoneNumber}`
                    : user.phoneNumber || "",
                city: user.city || "",
                state: user.stateProvince || "",
                country: getCountryName(user.country || ""),
                linkedIn: user.linkedinUrl || "",
            };
            setFormData(prefilled);

            // If profile is complete, skip the form entirely
            if (isProfileComplete(user)) {
                setAutoSubmitting(true);
            }
        }
    }, [open]);

    // Trigger auto-submit once formData is set and autoSubmitting flag is true
    useEffect(() => {
        if (autoSubmitting && open && formData.email) {
            handleAutoSubmit();
        }
    }, [autoSubmitting]);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) return showError("Name is required");
        if (!formData.email.trim() || !formData.email.includes('@')) return showError("Valid email is required");
        if (!formData.phone.trim()) return showError("Phone number is required");
        if (!formData.city.trim()) return showError("City is required");
        if (!formData.state.trim()) return showError("State is required");
        if (!formData.country.trim()) return showError("Country is required");
        return true;
    };

    const showError = (msg: string) => {
        toast({ title: msg, variant: "destructive" });
        return false;
    };

    // Welcome email + success handoff shared by both flows.
    const sendWelcomeAndFinish = async () => {
        try {
            const emailHtml = `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h1>Welcome to ${courseName}!</h1>
                    <p>Hi ${formData.name},</p>
                    <p>You have successfully enrolled in <strong>${courseName}</strong>.</p>
                    <p>Our team will contact you shortly with the access details.</p>
                    <br/>
                    <p>Happy Learning,<br/>Yatri Cloud Team</p>
                </div>
            `;
            await sendEmail({
                to: formData.email,
                subject: `Enrollment Confirmed: ${courseName}`,
                html: emailHtml,
            });
        } catch (emailErr) {
            console.error("Failed to send enrollment email", emailErr);
        }
        toast({ title: "Enrollment Successful!", description: "Welcome aboard! Check your email." });
        onSuccess();
        onClose();
    };

    // Order based enrollment: pending row + Razorpay in the chosen currency for
    // paid trainings, or a direct free enrollment otherwise.
    const startEnrollment = async () => {
        setIsSubmitting(true);
        try {
            if (isPaid && inrPrice > 0) {
                const smallest = toSmallestUnit(convertedPrice, payCurrency);

                const { orderId, error: orderErr } = await createTrainingOrder({
                    email: formData.email,
                    amount: convertedPrice,
                    currency: payCurrency.code,
                    items: [{ name: courseName, price_inr: inrPrice }],
                });
                if (orderErr || !orderId) throw new Error(orderErr || "Could not start your order. Please try again.");

                // Pending enrollment before payment (reused on retry).
                const { id: enrollmentId } = await enroll({
                    trainingId: courseId,
                    email: formData.email,
                    amount: convertedPrice,
                    currency: payCurrency.code,
                    paymentStatus: "pending",
                    orderId,
                });

                const razorpayOrderId = await createRazorpayOrder({
                    amount: smallest,
                    currency: payCurrency.code,
                    receipt: `train_${Date.now()}`,
                    notes: { kind: "training", enrollment_id: enrollmentId, order_id: orderId },
                });

                openRazorpayCheckout({
                    razorpayOrderId,
                    amountSmallestUnit: smallest,
                    currency: payCurrency.code,
                    productName: courseName,
                    customer: { name: formData.name, email: formData.email, phone: formData.phone },
                    ourOrderId: orderId,
                    verifyExtra: {
                        kind: "training",
                        enrollment_id: enrollmentId,
                        buyer_name: formData.name,
                        buyer_email: formData.email,
                        item: courseName,
                    },
                    onSuccess: async () => {
                        await sendWelcomeAndFinish();
                        setIsSubmitting(false);
                    },
                    onFailure: (message) => {
                        setIsSubmitting(false);
                        setAutoSubmitting(false);
                        toast({ title: "Payment Failed", description: message, variant: "destructive" });
                    },
                });
            } else {
                await enroll({ trainingId: courseId, email: formData.email, paymentStatus: "free" });
                await sendWelcomeAndFinish();
                setIsSubmitting(false);
            }
        } catch (e: any) {
            console.error(e);
            setIsSubmitting(false);
            setAutoSubmitting(false);
            toast({ title: "Enrollment Failed", description: e?.message || "Please try again.", variant: "destructive" });
        }
    };

    // Auto-submit for users with complete profiles.
    const handleAutoSubmit = () => {
        void startEnrollment();
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        await startEnrollment();
    };

    // Show a simple loading dialog when auto-enrolling (profile complete)
    if (autoSubmitting) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-md">
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-lg font-semibold">Enrolling you in {courseName}...</p>
                        <p className="text-sm text-muted-foreground">Using your profile information</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Enroll in {courseName}</DialogTitle>
                    <DialogDescription>
                        {isPaid ? (
                            <div className="flex items-center gap-2 text-base mt-2">
                                <CreditCard className="w-5 h-5" />
                                <span>Total: <strong>{priceLabel}</strong></span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-base mt-2 text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span><strong>Free Enrollment</strong></span>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="John Doe"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="john@example.com"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="+91 9876543210"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">City *</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                placeholder="Bangalore"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state">State *</Label>
                            <Input
                                id="state"
                                value={formData.state}
                                onChange={(e) => handleInputChange('state', e.target.value)}
                                placeholder="Karnataka"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">Country *</Label>
                            <Input
                                id="country"
                                value={formData.country}
                                onChange={(e) => handleInputChange('country', e.target.value)}
                                placeholder="India"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="linkedIn">LinkedIn Profile (Optional)</Label>
                            <Input
                                id="linkedIn"
                                value={formData.linkedIn}
                                onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                                placeholder="linkedin.com/in/johndoe"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {isPaid && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                            <div className="text-sm">
                                <span className="text-muted-foreground">You pay </span>
                                <span className="font-semibold text-foreground">{priceLabel}</span>
                            </div>
                            <CurrencySelect
                                value={payCurrency.code}
                                onChange={(_code, option) => setPayCurrency(option)}
                                disabled={isSubmitting}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {isPaid ? (
                                        <>
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Pay {priceLabel}
                                        </>
                                    ) : (
                                        'Confirm Enrollment'
                                    )}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
