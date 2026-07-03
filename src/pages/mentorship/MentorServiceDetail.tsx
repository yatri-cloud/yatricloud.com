import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { LoginModal } from "@/components/LoginModal";
import SlotPicker from "@/components/mentorship/SlotPicker";
import { useToast } from "@/hooks/use-toast";
import { hasSession, getCachedUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { createRazorpayOrder } from "@/lib/razorpay";
import { sendEmail } from "@/lib/email";
import { generateSlots, Slot, type DateOverride } from "@/lib/mentorship-slots";
import {
  Mentor,
  MentorshipService,
  MentorshipBooking,
  BookedSlotRow,
  AvailabilityRule,
  BookingAnswer,
  getMentorBySlug,
  getServiceBySlug,
  getMentorAvailability,
  getMentorBookedSlots,
  getMentorDateOverrides,
  createBooking,
  createMentorshipOrder,
  openMentorshipCheckout,
  formatServicePrice,
  serviceMeta,
  formatInstant,
  visitorTimezone,
  buildBookingConfirmationEmail,
  googleCalendarUrl,
} from "@/lib/mentorship";

const SITE_URL = "https://www.yatricloud.com";

const MentorServiceDetail = () => {
  const { mentorSlug, serviceSlug } = useParams<{
    mentorSlug: string;
    serviceSlug: string;
  }>();
  const { toast } = useToast();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [service, setService] = useState<MentorshipService | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [bookedRows, setBookedRows] = useState<BookedSlotRow[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<MentorshipBooking | null>(null);

  const timeZone = useMemo(() => visitorTimezone(), []);

  // Prefill the invitee form from the signed-in Yatri.
  useEffect(() => {
    const user = getCachedUser();
    if (user) {
      setName((v) => v || user.fullName || "");
      setEmail((v) => v || user.email || "");
      setPhone((v) => v || user.phoneNumber || "");
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    let mounted = true;
    (async () => {
      const foundMentor = await getMentorBySlug(mentorSlug || "");
      if (!mounted) return;
      setMentor(foundMentor);
      if (foundMentor) {
        const [foundService, availability, booked, dateOverrides] = await Promise.all([
          getServiceBySlug(foundMentor.id, serviceSlug || ""),
          getMentorAvailability(foundMentor.id),
          getMentorBookedSlots(foundMentor.id),
          getMentorDateOverrides(foundMentor.id),
        ]);
        if (!mounted) return;
        setService(foundService);
        setRules(availability);
        setBookedRows(booked);
        setOverrides(dateOverrides);
      }
      setLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, [mentorSlug, serviceSlug]);

  const needsSlot = service?.type === "call" || service?.type === "package";
  const isDigital = service?.type === "digital";
  const isWebinar = service?.type === "webinar";

  const slots = useMemo(() => {
    if (!mentor || !service || !needsSlot) return [] as Slot[];
    return generateSlots(
      rules,
      bookedRows,
      service.duration_min ?? 30,
      mentor.buffer_min,
      mentor.notice_hours,
      mentor.booking_window_days,
      new Date(),
      overrides
    );
  }, [mentor, service, rules, bookedRows, overrides, needsSlot]);

  const refreshBookedSlots = useCallback(async () => {
    if (!mentor) return;
    const booked = await getMentorBookedSlots(mentor.id);
    setBookedRows(booked);
    setSelectedSlot(null);
  }, [mentor]);

  const sendBuyerEmail = useCallback(
    (booking: MentorshipBooking, svc: MentorshipService, m: Mentor) => {
      let html = buildBookingConfirmationEmail({
        name: booking.customer_name || "Yatri",
        serviceTitle: svc.title,
        mentorName: m.name,
        amountLabel: formatServicePrice(booking.amount),
        slotLabel: booking.slot_start
          ? `${formatInstant(booking.slot_start, timeZone)} (${timeZone.replace(/_/g, " ")})`
          : null,
        isDigital: svc.type === "digital",
      });

      // Add a calendar link under the bookings button for scheduled sessions.
      if (svc.type !== "digital" && booking.slot_start && booking.slot_end) {
        const calUrl = googleCalendarUrl({
          title: svc.title,
          startISO: booking.slot_start,
          endISO: booking.slot_end,
          details: `Mentorship session with ${m.name}.${
            booking.meeting_link ? ` Join here: ${booking.meeting_link}` : ""
          }`,
          location: booking.meeting_link || "Online",
        });
        html = html.replace(
          "View my bookings</a>",
          `View my bookings</a><br><a href="${calUrl}" style="color: #3b82f6; font-weight: bold; text-decoration: none; display: inline-block; margin-top: 16px;">Add to your calendar</a>`
        );
      }

      void sendEmail({
        to: booking.customer_email,
        subject: `Booking confirmed: ${svc.title} with ${m.name}`,
        html,
      });
    },
    [timeZone]
  );

  const handleBook = async () => {
    if (!mentor || !service || submitting) return;

    if (!hasSession()) {
      setShowLogin(true);
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !trimmedEmail.includes("@")) {
      toast({
        title: "Almost there",
        description: "Please add your name and a valid email so we can confirm your booking.",
      });
      return;
    }

    if (needsSlot && !selectedSlot) {
      toast({
        title: "Pick a time",
        description: "Choose a date and time that works for you first.",
      });
      return;
    }

    const missingRequired = service.questions.some(
      (q, i) => q.required && !(answers[i] || "").trim()
    );
    if (missingRequired) {
      toast({
        title: "One more thing",
        description: "Please answer the required questions so your mentor can prepare.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const cached = getCachedUser();
      let userId = cached?.id;
      if (!userId) {
        const { data } = await supabase.auth.getUser();
        userId = data.user?.id;
      }
      if (!userId) {
        setShowLogin(true);
        setSubmitting(false);
        return;
      }

      const answerList: BookingAnswer[] = service.questions.map((q, i) => ({
        label: q.label,
        answer: (answers[i] || "").trim(),
      }));

      const slotStart = needsSlot
        ? selectedSlot!.start.toISOString()
        : isWebinar && service.webinar_start_at
          ? service.webinar_start_at
          : null;
      const slotEnd = needsSlot
        ? selectedSlot!.end.toISOString()
        : isWebinar && service.webinar_start_at && service.duration_min
          ? new Date(
              new Date(service.webinar_start_at).getTime() +
                service.duration_min * 60000
            ).toISOString()
          : null;

      const isFree = service.price <= 0;

      // Free services confirm instantly: no order, no payment.
      if (isFree) {
        const result = await createBooking({
          serviceId: service.id,
          mentorId: mentor.id,
          userId,
          customerName: trimmedName,
          customerEmail: trimmedEmail,
          customerPhone: phone.trim() || null,
          answers: answerList,
          slotStart,
          slotEnd,
          buyerTimezone: timeZone,
          amount: 0,
          currency: service.currency,
          status: "confirmed",
          orderId: null,
        });
        if (result.slotTaken) {
          toast({
            title: "That slot was just taken",
            description: "Another Yatri booked it moments ago. Please pick a different time.",
          });
          await refreshBookedSlots();
          return;
        }
        if (result.error || !result.booking) {
          toast({ title: "Something went wrong", description: result.error || "Please try again." });
          return;
        }
        setConfirmedBooking(result.booking);
        sendBuyerEmail(result.booking, service, mentor);
        return;
      }

      // Paid flow: orders row, pending booking, Razorpay order, checkout.
      const order = await createMentorshipOrder({
        userId,
        email: trimmedEmail,
        amount: service.price,
        currency: service.currency,
        items: [
          {
            service_id: service.id,
            title: service.title,
            mentor: mentor.name,
            slot_start: slotStart,
          },
        ],
      });
      if (order.error || !order.orderId) {
        toast({ title: "Something went wrong", description: order.error || "Please try again." });
        return;
      }

      const result = await createBooking({
        serviceId: service.id,
        mentorId: mentor.id,
        userId,
        customerName: trimmedName,
        customerEmail: trimmedEmail,
        customerPhone: phone.trim() || null,
        answers: answerList,
        slotStart,
        slotEnd,
        buyerTimezone: timeZone,
        amount: service.price,
        currency: service.currency,
        status: "pending",
        orderId: order.orderId,
      });
      if (result.slotTaken) {
        toast({
          title: "That slot was just taken",
          description: "Another Yatri booked it moments ago. Please pick a different time.",
        });
        await refreshBookedSlots();
        return;
      }
      if (result.error || !result.booking) {
        toast({ title: "Something went wrong", description: result.error || "Please try again." });
        return;
      }
      const booking = result.booking;

      const amountPaise = Math.round(service.price * 100);
      const razorpayOrderId = await createRazorpayOrder({
        amount: amountPaise,
        currency: service.currency,
        receipt: `mentorship_${booking.id.slice(0, 30)}`,
        notes: {
          kind: "mentorship",
          booking_id: booking.id,
          service: service.title,
          mentor: mentor.name,
          email: trimmedEmail,
        },
      });

      openMentorshipCheckout({
        razorpayOrderId,
        amountPaise,
        serviceTitle: service.title,
        bookingId: booking.id,
        orderId: order.orderId,
        customer: { name: trimmedName, email: trimmedEmail, phone: phone.trim() },
        onSuccess: () => {
          const confirmed: MentorshipBooking = { ...booking, status: "confirmed" };
          setConfirmedBooking(confirmed);
          sendBuyerEmail(confirmed, service, mentor);
          setSubmitting(false);
        },
        onFailure: (message) => {
          toast({ title: "Payment not completed", description: message });
          setSubmitting(false);
        },
      });
      return;
    } catch {
      toast({
        title: "Something went wrong",
        description: "We could not start your booking. Please try again.",
      });
    } finally {
      // Runs for every path, including right after the Razorpay modal
      // opens. That is intended: the modal overlays the page, and its
      // success and failure callbacks settle the flow from there.
      setSubmitting(false);
    }
  };

  const handleLoginSuccess = (user: any) => {
    setShowLogin(false);
    setName((v) => v || user?.fullName || "");
    setEmail((v) => v || user?.email || "");
    toast({
      title: "Welcome, Yatri",
      description: "You are signed in. Complete your booking below.",
    });
  };

  /* ---------------- not found ---------------- */

  if (loaded && (!mentor || !service)) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO title="Session not found | Yatri Cloud" noindex />
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 pt-32 pb-24 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">
            We could not find this session
          </h1>
          <p className="text-muted-foreground mb-8">
            It may have been renamed or unpublished.
          </p>
          <Link
            to={mentor ? `/mentorship/${mentor.slug}` : "/mentorship"}
            className="inline-flex items-center justify-center min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {mentor ? `See all sessions by ${mentor.name}` : "Browse mentors"}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---------------- success screen ---------------- */

  if (confirmedBooking && mentor && service) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO title={`Booking confirmed · ${service.title} | Yatri Cloud`} noindex />
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 pt-32 pb-24">
          <div className="max-w-xl mx-auto text-center">
            <div className="rounded-3xl border border-border bg-card p-8 md:p-12 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
                Booking confirmed
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-[-0.02em]">
                You are all set, Yatri
              </h1>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {isDigital
                  ? "Your product is unlocked. Open your bookings to access it any time."
                  : "A confirmation email is on its way. Your mentor will share the meeting link before the session."}
              </p>

              <div className="mt-8 rounded-2xl band-tint border border-border p-6 text-left space-y-2">
                <p className="font-semibold text-foreground">{service.title}</p>
                <p className="text-sm text-muted-foreground">with {mentor.name}</p>
                {confirmedBooking.slot_start && (
                  <p className="text-sm text-muted-foreground">
                    {formatInstant(confirmedBooking.slot_start, timeZone)} ·{" "}
                    {timeZone.replace(/_/g, " ")}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Amount paid:{" "}
                  <span className="font-semibold text-foreground">
                    {formatServicePrice(confirmedBooking.amount)}
                  </span>
                </p>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/mentorship/bookings"
                  className="inline-flex items-center justify-center min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  View my bookings
                </Link>
                <Link
                  to={`/mentorship/${mentor.slug}`}
                  className="inline-flex items-center justify-center min-h-[44px] border border-border px-6 py-3 rounded-xl font-medium hover:bg-brand-50 hover:border-brand-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Back to {mentor.name.split(" ")[0]}
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---------------- main page ---------------- */

  const jsonLd =
    mentor && service
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.short_description || service.description,
            provider: {
              "@type": "Person",
              name: mentor.name,
              url: `${SITE_URL}/mentorship/${mentor.slug}`,
            },
            offers: {
              "@type": "Offer",
              price: service.price,
              priceCurrency: service.currency,
              availability: "https://schema.org/InStock",
              url: `${SITE_URL}/mentorship/${mentor.slug}/${service.slug}`,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Mentorship",
                item: `${SITE_URL}/mentorship`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: mentor.name,
                item: `${SITE_URL}/mentorship/${mentor.slug}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: service.title,
                item: `${SITE_URL}/mentorship/${mentor.slug}/${service.slug}`,
              },
            ],
          },
        ]
      : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title={
          service && mentor
            ? `${service.title} with ${mentor.name} | Yatri Cloud`
            : "Mentorship | Yatri Cloud"
        }
        description={service?.short_description || undefined}
        jsonLd={jsonLd}
      />
      <div className="noise-overlay" />
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-16">
        {mentor && (
          <Link
            to={`/mentorship/${mentor.slug}`}
            className="inline-flex items-center min-h-[44px] text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            Back to {mentor.name}
          </Link>
        )}

        {!loaded || !mentor || !service ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 animate-pulse motion-reduce:animate-none">
            <div className="lg:col-span-3 space-y-4">
              <div className="h-10 w-2/3 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 bg-muted rounded-3xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
            {/* Left: the pitch */}
            <div className="lg:col-span-3">
              <ScrollReveal>
                {service.badge && (
                  <span className="inline-block mb-4 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                    {service.badge}
                  </span>
                )}
                <h1 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em] leading-[1.08]">
                  {service.title}
                </h1>
                <p className="mt-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {serviceMeta(service)}
                </p>

                <div className="mt-8 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted shrink-0">
                    {mentor.photo_url ? (
                      <img
                        src={mentor.photo_url}
                        alt={mentor.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-xl font-bold text-brand-200">
                          {mentor.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{mentor.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {mentor.headline}
                    </p>
                  </div>
                  {mentor.review_count > 0 && (
                    <p className="ml-auto shrink-0 text-sm text-foreground">
                      <span className="font-semibold">
                        {mentor.avg_rating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground"> / 5</span>
                    </p>
                  )}
                </div>

                <div className="mt-10 space-y-4">
                  <h2 className="font-display text-xl font-bold">
                    What you get
                  </h2>
                  {(service.description || service.short_description)
                    .split("\n")
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i} className="text-muted-foreground leading-relaxed">
                        {para}
                      </p>
                    ))}
                </div>
              </ScrollReveal>
            </div>

            {/* Right: booking card */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                <ScrollReveal>
                  <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6">
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-3xl font-bold text-foreground">
                        {formatServicePrice(service.price)}
                      </span>
                      {service.compare_at_price !== null &&
                        service.compare_at_price > service.price && (
                          <span className="text-lg text-muted-foreground line-through">
                            {formatServicePrice(service.compare_at_price)}
                          </span>
                        )}
                    </div>

                    {needsSlot && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                          Pick a time
                        </h3>
                        <SlotPicker
                          slots={slots}
                          selected={selectedSlot}
                          onSelect={setSelectedSlot}
                          timeZone={timeZone}
                        />
                      </div>
                    )}

                    {isWebinar && service.webinar_start_at && (
                      <div className="rounded-2xl band-tint border border-border p-4">
                        <p className="text-sm text-muted-foreground">Live session</p>
                        <p className="font-semibold text-foreground">
                          {formatInstant(service.webinar_start_at, timeZone)}
                        </p>
                      </div>
                    )}

                    {isDigital && (
                      <p className="text-sm text-muted-foreground">
                        Instant access after checkout. You will find your
                        download under My Bookings.
                      </p>
                    )}

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        Your details
                      </h3>
                      <div>
                        <label htmlFor="ms-name" className="block text-xs font-medium text-muted-foreground mb-1">
                          Full name
                        </label>
                        <input
                          id="ms-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoComplete="name"
                          className="w-full min-h-[44px] px-4 rounded-xl border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div>
                        <label htmlFor="ms-email" className="block text-xs font-medium text-muted-foreground mb-1">
                          Email
                        </label>
                        <input
                          id="ms-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          className="w-full min-h-[44px] px-4 rounded-xl border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div>
                        <label htmlFor="ms-phone" className="block text-xs font-medium text-muted-foreground mb-1">
                          Phone (optional)
                        </label>
                        <input
                          id="ms-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          autoComplete="tel"
                          className="w-full min-h-[44px] px-4 rounded-xl border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      {service.questions.map((q, i) => (
                        <div key={i}>
                          <label htmlFor={`ms-q-${i}`} className="block text-xs font-medium text-muted-foreground mb-1">
                            {q.label}
                            {q.required ? " (required)" : ""}
                          </label>
                          <textarea
                            id={`ms-q-${i}`}
                            value={answers[i] || ""}
                            onChange={(e) =>
                              setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                            }
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-border space-y-3">
                      {selectedSlot && (
                        <p className="text-sm text-muted-foreground">
                          Selected:{" "}
                          <span className="font-semibold text-foreground">
                            {formatInstant(selectedSlot.start, timeZone)}
                          </span>
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleBook}
                        disabled={submitting}
                        className="w-full min-h-[48px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-inset-btn hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {submitting
                          ? "Working on it"
                          : hasSession()
                            ? service.price > 0
                              ? `${service.cta_label} · ${formatServicePrice(service.price)}`
                              : service.cta_label
                            : "Sign in to book"}
                      </button>
                      <p className="text-xs text-muted-foreground text-center">
                        Secure checkout powered by Razorpay. You will get an
                        email confirmation right after.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        )}
      </main>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
        title="Sign in to book"
        description="Bookings live in your Yatri account so you never lose a session."
      />

      <Footer />
    </div>
  );
};

export default MentorServiceDetail;
