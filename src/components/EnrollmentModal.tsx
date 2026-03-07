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
import { initiateRazorpayPayment, formatEventPrice } from "@/lib/razorpay";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/email";
import { getStoredUser, isProfileComplete } from "@/lib/yatris-api";
import { Country } from "country-state-city";

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
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        country: "",
        linkedIn: "",
    });

    const SCRIPT_URL = import.meta.env.VITE_TRAINING_SCRIPT_URL || import.meta.env.VITE_EVENT_FEEDBACK_SCRIPT_URL;

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

    const submitEnrollment = async (paymentData?: any) => {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "enrollUser",
                    trainingId: courseId,
                    trainingName: courseName,
                    userName: formData.name,
                    userEmail: formData.email,
                    userPhone: formData.phone,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    linkedIn: formData.linkedIn,
                    status: 'Enrolled',
                    paymentStatus: isPaid ? 'Paid' : 'Free',
                    paymentId: paymentData?.paymentId || '',
                    amount: paymentData?.amount || '',
                    currency: currency || 'USD'
                })
            });
            const result = await response.json();

            if (result.success) {
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
                    html: emailHtml
                });

                toast({ title: "Enrollment Successful!", description: "Welcome aboard! Check your email." });
                onSuccess();
                onClose();
            } else {
                toast({ title: "Enrollment Failed", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Network Error", variant: "destructive" });
        }
    };

    // Auto-submit for users with complete profiles
    const handleAutoSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (isPaid) {
                const numPrice = typeof price === 'string' ? parseFloat(price) : price;
                initiateRazorpayPayment(
                    {
                        amount: numPrice,
                        currency: currency || 'INR',
                        eventName: courseName,
                        userDetails: {
                            name: formData.name,
                            email: formData.email,
                            phone: formData.phone,
                        }
                    },
                    async (response) => {
                        await submitEnrollment({
                            paymentId: response.razorpay_payment_id,
                            amount: numPrice
                        });
                        setIsSubmitting(false);
                    },
                    (err) => {
                        setIsSubmitting(false);
                        setAutoSubmitting(false);
                        toast({ title: "Payment Failed", description: err.error, variant: "destructive" });
                    }
                );
            } else {
                await submitEnrollment();
                setIsSubmitting(false);
            }
        } catch (e) {
            setIsSubmitting(false);
            setAutoSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setIsSubmitting(true);

        try {
            if (isPaid) {
                const numPrice = typeof price === 'string' ? parseFloat(price) : price;

                initiateRazorpayPayment(
                    {
                        amount: numPrice,
                        currency: currency || 'INR',
                        eventName: courseName,
                        userDetails: {
                            name: formData.name,
                            email: formData.email,
                            phone: formData.phone,
                        }
                    },
                    async (response) => {
                        await submitEnrollment({
                            paymentId: response.razorpay_payment_id,
                            amount: numPrice
                        });
                        setIsSubmitting(false);
                    },
                    (err) => {
                        setIsSubmitting(false);
                        toast({ title: "Payment Failed", description: err.error, variant: "destructive" });
                    }
                );
            } else {
                await submitEnrollment();
                setIsSubmitting(false);
            }
        } catch (e) {
            setIsSubmitting(false);
        }
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
                                <span>Total: <strong>{currency} {price}</strong></span>
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
                                            Pay Now
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
