
import { useState, useEffect, useMemo } from "react";
import { Loader2, Search, Trash2, Edit2, Mail, Phone, MapPin, Linkedin, CheckCircle, XCircle, UserCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListPager } from "@/components/ui/list-pager";
import { toast } from "sonner";
import { listAllEnrollments, deleteEnrollment } from "@/lib/training-api";

interface Enrollment {
    rowIndex: string;
    timestamp: string;
    trainingName: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    city: string;
    status: string;
    paymentStatus: string;
    amount: string;
}

export default function AdminEnrollments() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sort, setSort] = useState<"newest" | "oldest" | "name" | "course">("newest");
    const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "free">("all");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 12;

    useEffect(() => { setPage(1); }, [searchTerm, sort, paymentFilter]);

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        setIsLoading(true);
        try {
            const result = await listAllEnrollments();
            setEnrollments(result as Enrollment[]);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch enrollments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (rowIndex: string) => {
        if (!confirm("Are you sure you want to delete this enrollment?")) return;

        try {
            await deleteEnrollment(rowIndex);
            toast.success("Enrollment deleted");
            fetchEnrollments();
        } catch (e: any) {
            toast.error("Delete failed: " + (e?.message || "Network error"));
        }
    };

    const filteredEnrollments = useMemo(() => {
        let list = enrollments.filter(e =>
            e.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.trainingName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (paymentFilter === "paid") list = list.filter(e => e.paymentStatus === "Paid");
        if (paymentFilter === "free") list = list.filter(e => e.paymentStatus !== "Paid");
        const sorted = [...list];
        switch (sort) {
            case "oldest": sorted.sort((a, b) => a.timestamp.localeCompare(b.timestamp)); break;
            case "name": sorted.sort((a, b) => a.userName.localeCompare(b.userName)); break;
            case "course": sorted.sort((a, b) => a.trainingName.localeCompare(b.trainingName)); break;
            default: sorted.sort((a, b) => b.timestamp.localeCompare(a.timestamp)); break;
        }
        return sorted;
    }, [enrollments, searchTerm, sort, paymentFilter]);

    const pageCount = Math.max(1, Math.ceil(filteredEnrollments.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pagedEnrollments = filteredEnrollments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleExportCsv = () => {
        const headers = ["Date", "Student", "Email", "Phone", "City", "Course", "Status", "Payment", "Amount"];
        const rows = filteredEnrollments.map(e => [
            e.timestamp ? new Date(e.timestamp).toLocaleDateString() : "",
            e.userName, e.userEmail, e.userPhone, e.city,
            e.trainingName, e.status, e.paymentStatus, e.amount,
        ]);
        const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `enrollments-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${filteredEnrollments.length} enrollments`);
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in">
            {/* Header band — distinct blue-tinted workspace panel */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="space-y-1.5">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Enrollments
                        </p>
                        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Student Enrollments</h1>
                        <p className="text-muted-foreground">Manage course registrations and payments.</p>
                    </div>
                </div>
            </div>

            <Card className="border border-border rounded-2xl shadow-none">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <CardTitle className="text-lg">All Enrollments ({filteredEnrollments.length})</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-60">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search students or courses..."
                                    className="pl-9 rounded-xl"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as any)}>
                                <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All payments</SelectItem>
                                    <SelectItem value="paid">Paid only</SelectItem>
                                    <SelectItem value="free">Free only</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                                <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest first</SelectItem>
                                    <SelectItem value="oldest">Oldest first</SelectItem>
                                    <SelectItem value="name">Student name</SelectItem>
                                    <SelectItem value="course">Course name</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExportCsv}>
                                <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Date</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Student</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Course</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Contact</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Status</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Payment</TableHead>
                                        <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEnrollments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-16">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                        <UserCheck className="w-7 h-7" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="font-display text-lg font-semibold">No enrollments yet</h3>
                                                        <p className="text-muted-foreground text-sm">Student registrations will appear here as they come in.</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pagedEnrollments.map((enrollment) => (
                                            <TableRow key={enrollment.rowIndex} className="hover:bg-brand-50">
                                                <TableCell className="whitespace-nowrap font-medium">
                                                    {new Date(enrollment.timestamp).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">{enrollment.userName}</div>
                                                    <div className="text-xs text-muted-foreground">{enrollment.city}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-[200px] truncate" title={enrollment.trainingName}>
                                                        {enrollment.trainingName}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {enrollment.userEmail}</span>
                                                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {enrollment.userPhone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={enrollment.status === 'Enrolled' ? 'default' : 'secondary'}>
                                                        {enrollment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {enrollment.paymentStatus === 'Paid' ? (
                                                        <Badge className="rounded-full bg-success/10 text-success hover:bg-success/10 border-0 tabular-nums">
                                                            Paid ({enrollment.amount})
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="rounded-full text-primary bg-primary/10 hover:bg-primary/10 border-0">
                                                            Free
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(enrollment.rowIndex)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredEnrollments.length)} of {filteredEnrollments.length}
                </p>
                <ListPager page={currentPage} pageCount={pageCount} onPageChange={setPage} />
            </div>
        </div>
    );
}
