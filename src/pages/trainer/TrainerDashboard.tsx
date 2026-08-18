import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search, MoreVertical, Edit, Trash2, ExternalLink, Loader2,
    CheckCircle2, Clock, AlertCircle, Eye, Video, MapPin,
    Calendar, BookOpen, Radio, FilePen, Plus,
    Users, ClipboardList, BarChart3,
} from "lucide-react";
import SessionsManager from "@/components/training/SessionsManager";
import AttendanceMatrixView from "@/components/training/AttendanceMatrix";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchMyProfile } from "@/lib/auth";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { listTrainerTrainings, deleteTraining, updateTrainingSchedule } from "@/lib/training-api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TrainerData {
    trainerId: string;
    fullName: string;
    email: string;
    phone: string;
    expertise: string;
}

interface Course {
    id: string;
    courseName: string;
    subType: string;
    instructor: string;
    instructorId?: string;
    status: "Draft" | "Published" | "Review";
    timestamp: string;
    folderUrl: string;
    startDate?: string;
    startTime?: string;
    meetLink?: string;
    mode?: "Online" | "On-site";
    venue?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
    const hour   = Math.floor(i / 4).toString().padStart(2, "0");
    const minute = ((i % 4) * 15).toString().padStart(2, "0");
    return `${hour}:${minute}`;
});

type TrainerTab = "courses" | "sessions" | "attendance" | "results";

