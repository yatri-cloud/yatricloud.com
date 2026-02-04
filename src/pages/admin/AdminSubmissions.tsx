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
        const events = getAllEvents().filter(e => e.isUpcoming);
        setUpcomingEvents(events);

        if (events.length > 0 && !selectedEventId) {
            setSelectedEventId(events[0].id);
        }
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            loadSubmissions();
        }
    }, [selectedEventId]);

    const loadSubmissions = () => {
        const data = getAllSubmissionsForEvent(selectedEventId);
        setSubmissions(data);
    };

    const handleApprove = (type: 'venue' | 'speaker' | 'sponsor', id: string) => {
        const success = updateSubmissionStatus(type, id, 'approved');
        if (success) {
            toast({ title: "Approved!", description: `Submission approved successfully.` });
            loadSubmissions();
        }
    };

    const handleReject = (type: 'venue' | 'speaker' | 'sponsor', id: string) => {
        const success = updateSubmissionStatus(type, id, 'rejected');
        if (success) {
            toast({ title: "Rejected", description: `Submission rejected.`, variant: "destructive" });
            loadSubmissions();
        }
    };

    const handleApproveAndEdit = (type: 'venue' | 'speaker' | 'sponsor', submission: any) => {
        updateSubmissionStatus(type, submission.id, 'approved');
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
        if (status === 'approved') return <Badge className="bg-green-600">Approved</Badge>;
        if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
        return <Badge variant="secondary">Pending</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Event Submissions</h1>
                <p className="text-muted-foreground">Review and manage proposals for upcoming events</p>
            </div>

            {/* Event Selector */}
            {upcomingEvents.length > 0 ? (
                <div className="bg-card border rounded-lg p-4">
                    <label className="text-sm font-medium mb-2 block">Select Event</label>
                    <select
                        className="w-full bg-background border rounded-lg px-3 py-2"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                    >
                        {upcomingEvents.map(event => (
                            <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="bg-muted/30 border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">No upcoming events published yet.</p>
                </div>
            )}

            {selectedEventId && (
                <Tabs defaultValue="venues" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="venues">
                            <Building2 className="w-4 h-4 mr-2" />
                            Venues ({submissions.venues.length})
                        </TabsTrigger>
                        <TabsTrigger value="speakers">
                            <Mic className="w-4 h-4 mr-2" />
                            Speakers ({submissions.speakers.length})
                        </TabsTrigger>
                        <TabsTrigger value="sponsors">
                            <Handshake className="w-4 h-4 mr-2" />
                            Sponsors ({submissions.sponsors.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Venues Tab */}
                    <TabsContent value="venues" className="space-y-4">
                        {submissions.venues.length === 0 ? (
                            <div className="bg-muted/30 border rounded-lg p-8 text-center">
                                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No venue proposals yet</p>
                            </div>
                        ) : (
                            submissions.venues.map((venue) => (
                                <div key={venue.id} className="bg-card border rounded-lg p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold">{venue.venueName}</h3>
                                            <p className="text-sm text-muted-foreground">{venue.address}</p>
                                        </div>
                                        <StatusBadge status={venue.status} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-semibold">Capacity:</span> {venue.capacity} people
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

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        {venue.contactEmail}
                                        {venue.contactPhone && (
                                            <>
                                                <Phone className="w-4 h-4 ml-4" />
                                                {venue.contactPhone}
                                            </>
                                        )}
                                    </div>

                                    {venue.status === 'pending' && (
                                        <div className="flex flex-col gap-2 pt-2">
                                            <div className="flex gap-2">
                                                <Button onClick={() => handleApprove('venue', venue.id)} className="flex-1 bg-green-600 hover:bg-green-700">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve Only
                                                </Button>
                                                <Button onClick={() => handleApproveAndEdit('venue', venue)} className="flex-1" variant="default">
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Approve & Fill Form
                                                </Button>
                                            </div>
                                            <Button onClick={() => handleReject('venue', venue.id)} variant="destructive" className="w-full">
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
                            <div className="bg-muted/30 border rounded-lg p-8 text-center">
                                <Mic className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No speaker applications yet</p>
                            </div>
                        ) : (
                            submissions.speakers.map((speaker) => (
                                <div key={speaker.id} className="bg-card border rounded-lg p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold">{speaker.fullName}</h3>
                                            <p className="text-sm text-muted-foreground font-semibold mt-1">{speaker.talkTitle}</p>
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

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        {speaker.email}
                                        {speaker.linkedinWebsite && (
                                            <>
                                                <a href={speaker.linkedinWebsite} target="_blank" rel="noopener noreferrer" className="ml-4 text-primary hover:underline">
                                                    LinkedIn/Website
                                                </a>
                                            </>
                                        )}
                                    </div>

                                    {speaker.status === 'pending' && (
                                        <div className="flex flex-col gap-2 pt-2">
                                            <div className="flex gap-2">
                                                <Button onClick={() => handleApprove('speaker', speaker.id)} className="flex-1 bg-green-600 hover:bg-green-700">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve Only
                                                </Button>
                                                <Button onClick={() => handleApproveAndEdit('speaker', speaker)} className="flex-1" variant="default">
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Approve & Add Speaker
                                                </Button>
                                            </div>
                                            <Button onClick={() => handleReject('speaker', speaker.id)} variant="destructive" className="w-full">
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
                            <div className="bg-muted/30 border rounded-lg p-8 text-center">
                                <Handshake className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No sponsorship proposals yet</p>
                            </div>
                        ) : (
                            submissions.sponsors.map((sponsor) => (
                                <div key={sponsor.id} className="bg-card border rounded-lg p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold">{sponsor.companyName}</h3>
                                            <p className="text-sm text-muted-foreground">Contact: {sponsor.contactName}</p>
                                        </div>
                                        <StatusBadge status={sponsor.status} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                                                    <Badge key={i} variant="secondary">{area}</Badge>
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

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        {sponsor.contactEmail}
                                        {sponsor.contactPhone && (
                                            <>
                                                <Phone className="w-4 h-4 ml-4" />
                                                {sponsor.contactPhone}
                                            </>
                                        )}
                                    </div>

                                    {sponsor.status === 'pending' && (
                                        <div className="flex flex-col gap-2 pt-2">
                                            <div className="flex gap-2">
                                                <Button onClick={() => handleApprove('sponsor', sponsor.id)} className="flex-1 bg-green-600 hover:bg-green-700">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve Only
                                                </Button>
                                                <Button onClick={() => handleApproveAndEdit('sponsor', sponsor)} className="flex-1" variant="default">
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Approve & Add Sponsor
                                                </Button>
                                            </div>
                                            <Button onClick={() => handleReject('sponsor', sponsor.id)} variant="destructive" className="w-full">
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
    );
}
