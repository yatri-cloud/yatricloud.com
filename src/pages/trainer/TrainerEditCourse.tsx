import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import TrainingManager from "@/components/admin/training/TrainingManager";
import Navbar from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { getTrainingForEdit } from "@/lib/training-api";
import { fetchMyProfile } from "@/lib/auth";

/**
 * Trainer course editor. Thin wrapper (mirrors AdminEditTraining) that loads the
 * course and renders the ONE unified TrainingManager in trainer mode — the same
 * editor admins use, so trainers now get the full curriculum (per-lesson URLs +
 * descriptions), quiz, resources, schedule and meet link in one place. Replaces
 * the old standalone TrainerCourseEditor. RLS remains the real write boundary.
 */
export default function TrainerEditCourse() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [trainingData, setTrainingData] = useState<any>(null);

    useEffect(() => {
        if (!localStorage.getItem("trainerData")) { navigate("/trainer/login"); return; }
        if (!courseId) { navigate("/trainer/dashboard"); return; }
        const load = async () => {
            // Verify the live profile role (matches TrainerDashboard); RLS still guards writes.
            const profile = await fetchMyProfile();
            if (!profile || (profile.role !== "trainer" && profile.role !== "admin")) {
                localStorage.removeItem("trainerData");
                navigate("/trainer/login");
                return;
            }
            try {
                const training = await getTrainingForEdit(courseId);
                if (training) setTrainingData(training);
                else { toast.error("Could not load this course."); navigate("/trainer/dashboard"); }
            } catch (e) {
                console.error(e);
                toast.error("Network error loading course.");
                navigate("/trainer/dashboard");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [courseId, navigate]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO title="Edit Course | Trainer Portal" description="Edit your Yatri Cloud training course." noindex />
            <Navbar />
            <div className="flex-1 pt-24 pb-12">
                <div className="container max-w-6xl mx-auto px-4">
                    {loading || !trainingData ? (
                        <div className="flex h-[50vh] items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading course…
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
                                <p className="text-muted-foreground mt-2">Update details, curriculum, quiz and resources. Saving sends changes for admin review.</p>
                            </div>
                            <TrainingManager initialId={courseId} initialData={trainingData} isTrainerMode />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