// ── Component ─────────────────────────────────────────────────────────────────
export const TrainerDashboard = () => {
    const { confirm } = useConfirm();
    const navigate = useNavigate();
    const [trainerData,     setTrainerData]     = useState<TrainerData | null>(null);
    const [courses,         setCourses]         = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [isLoading,       setIsLoading]       = useState(true);
    const [searchTerm,      setSearchTerm]      = useState("");
    const [statusFilter,    setStatusFilter]    = useState<"All"|"Published"|"Review"|"Draft">("All");
    const [selectedCourse,  setSelectedCourse]  = useState<Course | null>(null);
    const [isDetailsOpen,   setIsDetailsOpen]   = useState(false);
    const [activeTab,       setActiveTab]       = useState<TrainerTab>("courses");

    // Schedule state (inside course-details dialog)
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
    const [scheduleTime, setScheduleTime] = useState("");
    const [isUpdating,   setIsUpdating]   = useState(false);

    // ── Auth guard ──────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            const storedTrainer = localStorage.getItem("trainerData");
            if (!storedTrainer) { navigate("/trainer/login"); return; }
            const profile = await fetchMyProfile();
            if (!profile || (profile.role !== "trainer" && profile.role !== "admin")) {
                localStorage.removeItem("trainerData");
                navigate("/trainer/login");
                return;
            }
            const parsedTrainer = JSON.parse(storedTrainer);
            setTrainerData(parsedTrainer);
            fetchCourses(parsedTrainer.trainerId);
        })();
    }, [navigate]);

    // ── Filter courses ──────────────────────────────────────────────────────
    useEffect(() => {
        let result = courses;
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(c =>
                (c.courseName && c.courseName.toLowerCase().includes(q)) ||
                (c.subType    && c.subType.toLowerCase().includes(q)),
            );
        }
        if (statusFilter !== "All") result = result.filter(c => c.status === statusFilter);
        setFilteredCourses(result);
    }, [searchTerm, statusFilter, courses]);

    const fetchCourses = async (trainerId: string) => {
        setIsLoading(true);
        try {
            const myCourses = await listTrainerTrainings(trainerId);
            setCourses(myCourses as unknown as Course[]);
        } catch (e) {
            console.error(e);
            toast.error("Failed to connect to backend");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("trainerData");
        localStorage.removeItem("trainerAssignments");
        navigate("/trainer/login");
    };

    const handleDelete = async (courseId: string) => {
        if (!confirm("Are you sure you want to delete this training? This cannot be undone.")) return;
        toast.loading("Deleting training...");
        try {
            await deleteTraining(courseId);
            toast.dismiss();
            toast.success("Training deleted successfully");
            fetchCourses(trainerData!.trainerId);
        } catch (e: any) {
            toast.error("Delete failed: " + (e?.message || "Network error during deletion"));
        }
    };

    const handleUpdateSchedule = async () => {
        if (!selectedCourse || !scheduleDate || !scheduleTime) {
            toast.error("Please select both date and time");
            return;
        }
        setIsUpdating(true);
        try {
            const formattedDate = format(scheduleDate, "yyyy-MM-dd");
            const result = await updateTrainingSchedule(selectedCourse.id, {
                startDate: formattedDate, startTime: scheduleTime,
            });
            toast.success("Schedule saved. The meeting link is set for your students.");
            setSelectedCourse(prev =>
                prev ? ({ ...prev, meetLink: result.meetLink, startDate: formattedDate, startTime: scheduleTime }) : null,
            );
            fetchCourses(trainerData!.trainerId);
        } catch (e: any) {
            toast.error("Failed: " + (e?.message || "Network error"));
        } finally {
            setIsUpdating(false);
        }
    };

    if (!trainerData) return null;

    const TABS = [
        { id: "courses"    as TrainerTab, label: "Courses",         icon: BookOpen     },
        { id: "sessions"   as TrainerTab, label: "My Sessions",     icon: ClipboardList},
        { id: "attendance" as TrainerTab, label: "Take Attendance",  icon: Users        },
        { id: "results"    as TrainerTab, label: "Results Control",  icon: BarChart3    },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col items-center">
            <SEO title="Trainer Dashboard | Yatri Cloud" description="Manage your assigned courses and student progress." />
            <Navbar />

            <div className="w-full max-w-7xl px-4 pt-24 pb-12 flex flex-col gap-6">

                {/* ── Header banner ── */}
                <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/[0.06] via-slate-50/50 to-card p-6 md:p-8">
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Trainer Portal
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                                Welcome back, <span className="text-primary">{trainerData.fullName}</span>
                            </h1>
                            <p className="text-muted-foreground text-sm">Manage course curriculum, schedule class sessions, and track student attendance.</p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <Link to="/trainer/course/create">
                                <Button className="gap-2 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm px-5">
                                    <Plus className="h-4 w-4" /> Create Course
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2 rounded-xl">Profile Details</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-4 rounded-xl">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold">Expertise</p>
                                            <p className="text-sm font-medium">{trainerData.expertise}</p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
                                            <p className="text-sm">{trainerData.email}</p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold">Trainer ID</p>
                                            <p className="font-mono text-xs p-1 bg-muted rounded inline-block mt-1">{trainerData.trainerId}</p>
                                        </div>
                                        <Button variant="destructive" className="w-full mt-2 rounded-xl" onClick={handleLogout}>Logout</Button>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* ── Tab navigation ── */}
                <div className="flex gap-1.5 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/80 w-fit">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                                activeTab === id
                                    ? "bg-primary text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── COURSES TAB ── */}
                {activeTab === "courses" && (
                    <>
                        {/* Clean Stat cards — Uniform Blue Icon Badges matching reference UI */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-2xl border border-slate-200/80 bg-card p-5 shadow-xs flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Courses</p>
                                    <p className="mt-2 font-display text-3xl font-bold tabular-nums text-slate-900">{courses.length}</p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-card p-5 shadow-xs flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Published</p>
                                    <p className="mt-2 font-display text-3xl font-bold tabular-nums text-slate-900">
                                        {courses.filter(c => c.status === "Published").length}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-card p-5 shadow-xs flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Review / Draft</p>
                                    <p className="mt-2 font-display text-3xl font-bold tabular-nums text-slate-900">
                                        {courses.filter(c => c.status === "Review" || c.status === "Draft").length}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Clock className="h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        {/* Course table card */}
                        <Card className="border border-slate-200/80 rounded-2xl shadow-none bg-card">
                            <CardHeader className="pb-3 border-b border-slate-200/80">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <CardTitle className="text-lg font-bold text-slate-900">All Courses ({filteredCourses.length})</CardTitle>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="relative w-full sm:w-60">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search courses..."
                                                className="pl-9 rounded-xl text-sm border-slate-200"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        {/* Pill filter buttons matching reference UI */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-medium text-slate-500 mr-1">Filter:</span>
                                            {(["All", "Published", "Review", "Draft"] as const).map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setStatusFilter(f)}
                                                    className={cn(
                                                        "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                                                        statusFilter === f
                                                            ? "bg-primary text-white font-semibold"
                                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                                                    )}
                                                >
                                                    {f === "All" ? "All" : f === "Published" ? "Live" : f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="text-muted-foreground">Loading curriculum...</p>
                                    </div>
                                ) : filteredCourses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                        <AlertCircle className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                                        <h3 className="text-lg font-medium text-slate-800">No courses found</h3>
                                        <p className="text-muted-foreground text-sm">
                                            {searchTerm ? "Try adjusting your search or filters." : "Get started by creating your first course."}
                                        </p>
                                        {!searchTerm && (
                                            <Link to="/trainer/course/create" className="mt-4">
                                                <Button variant="outline" className="rounded-xl">Create Course</Button>
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                {/* Royal Blue Header Bar matching Reference UI */}
                                                <TableRow className="bg-[#0070f3] hover:bg-[#0070f3] text-white">
                                                    <TableHead className="text-xs uppercase tracking-wider text-white font-bold">Course Name</TableHead>
                                                    <TableHead className="text-xs uppercase tracking-wider text-white font-bold">Category / Provider</TableHead>
                                                    <TableHead className="text-xs uppercase tracking-wider text-white font-bold">Status</TableHead>
                                                    <TableHead className="text-xs uppercase tracking-wider text-white font-bold">Last Updated</TableHead>
                                                    <TableHead className="text-right text-xs uppercase tracking-wider text-white font-bold">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredCourses.map((course) => (
                                                    <TableRow key={course.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <TableCell className="font-semibold text-slate-900">
                                                            <div className="flex flex-col">
                                                                <span>{course.courseName}</span>
                                                                {course.subType && (
                                                                    <span className="text-xs text-muted-foreground font-normal">{course.subType}</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-slate-600 text-sm">{course.subType}</TableCell>
                                                        <TableCell><StatusBadge status={course.status} /></TableCell>
                                                        <TableCell className="text-muted-foreground text-xs font-mono">
                                                            {new Date(course.timestamp).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="rounded-lg"><MoreVertical className="w-4 h-4" /></Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                                    <DropdownMenuItem asChild>
                                                                        <Link to={`/trainer/course/${course.id}/edit`} className="cursor-pointer">
                                                                            Edit Curriculum
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => {
                                                                        setSelectedCourse(course);
                                                                        setScheduleDate(course.startDate ? new Date(course.startDate) : undefined);
                                                                        setScheduleTime(course.startTime || "");
                                                                        setIsDetailsOpen(true);
                                                                    }}>
                                                                        View Details
                                                                    </DropdownMenuItem>
                                                                    <Separator className="my-1" />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive focus:text-destructive cursor-pointer"
                                                                        onClick={async () => { if (await confirm({ title: "Confirm", description: "Are you sure? This cannot be undone." })) { handleDelete(course.id); } }}
                                                                    >
                                                                        Delete Draft
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* ── SESSIONS TAB ── */}
                {activeTab === "sessions" && (
                    <SessionsManager
                        courses={courses as any}
                        onTakeAttendance={() => setActiveTab("attendance")}
                    />
                )}

                {/* ── ATTENDANCE TAB ── */}
                {activeTab === "attendance" && (
                    <AttendanceMatrixView courses={courses as any} />
                )}

                {/* ── RESULTS TAB ── */}
                {activeTab === "results" && (
                    <Card className="border border-slate-200/80 rounded-2xl shadow-none bg-card p-12 text-center text-muted-foreground">
                        <BarChart3 className="w-10 h-10 mx-auto mb-3 text-primary/40" />
                        <h3 className="font-bold text-slate-800 text-lg">Results Control</h3>
                        <p className="text-xs text-muted-foreground mt-1">Assessment management and score distribution report coming soon.</p>
                    </Card>
                )}
            </div>

            {/* ── View Details Dialog ── */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Course Details</DialogTitle>
                        <DialogDescription>Full information for {selectedCourse?.courseName}</DialogDescription>
                    </DialogHeader>
                    {selectedCourse && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase font-semibold">Course Name</Label>
                                    <div className="font-semibold text-slate-900 mt-1">{selectedCourse.courseName}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase font-semibold">Category/Provider</Label>
                                    <div className="font-semibold text-slate-900 mt-1">{selectedCourse.subType}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase font-semibold">Instructor</Label>
                                    <div className="font-semibold text-slate-900 mt-1">{selectedCourse.instructor}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase font-semibold">Status</Label>
                                    <div className="mt-1"><StatusBadge status={selectedCourse.status} /></div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                {selectedCourse.mode && (
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground text-xs uppercase font-semibold">Delivery Mode</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {selectedCourse.mode === "Online" ? <Video className="w-4 h-4 text-primary" /> : <MapPin className="w-4 h-4 text-primary" />}
                                            <span className="font-medium text-slate-900">{selectedCourse.mode}</span>
                                        </div>
                                    </div>
                                )}
                                {selectedCourse.startDate && (
                                    <div>
                                        <Label className="text-muted-foreground text-xs uppercase font-semibold">Start Date</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-slate-900 font-medium">{selectedCourse.startDate}</span>
                                        </div>
                                    </div>
                                )}
                                {selectedCourse.startTime && (
                                    <div>
                                        <Label className="text-muted-foreground text-xs uppercase font-semibold">Start Time</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-slate-900 font-medium">{selectedCourse.startTime}</span>
                                        </div>
                                    </div>
                                )}
                                {selectedCourse.mode === "On-site" && selectedCourse.venue && (
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground text-xs uppercase font-semibold">Venue</Label>
                                        <div className="text-slate-900 font-medium">{selectedCourse.venue}</div>
                                    </div>
                                )}
                            </div>

                            {selectedCourse.mode === "Online" && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-primary/20">
                                    <Label className="text-primary font-semibold flex items-center gap-2 text-sm">
                                        <Video className="w-4 h-4" /> Meeting Link
                                    </Label>
                                    {selectedCourse.meetLink ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <Input readOnly value={selectedCourse.meetLink} className="bg-white rounded-xl" />
                                            <Button size="icon" variant="outline" className="rounded-xl" asChild>
                                                <a href={selectedCourse.meetLink} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="mt-2 space-y-3 bg-white p-3 rounded-xl border">
                                            <div className="text-xs font-medium flex items-center gap-2 text-amber-600">
                                                <AlertCircle className="w-4 h-4" /> Schedule needed to generate Meet link.
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn("w-full justify-start text-left font-normal h-9 rounded-xl text-xs", !scheduleDate && "text-muted-foreground")}
                                                        >
                                                            {scheduleDate ? format(scheduleDate, "PPP") : <span>Date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <CalendarComponent
                                                            mode="single"
                                                            selected={scheduleDate}
                                                            onSelect={setScheduleDate}
                                                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <Select value={scheduleTime} onValueChange={setScheduleTime}>
                                                    <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue placeholder="Time" /></SelectTrigger>
                                                    <SelectContent className="h-48">
                                                        {TIME_SLOTS.map((time) => (
                                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button size="sm" onClick={handleUpdateSchedule} disabled={isUpdating} className="w-full rounded-xl bg-primary text-white">
                                                {isUpdating && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                                                Save Schedule & Generate Link
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button className="rounded-xl" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Footer ── */}
            <footer className="w-full py-8 border-t bg-card/30 mt-auto">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Yatri Cloud Trainer Portal. Empowering the next generation of cloud experts.
                    </p>
                </div>
            </footer>
        </div>
    );
};

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case "Published":
            return (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Published
                </span>
            );
        case "Review":
            return (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    In Review
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Draft
                </span>
            );
    }
};

export default TrainerDashboard;
