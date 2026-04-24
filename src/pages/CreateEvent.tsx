import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, CheckCircle2, Ticket, Users, Calendar as CalendarIcon, Plus, MapPin, Upload, Save, Clock, Handshake, Trash2, Image as ImageIcon, Link as LinkIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createEventStructure } from "@/lib/event-automation-api";
import { INDIAN_STATES } from "@/lib/indian-locations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { saveEvent, Event, Sponsor, EventSpeaker, GalleryAlbum, GalleryMedia, Ticket as EventTicket } from "@/lib/events-store";

type Step = 1 | 2 | 3 | 4 | 5;

const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 30) {
            const hour = i;
            const minute = j === 0 ? "00" : "30";
            const timeValue = `${hour.toString().padStart(2, '0')}:${minute}`;

            const displayHour = i % 12 || 12;
            const ampm = i < 12 ? "AM" : "PM";
            const timeLabel = `${displayHour.toString().padStart(2, '0')}:${minute} ${ampm}`;

            slots.push({ value: timeValue, label: timeLabel });
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

const TIMEZONES = [
    { value: 'Asia/Kolkata', label: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
    { value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time' },
    { value: 'Asia/Dubai', label: '(UTC+04:00) Abu Dhabi, Muscat' },
    { value: 'Asia/Singapore', label: '(UTC+08:00) Kuala Lumpur, Singapore' },
    { value: 'Europe/London', label: '(UTC+00:00) Edinburgh, London' },
    { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
];

export default function CreateEvent() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [showCollaborationSelector, setShowCollaborationSelector] = useState(true);
    const [step, setStep] = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);
    const locationState = useLocation();
    const [eventId, setEventId] = useState<string>(() => crypto.randomUUID());
    const [isEditMode, setIsEditMode] = useState(false);


    useEffect(() => {
        if (locationState.state && locationState.state.event) {
            const editEvent = locationState.state.event as Event;
            setEventId(editEvent.id);
            setIsEditMode(true);

            // Check if it's a past event
            const isPast = new Date(editEvent.date) < new Date();

            // Skip collaboration selector for edit mode or past events
            setShowCollaborationSelector(false);

            // If it's a past event, default to the Gallery step (5) for easier management
            if (isPast) setStep(5);

            const startDateObj = new Date(editEvent.date);
            const endDateObj = editEvent.endDate ? new Date(editEvent.endDate) : null;

            setFormData(prev => ({
                ...prev,
                eventName: editEvent.name,
                startDate: format(startDateObj, "yyyy-MM-dd"),
                startTime: format(startDateObj, "HH:mm"),
                endDate: endDateObj ? format(endDateObj, "yyyy-MM-dd") : "",
                endTime: endDateObj ? format(endDateObj, "HH:mm") : "",
                isSameDay: !endDateObj || format(startDateObj, "yyyy-MM-dd") === format(endDateObj, "yyyy-MM-dd"),
                timezone: editEvent.timezone,
                communityLink: editEvent.communityLink || "",
                state: editEvent.location.state || "",
                city: editEvent.location.city || "",
                location: editEvent.location.venue || "",
                mapLink: editEvent.location.mapLink || "",
                description: editEvent.description || "",
                aboutEvent: editEvent.fullDescription || "",
                posterUrl: editEvent.imageUrl,
                pricingType: editEvent.price === 'Free' ? 'free' : 'paid',
                price: editEvent.price !== 'Free' ? String(editEvent.price) : "",
                capacity: editEvent.seatsAvailable ? String(editEvent.seatsAvailable) : "",
                registrationDeadline: editEvent.registrationDeadline || "",
                tickets: editEvent.tickets || [],
                organizerName: editEvent.organizer?.name || "",
                organizerEmail: editEvent.organizer?.email || "",
                organizerPhone: editEvent.organizer?.phone || "",
                noSponsorsRequired: !editEvent.sponsors || editEvent.sponsors.length === 0,
                sponsors: editEvent.sponsors || [],
                speakers: editEvent.speakers || [],
                gallery: editEvent.gallery || [],
                lookingForVenue: editEvent.lookingForVenue || false,
                lookingForSpeakers: editEvent.lookingForSpeakers || false,
                lookingForSponsors: editEvent.lookingForSponsors || false,

                // New Fields
                category: editEvent.category || "Workshop",
                techStack: editEvent.techStack ? editEvent.techStack.join(", ") : ""
            }));
        }
    }, [locationState.state]);

    const [formData, setFormData] = useState({
        eventName: "",
        startDate: "",
        startTime: "",
        endTime: "",
        isSameDay: true,
        endDate: "",
        timezone: "Asia/Kolkata",
        communityLink: "",

        state: "",
        city: "",
        location: "", // Address Text
        mapLink: "",  // Google Maps Link
        description: "",
        aboutEvent: "",
        posterUrl: "",


        pricingType: "free" as "free" | "paid",
        price: "",
        capacity: "",
        registrationDeadline: "",
        tickets: [] as EventTicket[],
        organizerName: "Yatri Cloud",
        organizerEmail: "events@yatricloud.com",
        organizerPhone: "+91 9724823602",

        // New Fields
        category: "Workshop",
        techStack: "", // Comma separated string for input

        noSponsorsRequired: true,
        sponsors: [] as Sponsor[],
        speakers: [] as EventSpeaker[],
        gallery: [] as GalleryAlbum[],

        // Collaboration flags
        lookingForVenue: false,
        lookingForSpeakers: false,
        lookingForSponsors: false
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, posterUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFetchAddressFromMap = () => {
        if (!formData.mapLink) {
            toast({ title: "No Link Provided", description: "Please paste a Google Maps link first.", variant: "destructive" });
            return;
        }

        setIsFetchingAddress(true);
        // Simulate API delay
        setTimeout(() => {
            // Mock logic: Try to parse generic names or just fallback
            // In a real app, this would call a Maps API proxy
            const mockAddress = "Nexus Mall, Koramangala, Bangalore, Karnataka 560095";
            setFormData(prev => ({
                ...prev,
                location: mockAddress,
                city: "bangalore", // Simulating city extraction
                state: "karnataka" // Simulating state extraction
            }));
            setIsFetchingAddress(false);
            toast({ title: "Address Fetched", description: "Location details updated from Map Link." });
        }, 1500);
    };

    const handleGenerateDescription = async () => {
        if (!formData.eventName) {
            toast({ title: "Event Name Required", description: "Please enter an event name first.", variant: "destructive" });
            return;
        }

        // setIsGeneratingAI(true);
        setFormData(prev => ({ ...prev, aboutEvent: "" }));

        try {
            const prompt = `Write a comprehensive and engaging event description for:
Event Name: ${formData.eventName}
Date: ${formData.startDate} ${formData.startTime}
Location: ${formData.location || formData.city}
Type: ${formData.pricingType}
Organizer: ${formData.organizerName}
Brief Summary/Context: ${formData.description || "N/A"}

Include:
- An exciting introduction
- Key takeaways/agenda points
- Why people should attend
- Call to action for registration

Keep it professional yet enthusiastic. Use markdown formatting.`;

            // Use environment variable for API URL or default
            const apiUrl = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:3001/api/chat';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt })
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) return;

            let fullText = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ')) {
                        const data = trimmed.slice(6);
                        if (data === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.token) {
                                fullText += parsed.token;
                                setFormData(prev => ({ ...prev, aboutEvent: fullText }));
                            }
                        } catch (e) { }
                    }
                }
            }
        } catch (error) {
            toast({ title: "AI Error", description: "Failed to generate description. Make sure AI server is running.", variant: "destructive" });
        } finally {
            // setIsGeneratingAI(false);
        }
    };

    const getStartISO = () => {
        if (!formData.startDate || !formData.startTime) return "";
        return `${formData.startDate}T${formData.startTime}`;
    };

    const getEndISO = () => {
        if (!formData.endTime) return "";
        const datePart = formData.isSameDay ? formData.startDate : formData.endDate;
        if (!datePart) return "";
        return `${datePart}T${formData.endTime}`;
    };

    const constructEventObject = (status: 'draft' | 'upcoming' | 'past'): Event => {
        // Generate slug from name
        const slug = (formData.eventName || "untitled-event")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

        return {
            id: eventId,
            name: formData.eventName || "Untitled Event",
            slug: slug,
            description: formData.description,
            fullDescription: formData.aboutEvent,
            imageUrl: formData.posterUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop",
            date: getStartISO() || new Date().toISOString(),
            endDate: getEndISO(),
            timezone: "IST",
            location: {
                type: "offline",
                venue: formData.location,
                mapLink: formData.mapLink,
                city: formData.city,
                state: formData.state,
                country: "India"
            },
            category: formData.category,
            techStack: formData.techStack.split(',').map(s => s.trim()).filter(s => s !== ""),
            status: status,
            price: formData.pricingType === 'paid' ? formData.price : 'Free',
            // Ticket Info
            seatsAvailable: formData.capacity ? parseInt(formData.capacity) : undefined,
            registrationDeadline: formData.registrationDeadline,
            tickets: formData.tickets.length > 0 ? formData.tickets : undefined,
            communityLink: formData.communityLink,

            organizer: {
                name: formData.organizerName,
                email: formData.organizerEmail,
                phone: formData.organizerPhone
            },
            sponsors: formData.noSponsorsRequired ? [] : formData.sponsors,
            speakers: formData.speakers,
            gallery: formData.gallery,

            // Collaboration flags for upcoming events
            lookingForVenue: formData.lookingForVenue,
            lookingForSpeakers: formData.lookingForSpeakers,
            lookingForSponsors: formData.lookingForSponsors
        };
    };

    const handleSaveDraft = (sectionName: string) => {
        const draftEvent = constructEventObject('draft');
        saveEvent(draftEvent);
        toast({ title: "Draft Saved", description: `${sectionName} saved to drafts.` });
    };

    const handleSaveDetail = () => {
        if (!formData.eventName.trim()) {
            toast({ title: "Validation Error", description: "Event name is required", variant: "destructive" });
            return;
        }
        handleSaveDraft("Event Details");
    };

    const handleSaveTickets = () => handleSaveDraft("Tickets Config");
    const handleSaveSpeakers = () => handleSaveDraft("Speakers Config");
    const handleSaveSponsors = () => handleSaveDraft("Sponsors Config");

    const handleAddSponsor = () => {
        setFormData({
            ...formData,
            sponsors: [
                ...formData.sponsors,
                { name: "", tier: "Partner", website: "", logo: "" }
            ]
        });
    };

    const handleRemoveSponsor = (index: number) => {
        const newSponsors = [...formData.sponsors];
        newSponsors.splice(index, 1);
        setFormData({ ...formData, sponsors: newSponsors });
    };

    const handleSponsorChange = (index: number, field: keyof Sponsor, value: string) => {
        const newSponsors = [...formData.sponsors];
        // @ts-ignore
        newSponsors[index] = { ...newSponsors[index], [field]: value };
        setFormData({ ...formData, sponsors: newSponsors });
    };

    const handleAddTicket = () => {
        setFormData({
            ...formData,
            tickets: [
                ...formData.tickets,
                { id: crypto.randomUUID(), type: "General Admission", price: "Free", description: "Standard entry", available: true, capacity: 100, benefits: [] }
            ]
        });
    };

    const handleRemoveTicket = (index: number) => {
        const newTickets = [...formData.tickets];
        newTickets.splice(index, 1);
        setFormData({ ...formData, tickets: newTickets });
    };

    const handleTicketChange = (index: number, field: keyof EventTicket, value: string | boolean | number | string[]) => {
        const newTickets = [...formData.tickets];
        // @ts-ignore
        newTickets[index] = { ...newTickets[index], [field]: value };
        setFormData({ ...formData, tickets: newTickets });
    };

    const handleSponsorLogoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newSponsors = [...formData.sponsors];
                newSponsors[index] = { ...newSponsors[index], logo: reader.result as string };
                setFormData({ ...formData, sponsors: newSponsors });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFinalSubmit = async () => {
        const startISO = getStartISO();
        const endISO = getEndISO();

        if (!formData.eventName.trim() || !startISO || !formData.organizerName.trim() || !formData.organizerEmail.trim() || !formData.description.trim() || !formData.aboutEvent.trim()) {
            toast({ title: "Validation Error", description: "Please fill all mandatory fields (Event Name, Description, About, Organizer Name & Email).", variant: "destructive" });
            if (!formData.organizerName.trim() || !formData.organizerEmail.trim()) setStep(1); // Organizer is in Step 1
            if (!formData.description.trim() || !formData.aboutEvent.trim()) setStep(1);
            return;
        }

        if (endISO && new Date(endISO) <= new Date(startISO)) {
            toast({ title: "Error", description: "End time must be after start time", variant: "destructive" });
            setStep(1);
            return;
        }

        setIsSubmitting(true);

        try {
            const eventDataPayload: any = {
                eventName: formData.eventName,
                eventDate: startISO,
                endDate: endISO,
                timezone: formData.timezone,
                state: formData.state,
                city: formData.city,
                location: formData.location,
                mapLink: formData.mapLink,
                communityLink: formData.communityLink,
                description: formData.description,
                aboutEvent: formData.aboutEvent,
                imageUrl: formData.posterUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop",
                pricingType: formData.pricingType,
                price: formData.price && formData.pricingType === 'paid' ? parseFloat(formData.price) : undefined,
                capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
                registrationDeadline: formData.registrationDeadline,
                organizerName: formData.organizerName,
                organizerEmail: formData.organizerEmail,
                organizerPhone: formData.organizerPhone,
                sponsors: formData.noSponsorsRequired ? [] : formData.sponsors,
                speakers: formData.speakers.map(s => ({
                    name: s.fullName,
                    role: "Speaker",
                    company: s.companyName || "",
                    bio: s.about,
                    email: s.email,
                    phone: s.phone,
                    imageUrl: s.profileImage || "",
                    linkedinUrl: s.linkedinUrl
                }))
            };

            const result = await createEventStructure(eventDataPayload);

            if (result.success) {
                const eventStatus = new Date(startISO) < new Date() ? 'past' : 'upcoming';
                const publishedEvent = constructEventObject(eventStatus);

                // Add Drive folder ID to the event
                if (result.eventFolderId) {
                    publishedEvent.driveFolderId = result.eventFolderId;
                }

                saveEvent(publishedEvent);
                toast({ title: "Event Published!", description: `Event is now live on the public ${eventStatus} events page.` });
                navigate('/admin/events');
            } else {
                throw new Error(result.error || "Failed to create event structure");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Something went wrong", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePublishAsUpcoming = async () => {
        // Validate that at least one collaboration flag is checked
        if (!formData.lookingForVenue && !formData.lookingForSpeakers && !formData.lookingForSponsors) {
            toast({
                title: "Select Collaboration Needs",
                description: "Please select at least one area where you need community help.",
                variant: "destructive"
            });
            return;
        }

        const startISO = getStartISO();
        const endISO = getEndISO();

        if (!formData.eventName.trim() || !startISO || !formData.organizerName.trim() || !formData.organizerEmail.trim()) {
            toast({
                title: "Validation Error",
                description: "Please fill all mandatory fields (Event Name, Organizer Name & Email).",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Create event as "upcoming" with isUpcoming flag
            const upcomingEvent = constructEventObject('draft'); // Status is draft until confirmed, but we use isUpcoming flag
            upcomingEvent.isUpcoming = true; // Mark as upcoming event

            // Call API to create backend structure (Sheets/Folders)
            // This ensures we have a spreadsheet to store submissions in
            const automationResponse = await createEventStructure({
                eventName: upcomingEvent.name,
                eventDate: upcomingEvent.date,
                state: upcomingEvent.location.state || 'Karnataka',
                city: upcomingEvent.location.city || 'Bangalore',
                location: upcomingEvent.location.venue,
                description: upcomingEvent.description,
                organizerName: upcomingEvent.organizer?.name,
                organizerEmail: upcomingEvent.organizer?.email
            });

            if (automationResponse.success && automationResponse.spreadsheetId) {
                upcomingEvent.spreadsheetId = automationResponse.spreadsheetId;

                // Add Drive folder ID to the event
                if (automationResponse.eventFolderId) {
                    upcomingEvent.driveFolderId = automationResponse.eventFolderId;
                }

                toast({
                    title: "Backend Setup Complete",
                    description: "Google Sheets and Folders created successfully."
                });
            } else if (automationResponse.error) {
                console.error("Automation Error:", automationResponse.error);
                // We proceed anyway, but warn
                toast({
                    title: "Warning",
                    description: "Event created but backend setup failed. Data will be saved locally only.",
                    variant: "destructive"
                });
            }

            saveEvent(upcomingEvent);

            toast({
                title: "Published as Upcoming!",
                description: "Event is now visible at /upcoming-event/" + upcomingEvent.slug
            });

            // Navigate to the upcoming event page
            navigate('/upcoming-event/' + upcomingEvent.slug);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDateSelect = (key: 'startDate' | 'endDate', date: Date | undefined) => {
        setFormData({ ...formData, [key]: date ? format(date, "yyyy-MM-dd") : "" });
    };

    return (
        <>
            {showCollaborationSelector ? (
                // Step 0: Collaboration Type Selection
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <div className="max-w-4xl w-full">
                        <Button
                            variant="ghost"
                            className="gap-2 mb-8"
                            onClick={() => navigate('/admin/events')}
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
                        </Button>

                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-bold mb-3">Create New Event</h1>
                            <p className="text-lg text-muted-foreground">First, let us know what kind of help you need</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Looking for Venue */}
                            <button
                                onClick={() => {
                                    setFormData({ ...formData, lookingForVenue: !formData.lookingForVenue });
                                }}
                                className={`p-8 rounded-xl border-2 transition-all hover:scale-105 ${formData.lookingForVenue
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-card hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${formData.lookingForVenue ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        }`}>
                                        <MapPin className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-lg">Looking for Venue</h3>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Get venue proposals from the community
                                    </p>
                                    {formData.lookingForVenue && (
                                        <div className="flex items-center gap-1 text-primary text-sm font-semibold">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Selected
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Looking for Speakers */}
                            <button
                                onClick={() => {
                                    setFormData({ ...formData, lookingForSpeakers: !formData.lookingForSpeakers });
                                }}
                                className={`p-8 rounded-xl border-2 transition-all hover:scale-105 ${formData.lookingForSpeakers
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-card hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${formData.lookingForSpeakers ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        }`}>
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-lg">Looking for Speakers</h3>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Collect speaker applications from experts
                                    </p>
                                    {formData.lookingForSpeakers && (
                                        <div className="flex items-center gap-1 text-primary text-sm font-semibold">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Selected
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Looking for Sponsors */}
                            <button
                                onClick={() => {
                                    setFormData({ ...formData, lookingForSponsors: !formData.lookingForSponsors });
                                }}
                                className={`p-8 rounded-xl border-2 transition-all hover:scale-105 ${formData.lookingForSponsors
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-card hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${formData.lookingForSponsors ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        }`}>
                                        <Handshake className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-lg">Looking for Sponsors</h3>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Receive sponsorship proposals from companies
                                    </p>
                                    {formData.lookingForSponsors && (
                                        <div className="flex items-center gap-1 text-primary text-sm font-semibold">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Selected
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <Button
                                size="lg"
                                onClick={() => setShowCollaborationSelector(false)}
                                className="w-full max-w-md"
                            >
                                Continue to Event Details
                                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                You can skip this step and create a regular event
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                // Main Event Creation Form
                <div className="min-h-screen bg-background">
                    <div className="border-b bg-card">
                        <div className="container mx-auto px-4 py-4">
                            <div className="flex items-center justify-between mb-6">
                                <Button variant="ghost" className="gap-2" onClick={() => navigate('/admin/events')}>
                                    <ArrowLeft className="w-4 h-4" /> To Admin Dashboard
                                </Button>
                                <h1 className="text-xl font-bold">{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
                                <div className="flex gap-2">
                                    {!isEditMode && (
                                        <Button
                                            onClick={handlePublishAsUpcoming}
                                            disabled={isSubmitting || (!formData.lookingForVenue && !formData.lookingForSpeakers && !formData.lookingForSponsors)}
                                            variant="outline"
                                            className="gap-2 border-primary text-primary hover:bg-primary/10"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                                            Publish as Upcoming
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleFinalSubmit}
                                        disabled={isSubmitting}
                                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        {isEditMode ? 'Save Changes' : 'Publish Event'}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto flex-wrap">
                                {(() => {
                                    const currentEventStatus = formData.startDate ? (new Date(formData.startDate) < new Date() ? 'past' : 'upcoming') : 'upcoming';
                                    const isPastEvent = currentEventStatus === 'past';
                                    const maxSteps = isPastEvent ? 5 : 4;

                                    return Array.from({ length: maxSteps }, (_, i) => i + 1).map((s) => (
                                        <div key={s} className="flex items-center gap-2">
                                            <button
                                                onClick={() => setStep(s as Step)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${step === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                                                    {s}
                                                </div>
                                                <span className="font-medium">
                                                    {s === 1 ? 'Details' : s === 2 ? 'Tickets' : s === 3 ? 'Speakers' : s === 4 ? 'Sponsors' : 'Gallery'}
                                                </span>
                                            </button>
                                            {s < maxSteps && <div className="w-8 h-0.5 bg-border sm:block hidden" />}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="container mx-auto px-4 py-8 max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-8">
                        <div className="space-y-8">
                            {step === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                                            <CalendarIcon className="w-5 h-5 text-primary" />
                                            <h2 className="text-lg font-semibold">Event Basic Information</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="eventName">Event Name <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="eventName"
                                                    placeholder="e.g. AWS Cloud Summit 2026"
                                                    value={formData.eventName}
                                                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                                                    className="h-11"
                                                />
                                            </div>

                                            {/* POSTER UPLOADER */}
                                            <div className="md:col-span-2 space-y-3 p-4 border-2 border-dashed rounded-lg bg-muted/20">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-2">
                                                        <ImageIcon className="w-4 h-4 text-primary" />
                                                        Event Poster <span className="text-red-500">*</span>
                                                        <span className="text-xs text-muted-foreground font-normal ml-2">(16:9 Aspect Ratio Recommended, e.g. 1920x1080)</span>
                                                    </Label>
                                                    {formData.posterUrl && (
                                                        <Button variant="ghost" size="sm" onClick={() => setFormData({ ...formData, posterUrl: "" })} className="text-destructive h-8 px-2 text-xs">
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>

                                                {!formData.posterUrl ? (
                                                    <div className="relative group cursor-pointer transition-all hover:bg-muted/50 border rounded-lg h-48 flex flex-col items-center justify-center text-muted-foreground bg-background">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                            onChange={handleImageUpload}
                                                        />
                                                        <Upload className="w-8 h-8 mb-3 opacity-50 group-hover:scale-110 transition-transform" />
                                                        <span className="text-sm font-medium">Click to upload poster image</span>
                                                        <span className="text-xs mt-1 opacity-70">PNG, JPG up to 5MB</span>
                                                    </div>
                                                ) : (
                                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm group">
                                                        <img src={formData.posterUrl} alt="Event Poster" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button variant="secondary" size="sm" className="pointer-events-none">Change Image</Button>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                onChange={handleImageUpload}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Date & Time */}
                                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/20">

                                                <div className="space-y-2 flex flex-col">
                                                    <Label className="mb-1">Start Date <span className="text-red-500">*</span></Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className={cn("pl-3 text-left font-normal h-11", !formData.startDate && "text-muted-foreground")}>
                                                                {formData.startDate ? format(new Date(formData.startDate), "PPP") : <span>Pick a date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={formData.startDate ? new Date(formData.startDate) : undefined}
                                                                onSelect={(d) => handleDateSelect('startDate', d)}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Start Time (IST) <span className="text-red-500">*</span></Label>
                                                    <Select value={formData.startTime} onValueChange={(v) => setFormData({ ...formData, startTime: v })}>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue placeholder="Select time" />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-60">
                                                            {TIME_SLOTS.map((slot) => (
                                                                <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="md:col-span-2 flex items-center space-x-2">
                                                    <Checkbox
                                                        id="isSameDay"
                                                        checked={formData.isSameDay}
                                                        onCheckedChange={(checked) => setFormData({ ...formData, isSameDay: checked as boolean })}
                                                    />
                                                    <label htmlFor="isSameDay" className="text-sm font-medium">
                                                        Same Start Date and End Date
                                                    </label>
                                                </div>

                                                {!formData.isSameDay && (
                                                    <div className="space-y-2 flex flex-col animate-in fade-in slide-in-from-top-2">
                                                        <Label className="mb-1 text-primary">End Date <span className="text-red-500">*</span></Label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" className={cn("pl-3 text-left font-normal h-11 border-primary/50 bg-primary/5", !formData.endDate && "text-muted-foreground")}>
                                                                    {formData.endDate ? format(new Date(formData.endDate), "PPP") : <span>Pick end date</span>}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={formData.endDate ? new Date(formData.endDate) : undefined}
                                                                    onSelect={(d) => handleDateSelect('endDate', d)}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <Label>End Time (IST)</Label>
                                                    <Select value={formData.endTime} onValueChange={(v) => setFormData({ ...formData, endTime: v })}>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue placeholder="Select end time" />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-60">
                                                            {TIME_SLOTS.map((slot) => (
                                                                <SelectItem key={`end-${slot.value}`} value={slot.value}>{slot.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2 md:col-span-2">
                                                    <Label>Time Zone</Label>
                                                    <Select value={formData.timezone} onValueChange={(v) => setFormData({ ...formData, timezone: v })}>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue placeholder="Select Time Zone" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {TIMEZONES.map((tz) => (
                                                                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Location Details with Map Config */}
                                            <div className="md:col-span-2 space-y-4 p-4 border rounded-lg bg-muted/10">
                                                <div className="flex items-center justify-between mb-2 pb-2 border-b">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                        <h3 className="text-sm font-semibold">Location Setup</h3>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="lookingForVenueStep1"
                                                            checked={formData.lookingForVenue}
                                                            onCheckedChange={(checked) => setFormData({ ...formData, lookingForVenue: checked as boolean })}
                                                        />
                                                        <label htmlFor="lookingForVenueStep1" className="text-sm font-medium cursor-pointer text-primary">
                                                            Looking for Venue?
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Google Maps Link {formData.lookingForVenue ? <span className="text-muted-foreground font-normal">(Optional)</span> : <span className="text-red-500">*</span>}</Label>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                value={formData.mapLink}
                                                                onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
                                                                placeholder="https://maps.google.com/..."
                                                                className="pl-9 h-10"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={handleFetchAddressFromMap}
                                                            disabled={isFetchingAddress || !formData.mapLink}
                                                            className="shrink-0"
                                                        >
                                                            {isFetchingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                                                            Fetch Address
                                                        </Button>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">Paste full Google Maps link to auto-fill address details below.</p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="state">State {formData.lookingForVenue ? <span className="text-muted-foreground font-normal">(Optional)</span> : ""}</Label>
                                                        <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                                                            <SelectTrigger id="state" className="h-10"><SelectValue placeholder="Select state" /></SelectTrigger>
                                                            <SelectContent>{INDIAN_STATES.map((state) => <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="city">City {formData.lookingForVenue ? <span className="text-muted-foreground font-normal">(Optional)</span> : <span className="text-red-500">*</span>}</Label>
                                                        <Input id="city" placeholder="e.g. Bangalore" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-10" />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor="location">Address / Venue Text {formData.lookingForVenue ? <span className="text-muted-foreground font-normal">(Optional)</span> : <span className="text-red-500">*</span>}</Label>
                                                        <Input id="location" placeholder={formData.lookingForVenue ? "TBD (looking for venue)" : "Full address (will be auto-filled from Map Link)"} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="h-10" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tech Stack & Category */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/20 md:col-span-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        id="category"
                                                        placeholder="e.g. Workshop, Hackathon, Webinar"
                                                        value={formData.category}
                                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                        className="h-11 border-input"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="techStack">Tech Stack</Label>
                                                    <Input
                                                        id="techStack"
                                                        placeholder="e.g. React, Node.js, AWS (comma separated tags)"
                                                        value={formData.techStack}
                                                        onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                                                        className="h-11 border-input"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Enter technologies separated by commas (e.g., "Python, AI, ML")
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="description">Short Description <span className="text-red-500">*</span></Label>
                                                <Input id="description" placeholder="Brief summary" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-11" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="aboutEvent">About Event (Detailed) <span className="text-red-500">*</span></Label>
                                                <Textarea id="aboutEvent" placeholder="Detailed description..." value={formData.aboutEvent} onChange={(e) => setFormData({ ...formData, aboutEvent: e.target.value })} className="min-h-[120px]" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold mb-4 pb-4 border-b">Organizer Details</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2"><Label>Name <span className="text-red-500">*</span></Label><Input value={formData.organizerName} onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })} /></div>
                                            <div className="space-y-2"><Label>Email <span className="text-red-500">*</span></Label><Input type="email" value={formData.organizerEmail} onChange={(e) => setFormData({ ...formData, organizerEmail: e.target.value })} /></div>
                                            <div className="space-y-2"><Label>Phone</Label><Input value={formData.organizerPhone} onChange={(e) => setFormData({ ...formData, organizerPhone: e.target.value })} /></div>
                                            <div className="space-y-2 md:col-span-3 pt-2">
                                                <Label>Join Community Link</Label>
                                                <div className="relative">
                                                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        value={formData.communityLink}
                                                        onChange={(e) => setFormData({ ...formData, communityLink: e.target.value })}
                                                        placeholder="WhatsApp / Telegram / Discord Invite Link"
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-4 pt-4"><Button onClick={handleSaveDetail} size="lg" className="min-w-[150px]"><Save className="mr-2 h-4 w-4" /> Save Draft</Button></div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6 pb-4 border-b"><Ticket className="w-5 h-5 text-primary" /><h2 className="text-lg font-semibold">Pricing & Tickets</h2></div>
                                        <div className="space-y-6">
                                            {formData.tickets.map((ticket, index) => (
                                                <div key={index} className="flex flex-col gap-4 p-6 border rounded-xl bg-card relative shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-semibold text-base">Ticket Tier #{index + 1}</h3>
                                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveTicket(index)} className="text-destructive hover:bg-destructive/10">
                                                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Ticket Type</Label>
                                                            <Input
                                                                value={ticket.type}
                                                                onChange={(e) => handleTicketChange(index, 'type', e.target.value)}
                                                                placeholder="e.g. VIP, General Admission"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Price</Label>
                                                            <Input
                                                                value={ticket.price}
                                                                onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
                                                                placeholder="e.g. Free, ₹499"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Description</Label>
                                                            <Input
                                                                value={ticket.description}
                                                                onChange={(e) => handleTicketChange(index, 'description', e.target.value)}
                                                                placeholder="What does this ticket include?"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Capacity (Total allowed)</Label>
                                                            <Input
                                                                type="number"
                                                                value={ticket.capacity || ""}
                                                                onChange={(e) => handleTicketChange(index, 'capacity', e.target.value ? parseInt(e.target.value) : 0)}
                                                                placeholder="Leave 0 for unlimited"
                                                            />
                                                        </div>
                                                        
                                                        <div className="md:col-span-2 space-y-2">
                                                            <Label>Benefits (Comma Separated)</Label>
                                                            <Input
                                                                value={ticket.benefits?.join(", ") || ""}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    handleTicketChange(index, 'benefits', val ? val.split(",").map(s => s.trim()) : []);
                                                                }}
                                                                placeholder="e.g. Front row seat, Complementary dinner"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <Button onClick={handleAddTicket} variant="outline" className="w-full border-dashed"><Plus className="w-4 h-4 mr-2" /> Add Ticket Tier</Button>
                                        </div>

                                        <div className="mt-8 pt-6 border-t md:w-1/2">
                                            <div className="space-y-2 flex flex-col">
                                                <Label className="mb-1">Global Registration Deadline</Label>
                                                <div className="flex gap-2">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className={cn("pl-3 text-left font-normal h-11 flex-1", !formData.registrationDeadline && "text-muted-foreground")}>
                                                                {formData.registrationDeadline ? format(new Date(formData.registrationDeadline), "PPP") : <span>Pick date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined}
                                                                    onSelect={(d) => {
                                                                        if (!d) return;
                                                                        const current = formData.registrationDeadline ? new Date(formData.registrationDeadline) : new Date();
                                                                        current.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                                                                        if (!formData.registrationDeadline) current.setHours(23, 59);
                                                                        setFormData({ ...formData, registrationDeadline: format(current, "yyyy-MM-dd'T'HH:mm") });
                                                                    }}
                                                                    initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <Select
                                                        value={formData.registrationDeadline ? format(new Date(formData.registrationDeadline), "HH:mm") : ""}
                                                        onValueChange={(v) => {
                                                            const current = formData.registrationDeadline ? new Date(formData.registrationDeadline) : new Date();
                                                            const [h, m] = v.split(':');
                                                            current.setHours(parseInt(h), parseInt(m));
                                                            setFormData({ ...formData, registrationDeadline: format(current, "yyyy-MM-dd'T'HH:mm") });
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-11 w-[140px]">
                                                            <SelectValue placeholder="Time" />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-60">
                                                            {TIME_SLOTS.map((slot) => (
                                                                <SelectItem key={`deadline-${slot.value}`} value={slot.value}>{slot.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-4 pt-4"><Button onClick={handleSaveTickets} size="lg"><Save className="mr-2 h-4 w-4" /> Save Draft</Button></div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-primary" />
                                                <h2 className="text-lg font-semibold">Speakers</h2>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="lookingForSpeakersStep3"
                                                    checked={formData.lookingForSpeakers}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, lookingForSpeakers: checked as boolean })}
                                                />
                                                <label htmlFor="lookingForSpeakersStep3" className="text-sm font-medium cursor-pointer text-primary">
                                                    Looking for Speakers?
                                                </label>
                                            </div>
                                        </div>

                                        {/* Speaker List */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            {formData.speakers.map((speaker, index) => (
                                                <div key={speaker.id} className="border rounded-lg p-4 flex gap-4 bg-muted/20 relative group">
                                                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden shrink-0">
                                                        {speaker.profileImage ? (
                                                            <img src={speaker.profileImage} alt={speaker.fullName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users className="w-full h-full p-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold truncate">{speaker.fullName}</h4>
                                                        <p className="text-xs text-muted-foreground truncate">{speaker.companyName}</p>
                                                        {speaker.sessionName && <p className="text-xs font-medium text-primary mt-1 truncate">Talk: {speaker.sessionName}</p>}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newSpeakers = [...formData.speakers];
                                                            newSpeakers.splice(index, 1);
                                                            setFormData({ ...formData, speakers: newSpeakers });
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Speaker Dialog */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full border-dashed py-8"><Plus className="w-4 h-4 mr-2" /> Add Speaker Manually</Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Add Speaker</DialogTitle>
                                                </DialogHeader>
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        const form = e.target as HTMLFormElement;
                                                        const data = new FormData(form);

                                                        // Handle topics splitting
                                                        const topicsStr = data.get('sessionTopics') as string;
                                                        const sessionTopics = topicsStr ? topicsStr.split(',').map(t => t.trim()) : [];

                                                        const newSpeaker: EventSpeaker = {
                                                            id: crypto.randomUUID(),
                                                            fullName: data.get('fullName') as string,
                                                            email: data.get('email') as string,
                                                            linkedinUrl: data.get('linkedinUrl') as string,
                                                            companyName: data.get('companyName') as string,
                                                            about: data.get('about') as string,
                                                            country: data.get('country') as string,
                                                            phone: data.get('phone') as string,
                                                            state: data.get('state') as string,
                                                            city: data.get('city') as string,
                                                            sessionName: data.get('sessionName') as string,
                                                            sessionDescription: data.get('sessionDescription') as string,
                                                            sessionTopics: sessionTopics,
                                                            sessionStartTime: data.get('sessionStartTime') as string,
                                                            sessionEndTime: data.get('sessionEndTime') as string,
                                                            // For simplicity in this demo, defaulting or handling image separately would be better
                                                            // But we can add a simple placeholder or handle file upload state separately if robust
                                                            profileImage: ""
                                                        };

                                                        // Handle file upload manually if needed, or just skip for now to keep it simple
                                                        // For a real app, we'd need a separate state for the dialog form to handle image preview/upload

                                                        setFormData({
                                                            ...formData,
                                                            speakers: [...formData.speakers, newSpeaker]
                                                        });

                                                        // Close dialog (hacky way: click the close button or manage open state)
                                                        // Using a ref to the close trigger or managing state is better, 
                                                        // but for this snippet we'll just rely on the user closing or add a ref later.
                                                        // Better UX: Add a state for `isAddSpeakerOpen`
                                                        toast({ title: "Speaker Added", description: `${newSpeaker.fullName} added successfully.` });
                                                    }}
                                                    className="space-y-6 py-4"
                                                >
                                                    {/* Personal Details */}
                                                    <div className="space-y-4">
                                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase">Personal Information</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="sp-fullname">Full Name *</Label>
                                                                <Input id="sp-fullname" name="fullName" required placeholder="John Doe" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="sp-email">Email</Label>
                                                                <Input id="sp-email" name="email" type="email" placeholder="john@company.com" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="sp-phone">Phone</Label>
                                                                <Input id="sp-phone" name="phone" placeholder="+91 9999999999" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="sp-linkedin">LinkedIn URL</Label>
                                                                <Input id="sp-linkedin" name="linkedinUrl" placeholder="https://linkedin.com/in/..." />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="sp-company">Company Name</Label>
                                                                <Input id="sp-company" name="companyName" placeholder="Acme Corp" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="sp-country">Country</Label>
                                                                <Input id="sp-country" name="country" placeholder="India" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="sp-state">State</Label>
                                                                <Input id="sp-state" name="state" placeholder="Karnataka" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="sp-city">City</Label>
                                                                <Input id="sp-city" name="city" placeholder="Bangalore" />
                                                            </div>
                                                            <div className="col-span-2 space-y-2">
                                                                <Label htmlFor="sp-about">About Speaker (Short Bio) *</Label>
                                                                <Textarea id="sp-about" name="about" required placeholder="Brief professional summary..." />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Session Details */}
                                                    <div className="space-y-4 pt-4 border-t">
                                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase">Session Details</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="col-span-2 space-y-2">
                                                                <Label htmlFor="sp-session-name">Session Name</Label>
                                                                <Input id="sp-session-name" name="sessionName" placeholder="The Future of Cloud Computing" />
                                                            </div>
                                                            <div className="col-span-2 space-y-2">
                                                                <Label htmlFor="sp-session-desc">Session Description</Label>
                                                                <Textarea id="sp-session-desc" name="sessionDescription" placeholder="What will the audience learn?" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="sp-topics">Topics (comma separated)</Label>
                                                                <Input id="sp-topics" name="sessionTopics" placeholder="Cloud, AI, DevOps" />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="sp-start">Start Time</Label>
                                                                    <Select name="sessionStartTime">
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select time" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="max-h-60">
                                                                            {TIME_SLOTS.map((slot) => (
                                                                                <SelectItem key={`start-${slot.value}`} value={slot.value}>{slot.label}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="sp-end">End Time</Label>
                                                                    <Select name="sessionEndTime">
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select time" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="max-h-60">
                                                                            {TIME_SLOTS.map((slot) => (
                                                                                <SelectItem key={`end-${slot.value}`} value={slot.value}>{slot.label}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <DialogFooter>
                                                        <Button type="submit">Add Speaker</Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                    </div>
                                    <div className="flex justify-end gap-4 pt-4"><Button onClick={handleSaveSpeakers} size="lg"><Save className="mr-2 h-4 w-4" /> Save Draft</Button></div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6 pb-4 border-b"><Handshake className="w-5 h-5 text-primary" /><h2 className="text-lg font-semibold">Sponsors</h2></div>

                                        <div className="flex items-center space-x-2 mb-6 p-4 bg-muted/30 rounded-lg">
                                            <Checkbox
                                                id="noSponsors"
                                                checked={formData.noSponsorsRequired}
                                                onCheckedChange={(checked) => setFormData({ ...formData, noSponsorsRequired: checked as boolean })}
                                            />
                                            <label htmlFor="noSponsors" className="text-sm font-medium cursor-pointer">
                                                No sponsors needed for this event
                                            </label>
                                        </div>

                                        {!formData.noSponsorsRequired && (
                                            <div className="space-y-6">
                                                {formData.sponsors.map((sponsor, index) => (
                                                    <div key={index} className="flex flex-col gap-4 p-6 border rounded-xl bg-card relative shadow-sm">
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="font-semibold text-base">Sponsor #{index + 1}</h3>
                                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveSponsor(index)} className="text-destructive hover:bg-destructive/10">
                                                                <Trash2 className="w-4 h-4 mr-2" /> Remove
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <Label>Sponsor Name</Label>
                                                                <Input
                                                                    value={sponsor.name}
                                                                    onChange={(e) => handleSponsorChange(index, 'name', e.target.value)}
                                                                    placeholder="Company Name"
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label>Tier</Label>
                                                                <Select value={sponsor.tier} onValueChange={(v) => handleSponsorChange(index, 'tier', v)}>
                                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Platinum">Platinum</SelectItem>
                                                                        <SelectItem value="Gold">Gold</SelectItem>
                                                                        <SelectItem value="Silver">Silver</SelectItem>
                                                                        <SelectItem value="Bronze">Bronze</SelectItem>
                                                                        <SelectItem value="Partner">Partner</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label>Website</Label>
                                                                <Input
                                                                    value={sponsor.website}
                                                                    onChange={(e) => handleSponsorChange(index, 'website', e.target.value)}
                                                                    placeholder="https://company.com"
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label>Logo</Label>
                                                                <div className="flex flex-col gap-3">
                                                                    {sponsor.logo && (
                                                                        <div className="relative w-full h-32 border rounded-lg bg-muted flex items-center justify-center overflow-hidden p-2">
                                                                            <img src={sponsor.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="relative overflow-hidden shrink-0">
                                                                            <Button variant="outline" type="button" className="gap-2 pointer-events-none">
                                                                                <Upload className="w-4 h-4" /> Upload Logo
                                                                            </Button>
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                onChange={(e) => handleSponsorLogoUpload(index, e)}
                                                                            />
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground font-medium px-2">OR</div>
                                                                        <Input
                                                                            value={sponsor.logo}
                                                                            onChange={(e) => handleSponsorChange(index, 'logo', e.target.value)}
                                                                            placeholder="Paste Image URL..."
                                                                            className="flex-1"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                <Button onClick={handleAddSponsor} variant="outline" className="w-full border-dashed"><Plus className="w-4 h-4 mr-2" /> Add Sponsor</Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Collaboration Needs */}
                                    <div className="bg-card border rounded-xl p-6 shadow-sm mt-6">
                                        <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                                            <Users className="w-5 h-5 text-primary" />
                                            <h2 className="text-lg font-semibold">Need Community Help?</h2>
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-4">
                                            Looking for community support? Check the boxes below to publish this as an "upcoming event" and collect proposals from the community.
                                        </p>

                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                                                <Checkbox
                                                    id="lookingForVenue"
                                                    checked={formData.lookingForVenue}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, lookingForVenue: checked as boolean })}
                                                />
                                                <label htmlFor="lookingForVenue" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    Looking for Venue
                                                </label>
                                            </div>

                                            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                                                <Checkbox
                                                    id="lookingForSpeakers"
                                                    checked={formData.lookingForSpeakers}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, lookingForSpeakers: checked as boolean })}
                                                />
                                                <label htmlFor="lookingForSpeakers" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    Looking for Speakers
                                                </label>
                                            </div>

                                            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                                                <Checkbox
                                                    id="lookingForSponsorsHelp"
                                                    checked={formData.lookingForSponsors}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, lookingForSponsors: checked as boolean })}
                                                />
                                                <label htmlFor="lookingForSponsorsHelp" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                                    <Handshake className="w-4 h-4" />
                                                    Looking for Sponsors
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-4"><Button onClick={handleSaveSponsors} size="lg"><Save className="mr-2 h-4 w-4" /> Save Draft</Button></div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon className="w-5 h-5 text-primary" />
                                                <h2 className="text-lg font-semibold">Event Gallery</h2>
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button className="gap-2">
                                                        <Plus className="w-4 h-4" /> Create Album
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Create Gallery Album</DialogTitle>
                                                    </DialogHeader>
                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            const formEl = e.target as HTMLFormElement;
                                                            const albumName = (formEl.elements.namedItem('albumName') as HTMLInputElement).value;
                                                            const filesInput = formEl.elements.namedItem('files') as HTMLInputElement;

                                                            if (!filesInput.files || filesInput.files.length === 0) {
                                                                toast({ title: "No Files", description: "Please select at least one file to upload.", variant: "destructive" });
                                                                return;
                                                            }

                                                            // Create new album
                                                            const newAlbum: GalleryAlbum = {
                                                                id: crypto.randomUUID(),
                                                                name: albumName,
                                                                media: [],
                                                                createdAt: new Date().toISOString()
                                                            };

                                                            // Process files and create media items
                                                            const files = Array.from(filesInput.files);
                                                            let processedCount = 0;

                                                            files.forEach((file) => {
                                                                const reader = new FileReader();
                                                                reader.onload = (evt) => {
                                                                    const mediaItem: GalleryMedia = {
                                                                        id: crypto.randomUUID(),
                                                                        type: file.type.startsWith('video/') ? 'video' : 'photo',
                                                                        url: evt.target?.result as string,
                                                                        uploadedAt: new Date().toISOString()
                                                                    };
                                                                    newAlbum.media.push(mediaItem);
                                                                    processedCount++;

                                                                    if (processedCount === files.length) {
                                                                        setFormData({
                                                                            ...formData,
                                                                            gallery: [...formData.gallery, newAlbum]
                                                                        });
                                                                        toast({ title: "Album Created", description: `${albumName} created with ${files.length} items.` });
                                                                    }
                                                                };
                                                                reader.readAsDataURL(file);
                                                            });
                                                        }}
                                                        className="space-y-4"
                                                    >
                                                        <div className="space-y-2">
                                                            <Label htmlFor="albumName">Album Name *</Label>
                                                            <Input name="albumName" required placeholder="Opening Ceremony" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="files">Upload Photos/Videos *</Label>
                                                            <Input name="files" type="file" accept="image/*,video/*" multiple required />
                                                            <p className="text-xs text-muted-foreground">Select multiple files (photos and videos)</p>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button type="submit">Create Album</Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        {/* Album List */}
                                        {formData.gallery.length === 0 ? (
                                            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
                                                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                                <h3 className="text-lg font-medium mb-2">No Albums Yet</h3>
                                                <p className="text-sm text-muted-foreground mb-4">Create your first album to showcase event photos and videos</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {formData.gallery.map((album, albumIndex) => (
                                                    <div key={album.id} className="border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow group">
                                                        {/* Album Thumbnail Grid */}
                                                        <div className="aspect-video bg-muted relative overflow-hidden">
                                                            {album.media.length > 0 ? (
                                                                <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-full">
                                                                    {album.media.slice(0, 4).map((media, idx) => (
                                                                        <div key={media.id} className="relative bg-muted">
                                                                            {media.type === 'photo' ? (
                                                                                <img src={media.url} alt="" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center bg-black/80">
                                                                                    <Upload className="w-6 h-6 text-white/60" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    const newGallery = [...formData.gallery];
                                                                    newGallery.splice(albumIndex, 1);
                                                                    setFormData({ ...formData, gallery: newGallery });
                                                                    toast({ title: "Album Deleted", description: `${album.name} has been removed.` });
                                                                }}
                                                                className="absolute top-2 right-2 p-2 bg-destructive/90 text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="p-4">
                                                            <h4 className="font-semibold mb-1">{album.name}</h4>
                                                            <p className="text-xs text-muted-foreground">{album.media.length} {album.media.length === 1 ? 'item' : 'items'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-4 pt-4">
                                        <Button onClick={() => {
                                            toast({ title: "Gallery Saved", description: "Gallery albums saved successfully." });
                                        }} size="lg">
                                            <Save className="mr-2 h-4 w-4" /> Save Gallery
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="hidden lg:block space-y-6">
                            <div className="bg-card border rounded-xl p-6 shadow-sm sticky top-8">
                                <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Preview</h3><span className="text-[10px] font-bold uppercase tracking-widest bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200">Draft</span></div>
                                <div className="bg-background rounded-lg border overflow-hidden">
                                    <div className="aspect-video bg-muted relative flex items-center justify-center">
                                        {/* IMAGE PREVIEW */}
                                        {formData.posterUrl ? (
                                            <img src={formData.posterUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-muted-foreground/50" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4"><div className="text-white"><div className="text-xs font-bold bg-primary px-2 py-0.5 rounded inline-block mb-2">{formData.pricingType === 'paid' ? `₹${formData.price || '0'}` : 'FREE'}</div></div></div>
                                            </>
                                        )}
                                        {formData.posterUrl && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4"><div className="text-white"><div className="text-xs font-bold bg-primary px-2 py-0.5 rounded inline-block mb-2">{formData.pricingType === 'paid' ? `₹${formData.price || '0'}` : 'FREE'}</div></div></div>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <h4 className="font-bold line-clamp-1">{formData.eventName || "Event Name"}</h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarIcon className="w-3 h-3" /><span>{formData.startDate ? format(new Date(formData.startDate), "PPP") : "Date"}{!formData.isSameDay && formData.endDate && ` - ${format(new Date(formData.endDate), "PPP")}`}</span></div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /><span>{TIME_SLOTS.find(t => t.value === formData.startTime)?.label || "--:--"}{formData.endTime ? ` - ${TIME_SLOTS.find(t => t.value === formData.endTime)?.label}` : ""}</span></div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3 h-3" /><span>{formData.city || "City"}</span></div>
                                    </div>
                                    {!formData.noSponsorsRequired && formData.sponsors.length > 0 && (
                                        <div className="p-4 border-t bg-muted/5">
                                            <h5 className="text-xs font-semibold text-muted-foreground mb-2">Sponsors</h5>
                                            <div className="flex gap-2 flex-wrap">
                                                {formData.sponsors.map((s, i) => (
                                                    <div key={i} className="text-[10px] bg-background border px-2 py-1 rounded shadow-sm">{s.name || "Sponsor"}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            )
            }
        </>
    );
}
