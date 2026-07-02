import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { LoginModal } from "@/components/LoginModal";
import { useToast } from "@/hooks/use-toast";
import { hasSession } from "@/lib/auth";
import {
  MentorshipBookingWithRefs,
  MentorReview,
  ServiceSecret,
  getMyBookings,
  getMyReviews,
  getServiceSecrets,
  cancelPendingBooking,
  submitReview,
  formatServicePrice,
  formatInstant,
  visitorTimezone,
} from "@/lib/mentorship";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-success/10 text-success",
  completed: "bg-brand-50 text-brand-700",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Payment pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

interface ReviewDraft {
  rating: number;
  text: string;
  submitting: boolean;
}

const MyMentorshipBookings = () => {
  const { toast } = useToast();
  const [signedIn, setSignedIn] = useState(hasSession());
  const [showLogin, setShowLogin] = useState(false);
  const [bookings, setBookings] = useState<MentorshipBookingWithRefs[]>([]);
  const [secrets, setSecrets] = useState<ServiceSecret[]>([]);
  const [myReviews, setMyReviews] = useState<MentorReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});

  const timeZone = useMemo(() => visitorTimezone(), []);

  const load = useCallback(async () => {
    const rows = await getMyBookings();
    setBookings(rows);
    const accessibleServiceIds = Array.from(
      new Set(
        rows
          .filter((b) => b.status === "confirmed" || b.status === "completed")
          .map((b) => b.service_id)
      )
    );
    const [secretRows, reviewRows] = await Promise.all([
      getServiceSecrets(accessibleServiceIds),
      getMyReviews(),
    ]);
    setSecrets(secretRows);
    setMyReviews(reviewRows);
    setLoaded(true);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (signedIn) void load();
    else setLoaded(true);
  }, [signedIn, load]);

  const reviewedBookingIds = useMemo(
    () => new Set(myReviews.map((r) => r.booking_id).filter(Boolean)),
    [myReviews]
  );

  const secretFor = (serviceId: string): ServiceSecret | undefined =>
    secrets.find((s) => s.service_id === serviceId);

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    const { error } = await cancelPendingBooking(bookingId);
    setCancelling(null);
    if (error) {
      toast({ title: "Could not cancel", description: error });
      return;
    }
    toast({
      title: "Booking cancelled",
      description: "The slot is free again. Book another time whenever you are ready.",
    });
    void load();
  };

  const draftFor = (bookingId: string): ReviewDraft =>
    drafts[bookingId] || { rating: 5, text: "", submitting: false };

  const setDraft = (bookingId: string, patch: Partial<ReviewDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [bookingId]: { ...draftFor(bookingId), ...patch },
    }));
  };

  const handleReviewSubmit = async (booking: MentorshipBookingWithRefs) => {
    const draft = draftFor(booking.id);
    if (!draft.text.trim()) {
      toast({
        title: "Add a few words",
        description: "Your experience helps other Yatris choose with confidence.",
      });
      return;
    }
    setDraft(booking.id, { submitting: true });
    const { error } = await submitReview({
      mentorId: booking.mentor_id,
      serviceId: booking.service_id,
      bookingId: booking.id,
      name: booking.customer_name || "A Yatri",
      rating: draft.rating,
      review: draft.text.trim(),
    });
    setDraft(booking.id, { submitting: false });
    if (error) {
      toast({ title: "Review not saved", description: error });
      return;
    }
    toast({
      title: "Thank you, Yatri",
      description: "Your review is live on the mentor profile.",
    });
    void load();
  };

  /* ---------------- signed out gate ---------------- */

  if (!signedIn) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO title="My Mentorship Bookings | Yatri Cloud" noindex />
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 pt-32 pb-24 text-center">
          <div className="max-w-md mx-auto rounded-3xl border border-border bg-card p-8 md:p-10 shadow-card">
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Your bookings live here
            </h1>
            <p className="text-muted-foreground mb-8">
              Sign in to see your sessions, meeting links and digital products.
            </p>
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="w-full min-h-[48px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-inset-btn hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Sign in
            </button>
            <Link
              to="/mentorship"
              className="inline-flex items-center justify-center min-h-[44px] mt-3 text-primary font-medium hover:underline"
            >
              Browse mentors instead
            </Link>
          </div>
        </main>
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            setSignedIn(true);
          }}
          title="Sign in to see your bookings"
        />
        <Footer />
      </div>
    );
  }

  /* ---------------- bookings list ---------------- */

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="My Mentorship Bookings | Yatri Cloud" noindex />
      <div className="noise-overlay" />
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-16">
        <div className="max-w-3xl">
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em] mb-3">
            My mentorship bookings
          </h1>
          <p className="text-muted-foreground mb-10">
            Every session, meeting link and digital product you have booked, in
            one calm place.
          </p>
        </div>

        {!loaded ? (
          <div className="space-y-4 max-w-3xl animate-pulse motion-reduce:animate-none">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 rounded-3xl border border-border bg-card" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="max-w-3xl rounded-3xl border border-border band-tint p-10 text-center">
            <p className="text-muted-foreground mb-6">
              No bookings yet, Yatri. Your first session is one click away.
            </p>
            <Link
              to="/mentorship"
              className="inline-flex items-center justify-center min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Find a mentor
            </Link>
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl">
            {bookings.map((booking) => {
              const secret = secretFor(booking.service_id);
              const isDigital = booking.service?.type === "digital";
              const canAccess =
                booking.status === "confirmed" || booking.status === "completed";
              const meetingLink =
                booking.meeting_link || (canAccess && !isDigital ? secret?.meeting_link : null);
              const deliveryUrl = canAccess && isDigital ? secret?.delivery_url : null;
              const alreadyReviewed = reviewedBookingIds.has(booking.id);
              const draft = draftFor(booking.id);

              return (
                <div
                  key={booking.id}
                  className="rounded-3xl border border-border bg-card p-6 md:p-7"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted shrink-0">
                      {booking.mentor?.photo_url ? (
                        <img
                          src={booking.mentor.photo_url}
                          alt={booking.mentor?.name || "Mentor"}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-lg font-bold text-brand-200">
                            {(booking.mentor?.name || "M").charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-foreground">
                          {booking.service?.title || "Mentorship session"}
                        </h2>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            STATUS_STYLES[booking.status] || STATUS_STYLES.cancelled
                          }`}
                        >
                          {STATUS_LABELS[booking.status] || booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        with {booking.mentor?.name || "your mentor"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        {booking.slot_start && (
                          <span>
                            {formatInstant(booking.slot_start, timeZone)} ·{" "}
                            {timeZone.replace(/_/g, " ")}
                          </span>
                        )}
                        <span>{formatServicePrice(booking.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center gap-3">
                    {booking.status === "pending" && (
                      <>
                        <p className="text-sm text-muted-foreground flex-1 min-w-[200px]">
                          This booking is waiting on payment. Unpaid holds
                          release after 30 minutes.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelling === booking.id}
                          className="min-h-[44px] px-5 rounded-xl border border-border text-sm font-medium hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {cancelling === booking.id ? "Cancelling" : "Cancel booking"}
                        </button>
                      </>
                    )}

                    {meetingLink && (
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        Join meeting
                      </a>
                    )}

                    {deliveryUrl && (
                      <a
                        href={deliveryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        Open your product
                      </a>
                    )}

                    {booking.status === "confirmed" && !meetingLink && !isDigital && (
                      <p className="text-sm text-muted-foreground">
                        Your mentor will add the meeting link before the session.
                      </p>
                    )}

                    {booking.mentor?.slug && (
                      <Link
                        to={`/mentorship/${booking.mentor.slug}`}
                        className="inline-flex items-center min-h-[44px] text-sm text-primary font-medium hover:underline"
                      >
                        View mentor
                      </Link>
                    )}
                  </div>

                  {/* Review after completion */}
                  {booking.status === "completed" && !alreadyReviewed && (
                    <div className="mt-5 pt-5 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        How was your session?
                      </h3>
                      <div className="flex gap-2 mb-3" role="radiogroup" aria-label="Rating out of 5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={draft.rating === n}
                            onClick={() => setDraft(booking.id, { rating: n })}
                            className={`min-h-[44px] min-w-[44px] rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              draft.rating === n
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-foreground hover:border-brand-200 hover:bg-brand-50"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={draft.text}
                        onChange={(e) => setDraft(booking.id, { text: e.target.value })}
                        rows={3}
                        placeholder="What did you take away from this session?"
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => handleReviewSubmit(booking)}
                        disabled={draft.submitting}
                        className="mt-3 min-h-[44px] px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {draft.submitting ? "Sending" : "Submit review"}
                      </button>
                    </div>
                  )}

                  {booking.status === "completed" && alreadyReviewed && (
                    <p className="mt-5 pt-5 border-t border-border text-sm text-muted-foreground">
                      You reviewed this session. Thank you for helping other Yatris.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyMentorshipBookings;
