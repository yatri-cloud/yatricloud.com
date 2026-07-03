/**
 * Multi currency helpers for direct international checkout.
 *
 * The base currency is INR. site_settings key "currencies" holds the live
 * list where each entry carries a rate expressed as foreign units per one
 * rupee, so INR * rate = foreign amount. The list is cached once per session
 * (mirrors the site-content.ts discipline) and falls back to a hardcoded list
 * matching the seed when the setting is missing. Nothing here ever throws.
 */

import { getSiteSettings } from "@/lib/site-content";

export interface CurrencyOption {
  /** ISO 4217 code, e.g. INR, USD. */
  code: string;
  /** Display symbol, e.g. ₹, $. */
  symbol: string;
  /** Foreign units per one INR (INR * rate = foreign). */
  rate: number;
  /** Human label shown in the dropdown. */
  label: string;
}

export const BASE_CURRENCY = "INR";

/** Hardcoded fallback matching the 8 seeded currencies. */
export const FALLBACK_CURRENCIES: CurrencyOption[] = [
  { code: "INR", symbol: "₹", rate: 1, label: "Indian Rupee" },
  { code: "USD", symbol: "$", rate: 0.012, label: "US Dollar" },
  { code: "EUR", symbol: "€", rate: 0.011, label: "Euro" },
  { code: "GBP", symbol: "£", rate: 0.0095, label: "British Pound" },
  { code: "AED", symbol: "د.إ", rate: 0.044, label: "UAE Dirham" },
  { code: "SGD", symbol: "S$", rate: 0.016, label: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", rate: 0.018, label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", rate: 0.016, label: "Canadian Dollar" },
];

/** The default currency (INR) shown before any selection. */
export const DEFAULT_CURRENCY: CurrencyOption = FALLBACK_CURRENCIES[0];

let currenciesPromise: Promise<CurrencyOption[]> | null = null;

function coerceOption(raw: any): CurrencyOption | null {
  if (!raw || typeof raw !== "object") return null;
  const code = String(raw.code || "").toUpperCase();
  if (!code) return null;
  const rate = Number(raw.rate);
  return {
    code,
    symbol: String(raw.symbol || code),
    rate: Number.isFinite(rate) && rate > 0 ? rate : code === BASE_CURRENCY ? 1 : 0,
    label: String(raw.label || code),
  };
}

/** Supported currencies, cached once per session. Never throws. */
export function getCurrencies(): Promise<CurrencyOption[]> {
  if (!currenciesPromise) {
    currenciesPromise = (async () => {
      try {
        const settings = await getSiteSettings();
        const cfg = settings?.currencies;
        const list = Array.isArray(cfg?.list) ? cfg.list : null;
        if (!list || list.length === 0) return FALLBACK_CURRENCIES;
        const mapped = list
          .map(coerceOption)
          .filter((c): c is CurrencyOption => !!c && (c.code === BASE_CURRENCY || c.rate > 0));
        if (mapped.length === 0) return FALLBACK_CURRENCIES;
        // Always guarantee the base currency is present and first.
        const hasBase = mapped.some((c) => c.code === BASE_CURRENCY);
        return hasBase ? mapped : [DEFAULT_CURRENCY, ...mapped];
      } catch {
        return FALLBACK_CURRENCIES;
      }
    })();
  }
  return currenciesPromise;
}

/** Find an option by code, falling back to the base currency. */
export function findCurrency(list: CurrencyOption[], code: string): CurrencyOption {
  return list.find((c) => c.code === code) || list[0] || DEFAULT_CURRENCY;
}

/** Convert an INR amount to the chosen currency (2 decimals; INR passes through). */
export function convertFromInr(inr: number, currency: CurrencyOption): number {
  const value = Number(inr) || 0;
  if (!currency || currency.code === BASE_CURRENCY) return Math.round(value * 100) / 100;
  const rate = Number(currency.rate) || 0;
  return Math.round(value * rate * 100) / 100;
}

/** Format an amount with the currency symbol, e.g. "$5.99" or "₹499". */
export function formatMoney(amount: number, currency: CurrencyOption): string {
  const value = Number(amount) || 0;
  const symbol = currency?.symbol || currency?.code || "";
  if (!currency || currency.code === BASE_CURRENCY) {
    // Rupees show without decimals to match the rest of the app.
    return `${symbol}${Math.round(value).toLocaleString("en-IN")}`;
  }
  return `${symbol}${value.toFixed(2)}`;
}

/** Smallest unit integer for Razorpay (amount * 100 for these 2 decimal currencies). */
export function toSmallestUnit(amount: number, _currency: CurrencyOption): number {
  return Math.round((Number(amount) || 0) * 100);
}
