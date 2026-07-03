import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Linkedin, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { fetchCertifications } from "@/lib/google-sheets";
import { getCertificationLogoUrl } from "@/lib/certification-logos";
import { useTheme } from "@/components/ThemeProvider";
import { getCountryFlag, getCountryName } from "@/lib/country-flag";
import { useToast } from "@/hooks/use-toast";

const EASE = [0.16, 1, 0.3, 1] as const;

/** URL slug for a Yatri — the same name-derived form linked from the wall. */
export const yatriSlug = (name: string) =>
    String(name || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

interface CertEntry {
    fullName: string;
    email: string;
    certificationProvider: string;
    certificationName: string;
    examCode: string;
    certificationDate: string;
    linkedinUrl: string;
    country?: string;
    photoUrl: string;
}

export default function YatriProfile() {
    const { slug = "" } = useParams<{ slug: string }>();
    const reduce = useReducedMotion();
    const { theme } = useTheme();
    const { toast } = useToast();
    const [certs, setCerts] = useState<CertEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        fetchCertifications()
            .then((all: CertEntry[]) => setCerts(all.filter((c) => yatriSlug(c.fullName) === slug)))
            .finally(() => setLoading(false));
    }, [slug]);

    const person = certs[0];

    const byProvider = useMemo(() => {
        const groups = new Map<string, CertEntry[]>();
        certs.forEach((c) => {
            const key = (c.certificationProvider || "OTHER").toUpperCase();
            groups.set(key, [...(groups.get(key) || []), c]);
        });
        return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
    }, [certs]);

    const share = async () => {
        const url = `${window.location.origin}/yatri/${slug}`;
        const text = `${person?.fullName} holds ${certs.length} cloud certification${certs.length === 1 ? "" : "s"} on Yatri Cloud.`;
        if (navigator.share) {
            try { await navigator.share({ title: person?.fullName, text, url }); return; } catch { /* cancelled */ }
        }
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast({ title: "Link copied", description: "Share this profile anywhere." });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!person) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <SEO title="Yatri not found | Yatri Cloud" description="We could not find this Yatri profile." noindex />
                <Navbar />
                <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
                    <h1 className="font-display text-3xl font-bold tracking-tight">Yatri not found</h1>
                    <p className="mt-3 max-w-md text-muted-foreground">
                        This profile does not exist yet. The Wall of Fame has every certified Yatri.
                    </p>
                    <Button asChild className="mt-8 h-11 px-6">
                        <Link to="/achievements">See the Wall of Fame</Link>
                    </Button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO
                title={`${person.fullName} · Certified Yatri | Yatri Cloud`}
                description={`${person.fullName} holds ${certs.length} cloud certification${certs.length === 1 ? "" : "s"} — verified on the Yatri Cloud Wall of Fame.`}
                image={person.photoUrl || undefined}
                type="article"
            />
            <div className="noise-overlay" />
            <Navbar />

            <main className="pt-28 pb-20">
                <div className="container mx-auto max-w-3xl px-4 md:px-6">
                    {/* Profile hero */}
                    <motion.section
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: EASE }}
                        className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-8 text-center md:p-12"
                    >
                        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                        {person.photoUrl ? (
                            <img
                                src={person.photoUrl}
                                alt={person.fullName}
                                className="mx-auto h-28 w-28 rounded-full border-4 border-white object-cover shadow-card"
                            />
                        ) : (
                            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-primary/10 font-display text-4xl font-bold text-primary shadow-card">
                                {person.fullName.charAt(0)}
                            </div>
                        )}
                        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            {person.fullName}
                        </h1>
                        <p className="mt-2 flex items-center justify-center gap-2 text-muted-foreground">
                            {person.country && (
                                <span title={getCountryName(person.country)}>
                                    {getCountryFlag(person.country)} {getCountryName(person.country)}
                                </span>
                            )}
                        </p>
                        <p className="mx-auto mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-inset-btn">
                            {certs.length}x Certified Yatri
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            {person.linkedinUrl && (
                                <Button asChild variant="outline" className="min-h-[44px] gap-2 rounded-xl">
                                    <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                        <Linkedin className="h-4 w-4" aria-hidden="true" /> LinkedIn
                                    </a>
                                </Button>
                            )}
                            <Button onClick={share} className="min-h-[44px] rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-inset-btn hover:bg-brand-600">
                                Share this profile
                            </Button>
                        </div>
                    </motion.section>

                    {/* Certifications by provider */}
                    <div className="mt-10 space-y-8">
                        {byProvider.map(([provider, list], gi) => {
                            const logo = getCertificationLogoUrl(provider.toLowerCase(), theme);
                            return (
                                <motion.section
                                    key={provider}
                                    initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ delay: gi * 0.05, duration: 0.5, ease: EASE }}
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        {logo && <img src={logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />}
                                        <h2 className="font-display text-xl font-bold tracking-tight">{provider}</h2>
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                                            {list.length}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {list.map((c, i) => (
                                            <div key={`${c.certificationName}-${i}`} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand-200">
                                                <p className="font-semibold leading-snug">{c.certificationName}</p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {c.examCode && <span className="font-mono">{c.examCode}</span>}
                                                    {c.examCode && c.certificationDate && " · "}
                                                    {c.certificationDate}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.section>
                            );
                        })}
                    </div>

                    {/* CTA */}
                    <div className="mt-14 rounded-3xl border border-brand-100 bg-brand-50/50 p-8 text-center">
                        <h2 className="font-display text-2xl font-bold tracking-tight">
                            Your name belongs here too
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                            Pass your exam with Yatri Cloud and join {person.fullName.split(" ")[0]} on the Wall of Fame.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Button asChild className="min-h-[44px] rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-inset-btn hover:bg-brand-600">
                                <Link to="/paths">Find your path</Link>
                            </Button>
                            <Button asChild variant="outline" className="min-h-[44px] rounded-xl px-6">
                                <Link to="/achievements">Back to the Wall of Fame</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
