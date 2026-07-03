import { useState, useEffect } from "react";
import { UserCheck, Calendar, Key, BookOpen, Trash2, ExternalLink, Star, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListPager } from "@/components/ui/list-pager";
import {
    listTrainerApplications,
    listApprovedTrainers,
    listProviders,
    listAllTrainings,
    listInstructorProfiles,
    updateInstructorProfile,
    grantMeetAccess,
    updateApplicationStatus as apiUpdateApplicationStatus,
    approveTrainer,
    rejectTrainerApplication,
    assignTrainerToCourse as apiAssignTrainerToCourse,
    deleteTrainerApplication,
    deleteTrainer,
    type ProviderData,
} from "@/lib/training-api";

interface TrainerApplication {
    timestamp: string;
    fullName: string;
    email: string;
    countryCode: string;
    phoneNumber: string;
    linkedinUrl: string;
    expertise: string;
    yearsOfExperience: string;
    motivation: string;
    status: string;
    adminNotes: string;
    resumeUrl?: string;
    certificationProvider?: string;
    credentialsLinks?: string;
}

interface Trainer {
    trainerId: string;
    email: string;
    fullName: string;
    phone: string;
    linkedIn: string;
    expertise: string;
    status: string;
    createdDate: string;
}

interface InstructorProfile {
    id?: string;
    email?: string;
    trainerId: string;
    fullName: string;
    role: string;
    bio: string;
    expertise: string;
    linkedin: string;
    rating: string;
    studentsCount: string;
    coursesCount: string;
    photoUrl: string;
}

