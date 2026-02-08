
import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, Control } from "react-hook-form";
import { Loader2, FolderPlus, User, Clock, BookOpen, Layers, CheckCircle, ChevronRight, ChevronLeft, Trash2, Plus, FileText, Video, ClipboardList, Save, Upload, Download, MapPin, Users, Ticket, CreditCard, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Lesson {
    title: string;
    type: "Video" | "Reading" | "Assignment" | "Quiz";
    duration: string;
}

interface Module {
    title: string;
    lessons: Lesson[];
}

interface TrainingForm {
    type: string;
    subType: string; // Provider Name
    courseName: string; // Exam Name
    description?: string;
    instructor: string;
    level: string;
    duration: string;
    skills: string;
    outcomes: string;
    curriculum: Module[];
    // Advanced
    mode: "Online" | "On-site";
    venueName?: string;
    venueAddress?: string;
    venueMapLink?: string;
    capacityType: "Unlimited" | "Limited";
    capacityCount?: string;
    paymentType: string;
    price?: string;
    currency?: string;
    couponCode?: string;
    startDate?: Date;
    startTime?: string;
}

// Time slots for dropdown
const TIME_SLOTS = Array.from({ length: 96 }).map((_, i) => {
    const hour = Math.floor(i / 4).toString().padStart(2, '0');
    const minute = ((i % 4) * 15).toString().padStart(2, '0');
    return `${hour}:${minute}`;
});

interface ProviderData {
    name: string;
    exams: string[];
}

const TYPES = ["Certification", "Role-based"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Mixed"];
const LESSON_TYPES = ["Video", "Reading", "Assignment", "Quiz"];

const STEPS = ["Identity", "Details", "Logistics", "Curriculum", "Review"];

export default function TrainingManager() {
    const [activeTab, setActiveTab] = useState("Identity");
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [providers, setProviders] = useState<ProviderData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [thumbnailBase64, setThumbnailBase64] = useState<string>("");
    const [thumbnailMimeType, setThumbnailMimeType] = useState<string>("");
    const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

    const SCRIPT_URL = import.meta.env.VITE_TRAINING_SCRIPT_URL || import.meta.env.VITE_EVENT_FEEDBACK_SCRIPT_URL;

    const { register, control, handleSubmit, setValue, watch, reset, trigger } = useForm<TrainingForm>({
        defaultValues: {
            level: "Beginner",
            curriculum: [{ title: "Introduction", lessons: [{ title: "Welcome", type: "Video", duration: "5 mins" }] }],
            mode: "Online",
            capacityType: "Unlimited",
            paymentType: "Free",
            currency: "USD"
        }
    });

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setThumbnailPreview(base64String);
                // Split metadata from base64 content
                const matches = base64String.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    setThumbnailMimeType(matches[1]);
                    setThumbnailBase64(matches[2]);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const generateCoupon = () => {
        const providerName = watch("subType") || "GENERIC";
        // Clean provider name for code (remove spaces, special chars)
        const cleanProvider = providerName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 10);
        const randomNum = Math.floor(100 + Math.random() * 900); // 3 digit random
        const code = `CERT-${cleanProvider}-YATRI-${randomNum}`;
        setValue("couponCode", code);
        toast.success("Coupon Generated: " + code);
    };

    const selectedType = watch("type");
    const selectedProvider = watch("subType"); // Provider
    const curriculum = watch("curriculum");

    // Fetch Providers on Mount
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'getProviders' })
                });
                const result = await response.json();
                if (result.success) {
                    setProviders(result.providers);
                }
            } catch (e) {
                console.error("Failed to fetch providers", e);
            }
        };
        fetchProviders();
    }, []);

    // Helper to get exams for selected provider
    const getExams = () => {
        const p = providers.find(p => p.name === selectedProvider);
        return p ? p.exams : [];
    };

    const onSubmit = async (data: TrainingForm, status: 'Draft' | 'Published') => {
        if (status === 'Draft') setIsSavingDraft(true);
        else setIsLoading(true);

        try {
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "createTraining",
                    ...data,
                    startDate: data.startDate ? format(data.startDate, "yyyy-MM-dd") : "",
                    modulesCount: data.curriculum.length,
                    status: status,
                    thumbnailBase64: thumbnailBase64,
                    thumbnailMimeType: thumbnailMimeType
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                if (status === 'Published') {
                    reset();
                    setThumbnailBase64("");
                    setThumbnailPreview("");
                    setActiveTab("Identity");
                }
            } else {
                toast.error("Failed: " + result.error);
            }
        } catch (error) {
            console.error("Training creation error", error);
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
            setIsSavingDraft(false);
        }
    };

    // --- MD Import/Export Logic ---

    const downloadTemplate = () => {
        const template = `# Module 1: Introduction
- Video: Welcome to the Course (5 mins)
- Reading: Getting Started Guide (10 mins)

# Module 2: Core Concepts
- Video: What is Cloud Computing? (15 mins)
- Quiz: Knowledge Check (10 mins)
- Assignment: Create your first VM (30 mins)
`;
        const blob = new Blob([template], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "curriculum_template.md";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.info("Template downloaded!");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            parseAndSetCurriculum(text);
        };
        reader.readAsText(file);

        // Reset input
        e.target.value = '';
    };

    const parseAndSetCurriculum = (text: string) => {
        const lines = text.split('\n');
        const newCurriculum: Module[] = [];
        let currentModule: Module | null = null;

        const typeMap: Record<string, "Video" | "Reading" | "Assignment" | "Quiz"> = {
            "Video": "Video", "Reading": "Reading", "Assignment": "Assignment", "Quiz": "Quiz"
        };

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.startsWith('#')) {
                // New Module
                if (currentModule) newCurriculum.push(currentModule);
                const title = trimmed.replace(/^#+\s*(Module\s*\d*:?)?\s*/i, '').trim(); // Remove leading # and optional "Module X:" prefix
                currentModule = { title, lessons: [] };
            } else if (trimmed.startsWith('-') && currentModule) {
                // Lesson
                // Format: "- Type: Title (Duration)"
                const content = trimmed.substring(1).trim();
                const parts = content.split(':');

                let type: "Video" | "Reading" | "Assignment" | "Quiz" = "Video"; // Default
                let title = content;
                let duration = "";

                if (parts.length > 1) {
                    const potentialType = parts[0].trim();
                    if (typeMap[potentialType]) {
                        type = typeMap[potentialType];
                        title = parts.slice(1).join(':').trim();
                    }
                }

                // Extract duration if in parens at end
                const durationMatch = title.match(/\((.*?)\)$/);
                if (durationMatch) {
                    duration = durationMatch[1];
                    title = title.replace(/\s*\(.*?\)$/, '').trim();
                }

                currentModule.lessons.push({ title, type, duration });
            }
        });

        if (currentModule) newCurriculum.push(currentModule);

        if (newCurriculum.length > 0) {
            setValue("curriculum", newCurriculum);
            toast.success(`Imported ${newCurriculum.length} modules!`);
        } else {
            toast.error("Could not parse curriculum. Check format.");
        }
    };

    return (
        <Card className="w-full max-w-6xl mx-auto shadow-lg border-t-4 border-t-primary">
            <CardHeader className="bg-muted/10 pb-6 border-b flex flex-row justify-between items-center">
                <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <FolderPlus className="w-7 h-7 text-primary" />
                        Curriculum Builder
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">Design your course structure.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSubmit((d) => onSubmit(d, 'Draft'))} disabled={isSavingDraft || isLoading}>
                        {isSavingDraft ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Draft
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-6 min-h-[500px] flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 mb-8">
                        {STEPS.map((step) => (
                            <TabsTrigger key={step} value={step}>{step}</TabsTrigger>
                        ))}
                    </TabsList>

                    <form id="training-form" onSubmit={handleSubmit((d) => onSubmit(d, 'Published'))} className="space-y-8 flex-1 flex flex-col">

                        {/* STEP 1: IDENTITY */}
                        <TabsContent value="Identity" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Training Type */}
                                <div className="space-y-2">
                                    <Label>Training Type</Label>
                                    <Select onValueChange={(v) => setValue("type", v)} defaultValue={watch("type")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedType && (
                                    <div className="space-y-2">
                                        <Label>{selectedType === "Certification" ? "Provider Name" : "Role Name"}</Label>
                                        {selectedType === "Certification" ? (
                                            <Select onValueChange={(val) => setValue("subType", val)} value={watch("subType")}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Provider" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {providers.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                {...register("subType")}
                                                placeholder="e.g. DevOps Engineer"
                                            />
                                        )}
                                    </div>
                                )}

                                {selectedType && (
                                    <div className="space-y-2">
                                        <Label>Course / Exam Name</Label>
                                        {selectedType === "Certification" && selectedProvider ? (
                                            <Select onValueChange={(val) => setValue("courseName", val)} value={watch("courseName")}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Exam" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {getExams().map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                {...register("courseName")}
                                                placeholder="e.g. AZ-900"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Brief Description</Label>
                                <Textarea {...register("description")} placeholder="Course overview..." rows={3} />
                            </div>

                            <div className="space-y-2">
                                <Label>Course Thumbnail (16:9)</Label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-40 h-24 bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                                        {thumbnailPreview ? (
                                            <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No image</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleThumbnailChange}
                                            className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Recommended size: 1280x720px.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 mt-auto">
                                <Button type="button" onClick={() => setActiveTab("Details")}>Next <ChevronRight className="ml-2 w-4 h-4" /></Button>
                            </div>
                        </TabsContent>

                        {/* STEP 2: DETAILS */}
                        <TabsContent value="Details" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1"><User className="w-3 h-3" /> Instructor Name</Label>
                                    <Input {...register("instructor")} placeholder="e.g. John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1"><Clock className="w-3 h-3" /> Total Duration</Label>
                                    <Input {...register("duration")} placeholder="e.g. 5 hours" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Level</Label>
                                    <Select onValueChange={(val) => setValue("level", val)} value={watch("level")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Skills Gained (Comma separated)</Label>
                                <Input {...register("skills")} placeholder="e.g. Python, Data Analysis, SQL" />
                            </div>
                            <div className="space-y-2">
                                <Label>Learning Outcomes</Label>
                                <Textarea {...register("outcomes")} placeholder="e.g. • Write effective prompts..." rows={4} />
                            </div>
                            <div className="flex justify-between pt-4 mt-auto">
                                <Button type="button" variant="ghost" onClick={() => setActiveTab("Identity")}>Back</Button>
                                <Button type="button" onClick={() => setActiveTab("Logistics")}>Next <ChevronRight className="ml-2 w-4 h-4" /></Button>
                            </div>
                        </TabsContent>

                        {/* STEP 3: LOGISTICS */}
                        <TabsContent value="Logistics" className="space-y-6">
                            {/* Mode Section */}
                            <div className="space-y-4 border p-4 rounded-lg bg-card text-card-foreground">
                                <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Delivery Mode</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 border rounded cursor-pointer transition-all ${watch("mode") === "Online" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`} onClick={() => setValue("mode", "Online")}>
                                        <div className="font-semibold">Online</div>
                                        <div className="text-xs text-muted-foreground">Virtual delivery via LMS.</div>
                                    </div>
                                    <div className={`p-4 border rounded cursor-pointer transition-all ${watch("mode") === "On-site" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`} onClick={() => setValue("mode", "On-site")}>
                                        <div className="font-semibold">On-site</div>
                                        <div className="text-xs text-muted-foreground">Physical classroom location.</div>
                                    </div>
                                </div>

                                {watch("mode") === "Online" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-in fade-in slide-in-from-top-2 border p-4 rounded-md bg-muted/20">
                                        <div className="space-y-2">
                                            <Label>Start Date (for Google Meet)</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !watch("startDate") && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {watch("startDate") ? format(watch("startDate")!, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={watch("startDate")}
                                                        onSelect={(date) => setValue("startDate", date)}
                                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Start Time</Label>
                                            <Select onValueChange={(val) => setValue("startTime", val)} value={watch("startTime")}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Time" />
                                                </SelectTrigger>
                                                <SelectContent className="h-48">
                                                    {TIME_SLOTS.map((time) => (
                                                        <SelectItem key={time} value={time}>
                                                            {time}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1">
                                            <Video className="w-3 h-3" /> A Google Meet link will be automatically generated and sent to enrolled users.
                                        </div>
                                    </div>
                                )}

                                {watch("mode") === "On-site" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-in fade-in slide-in-from-top-2">
                                        <div><Label>Venue Name</Label><Input {...register("venueName")} placeholder="e.g. Yatri Conference Hall A" /></div>
                                        <div><Label>Google Maps Link</Label><Input {...register("venueMapLink")} placeholder="https://maps.google.com/..." /></div>
                                        <div className="md:col-span-2"><Label>Full Address</Label><Input {...register("venueAddress")} placeholder="Street, City, Zip" /></div>
                                    </div>
                                )}
                            </div>

                            {/* Capacity Section */}
                            <div className="space-y-4 border p-4 rounded-lg bg-card text-card-foreground">
                                <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Capacity</h3>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center space-x-2">
                                        <input type="radio" id="cap-unlim" value="Unlimited" {...register("capacityType")} className="accent-primary" />
                                        <label htmlFor="cap-unlim">Unlimited</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="radio" id="cap-lim" value="Limited" {...register("capacityType")} className="accent-primary" />
                                        <label htmlFor="cap-lim">Limited Slots</label>
                                    </div>
                                </div>
                                {watch("capacityType") === "Limited" && (
                                    <div className="w-full max-w-xs mt-2 animate-in fade-in">
                                        <Label>Max Attendees</Label>
                                        <Input type="number" {...register("capacityCount")} placeholder="e.g. 50" />
                                    </div>
                                )}
                            </div>

                            {/* Payment Section */}
                            <div className="space-y-4 border p-4 rounded-lg bg-card text-card-foreground">
                                <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Payment & Vouchers</h3>
                                <div className="flex gap-4 mb-4">
                                    <Button type="button" variant={watch("paymentType") === "Free" ? "default" : "outline"} onClick={() => setValue("paymentType", "Free")} className="w-32">Free</Button>
                                    <Button type="button" variant={watch("paymentType") === "Paid" ? "default" : "outline"} onClick={() => setValue("paymentType", "Paid")} className="w-32">Paid</Button>
                                </div>

                                {watch("paymentType") === "Paid" && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="flex gap-4">
                                            <div className="w-24">
                                                <Label>Currency</Label>
                                                <Input {...register("currency")} defaultValue="USD" />
                                            </div>
                                            <div className="flex-1">
                                                <Label>Price</Label>
                                                <Input type="number" {...register("price")} placeholder="99.99" />
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 p-4 rounded border border-dashed">
                                            <Label className="flex items-center gap-2"><Ticket className="w-3 h-3" /> Coupon Code Generation</Label>
                                            <div className="flex gap-2 mt-2">
                                                <Input {...register("couponCode")} placeholder="CERT-AZURE-YATRI-001" className="font-mono uppercase" />
                                                <Button type="button" variant="secondary" onClick={generateCoupon}>
                                                    <Wand2 className="w-4 h-4 mr-2" /> Auto-Generate
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Format: <code>CERT-&#123;PROVIDER&#125;-YATRI-&#123;RANDOM&#125;</code>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-4 mt-auto">
                                <Button type="button" variant="ghost" onClick={() => setActiveTab("Details")}>Back</Button>
                                <Button type="button" onClick={() => setActiveTab("Curriculum")}>Next <ChevronRight className="ml-2 w-4 h-4" /></Button>
                            </div>
                        </TabsContent>

                        {/* STEP 4: CURRICULUM */}
                        <TabsContent value="Curriculum" className="space-y-4">
                            <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                                <div>
                                    <h4 className="font-semibold text-sm">Bulk Import</h4>
                                    <p className="text-xs text-muted-foreground">Upload a Markdown file to auto-populate modules.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                                        <Download className="w-4 h-4 mr-2" /> Template
                                    </Button>
                                    <div className="relative">
                                        <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="w-4 h-4 mr-2" /> Upload MD
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".md,.txt"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                </div>
                            </div>

                            <CurriculumEditor control={control} register={register} />

                            <div className="flex justify-between pt-4 mt-auto">
                                <Button type="button" variant="ghost" onClick={() => setActiveTab("Logistics")}>Back</Button>
                                <Button type="button" onClick={() => setActiveTab("Review")}>Next <ChevronRight className="ml-2 w-4 h-4" /></Button>
                            </div>
                        </TabsContent>

                        {/* STEP 4: REVIEW */}
                        <TabsContent value="Review" className="space-y-6">
                            <div className="bg-muted p-4 rounded-lg space-y-3">
                                <h3 className="font-bold text-lg border-b pb-2">Training Summary</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="font-semibold">Type:</span> {watch("type")}</div>
                                    <div><span className="font-semibold">Type:</span> {watch("type")}</div>
                                    <div><span className="font-semibold">Sub-Type:</span> {watch("subType")}</div>
                                    <div><span className="font-semibold">Course:</span> {watch("courseName")}</div>
                                    <div><span className="font-semibold">Instructor:</span> {watch("instructor")}</div>
                                    <div><span className="font-semibold">Level:</span> {watch("level")}</div>
                                    <div><span className="font-semibold">Mode:</span> {watch("mode") === "On-site" ? `On-site (${watch("venueName")})` : "Online"}</div>
                                    <div><span className="font-semibold">Payment:</span> {watch("paymentType")} {watch("paymentType") === "Paid" && `(${watch("currency")} ${watch("price")})`}</div>
                                    {watch("couponCode") && <div className="col-span-2 text-green-600 font-mono text-xs mt-1">Coupon: {watch("couponCode")}</div>}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-3">Curriculum Preview</h3>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto border p-2 rounded">
                                    {curriculum?.map((module, i) => (
                                        <div key={i} className="border rounded p-3 bg-card">
                                            <div className="font-semibold flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-primary" />
                                                Module {i + 1}: {module.title}
                                            </div>
                                            <ul className="ml-6 mt-2 space-y-1 text-sm text-muted-foreground">
                                                {module.lessons?.map((lesson, j) => (
                                                    <li key={j} className="flex items-center gap-2">
                                                        {lesson.type === "Video" && <Video className="w-3 h-3" />}
                                                        {lesson.type === "Reading" && <FileText className="w-3 h-3" />}
                                                        {lesson.type === "Assignment" && <ClipboardList className="w-3 h-3" />}
                                                        {lesson.title} <span className="text-xs border px-1 rounded">{lesson.duration}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 mt-auto">
                                <Button type="button" variant="ghost" onClick={() => setActiveTab("Curriculum")}>Back</Button>
                                <Button type="submit" disabled={isLoading} size="lg">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Publish Live
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>
                    </form>
                </Tabs>
            </CardContent>
        </Card>
    );
}

// Sub-component for Module/Lesson editing
function CurriculumEditor({ control, register }: { control: Control<TrainingForm>, register: any }) {
    const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({
        control,
        name: "curriculum"
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Modules & Lessons</h3>
                <Button type="button" size="sm" onClick={() => appendModule({ title: "New Module", lessons: [] })} variant="secondary">
                    <Plus className="w-4 h-4 mr-2" /> Add Module
                </Button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {moduleFields.length === 0 && <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded">No modules yet. Add one or Import from Markdown.</p>}

                {moduleFields.map((field, index) => (
                    <ModuleItem key={field.id} control={control} register={register} moduleIndex={index} removeModule={removeModule} />
                ))}
            </div>
        </div>
    );
}

function ModuleItem({ control, register, moduleIndex, removeModule }: { control: Control<TrainingForm>, register: any, moduleIndex: number, removeModule: (index: number) => void }) {
    const { fields: lessonFields, append: appendLesson, remove: removeLesson } = useFieldArray({
        control,
        name: `curriculum.${moduleIndex}.lessons`
    });

    return (
        <div className="border rounded-lg p-4 bg-card shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 border-primary font-bold">
                    {moduleIndex + 1}
                </Badge>
                <div className="flex-1">
                    <Input
                        {...register(`curriculum.${moduleIndex}.title` as const)}
                        placeholder="Module Title (e.g. Introduction to AI)"
                        className="font-semibold text-lg border-none shadow-none focus-visible:ring-0 px-0 h-auto rounded-none border-b focus-visible:border-primary"
                    />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeModule(moduleIndex)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            <div className="ml-10 space-y-2">
                {lessonFields.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex gap-2 items-center">
                        <div className="grid grid-cols-12 gap-2 flex-1">
                            <div className="col-span-6">
                                <Input {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.title`)} placeholder="Lesson Title" className="h-8 text-sm" />
                            </div>
                            <div className="col-span-3">
                                <select {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.type`)} className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                    {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <Input {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.duration`)} placeholder="Dur." className="h-8 text-sm" />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeLesson(lessonIndex)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                <div className="pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => appendLesson({ title: "", type: "Video", duration: "" })} className="text-primary hover:text-primary/80 hover:bg-primary/5">
                        <Plus className="w-3 h-3 mr-1" /> Add Lesson
                    </Button>
                </div>
            </div>
        </div>
    );
}
