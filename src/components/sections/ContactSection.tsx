import { type ReactNode, type FormEvent, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSiteContent, getSiteSettings, FALLBACK_SETTINGS } from "@/lib/site-content";

const Field = ({ id, label, children }: { id: string; label: string; children: ReactNode }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
    {children}
  </div>
);

export const ContactSection = () => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  /* Contact details come from Supabase site_settings (seeded identical). */
  const settings = useSiteContent(getSiteSettings, FALLBACK_SETTINGS);
  const contact = settings.contact || FALLBACK_SETTINGS.contact;

  const CONTACT_INFO = [
    { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    { label: "Phone", value: contact.phone, href: contact.phone_href },
    { label: "Location", value: contact.location },
    { label: "Office hours (IST)", value: contact.hours },
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim().toLowerCase(),
      subject: String(fd.get("subject") || "").trim() || null,
      message: String(fd.get("message") || "").trim(),
    });
    setSending(false);
    if (error) {
      toast({
        title: "That didn't go through",
        description: `Please try again in a moment, or email us directly at ${contact.email}.`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Message sent!",
      description: "Thanks for reaching out, Yatri. We'll get back to you very soon.",
    });
    form.reset();
  };

  return (
    <section id="contact" className="band-tint py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollReveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
              Say hello, <span className="gradient-text">Yatri</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Questions, ideas, or just want to talk cloud? We read every message and we'll get back to you soon.
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Contact info */}
          <div className="space-y-4 lg:col-span-2">
            {CONTACT_INFO.map((info) => {
              const inner = (
                <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {info.label}
                  </div>
                  <div className="mt-1.5 font-medium">{info.value}</div>
                </div>
              );
              return info.href ? (
                <a key={info.label} href={info.href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{inner}</a>
              ) : (
                <div key={info.label}>{inner}</div>
              );
            })}
          </div>

          {/* Message form */}
          <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-border bg-card p-6 md:p-8 lg:col-span-3">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="c-name" label="Your name">
                <Input id="c-name" name="name" required placeholder="Yatharth Chauhan" className="h-11 rounded-xl" />
              </Field>
              <Field id="c-email" label="Email address">
                <Input id="c-email" name="email" type="email" required placeholder="you@example.com" className="h-11 rounded-xl" />
              </Field>
            </div>
            <Field id="c-subject" label="Subject">
              <Input id="c-subject" name="subject" placeholder="How can we help?" className="h-11 rounded-xl" />
            </Field>
            <Field id="c-message" label="Message">
              <Textarea id="c-message" name="message" required placeholder="Tell us a little about what you need..." className="min-h-[130px] rounded-xl" />
            </Field>
            <Button type="submit" disabled={sending} className="w-full gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-inset-btn hover:bg-brand-600 hover:text-primary-foreground min-h-[48px]">
              {sending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : (<>Send message <ArrowRight className="h-4 w-4" /></>)}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
