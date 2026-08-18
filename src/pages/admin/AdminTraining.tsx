import TrainingManager from "@/components/admin/training/TrainingManager";

export default function AdminTraining() {
    return (
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-10 space-y-6 md:space-y-8 animate-in fade-in">
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                            Training Operations
                        </p>
                        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                            Training Portal Management
                        </h1>
                    </div>
                </div>
            </div>

            <TrainingManager />
        </div>
    );
}
