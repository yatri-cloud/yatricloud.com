
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Search, BookOpen, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LogoMarquee } from "@/components/TechLogos";
import { listPublishedTrainings } from "@/lib/training-api";
import {
    useSiteContent,
    getSiteStats,
    statValue,
    FALLBACK_STATS,
} from "@/lib/site-content";

/* Expand "50K+" style stat values to "50,000+" so the trust cue reads
 * exactly like today's copy. Non K values pass through untouched. */
const expandK = (raw: string): string => {
    const match = String(raw).match(/^(\d+(?:\.\d+)?)K(\+?)$/i);
    if (!match) return raw;
    const expanded = Math.round(parseFloat(match[1]) * 1000);
    return `${expanded.toLocaleString("en-US")}${match[2]}`;
};

interface Course {
    id: string;
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
    avgRating?: number;
    reviewCount?: number;
    certificationLabel?: string;
    certificationExamCode?: string;
    visibility?: string;
}

export default function Training() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCertification, setFilterCertification] = useState("All");

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        let result = courses;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.courseName.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.instructor.toLowerCase().includes(q)
            );
        }

        if (filterCertification && filterCertification !== "All") {
            result = result.filter(c => c.subType === filterCertification);
        }

        setFilteredCourses(result);
    }, [courses, searchQuery, filterCertification]);

    const fetchCourses = async () => {
        try {
            const structure = await listPublishedTrainings();
            // Private trainings are unlisted — reachable only via their direct link.
            const listed = (structure as unknown as Course[]).filter((c) => c.visibility !== "private");
            setCourses(listed);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const certifications = ["All", ...Array.from(new Set(courses.map(c => c.subType)))];

    const createSlug = (name: string) => {
        return String(name || '')
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // remove special chars
            .replace(/\s+/g, '-') // replace spaces with hyphens
            .replace(/-+/g, '-') // remove duplicate hyphens
            .trim();
    };

    const reduceMotion = useReducedMotion();
    const fadeUp = {
        hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
        show: { opacity: 1, y: 0 },
    };

    /* Trust cue numbers come from Supabase site_stats (seeded identical). */
    const siteStats = useSiteContent(getSiteStats, FALLBACK_STATS);
    const trustCues = [
        `${expandK(statValue(siteStats, "learners", "50K+"))} Yatris learning`,
        `${statValue(siteStats, "tracks", "6")} cloud tracks`,
        `${statValue(siteStats, "rating", "4.8")}★ average rating`,
        "Free tracks included",
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Navbar />

            {/* Hero Section — warm light-blue tint band, no black */}
            <div className="bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-background relative overflow-hidden border-b border-border/60">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-brand-200/20 blur-3xl" />
                {/* Soft dotted texture + breathing glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--primary)/0.12)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_60%,transparent_100%)]" />
                <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

                <div className="container relative z-10 mx-auto px-4 pt-28 pb-16 md:pt-32 md:pb-20">
                    <motion.div
                        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                        initial="hidden"
                        animate="show"
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.h1 variants={fadeUp} className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-6xl">
                            Real cloud skills.
                            <br />
                            <span className="gradient-text">A career you're proud of.</span>
                        </motion.h1>

                        <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                            Hands-on certification tracks, role-based paths, and live workshops — many of them free.
                            Learn the way real teams work, and get certified with confidence.
                        </motion.p>

                        {/* Search Bar */}
                        <motion.div variants={fadeUp} className="mx-auto mt-8 max-w-2xl">
                            <div className="relative flex items-center rounded-2xl border border-border bg-white shadow-card transition-shadow focus-within:shadow-elevated focus-within:ring-2 focus-within:ring-ring">
                                <Search className="pointer-events-none absolute left-4 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    placeholder="Search a certification, skill, or instructor…"
                                    aria-label="Search training courses"
                                    className="h-14 border-none bg-transparent pl-12 text-base focus-visible:ring-0"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </motion.div>

                        {/* Trust cues */}
                        <motion.ul variants={fadeUp} className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                            {trustCues.map((label) => (
                                <li key={label} className="inline-flex items-center gap-2">
                                    <span className="font-medium">{label}</span>
                                </li>
                            ))}
                        </motion.ul>
                    </motion.div>

                    {/* Provider strip — real tech logos */}
                    <motion.div variants={fadeUp} initial="hidden" animate="show" className="mx-auto mt-12 max-w-4xl">
                        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Skills that map to real cloud & DevOps tools
                        </p>
                        <LogoMarquee speed="slow" />
                    </motion.div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-12 flex-1">
                {/* Filters */}
                <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-border pb-4">
                    <div className="mr-auto flex items-center gap-2 text-foreground">
                        <span className="text-sm font-semibold">Browse by track</span>
                    </div>

                    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2 md:pb-0" role="group" aria-label="Filter courses by certification track">
                        {certifications.map(cert => (
                            <Button
                                key={cert}
                                variant={filterCertification === cert ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterCertification(cert)}
                                aria-pressed={filterCertification === cert}
                                className="min-h-[44px] rounded-full"
                            >
                                {cert}
                            </Button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div>
                        <p className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <BookOpen className="h-4 w-4 animate-pulse text-primary" aria-hidden="true" />
                            Loading your courses…
                        </p>
                        <div className="grid justify-center gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),360px))]">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-96 animate-pulse rounded-2xl border border-border bg-muted/60" />
                            ))}
                        </div>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="mx-auto max-w-md py-20 text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-primary">
                        </div>
                        <h2 className="font-display text-xl font-bold text-foreground">No matches yet, Yatris</h2>
                        <p className="mt-2 text-muted-foreground">
                            Fresh tracks and workshops drop often. Try another search, or clear your filters to see everything.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => { setSearchQuery(""); setFilterCertification("All"); }}
                            className="mt-5 min-h-[44px] rounded-full"
                        >
                            Show all courses <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                ) : (
                    <div className="grid justify-center gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),360px))]">
                        {filteredCourses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.4, delay: reduceMotion ? 0 : Math.min(index, 7) * 0.05 }}
                            >
                                <Link
                                    to={`/training/${createSlug(course.subType)}/${createSlug(course.courseName)}`}
                                    className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <Card className="flex h-full flex-col overflow-hidden border-brand-100 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-elevated">
                                        <div className="relative aspect-video overflow-hidden bg-muted">
                                            {course.thumbnailUrl ? (
                                                <img src={course.thumbnailUrl} alt={course.courseName} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-brand-50">
                                                    <BookOpen className="h-12 w-12 text-primary/30" aria-hidden="true" />
                                                </div>
                                            )}
                                            <div className="absolute left-2 top-2 flex gap-2">
                                                {course.mode === "On-site" && (
                                                    <Badge className="border-none bg-warning text-white shadow-sm hover:bg-warning/90">
                                                        On-site
                                                    </Badge>
                                                )}
                                                {course.paymentType === "Free" && (
                                                    <Badge className="border-none bg-success text-white shadow-sm hover:bg-success/90">
                                                        Free access
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <CardContent className="flex flex-1 flex-col gap-2 p-4">
                                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-primary">
                                                <span className="flex items-center gap-1">
                                                    {course.subType}
                                                </span>
                                                {(course.certificationExamCode || course.certificationLabel) && (
                                                    <Badge variant="outline" className="border-primary/30 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                                        {course.certificationExamCode || course.certificationLabel}
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="line-clamp-2 text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                                                {course.courseName}
                                            </h3>
                                            {/* Description removed for better catalog UI - details still visible in individual training pages */}


                                            <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    {course.instructor || "Yatri Team"}
                                                </span>
                                                {/* Duration removed as it contains long topic list - kept for detail page */}

                                                {(course.reviewCount ?? 0) > 0 && (
                                                    <span className="ml-auto flex items-center gap-1 font-medium text-warning">
                                                        <Star className="h-3 w-3 fill-current" aria-hidden="true" /> {(course.avgRating ?? 0).toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>

                                        <CardFooter className="flex items-center justify-between border-t border-border bg-brand-50/40 p-4">
                                            <div className="text-lg font-bold">
                                                {course.paymentType === "Paid" ? (
                                                    <span className="text-primary">{course.price}</span>
                                                ) : (
                                                    <span className="text-success">Free</span>
                                                )}
                                            </div>
                                            <span className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-inset-btn transition-all group-hover:shadow-glow-soft">
                                                View course <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                                            </span>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
