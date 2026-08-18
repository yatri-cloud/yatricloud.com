import { useState, useEffect, useCallback } from "react";
import { Search, Download, Loader2, BookOpen, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  getAttendanceMatrix, markAttendance, batchMarkAttendance, exportAttendanceCsv,
  type AttendanceMatrix, type AttendanceStatus, type TrainingSession,
} from "@/lib/attendance-api";
import type { Course } from "@/lib/training-api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AttendanceMatrixViewProps {
  courses: Course[];
}

const STATUS_CFG: Record<AttendanceStatus, { label: string; bg: string; text: string; next: AttendanceStatus }> = {
  present: { label: "P", bg: "bg-emerald-500", text: "text-white hover:bg-emerald-600", next: "absent" },
  absent:  { label: "A", bg: "bg-rose-500",    text: "text-white hover:bg-rose-600",    next: "late" },
  late:    { label: "L", bg: "bg-amber-400",   text: "text-white hover:bg-amber-500",   next: "excused" },
  excused: { label: "E", bg: "bg-purple-500",  text: "text-white hover:bg-purple-600", next: "present" },
};
type SortKey = "name" | "roll" | "email";

function pctBadge(pct: number) {
  if (pct >= 75) return "text-emerald-700 font-bold bg-emerald-50 border-emerald-200/80";
  if (pct >= 50) return "text-amber-700 font-bold bg-amber-50 border-amber-200/80";
  return "text-rose-700 font-bold bg-rose-50 border-rose-200/80";
}

