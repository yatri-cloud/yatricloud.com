
import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, Clock, User, Award, CheckCircle2, MapPin, Globe, PlayCircle, Lock, ChevronDown, ChevronUp, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EnrollmentModal } from "@/components/EnrollmentModal";
import { SEO } from "@/components/SEO";
import { listPublishedTrainings, listInstructorProfiles } from "@/lib/training-api";

interface Course {
    id: string;
    slug?: string;
    courseName: string;
    description: string;
    instructor: string;
    level: string;
    duration: string;
    paymentType: "Free" | "Paid";
    price: string;
    thumbnailUrl: string;
    subType: string;
    mode: "Online" | "On-site";
    skills: string;
    outcomes: string;
    modulesCount: number;
    venue?: string;
    capacity?: string;
    folderUrl?: string;
}

interface InstructorProfile {
    trainerId: string;
    fullName: string;
    role: string;
    bio: string;
    rating: string;
    studentsCount: string;
    coursesCount: string;
    photoUrl: string;
}

export default function TrainingDetail() {
    const { id, certification, courseSlug } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [instructorProfile, setInstructorProfile] = useState<InstructorProfile | null>(null);

    useEffect(() => {
        // Fetch course if we have an ID or slugs (certification/courseSlug)
        if (id || courseSlug) {
            fetchCourse();
        }
    }, [id, courseSlug]);

    // Trigger instructor profile fetch when course changes/is loaded
    useEffect(() => {
        if (course?.instructor) {
            const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"];
            const isInstructorLevel = levels.some(l => course.instructor?.includes(l));
            const isDescriptionName = course.description && course.description.length < 50 && !course.description.includes(',') && !levels.some(l => course.description?.includes(l));
            
            let instructorName = course.instructor;
            if (isInstructorLevel && isDescriptionName) {
                instructorName = course.description;
            }
            fetchInstructorProfile(instructorName);
        }
    }, [course]);

    const fetchCourse = async () => {
        setIsLoading(true);
        try {
            const structure = await listPublishedTrainings();
            const createSlug = (name: string) => {
                return String(name || '')
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/[\s_]+/g, '-')
                    .replace(/-+/g, '-');
            };

            const found = structure.find((c) => {
                // Single-segment route param may be a slug (preferred) or an old id.
                if (id) return c.slug === id || c.id === id;
                if (courseSlug) {
                    return createSlug(c.courseName) === courseSlug;
                }
                return false;
            });
            setCourse((found as unknown as Course) || null);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load course details");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInstructorProfile = async (instructorName: string) => {
        if (!instructorName) return;
        try {
            const profiles = await listInstructorProfiles();
            const profile = profiles.find((p: InstructorProfile) =>
                p.fullName.toLowerCase() === instructorName.toLowerCase()
            );
            if (profile) {
                setInstructorProfile(profile);
            }
        } catch (e) {
            console.error("Failed to fetch instructor profile:", e);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
                    <Link to="/training"><Button>Back to Catalog</Button></Link>
                </div>
                <Footer />
            </div>
        );
    }

    const skills = course.skills ? String(course.skills).split(',').map(s => s.trim()) : [];
    const outcomes = course.outcomes ? String(course.outcomes).split('•').filter(s => s.trim()).map(s => s.trim()) : [];
    
    // Advanced Data Normalization for mismatched API fields (e.g. CKA course)
    const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"];
    const isInstructorLevel = levels.some(l => course.instructor?.includes(l));
    const isDescriptionName = course.description && course.description.length < 50 && !course.description.includes(',') && !levels.some(l => course.description?.includes(l));
    const isDurationTopics = course.duration && course.duration.length > 50;

    let displayInstructor = course.instructor;
    let displayLevel = course.level;
    let displayDescription = course.description;
    let displayDuration = course.duration;

    if (isInstructorLevel && isDescriptionName) {
        displayInstructor = course.description;
        displayLevel = course.instructor;
        displayDescription = isDurationTopics ? course.duration : "";
    } else if (isDurationTopics) {
        displayDescription = course.duration;
    }

    if (displayDuration && displayDuration.length > 50) {
        displayDuration = "Self-paced";
    }

    // Common fixes for numeric/incorrect levels
    if (/^\d+$/.test(displayLevel || "")) {
        displayLevel = isInstructorLevel ? course.instructor : "All Levels";
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <SEO
                title={`${course.courseName} · Yatri Cloud Training`}
                description={
                    displayDescription && displayDescription.length > 20
                        ? displayDescription.slice(0, 157)
                        : `Learn ${course.courseName} with Yatri Cloud. Expert led cloud certification training with lifetime access and a certificate of completion.`
                }
                image={course.thumbnailUrl || undefined}
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Course",
                    name: course.courseName,
                    description:
                        displayDescription ||
                        `${course.courseName} cloud certification training by Yatri Cloud.`,
                    provider: {
                        "@type": "Organization",
                        name: "Yatri Cloud",
                        url: "https://www.yatricloud.com",
                    },
                    ...(course.thumbnailUrl ? { image: course.thumbnailUrl } : {}),
                }}
            />
            <Navbar />

            {/* Header / Hero */}
            <div className="bg-[#1c1d1f] text-white pt-32 pb-12 md:pb-24 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[#1c1d1f] z-0"></div>

                <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="pt-2"></div>

                        <h1 className="text-3xl md:text-5xl font-bold leading-tight">{course.courseName}</h1>
                        <div className="text-lg text-gray-300 leading-relaxed max-w-3xl prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white prose-ul:list-disc prose-ul:pl-4">
                            <ReactMarkdown>{displayDescription}</ReactMarkdown>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm mt-4">
                            {course.subType.includes("Microsoft") || course.subType.includes("Azure") ? <Badge variant="secondary" className="bg-[#0078d4] text-white border-none">Microsoft Certified</Badge> : null}
                            {course.subType.includes("AWS") ? <Badge variant="secondary" className="bg-[#FF9900] text-black border-none">AWS Certified</Badge> : null}
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400/50 flex items-center gap-1">
                                <Award className="w-3 h-3" /> Best Seller
                            </Badge>
                            <span className="flex items-center gap-1 text-gray-300">
                                <User className="w-3 h-3" /> Created by <span className="text-blue-300 underline underline-offset-4">{displayInstructor}</span>
                            </span>
                            <span className="flex items-center gap-1 text-gray-300">
                                <Clock className="w-3 h-3" /> Last updated: {new Date(course.id).toLocaleDateString() === "Invalid Date" ? "Recently" : new Date(course.id).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-white font-medium pt-4">
                            <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> {course.mode} Format</span>
                            {course.mode === "On-site" && <span className="flex items-center gap-2 text-amber-400"><MapPin className="w-4 h-4" /> {course.venue}</span>}
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {displayLevel} Level</span>
                        </div>
                    </div>



                    {/* Sidebar Card - Aligned with Title */}
                    <div className="lg:col-span-1 relative">
                        <div className="lg:sticky lg:top-4 h-fit z-30">
                            <Card className="shadow-2xl border border-white/10 overflow-hidden rounded-xl bg-[#2d2f31] text-white">
                                <div className="aspect-video bg-muted relative group cursor-pointer">
                                    {course.thumbnailUrl ? (
                                        <img src={course.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                            <PlayCircle className="w-16 h-16 text-white opacity-80" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PlayCircle className="w-16 h-16 text-white drop-shadow-lg scale-110" />
                                    </div>
                                </div>
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold">
                                            {course.paymentType === "Paid" ? course.price : "Free"}
                                        </span>
                                        {course.paymentType === "Paid" && <span className="text-sm text-muted-foreground line-through">USD 199.99</span>}
                                        {course.paymentType === "Paid" && <span className="text-sm text-amber-600 font-medium">80% off</span>}
                                    </div>

                                    <Button
                                        className="w-full h-12 text-lg font-bold bg-[#007CFF] hover:bg-[#0066D6] text-white rounded-lg transition-all shadow-lg"
                                        onClick={() => {
                                            if (isEnrolled) {
                                                navigate(`/training/${course.slug || course.id}/dashboard`);
                                            } else {
                                                setIsEnrollModalOpen(true);
                                            }
                                        }}
                                    >
                                        {isEnrolled ? "Go to Training" : (course.paymentType === "Free" ? "Enroll for Free" : "Buy Now")}
                                    </Button>

                                    <p className="text-xs text-center text-muted-foreground">30-Day Money-Back Guarantee</p>

                                    <div className="space-y-3 text-sm">
                                        <h4 className="font-bold">This course includes:</h4>
                                        <div className="flex items-center gap-3 text-muted-foreground"><PlayCircle className="w-4 h-4" /> {displayDuration} on-demand video</div>
                                        <div className="flex items-center gap-3 text-muted-foreground"><Share2 className="w-4 h-4" /> Full lifetime access</div>
                                        <div className="flex items-center gap-3 text-muted-foreground"><Award className="w-4 h-4" /> Certificate of completion</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Content Wrapper to constrain Sticky Sidebar */}
            <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12 relative -mt-0 lg:-mt-20 z-20">

                {/* Main Content (Left) */}
                <div className="lg:col-span-2 space-y-12">

                    {/* What you'll learn */}
                    <Card className="rounded-xl border shadow-lg overflow-hidden border-border/50 bg-card mt-8 lg:mt-0">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold mb-8">What you'll learn</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                {outcomes.length > 0 ? outcomes.map((outcome, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed group">
                                        <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                        </div>
                                        <span>{outcome}</span>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground italic col-span-2">Detailed outcomes available in the course syllabus.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skills Gained */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Skills you'll gain</h2>
                        <div className="flex flex-wrap gap-2">
                            {skills.map(skill => (
                                <Badge key={skill} variant="secondary" className="px-3 py-1.5 text-sm">{skill}</Badge>
                            ))}
                        </div>
                    </div>

                    {/* Curriculum Section */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Course Content</h2>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-4">
                                <span>{course.modulesCount} Modules</span>
                                <span>•</span>
                                <span>{course.duration} Total Duration</span>
                            </div>
                        </div>

                        <Accordion type="single" collapsible className="w-full space-y-3">
                            {[...Array(Number(course.modulesCount) || 1)].map((_, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border-border/50">
                                    <AccordionTrigger className="px-6 py-5 hover:no-underline transition-colors data-[state=open]:bg-muted/20">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                {i + 1}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-base">Module {i + 1}: {i === 0 ? "Course Introduction" : `Core Concepts Part ${i}`}</div>
                                                <div className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">3 Lessons • 45m</div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 pt-2 bg-muted/5 border-t border-border/10">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-sm py-2 group cursor-pointer hover:text-primary transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <PlayCircle className="w-4 h-4 text-primary/60 group-hover:text-primary" />
                                                    <span className="font-medium">Welcome to the module</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground tabular-nums">05:00</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm py-2 group cursor-pointer hover:text-primary transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <PlayCircle className="w-4 h-4 text-primary/60 group-hover:text-primary" />
                                                    <span className="font-medium">Deep Dive into topic</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground tabular-nums">15:00</span>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>

                    {/* Instructor Card */}
                    <Card className="rounded-xl border shadow-lg border-border/50 overflow-hidden bg-card">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold mb-8">Meet your Instructor</h2>
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary ring-4 ring-primary/5 shrink-0 overflow-hidden">
                                    {instructorProfile?.photoUrl ? (
                                        <img src={instructorProfile.photoUrl} alt={displayInstructor} className="w-full h-full object-cover" />
                                    ) : displayInstructor.charAt(0)}
                                </div>
                                <div className="space-y-4 text-center md:text-left">
                                    <div>
                                        <h3 className="font-bold text-2xl text-primary">{displayInstructor}</h3>
                                        <p className="text-muted-foreground font-medium text-base">
                                            {instructorProfile?.role || "Cloud Expert & Senior Architect"}
                                        </p>
                                    </div>
                                    <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                                        {instructorProfile?.bio || (
                                            <>
                                                {displayInstructor} is a top-rated instructor with extensive experience in cloud computing.
                                                They have helped thousands of students achieve their certification goals by simplifying complex concepts and providing hands-on labs.
                                            </>
                                        )}
                                    </p>

                                    <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-primary text-xl">{instructorProfile?.rating || "4.8"}</span>
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Instructor Rating</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-primary text-xl">{instructorProfile?.studentsCount || "12,450+"}</span>
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Students</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-primary text-xl">{instructorProfile?.coursesCount || "15"}</span>
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Courses</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Sidebar spacer for desktop */}
                <div className="lg:col-span-1 hidden lg:block"></div>

            </div>

            <Footer simple={true} />

            {course && (
                <EnrollmentModal
                    open={isEnrollModalOpen}
                    onClose={() => setIsEnrollModalOpen(false)}
                    courseId={course.id}
                    courseName={course.courseName}
                    price={course.price}
                    currency={course.paymentType === 'Paid' ? (course.price.includes("₹") ? "INR" : "USD") : "INR"}
                    isPaid={course.paymentType === "Paid"}
                    onSuccess={() => {
                        setIsEnrolled(true);
                    }}
                />
            )}
        </div>
    );
}
