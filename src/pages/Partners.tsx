import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ArrowRight, Mail, Phone, MapPin, Clock, GraduationCap, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const EASE = [0.16, 1, 0.3, 1] as const;

type FormKind = "college" | "corporate" | null;

const OFFERINGS = [
  {
    id: "college" as const,
    icon: GraduationCap,
    title: "For colleges & universities",
    desc: "Give your students real, job-ready cloud and DevOps skills, taught by people who do this work every day.",
    benefits: [
      "A curriculum shaped around what employers actually hire for",
      "Hands-on labs, not just slides",
      "Mentorship from working industry experts",
      "Placement support for your students",
    ],
    cta: "Talk to us about your campus",
  },
  {
    id: "corporate" as const,
    icon: Building2,
    title: "For teams & companies",
    desc: "Grow your team's cloud skills with training built around your stack, your goals, and your schedule.",
    benefits: [
      "Training modules tailored to your team",
      "Flexible scheduling that fits your sprints",
      "Real projects, not toy examples",
      "Certification prep included",
    ],
    cta: "Plan a training for your team",
  },
];

const Field = ({ id, label, children }: { id: string; label: string; children: ReactNode }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
    {children}
  </div>
);

const inputCls = "h-11 rounded-xl";

const Partners = () => {
  const reduce = useReducedMotion();
  const { toast } = useToast();
  const [openForm, setOpenForm] = useState<FormKind>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePartnerSubmit = (kind: Exclude<FormKind, null>) => (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    toast({
      title: "Thank you, we've got your details!",
      description: "Someone from the Yatri Cloud team will reach out within one working day.",
    });
    form.reset();
    setOpenForm(null);
  };

  const handleContactSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    toast({
      title: "Message sent!",
      description: "Thanks for reaching out, Yatri. We'll get back to you very soon.",
    });
    form.reset();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Partner with Yatri Cloud" description="Bring industry-ready cloud and DevOps skills to your campus or company. Partner with Yatri Cloud, or just say hello." />
      <div className="noise-overlay" />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pb-20">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.07] via-background to-background" />
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-6xl">
              Let's build something <span className="gradient-text">together</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Whether you teach hundreds of students or lead a team of engineers, we'll help your people get certified and confident in the cloud.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Two partnership offerings */}
      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
            {OFFERINGS.map((o, i) => {
              const Icon = o.icon;
              return (
                <motion.div
                  key={o.id}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-8 transition-colors duration-300 hover:border-brand-200 hover:shadow-card"
                >
                  <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h2 className="mt-5 font-display text-2xl font-bold tracking-tight md:text-3xl">{o.title}</h2>
                  <p className="mt-3 text-muted-foreground">{o.desc}</p>

                  <ul className="mt-6 space-y-3">
                    {o.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-sm md:text-base">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => setOpenForm(o.id)}
                    className="mt-8 w-fit gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-inset-btn hover:bg-brand-600 hover:text-primary-foreground min-h-[44px]"
                  >
                    {o.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
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
            <div className="lg:col-span-2 space-y-4">
              {[
                { icon: Mail, label: "Email", value: "info@yatricloud.com", href: "mailto:info@yatricloud.com" },
                { icon: Phone, label: "Phone", value: "+91 97248 23602", href: "tel:+919724823602" },
                { icon: MapPin, label: "Location", value: "Bengaluru, Karnataka, India" },
                { icon: Clock, label: "Office hours (IST)", value: "Mon to Fri: 9:00 AM to 6:00 PM · Sat & Sun: 10:00 AM to 4:00 PM" },
              ].map((info) => {
                const Icon = info.icon;
                const inner = (
                  <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand-200">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{info.label}</div>
                      <div className="mt-0.5 font-medium">{info.value}</div>
                    </div>
                  </div>
                );
                return info.href ? (
                  <a key={info.label} href={info.href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">{inner}</a>
                ) : (
                  <div key={info.label}>{inner}</div>
                );
              })}
            </div>

            {/* Message form */}
            <form onSubmit={handleContactSubmit} className="lg:col-span-3 space-y-5 rounded-3xl border border-border bg-card p-6 md:p-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="contact-name" label="Your name">
                  <Input id="contact-name" name="name" required placeholder="Yatharth Chauhan" className={inputCls} />
                </Field>
                <Field id="contact-email" label="Email address">
                  <Input id="contact-email" name="email" type="email" required placeholder="you@example.com" className={inputCls} />
                </Field>
              </div>
              <Field id="contact-subject" label="Subject">
                <Input id="contact-subject" name="subject" placeholder="How can we help?" className={inputCls} />
              </Field>
              <Field id="contact-message" label="Message">
                <Textarea id="contact-message" name="message" required placeholder="Tell us a little about what you need..." className="min-h-[130px] rounded-xl" />
              </Field>
              <Button type="submit" className="w-full gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-inset-btn hover:bg-brand-600 hover:text-primary-foreground min-h-[48px]">
                Send message
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Partnership form modals */}
      <Dialog open={openForm === "college"} onOpenChange={(o) => !o && setOpenForm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold tracking-tight">Partner your campus with us</DialogTitle>
            <DialogDescription>Share a few details and our team will design a program that fits your students.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePartnerSubmit("college")} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="col-inst" label="Institution name"><Input id="col-inst" name="institution" required className={inputCls} /></Field>
              <Field id="col-name" label="Your name"><Input id="col-name" name="name" required className={inputCls} /></Field>
              <Field id="col-role" label="Your role"><Input id="col-role" name="role" required placeholder="e.g. HOD, TPO, Professor" className={inputCls} /></Field>
              <Field id="col-email" label="Work email"><Input id="col-email" name="email" type="email" required className={inputCls} /></Field>
              <Field id="col-phone" label="Phone"><Input id="col-phone" name="phone" type="tel" className={inputCls} /></Field>
              <Field id="col-count" label="Approx. students"><Input id="col-count" name="students" type="number" min={1} className={inputCls} /></Field>
            </div>
            <Field id="col-msg" label="Anything you'd like us to know"><Textarea id="col-msg" name="message" className="min-h-[90px] rounded-xl" /></Field>
            <DialogFooter>
              <Button type="submit" className="w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-inset-btn hover:bg-brand-600 hover:text-primary-foreground min-h-[44px]">
                Send details <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openForm === "corporate"} onOpenChange={(o) => !o && setOpenForm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold tracking-tight">Plan training for your team</DialogTitle>
            <DialogDescription>Tell us about your team and goals, and we'll put together a plan that works for you.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePartnerSubmit("corporate")} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="cor-company" label="Company name"><Input id="cor-company" name="company" required className={inputCls} /></Field>
              <Field id="cor-name" label="Your name"><Input id="cor-name" name="name" required className={inputCls} /></Field>
              <Field id="cor-email" label="Work email"><Input id="cor-email" name="email" type="email" required className={inputCls} /></Field>
              <Field id="cor-phone" label="Phone"><Input id="cor-phone" name="phone" type="tel" className={inputCls} /></Field>
              <Field id="cor-size" label="Team size"><Input id="cor-size" name="teamSize" type="number" min={1} className={inputCls} /></Field>
              <Field id="cor-topic" label="Focus area"><Input id="cor-topic" name="focus" placeholder="e.g. AWS, Kubernetes" className={inputCls} /></Field>
            </div>
            <Field id="cor-msg" label="What are you looking for?"><Textarea id="cor-msg" name="message" className="min-h-[90px] rounded-xl" /></Field>
            <DialogFooter>
              <Button type="submit" className="w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-inset-btn hover:bg-brand-600 hover:text-primary-foreground min-h-[44px]">
                Send details <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Partners;
