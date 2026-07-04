import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { getCertificationOptions, listPublishedTrainings } from "@/lib/training-api";
import { getAllEvents } from "@/lib/events-store";
import { fetchExamDumps } from "@/lib/exam-dumps";
import { fetchStoreProducts } from "@/lib/store-products";

/**
 * Site-wide command palette (Cmd/Ctrl+K). Searches certifications, trainings,
 * events, exam dumps, store products and key pages. Content loads once per
 * session when the palette first opens; private (unlisted) trainings and
 * events never appear.
 */
interface SearchEntry {
    group: string;
    label: string;
    hint?: string;
    to: string;
}

const PAGES: SearchEntry[] = [
    { group: "Pages", label: "Certification Paths", hint: "Where should you start?", to: "/paths" },
    { group: "Pages", label: "Yatri Store", hint: "Vouchers at 50% off", to: "/yatristore" },
    { group: "Pages", label: "Exam Dumps", hint: "Verified practice questions", to: "/examdumps" },
    { group: "Pages", label: "Training", hint: "Live courses", to: "/training" },
    { group: "Pages", label: "Events", hint: "Community events", to: "/events" },
    { group: "Pages", label: "Mentorship", hint: "Book a mentor", to: "/mentorship" },
    { group: "Pages", label: "Community", hint: "Find your people", to: "/community" },
    { group: "Pages", label: "Wall of Fame", hint: "Certified Yatris", to: "/achievements" },
    { group: "Pages", label: "Reviews", hint: "What Yatris say", to: "/reviews" },
];

// Loaded once per session, shared across palette opens.
let cachedEntries: SearchEntry[] | null = null;

async function loadEntries(): Promise<SearchEntry[]> {
    if (cachedEntries) return cachedEntries;
    const [certs, trainings, events, dumps, products] = await Promise.all([
        getCertificationOptions().catch(() => []),
        listPublishedTrainings().catch(() => []),
        getAllEvents().catch(() => []),
        fetchExamDumps().catch(() => []),
        fetchStoreProducts().catch(() => []),
    ]);

    const entries: SearchEntry[] = [
        ...PAGES,
        ...trainings
            .filter((t) => t.visibility !== "private")
            .map((t) => ({
                group: "Trainings",
                label: t.courseName,
                hint: t.price,
                to: `/training/${t.slug || t.id}`,
            })),
        ...events
            .filter((e) => e.visibility !== "private" && e.status !== "draft")
            .map((e) => ({
                group: "Events",
                label: e.name,
                hint: e.location?.type === "online" ? "Online" : e.location?.city || "",
                to: `/events/${e.slug || e.id}`,
            })),
        ...dumps.map((d) => ({
            group: "Exam dumps",
            label: d.title,
            hint: d.provider,
            to: "/examdumps",
        })),
        ...products.map((p) => ({
            group: "Store",
            label: p.title,
            hint: p.examCode || p.category,
            to: "/yatristore",
        })),
        ...certs.map((c) => ({
            group: "Certifications",
            label: c.label,
            hint: c.examCode || c.provider.toUpperCase(),
            to: "/paths",
        })),
    ];
    cachedEntries = entries;
    return entries;
}

const GROUP_ORDER = ["Pages", "Trainings", "Events", "Exam dumps", "Store", "Certifications"];

export function GlobalSearch() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [entries, setEntries] = useState<SearchEntry[]>(PAGES);
    const [loaded, setLoaded] = useState(false);

    // Cmd+K / Ctrl+K opens the palette from anywhere.
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Load the search index the first time the palette opens.
    useEffect(() => {
        if (!open || loaded) return;
        loadEntries().then((all) => {
            setEntries(all);
            setLoaded(true);
        });
    }, [open, loaded]);

    const go = useCallback((to: string) => {
        setOpen(false);
        navigate(to);
    }, [navigate]);

    return (
        <>
            {/* No aria-label: the accessible name comes from the content so it
                always matches the visible text (label-content-name-mismatch). */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only lg:not-sr-only">Search</span>
                <kbd className="hidden rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-block">
                    ⌘K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search certifications, trainings, events, dumps…" />
                <CommandList>
                    <CommandEmpty>Nothing found. Try a provider like AWS or Azure.</CommandEmpty>
                    {GROUP_ORDER.map((group) => {
                        const items = entries.filter((e) => e.group === group);
                        if (items.length === 0) return null;
                        return (
                            <div key={group}>
                                <CommandGroup heading={group}>
                                    {items.map((entry, i) => (
                                        <CommandItem
                                            key={`${group}-${entry.label}-${i}`}
                                            value={`${entry.label} ${entry.hint || ""} ${group}`}
                                            onSelect={() => go(entry.to)}
                                        >
                                            <span className="truncate">{entry.label}</span>
                                            {entry.hint && (
                                                <span className="ml-auto pl-3 text-xs text-muted-foreground">{entry.hint}</span>
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                            </div>
                        );
                    })}
                </CommandList>
            </CommandDialog>
        </>
    );
}
