
import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, Control } from "react-hook-form";
import { Loader2, FolderPlus, User, Clock, BookOpen, Layers, CheckCircle, ChevronRight, Trash2, Plus, FileText, Video, ClipboardList, Save, Upload, MapPin, Users, Ticket, CreditCard } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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
import { QuizBuilder } from "@/components/trainer/QuizBuilder";
import { QuizQuestion } from "@/types/quiz";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { listProviders, listApprovedTrainers, getTrainingForEdit, createTraining, updateTraining, uploadResource, submitCourseForApproval, getCertificationOptions, listQuizzes, saveQuizForTraining, type CertificationOption } from "@/lib/training-api";

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
    certificationId?: string; // provider_certifications.id this course prepares you for
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

const STEPS = ["Identity", "Details", "Logistics", "Curriculum", "Quiz", "Resources", "Review"];

interface TrainingManagerProps {
    initialId?: string;
    initialData?: any;
    isTrainerMode?: boolean;
}

export default function TrainingManager({ initialId, initialData, isTrainerMode = false }: TrainingManagerProps = {}) {
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const editId = initialId || paramId;
    const [activeTab, setActiveTab] = useState("Identity");
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(!!editId && !initialData);
    const [providers, setProviders] = useState<ProviderData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [thumbnailBase64, setThumbnailBase64] = useState<string>("");
    const [thumbnailMimeType, setThumbnailMimeType] = useState<string>("");
    const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [resources, setResources] = useState<{ id: string; name: string; url: string; type: string; description: string }[]>([]);
    const [resourceMode, setResourceMode] = useState<'link' | 'upload'>('link');
    const [isUploading, setIsUploading] = useState(false);
    const [approvedTrainers, setApprovedTrainers] = useState<{ fullName: string; email: string; trainerId: string }[]>([]);
    const [trainerData, setTrainerData] = useState<{ fullName: string; trainerId: string } | null>(null);
    const [certOptions, setCertOptions] = useState<CertificationOption[]>([]);
    const [certProviderFilter, setCertProviderFilter] = useState<string>("all");
    const [certSearch, setCertSearch] = useState<string>("");
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');

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
    const selectedCertId = watch("certificationId");
    const selectedCert = certOptions.find(o => o.id === selectedCertId) || null;

    // When editing a course with a saved certification, preselect its provider
    // group so the picker opens on the right list.
    useEffect(() => {
        if (selectedCert) setCertProviderFilter(selectedCert.provider);
    }, [selectedCert]);

    // Distinct provider slugs present in the certification catalog, sorted.
    const certProviders = Array.from(new Set(certOptions.map(o => o.provider))).sort();

    // Certifications narrowed by the provider filter and the search box.
    const filteredCerts = certOptions.filter(o => {
        if (certProviderFilter !== "all" && o.provider !== certProviderFilter) return false;
        if (certSearch) {
            const q = certSearch.toLowerCase();
            return o.label.toLowerCase().includes(q) || o.examCode.toLowerCase().includes(q);
        }
        return true;
    });

    // Fetch Providers and Trainers on Mount
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const result = await listProviders();
                setProviders(result);
            } catch (e) {
                console.error("Failed to fetch providers", e);
            }
        };
        fetchProviders();

        const fetchCertOptions = async () => {
            try {
                const options = await getCertificationOptions();
                setCertOptions(options);
            } catch (e) {
                console.error("Failed to fetch certifications", e);
            }
        };
        fetchCertOptions();

        if (isTrainerMode) {
            const storedTrainer = localStorage.getItem("trainerData");
            if (storedTrainer) {
                const parsedData = JSON.parse(storedTrainer);
                setTrainerData(parsedData);
                setValue("instructor", parsedData.trainerId);
            } else {
                navigate("/trainer/login");
                return;
            }
        }

        // Fetch approved trainers for instructor dropdown
        const fetchTrainers = async () => {
            try {
                const trainers = await listApprovedTrainers();
                setApprovedTrainers(trainers.map((t: any) => ({
                    fullName: t.fullName,
                    email: t.email,
                    trainerId: t.trainerId
                })));
            } catch (e) {
                console.error("Failed to fetch trainers", e);
            }
        };
        fetchTrainers();
    }, []);

    // Helper to populate form data
    const populateForm = (training: any) => {
        setValue("type", training.type || "");
        setValue("subType", training.certification || training.subType || "");
        setValue("courseName", training.courseName || "");
        setValue("description", training.description || "");
        setValue("instructor", training.instructor || "");
        setValue("level", training.level || "Beginner");
        setValue("duration", training.duration || "");
        setValue("skills", training.skills || "");
        setValue("outcomes", training.outcomes || "");
        setValue("curriculum", training.curriculum || []);
        setValue("mode", training.mode || "Online");
        setValue("venueName", training.venueName || "");
        setValue("venueAddress", training.venueAddress || "");
        setValue("venueMapLink", training.venueMapLink || "");
        setValue("capacityType", training.capacityType || "Unlimited");
        setValue("capacityCount", training.capacityCount || "");
        setValue("paymentType", training.paymentType || "Free");
        setValue("price", training.price || "");
        setValue("currency", training.currency || "USD");
        setValue("couponCode", training.couponCode || "");
        setValue("certificationId", training.certificationId || "");
        setVisibility(training.visibility === "private" ? "private" : "public");
        if (training.startDate) {
            setValue("startDate", new Date(training.startDate));
        }
        setValue("startTime", training.startTime || "");

        // Set thumbnail preview if available
        if (training.thumbnail) {
            setThumbnailPreview(training.thumbnail);
        }
    };

    // Load existing training data logic
    useEffect(() => {
        if (initialData) {
            populateForm(initialData);
            setIsLoadingData(false);
        } else if (editId) {
            loadTrainingData(editId);
        }
    }, [editId, initialData]);

    const loadTrainingData = async (trainingId: string) => {
        setIsLoadingData(true);
        try {
            const training = await getTrainingForEdit(trainingId);

            if (training) {
                populateForm(training);
                // Load the saved practice quiz into the builder (best effort).
                try {
                    const quizzes = await listQuizzes(trainingId);
                    if (quizzes[0]?.questions?.length) setQuizQuestions(quizzes[0].questions);
                } catch { /* builder simply starts empty */ }
                toast.success("Training loaded successfully");
            } else {
                toast.error("Failed to load training data");
                // Don't redirect automatically on failure if instantiated via props,
                // but for now default behavior is preserved for direct route access
                if (!initialId) navigate(isTrainerMode ? "/trainer/dashboard" : "/admin/training");
            }
        } catch (error) {
            console.error("Error loading training:", error);
            toast.error("Error loading training");
            if (!initialId) navigate(isTrainerMode ? "/trainer/dashboard" : "/admin/training");
        } finally {
            setIsLoadingData(false);
        }
    };

    // Helper to get exams for selected provider
    const getExams = () => {
        const p = providers.find(p => p.name === selectedProvider);
        return p ? p.exams : [];
    };

    const onSubmit = async (data: TrainingForm, status: 'Draft' | 'Published') => {
        if (status === 'Draft') setIsSavingDraft(true);
        else setIsLoading(true);

        try {
            const isEditing = !!editId;

            // Trainers cannot publish directly. A trainer's "publish" saves the
            // course as a draft and sends it for admin review; admins publish.
            const trainerSubmitting = isTrainerMode && status === 'Published';
            const effectiveStatus: 'Draft' | 'Published' = trainerSubmitting ? 'Draft' : status;

            const payload = {
                subType: data.subType,
                courseName: data.courseName,
                description: data.description,
                instructorId: isTrainerMode ? trainerData?.trainerId : data.instructor,
                instructor: isTrainerMode
                    ? trainerData?.fullName
                    : approvedTrainers.find(t => t.trainerId === data.instructor)?.fullName || data.instructor,
                duration: data.duration,
                mode: data.mode,
                venueName: data.venueName,
                capacityType: data.capacityType,
                capacityCount: data.capacityCount,
                paymentType: data.paymentType,
                price: data.price,
                startDate: data.startDate ? format(data.startDate, "yyyy-MM-dd") : "",
                startTime: data.startTime,
                thumbnailBase64: thumbnailBase64,
                thumbnailMimeType: thumbnailMimeType,
                curriculum: data.curriculum,
                resources: resources,
                status: effectiveStatus,
                visibility: visibility,
                certificationId: data.certificationId || null,
            };

            let trainingId = editId;
            if (isEditing) {
                await updateTraining(editId!, payload);
            } else {
                trainingId = await createTraining(payload);
            }

            // Persist the practice quiz alongside the course. A quiz problem
            // never blocks the course save — the trainer just retries.
            if (trainingId) {
                try {
                    await saveQuizForTraining(trainingId, quizQuestions);
                } catch (quizError) {
                    console.error("Quiz save error", quizError);
                    toast.error("Course saved, but the quiz did not save. Open the course and save again.");
                }
            }

            if (trainerSubmitting && trainingId) {
                await submitCourseForApproval({ courseId: trainingId });
                toast.success("Sent for review. An admin will approve it to publish.");
            } else if (status === 'Published') {
                toast.success(isEditing ? "Training updated and published" : "Training published");
            } else {
                toast.success(isEditing ? "Draft updated" : "Draft saved");
            }

            if (!isEditing && status === 'Published') {
                reset();
                setThumbnailBase64("");
                setThumbnailPreview("");
                setActiveTab("Identity");
            }
            setTimeout(() => {
                navigate(isTrainerMode ? "/trainer/dashboard" : "/admin/training");
            }, 1500);
        } catch (error) {
            console.error("Training save error", error);
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
            setIsSavingDraft(false);
        }
    };

    // --- File Upload Logic ---
    const handleResourceUpload = async () => {
        const fileInput = document.getElementById('resource-file') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        const name = (document.getElementById('resource-name-upload') as HTMLInputElement).value;
        const description = (document.getElementById('resource-desc-upload') as HTMLInputElement).value;

        if (!file || !name) {
            toast.error("Please select a file and provide a name");
            return;
        }

        setIsUploading(true);
        try {
            const url = await uploadResource(file);

            let type = "Document";
            if (file.type.includes("pdf")) type = "PDF";
            else if (file.type.includes("video")) type = "Video";

            setResources([...resources, {
                id: Date.now().toString(),
                name: name,
                url: url,
                type: type,
                description: description
            }]);
            toast.success("File uploaded and added");
            // Reset fields
            if (fileInput) fileInput.value = '';
            (document.getElementById('resource-name-upload') as HTMLInputElement).value = '';
            (document.getElementById('resource-desc-upload') as HTMLInputElement).value = '';
        } catch (e: any) {
            console.error(e);
            toast.error("Upload failed: " + (e?.message || "Error uploading file"));
        } finally {
            setIsUploading(false);
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
        <Card className="w-full max-w-6xl mx-auto rounded-2xl border border-border">
            <CardHeader className="pb-6 border-b border-border flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <CardTitle className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                        {editId ? "Edit Training" : "Curriculum Builder"}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1.5">
                        {editId ? "Update your training details" : "Design your course structure."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSubmit((d) => onSubmit(d, 'Draft'))} disabled={isSavingDraft || isLoading} className="min-h-[44px] rounded-xl border border-border hover:bg-brand-50 hover:text-primary">
                        {isSavingDraft && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Draft
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-6 min-h-[500px] flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto gap-1 mb-8">
                        {STEPS.map((step) => (
                            <TabsTrigger key={step} value={step} className="rounded-lg">{step}</TabsTrigger>
                        ))}
                    </TabsList>

                    <form id="training-form" onSubmit={handleSubmit((d) => onSubmit(d, 'Published'))} className="space-y-8 flex-1 flex flex-col">

                        {/* STEP 1: IDENTITY */}
                        <TabsContent value="Identity" className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
                                <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">1</span>
                                    <div className="min-w-0">
                                        <h2 className="font-display text-lg font-semibold tracking-tight">Course Identity</h2>
                                        <p className="text-sm text-muted-foreground">Tell learners what this training is and who it's for.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Training Type */}
                                    <div>
                                        <Label className="block text-sm font-medium mb-1.5">Training Type</Label>
                                        <Select onValueChange={(v) => setValue("type", v)} defaultValue={watch("type")}>
                                            <SelectTrigger className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedType && (
                                        <div>
                                            <Label className="block text-sm font-medium mb-1.5">{selectedType === "Certification" ? "Provider Name" : "Role Name"}</Label>
                                            {selectedType === "Certification" ? (
                                                <Select onValueChange={(val) => setValue("subType", val)} value={watch("subType")}>
                                                    <SelectTrigger className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
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
                                                    className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {selectedType && (
                                        <div>
                                            <Label className="block text-sm font-medium mb-1.5">Course / Exam Name</Label>
                                            {selectedType === "Certification" && selectedProvider ? (
                                                <Select onValueChange={(val) => setValue("courseName", val)} value={watch("courseName")}>
                                                    <SelectTrigger className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
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
                                                    className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Visibility — public (listed) vs private (unlisted link) */}
                                <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-3">
                                    <div>
                                        <Label className="block text-sm font-medium">Visibility</Label>
                                        <p className="text-sm text-muted-foreground mt-0.5">Public trainings appear on the /training page. Private trainings stay off the site — you share their link to take enrollments.</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {([
                                            { value: 'public' as const, title: 'Public', desc: 'Listed on the trainings page for everyone.' },
                                            { value: 'private' as const, title: 'Private (unlisted)', desc: 'Hidden from the site. You get an unguessable link to share for enrollments.' },
                                        ]).map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setVisibility(opt.value)}
                                                aria-pressed={visibility === opt.value}
                                                className={`rounded-xl border p-3 text-left transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${visibility === opt.value ? 'border-primary bg-brand-50/60 ring-1 ring-primary' : 'border-border hover:border-brand-200 hover:bg-brand-50/40'}`}
                                            >
                                                <div className="text-sm font-semibold">{opt.title}</div>
                                                <div className="text-xs text-muted-foreground">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Prepares you for — optional certification link */}
                                <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-4">
                                    <div>
                                        <Label className="block text-sm font-medium">Prepares you for</Label>
                                        <p className="text-sm text-muted-foreground mt-0.5">Link the certification this training gets learners ready for. This is optional. Leave it empty for no certification.</p>
                                    </div>

                                    {selectedCert && (
                                        <p className="text-sm">
                                            <span className="text-muted-foreground">Selected: </span>
                                            <span className="font-medium">{selectedCert.label}{selectedCert.examCode ? ` (${selectedCert.examCode})` : ""}</span>
                                        </p>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block text-sm font-medium mb-1.5">Provider</Label>
                                            <Select value={certProviderFilter} onValueChange={setCertProviderFilter}>
                                                <SelectTrigger className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
                                                    <SelectValue placeholder="All providers" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All providers</SelectItem>
                                                    {certProviders.map(p => (
                                                        <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium mb-1.5">Search</Label>
                                            <Input
                                                value={certSearch}
                                                onChange={(e) => setCertSearch(e.target.value)}
                                                placeholder="Search by name or exam code"
                                                className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="block text-sm font-medium mb-1.5">Certification</Label>
                                        <Select
                                            value={watch("certificationId") || "none"}
                                            onValueChange={(val) => setValue("certificationId", val === "none" ? "" : val)}
                                        >
                                            <SelectTrigger className="min-h-[44px] rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
                                                <SelectValue placeholder="Select a certification" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72">
                                                <SelectItem value="none">No certification</SelectItem>
                                                {filteredCerts.map(o => (
                                                    <SelectItem key={o.id} value={o.id}>
                                                        {o.label}{o.examCode ? ` (${o.examCode})` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium mb-1.5">Brief Description</Label>
                                    <Textarea {...register("description")} placeholder="Course overview..." rows={3} className="min-h-[110px] rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium mb-1.5">Course Thumbnail (16:9)</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-40 h-24 bg-muted rounded-xl overflow-hidden border border-border flex items-center justify-center">
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
                                                className="cursor-pointer rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Recommended size: 1280x720px.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 mt-auto">
                                <Button type="button" onClick={() => setActiveTab("Details")} className="min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">Next <ChevronRight className="ml-2 w-4 h-4" /></Button>
                            </div>
                        </TabsContent>

                        {/* STEP 2: DETAILS */}
                        <TabsContent value="Details" className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
                                <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">2</span>
                                    <div className="min-w-0">
                                        <h2 className="font-display text-lg font-semibold tracking-tight">Course Details</h2>
                                        <p className="text-sm text-muted-foreground">Instructor, duration, and what learners walk away with.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5"><User className="w-3.5 h-3.5" /> Instructor Name</Label>
                                        <Select
                                            onValueChange={(val) => !isTrainerMode && setValue("instructor", val)}
                                            value={isTrainerMode && trainerData ? trainerData.trainerId : watch("instructor")}
                                            disabled={isTrainerMode}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
                                                <SelectValue placeholder="Select Instructor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isTrainerMode && trainerData ? (
                                                    <SelectItem value={trainerData.trainerId}>{trainerData.fullName}</SelectItem>
                                                ) : (
                                                    approvedTrainers.map((t) => (
                                                        <SelectItem key={t.trainerId} value={t.trainerId}>
                                                            {t.fullName}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5"><Clock className="w-3.5 h-3.5" /> Total Duration</Label>
                                        <Input {...register("duration")} placeholder="e.g. 5 hours" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium mb-1.5">Level</Label>
                                        <Select onValueChange={(val) => setValue("level", val)} value={watch("level")}>
                                            <SelectTrigger className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
                                                <SelectValue placeholder="Select Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium mb-1.5">Skills Gained (Comma separated)</Label>
                                    <Input {...register("skills")} placeholder="e.g. Python, Data Analysis, SQL" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium mb-1.5">Learning Outcomes</Label>
                                    <Textarea {...register("outcomes")} placeholder="e.g. • Write effective prompts..." rows={4} className="min-h-[110px] rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
                                </div>
                            </div>
                            <div className="flex justify-between pt-2 mt-auto">
                                <Button type="button" variant="ghost" onClick={() => setActiveTab("Identity")} className="min-h-[44px] rounded-xl hover:bg-brand-50 hover:text-primary">Back</Button>
                                <Button type="button" onClick={() => setActiveTab("Logistics")} className="min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">Next <ChevronRight className="ml-2 w-4 h-4" /></Button>
                            </div>
                        </TabsContent>

                        {/* STEP 3: LOGISTICS */}
                        <TabsContent value="Logistics" className="space-y-6">
                            {/* Mode Section */}
                            <div className="space-y-5 rounded-2xl border border-border p-6 md:p-8 bg-card text-card-foreground">
                                <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">3</span>
                                    <div className="min-w-0">
                                        <h2 className="font-display text-lg font-semibold tracking-tight">Delivery Mode</h2>
                                        <p className="text-sm text-muted-foreground">Choose how the training runs — online or on-site — and set the schedule.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 border rounded-xl cursor-pointer transition-all ${watch("mode") === "Online" ? "border-primary bg-brand-50 ring-1 ring-primary" : "border-border hover:bg-brand-50"}`} onClick={() => setValue("mode", "Online")}>
                                        <div className="font-semibold">Online</div>
                                        <div className="text-xs text-muted-foreground">Virtual delivery via LMS.</div>
                                    </div>
                                    <div className={`p-4 border rounded-xl cursor-pointer transition-all ${watch("mode") === "On-site" ? "border-primary bg-brand-50 ring-1 ring-primary" : "border-border hover:bg-brand-50"}`} onClick={() => setValue("mode", "On-site")}>
                                        <div className="font-semibold">On-site</div>
                                        <div className="text-xs text-muted-foreground">Physical classroom location.</div>
                                    </div>
                                </div>

                                {watch("mode") === "Online" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2 animate-in fade-in slide-in-from-top-2 border border-border p-5 rounded-xl bg-muted/30">
                                        <div>
                                            <Label className="block text-sm font-medium mb-1.5">Start Date (for the live session)</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full h-11 justify-start text-left font-normal rounded-xl border border-input",
                                                            !watch("startDate") && "text-muted-foreground"
                                                        )}
                                                    >
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
                                        <div>
                                            <Label className="block text-sm font-medium mb-1.5">Start Time</Label>
                                            <Select onValueChange={(val) => setValue("startTime", val)} value={watch("startTime")}>
                                                <SelectTrigger className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
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
                                            <Video className="w-3 h-3" /> A meeting link is created automatically for online trainings so enrolled students can join.
                                        </div>
                                    </div>
                                )}

                                {watch("mode") === "On-site" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2 animate-in fade-in slide-in-from-top-2">
                                        <div><Label className="block text-sm font-medium mb-1.5">Venue Name</Label><Input {...register("venueName")} placeholder="e.g. Yatri Conference Hall A" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" /></div>
                                        <div><Label className="block text-sm font-medium mb-1.5">Google Maps Link</Label><Input {...register("venueMapLink")} placeholder="https://maps.google.com/..." className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" /></div>
                                        <div className="md:col-span-2"><Label className="block text-sm font-medium mb-1.5">Full Address</Label><Input {...register("venueAddress")} placeholder="Street, City, Zip" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" /></div>
                                    </div>
                                )}
                            </div>

                            {/* Capacity Section */}
                            <div className="space-y-5 rounded-2xl border border-border p-6 md:p-8 bg-card text-card-foreground">
                                <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">3</span>
                                    <div className="min-w-0">
                                        <h2 className="font-display text-lg font-semibold tracking-tight">Capacity</h2>
                                        <p className="text-sm text-muted-foreground">Allow unlimited seats or cap the number of attendees.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center space-x-2">
                                        <input type="radio" id="cap-unlim" value="Unlimited" {...register("capacityType")} className="accent-primary h-4 w-4" />
                                        <label htmlFor="cap-unlim" className="text-sm font-medium">Unlimited</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="radio" id="cap-lim" value="Limited" {...register("capacityType")} className="accent-primary h-4 w-4" />
                                        <label htmlFor="cap-lim" className="text-sm font-medium">Limited Slots</label>
                                    </div>
                                </div>
                                {watch("capacityType") === "Limited" && (
                                    <div className="w-full max-w-xs mt-2 animate-in fade-in">
                                        <Label className="block text-sm font-medium mb-1.5">Max Attendees</Label>
                                        <Input type="number" {...register("capacityCount")} placeholder="e.g. 50" className="h-11 rounded-xl border border-input bg-background tabular-nums focus:ring-2 focus:ring-ring focus:border-primary" />
                                    </div>
                                )}
                            </div>

                            {/* Payment Section */}
                            <div className="space-y-5 rounded-2xl border border-border p-6 md:p-8 bg-card text-card-foreground">
                                <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">3</span>
                                    <div className="min-w-0">
                                        <h2 className="font-display text-lg font-semibold tracking-tight">Payment &amp; Vouchers</h2>
                                        <p className="text-sm text-muted-foreground">Set whether the course is free or paid, and generate a coupon code.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button type="button" variant={watch("paymentType") === "Free" ? "default" : "outline"} onClick={() => setValue("paymentType", "Free")} className="w-32 min-h-[44px] rounded-xl">Free</Button>
                                    <Button type="button" variant={watch("paymentType") === "Paid" ? "default" : "outline"} onClick={() => setValue("paymentType", "Paid")} className="w-32 min-h-[44px] rounded-xl">Paid</Button>
                                </div>

                                {watch("paymentType") === "Paid" && (
                                    <div className="space-y-5 animate-in fade-in">
                                        <div className="flex gap-4">
                                            <div className="w-24">
                                                <Label className="block text-sm font-medium mb-1.5">Currency</Label>
                                                <Input {...register("currency")} defaultValue="USD" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <Label className="block text-sm font-medium mb-1.5">Price</Label>
                                                <Input type="number" {...register("price")} placeholder="99.99" className="h-11 rounded-xl border border-input bg-background tabular-nums focus:ring-2 focus:ring-ring focus:border-primary" />
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 p-5 rounded-xl border border-dashed border-border">
                                            <Label className="flex items-center gap-2 text-sm font-medium mb-2"><Ticket className="w-3.5 h-3.5" /> Coupon Code Generation</Label>
                                            <div className="flex gap-2">
                                                <Input {...register("couponCode")} placeholder="CERT-AZURE-YATRI-001" className="h-11 rounded-xl border border-input bg-background font-mono uppercase focus:ring-2 focus:ring-ring focus:border-primary" />
                                                <Button type="button" variant="secondary" onClick={generateCoupon} className="min-h-[44px] rounded-xl">
                                                    Auto-Generate
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Format: <code>CERT-&#123;PROVIDER&#125;-YATRI-&#123;RANDOM&#125;</code>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-2 mt-auto">
                                <Button type="button" variant="ghost" onClick={() => setActiveTab("Details")} className="min-h-[44px] rounded-xl hover:bg-brand-50 hover:text-primary">Back</Button>
                                <Button type="button" onClick={() => setActiveTab("Curriculum")} className="min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">Next <ChevronRight className="ml-2 w-4 h-4" /></Button>
                            </div>
                        </TabsContent>

                        {/* STEP 4: CURRICULUM */}
                        <TabsContent value="Curriculum" className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center bg-muted/30 p-4 rounded-xl border border-border">
                                <div>
                                    <h4 className="font-semibold text-sm">Bulk Import</h4>
                                    <p className="text-xs text-muted-foreground">Upload a Markdown file to auto-populate modules.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="min-h-[44px] rounded-xl border border-border hover:bg-brand-50 hover:text-primary">
                                        Template
                                    </Button>
                                    <div className="relative">
                                        <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="min-h-[44px] rounded-xl">
                                            Upload MD
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

                            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                                <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">4</span>
                                    <div className="min-w-0">
                                        <h2 className="font-display text-lg font-semibold tracking-tight">Curriculum</h2>
                                        <p className="text-sm text-muted-foreground">Build your modules and lessons, or bulk-import them from Markdown.</p>
                                    </div>
                                </div>
                                <CurriculumEditor control={control} register={register} />
                            </div>

                            <div className="flex justify-between pt-2 mt-auto">
                                <Button type="button" variant="ghost" onClick={() => setActiveTab("Logistics")} className="min-h-[44px] rounded-xl hover:bg-brand-50 hover:text-primary">Back</Button>
                                <Button type="button" onClick={() => setActiveTab("Quiz")} className="min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">Next <ChevronRight className="ml-2 w-4 h-4" /></Button>
                            </div>
                        </TabsContent>

                        {/* Quiz Tab */}
                        <TabsContent value="Quiz" className="space-y-5">
                            <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">5</span>
                                <div className="min-w-0">
                                    <h2 className="font-display text-lg font-semibold tracking-tight">Training Quizzes</h2>
                                    <p className="text-sm text-muted-foreground">Create quiz questions to test students' knowledge.</p>
                                </div>
                            </div>

                            <QuizBuilder trainingId={editId || "new"} onSave={setQuizQuestions} initialQuestions={quizQuestions} />

                            <div className="flex justify-between pt-2">
                                <Button type="button" variant="outline" onClick={() => setActiveTab("Curriculum")} className="min-h-[44px] rounded-xl border border-border hover:bg-brand-50 hover:text-primary">
                                    Back
                                </Button>
                                <Button type="button" onClick={() => setActiveTab("Resources")} className="min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">
                                    Next <ChevronRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Resources Tab */}
                        <TabsContent value="Resources" className="space-y-5">
                            <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">6</span>
                                <div className="min-w-0">
                                    <h2 className="font-display text-lg font-semibold tracking-tight">Training Resources</h2>
                                    <p className="text-sm text-muted-foreground">Add downloadable resources, PDFs, and links for students.</p>
                                </div>
                            </div>

                            <Card className="rounded-2xl border border-border">
                                <CardContent className="pt-6 space-y-5">
                                    <Tabs value={resourceMode} onValueChange={(v) => setResourceMode(v as 'link' | 'upload')} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-4">
                                            <TabsTrigger value="link" className="rounded-lg">External Link</TabsTrigger>
                                            <TabsTrigger value="upload" className="rounded-lg">Upload File</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="link" className="space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <Label htmlFor="resource-name" className="block text-sm font-medium mb-1.5">Resource Name</Label>
                                                    <Input id="resource-name" placeholder="e.g., Study Guide" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="resource-url" className="block text-sm font-medium mb-1.5">Resource URL</Label>
                                                    <Input id="resource-url" type="url" placeholder="https://..." className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <Label className="block text-sm font-medium mb-1.5">Resource Type</Label>
                                                    <Select onValueChange={val => (document.getElementById('resource-type') as any).value = val}>
                                                        <SelectTrigger id="resource-type" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary">
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="PDF">PDF Document</SelectItem>
                                                            <SelectItem value="Video">Video</SelectItem>
                                                            <SelectItem value="Link">External Link</SelectItem>
                                                            <SelectItem value="Document">Document</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="resource-desc" className="block text-sm font-medium mb-1.5">Description (Optional)</Label>
                                                    <Input id="resource-desc" placeholder="Brief description" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
                                                </div>
                                            </div>

                                            <Button type="button" className="min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring" onClick={() => {
                                                const name = (document.getElementById('resource-name') as HTMLInputElement).value;
                                                const url = (document.getElementById('resource-url') as HTMLInputElement).value;
                                                const type = (document.getElementById('resource-type') as any).value || 'Link';
                                                const description = (document.getElementById('resource-desc') as HTMLInputElement).value;

                                                if (name && url) {
                                                    setResources([...resources, {
                                                        id: Date.now().toString(),
                                                        name,
                                                        url,
                                                        type,
                                                        description
                                                    }]);
                                                    (document.getElementById('resource-name') as HTMLInputElement).value = '';
                                                    (document.getElementById('resource-url') as HTMLInputElement).value = '';
                                                    (document.getElementById('resource-desc') as HTMLInputElement).value = '';
                                                    toast.success('Resource added');
                                                } else {
                                                    toast.error('Please provide name and URL');
                                                }
                                            }}>
                                                Add Link Resource
                                            </Button>
                                        </TabsContent>

                                        <TabsContent value="upload" className="space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <Label htmlFor="resource-file" className="block text-sm font-medium mb-1.5">File Upload</Label>
                                                    <Input id="resource-file" type="file" className="cursor-pointer rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            (document.getElementById('resource-name-upload') as HTMLInputElement).value = file.name;
                                                        }
                                                    }} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="resource-name-upload" className="block text-sm font-medium mb-1.5">Resource Name</Label>
                                                    <Input id="resource-name-upload" placeholder="e.g., Study Guide" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
                                                </div>
                                            </div>

                                            <div>
                                                <Label htmlFor="resource-desc-upload" className="block text-sm font-medium mb-1.5">Description (Optional)</Label>
                                                <Input id="resource-desc-upload" placeholder="Brief description" className="h-11 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring focus:border-primary" />
                                            </div>

                                            <Button type="button" disabled={isUploading} onClick={handleResourceUpload} className="min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">
                                                {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                {isUploading ? "Uploading..." : "Upload & Add Resource"}
                                            </Button>
                                        </TabsContent>
                                    </Tabs>

                                    {resources.length > 0 && (
                                        <Card className="rounded-2xl border border-border">
                                            <CardHeader>
                                                <CardTitle className="font-display text-base font-semibold">Added Resources ({resources.length})</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {resources.map((resource, idx) => (
                                                        <div key={resource.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                                                            <div>
                                                                <p className="font-medium">{resource.name}</p>
                                                                <p className="text-xs text-muted-foreground">{resource.type} • {resource.url.substring(0, 50)}...</p>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setResources(resources.filter((_, i) => i !== idx))}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex justify-between pt-2">
                                <Button type="button" variant="outline" onClick={() => setActiveTab("Quiz")} className="min-h-[44px] rounded-xl border border-border hover:bg-brand-50 hover:text-primary">
                                    Back
                                </Button>
                                <Button type="button" onClick={() => setActiveTab("Review")} className="min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">
                                    Next <ChevronRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </TabsContent>

                        {/* STEP 4: REVIEW */}
                        <TabsContent value="Review" className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4">
                                <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">7</span>
                                    <div className="min-w-0">
                                        <h2 className="font-display text-lg font-semibold tracking-tight">Training Summary</h2>
                                        <p className="text-sm text-muted-foreground">Review the key details before you publish.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div><span className="font-semibold">Type:</span> {watch("type")}</div>
                                    <div><span className="font-semibold">Type:</span> {watch("type")}</div>
                                    <div><span className="font-semibold">Sub-Type:</span> {watch("subType")}</div>
                                    <div><span className="font-semibold">Course:</span> {watch("courseName")}</div>
                                    <div><span className="font-semibold">Instructor:</span> {approvedTrainers.find(t => t.trainerId === watch("instructor"))?.fullName || watch("instructor")}</div>
                                    <div><span className="font-semibold">Level:</span> {watch("level")}</div>
                                    <div><span className="font-semibold">Mode:</span> {watch("mode") === "On-site" ? `On-site (${watch("venueName")})` : "Online"}</div>
                                    <div><span className="font-semibold">Payment:</span> {watch("paymentType")} {watch("paymentType") === "Paid" && `(${watch("currency")} ${watch("price")})`}</div>
                                    {watch("couponCode") && <div className="col-span-1 md:col-span-2 text-success font-mono text-xs mt-1">Coupon: {watch("couponCode")}</div>}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                                <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
                                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">7</span>
                                    <div className="min-w-0">
                                        <h2 className="font-display text-lg font-semibold tracking-tight">Curriculum Preview</h2>
                                        <p className="text-sm text-muted-foreground">A quick look at the modules and lessons you've built.</p>
                                    </div>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto border border-border p-3 rounded-xl">
                                    {curriculum?.map((module, i) => (
                                        <div key={i} className="border border-border rounded-xl p-3 bg-card">
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
                                                        {lesson.title} <span className="text-xs border border-border px-1.5 py-0.5 rounded-md">{lesson.duration}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between pt-2 mt-auto">
                                <Button type="button" variant="ghost" onClick={() => setActiveTab("Curriculum")} className="min-h-[44px] rounded-xl hover:bg-brand-50 hover:text-primary">Back</Button>
                                <Button type="submit" disabled={isLoading} size="lg" className="min-h-[44px] px-6 font-semibold rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {isTrainerMode ? "Sending for review..." : "Publishing..."}
                                        </>
                                    ) : (
                                        <>
                                            {isTrainerMode ? "Submit for Review" : "Publish Live"}
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
                <h3 className="font-display text-lg font-semibold">Modules & Lessons</h3>
                <Button type="button" size="sm" onClick={() => appendModule({ title: "New Module", lessons: [] })} variant="secondary" className="min-h-[44px] rounded-xl">
                    Add Module
                </Button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {moduleFields.length === 0 && <p className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-xl">No modules yet. Add one or Import from Markdown.</p>}

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
        <div className="border border-border rounded-xl p-4 bg-card transition-shadow hover:shadow-card">
            <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="h-8 w-8 flex items-center justify-center rounded-full bg-brand-50 border-primary font-bold tabular-nums">
                    {moduleIndex + 1}
                </Badge>
                <div className="flex-1">
                    <Input
                        {...register(`curriculum.${moduleIndex}.title` as const)}
                        placeholder="Module Title (e.g. Introduction to AI)"
                        className="font-semibold text-lg border-none shadow-none focus-visible:ring-0 px-0 h-auto rounded-none border-b focus-visible:border-primary"
                    />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeModule(moduleIndex)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    Remove
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
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeLesson(lessonIndex)} className="h-8 px-2 text-xs text-muted-foreground hover:bg-destructive hover:text-destructive-foreground">
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                <div className="pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => appendLesson({ title: "", type: "Video", duration: "" })} className="text-primary hover:text-primary/80 hover:bg-primary/5">
                        Add Lesson
                    </Button>
                </div>
            </div>
        </div>
    );
}
