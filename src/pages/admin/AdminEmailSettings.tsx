import { useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/email";
import {
  Settings, Loader2, CheckCircle2, XCircle, Send, Wifi, WifiOff,
  Mail, Key, Server, Globe,
} from "lucide-react";

interface ConnectionStatus {
  status: "idle" | "testing" | "success" | "failed";
  message: string;
}

export default function AdminEmailSettings() {
  const { toast } = useToast();
  const [connStatus, setConnStatus] = useState<ConnectionStatus>({ status: "idle", message: "" });
  const [testRecipient, setTestRecipient] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const handleTestConnection = async () => {
    setConnStatus({ status: "testing", message: "Testing SMTP connection..." });
    try {
      const result = await sendEmail({
        to: testRecipient || "noreply@yatricloud.com",
        subject: "SMTP Connection Test — Yatri Cloud",
        html: `<h2>SMTP Test</h2><p>If you received this email, your SMTP configuration is working correctly.</p><p>Sent at: ${new Date().toLocaleString()}</p>`,
        templateKey: "smtp_test",
        metadata: { source: "admin_email_settings" },
      });
      if (result.success) {
        setConnStatus({ status: "success", message: "Connection successful! Test email delivered." });
      } else {
        setConnStatus({ status: "failed", message: result.error || "Send failed. Check your SMTP credentials in .env" });
      }
    } catch (e: any) {
      setConnStatus({ status: "failed", message: e.message || "Unknown error" });
    }
  };

  const handleSendTest = async () => {
    if (!testRecipient.trim()) {
      toast({ title: "Enter a recipient email", variant: "destructive" });
      return;
    }
    setSendingTest(true);
    const result = await sendEmail({
      to: testRecipient.trim(),
      subject: "[Yatri Cloud] Email System Test",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#007CFF;padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Email System Test ✓</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi Admin,</p>
      <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">This is a test email sent from the <strong>Yatri Cloud Admin Panel → Email Settings</strong>. If you received this, your email system is configured correctly and working!</p>
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:4px;margin-bottom:24px;">
        <p style="margin:0;color:#166534;font-size:14px;"><strong>✓ SMTP Connected</strong><br>Emails will be delivered to your subscribers successfully.</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;">Sent at: ${new Date().toLocaleString()}</p>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Yatri Cloud. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      templateKey: "admin_test",
      metadata: { source: "admin_email_settings" },
    });
    setSendingTest(false);
    if (result.success) {
      toast({ title: "Test Email Sent!", description: `Delivered to ${testRecipient}` });
    } else {
      toast({ title: "Send Failed", description: result.error, variant: "destructive" });
    }
  };

  const envVars = [
    { key: "EMAIL_HOST", label: "SMTP Host", example: "smtp.office365.com", icon: Server },
    { key: "EMAIL_PORT", label: "SMTP Port", example: "587", icon: Globe },
    { key: "EMAIL_USER", label: "SMTP Username / From Email", example: "noreply@yatricloud.com", icon: Mail },
    { key: "EMAIL_PASS", label: "SMTP Password / App Password", example: "••••••••••••", icon: Key },
    { key: "EMAIL_FROM_NAME", label: "Sender Display Name", example: "Yatri Cloud", icon: Mail },
  ];

  return (
    <div className="px-4 md:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.05] via-transparent to-card p-6 md:p-8">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 to-brand-400 opacity-80" />
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">Email Settings</h1>
              <p className="text-muted-foreground mt-2 text-sm max-w-2xl">View your SMTP configuration, test the connection, and send test emails.</p>
            </div>
          </div>
        </ScrollReveal>

        {/* SMTP Config Card */}
        <ScrollReveal>
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-brand-50/50">
              <Server className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-semibold text-base">SMTP Configuration</h2>
                <p className="text-xs text-muted-foreground">These values are set in your <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">.env</code> file on the server. To change them, update the environment variables and redeploy.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {envVars.map(({ key, label, example }) => (
                <div key={key} className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="font-mono text-xs bg-muted text-foreground px-3 py-1.5 rounded-lg border border-border">
                        {key === "EMAIL_PASS" ? "••••••••••••" : example}
                      </code>
                      <span className="text-[11px] text-muted-foreground">{`process.env.${key}`}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Connection Test Card */}
        <ScrollReveal>
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-brand-50/50">
              <Wifi className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-semibold text-base">Send Test Email</h2>
                <p className="text-xs text-muted-foreground">Send a test email to verify your SMTP connection is working.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-recipient" className="text-sm font-medium">Recipient Email</Label>
                <div className="flex gap-3">
                  <Input
                    id="test-recipient"
                    type="email"
                    placeholder="your@email.com"
                    value={testRecipient}
                    onChange={e => setTestRecipient(e.target.value)}
                    className="h-10 rounded-xl flex-1"
                  />
                  <Button
                    onClick={handleSendTest}
                    disabled={sendingTest || !testRecipient.trim()}
                    className="h-10 rounded-xl bg-primary text-white gap-2 px-5"
                  >
                    {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Test
                  </Button>
                </div>
              </div>

              {/* Connection status result */}
              {connStatus.status !== "idle" && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                  connStatus.status === "success" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900" :
                  connStatus.status === "failed" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" :
                  "bg-brand-50 border-brand-200"
                }`}>
                  {connStatus.status === "testing" && <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0 mt-0.5" />}
                  {connStatus.status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
                  {connStatus.status === "failed" && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-sm font-medium ${
                      connStatus.status === "success" ? "text-emerald-700" :
                      connStatus.status === "failed" ? "text-red-700" :
                      "text-primary"
                    }`}>
                      {connStatus.status === "testing" ? "Testing..." :
                       connStatus.status === "success" ? "Connection Successful" : "Connection Failed"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{connStatus.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Tips Card */}
        <ScrollReveal>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-5">
            <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email Sending Tips
            </h3>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1.5 list-disc list-inside">
              <li><strong>Office 365:</strong> Max ~30 emails/minute, 10,000/day</li>
              <li><strong>Gmail Workspace:</strong> Max 2,000 emails/day (500 for free accounts)</li>
              <li><strong>For bulk newsletters</strong>, consider AWS SES, Resend, or SendGrid for higher limits</li>
              <li>Always test before sending to all subscribers</li>
              <li>Check Email Logs for delivery status and failures</li>
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
