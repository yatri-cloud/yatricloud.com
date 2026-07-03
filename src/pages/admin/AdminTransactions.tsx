import { useState, useEffect, useMemo } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { formatInvoiceMoney } from "@/lib/invoices-api";
import { currencyDecimals } from "@/lib/currency-catalog";
import { listRazorpayPayments, refundPayment, type RazorpayPayment } from "@/lib/razorpay-admin";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_STYLE: Record<string, string> = {
    captured: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    authorized: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    refunded: "bg-muted text-muted-foreground border-border",
    failed: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    created: "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

function major(smallest: number, currency: string): number {
    return (Number(smallest) || 0) / Math.pow(10, currencyDecimals((currency || "INR").toUpperCase()));
}

export default function AdminTransactions() {
    const [payments, setPayments] = useState<RazorpayPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [refundOf, setRefundOf] = useState<RazorpayPayment | null>(null);
    const [refundAmount, setRefundAmount] = useState("");
    const [refunding, setRefunding] = useState(false);

    const load = async () => {
        setIsLoading(true);
        try {
            setPayments(await listRazorpayPayments(100));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not load transactions.");
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return payments;
        return payments.filter((p) =>
            p.id.toLowerCase().includes(q) ||
            (p.email || "").toLowerCase().includes(q) ||
            (p.contact || "").toLowerCase().includes(q) ||
            (p.method || "").toLowerCase().includes(q) ||
            p.status.toLowerCase().includes(q),
        );
    }, [payments, search]);

    const remaining = (p: RazorpayPayment) => major(p.amount - (p.amount_refunded || 0), p.currency);
    const isRefundable = (p: RazorpayPayment) => p.status === "captured" && p.amount - (p.amount_refunded || 0) > 0;

    const openRefund = (p: RazorpayPayment) => {
        setRefundOf(p);
        setRefundAmount(String(remaining(p))); // default to full remaining
    };

    const submitRefund = async () => {
        if (!refundOf) return;
        const amt = Number(refundAmount);
        const max = remaining(refundOf);
        if (!Number.isFinite(amt) || amt <= 0) { toast.error("Enter a valid amount."); return; }
        if (amt > max + 1e-9) { toast.error(`Amount cannot exceed ${formatInvoiceMoney(max, refundOf.currency)}.`); return; }
        setRefunding(true);
        try {
            // If refunding the whole remaining amount, omit amount for a clean full refund.
            const full = Math.abs(amt - max) < 1e-9;
            const r = await refundPayment({
                payment_id: refundOf.id,
                currency: refundOf.currency,
                ...(full ? {} : { amount: amt }),
            });
            toast.success(`Refund ${r.status || "created"} for ${formatInvoiceMoney(major(r.amount, r.currency), r.currency)}.`);
            setRefundOf(null);
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not refund this payment.");
        } finally {
            setRefunding(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-black tracking-tight">Transactions</h1>
                    <p className="mt-1 text-muted-foreground">
                        Every payment taken through Razorpay. Refund a payment in full or in part when you need to.
                    </p>
                </div>
                <Button variant="outline" className="gap-2" onClick={load} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
            </div>

            <Card>
                <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-base">All payments</CardTitle>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search id, email, method or status" className="pl-9" />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : filtered.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            {payments.length === 0 ? "No payments yet." : "No payments match your search."}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((p) => {
                                        const refunded = p.amount_refunded || 0;
                                        return (
                                            <TableRow key={p.id}>
                                                <TableCell className="whitespace-nowrap text-muted-foreground">
                                                    {p.created_at ? format(new Date(p.created_at * 1000), "dd MMM yyyy") : ""}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{p.email || p.contact || "Customer"}</div>
                                                    <div className="font-mono text-xs text-muted-foreground">{p.id}</div>
                                                </TableCell>
                                                <TableCell className="capitalize">{p.method || ""}</TableCell>
                                                <TableCell className="whitespace-nowrap font-semibold">
                                                    {formatInvoiceMoney(major(p.amount, p.currency), p.currency)}
                                                    {refunded > 0 && (
                                                        <div className="text-xs font-normal text-muted-foreground">
                                                            {formatInvoiceMoney(major(refunded, p.currency), p.currency)} refunded
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={STATUS_STYLE[p.status] || "border-border"}>
                                                        {p.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isRefundable(p) ? (
                                                        <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700" onClick={() => openRefund(p)}>
                                                            Refund
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            {refunded > 0 && refunded >= p.amount ? "Fully refunded" : ""}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!refundOf} onOpenChange={(o) => { if (!o) setRefundOf(null); }}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Refund payment</DialogTitle>
                        <DialogDescription>
                            {refundOf && (
                                <>Refunding {refundOf.email || refundOf.contact || "the customer"}. Up to {formatInvoiceMoney(remaining(refundOf), refundOf.currency)} can be refunded.</>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label htmlFor="refund-amount">Amount to refund</Label>
                        <Input
                            id="refund-amount"
                            type="number"
                            min="0"
                            step="any"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Leave the full amount for a complete refund, or lower it for a partial refund.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRefundOf(null)} disabled={refunding}>Cancel</Button>
                        <Button onClick={submitRefund} disabled={refunding} className="gap-2 bg-rose-600 hover:bg-rose-700">
                            {refunding && <Loader2 className="h-4 w-4 animate-spin" />}
                            Refund
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
