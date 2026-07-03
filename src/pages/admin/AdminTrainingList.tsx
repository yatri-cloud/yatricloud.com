
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    ExternalLink,
    Plus,
    Loader2,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye,
    Video,
    MapPin,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAllTrainings, deleteTraining, updateTrainingSchedule } from "@/lib/training-api";

interface Course {
    id: string;
    courseName: string;
    subType: string;
    instructor: string;
    status: "Draft" | "Published";
    timestamp: string;
    folderUrl: string;
    startDate?: string;
    startTime?: string;
    meetLink?: string;
    mode?: "Online" | "On-site";
    venue?: string;
}

// Generate time slots (15 min intervals)
const TIME_SLOTS = Array.from({ length: 96 }).map((_, i) => {
    const hour = Math.floor(i / 4).toString().padStart(2, '0');
    const minute = ((i % 4) * 15).toString().padStart(2, '0');
    return `${hour}:${minute}`;
});

export default function AdminTrainingList() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Published" | "Draft">("All");
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Schedule Update State
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
    const [scheduleTime, setScheduleTime] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        let result = courses;

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.courseName.toLowerCase().includes(q) ||
                c.subType.toLowerCase().includes(q) ||
                c.instructor.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== "All") {
            result = result.filter(c => c.status === statusFilter);
        }

        setFilteredCourses(result);
    }, [searchTerm, statusFilter, courses]);

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const structure = await listAllTrainings();
            setCourses(structure as unknown as Course[]);
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to load training: " + (e?.message || "Failed to connect to backend"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (courseId: string) => {
        if (!confirm("Are you sure you want to delete this training? This will also move the Drive folder to trash.")) return;

        toast.loading("Deleting training...");
        try {
            await deleteTraining(courseId);
            toast.dismiss();
            toast.success("Training deleted successfully");
            fetchCourses();
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
            const result = await updateTrainingSchedule(selectedCourse.id, formattedDate, scheduleTime);
            toast.success("Schedule updated & Meet link generated!");
            // Update local state
            setSelectedCourse(prev => prev ? ({ ...prev, meetLink: result.meetLink, startDate: formattedDate, startTime: scheduleTime }) : null);
            // Refresh list
            fetchCourses();
        } catch (e: any) {
            toast.error("Failed: " + (e?.message || "Network error"));
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* Header band — distinct blue-tinted workspace panel */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="space-y-1.5">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Training courses
                        </p>
                        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Manage Training</h1>
                        <p className="text-muted-foreground">
                            View and manage all training content, including drafts and published courses.
                        </p>
                    </div>
                    <Link to="/admin/training/create" className="self-start md:self-auto">
                        <Button className="gap-2 rounded-xl min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">
                            <Plus className="w-4 h-4" /> Create New
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="border border-border rounded-2xl bg-card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-border">
                    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search courses, providers..."
                                className="pl-9 min-h-[44px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={statusFilter === "All" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter("All")}
                                className={cn("rounded-full min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring", statusFilter === "All" && "bg-primary text-primary-foreground hover:bg-brand-600")}
                            >
                                All
                            </Button>
                            <Button
                                variant={statusFilter === "Published" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter("Published")}
                                className={cn("gap-2 rounded-full min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring", statusFilter === "Published" && "bg-primary text-primary-foreground hover:bg-brand-600")}
                            >
                                <CheckCircle2 className="w-3 h-3" /> Published
                            </Button>
                            <Button
                                variant={statusFilter === "Draft" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter("Draft")}
                                className={cn("gap-2 rounded-full min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring", statusFilter === "Draft" && "bg-primary text-primary-foreground hover:bg-brand-600")}
                            >
                                <Clock className="w-3 h-3" /> Drafts
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Loading training records...</p>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="rounded-2xl bg-primary/10 text-primary p-4 mb-4">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="font-display text-lg font-semibold">No training found</h3>
                            <p className="text-muted-foreground mt-1">
                                {searchTerm ? "Try adjusting your search or filters." : "Get started by creating your first training."}
                            </p>
                            {!searchTerm && (
                                <Link to="/admin/training/create" className="mt-5">
                                    <Button className="rounded-xl min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring gap-2">
                                        <Plus className="w-4 h-4" /> Create Training
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Course Name</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Provider</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Instructor</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Status</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Date Created</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border">
                                {filteredCourses.map((course) => (
                                    <TableRow key={course.id} className="text-sm hover:bg-brand-50">
                                        <TableCell className="font-medium px-4 py-3">
                                            <div className="flex flex-col">
                                                <span>{course.courseName}</span>
                                                {course.slug && (
                                                    <span className="text-xs text-muted-foreground font-normal">{course.slug}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">{course.subType}</TableCell>
                                        <TableCell className="px-4 py-3">{course.instructor}</TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge className={`rounded-full text-xs font-medium ${course.status === "Published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                                                {course.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm px-4 py-3 tabular-nums">
                                            {new Date(course.timestamp).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" aria-label="Open course actions" className="focus-visible:ring-2 focus-visible:ring-ring">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem asChild>
                                                        <Link to={`/admin/training/edit/${course.id}`} className="cursor-pointer">
                                                            <Edit className="w-4 h-4 mr-2" /> Edit Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedCourse(course);
                                                        setScheduleDate(course.startDate ? new Date(course.startDate) : undefined);
                                                        setScheduleTime(course.startTime || "");
                                                        setIsDetailsOpen(true);
                                                    }}>
                                                        <Eye className="w-4 h-4 mr-2" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                                        onClick={() => handleDelete(course.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display">Training Details</DialogTitle>
                        <DialogDescription>Full information for {selectedCourse?.courseName}</DialogDescription>
                    </DialogHeader>
                    {selectedCourse && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Course Name</Label>
                                    <div className="font-semibold">{selectedCourse.courseName}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Provider/Sub-Type</Label>
                                    <div className="font-semibold">{selectedCourse.subType}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Instructor</Label>
                                    <div className="font-semibold">{selectedCourse.instructor}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div>
                                        <Badge className={`rounded-full text-xs font-medium ${selectedCourse.status === "Published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                                            {selectedCourse.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                {selectedCourse.mode && (
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground">Delivery Mode</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {selectedCourse.mode === "Online" ? <Video className="w-4 h-4 text-primary" /> : <MapPin className="w-4 h-4 text-primary" />}
                                            <span className="font-medium">{selectedCourse.mode}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedCourse.startDate && (
                                    <div>
                                        <Label className="text-muted-foreground">Start Date</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span>{selectedCourse.startDate}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedCourse.startTime && (
                                    <div>
                                        <Label className="text-muted-foreground">Start Time</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span>{selectedCourse.startTime}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedCourse.mode === "On-site" && selectedCourse.venue && (
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground">Venue</Label>
                                        <div>{selectedCourse.venue}</div>
                                    </div>
                                )}
                            </div>

                            {selectedCourse.mode === "Online" && (
                                <div className="bg-muted/30 p-4 rounded-2xl border border-primary/20">
                                    <Label className="text-primary font-semibold flex items-center gap-2">
                                        <Video className="w-4 h-4" /> Google Meet Link
                                    </Label>
                                    {selectedCourse.meetLink ? (
                                        <>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Input readOnly value={selectedCourse.meetLink} className="bg-background" />
                                                <Button size="icon" variant="outline" asChild>
                                                    <a href={selectedCourse.meetLink} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                This link is automatically generated and shared with enrolled students.
                                            </p>
                                        </>
                                    ) : (
                                        <div className="mt-2 space-y-3 bg-card p-3 rounded border">
                                            <div className="text-sm font-medium flex items-center gap-2 text-warning">
                                                <AlertCircle className="w-4 h-4" /> Link needed? Set schedule to generate.
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal h-9",
                                                                !scheduleDate && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            {scheduleDate ? format(scheduleDate, "PPP") : <span>Date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <CalendarComponent
                                                            mode="single"
                                                            selected={scheduleDate}
                                                            onSelect={setScheduleDate}
                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <Select value={scheduleTime} onValueChange={setScheduleTime}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Time" />
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
                                            <Button size="sm" onClick={handleUpdateSchedule} disabled={isUpdating} className="w-full rounded-xl min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">
                                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Video className="w-3 h-3 mr-2" />}
                                                Generate Link
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button className="rounded-xl min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </div>
        </div >
    );
}
