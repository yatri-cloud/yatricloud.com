import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Award, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getStoredUser } from "@/lib/yatris-api";
import { getMyCertificates, type MyCertificate } from "@/lib/certificates-api";
import { format } from "date-fns";

export default function MyCertificates() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [certs, setCerts] = useState<MyCertificate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const stored = getStoredUser();
        if (stored) setUser(stored);
        else setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!user) { setIsLoading(false); return; }
        (async () => {
            setIsLoading(true);
            try {
                setCerts(await getMyCertificates());
            } finally {
                setIsLoading(false);
            }
        })();
    }, [user]);

    const query = search.trim().toLowerCase();
    const filteredCerts = query
        ? certs.filter((c) =>
            (c.title || "").toLowerCase().includes(query) ||
            (c.kindLabel || "").toLowerCase().includes(query) ||
            (c.recipientName || "").toLowerCase().includes(query) ||
            (c.serial || "").toLowerCase().includes(query)
        )
        : certs;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO title="My Certificates | Yatri Cloud" description="Your earned certificates" />
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container mx-auto max-w-5xl px-4 md:px-6">
                    <Button variant="ghost" className="gap-2 mb-6 pl-0 hover:pl-2 transition-all" onClick={() => navigate("/dashboard")}>
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Button>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">My Certificates</h1>
                        <p className="text-lg text-muted-foreground">Every certificate you have earned. Open one to view, share or verify it.</p>
                    </motion.div>

                    {!isLoading && certs.length > 0 && (
                        <div className="relative mb-6 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search certificates by title or serial"
                                aria-label="Search certificates"
                                className="h-10 pl-9"
                            />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : certs.length === 0 ? (
                        <div className="rounded-xl border bg-muted/10 py-16 text-center">
                            <Award className="mx-auto mb-4 h-14 w-14 text-muted-foreground opacity-50" aria-hidden="true" />
                            <h3 className="mb-2 text-xl font-semibold">No certificates yet</h3>
                            <p className="mx-auto mb-6 max-w-md text-muted-foreground">Complete a training or attend an event, and your certificate will appear here.</p>
                            <div className="flex justify-center gap-3">
                                <Button onClick={() => navigate("/training")}>Explore training</Button>
                                <Button variant="outline" onClick={() => navigate("/events")}>Browse events</Button>
                            </div>
                        </div>
                    ) : filteredCerts.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">No certificates match your search.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredCerts.map((c, i) => (
                                <motion.div key={c.serial || i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                                    <Link to={c.serial ? `/certificate/${c.serial}` : "#"} className="block h-full">
                                        <Card className="group h-full overflow-hidden transition-colors hover:border-primary/40 hover:bg-brand-50/40">
                                            <div className="h-1.5 bg-gradient-to-r from-primary to-primary/50" />
                                            <CardContent className="p-5">
                                                <Badge variant="outline" className="mb-3 border-primary/30 text-primary">{c.kindLabel}</Badge>
                                                <h3 className="mb-1 line-clamp-2 font-bold leading-tight group-hover:text-primary">{c.title}</h3>
                                                <p className="text-sm text-muted-foreground">{c.recipientName}</p>
                                                <p className="mt-3 text-xs text-muted-foreground">
                                                    Issued {c.issuedAt ? format(new Date(c.issuedAt), "dd MMM yyyy") : ""} · {c.serial}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
