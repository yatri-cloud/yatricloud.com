import { useState } from "react";
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
import { initiateRazorpayPayment, isEventPaid, formatEventPrice } from "@/lib/razorpay";
import { generateUniqueCode, addRegistration, isUserRegistered, type EventRegistration } from "@/lib/registration-store";
import { registerForEvent } from "@/lib/registration-api";
import { useToast } from "@/hooks/use-toast";

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
    const userId = "user123"; // TODO: Get from auth context

    // Check if already registered
    const alreadyRegistered = isUserRegistered(userId, event.id);

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

    const createRegistration = async (
        paymentData?: {
            paymentId: string;
            orderId?: string;
            amount: number;
        }
    ): Promise<EventRegistration> => {
        // We no longer generate code here, we wait for backend or use a temporary one
        const tempCode = `PENDING_${Date.now()}`;
        const ticketPrice = typeof event.price === 'string' ? parseFloat(event.price) : (event.price || 0);

        // Extract Tech Stack for prefix
        // Logic: specific tech stack > category > uppercase name > "EVENT"
        let codePrefix = "EVENT";
        if (event.techStack && event.techStack.length > 0) {
            codePrefix = event.techStack[0];
        } else if (event.category) {
            codePrefix = event.category;
        } else {
            codePrefix = event.name.split(' ')[0] || "EVENT";
        }

        // Clean prefix
        codePrefix = codePrefix.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10);

        const registrationPayload: EventRegistration = {
            id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            eventId: event.id,
            eventSlug: event.slug || event.id,
            eventName: event.name,
            registrationCode: tempCode, // Will be updated
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
            ticketPrice: isPaid ? ticketPrice : undefined,
            currency: isPaid ? 'INR' : undefined,
            paymentStatus: paymentData ? 'completed' : undefined,
            paymentId: paymentData?.paymentId,
            orderId: paymentData?.orderId,
            paymentAmount: paymentData?.amount,
            paymentTimestamp: paymentData ? new Date().toISOString() : undefined,
        };

        // Sync to backend and get REAL code
        try {
            const apiResponse = await registerForEvent({
                userId,
                eventId: event.id,
                eventSlug: event.slug || event.id,
                eventName: event.name,
                spreadsheetId: event.spreadsheetId,
                registrationCode: "", // Backend will generate
                codePrefix: codePrefix, // Pass the prefix!
                userDetails: registrationPayload.userDetails,
                ticketType: registrationPayload.ticketType,
                ticketPrice: registrationPayload.ticketPrice,
                paymentStatus: registrationPayload.paymentStatus,
                paymentId: registrationPayload.paymentId,
                orderId: registrationPayload.orderId,
                paymentAmount: registrationPayload.paymentAmount,
                paymentTimestamp: registrationPayload.paymentTimestamp,
                currency: registrationPayload.currency,
            });

            if (apiResponse.success && apiResponse.registrationCode) {
                registrationPayload.registrationCode = apiResponse.registrationCode;
            } else {
                console.warn("Backend did not return a code, using fallback/temp");
            }

        } catch (error) {
            console.error('Failed to sync registration to backend:', error);
            // If backend fails, we might still want to save locally with a fallback, 
            // OR fail the whole process. 
            // For now, adhering to fail-safe of saving locally, but we need the code...
            // Let's generate a fallback local code if backend fails so user isn't stuck
            registrationPayload.registrationCode = `OFFLINE_${generateUniqueCode()}`;
        }

        // Save to localStorage with final code
        addRegistration(registrationPayload);

        return registrationPayload;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        if (alreadyRegistered) {
            toast({ title: "Already Registered", description: "You are already registered for this event", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        try {
            if (isPaid) {
                // Handle payment flow
                const price = typeof event.price === 'string' ? parseFloat(event.price) : (event.price || 0);

                initiateRazorpayPayment(
                    {
                        amount: price,
                        currency: 'INR',
                        eventName: event.name,
                        userDetails: {
                            name: formData.name,
                            email: formData.email,
                            phone: formData.phone,
                        }
                    },
                    async (response) => {
                        // Payment successful
                        try {
                            const registration = await createRegistration({
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                amount: price,
                            });

                            toast({
                                title: "Registration Successful!",
                                description: `Your code: ${registration.registrationCode}`,
                            });

                            onSuccess(registration);
                            onClose();
                        } catch (error) {
                            toast({
                                title: "Registration Failed",
                                description: "Payment successful but registration failed. Please contact support.",
                                variant: "destructive"
                            });
                        } finally {
                            setIsSubmitting(false);
                        }
                    },
                    (error) => {
                        // Payment failed
                        setIsSubmitting(false);
                        toast({
                            title: "Payment Failed",
                            description: error.error || "Payment was unsuccessful",
                            variant: "destructive"
                        });
                    }
                );
            } else {
                // Free event - direct registration
                const registration = await createRegistration();

                toast({
                    title: "Registration Successful!",
                    description: `Your code: ${registration.registrationCode}`,
                });

                onSuccess(registration);
                onClose();
                setIsSubmitting(false);
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
                                <span>Ticket Price: <strong>{formatEventPrice(event.price)}</strong></span>
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
                                            <>
                                                <CreditCard className="w-4 h-4 mr-2" />
                                                Pay {formatEventPrice(event.price)}
                                            </>
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
