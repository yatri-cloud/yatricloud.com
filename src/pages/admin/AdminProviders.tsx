
import { useState, useEffect } from "react";
import { Loader2, Plus, Database, Server, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout"; // Re-using layout for this independent page

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listProviders, getFoldersInPath, addProvider, updateProvider, deleteProvider } from "@/lib/training-api";

interface ProviderData {
    type: string;
    name: string;
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
    const [newExam, setNewExam] = useState("");
    const [type, setType] = useState("Certification"); // Type Selection

    const [availableProviders, setAvailableProviders] = useState<string[]>([]);
    const [availableExams, setAvailableExams] = useState<string[]>([]);
    const [isFetchingFolders, setIsFetchingFolders] = useState(false);
    const [isCustomProvider, setIsCustomProvider] = useState(false);
    const [isCustomExam, setIsCustomExam] = useState(false);

    useEffect(() => {
        fetchProviders();
    }, []);

    // Fetch Providers when Type changes
    useEffect(() => {
        if (type) {
            fetchFolders(type);
        }
    }, [type]);

    // Fetch Exams when Provider changes
    useEffect(() => {
        if (type && newProvider && !isCustomProvider) {
            fetchFolders(type, newProvider);
        }
    }, [newProvider, isCustomProvider]);

    const fetchFolders = async (typ: string, prov?: string) => {
        setIsFetchingFolders(true);
        try {
            const folders = await getFoldersInPath(typ, prov);
            if (prov) {
                setAvailableExams(folders || []);
            } else {
                setAvailableProviders(folders || []);
            }
        } catch (e) {
            console.error("Folder fetch error:", e);
        } finally {
            setIsFetchingFolders(false);
        }
    };

    const fetchProviders = async () => {
        setIsLoading(true);
        try {
            const result = await listProviders();
            setProviders(result || []);
        } catch (e) {
            console.error("Fetch error:", e);
            // Don't show toast on load error, just leave list empty as requested
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (p: ProviderData) => {
        if (!confirm(`Are you sure you want to delete ${p.name}? This will move the folder to trash in Google Drive.`)) return;

        setIsLoading(true);
        try {
            await deleteProvider({ type: p.type, provider: p.name, exams: p.exams });
            toast.success("Deleted from Sheet and Drive");
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
            await updateProvider({
                type: p.type,
                oldProvider: p.name,
                oldExam: p.exams[0],
                provider: editName,
                exam: p.exams[0],
            });
            toast.success("Renamed!");
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
        if (!newProvider || !newExam) return;

        setIsSubmitting(true);
        try {
            await addProvider({ provider: newProvider, exam: newExam, type: type });
            toast.success("Provider/Exam added!");
            setNewProvider("");
            setNewExam("");
            fetchProviders(); // Refresh list
        } catch (e) {
            console.error("Add Provider Error:", e);
            toast.error("Failed to add provider.");
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
                        <p className="text-muted-foreground">Manage certification providers and role-based tracks.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Form Section */}
                <Card className="md:col-span-1 h-fit border border-border rounded-2xl shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Plus className="w-5 h-5 text-primary" /> Add New
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label>Training Type</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Certification">Certification</SelectItem>
                                            <SelectItem value="Role-based">Role-based</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>{type === "Certification" ? "Certification Provider" : "Role Name"}</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 hover:bg-primary/10"
                                        onClick={() => {
                                            setIsCustomProvider(!isCustomProvider);
                                            setNewProvider("");
                                        }}
                                    >
                                        {isCustomProvider ? "Select Existing" : "+ New"}
                                    </Button>
                                </div>
                                {isCustomProvider ? (
                                    <Input
                                        placeholder={type === "Certification" ? "e.g. Microsoft / AWS" : "e.g. DevOps Engineer"}
                                        value={newProvider}
                                        onChange={e => setNewProvider(e.target.value)}
                                    />
                                ) : (
                                    <Select value={newProvider} onValueChange={setNewProvider}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isFetchingFolders ? "Loading..." : "Select Provider"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableProviders.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                            {availableProviders.length === 0 && !isFetchingFolders && (
                                                <SelectItem value="none" disabled>No existing folders</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>{type === "Certification" ? "Exam Name" : "Course Name"}</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 hover:bg-primary/10"
                                        onClick={() => {
                                            setIsCustomExam(!isCustomExam);
                                            setNewExam("");
                                        }}
                                    >
                                        {isCustomExam ? "Select Existing" : "+ New"}
                                    </Button>
                                </div>
                                {isCustomExam ? (
                                    <Input
                                        placeholder={type === "Certification" ? "e.g. AZ-900 / AWS-SAA" : "e.g. Cloud Foundations"}
                                        value={newExam}
                                        onChange={e => setNewExam(e.target.value)}
                                    />
                                ) : (
                                    <Select value={newExam} onValueChange={setNewExam}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isFetchingFolders ? "Loading..." : "Select Exam/Course"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableExams.map(e => (
                                                <SelectItem key={e} value={e}>{e}</SelectItem>
                                            ))}
                                            {availableExams.length === 0 && !isFetchingFolders && (
                                                <SelectItem value="none" disabled>No existing folders</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <Button type="submit" className="w-full bg-primary text-primary-foreground rounded-xl shadow-inset-btn hover:bg-brand-600 min-h-[44px]" disabled={isSubmitting || !newProvider || !newExam || !type}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Database"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List Section */}
                <Card className="md:col-span-2 border border-border rounded-2xl shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Database className="w-5 h-5 text-primary" /> Existing Providers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Type</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Provider/Role</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Exams / Courses</TableHead>
                                        <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!providers || providers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-16">
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
                                        providers.map((p: any, i) => (
                                            <TableRow key={i} className="hover:bg-brand-50">
                                                <TableCell className="text-xs text-muted-foreground">{p.type || "N/A"}</TableCell>
                                                <TableCell className="font-semibold flex items-center gap-2">
                                                    <Server className={`w-4 h-4 ${p.exists === false ? 'text-destructive' : 'text-primary'}`} />
                                                    {editingRow === i ? (
                                                        <Input
                                                            value={editName}
                                                            onChange={e => setEditName(e.target.value)}
                                                            className="h-7 py-0 text-sm"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className={p.exists === false ? 'text-destructive/80' : ''}>
                                                            {p.name}
                                                        </span>
                                                    )}
                                                    {p.exists === false && !editingRow && (
                                                        <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-full ml-2">
                                                            Missing from Drive
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-2">
                                                        {p.exams.map((exam: string, j: number) => (
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
