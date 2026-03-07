import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, LogOut, User, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TrainerData {
    trainerId: string;
    fullName: string;
    email: string;
    phone: string;
    expertise: string;
}

interface Assignment {
    assignmentId: string;
    courseId: string;
    courseName: string;
    assignedDate: string;
}

export const TrainerDashboard = () => {
    const navigate = useNavigate();
    const [trainerData, setTrainerData] = useState<TrainerData | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    useEffect(() => {
        // Check if trainer is logged in
        const storedTrainer = localStorage.getItem("trainerData");
        const storedAssignments = localStorage.getItem("trainerAssignments");

        if (!storedTrainer) {
            navigate("/trainer/login");
            return;
        }

        setTrainerData(JSON.parse(storedTrainer));
        setAssignments(JSON.parse(storedAssignments || "[]"));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("trainerData");
        localStorage.removeItem("trainerAssignments");
        navigate("/trainer/login");
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    if (!trainerData) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
                                alt="Yatri Cloud"
                                className="h-10 w-10"
                            />
                            <div>
                                <h1 className="text-2xl font-bold">Trainer Portal</h1>
                                <p className="text-sm text-muted-foreground">
                                    {trainerData.fullName}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
                    <p className="text-muted-foreground">
                        Manage your assigned courses and create engaging content for students.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Assigned Courses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{assignments.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Expertise Area</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{trainerData.expertise}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Trainer ID</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-lg">{trainerData.trainerId}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assigned Courses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Assigned Courses
                        </CardTitle>
                        <CardDescription>
                            Courses you're responsible for creating content
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {assignments.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No courses assigned yet</p>
                                <p className="text-sm">Contact admin for course assignments</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {assignments.map((assignment) => (
                                    <div
                                        key={assignment.assignmentId}
                                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold mb-1">
                                                    {assignment.courseName}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    Assigned on {formatDate(assignment.assignedDate)}
                                                </p>
                                                <Badge variant="secondary">
                                                    Course ID: {assignment.courseId}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/trainer/course/${assignment.courseId}/edit`)}
                                            >
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                Manage Course
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Profile Section */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{trainerData.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{trainerData.phone}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Trainer ID</p>
                                <p className="font-mono text-sm">{trainerData.trainerId}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default TrainerDashboard;
