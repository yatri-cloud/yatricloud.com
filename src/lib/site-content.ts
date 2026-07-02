import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Site content loader — reads homepage/site copy from Supabase
 * (`site_settings`, `site_stats`, `promotions`, `faqs`) with hardcoded
 * fallbacks that match the live values exactly. If Supabase is slow,
 * errors, or returns nothing, the site keeps rendering the fallback so
 * visitors never see a blank section. Fetches once per session; every
 * consumer shares the same in-flight promise.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type SiteStat = { key: string; value: string; label: string };

export type Promotion = {
  headline: string;
  discount_text: string;
  cta_label: string;
  cta_url: string;
};

export type Faq = {
  question: string;
  answer: string;
  listItems?: string[];
};

/* ------------------------------------------------------------------ */
/* Fallbacks — must always equal today's live values                   */
/* ------------------------------------------------------------------ */

export const FALLBACK_SETTINGS: Record<string, any> = {
  contact: {
    email: "info@yatricloud.com",
    phone: "+91 97248 23602",
    phone_href: "tel:+919724823602",
    location: "Bengaluru, Karnataka, India",
    hours: "Mon to Fri: 9:00 AM to 6:00 PM · Sat & Sun: 10:00 AM to 4:00 PM",
  },
  social: {
    youtube: "https://www.youtube.com/@yatricloud?sub_confirmation=1",
    linkedin: "https://linkedin.com/company/yatricloud",
    whatsapp: "https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s",
  },
  booking: {
    calendly_url: "https://calendly.com/yatricloud/40min",
  },
  brand: {
    name: "Yatri Cloud",
    tagline:
      "Master cloud certifications the affordable way — AWS, Azure & GCP at 50% OFF, with exam dumps, resources, and personal guidance.",
    designed_by: "Uimitra",
  },
};

export const FALLBACK_STATS: SiteStat[] = [
  { key: "learners", value: "50K+", label: "Learners" },
  { key: "rating", value: "4.8", label: "Rating" },
  { key: "tracks", value: "6", label: "Cloud Tracks" },
  { key: "success_rate", value: "95%", label: "Success Rate" },
  { key: "communities", value: "17", label: "Communities" },
  { key: "reached", value: "400K+", label: "Reached" },
];

export const FALLBACK_PROMOTION: Promotion = {
  headline: "Get 50% OFF on Certification Vouchers",
  discount_text: "50% OFF",
  cta_label: "Get Your 50% OFF",
  cta_url: "https://calendly.com/yatricloud/40min",
};

export const FALLBACK_FAQS: Faq[] = [
  {
    question: "Step 1: How do I schedule my exam meeting?",
    answer:
      "To schedule your certification processing meeting, simply select a suitable time slot and book a meet through our Calendly widget on the website. This is the first step to get started with the certification process.",
  },
  {
    question: "Step 2: What happens during the scheduling meeting?",
    answer:
      "During the meeting call, our team will coordinate with you to start processing your exam scheduling ahead. We'll finalize the date and time together to ensure correct exam selection. We handle everything for you to make the process smooth and error-free.",
  },
  {
    question: "Is there still a WhatsApp group requirement?",
    answer:
      "No, we have streamlined our process! You no longer need to join a WhatsApp group beforehand. Simply schedule a meeting directly through our Calendly widget at your convenience to get started.",
  },
  {
    question: "Which AWS Associate exams are eligible for the 50% OFF discount?",
    answer: "list",
    listItems: [
      "AWS Cloud Practitioner",
      "AWS AI Practitioner",
      "AWS Certified Solutions Architect – Associate (SAA-C03)",
      "AWS Certified Developer – Associate (DVA-C02)",
      "AWS Certified CloudOps Engineer – Associate (SOA-C03)",
      "AWS Certified Data Engineer – Associate (DEA-C01)",
      "AWS Certified Machine Learning Engineer – Associate (MLA-C01)",
    ],
  },
  {
    question: "What bonus features are included with my certification?",
    answer:
      "These benefits are available only after getting 50% OFF. You'll receive: 50% OFF Vouchers, Exam Dumps & Resources, Udemy Course Free Access, Topmate Free Connect with Yatharth & Nensi, and LinkedIn Recommendation. These resources are designed to help you prepare effectively and pass your exam with confidence.",
  },
  {
    question: "What happens after I schedule the meet?",
    answer:
      "Once you book a slot through our Calendly widget, you will receive a calendar invitation. Please join the meeting at the scheduled time where our team will help you finalize your exam date, ensure everything is set up correctly, and process your certification request.",
  },
  {
    question: "How long does the entire certification process take?",
    answer:
      "The process is straightforward: Simply book a meeting slot (takes just a minute!), and attend the short meeting where we schedule your exam. The timeline depends entirely on your availability for the scheduling meeting, but we work to make it as quick as possible.",
  },
];

