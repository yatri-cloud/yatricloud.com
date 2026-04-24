import TrainingManager from "@/components/admin/training/TrainingManager";
import Navbar from "@/components/Navbar";
import { SEO } from "@/components/SEO";

export default function TrainerCreateCourse() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO title="Create Course | Trainer Portal" description="Author a new Yatri Cloud training course." />
            <Navbar />
            
            <div className="flex-1 pt-24 pb-12">
                <div className="container max-w-6xl mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Trainer Course Builder</h1>
                        <p className="text-muted-foreground mt-2">Design, organize, and submit a new course for administrative review.</p>
                    </div>

                    <TrainingManager isTrainerMode={true} />
                </div>
            </div>
        </div>
    );
}
