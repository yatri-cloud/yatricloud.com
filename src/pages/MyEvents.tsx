import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowLeft, Copy, CheckCircle2, XCircle, Info, Ticket, Edit, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getUserRegistrations, cancelRegistration, updateRegistration, type EventRegistration } from "@/lib/registration-store";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function MyEvents() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Modal state
    const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Mock user ID - in production, get from auth context
    const userId = "user123";

    useEffect(() => {
        // Fetch registrations
        const userRegs = getUserRegistrations(userId);
        // Sort by registration date, newest first
        userRegs.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
        setRegistrations(userRegs);
        setLoading(false);
    }, []);

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast({ title: "Code Copied!", description: "Registration code copied to clipboard" });
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const [editForm, setEditForm] = useState({ name: "", phone: "", city: "" });

    const handleCancelRegistration = (regId: string) => {
        if (confirm("Are you sure you want to cancel this registration? Effect depends on event policy.")) {
            cancelRegistration(regId);
            setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'cancelled' } : r));
            toast({ title: "Registration Cancelled", description: "You have been removed from the event." });
            setShowDetailsModal(false);
        }
    };

    const handleEditClick = (reg: EventRegistration) => {
        setEditForm({
            name: reg.userDetails.name,
            phone: reg.userDetails.phone,
            city: reg.userDetails.city
        });
        setSelectedRegistration(reg);
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        if (!selectedRegistration) return;

        const updated = updateRegistration(selectedRegistration.id, editForm);
        if (updated) {
            setRegistrations(prev => prev.map(r => r.id === updated.id ? updated : r));
            setSelectedRegistration(updated);
            setShowEditModal(false);
            toast({ title: "Details Updated", description: "Your registration details have been updated." });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'attended': return <Badge className="bg-green-600">✓ Attended</Badge>;
            case 'registered': return <Badge className="bg-blue-600">Registered</Badge>;
            case 'cancelled': return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO title="My Events · Yatri Cloud" description="See and manage your event registrations." noindex />
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                    <Button
                        variant="ghost"
                        className="gap-2 mb-6 pl-0 hover:pl-2 transition-all"
                        onClick={() => navigate('/manage-certifications')}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">My Registered Events</h1>
                        <p className="text-muted-foreground text-lg">
                            Track your upcoming events, access tickets, and manage registrations.
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
                    ) : registrations.length === 0 ? (
                        <div className="text-center py-16 border rounded-xl bg-muted/10">
                            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No Registrations Yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                You haven't registered for any events. Browse our upcoming events to get started!
                            </p>
                            <Button onClick={() => navigate('/events')}>Browse Events</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {registrations.map((reg) => (
                                <Card key={reg.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start mb-2">
                                            {getStatusBadge(reg.status)}
                                            {reg.ticketType === 'paid' && <Badge variant="outline" className="border-green-500 text-green-600">Paid</Badge>}
                                        </div>
                                        <CardTitle className="text-xl line-clamp-1">{reg.eventName}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4 text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Registered: {format(new Date(reg.registeredAt), 'MMM dd, yyyy')}
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            {reg.userDetails.city || 'Online'}
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-md flex justify-between items-center group cursor-pointer hover:bg-muted" onClick={() => copyCode(reg.registrationCode)}>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Check-in Code</p>
                                                <p className="font-mono font-bold text-lg tracking-wider">{reg.registrationCode}</p>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8">
                                                {copiedCode === reg.registrationCode ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-2 gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => {
                                                setSelectedRegistration(reg);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <Info className="w-4 h-4 mr-2" />
                                            Details
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => navigate(`/events/${reg.eventSlug || reg.eventId}`)}
                                        >
                                            View Event
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Registration Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Registration Details</DialogTitle>
                        <DialogDescription>Full details of your registration for {selectedRegistration?.eventName}</DialogDescription>
                    </DialogHeader>

                    {selectedRegistration && (
                        <div className="space-y-6 py-2">
                            {/* Code Card */}
                            <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest font-semibold">Event Ticket Code</p>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Ticket className="w-5 h-5 text-primary" />
                                    <p className="text-4xl font-mono font-bold tracking-wider text-foreground">{selectedRegistration.registrationCode}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">Show this code at the venue entrance</p>
                            </div>

                            {/* User Details */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm border-b pb-1">Attendee Information</h4>
                                <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium text-right">{selectedRegistration.userDetails.name}</span>

                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-medium text-right truncate">{selectedRegistration.userDetails.email}</span>

                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="font-medium text-right">{selectedRegistration.userDetails.phone}</span>

                                    <span className="text-muted-foreground">Location:</span>
                                    <span className="font-medium text-right">{selectedRegistration.userDetails.city}, {selectedRegistration.userDetails.state}</span>
                                </div>
                            </div>

                            {/* Payment Info if exists */}
                            {selectedRegistration.paymentStatus && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm border-b pb-1">Payment Information</h4>
                                    <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className="font-medium text-right flex justify-end items-center gap-1">
                                            {selectedRegistration.paymentStatus === 'completed'
                                                ? <><span className="text-green-600">Paid</span><CheckCircle2 className="w-3 h-3 text-green-600" /></>
                                                : <span className="capitalize">{selectedRegistration.paymentStatus}</span>
                                            }
                                        </span>

                                        <span className="text-muted-foreground">Amount:</span>
                                        <span className="font-medium text-right">₹{selectedRegistration.paymentAmount}</span>

                                        <span className="text-muted-foreground">Transaction:</span>
                                        <span className="font-medium text-right font-mono text-xs">{selectedRegistration.paymentId}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                {selectedRegistration.status === 'registered' && (
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => handleCancelRegistration(selectedRegistration.id)}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" /> Cancel Registration
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
