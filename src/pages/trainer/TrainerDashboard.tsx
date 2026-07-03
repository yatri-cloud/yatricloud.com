import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    ExternalLink,
    Loader2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye,
    Video,
    MapPin,
    Calendar,
    LayoutDashboard
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
import Navbar from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { listTrainerTrainings, deleteTraining, updateTrainingSchedule } from "@/lib/training-api";

interface TrainerData {
    trainerId: string;
    fullName: string;
    email: string;
    phone: string;
    expertise: string;
}

interface Course {
    id: string; // The backend might use assignmentId or courseId if mocked, but Admin uses id based on the sheet row
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

// Generate time slots (15 min intervals)
const TIME_SLOTS = Array.from({ length: 96 }).map((_, i) => {
    const hour = Math.floor(i / 4).toString().padStart(2, '0');
    const minute = ((i % 4) * 15).toString().padStart(2, '0');
    return `${hour}:${minute}`;
});

export const TrainerDashboard = () => {
    const navigate = useNavigate();
    const [trainerData, setTrainerData] = useState<TrainerData | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Published" | "Review" | "Draft">("All");
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Schedule Update State
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
    const [scheduleTime, setScheduleTime] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // Check if trainer is logged in
        const storedTrainer = localStorage.getItem("trainerData");
        
        if (!storedTrainer) {
            navigate("/trainer/login");
            return;
        }

        const parsedTrainer = JSON.parse(storedTrainer);
        setTrainerData(parsedTrainer);
        fetchCourses(parsedTrainer.trainerId);
    }, [navigate]);

    useEffect(() => {
        let result = courses;

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(c =>
                (c.courseName && c.courseName.toLowerCase().includes(q)) ||
                (c.subType && c.subType.toLowerCase().includes(q))
            );
        }

        if (statusFilter !== "All") {
            result = result.filter(c => c.status === statusFilter);
        }

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
            const result = await updateTrainingSchedule(selectedCourse.id, { startDate: formattedDate, startTime: scheduleTime });
            toast.success("Schedule saved. The meeting link is set for your students.");
            setSelectedCourse(prev => prev ? ({ ...prev, meetLink: result.meetLink, startDate: formattedDate, startTime: scheduleTime }) : null);
            fetchCourses(trainerData!.trainerId);
        } catch (e: any) {
            toast.error("Failed: " + (e?.message || "Network error"));
        } finally {
            setIsUpdating(false);
        }
    };

    if (!trainerData) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center">
            <SEO title="Trainer Dashboard | Yatri Cloud" description="Manage your assigned courses and student progress." />
            <Navbar />
            
            <div className="w-full max-w-7xl px-4 pt-24 pb-12 flex flex-col gap-6">
                
                {/* Clean Header Bar instead of massive hero */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Trainer Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back, <span className="font-medium text-foreground">{trainerData.fullName}</span>. Manage your course curriculum below.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/trainer/course/create">
                            <Button className="gap-2 shadow-sm font-semibold">
                                Create New Course
                            </Button>
                        </Link>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    Profile Details
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-4">
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
                                    <Button variant="destructive" className="w-full mt-2" onClick={handleLogout}>
                                        Logout
                                    </Button>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border shadow-sm">
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{courses.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Published Live</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {courses.filter(c => c.status === 'Published').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts / In Review</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-500">
                                {courses.filter(c => c.status === 'Review' || c.status === 'Draft').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Table replacing the Card Grid */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search your courses..."
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
                                    Live
                                </Button>
                                <Button
                                    variant={statusFilter === "Review" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setStatusFilter("Review")}
                                    className="gap-2"
                                >
                                    Review
                                </Button>
                                <Button
                                    variant={statusFilter === "Draft" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setStatusFilter("Draft")}
                                    className="gap-2"
                                >
                                    Drafts
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-muted-foreground">Loading your curriculum...</p>
                            </div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                <AlertCircle className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                                <h3 className="text-lg font-medium">No courses found</h3>
                                <p className="text-muted-foreground">
                                    {searchTerm ? "Try adjusting your search or filters." : "Get started by creating your first course."}
                                </p>
                                {!searchTerm && (
                                    <Link to="/trainer/course/create" className="mt-4">
                                        <Button variant="outline">Create Course</Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Course Name</TableHead>
                                        <TableHead>Category / Provider</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCourses.map((course) => (
                                        <TableRow key={course.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{course.courseName}</span>
                                                    {course.subType && (
                                                        <span className="text-xs text-muted-foreground font-normal">{course.subType}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{course.subType}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={course.status} />
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
                                                        <DropdownMenuItem asChild>
                                                            <Link to={`/trainer/course/${course.id}/edit`} className="cursor-pointer">
                                                                <Edit className="w-4 h-4 mr-2 text-primary" /> Edit Curriculum
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
                                                        <Separator className="my-1"/>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive cursor-pointer"
                                                            onClick={() => handleDelete(course.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete Draft
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
            </div>

            {/* View Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Course Details</DialogTitle>
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
                                    <Label className="text-muted-foreground">Category/Provider</Label>
                                    <div className="font-semibold">{selectedCourse.subType}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Instructor</Label>
                                    <div className="font-semibold">{selectedCourse.instructor}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">
                                        <StatusBadge status={selectedCourse.status} />
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
                                        <Video className="w-4 h-4" /> Meeting Link
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
                                        </>
                                    ) : (
                                        <div className="mt-2 space-y-3 bg-card p-3 rounded border">
                                            <div className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                                                <AlertCircle className="w-4 h-4" /> Schedule needed to generate Meet link.
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
                        <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <footer className="w-full py-8 border-t bg-card/30 mt-auto">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Yatri Cloud Trainer Portal. Empowering the next generation of cloud experts.
                    </p>
                </div>
            </footer>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'Published':
            return (
                <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20 px-2 py-0.5 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3 mr-1 inline-block" /> Live
                </Badge>
            );
        case 'Review':
            return (
                <Badge className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border-orange-500/20 px-2 py-0.5 whitespace-nowrap">
                    <Clock className="w-3 h-3 mr-1 inline-block" /> In Review
                </Badge>
            );
        case 'Draft':
        default:
            return (
                <Badge variant="secondary" className="px-2 py-0.5 whitespace-nowrap text-muted-foreground border-border">
                    <AlertCircle className="w-3 h-3 mr-1 inline-block" /> Draft
                </Badge>
            );
    }
};

export default TrainerDashboard;
