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
                        className="gap-2 mb-6 pl-0 hover:pl-2 transition-all"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
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
                                                const ItemIcon = item.icon;
                                                return (
                                                    <Link
                                                        key={item.path}
                                                        to={item.path}
                                                        className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-brand-50/50 min-h-[44px]"
                                                    >
                                                        <ItemIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                                                        <span className="min-w-0 flex-1">
                                                            <span className="flex items-center gap-1 font-medium">
                                                                {item.name}
                                                                <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden="true" />
                                                            </span>
                                                            {item.description && (
                                                                <span className="mt-0.5 block text-sm text-muted-foreground">{item.description}</span>
                                                            )}
                                                        </span>
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
