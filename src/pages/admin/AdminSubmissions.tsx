import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Building2, Mic, Handshake, Eye, Mail, Phone, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    getAllSubmissionsForEvent,
    updateSubmissionStatus,
    VenueSubmission,
    SpeakerSubmission,
    SponsorSubmission
} from "@/lib/event-submissions-api";
import { getAllEvents } from "@/lib/events-store";

export default function AdminSubmissions() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [submissions, setSubmissions] = useState<{
        venues: VenueSubmission[];
        speakers: SpeakerSubmission[];
        sponsors: SponsorSubmission[];
    }>({ venues: [], speakers: [], sponsors: [] });

    useEffect(() => {
        // Load upcoming events
        getAllEvents().then((all) => {
            const events = all.filter(e => e.isUpcoming);
            setUpcomingEvents(events);

            if (events.length > 0 && !selectedEventId) {
                setSelectedEventId(events[0].id);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            loadSubmissions();
        }
    }, [selectedEventId]);

    const loadSubmissions = async () => {
        const data = await getAllSubmissionsForEvent(selectedEventId);
        setSubmissions(data);
    };

    const handleApprove = async (type: 'venue' | 'speaker' | 'sponsor', id: string) => {
        const success = await updateSubmissionStatus(type, id, 'approved');
        if (success) {
            toast({ title: "Approved!", description: `Submission approved successfully.` });
            loadSubmissions();
        }
    };

    const handleReject = async (type: 'venue' | 'speaker' | 'sponsor', id: string) => {
        const success = await updateSubmissionStatus(type, id, 'rejected');
        if (success) {
            toast({ title: "Rejected", description: `Submission rejected.`, variant: "destructive" });
            loadSubmissions();
        }
    };

    const handleApproveAndEdit = async (type: 'venue' | 'speaker' | 'sponsor', submission: any) => {
        await updateSubmissionStatus(type, submission.id, 'approved');
        toast({ title: "Approved & Redirecting", description: `Submission approved. Redirecting to event editor...` });

        // Get current event data
        const event = upcomingEvents.find(e => e.id === selectedEventId);
        if (!event) return;

        // Prepare updated event data based on submission type
        let updatedEvent = { ...event };

        if (type === 'venue') {
            const venue = submission as VenueSubmission;
            updatedEvent = {
                ...updatedEvent,
                location: {
                    ...updatedEvent.location,
                    venue: venue.venueName + (venue.address ? `, ${venue.address}` : ''),
                    type: 'offline', // Assume offline if it's a venue
                    // We can try to parse city/state if available or leave for user to verify
                },
                // If the form has specific fields for map link, we could try to map them if they existed in submission
                // For now, we map the main venue text.
            };
            // If the submission has a google maps link (custom field not in standard interface but requested by user), map it
            if (venue.googleMapsLink) {
                updatedEvent.location.mapLink = venue.googleMapsLink;
            }
        } else if (type === 'speaker') {
            const speaker = submission as SpeakerSubmission;
            const newSpeaker = {
                id: crypto.randomUUID(),
                fullName: speaker.fullName,
                email: speaker.email,
                linkedinUrl: speaker.linkedinWebsite,
                companyName: "", // Not standard in submission form yet?
                about: speaker.bio,
                // Map other available fields
                sessionName: speaker.talkTitle,
                sessionDescription: speaker.talkDescription,
                // Default image if none
                profileImage: ""
            };

            updatedEvent = {
                ...updatedEvent,
                speakers: [...(updatedEvent.speakers || []), newSpeaker]
            };
        } else if (type === 'sponsor') {
            const sponsor = submission as SponsorSubmission;
            const newSponsor = {
                name: sponsor.companyName,
                tier: sponsor.sponsorshipTier || "Partner", // Default or map from submission
                website: "", // Not strictly in interface but useful
                logo: ""
            };

            updatedEvent = {
                ...updatedEvent,
                sponsors: [...(updatedEvent.sponsors || []), newSponsor]
            };
        }

        // Navigate to CreateEvent in edit mode with updated data
        // We pass a flag 'isSubmissionUpdate' to let CreateEvent know to maybe highlight or auto-save? 
        // Or just let the user save.
        setTimeout(() => {
            navigate('/createevent', { state: { event: updatedEvent } });
        }, 1000);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        if (status === 'approved') return <Badge className="rounded-full border-0 bg-success/10 text-success text-xs font-medium">Approved</Badge>;
        if (status === 'rejected') return <Badge className="rounded-full border-0 bg-destructive/10 text-destructive text-xs font-medium">Rejected</Badge>;
        return <Badge className="rounded-full border-0 bg-warning/10 text-warning text-xs font-medium">Pending</Badge>;
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 space-y-6 md:space-y-8">
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
                {/* Header band — distinct blue-tinted workspace panel */}
                <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                    <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Form submissions
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Event Submissions</h1>
                            <p className="text-muted-foreground">Review and manage proposals for your upcoming events.</p>
                        </div>
                    </div>
                </div>

                {/* Event Selector */}
                {upcomingEvents.length > 0 ? (
                    <div className="border border-border rounded-2xl bg-card p-5 md:p-6">
                        <label className="text-sm font-medium mb-2 block">Select event</label>
                        <select
                            className="w-full min-h-[44px] bg-background border border-border rounded-xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                        >
                            {upcomingEvents.map(event => (
                                <option key={event.id} value={event.id}>{event.name}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="border border-border rounded-2xl bg-card p-10 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Building2 className="h-7 w-7" />
                        </div>
                        <h3 className="font-display text-lg font-semibold">No upcoming events yet</h3>
                        <p className="text-muted-foreground mt-1">Publish an upcoming event to start collecting proposals.</p>
                    </div>
                )}

                {selectedEventId && (
                    <Tabs defaultValue="venues" className="w-full space-y-6">
                        <TabsList className="grid w-full grid-cols-3 rounded-xl p-1">
                            <TabsTrigger value="venues" className="min-h-[44px] rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
                                <Building2 className="w-4 h-4 mr-2" />
                                Venues ({submissions.venues.length})
                            </TabsTrigger>
                            <TabsTrigger value="speakers" className="min-h-[44px] rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
                                <Mic className="w-4 h-4 mr-2" />
                                Speakers ({submissions.speakers.length})
                            </TabsTrigger>
                            <TabsTrigger value="sponsors" className="min-h-[44px] rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
                                <Handshake className="w-4 h-4 mr-2" />
                                Sponsors ({submissions.sponsors.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Venues Tab */}
                        <TabsContent value="venues" className="space-y-4">
                            {submissions.venues.length === 0 ? (
                                <div className="border border-border rounded-2xl bg-card p-10 text-center">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Building2 className="h-7 w-7" />
                                    </div>
                                    <h3 className="font-display text-lg font-semibold">No venue proposals yet</h3>
                                    <p className="text-muted-foreground mt-1">New venue offers for this event will show up here.</p>
                                </div>
                            ) : (
                                submissions.venues.map((venue) => (
                                    <div key={venue.id} className="border border-border rounded-2xl bg-card p-5 md:p-6 space-y-5 hover:border-brand-200 hover:shadow-card transition">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <h3 className="text-lg md:text-xl font-bold tracking-tight">{venue.venueName}</h3>
                                                <p className="text-sm text-muted-foreground">{venue.address}</p>
                                            </div>
                                            <StatusBadge status={venue.status} />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold">Capacity:</span> <span className="tabular-nums">{venue.capacity}</span> people
                                            </div>
                                            <div>
                                                <span className="font-semibold">Contact:</span> {venue.contactName}
                                            </div>
                                        </div>

                                        {venue.facilities && (
                                            <div className="text-sm">
                                                <span className="font-semibold">Facilities:</span> {venue.facilities}
                                            </div>
                                        )}

                                        {venue.pricingTerms && (
                                            <div className="text-sm">
                                                <span className="font-semibold">Pricing:</span> {venue.pricingTerms}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                            <span className="inline-flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                {venue.contactEmail}
                                            </span>
                                            {venue.contactPhone && (
                                                <span className="inline-flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    {venue.contactPhone}
                                                </span>
                                            )}
                                        </div>

                                        {venue.status === 'pending' && (
                                            <div className="flex flex-col gap-2 pt-1">
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button onClick={() => handleApprove('venue', venue.id)} className="flex-1 min-h-[44px] rounded-xl bg-success hover:bg-success/90">
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Approve Only
                                                    </Button>
                                                    <Button onClick={() => handleApproveAndEdit('venue', venue)} className="flex-1 min-h-[44px] rounded-xl" variant="default">
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Approve & Fill Form
                                                    </Button>
                                                </div>
                                                <Button onClick={() => handleReject('venue', venue.id)} variant="destructive" className="w-full min-h-[44px] rounded-xl">
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        {/* Speakers Tab */}
                        <TabsContent value="speakers" className="space-y-4">
                            {submissions.speakers.length === 0 ? (
                                <div className="border border-border rounded-2xl bg-card p-10 text-center">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Mic className="h-7 w-7" />
                                    </div>
                                    <h3 className="font-display text-lg font-semibold">No speaker applications yet</h3>
                                    <p className="text-muted-foreground mt-1">Talk proposals for this event will appear here.</p>
                                </div>
                            ) : (
                                submissions.speakers.map((speaker) => (
                                    <div key={speaker.id} className="border border-border rounded-2xl bg-card p-5 md:p-6 space-y-5 hover:border-brand-200 hover:shadow-card transition">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <h3 className="text-lg md:text-xl font-bold tracking-tight">{speaker.fullName}</h3>
                                                <p className="text-sm text-muted-foreground font-semibold">{speaker.talkTitle}</p>
                                            </div>
                                            <StatusBadge status={speaker.status} />
                                        </div>

                                        <div className="text-sm">
                                            <span className="font-semibold">Bio:</span>
                                            <p className="mt-1 text-muted-foreground">{speaker.bio}</p>
                                        </div>

                                        <div className="text-sm">
                                            <span className="font-semibold">Talk Description:</span>
                                            <p className="mt-1 text-muted-foreground">{speaker.talkDescription}</p>
                                        </div>

                                        {speaker.topicCategory && (
                                            <div className="text-sm">
                                                <span className="font-semibold">Category:</span> {speaker.topicCategory}
                                            </div>
                                        )}

                                        {speaker.talkDuration && (
                                            <div className="text-sm">
                                                <span className="font-semibold">Duration:</span> {speaker.talkDuration}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                            <span className="inline-flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                {speaker.email}
                                            </span>
                                            {speaker.linkedinWebsite && (
                                                <a href={speaker.linkedinWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                    LinkedIn/Website
                                                </a>
                                            )}
                                        </div>

                                        {speaker.status === 'pending' && (
                                            <div className="flex flex-col gap-2 pt-1">
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button onClick={() => handleApprove('speaker', speaker.id)} className="flex-1 min-h-[44px] rounded-xl bg-success hover:bg-success/90">
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Approve Only
                                                    </Button>
                                                    <Button onClick={() => handleApproveAndEdit('speaker', speaker)} className="flex-1 min-h-[44px] rounded-xl" variant="default">
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Approve & Add Speaker
                                                    </Button>
                                                </div>
                                                <Button onClick={() => handleReject('speaker', speaker.id)} variant="destructive" className="w-full min-h-[44px] rounded-xl">
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        {/* Sponsors Tab */}
                        <TabsContent value="sponsors" className="space-y-4">
                            {submissions.sponsors.length === 0 ? (
                                <div className="border border-border rounded-2xl bg-card p-10 text-center">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Handshake className="h-7 w-7" />
                                    </div>
                                    <h3 className="font-display text-lg font-semibold">No sponsorship proposals yet</h3>
                                    <p className="text-muted-foreground mt-1">Partnership offers for this event will appear here.</p>
                                </div>
                            ) : (
                                submissions.sponsors.map((sponsor) => (
                                    <div key={sponsor.id} className="border border-border rounded-2xl bg-card p-5 md:p-6 space-y-5 hover:border-brand-200 hover:shadow-card transition">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <h3 className="text-lg md:text-xl font-bold tracking-tight">{sponsor.companyName}</h3>
                                                <p className="text-sm text-muted-foreground">Contact: {sponsor.contactName}</p>
                                            </div>
                                            <StatusBadge status={sponsor.status} />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            {sponsor.sponsorshipTier && (
                                                <div>
                                                    <span className="font-semibold">Tier Interest:</span> {sponsor.sponsorshipTier}
                                                </div>
                                            )}
                                            {sponsor.sponsorshipBudget && (
                                                <div>
                                                    <span className="font-semibold">Budget:</span> {sponsor.sponsorshipBudget}
                                                </div>
                                            )}
                                        </div>

                                        {sponsor.sponsorshipAreas && sponsor.sponsorshipAreas.length > 0 && (
                                            <div className="text-sm">
                                                <span className="font-semibold">Sponsorship Areas:</span>
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {sponsor.sponsorshipAreas.map((area, i) => (
                                                        <Badge key={i} className="rounded-full border-0 bg-primary/10 text-primary text-xs font-medium">{area}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {sponsor.additionalNotes && (
                                            <div className="text-sm">
                                                <span className="font-semibold">Notes:</span>
                                                <p className="mt-1 text-muted-foreground">{sponsor.additionalNotes}</p>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                            <span className="inline-flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                {sponsor.contactEmail}
                                            </span>
                                            {sponsor.contactPhone && (
                                                <span className="inline-flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    {sponsor.contactPhone}
                                                </span>
                                            )}
                                        </div>

                                        {sponsor.status === 'pending' && (
                                            <div className="flex flex-col gap-2 pt-1">
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button onClick={() => handleApprove('sponsor', sponsor.id)} className="flex-1 min-h-[44px] rounded-xl bg-success hover:bg-success/90">
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Approve Only
                                                    </Button>
                                                    <Button onClick={() => handleApproveAndEdit('sponsor', sponsor)} className="flex-1 min-h-[44px] rounded-xl" variant="default">
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Approve & Add Sponsor
                                                    </Button>
                                                </div>
                                                <Button onClick={() => handleReject('sponsor', sponsor.id)} variant="destructive" className="w-full min-h-[44px] rounded-xl">
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
