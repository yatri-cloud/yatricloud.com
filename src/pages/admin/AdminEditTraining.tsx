import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TrainingManager from "@/components/admin/training/TrainingManager";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getTrainingForEdit } from "@/lib/training-api";

export default function AdminEditTraining() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [trainingData, setTrainingData] = useState<any>(null);

    useEffect(() => {
        if (!id) {
            navigate("/admin/training");
            return;
        }

        const load = async () => {
            try {
                const training = await getTrainingForEdit(id);
                if (training) {
                    setTrainingData(training);
                } else {
                    toast.error("Failed to load training: Unknown error");
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
    }, [id, navigate]);

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
