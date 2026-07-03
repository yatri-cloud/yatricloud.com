import { useState, useEffect, useMemo } from "react";
import { Loader2, RefreshCw, Plus, ExternalLink, Search, Copy } from "lucide-react";
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
import { CurrencySelect } from "@/components/CurrencySelect";
import { DEFAULT_CURRENCY, type CurrencyOption } from "@/lib/currency";
import { formatInvoiceMoney } from "@/lib/invoices-api";
import { currencyDecimals } from "@/lib/currency-catalog";
import {
    listRazorpayInvoices, createRazorpayInvoice, cancelRazorpayInvoice, type RazorpayInvoice,
} from "@/lib/razorpay-admin";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_STYLE: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    partially_paid: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    issued: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    draft: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    expired: "bg-muted text-muted-foreground border-border",
};

/** Razorpay amounts are in the smallest unit; convert to major for display. */
function majorAmount(smallest: number, currency: string): number {
    return (Number(smallest) || 0) / Math.pow(10, currencyDecimals((currency || "INR").toUpperCase()));
}

export default function AdminRazorpayInvoices() {
    const [invoices, setInvoices] = useState<RazorpayInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);

    // Create form state.
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [itemName, setItemName] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState<CurrencyOption>(DEFAULT_CURRENCY);
    const [notify, setNotify] = useState(true);
    const [creating, setCreating] = useState(false);

    const load = async () => {
        setIsLoading(true);
        try {
            setInvoices(await listRazorpayInvoices(100));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not load invoices.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return invoices;
        return invoices.filter((i) =>
            (i.invoice_number || "").toLowerCase().includes(q) ||
            i.id.toLowerCase().includes(q) ||
            (i.customer_details?.name || "").toLowerCase().includes(q) ||
            (i.customer_details?.email || "").toLowerCase().includes(q) ||
            i.status.toLowerCase().includes(q),
        );
    }, [invoices, search]);

    const resetForm = () => {
        setName(""); setEmail(""); setContact(""); setItemName(""); setAmount("");
        setCurrency(DEFAULT_CURRENCY); setNotify(true);
    };

    const submitCreate = async () => {
        const amt = Number(amount);
        if (!name.trim() || !email.trim()) { toast.error("Customer name and email are required."); return; }
        if (!itemName.trim()) { toast.error("Please name the item."); return; }
        if (!Number.isFinite(amt) || amt <= 0) { toast.error("Enter a valid amount."); return; }
        setCreating(true);
        try {
            const inv = await createRazorpayInvoice({
                customer: { name: name.trim(), email: email.trim(), contact: contact.trim() || undefined },
                item_name: itemName.trim(),
                amount: amt,
                currency: currency.code,
                notify,
            });
            toast.success(notify ? "Invoice created and sent to the customer." : "Invoice created.");
            if (inv.short_url) {
                try { await navigator.clipboard.writeText(inv.short_url); toast.message("Payment link copied to clipboard."); } catch { /* ignore */ }
            }
            setCreateOpen(false);
            resetForm();
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not create the invoice.");
        } finally {
            setCreating(false);
        }
    };

    const cancel = async (inv: RazorpayInvoice) => {
        if (!window.confirm(`Cancel invoice for ${inv.customer_details?.name || inv.customer_details?.email || inv.id}? This cannot be undone.`)) return;
        try {
            const status = await cancelRazorpayInvoice(inv.id);
            toast.success(`Invoice ${status}.`);
            setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status } : i)));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not cancel the invoice.");
        }
    };

    const copyLink = async (url: string | null) => {
        if (!url) return;
        try { await navigator.clipboard.writeText(url); toast.message("Payment link copied."); } catch { /* ignore */ }
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-black tracking-tight">Razorpay invoices</h1>
                    <p className="mt-1 text-muted-foreground">
                        Raise a professional invoice in any currency, or view the ones you created in the Razorpay dashboard.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={load} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                    <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4" /> Create invoice
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-base">All invoices</CardTitle>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, number or status" className="pl-9" />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : filtered.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            {invoices.length === 0 ? "No Razorpay invoices yet. Create one to get started." : "No invoices match your search."}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((inv) => {
                                        const canCancel = inv.status === "issued" || inv.status === "draft" || inv.status === "partially_paid";
                                        return (
                                            <TableRow key={inv.id}>
                                                <TableCell className="whitespace-nowrap text-muted-foreground">
                                                    {inv.date ? format(new Date(inv.date * 1000), "dd MMM yyyy") : ""}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{inv.customer_details?.name || "Customer"}</div>
                                                    <div className="text-xs text-muted-foreground">{inv.customer_details?.email}</div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap font-semibold">
                                                    {formatInvoiceMoney(majorAmount(inv.amount, inv.currency), inv.currency)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={STATUS_STYLE[inv.status] || "border-border"}>
                                                        {inv.status.replace("_", " ")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {inv.short_url && (
                                                            <>
                                                                <Button variant="ghost" size="icon" title="Copy payment link" onClick={() => copyLink(inv.short_url)}>
                                                                    <Copy className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" title="Open invoice" asChild>
                                                                    <a href={inv.short_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                                                                </Button>
                                                            </>
                                                        )}
                                                        {canCancel && (
                                                            <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700" onClick={() => cancel(inv)}>
                                                                Cancel
                                                            </Button>
                                                        )}
                                                    </div>
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

            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Create an invoice</DialogTitle>
                        <DialogDescription>
                            Raise an invoice and, if you like, email it to the customer with a secure payment link.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="rzp-name">Customer name</Label>
                                <Input id="rzp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="rzp-email">Customer email</Label>
                                <Input id="rzp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="rzp-contact">Customer phone (optional)</Label>
                            <Input id="rzp-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 90000 00000" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="rzp-item">Item</Label>
                            <Input id="rzp-item" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="What is this invoice for?" />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="rzp-amount">Amount</Label>
                                <Input id="rzp-amount" type="number" min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Currency</Label>
                                <CurrencySelect value={currency.code} onChange={(_c, o) => setCurrency(o)} className="[&>span]:hidden" />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 rounded border-border" />
                            Email the invoice to the customer now
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }} disabled={creating}>Cancel</Button>
                        <Button onClick={submitCreate} disabled={creating} className="gap-2">
                            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
