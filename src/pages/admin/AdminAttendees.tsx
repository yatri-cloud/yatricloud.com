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
        <div className="p-6">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Attendee Verification</h1>
                    <p className="text-muted-foreground">
                        Enter the attendee's registration code to verify and check them in
                    </p>
                </div>

                {/* Code Entry */}
                <Card className="p-6 mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Registration Code
                    </label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="EVT-XXXX1234"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            onKeyPress={handleKeyPress}
                            className="text-lg font-mono tracking-wider"
                            disabled={loading || verified}
                        />
                        <Button
                            onClick={handleVerify}
                            disabled={loading || !code.trim() || verified}
                            size="lg"
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
                    <p className="text-xs text-muted-foreground mt-2">
                        Format: EVT-XXXX1234 (4 letters + 4 numbers)
                    </p>
                </Card>

                {/* Attendee Details */}
                {attendee && !verified && (
                    <Card className="p-6 mb-6 border-2 border-primary">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{attendee.name}</h2>
                                <p className="text-muted-foreground">{attendee.eventName}</p>
                            </div>
                            <Badge className={
                                attendee.status === 'attended'
                                    ? 'bg-green-600'
                                    : 'bg-blue-600'
                            }>
                                {attendee.status === 'attended' ? 'Already Checked In' : 'Pending Check-in'}
                            </Badge>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{attendee.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium">{attendee.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Location</p>
                                    <p className="font-medium">
                                        {attendee.city}, {attendee.state}, {attendee.country}
                                    </p>
                                </div>
                            </div>

                            {attendee.linkedIn && (
                                <div className="flex items-center gap-3">
                                    <Linkedin className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">LinkedIn</p>
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

                            <div className="flex items-center gap-3 pt-3 border-t">
                                <User className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Registration Details</p>
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
                                className="w-full"
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
                            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
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
                    <Card className="p-8 text-center bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">Check-in Successful!</h3>
                        <p className="text-muted-foreground mb-4">
                            {attendee?.name} has been marked as attended
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Ready for next attendee...
                        </p>
                    </Card>
                )}

                {/* Instructions */}
                <Card className="p-6 bg-muted/50">
                    <h3 className="font-semibold mb-2">Quick Guide</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Ask the attendee for their registration code</li>
                        <li>Enter the code and press Enter or click Verify</li>
                        <li>Review the attendee details to confirm identity</li>
                        <li>Click "Confirm Attendance" to check them in</li>
                        <li>The system will automatically prepare for the next attendee</li>
                    </ol>
                </Card>
            </div>
        </div>
    );
}
