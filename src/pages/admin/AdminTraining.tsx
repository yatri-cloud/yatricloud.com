import TrainingManager from "@/components/admin/training/TrainingManager";

export default function AdminTraining() {
    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Training Portal Management</h1>
                <p className="text-muted-foreground mt-2">Create and manage Yatri Training modules.</p>
            </div>

            <TrainingManager />
        </div>
    );
}
