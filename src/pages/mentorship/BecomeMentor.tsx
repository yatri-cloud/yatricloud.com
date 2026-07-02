/**
 * Become a Mentor — /mentorship/apply.
 *
 * Public application flow: signed-out visitors get a warm explainer with a
 * login gate, existing mentors are pointed to their dashboard, applicants
 * with a pending row see a review state, rejected applicants can submit a
 * fresh application, and everyone else gets the form. Inserts go through
 * submitMentorApplication in @/lib/mentorship; RLS keeps rows scoped to
 * the signed-in Yatri.
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { LoginModal } from "@/components/LoginModal";
import { useToast } from "@/hooks/use-toast";
import { getCachedUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import {
  MentorApplication,
  getMyMentorApplication,
  submitMentorApplication,
} from "@/lib/mentorship";

const EXPERIENCE_OPTIONS = ["0 to 2", "3 to 5", "6 to 10", "10 plus"];

/* ---------------- email helpers (inline styled, existing pattern) --- */

function emailShell(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mentor application</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
    <div style="background-color: #1e3a8a; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>
    <div style="background-color: #ffffff; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      ${content}
    </div>
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>
    </div>
  </div>
</body>
</html>
`;
}

function buildApplicantEmail(name: string): string {
  return emailShell(`
    <h2 style="color: #1e3a8a; margin-top: 0;">We received your application</h2>
    <p>Hello ${name},</p>
    <p>Thank you for applying to mentor with <strong>Yatri Cloud</strong>. It means a lot that you want to guide other Yatris on their cloud journey.</p>
    <p>Our team reads every application personally. We will review yours and write back to you within a few days.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.yatricloud.com/mentorship" style="background-color: #3b82f6; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Explore mentorship</a>
    </div>
    <p>Best regards,<br>Team Yatri Cloud</p>
  `);
}

function buildTeamEmail(app: MentorApplication): string {
  const row = (label: string, value: string) =>
    value
      ? `<p style="margin: 5px 0;"><strong>${label}:</strong> ${value}</p>`
      : "";
  return emailShell(`
    <h2 style="color: #1e3a8a; margin-top: 0;">New mentor application</h2>
    <p>A new mentor application just arrived. Review it in the admin console.</p>
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
      ${row("Name", app.name)}
      ${row("Email", app.email)}
      ${row("Phone", app.phone ?? "")}
      ${row("Headline", app.headline)}
      ${row("Expertise", app.expertise.join(", "))}
      ${row("Experience", app.experience_years ? `${app.experience_years} years` : "")}
      ${row("LinkedIn", app.linkedin_url ?? "")}
      ${row("Photo", app.photo_url ?? "")}
    </div>
    ${row("Bio", app.bio)}
    ${row("Motivation", app.motivation)}
  `);
}

/* ---------------- form state ---------------- */

interface ApplicationForm {
  name: string;
  email: string;
  phone: string;
  headline: string;
  bio: string;
  expertise: string;
  linkedin_url: string;
  photo_url: string;
  experience_years: string;
  motivation: string;
}

const emptyForm = (): ApplicationForm => {
  const user = getCachedUser();
  return {
    name: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    headline: "",
    bio: "",
    expertise: "",
    linkedin_url: "",
    photo_url: "",
    experience_years: "",
    motivation: "",
  };
};

const inputClass =
  "w-full min-h-[44px] px-4 rounded-xl border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const textareaClass =
  "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/* ---------------- layout helpers (module level so the form keeps
   focus across re-renders) ---------------- */

const Shell = ({
  children,
  showLogin,
  onCloseLogin,
  onLoginSuccess,
}: {
  children: React.ReactNode;
  showLogin: boolean;
  onCloseLogin: () => void;
  onLoginSuccess: (user: unknown) => void;
}) => (
  <div className="min-h-screen bg-background text-foreground">
    <SEO
      title="Become a Mentor · Yatri Cloud"
      description="Apply to mentor Yatris on Yatri Cloud. Share your cloud experience, guide learners through certifications and careers, and earn for your time."
    />
    <div className="noise-overlay" />
    <Navbar />
    <main className="container mx-auto px-4 md:px-6 pt-24 pb-16">{children}</main>
    <LoginModal
      isOpen={showLogin}
      onClose={onCloseLogin}
      onSuccess={onLoginSuccess}
      title="Sign in to apply"
      description="Your application lives in your Yatri account so you can track its progress."
    />
    <Footer />
  </div>
);

const StateCard = ({
  kicker,
  heading,
  body,
  children,
}: {
  kicker: string;
  heading: string;
  body: string;
  children?: React.ReactNode;
}) => (
  <div className="max-w-xl mx-auto pt-8">
    <ScrollReveal>
      <div className="rounded-3xl border border-border bg-card p-8 md:p-12 shadow-card text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
          {kicker}
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-[-0.02em]">
          {heading}
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">{body}</p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </ScrollReveal>
  </div>
);

/* ---------------- page ---------------- */

const BecomeMentor = () => {
  const { toast } = useToast();

  const [signedIn, setSignedIn] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [application, setApplication] = useState<MentorApplication | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [reapplying, setReapplying] = useState(false);
  const [form, setForm] = useState<ApplicationForm>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<MentorApplication | null>(null);

  const loadState = useCallback(async () => {
    setLoaded(false);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setSignedIn(false);
        setIsMentor(false);
        setApplication(null);
        return;
      }
      setSignedIn(true);
      const [{ data: mentorRow }, app] = await Promise.all([
        supabase
          .from("mentors")
          .select("id")
          .eq("user_id", uid)
          .maybeSingle(),
        getMyMentorApplication(),
      ]);
      setIsMentor(Boolean(mentorRow));
      setApplication(app);
      setForm(emptyForm());
    } catch {
      setSignedIn(false);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadState();
  }, [loadState]);

  const set = (key: keyof ApplicationForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (submitting) return;

    const name = form.name.trim();
    const email = form.email.trim();
    const headline = form.headline.trim();
    const bio = form.bio.trim();
    const motivation = form.motivation.trim();
    const expertise = form.expertise
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!name || !email || !email.includes("@")) {
      toast({
        title: "Almost there",
        description: "Please add your name and a valid email so we can reach you.",
      });
      return;
    }
    if (!headline || !bio) {
      toast({
        title: "Tell us about you",
        description: "Please add a short headline and a bio so we can get to know you.",
      });
      return;
    }
    if (expertise.length === 0) {
      toast({
        title: "One more thing",
        description: "Please list at least one area of expertise, separated by commas.",
      });
      return;
    }
    if (!form.experience_years) {
      toast({
        title: "One more thing",
        description: "Please select your years of experience.",
      });
      return;
    }
    if (!motivation) {
      toast({
        title: "One more thing",
        description: "Please share why you want to mentor. It helps us review faster.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitMentorApplication({
        name,
        email,
        phone: form.phone.trim() || null,
        headline,
        bio,
        expertise,
        linkedin_url: form.linkedin_url.trim() || null,
        photo_url: form.photo_url.trim() || null,
        experience_years: form.experience_years,
        motivation,
      });
      if (result.error || !result.application) {
        toast({
          title: "Something went wrong",
          description: result.error || "Please try again.",
        });
        return;
      }
      setSubmitted(result.application);
      setApplication(result.application);
      void sendEmail({
        to: email,
        subject: "We received your mentor application",
        html: buildApplicantEmail(name),
      });
      void sendEmail({
        to: "info@yatricloud.com",
        subject: `New mentor application: ${name}`,
        html: buildTeamEmail(result.application),
      });
    } catch {
      toast({
        title: "Something went wrong",
        description: "We could not submit your application. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    toast({
      title: "Welcome, Yatri",
      description: "You are signed in. Your application starts below.",
    });
    loadState();
  };

  const shellProps = {
    showLogin,
    onCloseLogin: () => setShowLogin(false),
    onLoginSuccess: handleLoginSuccess,
  };

  /* ---------------- loading ---------------- */

  if (!loaded) {
    return (
      <Shell {...shellProps}>
        <div className="max-w-xl mx-auto pt-8 animate-pulse motion-reduce:animate-none">
          <div className="rounded-3xl border border-border bg-card p-12 space-y-4">
            <div className="h-8 w-2/3 bg-muted rounded mx-auto" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded mx-auto" />
          </div>
        </div>
      </Shell>
    );
  }

  /* ---------------- signed out: warm explainer + login gate -------- */

  if (!signedIn) {
    return (
      <Shell {...shellProps}>
        <StateCard
          kicker="Become a mentor"
          heading="Share what you know and change a career"
          body="Yatri Cloud mentors guide learners through certifications, interviews and real cloud careers. You set your services, your hours and your prices. Sign in with your Yatri account to start your application. It takes about five minutes."
        >
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center justify-center min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Sign in to apply
            </button>
            <Link
              to="/mentorship"
              className="inline-flex items-center justify-center min-h-[44px] border border-border px-6 py-3 rounded-xl font-medium hover:bg-brand-50 hover:border-brand-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Meet our mentors
            </Link>
          </div>
        </StateCard>
      </Shell>
    );
  }

  /* ---------------- already a mentor ---------------- */

  if (isMentor) {
    return (
      <Shell {...shellProps}>
        <StateCard
          kicker="Become a mentor"
          heading="You are already a mentor"
          body="Good news, Yatri. This account is already linked to a mentor profile, so there is nothing to apply for. Head to your dashboard to manage your services, availability and bookings."
        >
          <Link
            to="/mentor/dashboard"
            className="inline-flex items-center justify-center min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Open mentor dashboard
          </Link>
        </StateCard>
      </Shell>
    );
  }

  /* ---------------- just submitted ---------------- */

  if (submitted) {
    return (
      <Shell {...shellProps}>
        <StateCard
          kicker="Application received"
          heading="Thank you for applying"
          body="Your application is with our team now. We read every one personally and we will email you within a few days. A confirmation is already on its way to your inbox."
        >
          <Link
            to="/mentorship"
            className="inline-flex items-center justify-center min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Explore mentorship
          </Link>
        </StateCard>
      </Shell>
    );
  }

  /* ---------------- pending review ---------------- */

  if (application?.status === "pending") {
    return (
      <Shell {...shellProps}>
        <StateCard
          kicker="Application under review"
          heading="We are reviewing your application"
          body="Thanks for your patience, Yatri. Your mentor application is with our team and we will email you as soon as there is news. This usually takes a few days."
        >
          <Link
            to="/mentorship"
            className="inline-flex items-center justify-center min-h-[44px] border border-border px-6 py-3 rounded-xl font-medium hover:bg-brand-50 hover:border-brand-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Browse mentorship
          </Link>
        </StateCard>
      </Shell>
    );
  }

  /* ---------------- approved but profile not linked yet ------------ */

  if (application?.status === "approved") {
    return (
      <Shell {...shellProps}>
        <StateCard
          kicker="Application approved"
          heading="Welcome to the mentor family"
          body="Your application was approved. The team is setting up your mentor profile. Once it is linked to your account you will find everything in your mentor dashboard."
        >
          <Link
            to="/mentor/dashboard"
            className="inline-flex items-center justify-center min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Open mentor dashboard
          </Link>
        </StateCard>
      </Shell>
    );
  }

  /* ---------------- rejected: note + fresh application ------------- */

  if (application?.status === "rejected" && !reapplying) {
    return (
      <Shell {...shellProps}>
        <StateCard
          kicker="About your application"
          heading="Your last application was not approved"
          body="Thank you for applying earlier. That application did not make it through, but this is not the end of the road. You are welcome to apply again with a fresh application whenever you are ready."
        >
          <div className="space-y-6">
            {application.admin_notes && (
              <div className="rounded-2xl band-tint border border-border p-5 text-left">
                <p className="text-sm font-semibold text-foreground mb-1">
                  A note from our team
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {application.admin_notes}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setReapplying(true)}
              className="inline-flex items-center justify-center min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Apply again
            </button>
          </div>
        </StateCard>
      </Shell>
    );
  }

  /* ---------------- the form ---------------- */

  return (
    <Shell {...shellProps}>
      <div className="max-w-2xl mx-auto">
        <ScrollReveal>
          <div className="pt-4 pb-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
              Become a mentor
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.02em] leading-[1.08]">
              Mentor the next wave of Yatris
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              You have walked the cloud path. Now help someone else walk it
              faster. Tell us about yourself below and our team will review
              your application within a few days.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="rounded-3xl border border-border bg-card p-6 md:p-10 shadow-card space-y-8">
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold">About you</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ma-name" className="block text-xs font-medium text-muted-foreground mb-1">
                    Full name
                  </label>
                  <input
                    id="ma-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ma-email" className="block text-xs font-medium text-muted-foreground mb-1">
                    Email
                  </label>
                  <input
                    id="ma-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ma-phone" className="block text-xs font-medium text-muted-foreground mb-1">
                    Phone (optional)
                  </label>
                  <input
                    id="ma-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    autoComplete="tel"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ma-experience" className="block text-xs font-medium text-muted-foreground mb-1">
                    Years of experience
                  </label>
                  <select
                    id="ma-experience"
                    value={form.experience_years}
                    onChange={(e) => set("experience_years", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a range</option>
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} years
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="ma-headline" className="block text-xs font-medium text-muted-foreground mb-1">
                  Headline
                </label>
                <input
                  id="ma-headline"
                  type="text"
                  value={form.headline}
                  onChange={(e) => set("headline", e.target.value)}
                  placeholder="For example: Senior Cloud Engineer at Acme, 5x Azure certified"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ma-bio" className="block text-xs font-medium text-muted-foreground mb-1">
                  Bio
                </label>
                <textarea
                  id="ma-bio"
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={4}
                  placeholder="Your story in a few lines. What you do, what you have built and what you love teaching."
                  className={textareaClass}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold">Your expertise</h2>
              <div>
                <label htmlFor="ma-expertise" className="block text-xs font-medium text-muted-foreground mb-1">
                  Areas of expertise, separated by commas
                </label>
                <input
                  id="ma-expertise"
                  type="text"
                  value={form.expertise}
                  onChange={(e) => set("expertise", e.target.value)}
                  placeholder="AWS, Kubernetes, DevOps, Interview prep"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ma-linkedin" className="block text-xs font-medium text-muted-foreground mb-1">
                    LinkedIn URL (optional)
                  </label>
                  <input
                    id="ma-linkedin"
                    type="url"
                    value={form.linkedin_url}
                    onChange={(e) => set("linkedin_url", e.target.value)}
                    placeholder="https://linkedin.com/in/you"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ma-photo" className="block text-xs font-medium text-muted-foreground mb-1">
                    Photo URL (optional)
                  </label>
                  <input
                    id="ma-photo"
                    type="url"
                    value={form.photo_url}
                    onChange={(e) => set("photo_url", e.target.value)}
                    placeholder="A link to a clear photo of you"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold">Why mentoring</h2>
              <div>
                <label htmlFor="ma-motivation" className="block text-xs font-medium text-muted-foreground mb-1">
                  Why do you want to mentor Yatris?
                </label>
                <textarea
                  id="ma-motivation"
                  value={form.motivation}
                  onChange={(e) => set("motivation", e.target.value)}
                  rows={4}
                  placeholder="What draws you to mentoring and what you hope your mentees walk away with."
                  className={textareaClass}
                />
              </div>
            </section>

            <div className="pt-2 border-t border-border space-y-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full min-h-[48px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-inset-btn hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {submitting ? "Sending your application" : "Submit application"}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                We review every application personally and reply by email
                within a few days.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </Shell>
  );
};

export default BecomeMentor;
