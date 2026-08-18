import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { USER_NAV_GROUPS } from "@/config/user-nav";

/**
 * User Sitemap — generated from src/config/user-nav.ts so it always maps the
 * same learner-facing pages. Add a page to the config and it appears here.
 */
export default function UserSitemapView() {
    const navigate = useNavigate();
    const pageCount = USER_NAV_GROUPS.reduce((n, g) => n + g.items.length, 0);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO title="Sitemap | Yatri Cloud" description="A map of every page on Yatri Cloud" />
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                    <Button
                        variant="ghost"
                        className="mb-6 pl-0 hover:pl-2 transition-all font-semibold"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Sitemap</h1>
                        <p className="text-muted-foreground text-lg">
                            A map of everything on Yatri Cloud, {pageCount} pages across {USER_NAV_GROUPS.length} areas. Find your way to any part of the platform.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {USER_NAV_GROUPS.map((group, gi) => {
                            return (
                                <motion.div
                                    key={group.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(gi * 0.05, 0.3) }}
                                >
                                    <Card className="h-full">
                                        <CardHeader>
                                            <CardTitle className="text-base">{group.label}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-1">
                                            {group.items.map((item) => {
                                                return (
                                                    <Link
                                                        key={item.path}
                                                        to={item.path}
                                                        className="group block rounded-lg p-3 transition-colors hover:bg-brand-50/50"
                                                    >
                                                        <span className="block font-semibold group-hover:text-primary transition-colors">
                                                            {item.name}
                                                        </span>
                                                        {item.description && (
                                                            <span className="mt-0.5 block text-sm text-muted-foreground">{item.description}</span>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
