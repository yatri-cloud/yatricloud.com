/**
 * Mentor self service portal — /mentor/dashboard (docs/MENTORSHIP-PLAN.md §5).
 *
 * Gate: signed in user with a mentors row (user_id = auth.uid()); otherwise a
 * friendly "not a mentor yet" screen. Tabs: Services · Availability · Bookings.
 * All queries run through the anon supabase client; RLS from migration 015
 * scopes every read and write to the mentor's own rows.
 *
 * Row types come from the canonical @/lib/mentorship module; the *Row
 * aliases below keep this file's original naming.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { LoginModal } from "@/components/LoginModal";
import { supabase } from "@/lib/supabase";
import { getCachedUser, type YatriUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import BookingCalendar from "@/components/mentorship/BookingCalendar";
import {
  getMyMentorApplication,
  getMentorEarnings,
  cancelBooking,
  addDateOverride,
  deleteDateOverride,
  googleCalendarUrl,
  buildIcs,
  icsDataUri,
} from "@/lib/mentorship";
import type {
  AvailabilityRule,
  Mentor,
  MentorApplication,
  MentorEarnings,
  MentorshipBooking,
  MentorshipService,
} from "@/lib/mentorship";

/* ---------- row aliases (canonical types from @/lib/mentorship) ---------- */

type MentorRow = Mentor;
type ServiceRow = MentorshipService;
type AvailabilityRow = AvailabilityRule;
type BookingRow = MentorshipBooking;

