import { useState, useEffect, useCallback } from "react";
import {
  Plus, Users, Video, MapPin, ChevronDown, ChevronRight, Check,
  Loader2, Trash2, Calendar, Clock, BookOpen, Search, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  listCourseSessions, createQuickSession, markSessionCompleted, deleteSession,
  type TrainingSession,
} from "@/lib/attendance-api";
import type { Course } from "@/lib/training-api";
import { cn } from "@/lib/utils";
import { format, isPast, isFuture, isToday } from "date-fns";

interface SessionsManagerProps {
  courses: Course[];
  onTakeAttendance?: (session: TrainingSession) => void;
}

const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, "0");
  const m = ((i % 4) * 15).toString().padStart(2, "0");
  return `${h}:${m}`;
});

export default function SessionsManager({ courses, onTakeAttendance }: SessionsManagerProps) {
  const [courseId, setCourseId] = useState<string>(courses[0]?.id || "");
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Quick session form state
  const [showForm, setShowForm] = useState(false);
  const [isCombined, setIsCombined] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formStart, setFormStart] = useState("10:00");
  const [formEnd, setFormEnd] = useState("11:00");
  const [formSection, setFormSection] = useState("");
  const [formMode, setFormMode] = useState<"online" | "on-site">("online");
  const [formMeetLink, setFormMeetLink] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedCourse = courses.find(c => c.id === courseId);

  const loadSessions = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const data = await listCourseSessions(courseId);
      setSessions(data);
    } catch (e: any) {
      toast.error("Failed to load sessions: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const filteredSessions = sessions.filter(s =>
    !searchTerm || s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.section || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const upcoming = filteredSessions.filter(s => isFuture(new Date(s.sessionDate + "T23:59:59")) || isToday(new Date(s.sessionDate + "T00:00:00")));
  const past = filteredSessions.filter(s => isPast(new Date(s.sessionDate + "T23:59:59")) && !isToday(new Date(s.sessionDate + "T00:00:00")));

  const handleCreateSession = async () => {
    if (!formTitle.trim() || !formDate) {
      toast.error("Session title and date are required");
      return;
    }
    setIsSaving(true);
    try {
      await createQuickSession({
        trainingId: courseId,
        title: formTitle.trim(),
        sessionDate: formDate,
        startTime: formStart || undefined,
        endTime: formEnd || undefined,
        section: formSection || undefined,
        mode: formMode,
        meetLink: formMeetLink || undefined,
        venue: formVenue || undefined,
        isCombined,
      });
      toast.success("Session created!");
      setShowForm(false);
      setFormTitle("");
      await loadSessions();
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCompleted = async (session: TrainingSession) => {
    try {
      await markSessionCompleted(session.id, !session.completed);
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, completed: !s.completed } : s));
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Delete this session? All attendance records for it will also be removed.")) return;
    try {
      await deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success("Session deleted");
    } catch (e: any) {
      toast.error("Delete failed: " + e.message);
    }
  };

  const SessionCard = ({ session }: { session: TrainingSession }) => (
    <div className={cn(
      "group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200",
      session.completed ? "bg-slate-50/50 border-slate-200/60" : "bg-card border-border hover:border-primary/20 hover:shadow-sm",
    )}>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900 text-sm">{session.title}</span>
          {session.isCombined && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
              Combined
            </span>
          )}
          {isToday(new Date(session.sessionDate + "T00:00:00")) && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Today
            </span>
          )}
          {session.completed && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              Completed
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
            {format(new Date(session.sessionDate + "T00:00:00"), "dd MMM yyyy")}
          </span>
          {session.startTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
              {session.startTime}{session.endTime ? ` – ${session.endTime}` : ""}
            </span>
          )}
          {session.section && (
            <span className="px-2 py-0.5 bg-muted/50 rounded text-muted-foreground font-mono text-[11px]">
              {session.section}
            </span>
          )}
          <span className="flex items-center gap-1">
            {session.mode === "online" ? <Video className="w-3.5 h-3.5 text-blue-600" /> : <MapPin className="w-3.5 h-3.5 text-amber-600" />}
            {session.mode === "online" ? "Online" : "On-site"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {session.meetLink && (
          <a href={session.meetLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1.5 border-slate-200">
              <Video className="w-3.5 h-3.5 text-blue-600" /> Join
            </Button>
          </a>
        )}
        {onTakeAttendance && (
          <Button
            size="sm"
            className="h-8 rounded-lg text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium"
            onClick={() => onTakeAttendance(session)}
          >
            <Users className="w-3.5 h-3.5" /> Take Attendance
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleToggleCompleted(session)}
          title={session.completed ? "Mark incomplete" : "Mark completed"}
        >
          <Check className={cn("w-4 h-4", session.completed ? "text-emerald-600" : "text-slate-400")} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleDelete(session.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="border border-border rounded-2xl shadow-none bg-card">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold">Course Sessions</CardTitle>
            <p className="text-xs text-muted-foreground">
              {selectedCourse ? selectedCourse.courseName : "Select course to view sessions"} — {sessions.length} total session{sessions.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-56 h-9 rounded-xl text-sm"><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.courseName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9 rounded-xl gap-1.5 bg-primary text-white" onClick={() => { setIsCombined(false); setShowForm(true); }}>
              <Plus className="w-3.5 h-3.5" /> Quick Session
            </Button>
            <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1.5" onClick={() => { setIsCombined(true); setShowForm(true); }}>
              <Users className="w-3.5 h-3.5 text-primary" /> Combined Session
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="pt-2">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter sessions by title or section..."
              className="pl-9 h-9 rounded-xl text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border rounded-xl border-dashed">
            <BookOpen className="w-10 h-10 text-muted-foreground/30" />
            <div>
              <p className="font-semibold text-slate-800">No sessions scheduled</p>
              <p className="text-muted-foreground text-xs mt-0.5">Create your first class session to begin taking attendance.</p>
            </div>
            <Button size="sm" className="rounded-xl mt-1" onClick={() => setShowForm(true)}><Plus className="w-3.5 h-3.5 mr-1.5" /> Schedule Session</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Upcoming Section */}
            <div className="border rounded-xl overflow-hidden border-border/80">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100/80 transition-colors"
                onClick={() => setUpcomingOpen(o => !o)}
              >
                <span className="flex items-center gap-2">
                  {upcomingOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  Upcoming Sessions ({upcoming.length})
                </span>
              </button>
              {upcomingOpen && (
                <div className="p-3 space-y-2">
                  {upcoming.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">No upcoming sessions scheduled.</p>
                  ) : upcoming.map(s => <SessionCard key={s.id} session={s} />)}
                </div>
              )}
            </div>

            {/* Past Section */}
            <div className="border rounded-xl overflow-hidden border-border/80">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100/80 transition-colors"
                onClick={() => setPastOpen(o => !o)}
              >
                <span className="flex items-center gap-2">
                  {pastOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  Past Sessions ({past.length})
                </span>
              </button>
              {pastOpen && (
                <div className="p-3 space-y-2">
                  {past.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">No past sessions found.</p>
                  ) : past.map(s => <SessionCard key={s.id} session={s} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Quick Session Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{isCombined ? "Schedule Combined Session" : "Schedule Quick Session"}</DialogTitle>
            <DialogDescription>
              {isCombined ? "Create a session spanning multiple sections or batches." : "Schedule a new class session for this training."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Session Title *</Label>
              <Input placeholder="e.g. Introduction to Cloud Architecture" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Date *</Label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Section / Batch</Label>
                <Input placeholder="e.g. Batch 2024-A" value={formSection} onChange={e => setFormSection(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Start Time</Label>
                <Select value={formStart} onValueChange={setFormStart}>
                  <SelectTrigger className="mt-1.5 h-9 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="h-48">
                    {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">End Time</Label>
                <Select value={formEnd} onValueChange={setFormEnd}>
                  <SelectTrigger className="mt-1.5 h-9 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="h-48">
                    {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Mode</Label>
              <Select value={formMode} onValueChange={v => setFormMode(v as "online" | "on-site")}>
                <SelectTrigger className="mt-1.5 h-9 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formMode === "online" ? (
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Meeting Link</Label>
                <Input placeholder="https://meet.google.com/..." value={formMeetLink} onChange={e => setFormMeetLink(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
            ) : (
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Venue Location</Label>
                <Input placeholder="e.g. Hall 3, Training Center" value={formVenue} onChange={e => setFormVenue(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreateSession} disabled={isSaving} className="rounded-xl gap-1.5 bg-primary text-white">
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
