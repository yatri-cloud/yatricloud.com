import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    BookOpen,
    LogOut,
    Plus,
    Save,
    ArrowLeft,
    Video,
    FileText,
    Play,
    Trash2,
    CheckCircle,
    LayoutGrid,
    MessageSquare,
    Link2,
    Calendar,
    Settings,
    ChevronRight,
    HelpCircle,
    Download,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/Navbar";
import {
    getCourseContent as apiGetCourseContent,
    saveCourseContent as apiSaveCourseContent,
    submitCourseForApproval as apiSubmitCourseForApproval,
} from "@/lib/training-api";

interface TrainerData {
    trainerId: string;
    fullName: string;
    username: string;
}

interface Module {
    moduleId: string;
    moduleName: string;
    order: number;
    lessons: Lesson[];
}

interface Lesson {
    lessonId: string;
    lessonTitle: string;
    duration: string;
    contentType: string;
    contentUrl: string;
    description: string;
    order: number;
}

interface Quiz {
    quizId: string;
    quizTitle: string;
    questions: Question[];
}

interface Question {
    questionId: string;
    text: string;
    type: "single" | "multiple";
    options: string[];
    correctAnswer: string | number[];
}

interface Resource {
    resourceId: string;
    title: string;
    type: "pdf" | "link" | "zip";
    url: string;
}

interface LiveSession {
    mode: "Online" | "On-site";
    startDate: string;
    startTime: string;
    meetLink: string;
}

