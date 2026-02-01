import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getStoredUser, registerForEvent } from "@/lib/yatris-api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Minus, Plus, Ticket, Users, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

interface EventRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: {
        id: string;
        name: string;
        date: string;
        location: any;
        imageUrl: string;
        price?: string | number;
    };
    onSuccess: () => void;
}

interface AttendeeForm {
    name: string;
    email: string;
    phone: string;
}

export const EventRegistrationModal = ({ isOpen, onClose, event, onSuccess }: EventRegistrationModalProps) => {
    const { toast } = useToast();
    const [step, setStep] = useState<'details' | 'success'>('details');
    const [ticketCount, setTicketCount] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attendees, setAttendees] = useState<AttendeeForm[]>([
        { name: "", email: "", phone: "" }
    ]);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Handle window resize for confetti
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Pre-fill first attendee with user data
    useEffect(() => {
        if (isOpen) {
            setStep('details');
            setTicketCount(1);
            const user = getStoredUser();
            if (user) {
                setAttendees([{
                    name: user.fullName || "",
                    email: user.email || "",
                    phone: user.phoneNumber || ""
                }]);
            } else {
                setAttendees([{ name: "", email: "", phone: "" }]);
            }
        }
    }, [isOpen]);

    // Update attendees array when ticket count changes
    useEffect(() => {
        setAttendees(prev => {
            const newAttendees = [...prev];
            if (ticketCount > prev.length) {
                // Add empty forms
                for (let i = prev.length; i < ticketCount; i++) {
                    newAttendees.push({ name: "", email: "", phone: "" });
                }
            } else if (ticketCount < prev.length) {
                // Remove excess forms
                newAttendees.length = ticketCount;
            }
            return newAttendees;
        });
    }, [ticketCount]);

    const updateAttendee = (index: number, field: keyof AttendeeForm, value: string) => {
        setAttendees(prev => {
            const newAttendees = [...prev];
            newAttendees[index] = { ...newAttendees[index], [field]: value };
            return newAttendees;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        const isValid = attendees.every(a => a.name && a.email && a.phone);
        if (!isValid) {
            toast({
                title: "Missing details",
                description: "Please fill in all attendee details.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await registerForEvent(event, attendees);

            if (result.success) {
                setStep('success');
                onSuccess?.();
            } else {
                toast({
                    title: "Registration Failed",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep('details'); // Reset for next time
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[85vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                {step === 'success' && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}

                <AnimatePresence mode="wait">
                    {step === 'details' ? (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">
                                    Event Registration
                                </DialogTitle>
                                <DialogDescription>
                                    {event.name} • {new Date(event.date).toLocaleDateString()}
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                                {/* Ticket Selection */}
                                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-base font-semibold">Number of Tickets</Label>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => ticketCount > 1 && setTicketCount(c => c - 1)}
                                                disabled={ticketCount <= 1}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-8 text-center font-bold text-lg">{ticketCount}</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => ticketCount < 10 && setTicketCount(c => c + 1)}
                                                disabled={ticketCount >= 10}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Registering for yourself? Select 1. Bringing friends? Add more!
                                    </p>
                                </div>

                                <Separator />

                                {/* Attendee Details */}
                                <div className="space-y-6">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Attendee Details
                                    </h3>

                                    {attendees.map((attendee, index) => (
                                        <div key={index} className="p-4 border border-border rounded-xl bg-card space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-sm text-primary">
                                                    Ticket #{index + 1} {index === 0 && "(You)"}
                                                </h4>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`name-${index}`}>Full Name <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        id={`name-${index}`}
                                                        placeholder="Yatharth Chauhan"
                                                        value={attendee.name}
                                                        onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`phone-${index}`}>Contact Number <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        id={`phone-${index}`}
                                                        placeholder="+1 234 567 8900"
                                                        value={attendee.phone}
                                                        onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-1 md:col-span-2 space-y-2">
                                                    <Label htmlFor={`email-${index}`}>Email Address <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        id={`email-${index}`}
                                                        type="email"
                                                        placeholder="name@example.com"
                                                        value={attendee.email}
                                                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                {/* Summary */}
                                <div className="flex items-center justify-between text-lg font-bold bg-primary/5 p-4 rounded-xl border border-primary/20">
                                    <span>Total Amount</span>
                                    <span className="text-primary">
                                        {event.price === 'Free' || !event.price ? 'Free' : `$${(ticketCount * Number(event.price?.toString().replace(/[^0-9.]/g, '') || 0)).toFixed(2)}`}
                                    </span>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                                    <Button type="submit" className="min-w-[150px]" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Registering...
                                            </>
                                        ) : (
                                            "Confirm Registration"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8 space-y-6"
                        >
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-foreground">You're All Set!</h2>
                                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                                    Your registration for <span className="font-semibold text-foreground">{event.name}</span> has been confirmed.
                                </p>
                            </div>

                            <div className="bg-muted/50 p-6 rounded-2xl max-w-sm mx-auto border border-border">
                                <p className="font-medium mb-1">We've sent a confirmation email to:</p>
                                <p className="text-primary font-bold text-lg">{attendees[0].email}</p>
                                <div className="mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-2">
                                    <Ticket className="w-4 h-4" />
                                    <span>{ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'} Reserved</span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button onClick={handleClose} size="lg" className="w-full max-w-xs">
                                    See You There!
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};
