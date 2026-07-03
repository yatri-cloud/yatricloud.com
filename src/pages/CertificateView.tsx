import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { getCertificateBySerial } from "@/lib/training-api";
import { useToast } from "@/hooks/use-toast";

interface Certificate {
    serial: string;
    kind: string;
    recipient_name: string;
    title: string;
    issued_at: string;
    training_id: string | null;
}

export default function CertificateView() {
    const { serial } = useParams<{ serial: string }>();
    const { toast } = useToast();
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const certRef = useRef<HTMLElement>(null);

    const pageUrl = typeof window !== "undefined"
        ? `${window.location.origin}/certificate/${serial}`
        : `https://www.yatricloud.com/certificate/${serial}`;

    /** LinkedIn "Add to profile" deep link — prefills the certification form. */
    const linkedInAddUrl = () => {
        if (!certificate) return "#";
        const issued = certificate.issued_at ? new Date(certificate.issued_at) : new Date();
        const params = new URLSearchParams({
            startTask: "CERTIFICATION_NAME",
            name: certificate.title,
            organizationName: "Yatri Cloud",
            issueYear: String(issued.getFullYear()),
            issueMonth: String(issued.getMonth() + 1),
            certUrl: pageUrl,
            certId: certificate.serial,
        });
        return `https://www.linkedin.com/profile/add?${params.toString()}`;
    };

    const downloadImage = async () => {
        if (!certRef.current || !certificate) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(certRef.current, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true,
                logging: false,
            });
            const link = document.createElement("a");
            link.download = `${certificate.recipient_name.replace(/\s+/g, "_")}_${certificate.serial}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch {
            toast({
                title: "Download did not work",
                description: "Please try again, or take a screenshot of the certificate.",
                variant: "destructive",
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const shareCertificate = async () => {
        if (!certificate) return;
        const text = `${certificate.recipient_name} earned "${certificate.title}" on Yatri Cloud. Verify it here:`;
        if (navigator.share) {
            try {
                await navigator.share({ title: certificate.title, text, url: pageUrl });
                return;
            } catch { /* user cancelled — fall through to clipboard */ }
        }
        await navigator.clipboard.writeText(`${text} ${pageUrl}`);
        toast({ title: "Link copied", description: "Paste it anywhere to share this certificate." });
    };

    useEffect(() => {
        let active = true;
        (async () => {
            setIsLoading(true);
            const found = serial ? await getCertificateBySerial(serial) : null;
            if (!active) return;
            setCertificate(found);
            setIsLoading(false);
        })();
        return () => { active = false; };
    }, [serial]);

    const isEvent = certificate?.kind === "event";
    const certificateLabel = isEvent
        ? "Certificate of attendance"
        : "Certificate of completion";
    const achievementLine = isEvent ? "has attended" : "has successfully completed";

    const issuedDate = certificate?.issued_at
        ? new Date(certificate.issued_at).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
        })
        : "";

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!certificate) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <SEO
                    title="Certificate not found | Yatri Cloud"
                    description="We could not find a Yatri Cloud certificate with this serial."
                    noindex
                />
                <Navbar />
                <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
                    <h1 className="font-display text-3xl font-bold tracking-tight">Certificate not found</h1>
                    <p className="mt-3 max-w-md text-muted-foreground">
                        We could not find a certificate with this serial. Please double check the link you were given.
                    </p>
                    <Button asChild className="mt-8 h-11 px-6">
                        <Link to="/training">Explore trainings</Link>
                    </Button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <SEO
                title={`${certificate.recipient_name} · ${certificate.title} | Yatri Cloud Certificate`}
                description={`${certificate.recipient_name} completed ${certificate.title} on Yatri Cloud. Verified certificate ${certificate.serial}.`}
                type="article"
            />
            <Navbar />

            <main className="flex-1">
                <div className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
                    {/* Certificate card */}
                    <article ref={certRef} className="relative overflow-hidden rounded-2xl border border-brand-200 bg-card shadow-xl">
                        <div className="h-2 w-full bg-primary" aria-hidden="true" />
                        <div className="px-8 py-12 text-center md:px-16 md:py-16">
                            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                                Yatri Cloud
                            </p>
                            <p className="mt-8 text-sm uppercase tracking-widest text-muted-foreground">
                                {certificateLabel}
                            </p>

                            <p className="mt-8 text-base text-muted-foreground">This certifies that</p>
                            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                                {certificate.recipient_name}
                            </h1>

                            <p className="mt-8 text-base text-muted-foreground">{achievementLine}</p>
                            <h2 className="mt-3 font-display text-xl font-semibold text-foreground md:text-2xl">
                                {certificate.title}
                            </h2>

                            {issuedDate && (
                                <p className="mt-10 text-sm text-muted-foreground">
                                    Issued on {issuedDate}
                                </p>
                            )}

                            <div className="mx-auto mt-10 h-px w-24 bg-brand-200" aria-hidden="true" />

                            <p className="mt-6 font-display text-sm font-semibold text-primary">
                                Verified by Yatri Cloud
                            </p>
                            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                                Serial {certificate.serial}
                            </p>

                            {/* Verification QR — baked into the downloaded image too */}
                            <div className="mt-6 flex flex-col items-center gap-2">
                                <div className="rounded-lg border border-brand-100 bg-white p-2">
                                    <QRCodeCanvas value={pageUrl} size={76} level="M" />
                                </div>
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                    Scan to verify
                                </p>
                            </div>
                        </div>
                    </article>

                    {/* Share actions */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Button asChild className="h-11 px-6 bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600">
                            <a href={linkedInAddUrl()} target="_blank" rel="noopener noreferrer">
                                Add to LinkedIn profile
                            </a>
                        </Button>
                        <Button variant="outline" className="h-11 px-6" onClick={downloadImage} disabled={isDownloading}>
                            {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Download image
                        </Button>
                        <Button variant="outline" className="h-11 px-6" onClick={shareCertificate}>
                            Share
                        </Button>
                        <Button asChild variant="outline" className="h-11 px-6">
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`${certificate.recipient_name} earned "${certificate.title}" on Yatri Cloud. Verify it here: ${pageUrl}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Share on WhatsApp
                            </a>
                        </Button>
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-3 text-center">
                        <p className="text-sm text-muted-foreground">
                            Anyone can verify this certificate using its serial on this page or by scanning the QR code.
                        </p>
                        <Button asChild variant="outline" className="h-11 px-6">
                            <Link to="/training">Explore Yatri Cloud trainings</Link>
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
