import { useState } from "react";
import { Search, Loader2, CheckCircle2, AlertCircle, User, Mail, Phone, MapPin, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { verifyAttendee, confirmAttendance, AttendeeDetails } from "@/lib/registration-api";
import { updateRegistrationStatus } from "@/lib/registration-store";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/email";
import { getEventFeedbackEmail } from "@/lib/email-templates";

export default function AdminAttendees() {
    const { toast } = useToast();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [attendee, setAttendee] = useState<AttendeeDetails | null>(null);
    const [verified, setVerified] = useState(false);

    const handleVerify = async () => {
        if (!code.trim()) {
            toast({
                title: "Error",
                description: "Please enter a registration code",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        setAttendee(null);
        setVerified(false);

        try {
            const result = await verifyAttendee(code.trim().toUpperCase());

            if (result.success && result.attendee) {
                setAttendee(result.attendee);
                toast({
                    title: "Attendee Found!",
                    description: `${result.attendee.name} - ${result.attendee.eventName}`
                });
            } else {
                toast({
                    title: "Not Found",
                    description: result.error || "Invalid registration code",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to verify attendee",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!attendee) return;

        setConfirming(true);

        try {
            const result = await confirmAttendance(attendee.code);

            if (result.success) {
                // Update localStorage
                updateRegistrationStatus(attendee.code, 'attended', new Date().toISOString());

                // Send Feedback/Attendance Email
                try {
                    const feedbackLink = `${window.location.origin}/events/${encodeURIComponent(attendee.eventName)}/feedback`;
                    const emailHtml = getEventFeedbackEmail(attendee.name, attendee.eventName, feedbackLink);
                    sendEmail({
                        to: attendee.email,
                        subject: `Thanks for attending ${attendee.eventName}!`,
                        html: emailHtml
                    }).catch(err => console.error("Feedback email failed:", err));
                } catch (emailErr) {
                    console.error("Failed to prepare feedback email:", emailErr);
                }

                setVerified(true);
                toast({
                    title: "✓ Check-in Successful!",
                    description: `${attendee.name} has been marked as attended`
                });

                // Clear form after 3 seconds
                setTimeout(() => {
                    setCode("");
                    setAttendee(null);
                    setVerified(false);
                }, 3000);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to confirm attendance",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to confirm attendance",
                variant: "destructive"
            });
        } finally {
            setConfirming(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleVerify();
        }
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
                {/* Header band — distinct blue-tinted workspace panel */}
                <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                    <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Event attendees
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Attendee Verification</h1>
                            <p className="text-muted-foreground">
                                Enter an attendee's registration code to verify and check them in.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Code Entry */}
                <Card className="border border-border rounded-2xl bg-card p-5 md:p-6 shadow-none">
                    <label className="block text-sm font-medium mb-2">
                        Registration Code
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            type="text"
                            placeholder="EVT-XXXX1234"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            onKeyPress={handleKeyPress}
                            className="min-h-[44px] rounded-xl text-lg font-mono tracking-wider tabular-nums"
                            disabled={loading || verified}
                        />
                        <Button
                            onClick={handleVerify}
                            disabled={loading || !code.trim() || verified}
                            size="lg"
                            className="min-h-[44px] rounded-xl"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Search className="w-5 h-5 mr-2" />
                                    Verify
                                </>
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                        Format: EVT-XXXX1234 (4 letters + 4 numbers)
                    </p>
                </Card>

                {/* Attendee Details */}
                {attendee && !verified && (
                    <Card className="border border-border rounded-2xl bg-card p-5 md:p-6 shadow-none ring-1 ring-primary/20">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="space-y-1">
                                <h2 className="text-xl md:text-2xl font-bold tracking-tight">{attendee.name}</h2>
                                <p className="text-muted-foreground">{attendee.eventName}</p>
                            </div>
                            <Badge className={
                                attendee.status === 'attended'
                                    ? 'rounded-full border-0 bg-success/10 text-success text-xs font-medium'
                                    : 'rounded-full border-0 bg-primary/10 text-primary text-xs font-medium'
                            }>
                                {attendee.status === 'attended' ? 'Already Checked In' : 'Pending Check-in'}
                            </Badge>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                                    <p className="font-medium">{attendee.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                                    <p className="font-medium tabular-nums">{attendee.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Location</p>
                                    <p className="font-medium">
                                        {attendee.city}, {attendee.state}, {attendee.country}
                                    </p>
                                </div>
                            </div>

                            {attendee.linkedIn && (
                                <div className="flex items-center gap-3">
                                    <Linkedin className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">LinkedIn</p>
                                        <a
                                            href={attendee.linkedIn}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {attendee.linkedIn}
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-4 border-t border-border">
                                <User className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Registration Details</p>
                                    <p className="font-medium text-sm">
                                        Code: {attendee.code} •
                                        Registered: {new Date(attendee.registeredAt).toLocaleDateString()}
                                        {attendee.attendedAt && (
                                            <> • Checked in: {new Date(attendee.attendedAt).toLocaleDateString()}</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {attendee.status !== 'attended' ? (
                            <Button
                                onClick={handleConfirm}
                                disabled={confirming}
                                className="w-full min-h-[44px] rounded-xl"
                                size="lg"
                            >
                                {confirming ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Confirming...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                        Confirm Attendance
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="text-center p-5 bg-warning/10 rounded-xl">
                                <AlertCircle className="w-8 h-8 text-warning mx-auto mb-2" />
                                <p className="font-semibold">Already Checked In</p>
                                <p className="text-sm text-muted-foreground">
                                    This attendee was checked in on {new Date(attendee.attendedAt!).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </Card>
                )}

                {/* Success State */}
                {verified && (
                    <Card className="border border-success/20 rounded-2xl bg-success/10 p-10 text-center shadow-none">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
                            <CheckCircle2 className="w-9 h-9" />
                        </div>
                        <h3 className="font-display text-xl md:text-2xl font-bold mb-2">Check-in Successful</h3>
                        <p className="text-muted-foreground mb-1">
                            {attendee?.name} has been marked as attended.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Ready for the next attendee.
                        </p>
                    </Card>
                )}

                {/* Instructions */}
                <Card className="border border-border rounded-2xl bg-muted/50 p-5 md:p-6 shadow-none">
                    <h3 className="font-display font-semibold mb-3">Quick Guide</h3>
                    <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                        <li>Ask the attendee for their registration code.</li>
                        <li>Enter the code and press Enter or click Verify.</li>
                        <li>Review the attendee details to confirm identity.</li>
                        <li>Click "Confirm Attendance" to check them in.</li>
                        <li>The system automatically prepares for the next attendee.</li>
                    </ol>
                </Card>
            </div>
        </div>
    );
}