/** A date specific availability override row (mentor_date_overrides). */
type DateOverrideRow = {
  id: string;
  date: string;
  kind: "blocked" | "open";
  start_time: string | null;
  end_time: string | null;
  note: string | null;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatINR = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

const formatSlot = (iso: string | null) => {
  if (!iso) return "No slot";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const hhmm = (t: string) => t.slice(0, 5);

const bookingBadgeClass: Record<BookingRow["status"], string> = {
  pending: "bg-brand-50 text-brand-700 border-brand-100",
  confirmed: "bg-brand-500 text-white border-brand-500",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
  refunded: "bg-muted text-muted-foreground border-border",
};

/* ---------- page ---------- */

const MentorDashboard = () => {
  const [user, setUser] = useState<YatriUser | null>(() => getCachedUser());
  const [loginOpen, setLoginOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mentor, setMentor] = useState<MentorRow | null>(null);
  const [application, setApplication] = useState<MentorApplication | null>(null);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverrideRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [earnings, setEarnings] = useState<MentorEarnings | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const loadMentor = useCallback(async () => {
    setChecking(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) {
        setMentor(null);
        return;
      }
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw error;
      setMentor((data as MentorRow) ?? null);
      // Not a mentor yet: surface their application status on the gate.
      if (!data) {
        setApplication(await getMyMentorApplication());
      }
    } catch (e) {
      console.error(e);
      setMentor(null);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadData = useCallback(async (mentorId: string) => {
    setLoadingData(true);
    try {
      const [svc, avail, overrides, book] = await Promise.all([
        supabase
          .from("mentorship_services")
          .select("*")
          .eq("mentor_id", mentorId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("mentor_availability")
          .select("*")
          .eq("mentor_id", mentorId)
          .order("weekday", { ascending: true }),
        supabase
          .from("mentor_date_overrides")
          .select("id, date, kind, start_time, end_time, note")
          .eq("mentor_id", mentorId)
          .order("date", { ascending: true }),
        supabase
          .from("mentorship_bookings")
          .select("*")
          .eq("mentor_id", mentorId)
          .order("created_at", { ascending: false }),
      ]);
      if (svc.error) throw svc.error;
      if (avail.error) throw avail.error;
      if (overrides.error) throw overrides.error;
      if (book.error) throw book.error;
      setServices((svc.data as ServiceRow[]) ?? []);
      setAvailability((avail.data as AvailabilityRow[]) ?? []);
      setDateOverrides((overrides.data as DateOverrideRow[]) ?? []);
      setBookings((book.data as BookingRow[]) ?? []);
      setEarnings(await getMentorEarnings(mentorId));
    } catch (e) {
      console.error(e);
      toast.error("Could not load your mentor data. Please refresh.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadMentor();
  }, [user, loadMentor]);

  useEffect(() => {
    if (mentor) loadData(mentor.id);
  }, [mentor, loadData]);

  /* ---------- gate screens ---------- */

  if (checking) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-muted-foreground">Checking your mentor profile</p>
        </div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <GateCard
          heading="Sign in to continue"
          body="The mentor dashboard is where you manage your services, availability and bookings. Sign in with your Yatri Cloud account to open it."
        >
          <Button className="bg-brand-500 hover:bg-brand-600 text-white" onClick={() => setLoginOpen(true)}>
            Sign in
          </Button>
        </GateCard>
        <LoginModal
          isOpen={loginOpen}
          onClose={() => setLoginOpen(false)}
          onSuccess={(u) => setUser(u as YatriUser)}
          title="Mentor sign in"
          description="Use the account linked to your mentor profile."
        />
      </Shell>
    );
  }

  if (!mentor) {
    if (application?.status === "pending") {
      return (
        <Shell>
          <GateCard
            heading="Application under review"
            body="We have your mentor application and the team is reviewing it. We read every application personally and we will email you within a few days. Thanks for your patience, Yatri."
          >
            <Button asChild variant="outline">
              <Link to="/mentorship">Browse mentorship</Link>
            </Button>
          </GateCard>
        </Shell>
      );
    }

    if (application?.status === "rejected") {
      return (
        <Shell>
          <GateCard
            heading="Your last application was not approved"
            body={
              application.admin_notes
                ? `A note from our team: ${application.admin_notes}`
                : "Your earlier mentor application did not make it through this time. You are welcome to apply again whenever you are ready."
            }
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="bg-brand-500 hover:bg-brand-600 text-white">
                <Link to="/mentorship/apply">Apply again</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/mentorship">Browse mentorship</Link>
              </Button>
            </div>
          </GateCard>
        </Shell>
      );
    }

    return (
      <Shell>
        <GateCard
          heading="You are not a mentor yet"
          body="This account is signed in but it is not linked to a mentor profile. If you already mentor with Yatri Cloud, ask the team to link your login. If you would like to become a mentor, we would love to hear from you."
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="bg-brand-500 hover:bg-brand-600 text-white">
              <Link to="/mentorship/apply">Apply to become a mentor</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/mentorship">Browse mentorship</Link>
            </Button>
          </div>
        </GateCard>
      </Shell>
    );
  }

  /* ---------- dashboard ---------- */

  return (
    <Shell>
      <div className="w-full max-w-6xl px-4 pt-24 pb-16 mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-sm font-medium text-brand-600">Mentor dashboard</p>
            <h1 className="text-3xl font-bold tracking-tight mt-1">{mentor.name}</h1>
            <p className="text-muted-foreground mt-1">{mentor.headline}</p>
          </div>
          <Button asChild variant="outline">
            <Link to={`/mentorship/${mentor.slug}`}>View public profile</Link>
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileTab mentor={mentor} onSaved={loadMentor} />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <ServicesTab
              mentorId={mentor.id}
              services={services}
              loading={loadingData}
              onSaved={() => loadData(mentor.id)}
            />
          </TabsContent>

          <TabsContent value="availability" className="mt-6">
            <AvailabilityTab
              mentor={mentor}
              rules={availability}
              overrides={dateOverrides}
              loading={loadingData}
              onChanged={() => loadData(mentor.id)}
              onMentorSaved={loadMentor}
            />
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <BookingsTab
              bookings={bookings}
              services={services}
              loading={loadingData}
              timezone={mentor.timezone}
              mentorName={mentor.name}
              onChanged={() => loadData(mentor.id)}
            />
          </TabsContent>

          <TabsContent value="earnings" className="mt-6">
            <EarningsTab earnings={earnings} loading={loadingData} />
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

/* ---------- layout helpers ---------- */

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title="Mentor Dashboard | Yatri Cloud"
      description="Manage your mentorship services, weekly availability and bookings."
      noindex
    />
    <Navbar />
    <main className="flex-1 w-full">{children}</main>
    <footer className="w-full py-8 border-t border-border bg-card/30 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Yatri Cloud Mentor Portal
        </p>
      </div>
    </footer>
  </div>
);

const GateCard = ({
  heading,
  body,
  children,
}: {
  heading: string;
  body: string;
  children: React.ReactNode;
}) => (
  <div className="w-full max-w-lg mx-auto px-4 pt-40 pb-24">
    <Card className="border border-border shadow-sm">
      <CardContent className="pt-8 pb-8 text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="text-muted-foreground leading-relaxed">{body}</p>
        <div className="mt-2">{children}</div>
      </CardContent>
    </Card>
  </div>
);

/* ---------- Profile tab ---------- */

const textToList = (text: string) =>
  text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

interface ProfileForm {
  name: string;
  headline: string;
  bio: string;
  photo_url: string;
  linkedin_url: string;
  expertise: string;
  languages: string;
}

const mentorToProfileForm = (m: MentorRow): ProfileForm => ({
  name: m.name,
  headline: m.headline,
  bio: m.bio,
  photo_url: m.photo_url ?? "",
  linkedin_url: m.linkedin_url ?? "",
  expertise: (m.expertise ?? []).join(", "),
  languages: (m.languages ?? []).join(", "),
});

const ProfileTab = ({ mentor, onSaved }: { mentor: MentorRow; onSaved: () => void }) => {
  const [form, setForm] = useState<ProfileForm>(() => mentorToProfileForm(mentor));
  const [saving, setSaving] = useState(false);
  const [togglingLive, setTogglingLive] = useState(false);

  useEffect(() => {
    setForm(mentorToProfileForm(mentor));
  }, [mentor]);

  const set = (key: keyof ProfileForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      // Status is deliberately not part of this payload; the publish switch below owns it.
      const { error } = await supabase
        .from("mentors")
        .update({
          name: form.name.trim(),
          headline: form.headline.trim(),
          bio: form.bio.trim(),
          photo_url: form.photo_url.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          expertise: textToList(form.expertise),
          languages: textToList(form.languages),
        })
        .eq("id", mentor.id);
      if (error) throw error;
      toast.success("Profile saved.");
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const setLive = async (live: boolean) => {
    setTogglingLive(true);
    try {
      const { error } = await supabase
        .from("mentors")
        .update({ status: live ? "published" : "draft" })
        .eq("id", mentor.id);
      if (error) throw error;
      toast.success(live ? "Your profile is live." : "Your profile is now offline.");
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not change your visibility.");
    } finally {
      setTogglingLive(false);
    }
  };

  const isLive = mentor.status === "published";

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="border border-border shadow-sm lg:col-span-3">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Your profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            This is what Yatris see on your public mentorship page.
          </p>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="prof-name">Name</Label>
              <Input id="prof-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prof-headline">Headline</Label>
              <Input
                id="prof-headline"
                placeholder="AWS, Azure and DevOps mentor"
                value={form.headline}
                onChange={(e) => set("headline", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prof-bio">Bio</Label>
            <Textarea
              id="prof-bio"
              rows={5}
              placeholder="A few warm lines about how you help Yatris."
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="prof-photo">Photo URL</Label>
              <Input
                id="prof-photo"
                placeholder="https://…"
                value={form.photo_url}
                onChange={(e) => set("photo_url", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prof-linkedin">LinkedIn or website URL</Label>
              <Input
                id="prof-linkedin"
                placeholder="https://linkedin.com/in/…"
                value={form.linkedin_url}
                onChange={(e) => set("linkedin_url", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="prof-expertise">Expertise, comma separated</Label>
              <Input
                id="prof-expertise"
                placeholder="AWS, Azure, DevOps"
                value={form.expertise}
                onChange={(e) => set("expertise", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prof-languages">Languages, comma separated</Label>
              <Input
                id="prof-languages"
                placeholder="English, Hindi"
                value={form.languages}
                onChange={(e) => set("languages", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button className="bg-brand-500 hover:bg-brand-600 text-white" onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm lg:col-span-2 h-fit">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Visibility</CardTitle>
          <p className="text-sm text-muted-foreground">
            You decide when your profile appears on the mentorship page.
          </p>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <div>
              <p className="font-medium">{isLive ? "Live" : "Offline"}</p>
              <p className="text-sm text-muted-foreground">
                {isLive
                  ? "Your profile is live on the mentorship page."
                  : "Your profile is offline. Publish it when you are ready."}
              </p>
            </div>
            <Switch
              checked={isLive}
              disabled={togglingLive}
              onCheckedChange={setLive}
              aria-label="Your profile is live on the mentorship page"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Going offline hides your profile and services from Yatris right away. Your data stays
            safe and you can come back live any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

/* ---------- Services tab ---------- */

const TYPE_LABELS: Record<string, string> = {
  call: "1 on 1 call",
  package: "Package",
  digital: "Digital product",
  webinar: "Webinar",
};

const kebabCase = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** ISO timestamp → value for a datetime local input, in local time. */
const isoToLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const localInputToIso = (value: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

interface ServiceForm {
  type: string;
  title: string;
  short_description: string;
  description: string;
  price: string;
  compare_at_price: string;
  duration_min: string;
  sessions_count: string;
  webinar_start_at: string;
  capacity: string;
  cta_label: string;
  badge: string;
  status: string;
  sort_order: string;
  questions: { label: string; required: boolean }[];
  delivery_url: string;
  meeting_link: string;
}

const EMPTY_SERVICE_FORM: ServiceForm = {
  type: "call",
  title: "",
  short_description: "",
  description: "",
  price: "0",
  compare_at_price: "",
  duration_min: "30",
  sessions_count: "1",
  webinar_start_at: "",
  capacity: "",
  cta_label: "Book Now",
  badge: "none",
  status: "draft",
  sort_order: "0",
  questions: [],
  delivery_url: "",
  meeting_link: "",
};

const serviceToForm = (s: ServiceRow): ServiceForm => ({
  type: s.type,
  title: s.title,
  short_description: s.short_description,
  description: s.description,
  price: String(s.price),
  compare_at_price: s.compare_at_price == null ? "" : String(s.compare_at_price),
  duration_min: s.duration_min == null ? "" : String(s.duration_min),
  sessions_count: String(s.sessions_count),
  webinar_start_at: isoToLocalInput(s.webinar_start_at),
  capacity: s.capacity == null ? "" : String(s.capacity),
  cta_label: s.cta_label,
  badge: s.badge ?? "none",
  status: s.status,
  sort_order: String(s.sort_order),
  questions: (s.questions ?? []).map((q) => ({ label: q.label, required: q.required })),
  delivery_url: "",
  meeting_link: "",
});

const ServicesTab = ({
  mentorId,
  services,
  loading,
  onSaved,
}: {
  mentorId: string;
  services: ServiceRow[];
  loading: boolean;
  onSaved: () => void;
}) => {
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState<ServiceForm | null>(null);
  const [hadSecrets, setHadSecrets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<ServiceRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setHadSecrets(false);
    setForm(EMPTY_SERVICE_FORM);
    setMode("create");
  };

  const openEdit = async (s: ServiceRow) => {
    setEditing(s);
    setForm(serviceToForm(s));
    setHadSecrets(false);
    setMode("edit");
    // Private delivery details live in the secrets table (owner readable per RLS).
    const { data } = await supabase
      .from("mentorship_service_secrets")
      .select("delivery_url, meeting_link")
      .eq("service_id", s.id)
      .maybeSingle();
    if (data) {
      setHadSecrets(true);
      setForm((f) =>
        f
          ? {
              ...f,
              delivery_url: data.delivery_url ?? "",
              meeting_link: data.meeting_link ?? "",
            }
          : f
      );
    }
  };

  const closeDialog = () => {
    setMode(null);
    setEditing(null);
    setForm(null);
  };

  const set = (key: keyof ServiceForm, value: string) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const addQuestion = () =>
    setForm((f) =>
      f ? { ...f, questions: [...f.questions, { label: "", required: false }] } : f
    );

  const updateQuestion = (index: number, patch: Partial<{ label: string; required: boolean }>) =>
    setForm((f) =>
      f
        ? { ...f, questions: f.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) }
        : f
    );

  const removeQuestion = (index: number) =>
    setForm((f) =>
      f ? { ...f, questions: f.questions.filter((_, i) => i !== index) } : f
    );

  /** Kebab slug from the title, unique among this mentor's services. */
  const uniqueSlug = (title: string) => {
    const base = kebabCase(title) || "service";
    const taken = new Set(services.map((s) => s.slug));
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}-${n}`)) n += 1;
    return `${base}-${n}`;
  };

  const save = async () => {
    if (!form) return;
    const price = Number(form.price);
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    if (!Number.isFinite(price) || price < 0) { toast.error("Price must be zero or more."); return; }
    const compare = form.compare_at_price.trim() === "" ? null : Number(form.compare_at_price);
    if (compare != null && (!Number.isFinite(compare) || compare <= price)) {
      toast.error("Compare at price must be greater than the price.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        short_description: form.short_description,
        description: form.description,
        price,
        compare_at_price: compare,
        duration_min:
          form.type === "digital" || form.duration_min.trim() === ""
            ? null
            : Number(form.duration_min),
        sessions_count: Math.max(1, Number(form.sessions_count) || 1),
        webinar_start_at:
          form.type === "webinar" ? localInputToIso(form.webinar_start_at) : null,
        capacity:
          form.type === "webinar" && form.capacity.trim() !== ""
            ? Math.max(1, Number(form.capacity) || 1)
            : null,
        cta_label: form.cta_label.trim() || "Book Now",
        badge: form.badge === "none" ? null : form.badge,
        questions: form.questions
          .filter((q) => q.label.trim())
          .map((q) => ({ label: q.label.trim(), required: q.required, type: "text" })),
        status: form.status,
      };

      let serviceId = editing?.id ?? null;
      if (mode === "edit" && editing) {
        const { error } = await supabase
          .from("mentorship_services")
          .update({ ...payload, sort_order: Number(form.sort_order) || 0 })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const nextOrder =
          services.length > 0 ? Math.max(...services.map((s) => s.sort_order)) + 1 : 1;
        const { data, error } = await supabase
          .from("mentorship_services")
          .insert({
            ...payload,
            mentor_id: mentorId,
            type: form.type,
            slug: uniqueSlug(form.title),
            sort_order: nextOrder,
          })
          .select("id")
          .single();
        if (error || !data) throw error ?? new Error("Could not create the service.");
        serviceId = data.id;
      }

      // Secrets: upsert when set, remove when cleared on an existing row.
      const deliveryUrl = form.delivery_url.trim();
      const meetingLink = form.meeting_link.trim();
      if (serviceId) {
        if (deliveryUrl || meetingLink) {
          const { error } = await supabase.from("mentorship_service_secrets").upsert({
            service_id: serviceId,
            delivery_url: deliveryUrl || null,
            meeting_link: meetingLink || null,
          });
          if (error) throw error;
        } else if (hadSecrets) {
          await supabase
            .from("mentorship_service_secrets")
            .delete()
            .eq("service_id", serviceId);
        }
      }

      toast.success(mode === "edit" ? "Service updated." : "Service created.");
      closeDialog();
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save the service.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase
      .from("mentorship_services")
      .delete()
      .eq("id", toDelete.id);
    setDeleting(false);
    setToDelete(null);
    if (error) {
      const fkBlocked =
        (error as { code?: string }).code === "23503" ||
        /foreign key/i.test(error.message ?? "") ||
        /violates/i.test(error.message ?? "");
      toast.error(
        fkBlocked
          ? "This service has bookings, so it cannot be deleted. Unpublish it instead and the booking records stay safe."
          : "Could not delete the service."
      );
      return;
    }
    toast.success("Service deleted.");
    onSaved();
  };

  const toggleStatus = async (s: ServiceRow) => {
    const next = s.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("mentorship_services")
      .update({ status: next })
      .eq("id", s.id);
    if (error) {
      toast.error("Could not change the status.");
      return;
    }
    toast.success(next === "published" ? "Service is live." : "Service moved to draft.");
    onSaved();
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Your services</CardTitle>
            <p className="text-sm text-muted-foreground mt-1.5">
              Create, price and publish your offerings. Draft services stay hidden from your public page.
            </p>
          </div>
          <Button className="bg-brand-500 hover:bg-brand-600 text-white" onClick={openCreate}>
            New service
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <LoadingRows />
        ) : services.length === 0 ? (
          <EmptyState text="No services yet. Create your first one and it will appear on your public page." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{s.title}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {s.short_description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {TYPE_LABELS[s.type] ?? s.type}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatINR(s.price)}</span>
                    {s.compare_at_price != null && (
                      <span className="ml-2 text-xs text-muted-foreground line-through">
                        {formatINR(s.compare_at_price)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        s.status === "published"
                          ? "bg-brand-500 text-white border-brand-500 whitespace-nowrap"
                          : "bg-muted text-muted-foreground border-border whitespace-nowrap"
                      }
                    >
                      {s.status === "published" ? "Live" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(s)}>
                        {s.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setToDelete(s)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={mode !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit service" : "Create a service"}</DialogTitle>
            <DialogDescription>
              {mode === "edit"
                ? editing?.title
                : "Set it up the way you want. You can keep it as a draft until it feels ready."}
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-5 py-2">
              {mode === "create" ? (
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Type: <span className="font-medium text-foreground">{TYPE_LABELS[form.type] ?? form.type}</span>
                </p>
              )}
              <div className="grid gap-2">
                <Label htmlFor="svc-title">Title</Label>
                <Input id="svc-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
                {mode === "create" && form.title.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Public link ends with /{uniqueSlug(form.title)}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="svc-short">Short description</Label>
                <Input
                  id="svc-short"
                  value={form.short_description}
                  onChange={(e) => set("short_description", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="svc-desc">Description</Label>
                <Textarea
                  id="svc-desc"
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="svc-price">Price in INR</Label>
                  <Input
                    id="svc-price"
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="svc-compare">Compare at price</Label>
                  <Input
                    id="svc-compare"
                    type="number"
                    min={0}
                    placeholder="Optional, must be higher"
                    value={form.compare_at_price}
                    onChange={(e) => set("compare_at_price", e.target.value)}
                  />
                </div>
              </div>
              {form.type !== "digital" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="svc-duration">Duration in minutes</Label>
                    <Input
                      id="svc-duration"
                      type="number"
                      min={0}
                      value={form.duration_min}
                      onChange={(e) => set("duration_min", e.target.value)}
                    />
                  </div>
                  {form.type === "package" && (
                    <div className="grid gap-2">
                      <Label htmlFor="svc-sessions">Sessions in the package</Label>
                      <Input
                        id="svc-sessions"
                        type="number"
                        min={1}
                        value={form.sessions_count}
                        onChange={(e) => set("sessions_count", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
              {form.type === "webinar" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="svc-webinar-start">Webinar start</Label>
                    <Input
                      id="svc-webinar-start"
                      type="datetime-local"
                      value={form.webinar_start_at}
                      onChange={(e) => set("webinar_start_at", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="svc-capacity">Capacity in seats</Label>
                    <Input
                      id="svc-capacity"
                      type="number"
                      min={1}
                      placeholder="Leave blank for unlimited"
                      value={form.capacity}
                      onChange={(e) => set("capacity", e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Badge</Label>
                  <Select value={form.badge} onValueChange={(v) => set("badge", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No badge</SelectItem>
                      <SelectItem value="Popular">Popular</SelectItem>
                      <SelectItem value="Best Seller">Best Seller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="svc-cta">Button label</Label>
                  <Input id="svc-cta" value={form.cta_label} onChange={(e) => set("cta_label", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {mode === "edit" && (
                  <div className="grid gap-2">
                    <Label htmlFor="svc-sort">Sort order</Label>
                    <Input
                      id="svc-sort"
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => set("sort_order", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium">Questions asked at checkout</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Yatris answer these while booking so you can prepare for the session.
                  </p>
                </div>
                {form.questions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No questions yet.</p>
                )}
                {form.questions.map((question, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      placeholder="What would you like to focus on?"
                      aria-label={`Question ${index + 1}`}
                      value={question.label}
                      onChange={(e) => updateQuestion(index, { label: e.target.value })}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={question.required}
                        onCheckedChange={(checked) => updateQuestion(index, { required: checked })}
                        aria-label={`Question ${index + 1} is required`}
                      />
                      <span className="hidden sm:block text-xs text-muted-foreground">Required</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeQuestion(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
                <div>
                  <Button variant="outline" size="sm" onClick={addQuestion}>
                    Add question
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium">Private delivery</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only buyers with a confirmed booking can see these.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {form.type === "digital" && (
                    <div className="grid gap-2">
                      <Label htmlFor="svc-delivery">Delivery URL</Label>
                      <Input
                        id="svc-delivery"
                        placeholder="https://…"
                        value={form.delivery_url}
                        onChange={(e) => set("delivery_url", e.target.value)}
                      />
                    </div>
                  )}
                  {form.type !== "digital" && (
                    <div className="grid gap-2">
                      <Label htmlFor="svc-meeting">Default meeting link</Label>
                      <Input
                        id="svc-meeting"
                        placeholder="https://meet.google.com/…"
                        value={form.meeting_link}
                        onChange={(e) => set("meeting_link", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button className="bg-brand-500 hover:bg-brand-600 text-white" onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "edit" ? "Save changes" : "Create service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.title ?? "this service"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the service from your public page for good. Existing bookings keep
              their records, and if the service already has bookings the delete will be blocked, so
              unpublishing is often the safer choice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

/* ---------- Availability tab ---------- */

const AvailabilityTab = ({
  mentor,
  rules,
  overrides,
  loading,
  onChanged,
  onMentorSaved,
}: {
  mentor: MentorRow;
  rules: AvailabilityRow[];
  overrides: DateOverrideRow[];
  loading: boolean;
  onChanged: () => void;
  onMentorSaved: () => void;
}) => {
  const [weekday, setWeekday] = useState("1");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("21:00");
  const [adding, setAdding] = useState(false);

  const [notice, setNotice] = useState(String(mentor.notice_hours));
  const [windowDays, setWindowDays] = useState(String(mentor.booking_window_days));
  const [buffer, setBuffer] = useState(String(mentor.buffer_min));
  const [savingSettings, setSavingSettings] = useState(false);

  // Date specific override form.
  const [ovDate, setOvDate] = useState("");
  const [ovKind, setOvKind] = useState<"blocked" | "open">("blocked");
  const [ovWholeDay, setOvWholeDay] = useState(true);
  const [ovStart, setOvStart] = useState("18:00");
  const [ovEnd, setOvEnd] = useState("21:00");
  const [ovNote, setOvNote] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);

  // Open overrides always need a window; only a full day block omits times.
  const needsWindow = ovKind === "open" || !ovWholeDay;

  useEffect(() => {
    setNotice(String(mentor.notice_hours));
    setWindowDays(String(mentor.booking_window_days));
    setBuffer(String(mentor.buffer_min));
  }, [mentor]);

  const todayKey = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD (local)
  const upcomingOverrides = overrides
    .filter((o) => (o.date ?? "").slice(0, 10) >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date));

  const describeOverride = (o: DateOverrideRow): string => {
    if (o.kind === "open") {
      return o.start_time && o.end_time
        ? `Open ${hhmm(o.start_time)} to ${hhmm(o.end_time)}`
        : "Open";
    }
    return o.start_time && o.end_time
      ? `Blocked ${hhmm(o.start_time)} to ${hhmm(o.end_time)}`
      : "Blocked all day";
  };

  const formatOverrideDate = (date: string): string => {
    const d = new Date(`${date.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const addOverride = async () => {
    if (!ovDate) {
      toast.error("Please pick a date.");
      return;
    }
    if (needsWindow && ovEnd <= ovStart) {
      toast.error("End time must be after the start time.");
      return;
    }
    setSavingOverride(true);
    const { error } = await addDateOverride(mentor.id, {
      date: ovDate,
      kind: ovKind,
      start_time: needsWindow ? ovStart : null,
      end_time: needsWindow ? ovEnd : null,
      note: ovNote.trim() || null,
    });
    setSavingOverride(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Date override saved.");
    setOvDate("");
    setOvNote("");
    onChanged();
  };

  const removeOverride = async (o: DateOverrideRow) => {
    const { error } = await deleteDateOverride(o.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Date override removed.");
    onChanged();
  };

  const addRule = async () => {
    if (endTime <= startTime) {
      toast.error("End time must be after the start time.");
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from("mentor_availability").insert({
        mentor_id: mentor.id,
        weekday: Number(weekday),
        start_time: startTime,
        end_time: endTime,
      });
      if (error) throw error;
      toast.success("Availability added.");
      onChanged();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not add the rule.");
    } finally {
      setAdding(false);
    }
  };

  const toggleRule = async (rule: AvailabilityRow) => {
    const { error } = await supabase
      .from("mentor_availability")
      .update({ active: !rule.active })
      .eq("id", rule.id);
    if (error) { toast.error("Could not update the rule."); return; }
    onChanged();
  };

  const removeRule = async (rule: AvailabilityRow) => {
    const { error } = await supabase.from("mentor_availability").delete().eq("id", rule.id);
    if (error) { toast.error("Could not remove the rule."); return; }
    toast.success("Availability removed.");
    onChanged();
  };

  const saveSettings = async () => {
    const n = Number(notice), w = Number(windowDays), b = Number(buffer);
    if (![n, w, b].every((v) => Number.isFinite(v) && v >= 0)) {
      toast.error("Settings must be zero or more.");
      return;
    }
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from("mentors")
        .update({ notice_hours: n, booking_window_days: w, buffer_min: b })
        .eq("id", mentor.id);
      if (error) throw error;
      toast.success("Scheduling settings saved.");
      onMentorSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save the settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="border border-border shadow-sm lg:col-span-3">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Weekly hours</CardTitle>
          <p className="text-sm text-muted-foreground">
            Times are in your timezone, {mentor.timezone}. Learners see slots in their own timezone.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <LoadingRows />
          ) : rules.length === 0 ? (
            <EmptyState text="No weekly hours yet. Add your first window below." />
          ) : (
            <div className="flex flex-col gap-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-24 font-medium">{WEEKDAYS[rule.weekday]}</span>
                    <span className="text-muted-foreground">
                      {hhmm(rule.start_time)} to {hhmm(rule.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={rule.active} onCheckedChange={() => toggleRule(rule)} />
                    <Button variant="ghost" size="sm" onClick={() => removeRule(rule)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator className="my-6" />

          <div className="grid gap-4 sm:grid-cols-4 items-end">
            <div className="grid gap-2">
              <Label>Day</Label>
              <Select value={weekday} onValueChange={setWeekday}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((name, i) => (
                    <SelectItem key={name} value={String(i)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rule-start">Start</Label>
              <Input id="rule-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rule-end">End</Label>
              <Input id="rule-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <Button
              className="bg-brand-500 hover:bg-brand-600 text-white"
              onClick={addRule}
              disabled={adding}
            >
              {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add hours
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm lg:col-span-2 h-fit">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Scheduling settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Control how far ahead learners can book and the space between calls.
          </p>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="set-notice">Minimum notice in hours</Label>
            <Input id="set-notice" type="number" min={0} value={notice} onChange={(e) => setNotice(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="set-window">Booking window in days</Label>
            <Input
              id="set-window"
              type="number"
              min={1}
              value={windowDays}
              onChange={(e) => setWindowDays(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="set-buffer">Buffer between calls in minutes</Label>
            <Input id="set-buffer" type="number" min={0} value={buffer} onChange={(e) => setBuffer(e.target.value)} />
          </div>
          <Button
            className="bg-brand-500 hover:bg-brand-600 text-white mt-2"
            onClick={saveSettings}
            disabled={savingSettings}
          >
            {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save settings
          </Button>
        </CardContent>
      </Card>
    </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Date specific</CardTitle>
          <p className="text-sm text-muted-foreground">
            Bend a single day without touching your weekly hours. Block a day off,
            block a window, or open an extra window. Times are in {mentor.timezone}.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <LoadingRows />
          ) : upcomingOverrides.length === 0 ? (
            <EmptyState text="No date overrides yet. Add one below to block or open a specific day." />
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingOverrides.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatOverrideDate(o.date)}</span>
                      <Badge
                        variant="outline"
                        className={
                          o.kind === "open"
                            ? "bg-brand-50 text-brand-700 border-brand-100"
                            : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {describeOverride(o)}
                      </Badge>
                    </div>
                    {o.note ? (
                      <span className="text-sm text-muted-foreground">{o.note}</span>
                    ) : null}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeOverride(o)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator className="my-6" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="ov-date">Date</Label>
              <Input
                id="ov-date"
                type="date"
                value={ovDate}
                min={todayKey}
                onChange={(e) => setOvDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={ovKind}
                onValueChange={(v) => setOvKind(v as "blocked" | "open")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocked">Block</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {ovKind === "blocked" ? (
              <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
                <Switch
                  id="ov-wholeday"
                  checked={ovWholeDay}
                  onCheckedChange={setOvWholeDay}
                />
                <Label htmlFor="ov-wholeday" className="cursor-pointer">
                  Whole day
                </Label>
              </div>
            ) : (
              <div className="hidden lg:block" />
            )}
            <Button
              className="bg-brand-500 hover:bg-brand-600 text-white"
              onClick={addOverride}
              disabled={savingOverride}
            >
              {savingOverride && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add override
            </Button>

            {needsWindow ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="ov-start">Start</Label>
                  <Input
                    id="ov-start"
                    type="time"
                    value={ovStart}
                    onChange={(e) => setOvStart(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ov-end">End</Label>
                  <Input
                    id="ov-end"
                    type="time"
                    value={ovEnd}
                    onChange={(e) => setOvEnd(e.target.value)}
                  />
                </div>
              </>
            ) : null}

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="ov-note">Note</Label>
              <Input
                id="ov-note"
                value={ovNote}
                placeholder="Optional, only you see this"
                onChange={(e) => setOvNote(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ---------- Bookings tab ---------- */

const BookingsTab = ({
  bookings,
  services,
  loading,
  timezone,
  mentorName,
  onChanged,
}: {
  bookings: BookingRow[];
  services: ServiceRow[];
  loading: boolean;
  timezone: string;
  mentorName: string;
  onChanged: () => void;
}) => {
  const [view, setView] = useState<"list" | "calendar">("list");

  const serviceTitle = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((s) => map.set(s.id, s.title));
    return (id: string) => map.get(id) ?? "Service";
  }, [services]);

  const now = Date.now();
  const upcoming = bookings
    .filter(
      (b) =>
        (b.status === "pending" || b.status === "confirmed") &&
        (b.slot_start == null || new Date(b.slot_start).getTime() >= now)
    )
    .sort((a, b) => (a.slot_start ?? "9999").localeCompare(b.slot_start ?? "9999"));
  const past = bookings.filter((b) => !upcoming.includes(b));

  // The calendar needs a service title on each booking to label sessions.
  const calendarBookings = upcoming
    .filter((b) => b.slot_start)
    .map((b) => ({
      id: b.id,
      slot_start: b.slot_start,
      status: b.status,
      customer_name: b.customer_name,
      amount: b.amount,
      service: { title: serviceTitle(b.service_id) },
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2" role="tablist" aria-label="Choose how to view your bookings">
        {(["list", "calendar"] as const).map((option) => (
          <Button
            key={option}
            variant={view === option ? "default" : "outline"}
            size="sm"
            className={view === option ? "bg-brand-500 hover:bg-brand-600 text-white" : ""}
            onClick={() => setView(option)}
          >
            {option === "list" ? "List" : "Calendar"}
          </Button>
        ))}
      </div>

      {view === "calendar" ? (
        <BookingCalendar bookings={calendarBookings} timezone={timezone} />
      ) : (
      <>
      <BookingsCard
        title="Upcoming"
        subtitle="Confirmed and pending sessions. Add the meeting link before the call."
        bookings={upcoming}
        loading={loading}
        serviceTitle={serviceTitle}
        mentorName={mentorName}
        emptyText="No upcoming bookings. Share your public profile to get booked."
        onChanged={onChanged}
        editable
      />
      <BookingsCard
        title="Past and closed"
        subtitle="Completed, cancelled and older bookings."
        bookings={past}
        loading={loading}
        serviceTitle={serviceTitle}
        mentorName={mentorName}
        emptyText="Nothing here yet."
        onChanged={onChanged}
        editable={false}
      />
      </>
      )}
    </div>
  );
};

const BookingsCard = ({
  title,
  subtitle,
  bookings,
  loading,
  serviceTitle,
  mentorName,
  emptyText,
  onChanged,
  editable,
}: {
  title: string;
  subtitle: string;
  bookings: BookingRow[];
  loading: boolean;
  serviceTitle: (id: string) => string;
  mentorName: string;
  emptyText: string;
  onChanged: () => void;
  editable: boolean;
}) => {
  const [linkEdit, setLinkEdit] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingRow | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const { ok, refunded, message } = await cancelBooking(cancelTarget.id);
    setCancelling(false);
    setCancelTarget(null);
    if (!ok) {
      toast.error(message);
      return;
    }
    toast.success(
      refunded ? "Session cancelled and refund started." : "Session cancelled."
    );
    onChanged();
  };

  const saveLink = async (b: BookingRow) => {
    const link = (linkEdit[b.id] ?? b.meeting_link ?? "").trim();
    setBusyId(b.id);
    try {
      const { error } = await supabase
        .from("mentorship_bookings")
        .update({ meeting_link: link || null })
        .eq("id", b.id);
      if (error) throw error;
      toast.success("Meeting link saved.");
      onChanged();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save the link.");
    } finally {
      setBusyId(null);
    }
  };

  const markCompleted = async (b: BookingRow) => {
    setBusyId(b.id);
    try {
      const { error } = await supabase
        .from("mentorship_bookings")
        .update({ status: "completed" })
        .eq("id", b.id);
      if (error) throw error;
      toast.success("Marked as completed.");
      onChanged();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not update the booking.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <LoadingRows />
        ) : bookings.length === 0 ? (
          <EmptyState text={emptyText} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Learner</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                {editable && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => {
                // Calendar actions for confirmed sessions that have a slot.
                const calReady =
                  b.status === "confirmed" &&
                  Boolean(b.slot_start) &&
                  Boolean(b.slot_end);
                const calTitle = `${serviceTitle(b.service_id)} with ${
                  b.customer_name || "Yatri"
                }`;
                const calLocation = b.meeting_link || "Online";
                const calDetails = `Mentorship session by ${mentorName}.${
                  b.meeting_link ? ` Meeting link: ${b.meeting_link}` : ""
                }`;
                const googleUrl = calReady
                  ? googleCalendarUrl({
                      title: calTitle,
                      startISO: b.slot_start as string,
                      endISO: b.slot_end as string,
                      details: calDetails,
                      location: calLocation,
                    })
                  : null;
                const icsUri = calReady
                  ? icsDataUri(
                      buildIcs({
                        uid: `booking-${b.id}@yatricloud.com`,
                        title: calTitle,
                        startISO: b.slot_start as string,
                        endISO: b.slot_end as string,
                        description: calDetails,
                        location: calLocation,
                      })
                    )
                  : null;
                return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{b.customer_name || "Yatri"}</span>
                      <span className="text-xs text-muted-foreground font-normal">{b.customer_email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{serviceTitle(b.service_id)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatSlot(b.slot_start)}
                  </TableCell>
                  <TableCell className="font-medium">{formatINR(b.amount)}</TableCell>
                  <TableCell>
                    <Badge className={`${bookingBadgeClass[b.status]} capitalize whitespace-nowrap`}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  {editable && (
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2 min-w-[320px]">
                        <Input
                          className="h-8 max-w-[200px]"
                          placeholder="Meeting link"
                          value={linkEdit[b.id] ?? b.meeting_link ?? ""}
                          onChange={(e) =>
                            setLinkEdit((m) => ({ ...m, [b.id]: e.target.value }))
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === b.id}
                          onClick={() => saveLink(b)}
                        >
                          Save
                        </Button>
                        {b.status === "confirmed" && (
                          <Button
                            size="sm"
                            className="bg-brand-500 hover:bg-brand-600 text-white"
                            disabled={busyId === b.id}
                            onClick={() => markCompleted(b)}
                          >
                            Complete
                          </Button>
                        )}
                        {(b.status === "confirmed" || b.status === "pending") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            disabled={busyId === b.id}
                            onClick={() => setCancelTarget(b)}
                          >
                            Cancel
                          </Button>
                        )}
                        {googleUrl && (
                          <a
                            href={googleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-md border border-border text-sm font-medium hover:border-brand-200 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Add to calendar
                          </a>
                        )}
                        {icsUri && (
                          <a
                            href={icsUri}
                            download="yatri-cloud-session.ics"
                            className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-md border border-border text-sm font-medium hover:border-brand-200 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Download .ics
                          </a>
                        )}
                        {calReady && b.meeting_link && (
                          <a
                            href={b.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Join
                          </a>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

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
              This frees the slot and tells the Yatri. If the session was paid, a
              full refund starts automatically and reaches them in a few working
              days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep the session</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cancel session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

/* ---------- Earnings tab ---------- */

const EarningStat = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-xl border border-border bg-background px-5 py-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const EarningsTab = ({
  earnings,
  loading,
}: {
  earnings: MentorEarnings | null;
  loading: boolean;
}) => {
  if (loading && !earnings) {
    return (
      <Card className="border border-border shadow-sm">
        <LoadingRows />
      </Card>
    );
  }

  const e = earnings;
  const maxMonth = e ? Math.max(1, ...e.revenueByMonth.map((m) => m.revenue)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Your earnings</CardTitle>
          <p className="text-sm text-muted-foreground">
            A live look at the money your sessions have brought in on Yatri Cloud.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <EarningStat
              label="Gross revenue"
              value={formatINR(e?.grossRevenue ?? 0)}
              hint="Confirmed and completed bookings"
            />
            <EarningStat
              label="Your payout"
              value={formatINR(e?.payout ?? 0)}
              hint="Payouts settle to your linked account once the platform enables Route."
            />
            <EarningStat
              label="Sessions completed"
              value={String(e?.completed ?? 0)}
            />
            <EarningStat label="Upcoming" value={String(e?.upcoming ?? 0)} />
            <EarningStat
              label="Average rating"
              value={
                e && e.reviewCount > 0 ? `${e.avgRating.toFixed(1)} / 5` : "No ratings yet"
              }
              hint={
                e && e.reviewCount > 0
                  ? `${e.reviewCount} review${e.reviewCount === 1 ? "" : "s"}`
                  : undefined
              }
            />
            <EarningStat
              label="Total bookings"
              value={String(e?.totalBookings ?? 0)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Revenue by month</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gross revenue from your paid bookings over the last six months.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            {(e?.revenueByMonth ?? []).map((m) => (
              <div key={m.key} className="flex items-center gap-4">
                <span className="w-20 shrink-0 text-sm text-muted-foreground">{m.label}</span>
                <div className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.round((m.revenue / maxMonth) * 100)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-sm font-medium">
                  {formatINR(m.revenue)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Recent paid bookings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your latest confirmed and completed sessions, with your share of each.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {!e || e.recentPaid.length === 0 ? (
            <EmptyState text="No paid bookings yet. Share your public profile to get booked." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Booked</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Your payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {e.recentPaid.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatSlot(b.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatSlot(b.slot_start)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${bookingBadgeClass[b.status]} capitalize whitespace-nowrap`}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatINR(b.amount)}</TableCell>
                    <TableCell className="text-right font-medium">{formatINR(b.payout)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Payouts settle to your linked account once the platform enables Route. Until then these
        figures show the full booking value as your payout.
      </p>
    </div>
  );
};

/* ---------- shared bits ---------- */

const LoadingRows = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
    <p className="text-sm text-muted-foreground">Loading</p>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <p className="text-muted-foreground">{text}</p>
  </div>
);

export default MentorDashboard;
