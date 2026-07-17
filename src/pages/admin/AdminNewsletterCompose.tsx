import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Loader2,
  Save,
  Send,
  Eye,
  Mail,
} from "lucide-react";
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
  createNewsletter,
  updateNewsletter,
  getNewsletter,
  sendNewsletter,
} from "@/lib/newsletter";
import { sendEmail } from "@/lib/email";
import { getNewsletterEmail } from "@/lib/email-templates";
import { supabase } from "@/lib/supabase";

export default function AdminNewsletterCompose() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendProgress, setSendProgress] = useState("");
  const [toSendAll, setToSendAll] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const nl = await getNewsletter(id);
      if (nl) {
        setTitle(nl.title);
        setSubject(nl.subject);
        setBody(nl.body_html);
      } else {
        toast({
          title: "Error",
          description: "Newsletter not found.",
          variant: "destructive",
        });
        navigate("/admin/newsletters");
      }
      setLoading(false);
    };
    load();
  }, [id, navigate, toast]);

  const handleSaveDraft = async () => {
    if (!title.trim() || !subject.trim() || !body.trim()) {
      toast({
        title: "Error",
        description: "Title, subject, and body are all required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    if (isEdit && id) {
      const result = await updateNewsletter(id, {
        title: title.trim(),
        subject: subject.trim(),
        body_html: body,
      });
      setSaving(false);
      if (!result.ok) {
        toast({ title: "Error", description: result.error || "Save failed.", variant: "destructive" });
        return;
      }
      toast({ title: "Done", description: "Newsletter updated." });
    } else {
      const result = await createNewsletter({
        title: title.trim(),
        subject: subject.trim(),
        body_html: body,
      });
      setSaving(false);
      if (!result.ok) {
        toast({ title: "Error", description: result.error || "Save failed.", variant: "destructive" });
        return;
      }
      toast({ title: "Done", description: "Newsletter saved as draft." });
      navigate(`/admin/newsletters/edit/${result.id}`);
    }
  };

  const handleSendTest = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Error",
        description: "Subject and body are required to send a test.",
        variant: "destructive",
      });
      return;
    }

    setSendingTest(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        toast({ title: "Error", description: "Could not determine your email.", variant: "destructive" });
        setSendingTest(false);
        return;
      }

      const testUnsubUrl = `https://www.yatricloud.com/unsubscribe?token=test`;
      const html = getNewsletterEmail(subject.trim(), body, testUnsubUrl);
      const result = await sendEmail({ to: user.email, subject: `[TEST] ${subject.trim()}`, html });

      setSendingTest(false);
      if (!result.success) {
        toast({ title: "Error", description: result.error || "Test send failed.", variant: "destructive" });
        return;
      }
      toast({ title: "Sent", description: `Test email sent to ${user.email}.` });
    } catch {
      setSendingTest(false);
      toast({ title: "Error", description: "Test send failed.", variant: "destructive" });
    }
  };

  const handleSendAll = async () => {
    setToSendAll(false);

    // Ensure we have a saved newsletter first
    let newsletterId = id;
    if (!newsletterId) {
      if (!title.trim() || !subject.trim() || !body.trim()) {
        toast({
          title: "Error",
          description: "Save the newsletter first before sending.",
          variant: "destructive",
        });
        return;
      }
      const saved = await createNewsletter({
        title: title.trim(),
        subject: subject.trim(),
        body_html: body,
      });
      if (!saved.ok || !saved.id) {
        toast({ title: "Error", description: saved.error || "Could not save newsletter.", variant: "destructive" });
        return;
      }
      newsletterId = saved.id;
      // Update URL without full navigation
      navigate(`/admin/newsletters/edit/${saved.id}`, { replace: true });
    }

    setSendingAll(true);
    setSendProgress("Preparing to send...");

    const result = await sendNewsletter(newsletterId, (sent, total) => {
      setSendProgress(`Sending to ${total} subscribers... (${sent}/${total})`);
    });

    setSendingAll(false);
    setSendProgress("");

    if (!result.ok) {
      toast({ title: "Error", description: result.error || "Send failed.", variant: "destructive" });
      return;
    }

    toast({
      title: "Sent",
      description: `Newsletter sent to ${result.sent} subscribers${
        result.failed > 0 ? ` (${result.failed} failed)` : ""
      }.`,
    });
    navigate("/admin/newsletters");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Loading newsletter...</span>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-8 md:py-10">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* Header band */}
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
            />
            <div className="relative">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Newsletter
              </p>
              <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight md:text-3xl">
                {isEdit ? "Edit Newsletter" : "Compose Newsletter"}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {isEdit
                  ? "Update this draft and send it when ready."
                  : "Write your newsletter content and send it to all subscribers."}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newsletter-title" className="text-sm font-medium">
                    Title
                  </Label>
                  <Input
                    id="newsletter-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Weekly Cloud Digest #12"
                    className="h-10 rounded-xl"
                    data-testid="newsletter-title"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newsletter-subject" className="text-sm font-medium">
                    Subject line
                  </Label>
                  <Input
                    id="newsletter-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Your weekly cloud cert roundup"
                    className="h-10 rounded-xl"
                    data-testid="newsletter-subject"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newsletter-body" className="text-sm font-medium">
                    Body
                  </Label>
                  <textarea
                    id="newsletter-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your newsletter content here. You can use HTML for formatting."
                    className="w-full min-h-[280px] rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                    data-testid="newsletter-body"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports HTML. Preview your formatting on the right.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSaveDraft}
                  disabled={saving || sendingAll}
                  className="rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn"
                  data-testid="newsletter-save-draft"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isEdit ? "Save Changes" : "Save Draft"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSendTest}
                  disabled={saving || sendingTest || sendingAll}
                  className="h-10 rounded-xl"
                  data-testid="newsletter-send-test"
                >
                  {sendingTest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Test
                </Button>

                <Button
                  onClick={() => setToSendAll(true)}
                  disabled={saving || sendingTest || sendingAll}
                  className="rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn"
                  data-testid="newsletter-send-all"
                >
                  {sendingAll ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to All Subscribers
                </Button>
              </div>

              {sendProgress && (
                <div className="mt-4 rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {sendProgress}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preview panel */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card sticky top-8">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                  Preview
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  Live preview
                </h3>
              </div>

              <div className="rounded-xl border border-brand-100 bg-background overflow-hidden">
                <div className="border-b border-brand-100 bg-brand-50/50 px-4 py-2">
                  <p className="text-xs text-muted-foreground">
                    Subject:{" "}
                    <span className="font-medium text-foreground">
                      {subject || "(no subject)"}
                    </span>
                  </p>
                </div>
                <div className="p-4">
                  {body ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground"
                      dangerouslySetInnerHTML={{ __html: body }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Start writing to see a preview...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send All confirm dialog */}
      <AlertDialog open={toSendAll} onOpenChange={(o) => !o && setToSendAll(false)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">
              Send to all subscribers?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send <strong>{subject || title || "this newsletter"}</strong> to
              every active subscriber. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendAll}
              className="rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground shadow-inset-btn"
            >
              <Send className="mr-2 h-4 w-4" />
              Send to All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
