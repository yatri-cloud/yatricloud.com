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
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export const TrainerCourseEditor = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [trainerData, setTrainerData] = useState<TrainerData | null>(null);
    const [courseName, setCourseName] = useState("");
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New module form
    const [newModuleName, setNewModuleName] = useState("");

    // New lesson form
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

        // Load course data
        loadCourseContent();
    }, [courseId, navigate]);

    const loadCourseContent = async () => {
        try {
            // Get course name from assignments
            const assignments = JSON.parse(localStorage.getItem("trainerAssignments") || "[]");
            const course = assignments.find((a: any) => a.courseId === courseId);
            if (course) {
                setCourseName(course.courseName);
            }

            // Fetch existing modules and lessons from backend
            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                    body: JSON.stringify({
                        action: "getCourseContent",
                        courseId: courseId,
                    }),
                }
            );

            const result = await response.json();

            if (result.success && result.modules) {
                setModules(result.modules);
            }
        } catch (error) {
            console.error("Failed to load course content:", error);
            toast({
                title: "Load Error",
                description: "Failed to load course content",
                variant: "destructive",
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("trainerData");
        localStorage.removeItem("trainerAssignments");
        navigate("/trainer/login");
    };

    const addModule = () => {
        if (!newModuleName.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter a module name",
                variant: "destructive",
            });
            return;
        }

        const newModule: Module = {
            moduleId: `MOD${Date.now()}`,
            moduleName: newModuleName,
            order: modules.length + 1,
            lessons: [],
        };

        setModules([...modules, newModule]);
        setNewModuleName("");
        setSelectedModuleIndex(modules.length);

        toast({
            title: "Module Added",
            description: `"${newModuleName}" has been added`,
        });
    };

    const removeModule = (index: number) => {
        const updatedModules = modules.filter((_, i) => i !== index);
        setModules(updatedModules);
        if (selectedModuleIndex >= updatedModules.length) {
            setSelectedModuleIndex(Math.max(0, updatedModules.length - 1));
        }
        toast({
            title: "Module Removed",
            description: "Module has been deleted",
        });
    };

    const addLesson = () => {
        if (!newLesson.lessonTitle.trim() || !newLesson.contentUrl.trim()) {
            toast({
                title: "Validation Error",
                description: "Please fill in lesson title and content URL",
                variant: "destructive",
            });
            return;
        }

        const updatedModules = [...modules];
        const currentModule = updatedModules[selectedModuleIndex];

        const lesson: Lesson = {
            lessonId: `LSN${Date.now()}`,
            lessonTitle: newLesson.lessonTitle,
            duration: newLesson.duration,
            contentType: newLesson.contentType,
            contentUrl: newLesson.contentUrl,
            description: newLesson.description,
            order: currentModule.lessons.length + 1,
        };

        currentModule.lessons.push(lesson);
        setModules(updatedModules);

        // Reset form
        setNewLesson({
            lessonTitle: "",
            duration: "",
            contentType: "video",
            contentUrl: "",
            description: "",
        });

        toast({
            title: "Lesson Added",
            description: `"${lesson.lessonTitle}" added to ${currentModule.moduleName}`,
        });
    };

    const removeLesson = (lessonIndex: number) => {
        const updatedModules = [...modules];
        updatedModules[selectedModuleIndex].lessons = updatedModules[selectedModuleIndex].lessons.filter(
            (_, i) => i !== lessonIndex
        );
        setModules(updatedModules);
        toast({
            title: "Lesson Removed",
            description: "Lesson has been deleted",
        });
    };

    const saveCourseContent = async () => {
        if (modules.length === 0) {
            toast({
                title: "No Content",
                description: "Please add at least one module before saving",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSaving(true);

            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                    body: JSON.stringify({
                        action: "saveCourseContent",
                        courseId: courseId,
                        trainerId: trainerData?.trainerId,
                        modules: modules,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Content Saved",
                    description: "Your course content has been saved as draft",
                });
            } else {
                throw new Error(result.error || "Failed to save");
            }
        } catch (error: any) {
            toast({
                title: "Save Failed",
                description: error.message || "Failed to save content",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const submitForApproval = async () => {
        if (modules.length === 0) {
            toast({
                title: "No Content",
                description: "Please add course content before submitting",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSubmitting(true);

            // First save the content
            const saveResponse = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                    body: JSON.stringify({
                        action: "saveCourseContent",
                        courseId: courseId,
                        trainerId: trainerData?.trainerId,
                        modules: modules,
                    }),
                }
            );

            const saveResult = await saveResponse.json();
            if (!saveResult.success) {
                throw new Error(saveResult.error || "Failed to save content");
            }

            // Then submit for approval
            const submitResponse = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                    body: JSON.stringify({
                        action: "submitCourseForApproval",
                        courseId: courseId,
                        courseName: courseName,
                        trainerId: trainerData?.trainerId,
                    }),
                }
            );

            const submitResult = await submitResponse.json();

            if (submitResult.success) {
                toast({
                    title: "Submitted for Review",
                    description: "Your course has been submitted for admin approval",
                });

                navigate("/trainer/dashboard");
            } else {
                throw new Error(submitResult.error || "Failed to submit");
            }
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.message || "Failed to submit course",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!trainerData) {
        return null;
    }

    const currentModule = modules[selectedModuleIndex];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => navigate("/trainer/dashboard")}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">{courseName}</h1>
                                <p className="text-sm text-muted-foreground">Course Editor</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={saveCourseContent} disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? "Saving..." : "Save Draft"}
                            </Button>
                            <Button onClick={submitForApproval} disabled={isSubmitting}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {isSubmitting ? "Submitting..." : "Submit for Approval"}
                            </Button>
                            <Button variant="outline" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left: Modules List */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Course Modules</CardTitle>
                            <CardDescription>Add and organize your course modules</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Module Form */}
                            <div className="space-y-2">
                                <Label>New Module</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Module name"
                                        value={newModuleName}
                                        onChange={(e) => setNewModuleName(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && addModule()}
                                    />
                                    <Button onClick={addModule} size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Modules List */}
                            <div className="space-y-2">
                                {modules.map((module, index) => (
                                    <div
                                        key={module.moduleId}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedModuleIndex === index
                                            ? "bg-primary/10 border-primary"
                                            : "hover:bg-accent"
                                            }`}
                                        onClick={() => setSelectedModuleIndex(index)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium">{module.moduleName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeModule(index);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {modules.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No modules yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Module Content Editor */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>
                                {currentModule ? currentModule.moduleName : "Select a Module"}
                            </CardTitle>
                            <CardDescription>
                                {currentModule
                                    ? "Add lessons to this module"
                                    : "Create a module to start adding lessons"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {currentModule ? (
                                <Tabs defaultValue="add" className="space-y-4">
                                    <TabsList>
                                        <TabsTrigger value="add">Add Lesson</TabsTrigger>
                                        <TabsTrigger value="lessons">
                                            Lessons ({currentModule.lessons.length})
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Add Lesson Tab */}
                                    <TabsContent value="add" className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Lesson Title *</Label>
                                                <Input
                                                    value={newLesson.lessonTitle}
                                                    onChange={(e) =>
                                                        setNewLesson({ ...newLesson, lessonTitle: e.target.value })
                                                    }
                                                    placeholder="Introduction to..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Duration (minutes)</Label>
                                                <Input
                                                    type="number"
                                                    value={newLesson.duration}
                                                    onChange={(e) =>
                                                        setNewLesson({ ...newLesson, duration: e.target.value })
                                                    }
                                                    placeholder="30"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Content Type</Label>
                                            <Select
                                                value={newLesson.contentType}
                                                onValueChange={(value) =>
                                                    setNewLesson({ ...newLesson, contentType: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="video">
                                                        <div className="flex items-center gap-2">
                                                            <Video className="w-4 h-4" />
                                                            Video
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="article">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4" />
                                                            Article/Reading
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Content URL *</Label>
                                            <Input
                                                value={newLesson.contentUrl}
                                                onChange={(e) =>
                                                    setNewLesson({ ...newLesson, contentUrl: e.target.value })
                                                }
                                                placeholder="https://..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={newLesson.description}
                                                onChange={(e) =>
                                                    setNewLesson({ ...newLesson, description: e.target.value })
                                                }
                                                placeholder="What will students learn in this lesson?"
                                                rows={3}
                                            />
                                        </div>

                                        <Button onClick={addLesson} className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Lesson
                                        </Button>
                                    </TabsContent>

                                    {/* Lessons List Tab */}
                                    <TabsContent value="lessons">
                                        {currentModule.lessons.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p>No lessons added yet</p>
                                                <p className="text-sm">Switch to "Add Lesson" tab to create content</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {currentModule.lessons.map((lesson, index) => (
                                                    <div
                                                        key={lesson.lessonId}
                                                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    {lesson.contentType === "video" ? (
                                                                        <Video className="w-4 h-4 text-primary" />
                                                                    ) : (
                                                                        <FileText className="w-4 h-4 text-primary" />
                                                                    )}
                                                                    <h4 className="font-semibold">{lesson.lessonTitle}</h4>
                                                                    {lesson.duration && (
                                                                        <span className="text-sm text-muted-foreground">
                                                                            ({lesson.duration} min)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {lesson.description && (
                                                                    <p className="text-sm text-muted-foreground mb-2">
                                                                        {lesson.description}
                                                                    </p>
                                                                )}
                                                                <a
                                                                    href={lesson.contentUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-primary hover:underline"
                                                                >
                                                                    {lesson.contentUrl}
                                                                </a>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeLesson(index)}
                                                            >
                                                                <Trash2 className="w-4 h-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Create a module first to start adding lessons</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default TrainerCourseEditor;
