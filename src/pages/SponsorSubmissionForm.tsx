import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getEventBySlug, Event } from "@/lib/events-store";
import { submitSponsor } from "@/lib/event-submissions-api";
import { useSiteContent, getOptionList, FALLBACK_OPTION_LISTS } from "@/lib/site-content";

export default function SponsorSubmissionForm() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [event, setEvent] = useState<Event | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        companyName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        sponsorshipTier: "",
        sponsorshipBudget: "",
        sponsorshipAreas: [] as string[],
        additionalNotes: ""
    });

    /* Sponsorship areas come from Supabase `option_lists` (seeded identical
     * to the fallback, so nothing visibly changes). */
    const sponsorshipAreaOptions = useSiteContent(
        () => getOptionList("sponsorship_area"),
        FALLBACK_OPTION_LISTS.sponsorship_area
    );
    const sponsorshipOptions = sponsorshipAreaOptions.map((option) => option.value);

    useEffect(() => {
        if (slug) {
            getEventBySlug(slug).then((foundEvent) => {
                if (foundEvent && foundEvent.isUpcoming && foundEvent.lookingForSponsors) {
                    setEvent(foundEvent);
                } else {
                    navigate('/events');
                }
            });
        }
    }, [slug, navigate]);

    const handleCheckboxChange = (option: string, checked: boolean) => {
        if (checked) {
            setFormData({ ...formData, sponsorshipAreas: [...formData.sponsorshipAreas, option] });
        } else {
            setFormData({ ...formData, sponsorshipAreas: formData.sponsorshipAreas.filter(a => a !== option) });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!event) return;

        // Validation
        if (!formData.companyName || !formData.contactName || !formData.contactEmail) {
            toast({
                title: "Missing Required Fields",
                description: "Please fill in all required fields marked with *",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await submitSponsor({
                eventId: event.id,
                eventName: event.name,
                companyName: formData.companyName,
                contactName: formData.contactName,
                contactEmail: formData.contactEmail,
                contactPhone: formData.contactPhone || undefined,
                sponsorshipTier: formData.sponsorshipTier || undefined,
                sponsorshipBudget: formData.sponsorshipBudget || undefined,
                sponsorshipAreas: formData.sponsorshipAreas,
                additionalNotes: formData.additionalNotes || undefined
            });

            toast({
                title: "Sponsorship Proposal Submitted!",
                description: "Thank you for your interest. The organizers will reach out to you soon."
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
                        Back to Event
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Handshake className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Become a Sponsor</h1>
                        <p className="text-muted-foreground">for {event.name}</p>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-8 shadow-sm border">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Company Name */}
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name *</Label>
                            <Input
                                id="companyName"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                placeholder="Your company or organization name"
                                required
                            />
                        </div>

                        {/* Contact Name */}
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Contact Person Name *</Label>
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
                            <Label htmlFor="contactEmail">Contact Email *</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                placeholder="email@company.com"
                                required
                            />
                        </div>

                        {/* Contact Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Contact Phone</Label>
                            <Input
                                id="contactPhone"
                                type="tel"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                placeholder="+91 XXXXX XXXXX"
                            />
                        </div>

                        {/* Sponsorship Tier */}
                        <div className="space-y-2">
                            <Label htmlFor="sponsorshipTier">Sponsorship Tier Interest</Label>
                            <Input
                                id="sponsorshipTier"
                                value={formData.sponsorshipTier}
                                onChange={(e) => setFormData({ ...formData, sponsorshipTier: e.target.value })}
                                placeholder="e.g., Platinum, Gold, Silver, Bronze"
                            />
                        </div>

                        {/* Sponsorship Budget */}
                        <div className="space-y-2">
                            <Label htmlFor="sponsorshipBudget">Sponsorship Budget Range</Label>
                            <Input
                                id="sponsorshipBudget"
                                value={formData.sponsorshipBudget}
                                onChange={(e) => setFormData({ ...formData, sponsorshipBudget: e.target.value })}
                                placeholder="e.g., ₹50,000 - ₹1,00,000"
                            />
                        </div>

                        {/* Sponsorship Areas */}
                        <div className="space-y-3">
                            <Label>What would you like to sponsor?</Label>
                            <div className="space-y-2">
                                {sponsorshipOptions.map((option) => (
                                    <div key={option} className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                                        <Checkbox
                                            id={`area-${option}`}
                                            checked={formData.sponsorshipAreas.includes(option)}
                                            onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
                                        />
                                        <label htmlFor={`area-${option}`} className="text-sm font-medium cursor-pointer">
                                            {option}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="additionalNotes">Additional Notes</Label>
                            <Textarea
                                id="additionalNotes"
                                value={formData.additionalNotes}
                                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                                placeholder="Tell us more about your sponsorship interests, special requirements, or questions..."
                                rows={4}
                            />
                        </div>

                        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>Submitting...</>
                            ) : (
                                <>Submit Sponsorship Proposal</>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
