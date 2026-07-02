
import { useState, useEffect } from "react";
import { Loader2, Search, Trash2, Edit2, Mail, Phone, MapPin, Linkedin, CheckCircle, XCircle, UserCheck } from "lucide-react";
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

    const filteredEnrollments = enrollments.filter(e =>
        e.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.trainingName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students or courses..."
                                className="pl-9 rounded-xl"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
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
                                        filteredEnrollments.map((enrollment) => (
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
        </div>
    );
}
