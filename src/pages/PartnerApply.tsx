import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type FieldDef = { name: string; label: string; type?: string; placeholder?: string; required?: boolean };

// Each partnership form is its own page with a real URL — no popups.
const CONFIG: Record<string, { dbKind: string; title: string; desc: string; fields: FieldDef[]; messageLabel: string }> = {
    campus: {
        dbKind: "college",
        title: "Partner your campus with us",
        desc: "Share a few details and our team will design a program that fits your students.",
        fields: [
            { name: "institution", label: "Institution name", required: true },
            { name: "name", label: "Your name", required: true },
            { name: "role", label: "Your role", placeholder: "e.g. HOD, TPO, Professor", required: true },
            { name: "email", label: "Work email", type: "email", required: true },
            { name: "phone", label: "Phone", type: "tel" },
            { name: "students", label: "Approx. students", type: "number" },
        ],
        messageLabel: "Anything you'd like us to know",
    },
    team: {
        dbKind: "corporate",
        title: "Plan training for your team",
        desc: "Tell us about your team and goals, and we'll put together a plan that works for you.",
        fields: [
            { name: "company", label: "Company name", required: true },
            { name: "name", label: "Your name", required: true },
            { name: "email", label: "Work email", type: "email", required: true },
            { name: "phone", label: "Phone", type: "tel" },
            { name: "teamSize", label: "Team size", type: "number" },
            { name: "focus", label: "Focus area", placeholder: "e.g. AWS, Kubernetes" },
        ],
        messageLabel: "What are you looking for?",
    },
};

export default function PartnerApply() {
    const { kind = "" } = useParams<{ kind: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

    const cfg = CONFIG[kind];
    if (!cfg) return <Navigate to="/partners" replace />;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const headcountRaw = fd.get("students") ?? fd.get("teamSize");
        setSubmitting(true);
        const { error } = await supabase.from("consultation_requests").insert({
            kind: cfg.dbKind,
            name: String(fd.get("name") || "").trim(),
            email: String(fd.get("email") || "").trim().toLowerCase(),
            company_name: String(fd.get("institution") ?? fd.get("company") ?? "").trim() || null,
            role: String(fd.get("role") || "").trim() || null,
            phone: String(fd.get("phone") || "").trim() || null,
            headcount: headcountRaw ? Number(headcountRaw) || null : null,
            focus: String(fd.get("focus") || "").trim() || null,
            message: String(fd.get("message") || "").trim() || null,
        });
        setSubmitting(false);
        if (error) {
            toast({ title: "That didn't go through", description: "Please try again, or email us at info@yatricloud.com.", variant: "destructive" });
            return;
        }
        setDone(true);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO title={`${cfg.title} | Yatri Cloud`} description={cfg.desc} />
            <Navbar />
            <main className="pt-28 pb-16">
                <div className="container mx-auto max-w-2xl px-4 md:px-6">
                    <Button variant="ghost" className="mb-6 gap-2 pl-0 hover:pl-2 transition-all" onClick={() => navigate("/partners")}>
                        <ArrowLeft className="h-4 w-4" /> Back to Partners
                    </Button>

                    {done ? (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-8 text-center md:p-12">
                            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" aria-hidden="true" />
                            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Thank you, we've got your details</h1>
                            <p className="mx-auto mt-3 max-w-md text-muted-foreground">Someone from the Yatri Cloud team will reach out within one working day.</p>
                            <div className="mt-6 flex justify-center gap-3">
                                <Button onClick={() => navigate("/partners")}>Back to Partners</Button>
                                <Button variant="outline" onClick={() => navigate("/")}>Go to home</Button>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                                <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{cfg.title}</h1>
                                <p className="mt-3 text-lg text-muted-foreground">{cfg.desc}</p>
                            </motion.div>

                            <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-6 md:p-8">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {cfg.fields.map((f) => (
                                        <div key={f.name} className="space-y-1.5">
                                            <Label htmlFor={`p-${f.name}`} className="text-sm font-medium">{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
                                            <Input id={`p-${f.name}`} name={f.name} type={f.type || "text"} placeholder={f.placeholder} required={f.required} min={f.type === "number" ? 1 : undefined} className="h-11 rounded-xl" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="p-message" className="text-sm font-medium">{cfg.messageLabel}</Label>
                                    <Textarea id="p-message" name="message" className="min-h-[100px] rounded-xl" />
                                </div>
                                <Button type="submit" disabled={submitting} className="w-full min-h-[44px] gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-inset-btn hover:bg-brand-600 hover:text-primary-foreground">
                                    {submitting ? "Sending..." : "Send details"}
                                </Button>
                                <p className="text-center text-xs text-muted-foreground">
                                    Prefer email? Reach us at <a href="mailto:info@yatricloud.com" className="text-primary hover:underline">info@yatricloud.com</a>
                                </p>
                            </form>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
