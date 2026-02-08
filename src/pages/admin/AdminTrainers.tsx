import { useState, useEffect } from "react";
import { UserCheck, CheckCircle, XCircle, Eye, Calendar, Key, UserCog, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}

interface Trainer {
    trainerId: string;
    email: string;
    fullName: string;
    phone: string;
    linkedIn: string;
    expertise: string;
    username: string;
    status: string;
    createdDate: string;
}

interface ProviderData {
    type: string;
    name: string;
    exams: string[];
    exists: boolean;
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

    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Trainer states
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
    const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isCreatingCredentials, setIsCreatingCredentials] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [credentialMode, setCredentialMode] = useState<"create" | "reset">("create");

    // Assignment states
    // Assignment states
    const [allProviders, setAllProviders] = useState<ProviderData[]>([]);
    const [availableExams, setAvailableExams] = useState<string[]>([]);

    const [selectedTrainer, setSelectedTrainer] = useState("");
    const [selectedProvider, setSelectedProvider] = useState("");
    const [selectedExam, setSelectedExam] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        fetchApplications();
        fetchTrainers();
        fetchProviders();
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
        if (statusFilter === "all") {
            setFilteredApplications(applications);
        } else {
            setFilteredApplications(applications.filter(app => app.status === statusFilter));
        }
    }, [statusFilter, applications]);

    const fetchApplications = async () => {
        try {
            setIsLoadingApplications(true);
            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: "getTrainerApplications" }),
                }
            );
            const result = await response.json();
            if (result.success) {
                setApplications(result.applications || []);
            }
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
            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: "getApprovedTrainers" }),
                }
            );
            const result = await response.json();
            if (result.success) {
                setTrainers(result.trainers || []);
            }
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
            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: "getProviders" }),
                }
            );
            const result = await response.json();
            if (result.success) {
                setAllProviders(result.providers || []);
            }
        } catch (error) {
            console.error("Failed to fetch providers:", error);
        }
    };

    const updateApplicationStatus = async (email: string, status: string, adminNotes?: string) => {
        try {
            setIsUpdating(true);
            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({
                        action: "updateApplicationStatus",
                        email,
                        status,
                        adminNotes: adminNotes || "",
                    }),
                }
            );
            const result = await response.json();
            if (result.success) {
                toast({
                    title: "Success",
                    description: `Application ${status.toLowerCase()} successfully`,
                });
                await fetchApplications();
                setDetailsDialogOpen(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update application",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCredentialSubmit = async () => {
        if (!password) {
            toast({
                title: "Validation Error",
                description: "Please provide a password",
                variant: "destructive",
            });
            return;
        }

        if (credentialMode === "create" && !username) {
            toast({
                title: "Validation Error",
                description: "Please provide a username",
                variant: "destructive",
            });
            return;
        }

        try {
            if (credentialMode === "create") {
                setIsCreatingCredentials(true);
                const response = await fetch(
                    import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                    {
                        method: "POST",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({
                            action: "createTrainerCredentials",
                            email: selectedEmail,
                            username,
                            password,
                        }),
                    }
                );
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: `Credentials created for ${username}`,
                    });
                    setCredentialsDialogOpen(false);
                    setUsername("");
                    setPassword("");
                    await fetchTrainers();
                } else {
                    throw new Error(result.error);
                }
            } else {
                // Reset Password Mode
                setIsResettingPassword(true);
                const response = await fetch(
                    import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                    {
                        method: "POST",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({
                            action: "resetTrainerPassword",
                            email: selectedEmail,
                            newPassword: password,
                        }),
                    }
                );
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Password reset successfully",
                    });
                    setCredentialsDialogOpen(false);
                    setPassword("");
                } else {
                    throw new Error(result.error);
                }
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to process request",
                variant: "destructive",
            });
        } finally {
            setIsCreatingCredentials(false);
            setIsResettingPassword(false);
        }
    };

    const assignTrainerToCourse = async () => {
        if (!selectedTrainer || !selectedProvider || !selectedExam) {
            toast({
                title: "Validation Error",
                description: "Please select trainer, certification provider, and exam",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsAssigning(true);
            const trainer = trainers.find(t => t.trainerId === selectedTrainer);

            // Construct a Course ID since we are using Provider/Exam structure
            const courseId = `${selectedProvider}_${selectedExam}`.replace(/\s+/g, '_').toUpperCase();

            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({
                        action: "assignTrainerToCourse",
                        trainerId: selectedTrainer,
                        trainerName: trainer?.fullName || "",
                        courseId: courseId,
                        courseName: selectedExam,
                        provider: selectedProvider,
                        examName: selectedExam
                    }),
                }
            );
            const result = await response.json();
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Trainer assigned to course successfully",
                });
                setSelectedTrainer("");
                setSelectedProvider("");
                setSelectedExam("");
            } else {
                throw new Error(result.error);
            }
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

    const handleApprove = () => {
        if (selectedApplication) {
            updateApplicationStatus(
                selectedApplication.email,
                "Approved",
                "Application approved - ready for credential creation"
            );
        }
    };

    const handleReject = () => {
        if (selectedApplication) {
            updateApplicationStatus(
                selectedApplication.email,
                "Rejected",
                "Application rejected after review"
            );
        }
    };

    const handleDeleteApplication = async (application: TrainerApplication) => {
        if (!confirm("Are you sure you want to delete this application?")) return;

        try {
            setIsDeleting(true);
            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({
                        action: "deleteTrainerApplication",
                        email: application.email,
                    }),
                }
            );
            const result = await response.json();
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Application deleted successfully",
                });
                await fetchApplications();
                setDetailsDialogOpen(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete application",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteTrainer = async (trainer: Trainer) => {
        if (!confirm(`Are you sure you want to delete trainer ${trainer.fullName}? This action cannot be undone.`)) return;

        try {
            setIsDeleting(true);
            const response = await fetch(
                import.meta.env.VITE_TRAINING_SCRIPT_URL || "",
                {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({
                        action: "deleteTrainer",
                        email: trainer.email,
                        trainerId: trainer.trainerId
                    }),
                }
            );
            const result = await response.json();
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Trainer deleted successfully",
                });
                await fetchTrainers();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete trainer",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const openCredentialsDialog = (email: string, mode: "create" | "reset" = "create") => {
        setSelectedEmail(email);
        setCredentialMode(mode);
        // If resetting, username is not needed or editable normally, but let's clear it just in case
        if (mode === "reset") {
            setUsername("");
        }
        setCredentialsDialogOpen(true);
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
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <UserCheck className="w-8 h-8 text-primary" />
                    Trainer Management
                </h1>
                <p className="text-muted-foreground">
                    Manage trainer applications, credentials, and course assignments
                </p>
            </div>

            <Tabs defaultValue="applications" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                    <TabsTrigger value="trainers">Approved Trainers</TabsTrigger>
                    <TabsTrigger value="assignments">Course Assignments</TabsTrigger>
                </TabsList>

                {/* Applications Tab */}
                <TabsContent value="applications" className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <label className="font-medium">Filter by Status:</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Applications" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Applications</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoadingApplications ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b- border-primary mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Loading applications...</p>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Expertise</TableHead>
                                            <TableHead>Experience</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredApplications.map((application, index) => (
                                            <TableRow key={index}>
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
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            View
                                                        </Button>
                                                        {application.status === "Approved" && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => openCredentialsDialog(application.email, "create")}
                                                            >
                                                                <Key className="w-4 h-4 mr-1" />
                                                                Create Credentials
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Approved Trainers Tab */}
                <TabsContent value="trainers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Trainers</CardTitle>
                            <CardDescription>Trainers with created credentials</CardDescription>
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
                                            <TableHead>Trainer ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Expertise</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trainers.map((trainer) => (
                                            <TableRow key={trainer.trainerId}>
                                                <TableCell className="font-mono text-sm">{trainer.trainerId}</TableCell>
                                                <TableCell className="font-medium">{trainer.fullName}</TableCell>
                                                <TableCell>{trainer.email}</TableCell>
                                                <TableCell className="font-semibold text-primary">{trainer.username}</TableCell>
                                                <TableCell>{trainer.expertise}</TableCell>
                                                <TableCell>{formatDate(trainer.createdDate)}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openCredentialsDialog(trainer.email, "reset")}
                                                    >
                                                        <Key className="w-4 h-4 mr-1" />
                                                        Reset Password
                                                    </Button>

                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="ml-2"
                                                        onClick={() => handleDeleteTrainer(trainer)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Course Assignments Tab */}
                <TabsContent value="assignments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assign Trainer to Certification Provider</CardTitle>
                            <CardDescription>Link trainers with specific certification providers and exams</CardDescription>
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
                                    <Label>Certification Provider</Label>
                                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allProviders.map((provider) => (
                                                <SelectItem key={provider.name} value={provider.name}>
                                                    {provider.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Exam Name</Label>
                                    <Select value={selectedExam} onValueChange={setSelectedExam} disabled={!selectedProvider}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select exam" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableExams.map((exam) => (
                                                <SelectItem key={exam} value={exam}>
                                                    {exam}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                onClick={assignTrainerToCourse}
                                disabled={isAssigning || !selectedTrainer || !selectedProvider || !selectedExam}
                                className="w-full"
                            >
                                <UserCog className="w-4 h-4 mr-2" />
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
                                        <p>{selectedApplication.yearsOfExperience}</p>
                                    </div>
                                </div>

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
                                        onClick={handleApprove}
                                        disabled={isUpdating}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {isUpdating ? " Processing..." : "Approve"}
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={isUpdating}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        {isUpdating ? "Processing..." : "Reject"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Credential Creation Dialog */}
            <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {credentialMode === "create" ? "Create Trainer Credentials" : "Reset Trainer Password"}
                        </DialogTitle>
                        <DialogDescription>
                            {credentialMode === "create"
                                ? "Create login credentials for the approved trainer"
                                : "Enter a new password for the trainer"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Trainer Email</Label>
                            <Input value={selectedEmail} disabled className="bg-muted" />
                        </div>
                        {credentialMode === "create" && (
                            <div>
                                <Label>Select Username</Label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. name.training"
                                />
                            </div>
                        )}
                        <div>
                            <Label>{credentialMode === "create" ? "Initial Password" : "New Password"}</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={credentialMode === "create" ? "Create secure password" : "Enter new password"}
                            />
                        </div>
                        <Button
                            onClick={handleCredentialSubmit}
                            disabled={isCreatingCredentials || isResettingPassword}
                            className="w-full"
                        >
                            {(isCreatingCredentials || isResettingPassword)
                                ? "Processing..."
                                : (credentialMode === "create" ? "Create Credentials" : "Reset Password")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminTrainersNew;