export const AdminTrainersNew = () => {
    const { toast } = useToast();

    // Application states
    const [applications, setApplications] = useState<TrainerApplication[]>([]);
    const [filteredApplications, setFilteredApplications] = useState<TrainerApplication[]>([]);
    const [isLoadingApplications, setIsLoadingApplications] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState<TrainerApplication | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [appSearch, setAppSearch] = useState("");
    const [trainerSearch, setTrainerSearch] = useState("");
    const [appSort, setAppSort] = useState("newest");
    const [trainerSort, setTrainerSort] = useState("name");
    const [appPage, setAppPage] = useState(1);
    const [trainerPage, setTrainerPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => { setAppPage(1); }, [statusFilter, appSearch, appSort]);
    useEffect(() => { setTrainerPage(1); }, [trainerSearch, trainerSort]);

    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Assignment states
    const [allProviders, setAllProviders] = useState<ProviderData[]>([]);
    const [availableExams, setAvailableExams] = useState<string[]>([]);

    const [selectedTrainer, setSelectedTrainer] = useState("");
    const [selectedProvider, setSelectedProvider] = useState("");
    const [selectedExam, setSelectedExam] = useState("");
    const [selectedTraining, setSelectedTraining] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);

    // Meet Access states
    const [meetDialogOpen, setMeetDialogOpen] = useState(false);
    const [meetTrainerEmail, setMeetTrainerEmail] = useState("");
    const [meetTrainerName, setMeetTrainerName] = useState("");
    const [meetTrainingId, setMeetTrainingId] = useState("");
    const [allTrainings, setAllTrainings] = useState<any[]>([]);
    const [isGrantingMeet, setIsGrantingMeet] = useState(false);

    // Instructor Profile states
    const [instructorProfiles, setInstructorProfiles] = useState<InstructorProfile[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [editingProfile, setEditingProfile] = useState<InstructorProfile | null>(null);

    useEffect(() => {
        fetchApplications();
        fetchTrainers();
        fetchProviders();
        fetchTrainings();
        fetchInstructorProfiles();
    }, []);

    useEffect(() => {
        // Update available exams when a provider is selected
        if (selectedProvider && allProviders.length > 0) {
            const providerData = allProviders.find(p => p.name === selectedProvider);
            if (providerData) {
                setAvailableExams(providerData.exams || []);
                setSelectedExam("");
            }
        } else {
            setAvailableExams([]);
            setSelectedExam("");
        }
    }, [selectedProvider, allProviders]);

    useEffect(() => {
        const q = appSearch.trim().toLowerCase();
        const list = applications.filter((app) => {
            if (statusFilter !== "all" && app.status !== statusFilter) return false;
            if (!q) return true;
            return (app.fullName || "").toLowerCase().includes(q)
                || (app.email || "").toLowerCase().includes(q)
                || (app.expertise || "").toLowerCase().includes(q);
        });
        const at = (a: TrainerApplication) => (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const sorted = [...list];
        if (appSort === "oldest") sorted.sort((a, b) => at(a) - at(b));
        else if (appSort === "name") sorted.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
        else sorted.sort((a, b) => at(b) - at(a)); // newest
        setFilteredApplications(sorted);
    }, [statusFilter, applications, appSearch, appSort]);

    const trainerQuery = trainerSearch.trim().toLowerCase();
    const trainerMatched = trainerQuery
        ? trainers.filter((t) =>
            (t.fullName || "").toLowerCase().includes(trainerQuery) ||
            (t.email || "").toLowerCase().includes(trainerQuery) ||
            (t.expertise || "").toLowerCase().includes(trainerQuery) ||
            (t.trainerId || "").toLowerCase().includes(trainerQuery))
        : trainers;
    const ct = (t: Trainer) => (t.createdDate ? new Date(t.createdDate).getTime() : 0);
    const filteredTrainers = [...trainerMatched].sort((a, b) => {
        if (trainerSort === "newest") return ct(b) - ct(a);
        if (trainerSort === "oldest") return ct(a) - ct(b);
        return (a.fullName || "").localeCompare(b.fullName || ""); // name (default)
    });

    const appPageCount = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
    const currentAppPage = Math.min(appPage, appPageCount);
    const pagedApplications = filteredApplications.slice((currentAppPage - 1) * PAGE_SIZE, currentAppPage * PAGE_SIZE);
    const trainerPageCount = Math.max(1, Math.ceil(filteredTrainers.length / PAGE_SIZE));
    const currentTrainerPage = Math.min(trainerPage, trainerPageCount);
    const pagedTrainers = filteredTrainers.slice((currentTrainerPage - 1) * PAGE_SIZE, currentTrainerPage * PAGE_SIZE);

    const fetchApplications = async () => {
        try {
            setIsLoadingApplications(true);
            const applications = await listTrainerApplications();
            setApplications(applications || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to fetch applications",
                variant: "destructive",
            });
        } finally {
            setIsLoadingApplications(false);
        }
    };

    const fetchTrainers = async () => {
        try {
            setIsLoadingTrainers(true);
            const trainers = await listApprovedTrainers();
            setTrainers(trainers || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to fetch trainers",
                variant: "destructive",
            });
        } finally {
            setIsLoadingTrainers(false);
        }
    };

    const fetchProviders = async () => {
        try {
            const providers = await listProviders();
            setAllProviders(providers || []);
        } catch (error) {
            console.error("Failed to fetch providers:", error);
        }
    };

    const fetchInstructorProfiles = async () => {
        try {
            setIsLoadingProfiles(true);
            const profiles = await listInstructorProfiles();
            setInstructorProfiles(profiles || []);
        } catch (error) {
            console.error("Failed to fetch instructor profiles:", error);
        } finally {
            setIsLoadingProfiles(false);
        }
    };

    const fetchTrainings = async () => {
        try {
            const structure = await listAllTrainings();
            setAllTrainings(structure || []);
        } catch (error) {
            console.error("Failed to fetch trainings:", error);
        }
    };

    const handleSaveProfile = async () => {
        if (!editingProfile) return;

        try {
            setIsSavingProfile(true);
            await updateInstructorProfile(editingProfile);
            toast({
                title: "Success",
                description: "Instructor profile updated successfully",
            });
            await fetchInstructorProfiles();
            setEditingProfile(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const startEditingProfile = (trainer: Trainer) => {
        const existing = instructorProfiles.find(p => p.email === trainer.email);
        if (existing) {
            setEditingProfile({ ...existing });
        } else {
            setEditingProfile({
                email: trainer.email,
                trainerId: trainer.trainerId,
                fullName: trainer.fullName,
                role: "",
                bio: "",
                expertise: trainer.expertise || "",
                linkedin: trainer.linkedIn || "",
                rating: "4.8",
                studentsCount: "1,000+",
                coursesCount: "1",
                photoUrl: ""
            });
        }
    };

    const handleGrantMeetAccess = async () => {
        if (!meetTrainerEmail || !meetTrainingId) {
            toast({
                title: "Validation Error",
                description: "Please select a training to grant access for",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsGrantingMeet(true);
            const result = await grantMeetAccess({
                trainerEmail: meetTrainerEmail,
                trainingId: meetTrainingId,
            });
            toast({
                title: "Meeting link ready",
                description: result.meetLink
                    ? `${meetTrainerName} can host at ${result.meetLink}`
                    : `${meetTrainerName} can host this training.`,
            });
            setMeetDialogOpen(false);
            setMeetTrainingId("");
            await fetchTrainings();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to grant Meet access",
                variant: "destructive",
            });
        } finally {
            setIsGrantingMeet(false);
        }
    };

    const openMeetDialog = (email: string, name: string) => {
        setMeetTrainerEmail(email);
        setMeetTrainerName(name);
        setMeetTrainingId("");
        setMeetDialogOpen(true);
    };

    const updateApplicationStatus = async (email: string, status: string, adminNotes?: string) => {
        try {
            setIsProcessing(true);
            await apiUpdateApplicationStatus(email, status);
            toast({
                title: "Success",
                description: `Application ${status.toLowerCase()} successfully`,
            });
            await fetchApplications();
            setDetailsDialogOpen(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update application",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApproveTrainer = async (application: TrainerApplication) => {
        if (!confirm(`Are you sure you want to approve ${application.fullName}? They will be able to log in with their Google account.`)) return;

        try {
            setIsProcessing(true);
            await approveTrainer(application.email);
            toast({
                title: "Success",
                description: `Trainer approved! ${application.fullName} can now log in.`,
            });
            await fetchApplications();
            await fetchTrainers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to approve trainer",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectApplication = async (application: TrainerApplication) => {
        if (!confirm(`Are you sure you want to REJECT ${application.fullName}? This will revoke their access if they are already approved.`)) return;

        try {
            setIsProcessing(true);
            await rejectTrainerApplication(application.email);
            toast({
                title: "Success",
                description: "Application rejected successfully",
            });
            await fetchApplications();
            await fetchTrainers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to reject application",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const assignTrainerToCourse = async () => {
        if (!selectedTrainer || !selectedTraining) {
            toast({
                title: "Validation Error",
                description: "Please select a trainer and a training",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsAssigning(true);
            const trainer = trainers.find(t => t.trainerId === selectedTrainer);

            await apiAssignTrainerToCourse({
                trainingId: selectedTraining,
                trainerId: selectedTrainer,
                trainerName: trainer?.fullName || "",
                trainerEmail: trainer?.email || "",
            });
            toast({
                title: "Success",
                description: "Trainer assigned to the training",
            });
            setSelectedTrainer("");
            setSelectedTraining("");
            await fetchTrainings();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to assign trainer",
                variant: "destructive",
            });
        } finally {
            setIsAssigning(false);
        }
    };



    const handleDeleteApplication = async (application: TrainerApplication) => {
        if (!confirm("Are you sure you want to delete this application?")) return;

        try {
            setIsProcessing(true);
            await deleteTrainerApplication(application.email);
            toast({
                title: "Success",
                description: "Application deleted successfully",
            });
            await fetchApplications();
            setDetailsDialogOpen(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete application",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteTrainer = async (trainer: Trainer) => {
        if (!confirm(`Are you sure you want to delete trainer ${trainer.fullName}? This action cannot be undone.`)) return;

        try {
            setIsProcessing(true);
            await deleteTrainer(trainer.trainerId);
            toast({
                title: "Success",
                description: "Trainer deleted successfully",
            });
            await fetchTrainers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete trainer",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const viewDetails = (application: TrainerApplication) => {
        setSelectedApplication(application);
        setDetailsDialogOpen(true);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            Pending: "secondary",
            Approved: "default",
            Rejected: "destructive",
        };
        return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* Header band — distinct blue-tinted workspace panel */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="space-y-1.5">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Trainers hub
                        </p>
                        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Trainer Management</h1>
                        <p className="text-muted-foreground">
                            Manage trainer applications, credentials, and course assignments.
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="applications" className="space-y-6">
                <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="applications" className="min-h-[40px]">Applications</TabsTrigger>
                    <TabsTrigger value="trainers" className="min-h-[40px]">Approved Trainers</TabsTrigger>
                    <TabsTrigger value="profiles" className="min-h-[40px]">Instructor Profiles</TabsTrigger>
                    <TabsTrigger value="assignments" className="min-h-[40px]">Course Assignments</TabsTrigger>
                </TabsList>

                {/* Applications Tab */}
                <TabsContent value="applications" className="space-y-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={appSearch} onChange={(e) => setAppSearch(e.target.value)} placeholder="Search by name, email or expertise" className="pl-9 rounded-xl" />
                        </div>
                        <label className="font-medium text-sm">Filter by Status:</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[200px] rounded-xl">
                                <SelectValue placeholder="All Applications" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Applications</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={appSort} onValueChange={setAppSort}>
                            <SelectTrigger className="w-[170px] rounded-xl" aria-label="Sort applications">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest first</SelectItem>
                                <SelectItem value="oldest">Oldest first</SelectItem>
                                <SelectItem value="name">Name: A to Z</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoadingApplications ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Loading applications...</p>
                        </div>
                    ) : (
                        <Card className="border border-border rounded-2xl shadow-none">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Date</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Name</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Email</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Expertise</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Experience</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Status</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredApplications.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-16">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                            <UserCheck className="w-7 h-7" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h3 className="font-display text-lg font-semibold">No applications here</h3>
                                                            <p className="text-muted-foreground text-sm">New trainer applications will show up in this list.</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : pagedApplications.map((application, index) => (
                                            <TableRow key={index} className="hover:bg-brand-50">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                                        {formatDate(application.timestamp)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{application.fullName}</TableCell>
                                                <TableCell>{application.email}</TableCell>
                                                <TableCell><span className="text-sm">{application.expertise}</span></TableCell>
                                                <TableCell>{application.yearsOfExperience}</TableCell>
                                                <TableCell>{getStatusBadge(application.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => viewDetails(application)}
                                                        >
                                                            View
                                                        </Button>
                                                        {/* Approve Button */}
                                                        {application.status === "Pending" && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-success hover:bg-success/90"
                                                                onClick={() => handleApproveTrainer(application)}
                                                                disabled={isProcessing}
                                                            >
                                                                Approve
                                                            </Button>
                                                        )}
                                                        {/* Reject Button */}
                                                        {(application.status === "Pending" || application.status === "Approved") && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-warning hover:bg-warning/90"
                                                                onClick={() => handleRejectApplication(application)}
                                                                disabled={isProcessing}
                                                            >
                                                                Reject
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                            onClick={() => handleDeleteApplication(application)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <ListPager page={currentAppPage} pageCount={appPageCount} onPageChange={setAppPage} />
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Approved Trainers Tab */}
                <TabsContent value="trainers" className="space-y-4">
                    <Card className="border border-border rounded-2xl shadow-none">
                        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-lg">Active Trainers</CardTitle>
                                <CardDescription>Trainers with created credentials</CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input value={trainerSearch} onChange={(e) => setTrainerSearch(e.target.value)} placeholder="Search trainers" className="pl-9 h-9 rounded-xl" />
                                </div>
                                <Select value={trainerSort} onValueChange={setTrainerSort}>
                                    <SelectTrigger className="h-9 w-full rounded-xl sm:w-[150px]" aria-label="Sort trainers"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name">Name: A to Z</SelectItem>
                                        <SelectItem value="newest">Newest first</SelectItem>
                                        <SelectItem value="oldest">Oldest first</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingTrainers ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Trainer ID</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Name</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Email</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Expertise</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Created</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTrainers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-16">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                            <UserCheck className="w-7 h-7" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h3 className="font-display text-lg font-semibold">{trainers.length === 0 ? "No approved trainers yet" : "No trainers match your search"}</h3>
                                                            <p className="text-muted-foreground text-sm">{trainers.length === 0 ? "Approve an application to add your first trainer." : "Try a different name, email or expertise."}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : pagedTrainers.map((trainer) => (
                                            <TableRow key={trainer.trainerId} className="hover:bg-brand-50">
                                                <TableCell className="font-mono text-sm">{trainer.trainerId}</TableCell>
                                                <TableCell className="font-medium">{trainer.fullName}</TableCell>
                                                <TableCell>{trainer.email}</TableCell>
                                                <TableCell>{trainer.expertise}</TableCell>

                                                <TableCell>{formatDate(trainer.createdDate)}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2 flex-wrap">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openMeetDialog(trainer.email, trainer.fullName)}
                                                        >
                                                            Grant Meet Access
                                                        </Button>
                                                        {/* No Reset Password Needed for Google Auth */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                            onClick={() => handleDeleteTrainer(trainer)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                            {!isLoadingTrainers && <ListPager page={currentTrainerPage} pageCount={trainerPageCount} onPageChange={setTrainerPage} />}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Instructor Profiles Tab */}
                <TabsContent value="profiles" className="space-y-4">
                    <Card className="border border-border rounded-2xl shadow-none">
                        <CardHeader>
                            <CardTitle className="text-lg">Instructor Profiles</CardTitle>
                            <CardDescription>Manage public profiles for approved trainers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {trainers.map((trainer) => {
                                        const profile = instructorProfiles.find(p => p.email === trainer.email);
                                        return (
                                            <Card key={trainer.trainerId} className="overflow-hidden border border-border rounded-2xl shadow-none hover:border-brand-200 hover:shadow-card transition">
                                                <CardHeader className="pb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                                                            {profile?.photoUrl ? (
                                                                <img src={profile.photoUrl} alt={trainer.fullName} className="w-full h-full rounded-full object-cover" />
                                                            ) : trainer.fullName.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <CardTitle className="text-lg truncate">{trainer.fullName}</CardTitle>
                                                            <CardDescription className="line-clamp-1">{profile?.role || "No role set"}</CardDescription>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pb-4">
                                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 h-[60px]">
                                                        {profile?.bio || "No biography provided yet."}
                                                    </p>
                                                    <div className="flex justify-between text-xs font-medium bg-muted/40 p-2.5 rounded-xl tabular-nums">
                                                        <span title="Rating" className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-primary" /> {profile?.rating || "4.8"}</span>
                                                        <span title="Students" className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-muted-foreground" /> {profile?.studentsCount || "0"}</span>
                                                        <span title="Courses" className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-muted-foreground" /> {profile?.coursesCount || "0"}</span>
                                                    </div>
                                                </CardContent>
                                                <div className="p-4 bg-muted/40 border-t border-border flex justify-end">
                                                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => startEditingProfile(trainer)}>
                                                        Edit Profile
                                                    </Button>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>

                                {trainers.length === 0 && !isLoadingTrainers && (
                                    <div className="text-center py-16 border border-dashed border-border rounded-2xl flex flex-col items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <UserCheck className="w-7 h-7" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-display text-lg font-semibold">No profiles to manage yet</h3>
                                            <p className="text-muted-foreground text-sm">Approve trainers first to build their public profiles.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edit Profile Dialog */}
                    <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Edit Instructor Profile</DialogTitle>
                                <DialogDescription>Update the public profile for {editingProfile?.fullName}</DialogDescription>
                            </DialogHeader>

                            {editingProfile && (
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role / Headline</Label>
                                            <Input
                                                id="role"
                                                value={editingProfile.role}
                                                onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value })}
                                                placeholder="e.g. Cloud Expert & Senior Architect"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="photoUrl">Photo URL</Label>
                                            <Input
                                                id="photoUrl"
                                                value={editingProfile.photoUrl}
                                                onChange={(e) => setEditingProfile({ ...editingProfile, photoUrl: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expertise">Expertise</Label>
                                            <Input
                                                id="expertise"
                                                value={editingProfile.expertise}
                                                onChange={(e) => setEditingProfile({ ...editingProfile, expertise: e.target.value })}
                                                placeholder="e.g. AWS, Kubernetes, DevOps"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="linkedin">LinkedIn URL</Label>
                                            <Input
                                                id="linkedin"
                                                value={editingProfile.linkedin}
                                                onChange={(e) => setEditingProfile({ ...editingProfile, linkedin: e.target.value })}
                                                placeholder="https://linkedin.com/in/..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Biography</Label>
                                        <Textarea
                                            id="bio"
                                            value={editingProfile.bio}
                                            onChange={(e) => setEditingProfile({ ...editingProfile, bio: e.target.value })}
                                            placeholder="Write a short professional bio..."
                                            rows={5}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="rating">Rating</Label>
                                            <Input
                                                id="rating"
                                                value={editingProfile.rating}
                                                onChange={(e) => setEditingProfile({ ...editingProfile, rating: e.target.value })}
                                                placeholder="4.8"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="students">Students Count</Label>
                                            <Input
                                                id="students"
                                                value={editingProfile.studentsCount}
                                                onChange={(e) => setEditingProfile({ ...editingProfile, studentsCount: e.target.value })}
                                                placeholder="12,450+"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="courses">Courses Count</Label>
                                            <Input
                                                id="courses"
                                                value={editingProfile.coursesCount}
                                                onChange={(e) => setEditingProfile({ ...editingProfile, coursesCount: e.target.value })}
                                                placeholder="15"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingProfile(null)}>Cancel</Button>
                                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                                    {isSavingProfile ? "Saving..." : "Save"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* Course Assignments Tab */}
                <TabsContent value="assignments" className="space-y-4">
                    <Card className="border border-border rounded-2xl shadow-none max-w-3xl">
                        <CardHeader>
                            <CardTitle className="text-lg">Assign Trainer to a Training</CardTitle>
                            <CardDescription>Pick an approved trainer and a training to set them as the instructor</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Select Trainer</Label>
                                    <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a trainer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {trainers.map((trainer) => (
                                                <SelectItem key={trainer.trainerId} value={trainer.trainerId}>
                                                    {trainer.fullName} ({trainer.expertise})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Select Training</Label>
                                    <Select value={selectedTraining} onValueChange={setSelectedTraining}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a training" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allTrainings.map((training: any) => (
                                                <SelectItem key={training.id} value={training.id}>
                                                    {training.courseName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                onClick={assignTrainerToCourse}
                                disabled={isAssigning || !selectedTrainer || !selectedTraining}
                                className="w-full bg-primary text-primary-foreground rounded-xl shadow-inset-btn hover:bg-brand-600 min-h-[44px]"
                            >
                                {isAssigning ? "Assigning..." : "Assign Trainer"}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Application Details Dialog - keeping original */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Trainer Application Details</DialogTitle>
                        <DialogDescription>Review the complete trainer application</DialogDescription>
                    </DialogHeader>

                    {selectedApplication && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    {getStatusBadge(selectedApplication.status)}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Applied on</p>
                                    <p className="font-medium">{formatDate(selectedApplication.timestamp)}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                                    <p className="text-lg font-semibold">{selectedApplication.fullName}</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                                        <p>{selectedApplication.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                                        <p>{selectedApplication.countryCode} {selectedApplication.phoneNumber}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">LinkedIn Profile</p>
                                    <a
                                        href={selectedApplication.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {selectedApplication.linkedinUrl}
                                    </a>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Area of Expertise</p>
                                        <p>{selectedApplication.expertise}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Years of Experience</p>
                                        <p>{selectedApplication.yearsOfExperience} {isNaN(Number(selectedApplication.yearsOfExperience)) ? '' : 'years'}</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Credentials / Portfolio</p>
                                        {(() => {
                                            try {
                                                if (!selectedApplication.credentialsLinks) return <p className="text-muted-foreground">N/A</p>;

                                                // Try parsing as JSON first
                                                const creds = JSON.parse(selectedApplication.credentialsLinks);
                                                if (Array.isArray(creds) && creds.length > 0) {
                                                    return (
                                                        <div className="space-y-1">
                                                            {creds.map((c: any, idx: number) => (
                                                                <div key={idx} className="text-sm">
                                                                    <span className="font-medium">{c.providerName}: </span>
                                                                    <a
                                                                        href={c.link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary hover:underline"
                                                                    >
                                                                        Click here to view
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                // Fallback for non-JSON strings
                                                return (
                                                    <a
                                                        href={selectedApplication.credentialsLinks}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline truncate block"
                                                    >
                                                        Click here to view
                                                    </a>
                                                );
                                            } catch (e) {
                                                // Fallback if parse error
                                                return (
                                                    <a
                                                        href={selectedApplication.credentialsLinks}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline truncate block"
                                                    >
                                                        {selectedApplication.credentialsLinks}
                                                    </a>
                                                );
                                            }
                                        })()}
                                    </div>
                                    <div>
                                        {/* Removed Certification Provider as per request */}
                                    </div>
                                </div>

                                {selectedApplication.resumeUrl && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Resume / CV</p>
                                        <a
                                            href={selectedApplication.resumeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors text-primary"
                                        >
                                            View Uploaded Resume
                                            <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                                        </a>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Motivation</p>
                                    <p className="bg-muted p-4 rounded-lg">{selectedApplication.motivation}</p>
                                </div>
                            </div>

                            {selectedApplication.status === "Pending" && (
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        className="flex-1"
                                        variant="default"
                                        onClick={() => handleApproveTrainer(selectedApplication)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? " Processing..." : "Approve & Grant Access"}
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        variant="destructive"
                                        onClick={() => handleRejectApplication(selectedApplication)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? "Processing..." : "Reject Application"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Grant Meet Access Dialog */}
            <Dialog open={meetDialogOpen} onOpenChange={setMeetDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set the meeting link</DialogTitle>
                        <DialogDescription>
                            Pick a training to set a working meeting link for <strong>{meetTrainerName}</strong> to host.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Trainer Email</Label>
                            <Input value={meetTrainerEmail} disabled className="bg-muted" />
                        </div>
                        <div>
                            <Label>Select Training</Label>
                            <Select value={meetTrainingId} onValueChange={setMeetTrainingId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a training..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allTrainings.map((training: any) => (
                                        <SelectItem key={training.id} value={training.id}>
                                            {training.courseName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleGrantMeetAccess}
                            disabled={isGrantingMeet || !meetTrainingId}
                            className="w-full bg-primary text-primary-foreground rounded-xl shadow-inset-btn hover:bg-brand-600 min-h-[44px]"
                        >
                            {isGrantingMeet ? "Saving..." : "Set Meeting Link"}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            This sets a working meeting link on the training that the trainer and enrolled students can join.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminTrainersNew;
