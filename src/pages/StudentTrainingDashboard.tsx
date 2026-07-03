import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
    BookOpen, Video, CheckCircle, Award, FileText, BarChart3,
    Clock, Calendar, MapPin, User, ChevronRight, PlayCircle,
    Lock, Download, ExternalLink, Loader2, ArrowLeft, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { getStoredUser } from "@/lib/yatris-api";
import {
    getTrainingDetail, checkEnrollment, getCourseContent,
    getLessonProgress, markLessonComplete, unmarkLesson,
    issueCertificate, getMyCertificates,
} from "@/lib/training-api";
import Navbar from "@/components/Navbar";
import { SEO } from "@/components/SEO";

interface TrainingDetails {
    id: string;
    courseName: string;
    description: string;
    instructor: string;
    level: string;
    duration: string;
    thumbnailUrl: string;
    mode: "Online" | "On-site";
    skills: string;
    outcomes: string;
    modulesCount: number;
    startDate?: string;
    startTime?: string;
    venue?: string;
    meetLink?: string;
    folderUrl?: string;
}

type TabType = 'overview' | 'modules' | 'quizzes' | 'class' | 'resources';

export default function StudentTrainingDashboard() {
    // Route param is a slug (old id-based links still resolve via getTrainingDetail).
    const { slug: trainingSlug } = useParams<{ slug?: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [training, setTraining] = useState<TrainingDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [certSerial, setCertSerial] = useState<string | null>(null);
    const [isIssuing, setIsIssuing] = useState(false);

    useEffect(() => {
        const stored = getStoredUser();
        if (!stored) {
            toast.error("Please login to access this training");
            navigate(`/training/${trainingSlug}`);
            return;
        }
        setUser(stored);
    }, [navigate, trainingSlug]);

    useEffect(() => {
        if (user && trainingSlug) {
            fetchTrainingData();
        }
    }, [user, trainingSlug]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['overview', 'modules', 'quizzes', 'class', 'resources'].includes(tab)) {
            setActiveTab(tab as TabType);
        }
    }, [searchParams]);

    const fetchTrainingData = async () => {
        setIsLoading(true);
        try {
            // Fetch training details (resolves by slug or id)
            const foundTraining = await getTrainingDetail(trainingSlug!);
            if (!foundTraining) {
                toast.error("Training not found");
                navigate('/training');
                return;
            }
            setTraining(foundTraining as unknown as TrainingDetails);

            // Check enrollment against the resolved training id
            const enrolled = await checkEnrollment(foundTraining.id);
            if (!enrolled) {
                toast.error("You are not enrolled in this training");
                navigate(`/training/${trainingSlug}`);
                return;
            }
            setIsEnrolled(true);

            // Real authored curriculum + this user's progress + any issued certificate.
            const [content, progress, myCerts] = await Promise.all([
                getCourseContent(foundTraining.id),
                getLessonProgress(foundTraining.id),
                getMyCertificates(),
            ]);
            setModules(Array.isArray(content?.modules) ? content.modules : []);
            setCompletedLessons(new Set(progress));
            const existingCert = myCerts.find((c: any) => c.training_id === foundTraining.id);
            setCertSerial(existingCert?.serial || null);

            // Quizzes have no Supabase table yet; resources come from the training row.
            setQuizzes(Array.isArray(content?.quizzes) ? content.quizzes : []);
            setResources(
                Array.isArray(content?.resources) && content.resources.length
                    ? content.resources
                    : (Array.isArray(foundTraining.resources) ? foundTraining.resources : [])
            );

        } catch (e) {
            console.error(e);
            toast.error("Failed to load training data");
        } finally {
            setIsLoading(false);
        }
    };

    // Optimistic toggle: flip the UI first, reconcile with the server, revert on failure.
    const toggleLesson = async (lessonId: string) => {
        if (!training) return;
        const wasDone = completedLessons.has(lessonId);
        setCompletedLessons((prev) => {
            const next = new Set(prev);
            if (wasDone) next.delete(lessonId); else next.add(lessonId);
            return next;
        });
        const ok = wasDone
            ? await unmarkLesson(lessonId)
            : await markLessonComplete(training.id, lessonId);
        if (!ok) {
            setCompletedLessons((prev) => {
                const next = new Set(prev);
                if (wasDone) next.add(lessonId); else next.delete(lessonId);
                return next;
            });
            toast.error("We could not update your progress. Please try again.");
        }
    };

    const handleGetCertificate = async () => {
        if (!training) return;
        setIsIssuing(true);
        const res = await issueCertificate(training.id);
        setIsIssuing(false);
        if (res.ok && res.serial) {
            setCertSerial(res.serial);
            toast.success("Your certificate is ready.");
        } else {
            toast.error(res.message || "We could not issue your certificate just now.");
        }
    };

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'modules', label: 'Modules', icon: BookOpen },
        { id: 'quizzes', label: 'Quizzes', icon: CheckCircle },
        { id: 'class', label: 'Join Class', icon: Video },
        { id: 'resources', label: 'Resources', icon: FileText },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!training || !isEnrolled) {
        return null;
    }

    const skills = training.skills ? training.skills.split(',').map(s => s.trim()) : [];
    const outcomes = training.outcomes ? training.outcomes.split('\n').filter(o => o.trim()) : [];

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title={`${training.courseName} - Dashboard | Yatri Cloud`}
                description={`Access your ${training.courseName} training materials`}
            />
            <Navbar />

            <div className="pt-20">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border-b">
                    <div className="container mx-auto px-4 py-6">
                        <Button
                            variant="ghost"
                            className="gap-2 mb-4 pl-0 hover:pl-2 transition-all"
                            onClick={() => navigate('/my-trainings')}
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to My Trainings
                        </Button>
                        <div className="flex items-start gap-4">
                            {training.thumbnailUrl && (
                                <img
                                    src={training.thumbnailUrl}
                                    alt={training.courseName}
                                    className="w-40 h-auto aspect-video rounded-lg object-cover border-2 border-border"
                                />
                            )}
                            <div className="flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">{training.courseName}</h1>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {training.instructor}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {training.duration}
                                    </div>
                                    <Badge variant="secondary">{training.level}</Badge>
                                    <Badge variant={training.mode === 'Online' ? 'default' : 'outline'}>
                                        {training.mode}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <aside className="lg:col-span-1">
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <CardTitle className="text-lg">Navigation</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <nav className="space-y-1">
                                        {sidebarItems.map((item) => {
                                            const Icon = item.icon;
                                            const isActive = activeTab === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setActiveTab(item.id as TabType)}
                                                    className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all ${isActive
                                                        ? 'bg-primary text-primary-foreground font-medium'
                                                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                                        }`}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span>{item.label}</span>
                                                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </CardContent>
                            </Card>
                        </aside>

                        {/* Content Area */}
                        <main className="lg:col-span-3">
                            {activeTab === 'overview' && <OverviewTab training={training} outcomes={outcomes} skills={skills} />}
                            {activeTab === 'modules' && (
                                <ModulesTab
                                    training={training}
                                    modules={modules}
                                    completedLessons={completedLessons}
                                    onToggleLesson={toggleLesson}
                                    certSerial={certSerial}
                                    isIssuing={isIssuing}
                                    onGetCertificate={handleGetCertificate}
                                />
                            )}
                            {activeTab === 'quizzes' && <QuizzesTab training={training} quizzes={quizzes} />}
                            {activeTab === 'class' && <JoinClassTab training={training} />}
                            {activeTab === 'resources' && <ResourcesTab training={training} resources={resources} />}
                        </main>
                    </div>
                </div>
            </div>

            {/* Minimal Footer */}
            <footer className="border-t mt-12">
                <div className="container mx-auto px-4 py-6">
                    <p className="text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Yatri Cloud. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

// Smart description formatter
function FormattedDescription({ text }: { text: string }) {
    if (!text) return null;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const elements: JSX.Element[] = [];
    let i = 0;
    let key = 0;

    // Check if a line is a header (ends with ? or : and is short, OR is a short title-like line)
    const isHeaderLine = (line: string, idx: number) => {
        // Not a list item
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+[.\)]/.test(line)) return false;
        // Ends with ? or : → header
        if ((line.endsWith('?') || line.endsWith(':')) && line.length < 80) return true;
        // Short title-like line (under 50 chars, mostly capitalized words, not ending with period)
        // and followed by shorter/list-like lines
        if (line.length < 50 && !line.endsWith('.') && /^[A-Z]/.test(line)) {
            const nextIdx = idx + 1;
            if (nextIdx < lines.length) {
                const next = lines[nextIdx];
                // Next line is a list item or short line → this is likely a header
                if (/^[•\-\*]\s/.test(next) || /^\d+[.\)]/.test(next) || (next.length < 100 && !next.endsWith('.'))) {
                    return true;
                }
            }
        }
        return false;
    };

    // Check if a line is a bullet item (starts with •, -, *)
    const isBulletLine = (line: string) => /^[•\-\*]\s/.test(line);

    // Check if a line is a numbered item
    const isNumberedLine = (line: string) => /^\d+[.\)]\s/.test(line);

    // Check if a line is a short "list-like" item (not a header, not a long paragraph)
    const isShortListItem = (line: string) => (
        line.length < 100 && !isHeaderLine(line, 0) && !line.endsWith('.') && !isBulletLine(line) && !isNumberedLine(line)
    );

    while (i < lines.length) {
        const line = lines[i];

        // --- Headers ---
        if (isHeaderLine(line, i)) {
            elements.push(
                <h3 key={key++} className="text-base font-semibold text-foreground mt-6 mb-1 first:mt-0">
                    {line}
                </h3>
            );
            i++;

            // After header, collect consecutive short lines as a bullet list
            const listItems: string[] = [];
            while (i < lines.length && !isHeaderLine(lines[i], i)) {
                const nextLine = lines[i];
                if (isBulletLine(nextLine)) {
                    listItems.push(nextLine.replace(/^[•\-\*]\s+/, ''));
                    i++;
                } else if (isNumberedLine(nextLine)) {
                    listItems.push(nextLine.replace(/^\d+[.\)]\s+/, ''));
                    i++;
                } else if (isShortListItem(nextLine)) {
                    listItems.push(nextLine);
                    i++;
                } else {
                    break; // Long paragraph line — stop collecting
                }
            }

            if (listItems.length > 0) {
                elements.push(
                    <ul key={key++} className="list-disc list-inside space-y-1 pl-2 mb-2">
                        {listItems.map((item, idx) => (
                            <li key={idx} className="text-muted-foreground text-sm leading-relaxed">
                                {item}
                            </li>
                        ))}
                    </ul>
                );
            }
            continue;
        }

        // --- Explicit bullet points ---
        if (isBulletLine(line)) {
            const bulletItems: string[] = [];
            while (i < lines.length && isBulletLine(lines[i])) {
                bulletItems.push(lines[i].replace(/^[•\-\*]\s+/, ''));
                i++;
            }
            elements.push(
                <ul key={key++} className="list-disc list-inside space-y-1 my-2 pl-2">
                    {bulletItems.map((item, idx) => (
                        <li key={idx} className="text-muted-foreground text-sm leading-relaxed">
                            {item}
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // --- Explicit numbered lists ---
        if (isNumberedLine(line)) {
            const numItems: string[] = [];
            while (i < lines.length && isNumberedLine(lines[i])) {
                numItems.push(lines[i].replace(/^\d+[.\)]\s+/, ''));
                i++;
            }
            elements.push(
                <ol key={key++} className="list-decimal list-inside space-y-1 my-2 pl-2">
                    {numItems.map((item, idx) => (
                        <li key={idx} className="text-muted-foreground text-sm leading-relaxed">
                            {item}
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // --- Regular paragraph ---
        elements.push(
            <p key={key++} className="text-muted-foreground leading-relaxed text-sm">
                {line}
            </p>
        );
        i++;
    }

    return <div className="space-y-2">{elements}</div>;
}

// Overview Tab Component
function OverviewTab({ training, outcomes, skills }: { training: TrainingDetails; outcomes: string[]; skills: string[] }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome to {training.courseName}</CardTitle>
                    <CardDescription>Your learning journey starts here</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormattedDescription text={training.description} />

                    {training.startDate && (
                        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                            <Calendar className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium">Training Schedule</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(training.startDate).toLocaleDateString('en-US', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                    {training.startTime && ` at ${training.startTime}`}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>What You'll Learn</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {outcomes.length > 0 ? outcomes.map((outcome, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{outcome}</span>
                            </div>
                        )) : (
                            <p className="text-muted-foreground italic">Detailed outcomes available in modules</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Skills You'll Gain</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill, i) => (
                            <Badge key={i} variant="secondary">{skill}</Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Modules Tab Component — real curriculum, per-lesson progress, and certificate.
function ModulesTab({
    training, modules, completedLessons, onToggleLesson,
    certSerial, isIssuing, onGetCertificate,
}: {
    training: TrainingDetails;
    modules: any[];
    completedLessons: Set<string>;
    onToggleLesson: (lessonId: string) => void;
    certSerial: string | null;
    isIssuing: boolean;
    onGetCertificate: () => void;
}) {
    const allLessons = modules.flatMap((m: any) =>
        (m.lessons || []).map((l: any) => ({ ...l, moduleId: m.moduleId }))
    );
    const total = allLessons.length;
    const done = allLessons.filter((l: any) => completedLessons.has(l.lessonId)).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const firstIncomplete = allLessons.find((l: any) => !completedLessons.has(l.lessonId));

    const [openModule, setOpenModule] = useState<string | undefined>(
        modules[0]?.moduleId ? `module-${modules[0].moduleId}` : undefined
    );

    const handleResume = () => {
        if (!firstIncomplete) return;
        setOpenModule(`module-${firstIncomplete.moduleId}`);
        const reduce = typeof window !== 'undefined'
            && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        setTimeout(() => {
            document.getElementById(`lesson-${firstIncomplete.lessonId}`)?.scrollIntoView({
                behavior: reduce ? 'auto' : 'smooth',
                block: 'center',
            });
        }, 150);
    };

    if (total === 0) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Course Modules</CardTitle>
                        <CardDescription>Your curriculum</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Curriculum coming soon</h3>
                            <p className="text-muted-foreground">
                                Your instructor is still adding lessons. Check back shortly.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Progress + certificate */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-display">Your Progress</CardTitle>
                    <CardDescription>{done} of {total} lessons complete</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2 text-sm font-medium">
                            <span>{pct}% complete</span>
                            {firstIncomplete && <span className="text-muted-foreground">{total - done} left</span>}
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-brand-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {firstIncomplete && (
                            <Button onClick={handleResume} className="min-h-[44px] gap-2">
                                <PlayCircle className="w-4 h-4" />
                                Resume
                            </Button>
                        )}
                        {certSerial ? (
                            <Button asChild variant="outline" className="min-h-[44px] gap-2">
                                <Link to={`/certificate/${certSerial}`}>
                                    <Award className="w-4 h-4" />
                                    View certificate
                                </Link>
                            </Button>
                        ) : pct === 100 ? (
                            <Button
                                onClick={onGetCertificate}
                                disabled={isIssuing}
                                className="min-h-[44px] gap-2"
                            >
                                {isIssuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                                Get your certificate
                            </Button>
                        ) : null}
                    </div>
                </CardContent>
            </Card>

            {/* Modules */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-display">Course Modules</CardTitle>
                    <CardDescription>{modules.length} modules • {total} lessons</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full space-y-3"
                        value={openModule}
                        onValueChange={setOpenModule}
                    >
                        {modules.map((mod: any, i: number) => {
                            const lessons = mod.lessons || [];
                            const modDone = lessons.filter((l: any) => completedLessons.has(l.lessonId)).length;
                            return (
                                <AccordionItem
                                    key={mod.moduleId || i}
                                    value={`module-${mod.moduleId}`}
                                    className="border rounded-xl bg-card shadow-sm overflow-hidden"
                                >
                                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/20">
                                        <div className="flex items-center gap-4 text-left w-full">
                                            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center font-bold text-primary">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-base">
                                                    {mod.moduleName || `Module ${i + 1}`}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {modDone} of {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} complete
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 bg-muted/5 border-t">
                                        <div className="space-y-2 pt-3">
                                            {lessons.length === 0 ? (
                                                <p className="text-sm text-muted-foreground py-2">
                                                    Lessons for this module are coming soon.
                                                </p>
                                            ) : lessons.map((lesson: any, li: number) => {
                                                const isDone = completedLessons.has(lesson.lessonId);
                                                return (
                                                    <div
                                                        key={lesson.lessonId || li}
                                                        id={`lesson-${lesson.lessonId}`}
                                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors"
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            {isDone
                                                                ? <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                                                : <PlayCircle className="w-5 h-5 text-primary/70 flex-shrink-0 mt-0.5" />}
                                                            <div className="min-w-0">
                                                                <span className="font-medium text-sm block">
                                                                    {lesson.lessonTitle || `Lesson ${li + 1}`}
                                                                </span>
                                                                <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                                                                    {lesson.contentType && <span className="capitalize">{lesson.contentType}</span>}
                                                                    {lesson.duration && <span className="tabular-nums">{lesson.duration}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {lesson.contentUrl && (
                                                                <Button asChild size="sm" variant="outline" className="min-h-[44px]">
                                                                    <a href={lesson.contentUrl} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="w-4 h-4 mr-1.5" />
                                                                        Open
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant={isDone ? "secondary" : "default"}
                                                                onClick={() => onToggleLesson(lesson.lessonId)}
                                                                className="min-h-[44px]"
                                                            >
                                                                {isDone ? "Completed" : "Mark complete"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}

// Quizzes Tab Component
function QuizzesTab({ training, quizzes }: { training: TrainingDetails; quizzes: any[] }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Practice Quizzes</CardTitle>
                    <CardDescription>Test your knowledge and track your progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {quizzes.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Quizzes Available</h3>
                            <p className="text-muted-foreground">
                                Quizzes will be available when your instructor adds them.
                            </p>
                        </div>
                    ) : (
                        quizzes.map((quiz) => (
                            <Card key={quiz.id} className="overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-2">{quiz.question || 'Quiz Question'}</h3>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                                                <span>{quiz.questionType || 'multiple-choice'}</span>
                                                <span>•</span>
                                                <span>{quiz.options?.length || 0} Options</span>
                                            </div>
                                        </div>
                                        <div>
                                            <Button size="sm" className="bg-[#007CFF] hover:bg-[#0066D6]">
                                                Start Quiz
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Join Class Tab Component
function JoinClassTab({ training }: { training: TrainingDetails }) {
    // Helper to format time from ISO or raw string
    const formatTime = (timeStr?: string) => {
        if (!timeStr) return 'Time TBA';
        try {
            const date = new Date(timeStr);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
        } catch { }
        return timeStr;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Live Class</CardTitle>
                    <CardDescription>Join your scheduled training session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {training.meetLink ? (
                        <>
                            {/* Training Image */}
                            {training.thumbnailUrl && (
                                <div className="aspect-video w-full rounded-lg overflow-hidden border border-border">
                                    <img
                                        src={training.thumbnailUrl}
                                        alt={training.courseName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    <span className="font-medium">
                                        {training.startDate && new Date(training.startDate).toLocaleDateString('en-US', {
                                            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>{formatTime(training.startTime)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full gap-2 bg-[#007CFF] hover:bg-[#0066D6]"
                                asChild
                            >
                                <a href={training.meetLink} target="_blank" rel="noopener noreferrer">
                                    <Video className="w-5 h-5" />
                                    Join Training
                                </a>
                            </Button>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <Video className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Active Class</h3>
                            <p className="text-muted-foreground">
                                The class link will be available when the session is scheduled.
                            </p>
                        </div>
                    )}

                    {training.mode === 'On-site' && training.venue && (
                        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">On-site Training Location</p>
                                    <p className="text-sm text-muted-foreground">{training.venue}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Resources Tab Component
function ResourcesTab({ training, resources }: { training: TrainingDetails; resources: any[] }) {
    // Convert Google Drive folder URL to embeddable URL
    const getEmbedUrl = (url: string) => {
        // Extract folder ID from various Google Drive URL formats
        const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (match) {
            return `https://drive.google.com/embeddedfolderview?id=${match[1]}#grid`;
        }
        return url;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Training Resources</CardTitle>
                    <CardDescription>Access course materials and additional resources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {training.folderUrl && (
                        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-4 border-b border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Course Materials</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Browse all course files, slides, and resources
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full" style={{ height: '500px' }}>
                                    <iframe
                                        src={getEmbedUrl(training.folderUrl)}
                                        className="w-full h-full border-0"
                                        title="Course Materials"
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {resources.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {resources.map((resource) => (
                                <Card key={resource.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                {resource.type === 'PDF' && <FileText className="w-5 h-5 text-primary" />}
                                                {resource.type === 'Video' && <Video className="w-5 h-5 text-primary" />}
                                                {resource.type === 'Link' && <ExternalLink className="w-5 h-5 text-primary" />}
                                                {resource.type === 'Document' && <FileText className="w-5 h-5 text-primary" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium mb-1">{resource.name}</h4>
                                                {resource.description && (
                                                    <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                                                )}
                                                <Button asChild size="sm" variant="outline">
                                                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        View
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        !training.folderUrl && (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No Resources Available</h3>
                                <p className="text-muted-foreground">
                                    Resources will be available when your instructor adds them.
                                </p>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
