import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
import { joinWaitlist } from "@/lib/events-api";
import { getCachedUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface WaitlistModalProps {
    event: Event;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function WaitlistModal({ event, open, onClose, onSuccess }: WaitlistModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "" });

    // Prefill from the signed-in Yatri each time the form opens (the profile may
    // load after this component first mounts).
    useEffect(() => {
        if (open) {
            const u = getCachedUser();
            setForm({
                name: u?.fullName || "",
                email: u?.email || "",
                phone: u?.phoneNumber || "",
            });
        }
    }, [open]);

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        const user = getCachedUser();
        if (!user?.id) {
            toast({ title: "Please sign in", description: "Sign in to join the waitlist.", variant: "destructive" });
            return;
        }
        if (!form.name.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }
        if (!form.email.trim() || !form.email.includes("@")) {
            toast({ title: "Valid email is required", variant: "destructive" });
            return;
        }
        if (!form.phone.trim()) {
            toast({ title: "Phone number is required", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const { ok, error } = await joinWaitlist({
            eventId: event.id,
            userId: user.id,
            name: form.name,
            email: form.email,
            phone: form.phone,
        });
        setIsSubmitting(false);

        if (ok) {
            toast({
                title: "You are on the waitlist",
                description: "We will email you if a seat opens.",
            });
            onSuccess();
            onClose();
        } else {
            toast({
                title: "Something went wrong",
                description: error || "Please try again in a moment.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Join the waitlist for {event.name}</DialogTitle>
                    <DialogDescription className="text-base mt-2">
                        Seats are full right now. Join the waitlist and we will email you the moment a seat opens.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="wl-name">Full Name *</Label>
                        <Input
                            id="wl-name"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="John Doe"
                            disabled={isSubmitting}
                            className="min-h-[44px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="wl-email">Email Address *</Label>
                        <Input
                            id="wl-email"
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="john@example.com"
                            disabled={isSubmitting}
                            className="min-h-[44px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="wl-phone">Phone Number *</Label>
                        <Input
                            id="wl-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="+91 9876543210"
                            disabled={isSubmitting}
                            className="min-h-[44px]"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 min-h-[44px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                "Join the waitlist"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
