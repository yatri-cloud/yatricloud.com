import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getEventBySlug, Event } from "@/lib/events-store";
import { submitVenue } from "@/lib/event-submissions-api";

export default function VenueSubmissionForm() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [event, setEvent] = useState<Event | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        venueName: "",
        address: "",
        capacity: "",
        facilities: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        pricingTerms: "",
        additionalNotes: ""
    });

    useEffect(() => {
        if (slug) {
            getEventBySlug(slug).then((foundEvent) => {
                if (foundEvent && foundEvent.isUpcoming && foundEvent.lookingForVenue) {
                    setEvent(foundEvent);
                } else {
                    navigate('/events');
                }
            });
        }
    }, [slug, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!event) return;

        // Validation
        if (!formData.venueName || !formData.address || !formData.capacity || !formData.contactName || !formData.contactEmail) {
            toast({
                title: "Missing Required Fields",
                description: "Please fill in all required fields marked with *",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await submitVenue({
                eventId: event.id,
                eventName: event.name,
                venueName: formData.venueName,
                address: formData.address,
                capacity: parseInt(formData.capacity),
                facilities: formData.facilities,
                contactName: formData.contactName,
                contactEmail: formData.contactEmail,
                contactPhone: formData.contactPhone || undefined,
                pricingTerms: formData.pricingTerms || undefined,
                additionalNotes: formData.additionalNotes || undefined
            });

            toast({
                title: "Venue Proposal Submitted!",
                description: "Thank you for your submission. The organizers will review it soon."
            });

            navigate(`/upcoming-event/${slug}`);
        } catch (error) {
            toast({
                title: "Submission Failed",
                description: "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!event) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-4">
                    <Button variant="ghost" className="gap-2" onClick={() => navigate(`/upcoming-event/${slug}`)}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to Event
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Propose a Venue</h1>
                        <p className="text-muted-foreground">for {event.name}</p>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-8 shadow-sm border">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Venue Name */}
                        <div className="space-y-2">
                            <Label htmlFor="venueName">Venue Name *</Label>
                            <Input
                                id="venueName"
                                value={formData.venueName}
                                onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                                placeholder="e.g., Tech Hub Bangalore"
                                required
                            />
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Complete Address *</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Full address including city, state, and pincode"
                                rows={3}
                                required
                            />
                        </div>

                        {/* Capacity */}
                        <div className="space-y-2">
                            <Label htmlFor="capacity">Seating Capacity *</Label>
                            <Input
                                id="capacity"
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                placeholder="e.g., 200"
                                required
                            />
                        </div>

                        {/* Facilities */}
                        <div className="space-y-2">
                            <Label htmlFor="facilities">Available Facilities</Label>
                            <Textarea
                                id="facilities"
                                value={formData.facilities}
                                onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                                placeholder="e.g., Projector, AC, Parking, Wifi, etc."
                                rows={3}
                            />
                        </div>

                        {/* Contact Name */}
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Your Name *</Label>
                            <Input
                                id="contactName"
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                placeholder="Full name"
                                required
                            />
                        </div>

                        {/* Contact Email */}
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Your Email *</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                placeholder="email@example.com"
                                required
                            />
                        </div>

                        {/* Contact Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Your Phone</Label>
                            <Input
                                id="contactPhone"
                                type="tel"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                placeholder="+91 XXXXX XXXXX"
                            />
                        </div>

                        {/* Pricing/Terms */}
                        <div className="space-y-2">
                            <Label htmlFor="pricingTerms">Pricing & Terms</Label>
                            <Textarea
                                id="pricingTerms"
                                value={formData.pricingTerms}
                                onChange={(e) => setFormData({ ...formData, pricingTerms: e.target.value })}
                                placeholder="e.g., ₹10,000/day, free for educational events, etc."
                                rows={3}
                            />
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="additionalNotes">Additional Notes</Label>
                            <Textarea
                                id="additionalNotes"
                                value={formData.additionalNotes}
                                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                                placeholder="Anything else the organizers should know..."
                                rows={3}
                            />
                        </div>

                        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>Submitting...</>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Venue Proposal
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
