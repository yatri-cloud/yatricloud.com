import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Loader2,
    FileText,
    Download,
    Clock,
    CircleAlert,
    Upload,
    X,
    Trash2,
    Eye,
    Pencil,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    Target,
    Zap,
    Copy,
    Check,
    BarChart3,
    ArrowRight,
    Search,
    ShieldCheck,
    Layers,
    RefreshCw,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import {
    createResumeRequest,
    deleteResumeRequest,
    listMyResumeRequests,
    rebuildResumeRequest,
    resumeDownloadUrl,
    uploadResumeSource,
    type ResumeRequest,
} from "@/lib/resume-api";

import {
    analyzeResumeWithGemini,
    type AtsAnalysisResult,
} from "@/lib/ai-config";
import ReactMarkdown from "react-markdown";
import {
    generateResumeDocx,
    exportElementToPdf,
    parseResumeMarkdown,
} from "@/lib/resume-export";


const STATUS_META: Record<ResumeRequest["status"], { label: string; cls: string }> = {
    queued: { label: "Queued", cls: "bg-brand-50 text-primary border-brand-100" },
    processing: { label: "Building", cls: "bg-brand-50 text-primary border-brand-100" },
    ready: { label: "Ready", cls: "bg-success text-white border-success/20" },
    failed: { label: "Failed", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function ResumeMaker() {
    const user = useMemo(() => getStoredUser(), []);
    const [activeTab, setActiveTab] = useState<"ats-scanner" | "builder">("ats-scanner");

    // ATS Scanner State
    const { showConfirm: confirm } = useConfirm();
    const [atsResumeText, setAtsResumeText] = useState("");
    const [atsJdText, setAtsJdText] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [atsResult, setAtsResult] = useState<AtsAnalysisResult | null>(null);
    const [copiedText, setCopiedText] = useState(false);

    // Builder State
    const [fullName, setFullName] = useState(user?.fullName || "");
    const [inputText, setInputText] = useState("");
    const [jdText, setJdText] = useState("");
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [requests, setRequests] = useState<ResumeRequest[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Modals & Export State
    const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);
    const [edit, setEdit] = useState<ResumeRequest | null>(null);
    const [editText, setEditText] = useState("");
    const [editJd, setEditJd] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [downloadingDocx, setDownloadingDocx] = useState(false);
    const [isEditingOptimized, setIsEditingOptimized] = useState(false);
    const [editedOptimizedMarkdown, setEditedOptimizedMarkdown] = useState("");

    const refresh = async () => {
        const rows = await listMyResumeRequests();
        setRequests(rows);
        setLoaded(true);
    };

    useEffect(() => {
        if (!user) return;
        refresh();
    }, []);

    useEffect(() => {
        if (!user) return;
        if (!requests.some((r) => r.status === "queued" || r.status === "processing")) return;
        const t = window.setInterval(refresh, 6000);
        return () => window.clearInterval(t);
    }, [requests, user]);

    // Handle ATS Gemini Analysis
    const handleRunAtsScan = async () => {
        if (atsResumeText.trim().length < 50) {
            toast.error("Please paste your resume content (at least 50 characters) to analyze.");
            return;
        }

        setIsScanning(true);
        setAtsResult(null);
        try {
            const result = await analyzeResumeWithGemini(atsResumeText, atsJdText);
            setAtsResult(result);
            setEditedOptimizedMarkdown(result.optimized_resume_markdown || "");
            toast.success(`ATS Scan complete! Overall Score: ${result.ats_score}/100`);
        } catch (e: any) {
            console.error("[ATS Scanner]", e);
            toast.error(e?.message || "Failed to scan resume. Please check your AI API key in Admin settings.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleCopyMarkdown = () => {
        const md = editedOptimizedMarkdown || atsResult?.optimized_resume_markdown;
        if (!md) return;
        navigator.clipboard.writeText(md);
        setCopiedText(true);
        toast.success("Optimized resume copied to clipboard!");
        setTimeout(() => setCopiedText(false), 2000);
    };

    const handleExportPdf = async () => {
        setDownloadingPdf(true);
        try {
            const outName = `${fullName ? fullName.replace(/\s+/g, "_") : "ATS"}_Resume.pdf`;
            await exportElementToPdf("ats-resume-print-view", outName);
            toast.success("PDF resume downloaded successfully!");
        } catch (e: any) {
            console.error("[PDF Export]", e);
            toast.error(e?.message || "Failed to generate PDF.");
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleExportDocx = async () => {
        setDownloadingDocx(true);
        try {
            const md = editedOptimizedMarkdown || atsResult?.optimized_resume_markdown || "";
            const parsed = parseResumeMarkdown(md);
            const outName = `${fullName ? fullName.replace(/\s+/g, "_") : "ATS"}_Resume.docx`;
            await generateResumeDocx(parsed, outName);
            toast.success("Word (.docx) resume downloaded successfully!");
        } catch (e: any) {
            console.error("[Docx Export]", e);
            toast.error(e?.message || "Failed to generate Word document.");
        } finally {
            setDownloadingDocx(false);
        }
    };


    const pickFile = (file: File | null) => {
        if (!file) return;
        const name = file.name.toLowerCase();
        if (!name.endsWith(".pdf") && !name.endsWith(".docx") && !name.endsWith(".txt")) {
            toast.error("Upload a PDF, Word (.docx), or Text (.txt) file.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Keep the file under 10 MB.");
            return;
        }
        setSourceFile(file);

        // If txt file, read into ATS box
        if (name.endsWith(".txt")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                if (text) setAtsResumeText(text);
            };
            reader.readAsText(file);
        }
    };

    const submitBuilder = async () => {
        if (!user) return;
        if (!fullName.trim() || (!sourceFile && inputText.trim().length < 40)) {
            toast.error("Add your name, then upload your resume or paste your notes.");
            return;
        }
        setSubmitting(true);
        let inputFilePath: string | null = null;
        if (sourceFile) {
            const uploaded = await uploadResumeSource(sourceFile);
            if ("error" in uploaded) {
                setSubmitting(false);
                toast.error("The file did not upload. Please try again.");
                return;
            }
            inputFilePath = uploaded.path;
        }
        const result = await createResumeRequest({
            fullName: fullName.trim(),
            email: user.email || "",
            inputText: inputText.trim(),
            jdText: jdText.trim(),
            inputFilePath,
        });
        setSubmitting(false);
        if ("error" in result) {
            toast.error("That did not save. Please try again.");
            return;
        }
        toast.success("In the queue. Your resume will be ready here shortly.");
        setInputText("");
        setJdText("");
        setSourceFile(null);
        refresh();
    };

    const download = async (path: string | null) => {
        if (!path) return;
        const url = await resumeDownloadUrl(path);
        if (!url) {
            toast.error("Could not fetch the file. Try again in a moment.");
            return;
        }
        window.open(url, "_blank", "noopener");
    };

    const remove = async (r: ResumeRequest) => {
        const ok = await deleteResumeRequest(r);
        if (!ok) {
            toast.error("Could not delete that request.");
            return;
        }
        toast.success("Deleted.");
        refresh();
    };

    const retry = async (r: ResumeRequest) => {
        toast.info("Re-queueing resume build...");
        const ok = await rebuildResumeRequest(r);
        if (!ok) {
            toast.error("Could not retry this request.");
            return;
        }
        toast.success("Resume re-queued for processing!");
        refresh();
    };


    const openPreview = async (r: ResumeRequest) => {
        if (!r.pdf_path) return;
        const url = await resumeDownloadUrl(r.pdf_path);
        if (!url) {
            toast.error("Could not load the preview. Try again in a moment.");
            return;
        }
        setPreview({ name: r.full_name, url });
    };

    const openEdit = (r: ResumeRequest) => {
        setEdit(r);
        setEditText(r.input_text || "");
        setEditJd(r.jd_text || "");
    };

    const submitEdit = async () => {
        if (!edit) return;
        setEditSaving(true);
        const result = await createResumeRequest({
            fullName: edit.full_name,
            email: edit.email,
            inputText: editText.trim(),
            jdText: editJd.trim(),
            inputFilePath: edit.input_file_path || null,
        });
        setEditSaving(false);
        if ("error" in result) {
            toast.error("Could not queue the rebuild. You can have 3 requests building at a time.");
            return;
        }
        setEdit(null);
        toast.success("Rebuilding with your changes. Watch this list.");
        refresh();
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return "text-emerald-500 stroke-emerald-500";
        if (score >= 70) return "text-primary stroke-primary";
        if (score >= 50) return "text-amber-500 stroke-amber-500";
        return "text-destructive stroke-destructive";
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO
                title="AI ATS Resume Scanner & Builder | Yatri Cloud"
                description="Scan your resume with AI against modern ATS standards, discover missing keywords, score section by section, and generate recruiter-ready resumes."
                noindex={false}
            />
            <div className="noise-overlay" />
            <Navbar />

            <main className="pb-24">
                {/* Hero section */}
                <section className="relative overflow-hidden pt-28 pb-12">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
                    <div className="container relative z-10 mx-auto px-4 md:px-6 text-center space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3.5 py-1 text-xs font-semibold shadow-sm">
                            <Sparkles className="h-3.5 w-3.5" /> AI ATS Intelligence Engine
                        </div>
                        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
                            AI ATS Resume <span className="gradient-text">Score & Optimizer</span>
                        </h1>
                        <p className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground">
                            Scan your resume against modern ATS algorithms, detect missing high-impact keywords, and transform your bullets into recruiter-approved achievements.
                        </p>

                        {/* Switch Tabs */}
                        <div className="flex justify-center pt-4">
                            <div className="inline-flex p-1 rounded-2xl bg-muted border border-border">
                                <button
                                    onClick={() => setActiveTab("ats-scanner")}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "ats-scanner" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <Sparkles className="w-4 h-4 text-primary" /> Instant ATS Scanner
                                </button>
                                <button
                                    onClick={() => setActiveTab("builder")}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "builder" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <FileText className="w-4 h-4 text-primary" /> Resume Builder & Queue
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TAB 1: INSTANT ATS SCANNER */}
                {activeTab === "ats-scanner" && (
                    <section className="container mx-auto px-4 md:px-6 max-w-6xl space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Input Form */}
                            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Target className="w-5 h-5 text-primary" /> Resume & Job Description
                                    </h2>
                                    <Badge variant="outline" className="text-xs">
                                        Automated ATS Check
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Paste Your Resume Content *
                                    </label>
                                    <Textarea
                                        rows={10}
                                        value={atsResumeText}
                                        onChange={(e) => setAtsResumeText(e.target.value)}
                                        placeholder="Paste your complete resume text here (Summary, Work Experience, Skills, Education, Projects)..."
                                        className="rounded-xl font-mono text-xs leading-relaxed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Target Job Description / Role (Optional for Keyword Match)
                                    </label>
                                    <Textarea
                                        rows={5}
                                        value={atsJdText}
                                        onChange={(e) => setAtsJdText(e.target.value)}
                                        placeholder="Paste the job description (responsibilities, required skills, tools) to run targeted keyword gap analysis..."
                                        className="rounded-xl font-mono text-xs leading-relaxed"
                                    />
                                </div>

                                <Button
                                    onClick={handleRunAtsScan}
                                    disabled={isScanning || atsResumeText.trim().length < 50}
                                    className="w-full h-12 rounded-xl text-base font-semibold bg-primary text-primary-foreground shadow-inset-btn gap-2"
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Scanning Resume with AI Engine...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5 text-amber-300" />
                                            Run Complete ATS Scan & Analysis
                                        </>
                                    )}
                                </Button>
                            </div>


                            {/* Results & Score Card */}
                            <div className="space-y-6">
                                {isScanning ? (
                                    <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                                        <h3 className="font-display text-xl font-bold">Evaluating ATS Compatibility</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                            Parsing formatting, checking keyword density, evaluating quantifiable metrics, and scoring sections...
                                        </p>
                                    </div>
                                ) : atsResult ? (
                                    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
                                        {/* Score Header */}
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-border">
                                            <div className="space-y-2 text-center sm:text-left">
                                                <Badge className="rounded-full bg-primary text-white border-0 text-xs font-semibold">
                                                    {atsResult.overall_verdict}
                                                </Badge>
                                                <h3 className="text-2xl font-bold font-display">ATS Match Score</h3>
                                                <p className="text-xs text-muted-foreground max-w-xs">
                                                    {atsResult.summary}
                                                </p>
                                            </div>

                                            {/* Score Ring */}
                                            <div className="relative flex items-center justify-center">
                                                <div className="w-28 h-28 rounded-full border-8 border-muted flex flex-col items-center justify-center bg-background shadow-inner">
                                                    <span className={`text-3xl font-extrabold font-mono ${getScoreColor(atsResult.ats_score)}`}>
                                                        {atsResult.ats_score}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">/ 100</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section Scores */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Section Breakdown
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {Object.entries(atsResult.section_scores).map(([sec, score]) => (
                                                    <div key={sec} className="p-3 rounded-xl border bg-muted/40 space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="capitalize text-muted-foreground">{sec.replace("_", " ")}</span>
                                                            <span className="font-bold font-mono">{score}%</span>
                                                        </div>
                                                        <Progress value={score} className="h-1.5" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Keywords Match & Gap */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Keyword Analysis
                                            </h4>
                                            <div className="space-y-2 text-xs">
                                                {atsResult.matching_keywords.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <span className="text-success font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Matched Keywords ({atsResult.matching_keywords.length})
                                                        </span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {atsResult.matching_keywords.map((kw, i) => (
                                                                <Badge key={i} variant="outline" className="bg-success/5 border-success/30 text-success text-[11px]">
                                                                    {kw}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {atsResult.missing_keywords.length > 0 && (
                                                    <div className="space-y-1.5 pt-2">
                                                        <span className="text-destructive font-medium flex items-center gap-1">
                                                            <AlertTriangle className="w-3.5 h-3.5" /> Missing High-Impact Keywords ({atsResult.missing_keywords.length})
                                                        </span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {atsResult.missing_keywords.map((kw, i) => (
                                                                <Badge key={i} variant="outline" className="bg-destructive/5 border-destructive/30 text-destructive text-[11px]">
                                                                    + {kw}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto">
                                            <Sparkles className="w-7 h-7" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-display text-lg font-bold">Ready to Scan</h3>
                                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                                Paste your resume and optional job description on the left, then click "Run Complete ATS Scan" to receive full AI feedback.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detailed ATS Improvements & Bullet Rewrites */}
                        {atsResult && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Bullet Point Rewrites */}
                                {atsResult.bullet_point_improvements.length > 0 && (
                                    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4 shadow-sm">
                                        <h3 className="font-display text-lg font-bold flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-primary" /> Bullet Point Rewrites (XYZ Formula)
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Transformed into Action-Oriented, Quantified bullet points for higher ATS ranking.
                                        </p>

                                        <div className="space-y-4">
                                            {atsResult.bullet_point_improvements.map((item, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border bg-muted/30 space-y-2 text-xs">
                                                    <div className="text-muted-foreground line-through">
                                                        <span className="font-semibold text-destructive">Before:</span> {item.original}
                                                    </div>
                                                    <div className="font-medium text-foreground bg-success/10 p-2.5 rounded-lg border border-success/20">
                                                        <span className="font-bold text-success">Improved:</span> {item.improved}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground italic">
                                                        Why: {item.reason}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Plan */}
                                {atsResult.action_plan.length > 0 && (
                                    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4 shadow-sm">
                                        <h3 className="font-display text-lg font-bold flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-primary" /> Recruiter Action Checklist (95+ Target)
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Priority steps recommended by the ATS algorithm for higher interview callback rates.
                                        </p>
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                                            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground">
                                                {atsResult.action_plan.map((step, i) => (
                                                    <li key={i}>{step}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* FULL 1-PAGE ATS RESUME PREVIEW & INSTANT EXPORT */}
                        {atsResult && atsResult.optimized_resume_markdown && (
                            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-success text-white px-2.5 py-0.5 rounded-full">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Recruiter-Approved Single Page Layout
                                        </div>
                                        <h3 className="font-display text-xl font-bold flex items-center gap-2">
                                            Optimized 1-Page ATS Resume
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Compiled with strict ATS typography, executive contact lines, and quantifiable action achievements.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsEditingOptimized(!isEditingOptimized)}
                                            className="h-9 rounded-xl text-xs gap-1.5"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            {isEditingOptimized ? "View Live Sheet" : "Edit Text"}
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCopyMarkdown}
                                            className="h-9 rounded-xl text-xs gap-1.5"
                                        >
                                            {copiedText ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copiedText ? "Copied" : "Copy Markdown"}
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleExportDocx}
                                            disabled={downloadingDocx}
                                            className="h-9 rounded-xl text-xs gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/10"
                                        >
                                            {downloadingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                                            Download Word (.docx)
                                        </Button>

                                        <Button
                                            size="sm"
                                            onClick={handleExportPdf}
                                            disabled={downloadingPdf}
                                            className="h-9 rounded-xl text-xs gap-1.5 font-semibold bg-primary text-primary-foreground shadow-inset-btn"
                                        >
                                            {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                            Download PDF
                                        </Button>
                                    </div>
                                </div>

                                {isEditingOptimized ? (
                                    <div className="space-y-3">
                                        <Textarea
                                            rows={18}
                                            value={editedOptimizedMarkdown}
                                            onChange={(e) => setEditedOptimizedMarkdown(e.target.value)}
                                            className="font-mono text-xs leading-relaxed rounded-xl"
                                        />
                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                onClick={() => setIsEditingOptimized(false)}
                                                className="rounded-xl text-xs"
                                            >
                                                Done Editing & Preview
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-100 dark:bg-slate-900/60 p-4 md:p-8 rounded-2xl border flex justify-center overflow-x-auto">
                                        <div
                                            id="ats-resume-print-view"
                                            className="bg-white text-slate-900 shadow-2xl rounded-sm p-8 md:p-12 w-full max-w-[800px] min-h-[1020px] font-sans text-xs leading-relaxed space-y-4"
                                            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                                        >
                                            <div className="prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-950 prose-headings:font-bold prose-h1:text-2xl prose-h1:text-center prose-h1:tracking-tight prose-h1:text-slate-950 prose-h2:text-[13px] prose-h2:border-b prose-h2:border-slate-300 prose-h2:pb-1 prose-h2:mt-5 prose-h2:mb-2 prose-h2:uppercase prose-h2:tracking-wider prose-h2:text-[#0A2540] prose-h3:text-xs prose-h3:mt-3 prose-h3:mb-1 prose-p:my-1 prose-p:text-xs prose-p:text-slate-700 prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5 prose-li:text-xs prose-li:text-slate-700 prose-strong:text-slate-900">
                                                <ReactMarkdown>
                                                    {editedOptimizedMarkdown || atsResult.optimized_resume_markdown}
                                                </ReactMarkdown>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}


                {/* TAB 2: RESUME BUILDER & QUEUE */}
                {activeTab === "builder" && (
                    <section className="container mx-auto px-4 md:px-6">
                        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_1fr]">
                            {/* Request form */}
                            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                                {!user ? (
                                    <div className="py-10 text-center">
                                        <FileText className="mx-auto mb-4 h-12 w-12 text-primary" />
                                        <h2 className="font-display text-2xl font-bold">Sign in to build your resume</h2>
                                        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
                                            Your files stay private to your account, ready to download any time.
                                        </p>
                                        <Button asChild className="mt-6 shadow-inset-btn">
                                            <Link to="/certifiedyatris">Sign in</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div>
                                            <label htmlFor="rm-name" className="mb-1.5 block text-sm font-medium">
                                                Name on the resume
                                            </label>
                                            <Input
                                                id="rm-name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Your full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium">
                                                Upload your current resume{" "}
                                                <span className="text-muted-foreground">(PDF, Word or TXT)</span>
                                            </label>
                                            {sourceFile ? (
                                                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                                                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-primary">
                                                        <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                                                        <span className="truncate">{sourceFile.name}</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSourceFile(null)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                        aria-label="Remove uploaded file"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition hover:border-primary/50 hover:bg-muted/40">
                                                    <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                                                    <span className="mt-2 text-sm font-medium">Click to choose a file</span>
                                                    <span className="text-xs text-muted-foreground">PDF or .docx, up to 10 MB</span>
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.docx,.txt"
                                                        onChange={(e) => pickFile(e.target.files?.[0] || null)}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="rm-input" className="mb-1.5 block text-sm font-medium">
                                                Or paste your resume / notes here
                                            </label>
                                            <Textarea
                                                id="rm-input"
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                rows={6}
                                                placeholder="Paste your past experience, skills, certifications, degrees, achievements..."
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="rm-jd" className="mb-1.5 block text-sm font-medium">
                                                Target job description{" "}
                                                <span className="text-muted-foreground">(optional)</span>
                                            </label>
                                            <Textarea
                                                id="rm-jd"
                                                value={jdText}
                                                onChange={(e) => setJdText(e.target.value)}
                                                rows={4}
                                                placeholder="Paste the job description you are targeting..."
                                            />
                                        </div>

                                        <Button
                                            onClick={submitBuilder}
                                            disabled={submitting}
                                            className="w-full shadow-inset-btn h-11"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Queuing request...
                                                </>
                                            ) : (
                                                "Build My Resume"
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* List of past requests */}
                            <div className="space-y-4">
                                <h3 className="font-display text-xl font-bold">Your Resume Requests</h3>
                                {!user ? (
                                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                        Sign in to see and download your built resumes.
                                    </div>
                                ) : !loaded ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : requests.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                        No resumes built yet. Submit your details on the left to start!
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {requests.map((r) => {
                                            const meta = STATUS_META[r.status];
                                            return (
                                                <div key={r.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="font-semibold text-sm">{r.full_name}</h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(r.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <Badge className={meta.cls}>{meta.label}</Badge>
                                                    </div>

                                                    {r.status === "ready" && (
                                                        <div className="flex items-center gap-2 pt-1">
                                                            {r.pdf_path && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => openPreview(r)}
                                                                    className="h-8 rounded-lg text-xs"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                                                                </Button>
                                                            )}
                                                            {r.docx_path && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => download(r.docx_path)}
                                                                    className="h-8 rounded-lg text-xs"
                                                                >
                                                                    <Download className="w-3.5 h-3.5 mr-1" /> Word (.docx)
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => openEdit(r)}
                                                                className="h-8 rounded-lg text-xs"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={async () => { if (await confirm({ title: "Confirm", description: "Are you sure? This cannot be undone." })) { remove(r); } }}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {r.status === "failed" && (
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => retry(r)}
                                                                className="h-8 rounded-lg text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
                                                            >
                                                                <RefreshCw className="w-3.5 h-3.5" /> Retry Build
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={async () => { if (await confirm({ title: "Confirm", description: "Are you sure? This cannot be undone." })) { remove(r); } }}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}

                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Preview Modal */}
            {preview && (
                <Dialog open={Boolean(preview)} onOpenChange={() => setPreview(null)}>
                    <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle>{preview.name} - Resume Preview</DialogTitle>
                        </DialogHeader>
                        <iframe src={preview.url} className="w-full flex-1 border-0" title="Resume Preview" />
                    </DialogContent>
                </Dialog>
            )}

            {/* Edit Request Modal */}
            {edit && (
                <Dialog open={Boolean(edit)} onOpenChange={() => setEdit(null)}>
                    <DialogContent className="max-w-xl rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit & Rebuild Resume</DialogTitle>
                            <DialogDescription>Update your notes or job description to generate a new version.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div>
                                <label className="text-xs font-semibold mb-1 block">Notes / Content</label>
                                <Textarea rows={6} value={editText} onChange={(e) => setEditText(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1 block">Job Description</label>
                                <Textarea rows={4} value={editJd} onChange={(e) => setEditJd(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={submitEdit} disabled={editSaving}>
                                {editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Rebuild Resume
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <Footer />
        </div>
    );
}
