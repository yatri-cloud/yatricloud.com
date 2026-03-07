import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TrainingManager from "@/components/admin/training/TrainingManager";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminEditTraining() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [trainingData, setTrainingData] = useState<any>(null);
    const SCRIPT_URL = import.meta.env.VITE_TRAINING_SCRIPT_URL || import.meta.env.VITE_EVENT_FEEDBACK_SCRIPT_URL;

    useEffect(() => {
        if (!id) {
            navigate("/admin/training");
            return;
        }

        const load = async () => {
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: "getTrainingById", id })
                });
                const result = await response.json();
                if (result.success && result.training) {
                    setTrainingData(result.training);
                } else {
                    toast.error("Failed to load training: " + (result.error || "Unknown error"));
                    if (result.debug) {
                        console.error("Debug Info:", result.debug);
                        toast.error("Debug: " + JSON.stringify(result.debug, null, 2));
                    }
                    navigate("/admin/training");
                }
            } catch (e) {
                console.error(e);
                toast.error("Network error loading training");
                navigate("/admin/training");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate, SCRIPT_URL]);

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg font-medium text-muted-foreground">Loading Training Details...</span>
            </div>
        );
    }

    if (!trainingData) return null;

    return <TrainingManager initialId={id} initialData={trainingData} />;
}
