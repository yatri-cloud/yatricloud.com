import { useState, useEffect } from "react";
import {
    Loader2, Plus, Pencil, Trash2, KeyRound, Copy, ShieldCheck,
    MoreVertical, CheckCircle2, Users, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_GROUPS } from "@/config/admin-nav";
import { ADMIN_ROLES, ROLE_LABELS, defaultPermissionsForRole, isFullAccessRole } from "@/lib/permissions";
import {
    listAdminUsers, createAdminUser, updateAdminUser, resetAdminPassword, deleteAdminUser,
    type AdminUserRow,
} from "@/lib/admin-users-api";

const roleTone: Record<string, string> = {
    super_admin: "bg-primary/10 text-primary",
    admin: "bg-blue-500/10 text-primary",
    manager: "bg-amber-500/10 text-amber-600",
    support: "bg-emerald-500/10 text-emerald-600",
    auditor: "bg-purple-500/10 text-purple-600",
};

interface AdminForm {
    email: string;
    fullName: string;
    role: string;
    permissions: Set<string>;
}

const emptyForm = (): AdminForm => ({ email: "", fullName: "", role: "manager", permissions: new Set() });

/** Group permission paths by their nav group for the checkbox picker. */
const PERM_GROUPS = ADMIN_NAV_GROUPS.map((g) => ({
    label: g.label,
    items: g.items.map((i) => ({ name: i.name, path: i.path })),
}));

