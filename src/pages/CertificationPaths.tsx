import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { getCertificationOptions, type CertificationOption } from "@/lib/training-api";
import { getCertificationLogoUrl } from "@/lib/certification-logos";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/lib/supabase";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Curated career goals. Each stage filters the live certification catalog by
 * provider + label keywords, so new catalog entries slot into the journey
 * automatically — nothing here hardcodes a certification.
 */
interface Stage {
    title: string;
    hint: string;
    level: RegExp;
}

interface Goal {
    id: string;
    label: string;
    tagline: string;
    providers: string[];
    /** Optional topic filter applied before the level split. */
    topic?: RegExp;
    stages: Stage[];
}

const LEVEL_STAGES: Stage[] = [
    { title: "Start here", hint: "No experience needed. These prove you know the ground floor.", level: /(practitioner|fundamentals|foundational|foundations|essentials|kcna|cloud digital leader)/i },
    { title: "Level up", hint: "The certifications recruiters search for. Aim here within your first year.", level: /(associate|administrator)/i },
    { title: "Go pro", hint: "Senior-level proof. These change what roles you get called for.", level: /(professional|expert|specialty|speciality|architect)/i },
];

const GOALS: Goal[] = [
    {
        id: "cloud-engineer",
        label: "Cloud Engineer",
        tagline: "Build and run infrastructure on AWS, Azure or Google Cloud.",
        providers: ["aws", "azure", "gcp"],
        stages: LEVEL_STAGES,
    },
    {
        id: "devops",
        label: "DevOps Engineer",
        tagline: "Ship faster with Kubernetes, Terraform, GitHub and cloud automation.",
        providers: ["kubernetes", "hashicorp", "github", "aws", "azure"],
        topic: /(kubernetes|kcna|cka|ckad|terraform|github|devops|sysops)/i,
        stages: LEVEL_STAGES,
    },
    {
        id: "data-ai",
        label: "Data & AI",
        tagline: "Turn data into decisions with analytics, ML and AI certifications.",
        providers: ["aws", "azure", "gcp", "oracle", "openai"],
        topic: /(data|ai|machine learning|analytics|database)/i,
        stages: LEVEL_STAGES,
    },
    {
        id: "security",
        label: "Cloud Security",
        tagline: "Protect cloud platforms — the fastest-growing specialty in the field.",
        providers: ["aws", "azure", "gcp"],
        topic: /(security|identity)/i,
        stages: LEVEL_STAGES,
    },
];

const STAGE_CAP = 6;

