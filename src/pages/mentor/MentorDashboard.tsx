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

import type {
  AvailabilityRule,
  Mentor,
  MentorshipBooking,
  MentorshipService,
} from "@/lib/mentorship";

/* ---------- row aliases (canonical types from @/lib/mentorship) ---------- */

type MentorRow = Mentor;
type ServiceRow = MentorshipService;
type AvailabilityRow = AvailabilityRule;
type BookingRow = MentorshipBooking;

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

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
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
      const [svc, avail, book] = await Promise.all([
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
          .from("mentorship_bookings")
          .select("*")
          .eq("mentor_id", mentorId)
          .order("created_at", { ascending: false }),
      ]);
      if (svc.error) throw svc.error;
      if (avail.error) throw avail.error;
      if (book.error) throw book.error;
      setServices((svc.data as ServiceRow[]) ?? []);
      setAvailability((avail.data as AvailabilityRow[]) ?? []);
      setBookings((book.data as BookingRow[]) ?? []);
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
    return (
      <Shell>
        <GateCard
          heading="You are not a mentor yet"
          body="This account is signed in but it is not linked to a mentor profile. If you already mentor with Yatri Cloud, ask the team to link your login. If you would like to become a mentor, we would love to hear from you."
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="bg-brand-500 hover:bg-brand-600 text-white">
              <a href="mailto:info@yatricloud.com?subject=Mentor%20access%20request">Contact the team</a>
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

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-6">
            <ServicesTab
              services={services}
              loading={loadingData}
              onSaved={() => loadData(mentor.id)}
            />
          </TabsContent>

          <TabsContent value="availability" className="mt-6">
            <AvailabilityTab
              mentor={mentor}
              rules={availability}
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
              onChanged={() => loadData(mentor.id)}
            />
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

/* ---------- Services tab ---------- */

interface ServiceForm {
  title: string;
  short_description: string;
  description: string;
  price: string;
  compare_at_price: string;
  duration_min: string;
  sessions_count: string;
  cta_label: string;
  badge: string;
  status: string;
  sort_order: string;
}

const serviceToForm = (s: ServiceRow): ServiceForm => ({
  title: s.title,
  short_description: s.short_description,
  description: s.description,
  price: String(s.price),
  compare_at_price: s.compare_at_price == null ? "" : String(s.compare_at_price),
  duration_min: s.duration_min == null ? "" : String(s.duration_min),
  sessions_count: String(s.sessions_count),
  cta_label: s.cta_label,
  badge: s.badge ?? "none",
  status: s.status,
  sort_order: String(s.sort_order),
});

const ServicesTab = ({
  services,
  loading,
  onSaved,
}: {
  services: ServiceRow[];
  loading: boolean;
  onSaved: () => void;
}) => {
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState<ServiceForm | null>(null);
  const [saving, setSaving] = useState(false);

  const openEdit = (s: ServiceRow) => {
    setEditing(s);
    setForm(serviceToForm(s));
  };

  const set = (key: keyof ServiceForm, value: string) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async () => {
    if (!editing || !form) return;
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
      const { error } = await supabase
        .from("mentorship_services")
        .update({
          title: form.title.trim(),
          short_description: form.short_description,
          description: form.description,
          price,
          compare_at_price: compare,
          duration_min: form.duration_min.trim() === "" ? null : Number(form.duration_min),
          sessions_count: Math.max(1, Number(form.sessions_count) || 1),
          cta_label: form.cta_label.trim() || "Book Now",
          badge: form.badge === "none" ? null : form.badge,
          status: form.status,
          sort_order: Number(form.sort_order) || 0,
        })
        .eq("id", editing.id);
      if (error) throw error;
      toast.success("Service updated.");
      setEditing(null);
      setForm(null);
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save the service.");
    } finally {
      setSaving(false);
    }
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
        <CardTitle className="text-lg">Your services</CardTitle>
        <p className="text-sm text-muted-foreground">
          Edit pricing and copy. Draft services stay hidden from your public page.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <LoadingRows />
        ) : services.length === 0 ? (
          <EmptyState text="No services yet. The Yatri Cloud team can add your first service." />
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
                  <TableCell className="capitalize text-muted-foreground">{s.type}</TableCell>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) { setEditing(null); setForm(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit service</DialogTitle>
            <DialogDescription>{editing?.title}</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-5 py-2">
              <div className="grid gap-2">
                <Label htmlFor="svc-title">Title</Label>
                <Input id="svc-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
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
                    placeholder="Optional"
                    value={form.compare_at_price}
                    onChange={(e) => set("compare_at_price", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="svc-duration">Duration in minutes</Label>
                  <Input
                    id="svc-duration"
                    type="number"
                    min={0}
                    placeholder="Leave blank for digital"
                    value={form.duration_min}
                    onChange={(e) => set("duration_min", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="svc-sessions">Sessions</Label>
                  <Input
                    id="svc-sessions"
                    type="number"
                    min={1}
                    value={form.sessions_count}
                    onChange={(e) => set("sessions_count", e.target.value)}
                  />
                </div>
              </div>
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
                <div className="grid gap-2">
                  <Label htmlFor="svc-sort">Sort order</Label>
                  <Input
                    id="svc-sort"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => set("sort_order", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditing(null); setForm(null); }}>
              Cancel
            </Button>
            <Button className="bg-brand-500 hover:bg-brand-600 text-white" onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

/* ---------- Availability tab ---------- */

const AvailabilityTab = ({
  mentor,
  rules,
  loading,
  onChanged,
  onMentorSaved,
}: {
  mentor: MentorRow;
  rules: AvailabilityRow[];
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

  useEffect(() => {
    setNotice(String(mentor.notice_hours));
    setWindowDays(String(mentor.booking_window_days));
    setBuffer(String(mentor.buffer_min));
  }, [mentor]);

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
  );
};

/* ---------- Bookings tab ---------- */

const BookingsTab = ({
  bookings,
  services,
  loading,
  onChanged,
}: {
  bookings: BookingRow[];
  services: ServiceRow[];
  loading: boolean;
  onChanged: () => void;
}) => {
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

  return (
    <div className="flex flex-col gap-6">
      <BookingsCard
        title="Upcoming"
        subtitle="Confirmed and pending sessions. Add the meeting link before the call."
        bookings={upcoming}
        loading={loading}
        serviceTitle={serviceTitle}
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
        emptyText="Nothing here yet."
        onChanged={onChanged}
        editable={false}
      />
    </div>
  );
};

const BookingsCard = ({
  title,
  subtitle,
  bookings,
  loading,
  serviceTitle,
  emptyText,
  onChanged,
  editable,
}: {
  title: string;
  subtitle: string;
  bookings: BookingRow[];
  loading: boolean;
  serviceTitle: (id: string) => string;
  emptyText: string;
  onChanged: () => void;
  editable: boolean;
}) => {
  const [linkEdit, setLinkEdit] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

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
              {bookings.map((b) => (
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
                      <div className="flex items-center justify-end gap-2 min-w-[320px]">
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
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
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