export default function AdminRoleManagement() {
    const [users, setUsers] = useState<AdminUserRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Add dialog
    const [addOpen, setAddOpen] = useState(false);
    const [form, setForm] = useState<AdminForm>(emptyForm());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit dialog
    const [editing, setEditing] = useState<AdminUserRow | null>(null);
    const [editForm, setEditForm] = useState<AdminForm | null>(null);

    // Generated credential reveal (create + reset)
    const [credential, setCredential] = useState<{ email: string; password: string } | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            setUsers(await listAdminUsers());
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to load admin users: " + (e?.message || "Network error"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const openAdd = () => { setForm({ ...emptyForm(), role: "manager", permissions: new Set(defaultPermissionsForRole("manager")) }); setAddOpen(true); };

    const setRole = (role: string) => {
        setForm((f) => ({ ...f, role, permissions: new Set(defaultPermissionsForRole(role)) }));
    };

    const togglePerm = (path: string) => {
        setForm((f) => {
            const next = new Set(f.permissions);
            if (next.has(path)) next.delete(path); else next.add(path);
            return { ...f, permissions: next };
        });
    };

    const handleCreate = async () => {
        const email = form.email.trim();
        if (!email) { toast.error("Email is required"); return; }
        setIsSubmitting(true);
        try {
            const res = await createAdminUser({
                email, fullName: form.fullName.trim(),
                role: form.role, permissions: [...form.permissions],
            });
            setAddOpen(false);
            setCredential({ email: res.email || email, password: res.tempPassword || "" });
            toast.success("Admin created");
            fetchUsers();
        } catch (e: any) {
            toast.error(e.message || "Failed to create admin");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEdit = (u: AdminUserRow) => {
        setEditing(u);
        setEditForm({
            email: u.email,
            fullName: u.fullName,
            role: u.role,
            permissions: new Set(u.permissions),
        });
    };

    const handleUpdate = async () => {
        if (!editing || !editForm) return;
        setIsSubmitting(true);
        try {
            await updateAdminUser({
                userId: editing.id,
                role: editForm.role,
                permissions: [...editForm.permissions],
            });
            setEditing(null);
            toast.success("Admin updated");
            fetchUsers();
        } catch (e: any) {
            toast.error(e.message || "Failed to update admin");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (u: AdminUserRow) => {
        try {
            await updateAdminUser({ userId: u.id, isActive: !u.isActive });
            toast.success(u.isActive ? "Admin disabled" : "Admin enabled");
            fetchUsers();
        } catch (e: any) {
            toast.error(e.message || "Failed to toggle");
        }
    };

    const handleResetPassword = async (u: AdminUserRow) => {
        try {
            const res = await resetAdminPassword(u.id);
            setCredential({ email: u.email, password: res.tempPassword || "" });
            toast.success("Password reset");
        } catch (e: any) {
            toast.error(e.message || "Failed to reset password");
        }
    };

    const handleDelete = async (u: AdminUserRow) => {
        if (!confirm(`Delete admin "${u.fullName || u.email}"? This permanently removes their login.`)) return;
        try {
            await deleteAdminUser(u.id);
            toast.success("Admin deleted");
            fetchUsers();
        } catch (e: any) {
            toast.error(e.message || "Failed to delete admin");
        }
    };

    const toggleEditPerm = (path: string) => {
        setEditForm((f) => {
            if (!f) return f;
            const next = new Set(f.permissions);
            if (next.has(path)) next.delete(path); else next.add(path);
            return { ...f, permissions: next };
        });
    };

    const PermPicker = ({ perms, onToggle, disabled, onRoleChange, role }: {
        perms: Set<string>; onToggle: (p: string) => void; disabled?: boolean;
        onRoleChange: (r: string) => void; role: string;
    }) => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm font-medium mb-1.5 block">Role</Label>
                    <Select value={role} onValueChange={onRoleChange} disabled={disabled}>
                        <SelectTrigger className="h-11 rounded-xl border border-input bg-background">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            {ADMIN_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end">
                    <Badge className={cn("text-xs", roleTone[role] || "bg-muted text-muted-foreground")}>
                        {isFullAccessRole(role) ? "Full access to all admin pages" : `${perms.size} pages selected`}
                    </Badge>
                </div>
            </div>

            {isFullAccessRole(role) ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-3">
                    This role can open every admin page. Page-level permissions don't apply.
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-auto pr-1">
                    {PERM_GROUPS.map((g) => (
                        <div key={g.label} className="rounded-xl border border-border bg-muted/20 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{g.label}</p>
                            <div className="space-y-1">
                                {g.items.map((it) => (
                                    <label key={it.path} className="flex items-center gap-2 min-h-[36px] text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={perms.has(it.path)}
                                            onChange={() => onToggle(it.path)}
                                            disabled={disabled}
                                            className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                                        />
                                        <span className="text-muted-foreground">{it.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Header band */}
                <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Access control
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Admin Roles &amp; Permissions</h1>
                            <p className="text-muted-foreground">
                                Create admins, managers and support staff, assign which pages each role can open, and manage their logins.
                            </p>
                        </div>
                        <Button onClick={openAdd} className="gap-2 rounded-xl min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600">
                            <Plus className="h-4 w-4" /> Add Admin
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading admins…
                    </div>
                ) : (
                    <div className="border border-border rounded-2xl bg-card overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Access</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-16" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No admin users yet. Add the first one.</TableCell></TableRow>
                                ) : users.map((u) => (
                                    <TableRow key={u.id} data-testid={`admin-user-${u.email}`}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <ShieldCheck className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{u.fullName || "—"}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("text-xs", roleTone[u.role] || "bg-muted text-muted-foreground")}>
                                                {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {isFullAccessRole(u.role) ? "All pages" : `${u.permissions.length} pages`}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-xs", u.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                                                {u.isActive ? "Active" : "Disabled"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" aria-label={`Actions for ${u.email}`} className="h-10 w-10 rounded-xl">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuItem onClick={() => openEdit(u)}><Pencil className="mr-2 h-4 w-4" /> Edit role &amp; pages</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleResetPassword(u)}><KeyRound className="mr-2 h-4 w-4" /> Reset password</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleActive(u)}>
                                                        <Lock className="mr-2 h-4 w-4" /> {u.isActive ? "Disable" : "Enable"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(u)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Add dialog */}
                <Dialog open={addOpen} onOpenChange={(o) => { if (!o) setAddOpen(false); }}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                            <DialogTitle>Add Admin</DialogTitle>
                            <DialogDescription>
                                The admin logs in with this email on the normal login page. A temporary password is generated and shown once.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium mb-1.5 block">Email (login username)</Label>
                                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="manager@yatricloud.com" className="h-11 rounded-xl border border-input bg-background" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium mb-1.5 block">Full name</Label>
                                    <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Riya Sharma" className="h-11 rounded-xl border border-input bg-background" />
                                </div>
                            </div>
                            <PermPicker perms={form.permissions} onToggle={togglePerm} role={form.role} onRoleChange={setRole} />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl min-h-[44px]">Cancel</Button>
                            <Button onClick={handleCreate} disabled={isSubmitting} className="gap-2 rounded-xl min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn">
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Create Admin
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit dialog */}
                {editing && editForm && (
                    <Dialog open onOpenChange={(o) => { if (!o) setEditing(null); }}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                            <DialogHeader>
                                <DialogTitle>Edit {editing.fullName || editing.email}</DialogTitle>
                                <DialogDescription>Change the role and which admin pages this user can open.</DialogDescription>
                            </DialogHeader>
                            <PermPicker
                                perms={editForm.permissions}
                                onToggle={toggleEditPerm}
                                role={editForm.role}
                                onRoleChange={(r) => setEditForm((f) => f ? { ...f, role: r, permissions: new Set(defaultPermissionsForRole(r)) } : f)}
                            />
                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setEditing(null)} className="rounded-xl min-h-[44px]">Cancel</Button>
                                <Button onClick={handleUpdate} disabled={isSubmitting} className="gap-2 rounded-xl min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn">
                                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Save
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Generated credential reveal */}
                <Dialog open={!!credential} onOpenChange={(o) => { if (!o) setCredential(null); }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Login credentials</DialogTitle>
                            <DialogDescription>
                                Share these securely. This password is shown only once.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                            {credential && (
                                <>
                                    <CredField label="Login (email)" value={credential.email} />
                                    <CredField label="Temporary password" value={credential.password} mono />
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setCredential(null)} className="rounded-xl min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn">Done</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

function CredField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
                <span className={cn("text-sm font-medium break-all", mono && "font-mono")}>{value}</span>
                <button
                    onClick={() => { navigator.clipboard?.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
                    aria-label={`Copy ${label}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-brand-50 hover:text-primary transition-colors"
                >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}
