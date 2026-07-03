import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_NAV_GROUPS } from "@/config/admin-nav";

/**
 * Admin Sitemap — generated from the same navigation config the sidebar uses
 * (src/config/admin-nav.ts), so it always lists exactly the pages that exist.
 * Add a page to the config and it appears here automatically.
 */
export default function AdminSitemapView() {
    const pageCount = ADMIN_NAV_GROUPS.reduce((n, g) => n + g.items.length, 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-black tracking-tight">Admin sitemap</h1>
                <p className="mt-1 text-muted-foreground">
                    A live map of every admin area, {pageCount} pages across {ADMIN_NAV_GROUPS.length} sections. This stays in step with the menu on its own.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {ADMIN_NAV_GROUPS.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                        <Card key={group.id}>
                            <CardHeader className="flex-row items-center gap-3 space-y-0">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <GroupIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <CardTitle className="text-base">{group.label}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {group.items.map((item) => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-brand-50/50"
                                        >
                                            <ItemIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    {item.name}
                                                    <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden="true" />
                                                </span>
                                                {item.description && (
                                                    <span className="mt-0.5 block text-sm text-muted-foreground">{item.description}</span>
                                                )}
                                                <span className="mt-0.5 block font-mono text-xs text-muted-foreground/70">{item.path}</span>
                                            </span>
                                        </Link>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
