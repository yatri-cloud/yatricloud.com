import { useState, useEffect, useRef } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { COLORS, BASE_TEMPLATE, getEnrollmentEmail, getRegistrationEmail, getProductPurchaseEmail, getCertificateSubmissionEmail, getWelcomeEmail, getEventFeedbackEmail, getExamDumpPurchaseEmail, getSubscriberWelcomeEmail } from "@/lib/email-templates";
import {
  Mail, Save, Send, Eye, EyeOff, RotateCcw, Loader2,
  ChevronRight, Palette, Code2, BookOpen, Users, ShoppingBag,
  Award, Calendar, MessageSquare, FileText, CheckCircle2, XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// ─── Template Registry ──────────────────────────────────────────────────────

interface TemplateDefinition {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  variables: { name: string; example: string }[];
  defaultHtmlFn: () => string;
}

const TEMPLATE_DEFS: TemplateDefinition[] = [
  {
    key: "welcome",
    name: "Platform Welcome",
    description: "Sent when a new user creates an account.",
    icon: Users,
    iconColor: "bg-blue-500",
    variables: [{ name: "name", example: "Yatharth" }],
    defaultHtmlFn: () => getWelcomeEmail("Yatharth"),
  },
  {
    key: "newsletter_welcome",
    name: "Newsletter Welcome",
    description: "Sent after a user subscribes to the newsletter.",
    icon: Mail,
    iconColor: "bg-primary",
    variables: [
      { name: "name", example: "Yatharth" },
      { name: "email", example: "yatharth@example.com" },
    ],
    defaultHtmlFn: () => getSubscriberWelcomeEmail("Yatharth", "yatharth@example.com"),
  },
  {
    key: "enrollment_confirmed",
    name: "Enrollment Confirmed",
    description: "Sent when a user enrolls in a training course.",
    icon: BookOpen,
    iconColor: "bg-violet-500",
    variables: [
      { name: "name", example: "Yatharth" },
      { name: "course_name", example: "AWS Solutions Architect" },
      { name: "calendar_url", example: "https://calendly.com/..." },
    ],
    defaultHtmlFn: () => getEnrollmentEmail("Yatharth", "AWS Solutions Architect", "https://calendly.com/test"),
  },
  {
    key: "registration_confirmed",
    name: "Event Registration",
    description: "Sent when a user registers for an event.",
    icon: Calendar,
    iconColor: "bg-orange-500",
    variables: [
      { name: "name", example: "Yatharth" },
      { name: "event_name", example: "AWS Community Day" },
      { name: "code", example: "YC-12345" },
      { name: "date", example: "Aug 25, 2025" },
      { name: "meet_link", example: "https://meet.google.com/..." },
    ],
    defaultHtmlFn: () => getRegistrationEmail("Yatharth", "AWS Community Day", "YC-12345", "Aug 25, 2025", "https://meet.google.com/test"),
  },
  {
    key: "product_purchase",
    name: "Order Confirmation",
    description: "Sent after a successful store purchase.",
    icon: ShoppingBag,
    iconColor: "bg-emerald-500",
    variables: [
      { name: "name", example: "Yatharth" },
      { name: "product_names", example: "AWS Exam Voucher" },
      { name: "amount", example: "₹4,999" },
      { name: "payment_id", example: "pay_XXXXXXXX" },
    ],
    defaultHtmlFn: () => getProductPurchaseEmail("Yatharth", "AWS Exam Voucher", "₹4,999", "pay_XXXXXXXX"),
  },
  {
    key: "exam_dump_purchase",
    name: "Exam Dump Access",
    description: "Sent after purchasing an exam dump, includes download link.",
    icon: FileText,
    iconColor: "bg-yellow-500",
    variables: [
      { name: "name", example: "Yatharth" },
      { name: "dump_title", example: "AWS SAA-C03 Dumps" },
      { name: "amount", example: "₹999" },
      { name: "download_url", example: "https://..." },
      { name: "payment_id", example: "pay_XXXXXXXX" },
    ],
    defaultHtmlFn: () => getExamDumpPurchaseEmail("Yatharth", "AWS SAA-C03 Dumps", "₹999", "https://example.com/download", "pay_XXXXXXXX"),
  },
  {
    key: "certificate_submission",
    name: "Certificate Submitted",
    description: "Sent when a user uploads a new certification.",
    icon: Award,
    iconColor: "bg-pink-500",
    variables: [
      { name: "name", example: "Yatharth" },
      { name: "cert_name", example: "AWS Certified Solutions Architect" },
      { name: "provider", example: "Amazon Web Services" },
    ],
    defaultHtmlFn: () => getCertificateSubmissionEmail("Yatharth", "AWS Certified Solutions Architect", "Amazon Web Services"),
  },
  {
    key: "event_feedback",
    name: "Event Feedback Request",
    description: "Sent after an event, asking for feedback to receive a certificate.",
    icon: MessageSquare,
    iconColor: "bg-cyan-500",
    variables: [
      { name: "name", example: "Yatharth" },
      { name: "event_name", example: "AWS Community Day" },
      { name: "feedback_link", example: "https://forms.gle/..." },
    ],
    defaultHtmlFn: () => getEventFeedbackEmail("Yatharth", "AWS Community Day", "https://forms.gle/test"),
  },
];

// ─── Color Editor ────────────────────────────────────────────────────────────

interface ColorSet {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
}

const DEFAULT_COLORS: ColorSet = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  background: COLORS.background,
  card: COLORS.card,
  text: COLORS.text,
  textMuted: COLORS.textMuted,
};


// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminEmailTemplates() {
  const { toast } = useToast();
  const [selectedDef, setSelectedDef] = useState<TemplateDefinition | null>(null);
  const [editHtml, setEditHtml] = useState("");
  const [colors, setColors] = useState<ColorSet>(DEFAULT_COLORS);
  const [activeTab, setActiveTab] = useState<"html" | "colors">("html");
  const [previewVisible, setPreviewVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [dbTemplates, setDbTemplates] = useState<Record<string, { subject: string; body_html: string; design_json?: any }>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Stores the original unmodified HTML (default or saved) so color changes
  // are always applied from a clean base — not stacked on top of each other.
  const baseHtmlRef = useRef<string>("");

  // Load all templates from DB on mount
  useEffect(() => {
    const load = async () => {
      setLoadingTemplates(true);
      const { data } = await (supabase as any).from("email_templates").select("key,subject,body_html,design_json");
      if (data) {
        const map: Record<string, { subject: string; body_html: string; design_json?: any }> = {};
        data.forEach((r: any) => { map[r.key] = { subject: r.subject, body_html: r.body_html, design_json: r.design_json }; });
        setDbTemplates(map);
      }
      setLoadingTemplates(false);
    };
    load();
  }, []);

  // When a template is selected, populate editor from DB or default
  const openTemplate = (def: TemplateDefinition) => {
    setSelectedDef(def);
    const saved = dbTemplates[def.key];
    // Always store the default HTML as the base (before any colour substitution)
    const defaultHtml = def.defaultHtmlFn();
    baseHtmlRef.current = defaultHtml;
    // If a custom version is saved, show it in the editor but keep the default
    // as the base so the colour-picker always works from a known starting point.
    setEditHtml(saved?.body_html ?? defaultHtml);
    setColors(DEFAULT_COLORS);
    setActiveTab("html");
  };

  // Re-render preview when html or colors change
  const buildPreviewHtml = (rawHtml: string, c: ColorSet): string => {
    // Always apply colours on top of the original DEFAULT html, not the
    // already-substituted version — this way changes are never stacked.
    const base = baseHtmlRef.current || rawHtml;
    return base
      .replace(new RegExp(escapeRegex(COLORS.primary), "g"), c.primary)
      .replace(new RegExp(escapeRegex(COLORS.secondary), "g"), c.secondary)
      .replace(new RegExp(escapeRegex(COLORS.background), "g"), c.background)
      .replace(new RegExp(escapeRegex(COLORS.card), "g"), c.card)
      .replace(new RegExp(escapeRegex(COLORS.text), "g"), c.text)
      .replace(new RegExp(escapeRegex(COLORS.textMuted), "g"), c.textMuted);
  };

  function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const previewHtml = selectedDef ? buildPreviewHtml(editHtml, colors) : "";

  // Update iframe content
  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(previewHtml);
      doc.close();
    }
  }, [previewHtml]);

  const handleSave = async () => {
    if (!selectedDef) return;
    setSaving(true);
    try {
      const finalHtml = buildPreviewHtml(editHtml, colors);
      const existing = dbTemplates[selectedDef.key];
      if (existing) {
        await (supabase as any)
          .from("email_templates")
          .update({ body_html: finalHtml, updated_at: new Date().toISOString() })
          .eq("key", selectedDef.key);
      } else {
        await (supabase as any)
          .from("email_templates")
          .insert({ key: selectedDef.key, subject: selectedDef.name, body_html: finalHtml });
      }

      setDbTemplates(prev => ({ ...prev, [selectedDef.key]: { subject: selectedDef.name, body_html: finalHtml } }));
      toast({ title: "Saved", description: `${selectedDef.name} template saved.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!selectedDef) return;
    setEditHtml(selectedDef.defaultHtmlFn());
    setColors(DEFAULT_COLORS);
    toast({ title: "Reset", description: "Template reset to default." });
  };

  const handleSendTest = async () => {
    if (!selectedDef || !testEmail.trim()) return;
    setSendingTest(true);
    const finalHtml = buildPreviewHtml(editHtml, colors);
    const result = await sendEmail({
      to: testEmail.trim(),
      subject: `[TEST] ${selectedDef.name}`,
      html: finalHtml,
      templateKey: selectedDef.key,
      metadata: { source: "admin_email_templates_test" },
    });
    setSendingTest(false);
    if (result.success) {
      toast({ title: "Test Sent!", description: `Email sent to ${testEmail}.` });
    } else {
      toast({ title: "Send Failed", description: result.error, variant: "destructive" });
    }
  };

  const colorFields: { key: keyof ColorSet; label: string }[] = [
    { key: "primary", label: "Primary (buttons, links)" },
    { key: "secondary", label: "Secondary (header background)" },
    { key: "background", label: "Page Background" },
    { key: "card", label: "Card Background" },
    { key: "text", label: "Body Text" },
    { key: "textMuted", label: "Muted Text" },
  ];

  return (
    <div className="px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.05] via-transparent to-card p-6 md:p-8">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 to-brand-400 opacity-80" />
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">Email Templates</h1>
              <p className="text-muted-foreground mt-2 text-sm max-w-2xl">Edit, preview, and test all system email templates. Changes take effect immediately.</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Template Grid */}
        {!selectedDef ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATE_DEFS.map(def => {
              const hasCustom = Boolean(dbTemplates[def.key]);
              return (
                <button
                  key={def.key}
                  onClick={() => openTemplate(def)}
                  className={`group relative text-left bg-card border rounded-2xl p-6 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex flex-col min-h-[140px] ${
                    hasCustom ? "border-emerald-200/60 hover:border-emerald-400/60 dark:border-emerald-900/40 dark:hover:border-emerald-700/60" : "border-border hover:border-primary/40 hover:shadow-md"
                  }`}
                >
                  {/* Subtle top indicator for customized templates */}
                  {hasCustom && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-t-2xl opacity-80" />
                  )}
                  
                  <div className="flex items-center justify-between mb-2 mt-1">
                    <h3 className={`font-semibold text-base transition-colors ${hasCustom ? "text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-300" : "text-foreground group-hover:text-primary"}`}>
                      {def.name}
                    </h3>
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6 flex-1">{def.description}</p>
                  
                  <div className={`mt-auto flex items-center justify-between text-xs font-medium transition-colors ${
                    hasCustom ? "text-emerald-600/80 group-hover:text-emerald-700 dark:text-emerald-500/80 dark:group-hover:text-emerald-400" : "text-muted-foreground/70 group-hover:text-primary"
                  }`}>
                    <span>Edit template</span>
                    <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* ── Editor ── */
          <div className="space-y-4">
            {/* Editor header */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelectedDef(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                ← All Templates
              </button>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              <span className="text-sm font-medium">{selectedDef.name}</span>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2" onClick={handleReset}>
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </Button>
                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2" onClick={() => setPreviewVisible(v => !v)}>
                  {previewVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {previewVisible ? "Hide" : "Show"} Preview
                </Button>
                <Button size="sm" className="h-9 rounded-xl gap-2 bg-primary text-white" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </Button>
              </div>
            </div>

            <div className={`grid gap-6 ${previewVisible ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}>
              {/* Left: Editor */}
              <div className="space-y-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "html" | "colors")}>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="border-b border-border px-4 pt-4">
                      <TabsList className="rounded-xl h-9">
                        <TabsTrigger value="html" className="rounded-lg text-xs gap-1.5 h-7">
                          <Code2 className="w-3.5 h-3.5" /> HTML Editor
                        </TabsTrigger>
                        <TabsTrigger value="colors" className="rounded-lg text-xs gap-1.5 h-7">
                          <Palette className="w-3.5 h-3.5" /> Colors
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="html" className="m-0">
                      <div className="p-4">
                        {/* Variables helper */}
                        <div className="mb-3 p-3 rounded-xl bg-brand-50 border border-brand-100">
                          <p className="text-xs font-semibold text-foreground mb-2">Available variables:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDef.variables.map(v => (
                              <code key={v.name} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono">{`{{${v.name}}}`}</code>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={editHtml}
                          onChange={e => setEditHtml(e.target.value)}
                          className="w-full min-h-[500px] font-mono text-xs bg-background border border-input rounded-xl px-3 py-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                          spellCheck={false}
                          placeholder="Paste HTML here..."
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="colors" className="m-0">
                      <div className="p-4 space-y-4">
                        <p className="text-sm text-muted-foreground">Customize colors. Changes update the live preview instantly and will be baked into the saved template.</p>
                        {colorFields.map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <input
                                type="color"
                                value={colors[key]}
                                onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Label className="text-xs font-medium text-foreground">{label}</Label>
                              <Input
                                value={colors[key]}
                                onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                                className="h-8 mt-1 rounded-lg font-mono text-xs"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl text-xs"
                          onClick={() => setColors(DEFAULT_COLORS)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reset to Default Colors
                        </Button>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>

                {/* Send Test */}
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary" /> Send Test Email
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      value={testEmail}
                      onChange={e => setTestEmail(e.target.value)}
                      className="h-10 rounded-xl flex-1"
                    />
                    <Button
                      onClick={handleSendTest}
                      disabled={!testEmail.trim() || sendingTest}
                      className="h-10 rounded-xl bg-primary text-white px-5 gap-2"
                    >
                      {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right: Preview */}
              {previewVisible && (
                <div className="space-y-3">
                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="border-b border-border px-4 py-2.5 flex items-center justify-between bg-brand-50/50">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Preview</span>
                      <span className="text-xs text-muted-foreground">Rendered as email client would show it</span>
                    </div>
                    {/* Simulated email client chrome */}
                    <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">From:</span> Yatri Cloud &lt;noreply@yatricloud.com&gt;
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">Subject:</span> {selectedDef.name}
                      </div>
                    </div>
                    <iframe
                      ref={iframeRef}
                      title="Email preview"
                      className="w-full border-0"
                      style={{ height: "600px" }}
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