export default function AttendanceMatrixView({ courses }: AttendanceMatrixViewProps) {
  const [courseId, setCourseId] = useState<string>(courses[0]?.id || "");
  const [section, setSection] = useState("all");
  const [matrix, setMatrix] = useState<AttendanceMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [markingCell, setMarkingCell] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCourse = courses.find(c => c.id === courseId);

  const loadMatrix = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const m = await getAttendanceMatrix(courseId, section !== "all" ? section : undefined);
      setMatrix(m);
    } catch (e: any) {
      toast.error("Failed to load attendance: " + (e.message || "unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [courseId, section]);

  useEffect(() => { loadMatrix(); }, [loadMatrix]);

  const handleToggle = async (session: TrainingSession, email: string, cur: AttendanceStatus | null | undefined) => {
    if (!matrix) return;
    const next = STATUS_CFG[cur || "absent"].next;
    const cellKey = `${session.id}-${email}`;
    setMarkingCell(cellKey);
    try {
      await markAttendance(session.id, session.trainingId, email, next, {
        fullName: matrix.students.find(s => s.email === email)?.fullName,
      });
      setMatrix(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          students: prev.students.map(s => {
            if (s.email !== email) return s;
            const updated = { ...s, bySession: { ...s.bySession, [session.id]: next } };
            const present = prev.sessions.filter(
              se => updated.bySession[se.id] === "present" || updated.bySession[se.id] === "late",
            ).length;
            updated.pct = Math.round((present / prev.sessions.length) * 100);
            return updated;
          }),
        };
      });
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setMarkingCell(null);
    }
  };

  const handleMarkAllPresent = async (sessionId: string) => {
    if (!matrix) return;
    setIsSaving(true);
    try {
      await batchMarkAttendance(sessionId, courseId, matrix.students.map(s => ({
        email: s.email, status: "present" as AttendanceStatus, fullName: s.fullName, userId: s.userId,
      })));
      await loadMatrix();
      toast.success("All students marked present!");
    } catch (e: any) {
      toast.error("Batch mark failed: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = (matrix?.students || []).filter(s =>
    !search ||
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNumber || "").toLowerCase().includes(search.toLowerCase()),
  );
  const sorted = [...filtered].sort((a, b) => {
    const av = sortKey === "name" ? a.fullName : sortKey === "email" ? a.email : (a.rollNumber || "");
    const bv = sortKey === "name" ? b.fullName : sortKey === "email" ? b.email : (b.rollNumber || "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const sections = Array.from(new Set((matrix?.sessions || []).map(s => s.section).filter(Boolean)));

  return (
    <Card className="border border-border rounded-2xl shadow-none bg-card">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold">Attendance Matrix</CardTitle>
            <p className="text-xs text-muted-foreground">
              {selectedCourse?.courseName || "Select course"} — Click cell to toggle status (P → A → L → E)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-56 h-9 rounded-xl text-sm"><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.courseName}</SelectItem>)}
              </SelectContent>
            </Select>

            {sections.length > 0 && (
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="w-36 h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1.5" onClick={loadMatrix} disabled={isLoading}>
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} /> Refresh
            </Button>

            {matrix && (
              <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1.5"
                onClick={() => exportAttendanceCsv(selectedCourse?.courseName || "Course", matrix)}>
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search students by name, email, roll no..." className="pl-9 h-9 rounded-xl text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Sort:</span>
            {(["name", "roll", "email"] as SortKey[]).map(k => (
              <Button key={k} variant="outline" size="sm" className="h-8 rounded-xl text-xs gap-1 capitalize"
                onClick={() => { if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(k); setSortDir("asc"); } }}>
                {k} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !matrix || matrix.sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-dashed">
            <BookOpen className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm font-medium">No sessions scheduled for this training.</p>
            <p className="text-xs text-muted-foreground">Create sessions under the <strong>My Sessions</strong> tab to record attendance.</p>
          </div>
        ) : matrix.students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Users className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm font-medium">No enrolled students in this course yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                {/* Royal Blue Header Bar matching Reference UI */}
                <tr className="bg-[#0070f3] text-white">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider w-16">P %</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider min-w-[180px]">Student</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider min-w-[90px]">Roll No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider min-w-[180px]">Email</th>
                  {matrix.sessions.map(session => (
                    <th key={session.id} className="px-2 py-2.5 text-center min-w-[85px] group/col border-l border-white/20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-bold uppercase leading-tight line-clamp-2 text-center text-white">
                          {session.title}
                        </span>
                        <span className="text-[9px] text-white/80 font-normal">
                          {format(new Date(session.sessionDate + "T00:00:00"), "dd MMM").toUpperCase()}
                        </span>
                        <button onClick={() => handleMarkAllPresent(session.id)} disabled={isSaving}
                          className="text-[9px] text-white underline hover:text-white/80 opacity-0 group-hover/col:opacity-100 transition-opacity leading-none mt-0.5">
                          All P
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
                {/* Class Average Row */}
                <tr className="bg-slate-100/90 border-b border-slate-200">
                  <td className="px-4 py-2 text-xs font-semibold text-slate-500">—</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-700">Class Average</td>
                  <td /><td />
                  {matrix.sessions.map(s => (
                    <td key={s.id} className="px-2 py-2 text-center border-l border-slate-200/60">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", pctBadge(matrix.classPct[s.id] || 0))}>
                        {matrix.classPct[s.id] ?? 0}%
                      </span>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sorted.map(student => (
                  <tr key={student.email} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border tabular-nums inline-block", pctBadge(student.pct))}>
                        {student.pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 text-sm truncate max-w-[200px]">
                      {student.fullName}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground text-xs font-mono">{student.rollNumber || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">{student.email}</td>
                    {matrix.sessions.map(session => {
                      const status = student.bySession[session.id];
                      const cellKey = `${session.id}-${student.email}`;
                      const isMarking = markingCell === cellKey;
                      const cfg = status ? STATUS_CFG[status] : null;
                      return (
                        <td key={session.id} className="px-2 py-2.5 text-center border-l border-border/40">
                          <button
                            onClick={() => handleToggle(session, student.email, status)}
                            disabled={!!markingCell}
                            className={cn(
                              "w-8 h-7 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center mx-auto shadow-2xs",
                              cfg ? `${cfg.bg} ${cfg.text}` : "bg-slate-100 text-slate-400 hover:bg-primary/10 hover:text-primary border border-slate-200/60",
                              isMarking && "opacity-50 cursor-wait",
                            )}
                            title={status ? `${status.toUpperCase()} — click to toggle` : "Not marked — click to mark"}
                          >
                            {isMarking ? <Loader2 className="w-3 h-3 animate-spin" /> : (cfg?.label || "—")}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend Footer */}
        <div className="p-4 bg-slate-50/50 border-t border-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="font-semibold text-slate-700">Status Legend:</span>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn("w-6 h-5 rounded-md text-[10px] font-bold flex items-center justify-center text-white", v.bg)}>
                  {v.label}
                </span>
                <span className="capitalize text-slate-600 font-medium">{k}</span>
              </span>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {sorted.length} student{sorted.length !== 1 ? "s" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
