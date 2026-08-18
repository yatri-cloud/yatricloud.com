/**
 * Yatri Cloud — Training Sessions & Attendance API
 *
 * Covers:
 *   training_sessions       – live class sessions per training
 *   training_attendance     – per-student status (present/absent/late/excused)
 *   training_assessments    – assessment definitions per training
 *   training_student_scores – per-student assessment scores
 */

import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface TrainingSession {
  id: string;
  trainingId: string;
  title: string;
  sessionDate: string;       // YYYY-MM-DD
  startTime?: string;        // HH:MM
  endTime?: string;          // HH:MM
  section?: string;
  mode?: "online" | "on-site";
  meetLink?: string;
  venue?: string;
  isCombined?: boolean;
  completed?: boolean;
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id?: string;
  sessionId: string;
  trainingId: string;
  userId?: string;
  email: string;
  fullName?: string;
  rollNumber?: string;
  status: AttendanceStatus;
  remark?: string;
}

export interface StudentAttendanceRow {
  userId?: string;
  email: string;
  fullName: string;
  rollNumber?: string;
  /** Attendance % across all sessions [0-100] */
  pct: number;
  /** Per-session status keyed by sessionId */
  bySession: Record<string, AttendanceStatus | null>;
}

export interface AttendanceMatrix {
  sessions: TrainingSession[];
  students: StudentAttendanceRow[];
  /** Per-session class attendance % keyed by sessionId */
  classPct: Record<string, number>;
}

export interface TrainingAssessment {
  id: string;
  trainingId: string;
  title: string;
  weightPct: number;
  maxMarks: number;
  assessmentDate?: string;
}

