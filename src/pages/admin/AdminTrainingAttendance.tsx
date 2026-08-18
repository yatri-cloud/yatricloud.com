import AttendanceMatrixView from "@/components/training/AttendanceMatrix";
import SessionsManager from "@/components/training/SessionsManager";
import { Users, ClipboardList, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { listAllTrainings } from "@/lib/training-api";
import type { Course } from "@/lib/training-api";
import { cn } from "@/lib/utils";

type AdminTab = "attendance" | "sessions";

export default function AdminTrainingAttendance() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("attendance");

  useEffect(() => {
    (async () => {
      try {
        const data = await listAllTrainings();
        setCourses(data as unknown as Course[]);
      } catch {
        /* ignore */
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      {/* ── Header band matching Reference UI ── */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              Training Operations
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Training Attendance &amp; Sessions
            </h1>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" /> Loading training attendance…
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Tab pill buttons matching Reference UI ── */}
          <div className="flex gap-1.5 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/80 w-fit">
            {[
              { id: "attendance" as AdminTab, label: "Take Attendance", icon: Users },
              { id: "sessions"   as AdminTab, label: "Manage Sessions", icon: ClipboardList },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                  activeTab === id
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === "attendance" && <AttendanceMatrixView courses={courses} />}
          {activeTab === "sessions" && (
            <SessionsManager
              courses={courses}
              onTakeAttendance={() => setActiveTab("attendance")}
            />
          )}
        </div>
      )}
    </div>
  );
}
