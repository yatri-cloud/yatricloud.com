import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { ContactSection } from "@/components/sections/ContactSection";
import { SEO } from "@/components/SEO";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Contact Us · Yatri Cloud" description="Contact Yatri Cloud for support, certification vouchers, trainings, events, payments and partnership questions." />
      <Navbar />
      <main className="pt-20">
        <section className="container mx-auto max-w-4xl px-4 py-16 text-center md:px-6">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Support
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Contact Us</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Need help with an order, voucher, training, payment, event, or partnership? Reach out and our team will respond as soon as possible.
          </p>
          <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-5 text-left text-sm text-muted-foreground sm:grid-cols-2">
            <div><span className="font-semibold text-foreground">Email:</span> support@yatricloud.com</div>
            <div><span className="font-semibold text-foreground">Website:</span> www.yatricloud.com</div>
          </div>
        </section>
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