export interface StudentScore {
  id?: string;
  assessmentId: string;
  trainingId: string;
  email: string;
  fullName?: string;
  score?: number | null;   // null = N/A, negative = absent
  bucket?: string;
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

function rowToSession(r: Record<string, unknown>): TrainingSession {
  return {
    id: r.id as string,
    trainingId: r.training_id as string,
    title: (r.title as string) || "",
    sessionDate: r.session_date as string,
    startTime: (r.start_time as string) || undefined,
    endTime: (r.end_time as string) || undefined,
    section: (r.section as string) || undefined,
    mode: (r.mode as "online" | "on-site") || "online",
    meetLink: (r.meet_link as string) || undefined,
    venue: (r.venue as string) || undefined,
    isCombined: Boolean(r.is_combined),
    completed: Boolean(r.completed),
    notes: (r.notes as string) || undefined,
    createdAt: r.created_at as string,
  };
}

/** List all sessions for a training, sorted by date asc */
export async function listCourseSessions(trainingId: string): Promise<TrainingSession[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("training_id", trainingId)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return ((data || []) as unknown as Record<string, unknown>[]).map(rowToSession);
}

/** Create a quick session for a training */
export async function createQuickSession(input: {
  trainingId: string;
  title: string;
  sessionDate: string;
  startTime?: string;
  endTime?: string;
  section?: string;
  mode?: "online" | "on-site";
  meetLink?: string;
  venue?: string;
  isCombined?: boolean;
}): Promise<TrainingSession> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("training_sessions")
    .insert({
      training_id: input.trainingId,
      title: input.title,
      session_date: input.sessionDate,
      start_time: input.startTime || null,
      end_time: input.endTime || null,
      section: input.section || null,
      mode: input.mode || "online",
      meet_link: input.meetLink || null,
      venue: input.venue || null,
      is_combined: input.isCombined || false,
      created_by: user?.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToSession(data as unknown as Record<string, unknown>);
}

/** Mark a session as completed */
export async function markSessionCompleted(sessionId: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from("training_sessions")
    .update({ completed })
    .eq("id", sessionId);
  if (error) throw error;
}

/** Delete a session */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from("training_sessions").delete().eq("id", sessionId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Attendance helpers
// ---------------------------------------------------------------------------

/** Get all enrolled students for a training from training_enrollments */
async function getEnrolledStudents(trainingId: string): Promise<
  { email: string; fullName: string; userId?: string }[]
> {
  const { data, error } = await supabase
    .from("training_enrollments")
    .select("email, full_name, user_id")
    .eq("training_id", trainingId)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return ((data || []) as unknown as Record<string, unknown>[]).map(r => ({
    email: r.email as string,
    fullName: (r.full_name as string) || (r.email as string),
    userId: r.user_id as string | undefined,
  }));
}

/** Fetch attendance matrix for a training (optionally filtered by section) */
export async function getAttendanceMatrix(
  trainingId: string,
  section?: string,
): Promise<AttendanceMatrix> {
  // Load sessions
  let sessionsQuery = supabase
    .from("training_sessions")
    .select("*")
    .eq("training_id", trainingId)
    .order("session_date", { ascending: true });
  if (section && section !== "all") sessionsQuery = sessionsQuery.eq("section", section);
  const { data: sessionsData, error: sErr } = await sessionsQuery;
  if (sErr) throw sErr;
  const sessions = ((sessionsData || []) as unknown as Record<string, unknown>[]).map(rowToSession);

  // Load attendance records for all these sessions
  const sessionIds = sessions.map(s => s.id);
  let attendanceRows: AttendanceRecord[] = [];
  if (sessionIds.length > 0) {
    const { data: attData, error: attErr } = await supabase
      .from("training_attendance")
      .select("*")
      .in("session_id", sessionIds);
    if (attErr) throw attErr;
    attendanceRows = ((attData || []) as unknown as Record<string, unknown>[]).map(r => ({
      id: r.id as string,
      sessionId: r.session_id as string,
      trainingId: r.training_id as string,
      userId: r.user_id as string | undefined,
      email: r.email as string,
      fullName: (r.full_name as string) || "",
      rollNumber: (r.roll_number as string) || undefined,
      status: r.status as AttendanceStatus,
      remark: (r.remark as string) || undefined,
    }));
  }

  // Load enrolled students as base
  const enrolled = await getEnrolledStudents(trainingId);

  // Merge attendance into matrix
  const studentMap = new Map<string, StudentAttendanceRow>();
  for (const s of enrolled) {
    studentMap.set(s.email, {
      email: s.email,
      fullName: s.fullName,
      userId: s.userId,
      pct: 0,
      bySession: {},
    });
  }
  // Fill in attendance records
  for (const rec of attendanceRows) {
    if (!studentMap.has(rec.email)) {
      studentMap.set(rec.email, {
        email: rec.email,
        fullName: rec.fullName || rec.email,
        userId: rec.userId,
        pct: 0,
        bySession: {},
      });
    }
    studentMap.get(rec.email)!.bySession[rec.sessionId] = rec.status;
  }

  // Compute per-student attendance %
  const studentRows = Array.from(studentMap.values());
  for (const row of studentRows) {
    if (sessions.length === 0) { row.pct = 0; continue; }
    const present = sessions.filter(
      s => row.bySession[s.id] === "present" || row.bySession[s.id] === "late",
    ).length;
    row.pct = Math.round((present / sessions.length) * 100);
  }

  // Compute per-session class %
  const classPct: Record<string, number> = {};
  for (const session of sessions) {
    if (studentRows.length === 0) { classPct[session.id] = 0; continue; }
    const present = studentRows.filter(
      r => r.bySession[session.id] === "present" || r.bySession[session.id] === "late",
    ).length;
    classPct[session.id] = Math.round((present / studentRows.length) * 100);
  }

  return { sessions, students: studentRows, classPct };
}

/** Mark or update a single attendance cell */
export async function markAttendance(
  sessionId: string,
  trainingId: string,
  email: string,
  status: AttendanceStatus,
  opts?: { fullName?: string; rollNumber?: string; userId?: string; remark?: string },
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const record = {
    session_id: sessionId,
    training_id: trainingId,
    email: email.trim().toLowerCase(),
    status,
    full_name: opts?.fullName || null,
    roll_number: opts?.rollNumber || null,
    user_id: opts?.userId || null,
    remark: opts?.remark || null,
    marked_by: user?.id || null,
    marked_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("training_attendance")
    .upsert(record, { onConflict: "session_id,email" });
  if (error) throw error;
}

/** Batch-mark attendance for a full session (upsert all records) */
export async function batchMarkAttendance(
  sessionId: string,
  trainingId: string,
  records: { email: string; status: AttendanceStatus; fullName?: string; rollNumber?: string; userId?: string }[],
): Promise<void> {
  if (records.length === 0) return;
  const { data: { user } } = await supabase.auth.getUser();
  const rows = records.map(r => ({
    session_id: sessionId,
    training_id: trainingId,
    email: r.email.trim().toLowerCase(),
    status: r.status,
    full_name: r.fullName || null,
    roll_number: r.rollNumber || null,
    user_id: r.userId || null,
    marked_by: user?.id || null,
    marked_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("training_attendance")
    .upsert(rows, { onConflict: "session_id,email" });
  if (error) throw error;
}

/** Export attendance matrix to CSV */
export function exportAttendanceCsv(courseName: string, matrix: AttendanceMatrix): void {
  const { sessions, students } = matrix;
  const shortDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
  const statusLabel = (s: AttendanceStatus | null | undefined): string => {
    if (s === "present") return "P";
    if (s === "absent") return "A";
    if (s === "late") return "L";
    if (s === "excused") return "E";
    return "—";
  };

  const headerRow = [
    "%", "Student Name", "Roll No", "Email",
    ...sessions.map(s => `${s.title}\n${shortDate(s.sessionDate)}`),
  ];
  const rows = students.map(st => [
    `${st.pct}%`,
    st.fullName,
    st.rollNumber || "—",
    st.email,
    ...sessions.map(s => statusLabel(st.bySession[s.id])),
  ]);

  const csvContent = [headerRow, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${courseName.replace(/\s+/g, "_")}_attendance.csv`;
  link.click();
}

// ---------------------------------------------------------------------------
// Assessments & Scores
// ---------------------------------------------------------------------------

export async function listAssessments(trainingId: string): Promise<TrainingAssessment[]> {
  const { data, error } = await supabase
    .from("training_assessments")
    .select("*")
    .eq("training_id", trainingId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data || []) as unknown as Record<string, unknown>[]).map(r => ({
    id: r.id as string,
    trainingId: r.training_id as string,
    title: r.title as string,
    weightPct: Number(r.weight_pct) || 16.66,
    maxMarks: Number(r.max_marks) || 100,
    assessmentDate: (r.assessment_date as string) || undefined,
  }));
}

export async function createAssessment(input: {
  trainingId: string;
  title: string;
  weightPct?: number;
  maxMarks?: number;
  assessmentDate?: string;
}): Promise<TrainingAssessment> {
  const { data, error } = await supabase
    .from("training_assessments")
    .insert({
      training_id: input.trainingId,
      title: input.title,
      weight_pct: input.weightPct ?? 16.66,
      max_marks: input.maxMarks ?? 100,
      assessment_date: input.assessmentDate || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  const r = data as unknown as Record<string, unknown>;
  return {
    id: r.id as string,
    trainingId: r.training_id as string,
    title: r.title as string,
    weightPct: Number(r.weight_pct),
    maxMarks: Number(r.max_marks),
  };
}

export async function listStudentScores(trainingId: string): Promise<{
  assessments: TrainingAssessment[];
  scores: Record<string, Record<string, StudentScore>>;   // email → assessmentId → score
  students: { email: string; fullName: string; bucket?: string }[];
}> {
  const assessments = await listAssessments(trainingId);
  const assessmentIds = assessments.map(a => a.id);

  // Enrolled students as baseline
  const enrolled = await getEnrolledStudents(trainingId);
  const studentMap = new Map(enrolled.map(s => [s.email, { email: s.email, fullName: s.fullName, bucket: undefined as string | undefined }]));

  const scoreMap: Record<string, Record<string, StudentScore>> = {};
  if (assessmentIds.length > 0) {
    const { data, error } = await supabase
      .from("training_student_scores")
      .select("*")
      .in("assessment_id", assessmentIds);
    if (error) throw error;
    for (const r of (data || []) as unknown as Record<string, unknown>[]) {
      const email = r.email as string;
      const aId = r.assessment_id as string;
      if (!scoreMap[email]) scoreMap[email] = {};
      scoreMap[email][aId] = {
        id: r.id as string,
        assessmentId: aId,
        trainingId: r.training_id as string,
        email,
        fullName: (r.full_name as string) || undefined,
        score: r.score === null ? null : Number(r.score),
        bucket: (r.bucket as string) || undefined,
      };
      if (!studentMap.has(email)) studentMap.set(email, { email, fullName: r.full_name as string || email });
      if ((r.bucket as string) && studentMap.has(email)) {
        studentMap.get(email)!.bucket = r.bucket as string;
      }
    }
  }

  return {
    assessments,
    scores: scoreMap,
    students: Array.from(studentMap.values()),
  };
}

export async function upsertStudentScore(input: StudentScore): Promise<void> {
  const { error } = await supabase.from("training_student_scores").upsert({
    assessment_id: input.assessmentId,
    training_id: input.trainingId,
    email: input.email.toLowerCase(),
    full_name: input.fullName || null,
    score: input.score ?? null,
    bucket: input.bucket || null,
  }, { onConflict: "assessment_id,email" });
  if (error) throw error;
}

/** Export scores to CSV (download template for upload) */
export function exportScoresTemplate(
  courseName: string,
  assessments: TrainingAssessment[],
  students: { email: string; fullName: string }[],
): void {
  const header = ["Name", "Email", ...assessments.map(a => a.title), "Total"];
  const rows = students.map(s => [s.fullName, s.email, ...assessments.map(() => ""), ""]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${courseName.replace(/\s+/g, "_")}_scores_template.csv`;
  link.click();
}
