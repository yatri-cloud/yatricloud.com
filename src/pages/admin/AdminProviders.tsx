
import { useState, useEffect } from "react";
import { Loader2, Plus, Database, Server, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout"; // Re-using layout for this independent page

import { listProviders, addProvider, updateProvider, deleteProvider } from "@/lib/training-api";

interface ProviderData {
    id?: string;
    type: string;
    name: string;
    slug?: string;
    logoUrl?: string;
    exams: string[];
    exists?: boolean;
}

export default function AdminProviders() {
    const [providers, setProviders] = useState<ProviderData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [editName, setEditName] = useState("");

    const [newProvider, setNewProvider] = useState("");
    const [newLogo, setNewLogo] = useState("");

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        setIsLoading(true);
        try {
            const result = await listProviders();
            setProviders(result || []);
        } catch (e) {
            console.error("Fetch error:", e);
            // Leave the list empty on a load error rather than surprise the admin.
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (p: ProviderData) => {
        if (!confirm(`Are you sure you want to delete ${p.name}?`)) return;

        setIsLoading(true);
        try {
            await deleteProvider({ id: p.id, name: p.name });
            toast.success("Provider deleted");
            fetchProviders();
        } catch (e) {
            toast.error("Deletion failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (p: ProviderData) => {
        if (!editName) return;
        setIsSubmitting(true);
        try {
            await updateProvider({ id: p.id, name: editName });
            toast.success("Provider updated");
            setEditingRow(null);
            fetchProviders();
        } catch (e) {
            toast.error("Update failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProvider) return;

        setIsSubmitting(true);
        try {
            await addProvider({ name: newProvider, logo_url: newLogo || undefined });
            toast.success("Provider added");
            setNewProvider("");
            setNewLogo("");
            fetchProviders(); // Refresh list
        } catch (e: any) {
            console.error("Add Provider Error:", e);
            toast.error(e?.message || "Failed to add provider.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* Header band — distinct blue-tinted workspace panel */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="space-y-1.5">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Course providers
                        </p>
                        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Providers Management</h1>
                        <p className="text-muted-foreground">Manage the training providers shown across the platform.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Form Section */}
                <Card className="md:col-span-1 h-fit border border-border rounded-2xl shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Add New</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Provider Name</Label>
                                <Input
                                    placeholder="e.g. AWS, Microsoft, Kubernetes"
                                    value={newProvider}
                                    onChange={e => setNewProvider(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Logo URL (optional)</Label>
                                <Input
                                    placeholder="https://..."
                                    value={newLogo}
                                    onChange={e => setNewLogo(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full bg-primary text-primary-foreground rounded-xl shadow-inset-btn hover:bg-brand-600 min-h-[44px]" disabled={isSubmitting || !newProvider}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Provider"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List Section */}
                <Card className="md:col-span-2 border border-border rounded-2xl shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Existing Providers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Provider</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Exams / Courses</TableHead>
                                        <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!providers || providers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-16">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                        <Database className="w-7 h-7" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="font-display text-lg font-semibold">No providers yet</h3>
                                                        <p className="text-muted-foreground text-sm">Add your first provider using the form to get started.</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        providers.map((p: ProviderData, i) => (
                                            <TableRow key={p.id || i} className="hover:bg-brand-50">
                                                <TableCell className="font-semibold flex items-center gap-2">
                                                    {p.logoUrl ? (
                                                        <img src={p.logoUrl} alt="" className="w-4 h-4 object-contain" />
                                                    ) : (
                                                        <Server className="w-4 h-4 text-primary" />
                                                    )}
                                                    {editingRow === i ? (
                                                        <Input
                                                            value={editName}
                                                            onChange={e => setEditName(e.target.value)}
                                                            className="h-7 py-0 text-sm"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span>{p.name}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-2">
                                                        {p.exams.length === 0 ? (
                                                            <span className="text-xs text-muted-foreground">No courses yet</span>
                                                        ) : p.exams.map((exam: string, j: number) => (
                                                            <span key={j} className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                                {exam}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {editingRow === i ? (
                                                            <>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => handleUpdate(p)} disabled={isSubmitting}>
                                                                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setEditingRow(null)}>
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
                                                                    setEditingRow(i);
                                                                    setEditName(p.name);
                                                                }}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(p)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