export default function CertificationPaths() {
    const reduce = useReducedMotion();
    const { theme } = useTheme();
    const [goalId, setGoalId] = useState(GOALS[0].id);
    const [catalog, setCatalog] = useState<CertificationOption[]>([]);
    const [yatriCounts, setYatriCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        getCertificationOptions().then(setCatalog);
        // Social proof: how many wall-of-fame Yatris hold each provider's certs.
        supabase
            .from("certifications")
            .select("provider")
            .then(({ data }) => {
                const counts: Record<string, number> = {};
                (data || []).forEach((row: any) => {
                    const key = String(row.provider || "").toLowerCase();
                    counts[key] = (counts[key] || 0) + 1;
                });
                setYatriCounts(counts);
            });
    }, []);

    const goal = GOALS.find((g) => g.id === goalId) || GOALS[0];

    const stages = useMemo(() => {
        const inGoal = catalog.filter(
            (c) =>
                goal.providers.includes(c.provider.toLowerCase()) &&
                (!goal.topic || goal.topic.test(c.label)),
        );
        return goal.stages.map((stage) => {
            const certs = inGoal.filter((c) => stage.level.test(c.label));
            return { ...stage, certs: certs.slice(0, STAGE_CAP), extra: Math.max(0, certs.length - STAGE_CAP) };
        });
    }, [catalog, goal]);

    const goalYatris = goal.providers.reduce((sum, p) => sum + (yatriCounts[p] || 0), 0);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO
                title="Certification Paths · Where to Start | Yatri Cloud"
                description="Pick your goal and see the exact certification path: where to start, what to take next, and how Yatri Cloud helps you pass every step."
            />
            <div className="noise-overlay" />
            <Navbar />

            {/* Hero + goal picker */}
            <section className="relative overflow-hidden pt-32 pb-12 md:pb-16">
                <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.07] via-background to-background" />
                <div className="container mx-auto px-4 md:px-6">
                    <motion.div
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: EASE }}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-6xl">
                            Your certification <span className="gradient-text">path</span>
                        </h1>
                        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
                            Pick where you want to end up. We will show you where to start, what comes next, and back you at every step.
                        </p>
                    </motion.div>

                    <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2" role="tablist" aria-label="Pick your career goal">
                        {GOALS.map((g) => {
                            const active = g.id === goalId;
                            return (
                                <button
                                    key={g.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setGoalId(g.id)}
                                    className={`min-h-[44px] rounded-full border px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active
                                        ? "border-primary bg-primary text-primary-foreground shadow-inset-btn"
                                        : "border-border bg-card text-foreground hover:border-brand-200 hover:bg-brand-50"
                                        }`}
                                >
                                    {g.label}
                                </button>
                            );
                        })}
                    </div>

                    <p className="mt-5 text-center text-muted-foreground">
                        {goal.tagline}
                        {goalYatris > 0 && (
                            <span className="ml-1 font-medium text-primary">
                                {goalYatris} Yatris on our Wall of Fame already hold these certifications.
                            </span>
                        )}
                    </p>
                </div>
            </section>

            {/* Staged journey — vertical timeline */}
            <section className="pb-20 md:pb-28">
                <div className="container mx-auto max-w-4xl px-4 md:px-6">
                    <div className="relative">
                        {/* connector */}
                        <div aria-hidden="true" className="absolute left-5 top-4 bottom-4 hidden w-px bg-gradient-to-b from-primary/60 via-brand-200 to-transparent sm:block" />

                        <div className="space-y-12">
                            {stages.map((stage, si) => (
                                <motion.div
                                    key={`${goal.id}-${stage.title}`}
                                    initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ delay: si * 0.06, duration: 0.5, ease: EASE }}
                                    className="relative sm:pl-16"
                                >
                                    <span className="absolute left-0 top-0 hidden h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-brand-50 font-display text-sm font-bold text-primary sm:flex">
                                        {si + 1}
                                    </span>
                                    <h2 className="font-display text-2xl font-bold tracking-tight">{stage.title}</h2>
                                    <p className="mt-1 text-muted-foreground">{stage.hint}</p>

                                    {stage.certs.length === 0 ? (
                                        <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                                            Nothing at this level for this goal yet — jump to the next stage.
                                        </p>
                                    ) : (
                                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                            {stage.certs.map((cert) => {
                                                const logo = getCertificationLogoUrl(cert.provider.toLowerCase(), theme);
                                                return (
                                                    <div
                                                        key={cert.id}
                                                        className="group rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {logo && (
                                                                <img src={logo} alt="" className="mt-0.5 h-7 w-7 shrink-0 object-contain" loading="lazy" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="font-semibold leading-snug">{cert.label}</p>
                                                                {cert.examCode && (
                                                                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                                                                        {cert.examCode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
                                                            <Link to="/examdumps" className="text-primary hover:underline">Practice questions</Link>
                                                            <Link to="/yatristore" className="text-primary hover:underline">Voucher at 50% off</Link>
                                                            <Link to="/training" className="text-primary hover:underline">Training</Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {stage.extra > 0 && (
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            And {stage.extra} more at this level in our catalog.
                                        </p>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Closing CTA */}
                    <motion.div
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="mt-16 rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-8 text-center"
                    >
                        <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                            Not sure which stage you are at?
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                            Talk to us for a few minutes and we will place you on the path — free, no strings.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Button asChild className="min-h-[44px] rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-inset-btn hover:bg-brand-600">
                                <Link to="/#contact">Get free guidance</Link>
                            </Button>
                            <Button asChild variant="outline" className="min-h-[44px] rounded-xl px-6">
                                <Link to="/achievements">See who already made it</Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