/* ------------------------------------------------------------------ */
/* Session cache — one shared promise per resource                     */
/* ------------------------------------------------------------------ */

let settingsPromise: Promise<Record<string, any>> | null = null;
let statsPromise: Promise<SiteStat[]> | null = null;
const promotionPromises: Record<string, Promise<Promotion | null>> = {};
let faqsPromise: Promise<Faq[]> | null = null;

/** key → value map from `site_settings`. Never throws; falls back per key. */
export function getSiteSettings(): Promise<Record<string, any>> {
  if (!settingsPromise) {
    settingsPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value");
        if (error || !data || data.length === 0) return FALLBACK_SETTINGS;
        const map: Record<string, any> = { ...FALLBACK_SETTINGS };
        for (const row of data) {
          if (!row?.key) continue;
          const fallback = FALLBACK_SETTINGS[row.key];
          map[row.key] =
            fallback && typeof fallback === "object"
              ? { ...fallback, ...(row.value ?? {}) }
              : row.value ?? fallback;
        }
        return map;
      } catch {
        return FALLBACK_SETTINGS;
      }
    })();
  }
  return settingsPromise;
}

/** Active `site_stats` rows in display order. Never throws. */
export function getSiteStats(): Promise<SiteStat[]> {
  if (!statsPromise) {
    statsPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("site_stats")
          .select("key, value, label")
          .eq("active", true)
          .order("sort_order", { ascending: true });
        if (error || !data || data.length === 0) return FALLBACK_STATS;
        return data.map((row: any) => ({
          key: String(row.key ?? ""),
          value: String(row.value ?? ""),
          label: String(row.label ?? ""),
        }));
      } catch {
        return FALLBACK_STATS;
      }
    })();
  }
  return statsPromise;
}

/** The active promotion (optionally by slug). Never throws. */
export function getActivePromotion(slug?: string): Promise<Promotion | null> {
  const cacheKey = slug ?? "__any__";
  if (!promotionPromises[cacheKey]) {
    promotionPromises[cacheKey] = (async () => {
      try {
        let query = supabase
          .from("promotions")
          .select("headline, discount_text, cta_label, cta_url")
          .eq("active", true)
          .order("sort_order", { ascending: true })
          .limit(1);
        if (slug) query = query.eq("slug", slug);
        const { data, error } = await query;
        if (error || !data || data.length === 0) return FALLBACK_PROMOTION;
        const row: any = data[0];
        return {
          headline: String(row.headline ?? FALLBACK_PROMOTION.headline),
          discount_text: String(row.discount_text ?? FALLBACK_PROMOTION.discount_text),
          cta_label: String(row.cta_label ?? FALLBACK_PROMOTION.cta_label),
          cta_url: String(row.cta_url ?? FALLBACK_PROMOTION.cta_url),
        };
      } catch {
        return FALLBACK_PROMOTION;
      }
    })();
  }
  return promotionPromises[cacheKey];
}

/** Active FAQs in display order. Never throws. */
export function getFaqs(): Promise<Faq[]> {
  if (!faqsPromise) {
    faqsPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("faqs")
          .select("question, answer, list_items")
          .eq("active", true)
          .order("sort_order", { ascending: true });
        if (error || !data || data.length === 0) return FALLBACK_FAQS;
        return data.map((row: any) => {
          const faq: Faq = {
            question: String(row.question ?? ""),
            answer: String(row.answer ?? ""),
          };
          if (Array.isArray(row.list_items) && row.list_items.length > 0) {
            faq.listItems = row.list_items.map((item: any) => String(item));
          }
          return faq;
        });
      } catch {
        return FALLBACK_FAQS;
      }
    })();
  }
  return faqsPromise;
}

/* ------------------------------------------------------------------ */
/* Convenience helpers                                                  */
/* ------------------------------------------------------------------ */

/** Look up a stat value by key with a guaranteed fallback string. */
export function statValue(
  stats: SiteStat[],
  key: string,
  fallback: string
): string {
  const found = stats.find((s) => s.key === key);
  return found?.value || fallback;
}

/**
 * React hook: render with `fallback` immediately (no flash, no layout
 * shift), then swap in the fetched value once it resolves. Fetchers are
 * session cached above, so this never spams the network per component.
 */
export function useSiteContent<T>(fetcher: () => Promise<T>, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let mounted = true;
    fetcherRef
      .current()
      .then((result) => {
        if (mounted && result !== null && result !== undefined) {
          setValue(result);
        }
      })
      .catch(() => {
        /* keep the fallback — never blank the section */
      });
    return () => {
      mounted = false;
    };
  }, []);

  return value;
}
