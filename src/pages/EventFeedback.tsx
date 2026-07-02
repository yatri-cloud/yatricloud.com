import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Send, ArrowLeft, Loader2, ThumbsUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/lib/supabase";

export default function EventFeedback() {
    const { eventName } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { theme } = useTheme();

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        likes: "",
        improvements: ""
    });

    // Decode event name from URL for display
    const displayEventName = eventName ? decodeURIComponent(eventName).replace(/-/g, ' ') : "Event";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast({
                title: "Rating Required",
                description: "Please select a star rating",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("event_feedback").insert({
                event_name: displayEventName,
                name: formData.name || null,
                email: formData.email || null,
                rating,
                comments: formData.likes || null,
                answers: {
                    likes: formData.likes,
                    improvements: formData.improvements,
                    source: window.location.href,
                },
            });
            if (error) throw error;

            setIsSubmitted(true);
            toast({
                title: "Feedback Submitted!",
                description: "Thank you for helping us improve.",
            });
        } catch (error) {
            console.error("Submission error:", error);
            toast({
                title: "Submission Failed",
                description: "Could not send feedback. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <ThumbsUp className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                    <p className="text-muted-foreground mb-6">
                        Your feedback for <span className="font-semibold text-primary">{displayEventName}</span> has been received.
                    </p>
                    <div className="space-y-3">
                        <Button variant="outline" className="w-full" onClick={() => navigate('/events')}>
                            Browse More Events
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>
                            Back to Home
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-8 pl-0 hover:pl-2 transition-all"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-t-4 border-t-primary shadow-lg">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-3xl font-bold text-primary mb-2">Event Feedback</CardTitle>
                            <CardDescription className="text-lg">
                                How was your experience at <span className="font-semibold text-foreground">{displayEventName}</span>?
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* Star Rating */}
                                <div className="space-y-3 text-center">
                                    <Label className="text-base">Overall Rating <span className="text-red-500">*</span></Label>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={`w-10 h-10 ${star <= (hoverRating || rating)
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-muted-foreground/30"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground h-4">
                                        {(hoverRating || rating) === 1 && "Poor"}
                                        {(hoverRating || rating) === 2 && "Fair"}
                                        {(hoverRating || rating) === 3 && "Good"}
                                        {(hoverRating || rating) === 4 && "Very Good"}
                                        {(hoverRating || rating) === 5 && "Excellent!"}
                                    </p>
                                </div>

                                {/* Text Feedback */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="likes">What did you like the most?</Label>
                                        <Textarea
                                            id="likes"
                                            placeholder="The speakers, the content, the venue..."
                                            className="min-h-[100px]"
                                            value={formData.likes}
                                            onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="improvements">What could be improved?</Label>
                                        <Textarea
                                            id="improvements"
                                            placeholder="Suggestions for next time..."
                                            className="min-h-[100px]"
                                            value={formData.improvements}
                                            onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* User Details (Optional) */}
                                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name (Optional)</Label>
                                        <Input
                                            id="name"
                                            placeholder="Your Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email (Optional)</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full text-lg h-12"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 mr-2" />
                                            Submit Feedback
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <p className="text-center text-sm text-muted-foreground mt-8">
                        Your honest feedback helps us create better experiences for the community.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
