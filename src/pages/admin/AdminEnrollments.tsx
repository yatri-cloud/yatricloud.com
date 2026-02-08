
import { useState, useEffect } from "react";
import { Loader2, Search, Trash2, Edit2, Mail, Phone, MapPin, Linkedin, CheckCircle, XCircle } from "lucide-react";
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

interface Enrollment {
    rowIndex: number;
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

    const SCRIPT_URL = import.meta.env.VITE_TRAINING_SCRIPT_URL || import.meta.env.VITE_EVENT_FEEDBACK_SCRIPT_URL;

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "getEnrollments" }),
            });
            const result = await response.json();
            if (result.success) {
                setEnrollments(result.enrollments);
            } else {
                toast.error("Failed to fetch enrollments");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (rowIndex: number) => {
        if (!confirm("Are you sure you want to delete this enrollment?")) return;

        try {
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "deleteEnrollment", rowIndex }),
            });
            const result = await response.json();
            if (result.success) {
                toast.success("Enrollment deleted");
                fetchEnrollments();
            } else {
                toast.error("Delete failed: " + result.error);
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const filteredEnrollments = enrollments.filter(e =>
        e.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.trainingName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Student Enrollments</h1>
                    <p className="text-muted-foreground">Manage course registrations and payments.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <CardTitle>All Enrollments ({filteredEnrollments.length})</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students or courses..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Course</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEnrollments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No enrollments found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEnrollments.map((enrollment) => (
                                            <TableRow key={enrollment.rowIndex}>
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
                                                        <Badge className="bg-green-600 hover:bg-green-700">
                                                            Paid ({enrollment.amount})
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                                            Free
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(enrollment.rowIndex)}>
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
