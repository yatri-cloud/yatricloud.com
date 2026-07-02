import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    BookOpen,
    Calendar,
    Video,
    MapPin,
    ArrowLeft,
    Loader2,
    User,
    Clock,
    GraduationCap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { getStoredUser } from "@/lib/yatris-api";
import { listMyEnrollments } from "@/lib/training-api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface Enrollment {
    trainingId: string;
    trainingName: string;
    status: string;
    paymentStatus: string;
    amount: string;
    currency: string;
    timestamp: string;
    userEmail: string;
}

interface TrainingDetails {
    id: string;
    courseName: string;
    thumbnailUrl: string;
    mode: "Online" | "On-site";
    venue?: string;
    startDate?: string;
    startTime?: string;
    meetLink?: string;
    instructor: string;
}

export default function MyTrainings() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [trainings, setTrainings] = useState<Record<string, TrainingDetails>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = getStoredUser();
        if (stored) {
            setUser(stored);
        } else {
            // No user logged in, still show UI but with empty state
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            // If no user, stop loading and show empty state
            setIsLoading(false);
        }
    }, [user]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { enrollments: myEnrollments, trainings: trainingMap } = await listMyEnrollments();
            setEnrollments(myEnrollments as Enrollment[]);
            setTrainings(trainingMap as Record<string, TrainingDetails>);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load your trainings.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO title="My Trainings | Yatri Cloud" description="Manage your enrolled training programs" />
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                    <Button
                        variant="ghost"
                        className="gap-2 mb-6 pl-0 hover:pl-2 transition-all"
                        onClick={() => navigate('/manage-certifications')}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">My Learning Journey</h1>
                        <p className="text-muted-foreground text-lg">
                            Access your enrolled training programs, join classes, and track your progress.
                        </p>
                    </motion.div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className="text-center py-16 border rounded-xl bg-muted/10">
                            <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No Enrollments Yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                You haven't enrolled in any training programs. Browse our courses to start your learning journey!
                            </p>
                            <Button onClick={() => navigate('/training')}>Explore Training</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrollments.map((enrollment, index) => {
                                const training = trainings[enrollment.trainingId];
                                if (!training) return null;

                                return (
                                    <Card key={index} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />

                                        <CardHeader className="p-0">
                                            <div className="aspect-video w-full overflow-hidden bg-muted relative">
                                                <img
                                                    src={training.thumbnailUrl || "https://placehold.co/600x400?text=Training+Course"}
                                                    alt={training.courseName}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => e.currentTarget.src = "https://placehold.co/600x400?text=Course+Image"}
                                                />
                                                <Badge
                                                    className={`absolute top-2 right-2 ${training.mode === 'Online' ? 'bg-blue-600' : 'bg-green-600'}`}
                                                >
                                                    {training.mode}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex-grow space-y-4 pt-6">
                                            <div>
                                                <CardTitle className="text-xl line-clamp-2 mb-2">
                                                    {training.courseName}
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {training.instructor}
                                                </p>
                                            </div>

                                            {training.startDate && (
                                                <div className="bg-muted/50 p-3 rounded-md">
                                                    <div className="flex items-start gap-3 text-sm">
                                                        <Calendar className="w-4 h-4 text-primary mt-0.5" />
                                                        <div>
                                                            <div className="font-semibold">
                                                                {format(new Date(training.startDate), "PPP")}
                                                            </div>
                                                            {training.startTime && (
                                                                <div className="text-muted-foreground flex items-center gap-1 mt-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {training.startTime}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {training.mode === 'On-site' && training.venue && (
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" /> {training.venue}
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="pt-0 pb-6 gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                asChild
                                            >
                                                <a href={`/training/${training.id}/dashboard`}>
                                                    <BookOpen className="w-4 h-4 mr-2" />
                                                    Go to Training
                                                </a>
                                            </Button>
                                            {training.mode === 'Online' && training.meetLink && (
                                                <Button
                                                    className="flex-1 gap-2 bg-[#007CFF] hover:bg-[#0066D6]"
                                                    asChild
                                                >
                                                    <a href={`/training/${training.id}/dashboard?tab=class`}>
                                                        <Video className="w-4 h-4" /> Join Class
                                                    </a>
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
