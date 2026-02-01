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
import { useToast } from "@/hooks/use-toast";
import { saveEvent, Event, Sponsor } from "@/lib/events-store";

type Step = 1 | 2 | 3 | 4;

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
    const [step, setStep] = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);
    const locationState = useLocation();
    const [eventId, setEventId] = useState<string>(() => crypto.randomUUID());

    useEffect(() => {
        if (locationState.state && locationState.state.event) {
            const editEvent = locationState.state.event as Event;
            setEventId(editEvent.id);

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
                organizerName: editEvent.organizer?.name || "",
                organizerEmail: editEvent.organizer?.email || "",
                organizerPhone: editEvent.organizer?.phone || "",
                noSponsorsRequired: !editEvent.sponsors || editEvent.sponsors.length === 0,
                sponsors: editEvent.sponsors || []
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
        organizerName: "Yatri Cloud",
        organizerEmail: "events@yatricloud.com",
        organizerPhone: "+91 9724823602",

        noSponsorsRequired: true,
        sponsors: [] as Sponsor[]
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
        return {
            id: eventId,
            name: formData.eventName || "Untitled Event",
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
            category: "Workshop",
            status: status,
            price: formData.pricingType === 'paid' ? formData.price : 'Free',
            // Ticket Info
            seatsAvailable: formData.capacity ? parseInt(formData.capacity) : undefined,
            registrationDeadline: formData.registrationDeadline,
            communityLink: formData.communityLink,

            organizer: {
                name: formData.organizerName,
                email: formData.organizerEmail,
                phone: formData.organizerPhone
            },
            sponsors: formData.noSponsorsRequired ? [] : formData.sponsors
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
                sponsors: formData.noSponsorsRequired ? [] : formData.sponsors
            };

            const result = await createEventStructure(eventDataPayload);

            if (result.success) {
                const publishedEvent = constructEventObject('upcoming');
                saveEvent(publishedEvent);
                toast({ title: "Event Published!", description: "Event is now live on the public events page." });
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

    const handleDateSelect = (key: 'startDate' | 'endDate', date: Date | undefined) => {
        setFormData({ ...formData, [key]: date ? format(date, "yyyy-MM-dd") : "" });
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="ghost" className="gap-2" onClick={() => navigate('/admin/events')}>
                            <ArrowLeft className="w-4 h-4" /> To Admin Dashboard
                        </Button>
                        <h1 className="text-xl font-bold">Create New Event</h1>
                        <Button
                            onClick={handleFinalSubmit}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Publish Event
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto flex-wrap">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <button
                                    onClick={() => setStep(s as Step)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${step === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                                        {s}
                                    </div>
                                    <span className="font-medium">
                                        {s === 1 ? 'Details' : s === 2 ? 'Tickets' : s === 3 ? 'Speakers' : 'Sponsors'}
                                    </span>
                                </button>
                                {s < 4 && <div className="w-8 h-0.5 bg-border sm:block hidden" />}
                            </div>
                        ))}
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
                                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                                                            disabled={(date) => !!formData.startDate && date < new Date(formData.startDate)}
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
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <h3 className="text-sm font-semibold">Location Setup</h3>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Google Maps Link <span className="text-red-500">*</span></Label>
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
                                                <Label htmlFor="state">State</Label>
                                                <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                                                    <SelectTrigger id="state" className="h-10"><SelectValue placeholder="Select state" /></SelectTrigger>
                                                    <SelectContent>{INDIAN_STATES.map((state) => <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                                                <Input id="city" placeholder="e.g. Bangalore" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-10" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="location">Address / Venue Text <span className="text-red-500">*</span></Label>
                                                <Input id="location" placeholder="Full address (will be auto-filled from Map Link)" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="h-10" />
                                            </div>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Pricing Type</Label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors w-full"><input type="radio" name="pricingType" checked={formData.pricingType === 'free'} onChange={() => setFormData({ ...formData, pricingType: 'free' })} className="w-4 h-4 text-primary" /><span className="font-medium">Free Event</span></label>
                                            <label className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors w-full"><input type="radio" name="pricingType" checked={formData.pricingType === 'paid'} onChange={() => setFormData({ ...formData, pricingType: 'paid' })} className="w-4 h-4 text-primary" /><span className="font-medium">Paid Ticket</span></label>
                                        </div>
                                    </div>
                                    {formData.pricingType === 'paid' && (<div className="space-y-2"><Label htmlFor="price">Price (INR)</Label><Input id="price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="h-11" /></div>)}
                                    <div className="space-y-2"><Label htmlFor="capacity">Capacity</Label><Input id="capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="h-11" /></div>
                                    <div className="space-y-2 flex flex-col">
                                        <Label className="mb-1">Registration Deadline</Label>
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
                                                            // Default to 23:59 if no time set
                                                            if (!formData.registrationDeadline) current.setHours(23, 59);
                                                            setFormData({ ...formData, registrationDeadline: format(current, "yyyy-MM-dd'T'HH:mm") });
                                                        }}
                                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b"><Users className="w-5 h-5 text-primary" /><h2 className="text-lg font-semibold">Speakers</h2></div>
                                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/50">
                                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" /><h3 className="text-lg font-medium mb-2">No Speakers Added</h3><Button variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Add Speaker</Button>
                                </div>
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
                            <div className="flex justify-end gap-4 pt-4"><Button onClick={handleSaveSponsors} size="lg"><Save className="mr-2 h-4 w-4" /> Save Draft</Button></div>
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
        </div>
    );
}
