import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getEventBySlug, Event } from "@/lib/events-store";
import { submitSpeaker } from "@/lib/event-submissions-api";

export default function SpeakerSubmissionForm() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [event, setEvent] = useState<Event | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        linkedinWebsite: "",
        bio: "",
        talkTitle: "",
        talkDescription: "",
        talkDuration: "",
        topicCategory: "",
        previousExperience: ""
    });

    useEffect(() => {
        if (slug) {
            getEventBySlug(slug).then((foundEvent) => {
                if (foundEvent && foundEvent.isUpcoming && foundEvent.lookingForSpeakers) {
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
        if (!formData.fullName || !formData.email || !formData.bio || !formData.talkTitle || !formData.talkDescription) {
            toast({
                title: "Missing Required Fields",
                description: "Please fill in all required fields marked with *",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await submitSpeaker({
                eventId: event.id,
                eventName: event.name,
                fullName: formData.fullName,
                email: formData.email,
                linkedinWebsite: formData.linkedinWebsite || undefined,
                bio: formData.bio,
                talkTitle: formData.talkTitle,
                talkDescription: formData.talkDescription,
                talkDuration: formData.talkDuration || undefined,
                topicCategory: formData.topicCategory || undefined,
                previousExperience: formData.previousExperience || undefined
            });

            toast({
                title: "Speaker Application Submitted!",
                description: "Thank you for applying. The organizers will review your proposal soon."
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
                        <Mic className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Apply as Speaker</h1>
                        <p className="text-muted-foreground">for {event.name}</p>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-8 shadow-sm border">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name *</Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Your full name"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@example.com"
                                required
                            />
                        </div>

                        {/* LinkedIn/Website */}
                        <div className="space-y-2">
                            <Label htmlFor="linkedinWebsite">LinkedIn or Website</Label>
                            <Input
                                id="linkedinWebsite"
                                value={formData.linkedinWebsite}
                                onChange={(e) => setFormData({ ...formData, linkedinWebsite: e.target.value })}
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio *</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself, your expertise, and background..."
                                rows={4}
                                required
                            />
                        </div>

                        {/* Talk Title */}
                        <div className="space-y-2">
                            <Label htmlFor="talkTitle">Talk Title *</Label>
                            <Input
                                id="talkTitle"
                                value={formData.talkTitle}
                                onChange={(e) => setFormData({ ...formData, talkTitle: e.target.value })}
                                placeholder="The title of your proposed talk"
                                required
                            />
                        </div>

                        {/* Talk Description */}
                        <div className="space-y-2">
                            <Label htmlFor="talkDescription">Talk Description *</Label>
                            <Textarea
                                id="talkDescription"
                                value={formData.talkDescription}
                                onChange={(e) => setFormData({ ...formData, talkDescription: e.target.value })}
                                placeholder="Describe what your talk will cover, key takeaways, and why it's valuable..."
                                rows={5}
                                required
                            />
                        </div>

                        {/* Talk Duration */}
                        <div className="space-y-2">
                            <Label htmlFor="talkDuration">Preferred Talk Duration</Label>
                            <Input
                                id="talkDuration"
                                value={formData.talkDuration}
                                onChange={(e) => setFormData({ ...formData, talkDuration: e.target.value })}
                                placeholder="e.g., 30 minutes, 45 minutes, 1 hour"
                            />
                        </div>

                        {/* Topic Category */}
                        <div className="space-y-2">
                            <Label htmlFor="topicCategory">Topic Category</Label>
                            <Input
                                id="topicCategory"
                                value={formData.topicCategory}
                                onChange={(e) => setFormData({ ...formData, topicCategory: e.target.value })}
                                placeholder="e.g., AI/ML, Cloud, Security, Frontend, etc."
                            />
                        </div>

                        {/* Previous Experience */}
                        <div className="space-y-2">
                            <Label htmlFor="previousExperience">Previous Speaking Experience</Label>
                            <Textarea
                                id="previousExperience"
                                value={formData.previousExperience}
                                onChange={(e) => setFormData({ ...formData, previousExperience: e.target.value })}
                                placeholder="List previous talks, conferences, or events where you've spoken..."
                                rows={3}
                            />
                        </div>

                        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>Submitting...</>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Speaker Application
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
