import TrainingManager from "@/components/admin/training/TrainingManager";

export default function AdminTraining() {
    return (
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-8 md:py-10">
            <div className="mb-8">
                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Training Portal Management</h1>
                <p className="text-muted-foreground mt-1.5">Create and manage Yatri Training modules.</p>
            </div>

            <TrainingManager />
        </div>
    );
}