export const TrainerCourseEditor = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<"curriculum" | "quizzes" | "resources" | "live">("curriculum");
    const [isLoading, setIsLoading] = useState(true);
    const [trainerData, setTrainerData] = useState<TrainerData | null>(null);
    const [courseName, setCourseName] = useState("");
    const [modules, setModules] = useState<Module[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [liveSession, setLiveSession] = useState<LiveSession>({
        mode: "Online",
        startDate: "",
        startTime: "",
        meetLink: ""
    });

    const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [newModuleName, setNewModuleName] = useState("");
    const [newLesson, setNewLesson] = useState({
        lessonTitle: "",
        duration: "",
        contentType: "video",
        contentUrl: "",
        description: "",
    });

    useEffect(() => {
        const storedTrainer = localStorage.getItem("trainerData");
        if (!storedTrainer) {
            navigate("/trainer/login");
            return;
        }
        setTrainerData(JSON.parse(storedTrainer));
        loadCourseContent();
    }, [courseId, navigate]);

    const loadCourseContent = async () => {
        try {
            setIsLoading(true);
            const assignments = JSON.parse(localStorage.getItem("trainerAssignments") || "[]");
            const course = assignments.find((a: any) => a.courseId === courseId);
            if (course) {
                setCourseName(course.courseName);
            } else {
                // Set a display name from courseId as fallback
                setCourseName(courseId?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Course");
            }

            if (!courseId) return;

            const result = await apiGetCourseContent(courseId);
            if (result.modules) setModules(result.modules);
            if (result.quizzes) setQuizzes(result.quizzes);
            if (result.resources) setResources(result.resources);
            if (result.liveSession) setLiveSession(result.liveSession);
        } catch (error) {
            console.error("Failed to load course content:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("trainerData");
        localStorage.removeItem("trainerAssignments");
        navigate("/trainer/login");
    };

    // --- Curriculum Handlers ---
    const addModule = () => {
        if (!newModuleName.trim()) return;
        const newModule: Module = {
            moduleId: `MOD${Date.now()}`,
            moduleName: newModuleName,
            order: modules.length + 1,
            lessons: [],
        };
        setModules([...modules, newModule]);
        setNewModuleName("");
        setSelectedModuleIndex(modules.length);
    };

    const addLesson = () => {
        if (!newLesson.lessonTitle.trim() || !newLesson.contentUrl.trim()) return;
        const updatedModules = [...modules];
        const lesson: Lesson = {
            lessonId: `LSN${Date.now()}`,
            ...newLesson,
            order: (updatedModules[selectedModuleIndex]?.lessons?.length || 0) + 1,
        } as Lesson;
        
        if (!updatedModules[selectedModuleIndex].lessons) {
            updatedModules[selectedModuleIndex].lessons = [];
        }
        
        updatedModules[selectedModuleIndex].lessons.push(lesson);
        setModules(updatedModules);
        setNewLesson({ lessonTitle: "", duration: "", contentType: "video", contentUrl: "", description: "" });
    };

    const saveCourseContent = async () => {
        if (!courseId) return;
        try {
            setIsSaving(true);
            await apiSaveCourseContent({ courseId, modules, resources, liveSession });
            toast({ title: "✅ Progress Saved", description: "All content has been saved to draft." });
        } catch (error: any) {
            toast({
                title: "Save Failed",
                description: error.message || "Could not connect to backend.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const submitForApproval = async () => {
        if (modules.length === 0) {
            toast({ title: "No Curriculum", description: "Add at least one module before submitting.", variant: "destructive" });
            return;
        }
        await saveCourseContent();
        try {
            setIsSubmitting(true);
            await apiSubmitCourseForApproval({ courseId: courseId! });
            toast({ title: "🎉 Submitted for Review", description: "Admin will review your course shortly." });
            navigate("/trainer/dashboard");
        } catch {
            toast({ title: "Submission Failed", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!trainerData) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-16">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted-foreground font-medium">Loading course content...</p>
                    </div>
                </div>
            </div>
        );
    }

    const navItems = [
        { id: "curriculum", label: "Curriculum", icon: LayoutGrid },
        { id: "quizzes", label: "Quizzes", icon: HelpCircle },
        { id: "resources", label: "Resources", icon: Download },
        { id: "live", label: "Live Session", icon: Video },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex-1 flex pt-16 h-screen overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-card border-r flex flex-col pt-4">
                    <div className="px-4 mb-6">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/trainer/dashboard")} className="mb-4 text-xs">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <h2 className="font-bold text-lg leading-tight truncate px-1">{courseName}</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">Course Editor</p>
                    </div>

                    <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    activeTab === item.id 
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span className="flex-1 text-left">{item.label}</span>
                                {activeTab === item.id && <ChevronRight className="w-4 h-4 opacity-70" />}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t space-y-2 bg-accent/5">
                        <Button className="w-full justify-start text-xs h-9" variant="outline" onClick={saveCourseContent} disabled={isSaving}>
                            <Save className="w-3.5 h-3.5 mr-2" /> {isSaving ? "Saving..." : "Save Draft"}
                        </Button>
                        <Button className="w-full justify-start text-xs h-9" variant="secondary" onClick={() => navigate(`/training/${courseId}`)}>
                            <Eye className="w-3.5 h-3.5 mr-2" /> Preview Page
                        </Button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col bg-accent/10 overflow-hidden">
                    <header className="bg-card/50 backdrop-blur-md border-b px-8 py-4 flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="text-xl font-extrabold capitalize tracking-tight text-primary">{activeTab}</h3>
                            <p className="text-[11px] text-muted-foreground uppercase font-semibold">Organize and manage your content types.</p>
                        </div>
                        <Button onClick={submitForApproval} disabled={isSubmitting} variant="default" className="shadow-lg shadow-primary/20 font-bold">
                            <CheckCircle className="w-4 h-4 mr-2" /> {isSubmitting ? "Submitting..." : "Submit for Approval"}
                        </Button>
                    </header>

                    <ScrollArea className="flex-1">
                        <div className="max-w-5xl mx-auto p-8 pb-20">
                            {activeTab === "curriculum" && (
                                <CurriculumEditor 
                                    modules={modules} 
                                    selectedModuleIndex={selectedModuleIndex}
                                    setSelectedModuleIndex={setSelectedModuleIndex}
                                    newModuleName={newModuleName}
                                    setNewModuleName={setNewModuleName}
                                    addModule={addModule}
                                    setModules={setModules}
                                    newLesson={newLesson}
                                    setNewLesson={setNewLesson}
                                    addLesson={addLesson}
                                />
                            )}
                            {activeTab === "quizzes" && (
                                <QuizEditor quizzes={quizzes} setQuizzes={setQuizzes} />
                            )}
                            {activeTab === "resources" && (
                                <ResourceEditor resources={resources} setResources={setResources} />
                            )}
                            {activeTab === "live" && (
                                <LiveSessionEditor liveSession={liveSession} setLiveSession={setLiveSession} />
                            )}
                        </div>
                    </ScrollArea>
                </main>
            </div>
        </div>
    );
};

// --- Sub-components ---

const CurriculumEditor = ({ modules, selectedModuleIndex, setSelectedModuleIndex, newModuleName, setNewModuleName, addModule, setModules, newLesson, setNewLesson, addLesson }: any) => {
    const currentModule = modules[selectedModuleIndex];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="md:col-span-1 border-none shadow-xl bg-card/60 backdrop-blur-sm h-fit">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-primary" />
                        Modules
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="e.g. Introduction" 
                            value={newModuleName} 
                            onChange={(e) => setNewModuleName(e.target.value)} 
                            className="h-10 bg-white"
                        />
                        <Button size="icon" onClick={addModule} className="shrink-0"><Plus className="w-4 h-4" /></Button>
                    </div>
                    <ScrollArea className="h-[450px] -mx-2 px-2">
                        <div className="space-y-2 pb-4">
                            {modules.map((m: any, i: number) => (
                                <div 
                                    key={m.moduleId}
                                    onClick={() => setSelectedModuleIndex(i)}
                                    className={`p-3 rounded-xl border transition-all group ${
                                        selectedModuleIndex === i 
                                        ? "bg-primary/10 border-primary/30 shadow-sm" 
                                        : "hover:bg-accent/50 border-transparent hover:border-border"
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="truncate pr-2">
                                            <p className={`font-bold text-sm truncate ${selectedModuleIndex === i ? "text-primary" : ""}`}>{m.moduleName}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                {m.lessons?.length || 0} Lessons
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                                            e.stopPropagation();
                                            setModules(modules.filter((_:any, idx:number) => idx !== i));
                                        }}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 border-none shadow-xl bg-card/60 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50">
                    <CardTitle className="flex items-center justify-between">
                        <span className="truncate">{currentModule?.moduleName || "Select a Module"}</span>
                        {currentModule && <Badge variant="secondary" className="text-[10px] font-bold">{currentModule.lessons?.length || 0} ITEMS</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {!currentModule ? (
                        <div className="py-24 text-center">
                            <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium italic">Create or select a module to start building your curriculum.</p>
                        </div>
                    ) : (
                        <Tabs defaultValue="list" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-accent/50 rounded-xl">
                                <TabsTrigger value="list" className="rounded-lg font-bold">Content List</TabsTrigger>
                                <TabsTrigger value="add" className="rounded-lg font-bold text-primary">Add New Lesson</TabsTrigger>
                            </TabsList>
                            <TabsContent value="list" className="space-y-3">
                                {(!currentModule.lessons || currentModule.lessons.length === 0) ? (
                                    <div className="py-16 text-center border-2 border-dashed rounded-3xl opacity-50">
                                        <Play className="w-8 h-8 mx-auto mb-3" />
                                        <p className="text-sm font-bold uppercase tracking-widest">No Content Found</p>
                                    </div>
                                ) : (
                                    currentModule.lessons.map((lsn: any, i: number) => (
                                        <div key={lsn.lessonId} className="p-4 rounded-2xl border bg-card/80 flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                    {lsn.contentType === "video" ? <Video className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <h5 className="font-extrabold text-foreground tracking-tight">{lsn.lessonTitle}</h5>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[9px] py-0 border-primary/20 text-primary uppercase font-black tracking-widest leading-4">
                                                            {lsn.contentType}
                                                        </Badge>
                                                        <span className="text-[11px] font-bold text-muted-foreground">{lsn.duration} MINS</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-all" onClick={() => {
                                                const updated = [...modules];
                                                updated[selectedModuleIndex].lessons = updated[selectedModuleIndex].lessons.filter((_:any, idx:number) => idx !== i);
                                                setModules(updated);
                                            }}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </TabsContent>
                            <TabsContent value="add" className="space-y-5 p-2 animate-in fade-in zoom-in-95 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Title</Label>
                                        <Input value={newLesson.lessonTitle} onChange={(e) => setNewLesson({...newLesson, lessonTitle: e.target.value})} placeholder="e.g. Getting Started" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Duration (Min)</Label>
                                        <Input type="number" value={newLesson.duration} onChange={(e) => setNewLesson({...newLesson, duration: e.target.value})} placeholder="15" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Content URL (Vimeo/YT/Drive)</Label>
                                    <Input value={newLesson.contentUrl} onChange={(e) => setNewLesson({...newLesson, contentUrl: e.target.value})} placeholder="https://..." />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Learning Description</Label>
                                    <Textarea rows={3} value={newLesson.description} onChange={(e) => setNewLesson({...newLesson, description: e.target.value})} placeholder="Short summary of the lesson..." />
                                </div>
                                <Button className="w-full h-11 font-bold text-base shadow-lg shadow-primary/20" onClick={addLesson}><Plus className="w-5 h-5 mr-2" /> Add Lesson to Module</Button>
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const QuizEditor = ({ quizzes, setQuizzes }: any) => {
    const [newQuizTitle, setNewQuizTitle] = useState("");
    
    const addQuiz = () => {
        if (!newQuizTitle.trim()) return;
        setQuizzes([...quizzes, { quizId: `QZ${Date.now()}`, quizTitle: newQuizTitle, questions: [] }]);
        setNewQuizTitle("");
    };

    return (
        <Card className="border-none shadow-xl bg-transparent animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="bg-card/60 backdrop-blur-sm rounded-t-3xl border-b border-border/50 flex flex-row items-center justify-between py-6">
                <div>
                    <CardTitle className="text-2xl font-black tracking-tight text-primary">Assessments</CardTitle>
                    <CardDescription className="font-medium">Define quizzes and challenges for students</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Input placeholder="Quiz Name" value={newQuizTitle} onChange={(e) => setNewQuizTitle(e.target.value)} className="w-64 bg-white" />
                    <Button onClick={addQuiz} className="font-bold shadow-lg shadow-primary/10"><Plus className="w-4 h-4 mr-2" /> New Quiz</Button>
                </div>
            </CardHeader>
            <CardContent className="bg-white/40 backdrop-blur-sm rounded-b-3xl mt-4 px-0">
                {quizzes.length === 0 ? (
                    <div className="py-24 text-center">
                        <HelpCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground font-bold italic">No quizzes created yet. Start by adding one above.</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-6">
                        {quizzes.map((quiz: any, qIdx: number) => (
                            <Card key={quiz.quizId} className="border-2 border-primary/5 bg-white/80 shadow-sm overflow-hidden rounded-2xl">
                                <header className="px-6 py-4 bg-primary/5 flex items-center justify-between border-b">
                                    <h4 className="text-lg font-black tracking-tight flex items-center gap-2 italic">
                                        <MessageSquare className="w-5 h-5" />
                                        {quiz.quizTitle}
                                    </h4>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => setQuizzes(quizzes.filter((_:any, i:number) => i !== qIdx))}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </header>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{quiz.questions.length} QUESTIONS TOTAL</p>
                                        </div>
                                        <Button variant="outline" className="w-full h-12 border-dashed border-2 font-bold hover:bg-primary/5 hover:border-primary/30 transition-all border-accent-foreground/20 rounded-xl" onClick={() => {
                                            const updated = [...quizzes];
                                            updated[qIdx].questions.push({
                                                questionId: `QN${Date.now()}`,
                                                text: "New Question Text",
                                                type: "single",
                                                options: ["Example Option 1", "Example Option 2", "Option 3", "Option 4"],
                                                correctAnswer: 0
                                            });
                                            setQuizzes(updated);
                                        }}>
                                            <Plus className="w-4 h-4 mr-2" /> Design New Question
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const ResourceEditor = ({ resources, setResources }: any) => {
    const [newResource, setNewResource] = useState({ title: "", url: "", type: "pdf" });

    const addResource = () => {
        if (!newResource.title || !newResource.url) return;
        setResources([...resources, { resourceId: `RES${Date.now()}`, ...newResource }]);
        setNewResource({ title: "", url: "", type: "pdf" });
    };

    return (
        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="py-6 border-b border-border/50">
                <CardTitle className="text-2xl font-black text-primary tracking-tight">Resource Center</CardTitle>
                <CardDescription className="font-medium">Attach supplementary files and useful links</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
                <div className="p-6 border-2 border-primary/10 rounded-3xl bg-white/40 grid grid-cols-1 md:grid-cols-4 gap-4 items-end shadow-inner">
                    <div className="md:col-span-1 space-y-1.5">
                        <Label className="text-xs font-black uppercase text-muted-foreground mr-1">Material Type</Label>
                        <Select value={newResource.type} onValueChange={(v) => setNewResource({...newResource, type: v as any})}>
                            <SelectTrigger className="bg-white h-11 font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent className="font-bold">
                                <SelectItem value="pdf">PDF Document</SelectItem>
                                <SelectItem value="link">External Link</SelectItem>
                                <SelectItem value="zip">ZIP Archive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-1 space-y-1.5">
                        <Label className="text-xs font-black uppercase text-muted-foreground">Resource Name</Label>
                        <Input placeholder="e.g. Slide Deck" className="bg-white h-11 font-medium" value={newResource.title} onChange={(e) => setNewResource({...newResource, title: e.target.value})} />
                    </div>
                    <div className="md:col-span-1 space-y-1.5">
                        <Label className="text-xs font-black uppercase text-muted-foreground">Access URL / Path</Label>
                        <Input placeholder="https://drive..." className="bg-white h-11 font-medium" value={newResource.url} onChange={(e) => setNewResource({...newResource, url: e.target.value})} />
                    </div>
                    <Button className="w-full h-11 font-bold shadow-lg shadow-primary/10" onClick={addResource}><Plus className="w-5 h-5 mr-1" /> ADD ITEM</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                    {resources.map((res: any, idx: number) => (
                        <div key={res.resourceId} className="flex items-center justify-between p-5 border rounded-2xl bg-white group hover:border-primary/40 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <Link2 className="w-6 h-6" />
                                </div>
                                <div className="pr-2">
                                    <p className="font-extrabold text-foreground leading-tight truncate max-w-[180px]">{res.title}</p>
                                    <Badge variant="outline" className="text-[9px] uppercase font-black py-0 border-primary/20 text-primary bg-primary/5 tracking-tighter">{res.type}</Badge>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive rounded-xl hover:bg-destructive/10" onClick={() => setResources(resources.filter((_:any, i:number) => i !== idx))}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    {resources.length === 0 && (
                        <div className="md:col-span-2 py-20 text-center opacity-40">
                            <Download className="w-10 h-10 mx-auto mb-2" />
                            <p className="font-bold text-sm uppercase tracking-widest">Repository Empty</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const LiveSessionEditor = ({ liveSession, setLiveSession }: any) => {
    return (
        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
            <CardHeader className="py-6 border-b border-border/50">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                    <CardTitle className="text-2xl font-black text-primary tracking-tight">Live Broadcast</CardTitle>
                </div>
                <CardDescription className="font-medium">Configure your upcoming interactive sessions</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-10 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5" /> Training Modality</Label>
                            <Select value={liveSession.mode} onValueChange={(v) => setLiveSession({...liveSession, mode: v})}>
                                <SelectTrigger className="h-12 bg-white font-bold text-base rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent className="font-bold">
                                    <SelectItem value="Online">Virtual / Remote Link</SelectItem>
                                    <SelectItem value="On-site">Physical / On-site Venue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Meeting Endpoint / Address</Label>
                            <div className="relative group">
                                <Link2 className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    className="pl-11 h-12 bg-white font-medium text-base rounded-xl focus:ring-primary/20" 
                                    placeholder={liveSession.mode === "Online" ? "https://meet.google.com/..." : "Enter full venue address"} 
                                    value={liveSession.meetLink}
                                    onChange={(e) => setLiveSession({...liveSession, meetLink: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 bg-accent/20 rounded-3xl border border-accent flex flex-col gap-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Select Date</Label>
                                <div className="relative overflow-hidden rounded-xl">
                                    <Calendar className="absolute left-4 top-3 w-5 h-5 text-primary pointer-events-none z-10" />
                                    <Input 
                                        type="date" 
                                        className="pl-12 h-11 bg-white border-0 font-bold focus-visible:ring-0" 
                                        value={liveSession.startDate}
                                        onChange={(e) => setLiveSession({...liveSession, startDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Select Time</Label>
                                <div className="relative overflow-hidden rounded-xl">
                                    <Clock className="absolute left-4 top-3 w-5 h-5 text-primary pointer-events-none z-10" />
                                    <Input 
                                        type="time" 
                                        className="pl-12 h-11 bg-white border-0 font-bold focus-visible:ring-0" 
                                        value={liveSession.startTime}
                                        onChange={(e) => setLiveSession({...liveSession, startTime: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-[40px] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-primary/5">
                    <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
                        <Video className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black tracking-tight mb-1">Live Broadcast Preview</h4>
                        <p className="text-muted-foreground font-medium leading-relaxed max-w-lg">
                            An {liveSession.mode} session is scheduled to begin on <span className="text-primary font-black underline underline-offset-4 decoration-2 decoration-primary/30">{liveSession.startDate || "[DATE]"}</span> at <span className="text-primary font-black underline underline-offset-4 decoration-2 decoration-primary/30">{liveSession.startTime || "[TIME]"}</span>. 
                            Students will receive notifications 15 minutes prior.
                        </p>
                    </div>
                    {liveSession.meetLink && (
                        <Button variant="outline" size="lg" className="ml-auto rounded-2xl font-bold border-primary/30 text-primary hover:bg-primary/5 shadow-sm" asChild>
                            <a href={liveSession.meetLink} target="_blank" rel="noopener noreferrer">Test Connection</a>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const Clock = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

export default TrainerCourseEditor;
