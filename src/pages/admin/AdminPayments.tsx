import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, Receipt, IndianRupee, Globe, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/admin/StatsCard";
import { toast } from "sonner";
import { format } from "date-fns";
import { getAllInvoices, formatInvoiceMoney, type Invoice } from "@/lib/invoices-api";

const KIND_ORDER = ["store", "event", "training", "mentorship", "other"] as const;
const KIND_LABEL: Record<string, string> = {
    store: "Store",
    event: "Events",
    training: "Training",
    mentorship: "Mentorship",
    other: "Other",
};

export default function AdminPayments() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            try {
                setInvoices(await getAllInvoices());
            } catch (e) {
                console.error(e);
                toast.error("We could not load payments just now. Please try again.");
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    // Revenue grouped by currency (amounts across currencies are never summed together).
    const revenueByCurrency = useMemo(() => {
        const map: Record<string, number> = {};
        for (const inv of invoices) map[inv.currency] = (map[inv.currency] || 0) + inv.amount;
        return map;
    }, [invoices]);

    const inrRevenue = revenueByCurrency.INR || 0;
    const otherCurrencyCount = useMemo(
        () => invoices.filter((i) => i.currency !== "INR").length,
        [invoices],
    );

    const byKind = useMemo(() => {
        const map: Record<string, number> = {};
        for (const inv of invoices) map[inv.kind] = (map[inv.kind] || 0) + 1;
        return map;
    }, [invoices]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return invoices;
        return invoices.filter(
            (i) =>
                i.buyerName.toLowerCase().includes(q) ||
                i.buyerEmail.toLowerCase().includes(q) ||
                i.number.toLowerCase().includes(q) ||
                i.kindLabel.toLowerCase().includes(q) ||
                i.items.some((it) => it.name.toLowerCase().includes(q)),
        );
    }, [invoices, search]);

    const itemsSummary = (inv: Invoice) => {
        if (inv.items.length === 0) return inv.kindLabel;
        const first = inv.items[0].name;
        const more = inv.items.length - 1;
        return more > 0 ? `${first} and ${more} more` : first;
    };

    const otherCurrencies = Object.entries(revenueByCurrency).filter(([c]) => c !== "INR");

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-black tracking-tight">Payments and revenue</h1>
                <p className="mt-1 text-muted-foreground">
                    Every receipt across the store, events, training and mentorship, in one place.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard title="Total receipts" value={invoices.length} icon={Receipt} color="bg-primary/10 text-primary" />
                        <StatsCard title="Revenue in INR" value={formatInvoiceMoney(inrRevenue, "INR")} icon={IndianRupee} color="bg-emerald-500/10 text-emerald-600" />
                        <StatsCard title="Paid in other currencies" value={otherCurrencyCount} icon={Globe} color="bg-blue-500/10 text-blue-600" />
                        <StatsCard title="Categories" value={Object.keys(byKind).length} icon={Layers} color="bg-amber-500/10 text-amber-600" />
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Revenue by category</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {KIND_ORDER.filter((k) => byKind[k]).map((k) => (
                                    <div key={k} className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{KIND_LABEL[k]}</span>
                                        <span className="text-muted-foreground">{byKind[k]} {byKind[k] === 1 ? "receipt" : "receipts"}</span>
                                    </div>
                                ))}
                                {invoices.length === 0 && <p className="text-sm text-muted-foreground">No receipts yet.</p>}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Revenue by currency</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Indian Rupee</span>
                                    <span className="font-semibold">{formatInvoiceMoney(inrRevenue, "INR")}</span>
                                </div>
                                {otherCurrencies.map(([code, amt]) => (
                                    <div key={code} className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{code}</span>
                                        <span className="font-semibold">{formatInvoiceMoney(amt, code)}</span>
                                    </div>
                                ))}
                                {otherCurrencies.length === 0 && (
                                    <p className="text-sm text-muted-foreground">All payments so far are in Indian Rupees.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="text-base">All receipts</CardTitle>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search buyer, item or receipt number"
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filtered.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    {invoices.length === 0 ? "No receipts have been generated yet." : "No receipts match your search."}
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Receipt</TableHead>
                                                <TableHead>Buyer</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Item</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filtered.map((inv, i) => (
                                                <TableRow
                                                    key={inv.number || i}
                                                    className="cursor-pointer"
                                                    onClick={() => inv.number && navigate(`/receipt/${inv.number}`)}
                                                >
                                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                                        {inv.createdAt ? format(new Date(inv.createdAt), "dd MMM yyyy") : ""}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap font-mono text-xs">{inv.number}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{inv.buyerName || "Yatri"}</div>
                                                        <div className="text-xs text-muted-foreground">{inv.buyerEmail}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="border-primary/30 text-primary">
                                                            {inv.kindLabel}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[220px] truncate">{itemsSummary(inv)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-semibold">
                                                        {formatInvoiceMoney(inv.amount, inv.currency)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
