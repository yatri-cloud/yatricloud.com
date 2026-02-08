
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

    const SCRIPT_URL = import.meta.env.VITE_TRAINING_SCRIPT_URL || import.meta.env.VITE_EVENT_FEEDBACK_SCRIPT_URL;

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
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'getFoldersInPath',
                    type: typ,
                    provider: prov
                })
            });
            const result = await response.json();
            if (result.success) {
                if (prov) {
                    setAvailableExams(result.folders || []);
                } else {
                    setAvailableProviders(result.folders || []);
                }
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
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getProviders' })
            });
            const result = await response.json();
            if (result.success) {
                setProviders(result.providers || []);
            }
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
            for (const exam of p.exams) {
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'deleteProvider',
                        type: p.type,
                        provider: p.name,
                        exam: exam
                    })
                });
            }
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
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'updateProvider',
                    type: p.type,
                    oldProvider: p.name,
                    oldExam: p.exams[0],
                    provider: editName,
                    exam: p.exams[0]
                })
            });
            const result = await response.json();
            if (result.success) {
                toast.success("Renamed!");
                setEditingRow(null);
                fetchProviders();
            }
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
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'addProvider',
                    provider: newProvider,
                    exam: newExam,
                    type: type
                })
            });
            const result = await response.json();
            if (result.success) {
                toast.success("Provider/Exam added!");
                setNewProvider("");
                setNewExam("");
                fetchProviders(); // Refresh list
            } else {
                toast.error("Failed to add: " + result.error);
            }
        } catch (e) {
            console.error("Add Provider Error:", e);
            toast.error("Connection failed. Check your script deployment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Providers Management</h1>
                <p className="text-muted-foreground mt-2">Manage Certification Providers and Role-based Tracks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Section */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Add New
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
                            <Button type="submit" className="w-full" disabled={isSubmitting || !newProvider || !newExam || !type}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Database"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List Section */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" /> Existing Providers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Provider/Role</TableHead>
                                        <TableHead>Exams / Courses</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!providers || providers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No providers found (or connection failed). Add one to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        providers.map((p: any, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-xs">{p.type || "N/A"}</TableCell>
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
                                                        <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded border border-destructive/20 ml-2">
                                                            Missing from Drive
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-2">
                                                        {p.exams.map((exam: string, j: number) => (
                                                            <span key={j} className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-medium border border-primary/20">
                                                                {exam}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {editingRow === i ? (
                                                            <>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleUpdate(p)} disabled={isSubmitting}>
                                                                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingRow(null)}>
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
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p)}>
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
