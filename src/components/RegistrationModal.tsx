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
import { Event } from "@/lib/events-store";
import { isEventPaid, openRazorpayCheckout, createRazorpayOrder } from "@/lib/razorpay";
import type { EventRegistration } from "@/lib/registration-store";
import { createRegistration as apiCreateRegistration, createEventOrder } from "@/lib/events-api";
import { getCachedUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/email";
import { getRegistrationEmail } from "@/lib/email-templates";
import { googleCalendarUrl } from "@/lib/calendar";
import { CurrencySelect } from "@/components/CurrencySelect";
import {
    DEFAULT_CURRENCY,
    convertFromInr,
    formatMoney,
    toSmallestUnit,
    getInitialCurrency,
    setPreferredCurrency,
    type CurrencyOption,
} from "@/lib/currency";

interface RegistrationModalProps {
    event: Event;
    open: boolean;
    onClose: () => void;
    onSuccess: (registration: EventRegistration) => void;
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

export function RegistrationModal({ event, open, onClose, onSuccess }: RegistrationModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        country: "",
        linkedIn: "",
    });

    const isPaid = isEventPaid(event.price);
    const userId = getCachedUser()?.id || "";
    const inrPrice = typeof event.price === "string" ? parseFloat(event.price) : (event.price || 0);
    const [currency, setCurrency] = useState<CurrencyOption>(DEFAULT_CURRENCY);
    // Default to the visitor's local currency (geo detected, or their last choice).
    useEffect(() => {
        let active = true;
        getInitialCurrency().then((c) => { if (active) setCurrency(c); });
        return () => { active = false; };
    }, []);
    const convertedPrice = convertFromInr(inrPrice, currency);
    const priceLabel = formatMoney(convertedPrice, currency);

    // Duplicate registrations are prevented by the DB unique (event_id, email)
    // constraint; the insert surfaces an error if the Yatri is already registered.
    const alreadyRegistered = false;

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return false;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            toast({ title: "Valid email is required", variant: "destructive" });
            return false;
        }
        if (!formData.phone.trim()) {
            toast({ title: "Phone number is required", variant: "destructive" });
            return false;
        }
        if (!formData.city.trim()) {
            toast({ title: "City is required", variant: "destructive" });
            return false;
        }
        if (!formData.state.trim()) {
            toast({ title: "State is required", variant: "destructive" });
            return false;
        }
        if (!formData.country.trim()) {
            toast({ title: "Country is required", variant: "destructive" });
            return false;
        }
        return true;
    };

    // Registration code prefix: specific tech stack > category > name > "EVENT".
    const buildCodePrefix = (): string => {
        let codePrefix = "EVENT";
        if (event.techStack && event.techStack.length > 0) codePrefix = event.techStack[0];
        else if (event.category) codePrefix = event.category;
        else codePrefix = event.name.split(' ')[0] || "EVENT";
        return codePrefix.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10);
    };

    // Creates or reuses the registration row (pending before a paid checkout,
    // 'free' for a free event). Returns the code + id for the UI and verify notes.
    const persistRegistration = async (opts: {
        paymentStatus: "pending" | "free";
        amountInr: number;
        currencyCode: string;
        orderId?: string | null;
    }): Promise<{ registrationCode: string; id: string }> => {
        return apiCreateRegistration({
            eventId: event.id,
            userId,
            codePrefix: buildCodePrefix(),
            userDetails: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                linkedIn: formData.linkedIn || undefined,
            },
            amount: opts.amountInr || undefined,
            currency: opts.currencyCode,
            paymentStatus: opts.paymentStatus,
            orderId: opts.orderId ?? undefined,
        });
    };

    // Builds the EventRegistration shape the parent expects on success.
    const buildRegistrationPayload = (
        registrationCode: string,
        paymentData?: { paymentId: string; orderId?: string }
    ): EventRegistration => ({
        id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        eventId: event.id,
        eventSlug: event.slug || event.id,
        eventName: event.name,
        registrationCode,
        registeredAt: new Date().toISOString(),
        status: 'registered',
        userDetails: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            linkedIn: formData.linkedIn || undefined,
        },
        ticketType: isPaid ? 'paid' : 'free',
        ticketPrice: isPaid ? inrPrice : undefined,
        currency: isPaid ? currency.code : undefined,
        paymentStatus: paymentData ? 'completed' : undefined,
        paymentId: paymentData?.paymentId,
        orderId: paymentData?.orderId,
        paymentAmount: paymentData ? convertedPrice : undefined,
        paymentTimestamp: paymentData ? new Date().toISOString() : undefined,
    });

    const sendConfirmationEmail = async (registrationCode: string) => {
        try {
            const locationStr = event.location.venue || (event.location.type === 'online' ? 'Online' : 'TBD');
            let emailHtml = getRegistrationEmail(formData.name, event.name, registrationCode, event.date || 'TBD', locationStr);

            // Add to calendar link for events with a real start date. End is +2
            // hours since events do not store an explicit finish time.
            if (event.date && !isNaN(new Date(event.date).getTime())) {
                const startISO = new Date(event.date).toISOString();
                const endISO = new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString();
                const calUrl = googleCalendarUrl({
                    title: event.name,
                    startISO,
                    endISO,
                    details: `Your spot at ${event.name}, a Yatri Cloud event.`,
                    location: locationStr,
                });
                emailHtml += `<p style="text-align:center;margin:24px 0;"><a href="${calUrl}" style="display:inline-block;padding:12px 24px;background:#007CFF;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Add to your calendar</a></p>`;
            }

            await sendEmail({
                to: formData.email,
                subject: `Registration Confirmed: ${event.name}`,
                html: emailHtml,
            });
        } catch (emailErr) {
            console.error("Failed to send confirmation email", emailErr);
        }
    };

    const finishSuccess = async (registration: EventRegistration) => {
        await sendConfirmationEmail(registration.registrationCode);
        toast({
            title: "Registration Successful!",
            description: `Your code: ${registration.registrationCode}. A confirmation email has been sent.`,
        });
        onSuccess(registration);
        onClose();
        setIsSubmitting(false);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        if (alreadyRegistered) {
            toast({ title: "Already Registered", description: "You are already registered for this event", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        try {
            if (isPaid && inrPrice > 0) {
                // Order based checkout in the chosen currency.
                const smallest = toSmallestUnit(convertedPrice, currency);

                const { orderId, error: orderErr } = await createEventOrder({
                    userId: userId || null,
                    email: formData.email,
                    amount: convertedPrice,
                    currency: currency.code,
                    items: [{ name: event.name, price_inr: inrPrice }],
                });
                if (orderErr || !orderId) throw new Error(orderErr || "Could not start your order. Please try again.");

                // Pending registration before payment (reused on retry).
                // Store the actual charged amount in the chosen currency so the
                // amount and currency always agree with the order and invoice.
                const { id: registrationId, registrationCode } = await persistRegistration({
                    paymentStatus: "pending",
                    amountInr: convertedPrice,
                    currencyCode: currency.code,
                    orderId,
                });

                const razorpayOrderId = await createRazorpayOrder({
                    amount: smallest,
                    currency: currency.code,
                    receipt: `evt_${Date.now()}`,
                    notes: { kind: "event", registration_id: registrationId, order_id: orderId },
                });

                openRazorpayCheckout({
                    razorpayOrderId,
                    amountSmallestUnit: smallest,
                    currency: currency.code,
                    productName: event.name,
                    customer: { name: formData.name, email: formData.email, phone: formData.phone },
                    ourOrderId: orderId,
                    verifyExtra: {
                        kind: "event",
                        registration_id: registrationId,
                        buyer_name: formData.name,
                        buyer_email: formData.email,
                        item: event.name,
                    },
                    onSuccess: async (paymentId) => {
                        const registration = buildRegistrationPayload(registrationCode, { paymentId, orderId });
                        await finishSuccess(registration);
                    },
                    onFailure: (message) => {
                        setIsSubmitting(false);
                        toast({ title: "Payment Failed", description: message, variant: "destructive" });
                    },
                });
            } else {
                // Free event — direct registration.
                const { registrationCode } = await persistRegistration({
                    paymentStatus: "free",
                    amountInr: 0,
                    currencyCode: "INR",
                });
                await finishSuccess(buildRegistrationPayload(registrationCode));
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to complete registration",
                variant: "destructive"
            });
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Register for {event.name}</DialogTitle>
                    <DialogDescription>
                        {isPaid ? (
                            <div className="flex items-center gap-2 text-base mt-2">
                                <CreditCard className="w-5 h-5" />
                                <span>Ticket Price: <strong>{priceLabel}</strong></span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-base mt-2 text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span><strong>Free Event</strong></span>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {alreadyRegistered ? (
                    <div className="py-8 text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Already Registered</h3>
                        <p className="text-muted-foreground">
                            You are already registered for this event. Check your registrations in "My Events".
                        </p>
                    </div>
                ) : (
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
                                    value={currency.code}
                                    onChange={(code, option) => { setCurrency(option); setPreferredCurrency(code); }}
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
                                        {isPaid ? 'Processing...' : 'Registering...'}
                                    </>
                                ) : (
                                    <>
                                        {isPaid ? (
                                            <>Pay {priceLabel}</>
                                        ) : (
                                            'Complete Registration'
                                        )}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
