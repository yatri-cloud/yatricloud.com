
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

    const SCRIPT_URL = import.meta.env.VITE_TRAINING_SCRIPT_URL || import.meta.env.VITE_EVENT_FEEDBACK_SCRIPT_URL;

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
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "getAllTraining" })
            });
            const result = await response.json();
            if (result.success) {
                setCourses(result.structure);
            } else {
                toast.error("Failed to load training: " + result.error);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to connect to backend");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (courseId: string) => {
        if (!confirm("Are you sure you want to delete this training? This will also move the Drive folder to trash.")) return;

        toast.loading("Deleting training...");
        try {
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "deleteTraining", id: courseId })
            });
            const result = await response.json();
            if (result.success) {
                toast.dismiss();
                toast.success("Training deleted successfully");
                fetchCourses();
            } else {
                toast.error("Delete failed: " + result.error);
            }
        } catch (e) {
            toast.error("Network error during deletion");
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
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "updateTrainingSchedule",
                    id: selectedCourse.id,
                    startDate: formattedDate,
                    startTime: scheduleTime
                })
            });
            const result = await response.json();
            if (result.success) {
                toast.success("Schedule updated & Meet link generated!");
                // Update local state
                setSelectedCourse(prev => prev ? ({ ...prev, meetLink: result.meetLink, startDate: formattedDate, startTime: scheduleTime }) : null);
                // Refresh list
                fetchCourses();
            } else {
                toast.error("Failed: " + result.error);
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Training</h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage all training content, including drafts and published courses.
                    </p>
                </div>
                <Link to="/admin/training/create">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Create New
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search courses, providers..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={statusFilter === "All" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter("All")}
                            >
                                All
                            </Button>
                            <Button
                                variant={statusFilter === "Published" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter("Published")}
                                className="gap-2"
                            >
                                <CheckCircle2 className="w-3 h-3" /> Published
                            </Button>
                            <Button
                                variant={statusFilter === "Draft" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter("Draft")}
                                className="gap-2"
                            >
                                <Clock className="w-3 h-3" /> Drafts
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Loading training records...</p>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <AlertCircle className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                            <h3 className="text-lg font-medium">No training found</h3>
                            <p className="text-muted-foreground">
                                {searchTerm ? "Try adjusting your search or filters." : "Get started by creating your first training."}
                            </p>
                            {!searchTerm && (
                                <Link to="/admin/training" className="mt-4">
                                    <Button variant="outline">Create Training</Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course Name</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Instructor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCourses.map((course) => (
                                    <TableRow key={course.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{course.courseName}</span>
                                                <span className="text-xs text-muted-foreground font-normal">ID: {course.id.substring(0, 8)}...</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{course.subType}</TableCell>
                                        <TableCell>{course.instructor}</TableCell>
                                        <TableCell>
                                            <Badge variant={course.status === "Published" ? "default" : "secondary"}>
                                                {course.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(course.timestamp).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => toast.info("Edit feature coming soon (pre-fills form)")}>
                                                        <Edit className="w-4 h-4 mr-2" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toast.info("Edit feature coming soon (pre-fills form)")}>
                                                        <Edit className="w-4 h-4 mr-2" /> Edit Details
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
                                                        className="text-destructive focus:text-destructive"
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
                </CardContent>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Training Details</DialogTitle>
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
                                        <Badge variant={selectedCourse.status === "Published" ? "default" : "secondary"}>
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
                                <div className="bg-muted/30 p-4 rounded-lg border border-primary/20">
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
                                            <div className="text-sm font-medium flex items-center gap-2 text-yellow-600">
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
                                            <Button size="sm" onClick={handleUpdateSchedule} disabled={isUpdating} className="w-full">
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
                        <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
