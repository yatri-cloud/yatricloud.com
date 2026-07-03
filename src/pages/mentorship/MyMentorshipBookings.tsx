import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { LoginModal } from "@/components/LoginModal";
import SlotPicker from "@/components/mentorship/SlotPicker";
import BookingCalendar from "@/components/mentorship/BookingCalendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { hasSession } from "@/lib/auth";
import { generateSlots, type Slot } from "@/lib/mentorship-slots";
import {
  MentorshipBookingWithRefs,
  MentorReview,
  ServiceSecret,
  getMyBookings,
  getMyReviews,
  getServiceSecrets,
  cancelBooking,
  rescheduleBooking,
  getMentorBySlug,
  getMentorAvailability,
  getMentorBookedSlots,
  getMentorDateOverrides,
  submitReview,
  formatServicePrice,
  formatInstant,
  visitorTimezone,
  googleCalendarUrl,
  buildIcs,
  icsDataUri,
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
  const [search, setSearch] = useState("");
  const [secrets, setSecrets] = useState<ServiceSecret[]>([]);
  const [myReviews, setMyReviews] = useState<MentorReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [view, setView] = useState<"list" | "calendar">("list");

  // Cancel with refund (confirm dialog).
  const [cancelTarget, setCancelTarget] = useState<MentorshipBookingWithRefs | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Reschedule (slot picker in a dialog).
  const [reschedule, setReschedule] = useState<{
    booking: MentorshipBookingWithRefs;
    slots: Slot[];
    selected: Slot | null;
    loadingSlots: boolean;
    submitting: boolean;
  } | null>(null);

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

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      (b.mentor?.name || "").toLowerCase().includes(q) ||
      (b.service?.title || "").toLowerCase().includes(q) ||
      (b.status || "").toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const secretFor = (serviceId: string): ServiceSecret | undefined =>
    secrets.find((s) => s.service_id === serviceId);

  const isUpcoming = (b: MentorshipBookingWithRefs): boolean =>
    (b.status === "pending" || b.status === "confirmed") &&
    (!b.slot_start || new Date(b.slot_start).getTime() >= Date.now());

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const { ok, refunded, message } = await cancelBooking(cancelTarget.id);
    setCancelling(false);
    setCancelTarget(null);
    if (!ok) {
      toast({ title: "Could not cancel", description: message });
      return;
    }
    toast({
      title: refunded ? "Session cancelled and refund started" : "Session cancelled",
      description: message,
    });
    void load();
  };

  const buildSlotsFor = async (
    booking: MentorshipBookingWithRefs
  ): Promise<Slot[]> => {
    if (!booking.mentor?.slug) return [];
    const mentor = await getMentorBySlug(booking.mentor.slug);
    if (!mentor) return [];
    const [rules, booked, overrides] = await Promise.all([
      getMentorAvailability(mentor.id),
      getMentorBookedSlots(mentor.id),
      getMentorDateOverrides(mentor.id),
    ]);
    return generateSlots(
      rules,
      booked,
      booking.service?.duration_min ?? 30,
      mentor.buffer_min,
      mentor.notice_hours,
      mentor.booking_window_days,
      new Date(),
      overrides
    );
  };

  const openReschedule = async (booking: MentorshipBookingWithRefs) => {
    setReschedule({ booking, slots: [], selected: null, loadingSlots: true, submitting: false });
    const slots = await buildSlotsFor(booking);
    setReschedule((r) => (r && r.booking.id === booking.id ? { ...r, slots, loadingSlots: false } : r));
  };

  const confirmReschedule = async () => {
    if (!reschedule?.selected) return;
    const { booking, selected } = reschedule;
    setReschedule((r) => (r ? { ...r, submitting: true } : r));
    const { error, slotTaken } = await rescheduleBooking(
      booking.id,
      selected.start.toISOString(),
      selected.end.toISOString()
    );
    if (slotTaken) {
      const slots = await buildSlotsFor(booking);
      setReschedule((r) =>
        r ? { ...r, slots, selected: null, submitting: false } : r
      );
      toast({
        title: "That time was just taken",
        description: "Please pick another slot, Yatri.",
      });
      return;
    }
    if (error) {
      setReschedule((r) => (r ? { ...r, submitting: false } : r));
      toast({ title: "Could not reschedule", description: error });
      return;
    }
    setReschedule(null);
    toast({
      title: "Session rescheduled",
      description: "Your new time is saved. Your mentor can see it right away.",
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
          <p className="text-muted-foreground mb-6">
            Every session, meeting link and digital product you have booked, in
            one calm place.
          </p>
        </div>

        {loaded && bookings.length > 0 && (
          <div className="flex gap-2 mb-8" role="tablist" aria-label="Choose how to view your bookings">
            {(["list", "calendar"] as const).map((option) => {
              const active = view === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(option)}
                  className={`min-h-[44px] px-5 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-brand-200 hover:bg-brand-50"
                  }`}
                >
                  {option === "list" ? "List" : "Calendar"}
                </button>
              );
            })}
          </div>
        )}

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
        ) : view === "calendar" ? (
          <div className="max-w-3xl">
            <BookingCalendar bookings={bookings} timezone={timeZone} />
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bookings by mentor, service or status"
                aria-label="Search bookings"
                className="h-10 pl-9"
              />
            </div>
            {filteredBookings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No bookings match your search.</div>
            ) : filteredBookings.map((booking) => {
              const secret = secretFor(booking.service_id);
              const isDigital = booking.service?.type === "digital";
              const canAccess =
                booking.status === "confirmed" || booking.status === "completed";
              const meetingLink =
                booking.meeting_link || (canAccess && !isDigital ? secret?.meeting_link : null);
              const deliveryUrl = canAccess && isDigital ? secret?.delivery_url : null;
              const alreadyReviewed = reviewedBookingIds.has(booking.id);
              const draft = draftFor(booking.id);

              // Calendar actions for confirmed sessions that have a slot.
              const calendarReady =
                booking.status === "confirmed" &&
                !isDigital &&
                Boolean(booking.slot_start) &&
                Boolean(booking.slot_end);
              const calTitle = booking.service?.title || "Mentorship session";
              const calLocation = meetingLink || "Online";
              const calDetails = `Mentorship session with ${
                booking.mentor?.name || "your mentor"
              }.${meetingLink ? ` Join here: ${meetingLink}` : ""}`;
              const googleUrl = calendarReady
                ? googleCalendarUrl({
                    title: calTitle,
                    startISO: booking.slot_start as string,
                    endISO: booking.slot_end as string,
                    details: calDetails,
                    location: calLocation,
                  })
                : null;
              const icsUri = calendarReady
                ? icsDataUri(
                    buildIcs({
                      uid: `booking-${booking.id}@yatricloud.com`,
                      title: calTitle,
                      startISO: booking.slot_start as string,
                      endISO: booking.slot_end as string,
                      description: calDetails,
                      location: calLocation,
                    })
                  )
                : null;

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
                      <p className="text-sm text-muted-foreground flex-1 min-w-[200px]">
                        This booking is waiting on payment. Unpaid holds release
                        after 30 minutes.
                      </p>
                    )}

                    {isUpcoming(booking) && (
                      <>
                        <button
                          type="button"
                          onClick={() => openReschedule(booking)}
                          className="min-h-[44px] px-5 rounded-xl border border-border text-sm font-medium hover:border-brand-200 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelTarget(booking)}
                          className="min-h-[44px] px-5 rounded-xl border border-border text-sm font-medium hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Cancel session
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

                    {googleUrl && (
                      <a
                        href={googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl border border-border text-sm font-medium hover:border-brand-200 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Add to Google Calendar
                      </a>
                    )}

                    {icsUri && (
                      <a
                        href={icsUri}
                        download="yatri-cloud-session.ics"
                        className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl border border-border text-sm font-medium hover:border-brand-200 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Download .ics
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

      {/* Reschedule dialog */}
      <Dialog
        open={reschedule !== null}
        onOpenChange={(open) => {
          if (!open) setReschedule(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reschedule your session</DialogTitle>
            <DialogDescription>
              Pick a new time that suits you. Your mentor sees the change right
              away.
            </DialogDescription>
          </DialogHeader>

          {reschedule?.loadingSlots ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              <p className="text-sm text-muted-foreground">Finding open times</p>
            </div>
          ) : reschedule ? (
            <SlotPicker
              slots={reschedule.slots}
              selected={reschedule.selected}
              onSelect={(slot) =>
                setReschedule((r) => (r ? { ...r, selected: slot } : r))
              }
              timeZone={timeZone}
            />
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setReschedule(null)}
              className="min-h-[44px] px-5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Keep current time
            </button>
            <button
              type="button"
              onClick={confirmReschedule}
              disabled={!reschedule?.selected || reschedule?.submitting}
              className="min-h-[44px] px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {reschedule?.submitting ? "Saving" : "Confirm new time"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This frees the slot for other Yatris. If you paid for this session
              your full refund starts automatically and reaches your account in a
              few working days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my session</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? "Cancelling" : "Cancel session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default MyMentorshipBookings;
