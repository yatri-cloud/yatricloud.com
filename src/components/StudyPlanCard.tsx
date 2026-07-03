import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { getCertificationOptions, type CertificationOption } from "@/lib/training-api";
import { toast } from "sonner";

/**
 * Dashboard study planner (study_plans table, migration 033): pick a
 * certification and exam date, get a live days-left countdown with weekly
 * milestone guidance and quick links to the resources for that exam.
 */
interface StudyPlan {
    id: string;
    certification_id: string;
    exam_date: string;
}

const daysUntil = (dateStr: string) => {
    const target = new Date(`${dateStr}T00:00:00`);
    return Math.ceil((target.getTime() - Date.now()) / 86_400_000);
};

const milestoneCopy = (days: number) => {
    if (days <= 0) return "Exam day is here. Deep breath — you prepared for this.";
    if (days <= 7) return "Final week: one full practice test a day, review only what you miss.";
    if (days <= 21) return "Crunch time: alternate practice tests with weak-topic review.";
    if (days <= 45) return "Build depth: finish the course content, then start timed practice tests.";
    return "Plenty of runway: study a little most days — consistency beats cramming.";
};

export function StudyPlanCard() {
    const [plans, setPlans] = useState<StudyPlan[]>([]);
    const [options, setOptions] = useState<CertificationOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [certId, setCertId] = useState("");
    const [examDate, setExamDate] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            supabase.from("study_plans").select("id, certification_id, exam_date").order("exam_date"),
            getCertificationOptions(),
        ]).then(([plansRes, opts]) => {
            setPlans((plansRes.data as StudyPlan[]) || []);
            setOptions(opts);
            setLoading(false);
        });
    }, []);

    const optionById = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

    const addPlan = async () => {
        if (!certId || !examDate) { toast.error("Pick a certification and your exam date."); return; }
        if (daysUntil(examDate) < 0) { toast.error("That date is in the past — pick your upcoming exam day."); return; }
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSaving(false); toast.error("Please sign in first."); return; }
        const { data, error } = await supabase
            .from("study_plans")
            .insert({ user_id: user.id, certification_id: certId, exam_date: examDate })
            .select("id, certification_id, exam_date")
            .single();
        setSaving(false);
        if (error) {
            toast.error(error.message.includes("duplicate") ? "You already have a plan for that certification." : "That did not save. Please try again.");
            return;
        }
        setPlans((prev) => [...prev, data as StudyPlan].sort((a, b) => a.exam_date.localeCompare(b.exam_date)));
        setAdding(false);
        setCertId("");
        setExamDate("");
        toast.success("Plan set. We are counting down with you.");
    };

    const removePlan = async (plan: StudyPlan) => {
        const { error } = await supabase.from("study_plans").delete().eq("id", plan.id);
        if (error) { toast.error("Could not remove the plan. Please try again."); return; }
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    };

    return (
        <Card>
            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="text-lg">Exam countdown</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Set your exam date and we will pace your prep with you.</p>
                </div>
                {!adding && (
                    <Button variant="outline" className="min-h-[40px] rounded-xl" onClick={() => setAdding(true)}>
                        Plan an exam
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : (
                    <>
                        {adding && (
                            <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>Certification</Label>
                                        <Select value={certId} onValueChange={setCertId}>
                                            <SelectTrigger className="min-h-[44px] rounded-xl bg-background">
                                                <SelectValue placeholder="Pick your exam" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[280px]">
                                                {options.map((o) => (
                                                    <SelectItem key={o.id} value={o.id}>
                                                        {o.label}{o.examCode ? ` (${o.examCode})` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="plan-date">Exam date</Label>
                                        <Input
                                            id="plan-date"
                                            type="date"
                                            min={new Date().toISOString().slice(0, 10)}
                                            value={examDate}
                                            onChange={(e) => setExamDate(e.target.value)}
                                            className="min-h-[44px] rounded-xl bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Button onClick={addPlan} disabled={saving} className="min-h-[40px] rounded-xl gap-2">
                                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Start the countdown
                                    </Button>
                                    <Button variant="ghost" onClick={() => setAdding(false)} disabled={saving} className="min-h-[40px] rounded-xl">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {plans.length === 0 && !adding ? (
                            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                No exam planned yet. Pick a date and it becomes real — Yatris with a set date pass far more often.
                            </p>
                        ) : (
                            plans.map((plan) => {
                                const cert = optionById.get(plan.certification_id);
                                const days = daysUntil(plan.exam_date);
                                const urgent = days <= 14;
                                return (
                                    <div key={plan.id} className="rounded-2xl border border-border bg-background p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold leading-snug">{cert?.label || "Your exam"}</p>
                                                <p className="mt-0.5 text-sm text-muted-foreground">
                                                    {cert?.examCode && <span className="font-mono">{cert.examCode} · </span>}
                                                    {new Date(`${plan.exam_date}T00:00:00`).toLocaleDateString("en-IN", { dateStyle: "long" })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-display text-3xl font-black tabular-nums leading-none ${urgent ? "text-warning" : "text-primary"}`}>
                                                    {Math.max(0, days)}
                                                </p>
                                                <p className="text-xs uppercase tracking-wide text-muted-foreground">days left</p>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm text-muted-foreground">{milestoneCopy(days)}</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
                                            <Link to="/examdumps" className="text-primary hover:underline">Practice questions</Link>
                                            <Link to="/yatristore" className="text-primary hover:underline">Exam voucher</Link>
                                            <Link to="/training" className="text-primary hover:underline">Training</Link>
                                            <button
                                                type="button"
                                                onClick={() => removePlan(plan)}
                                                className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
