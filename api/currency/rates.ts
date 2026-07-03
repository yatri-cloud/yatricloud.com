import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Live exchange rates, INR based.
 *
 * Returns { base: 'INR', rates: { CODE: unitsPerInr, ... }, source, updatedAt }.
 * Rates come from a free, no-key feed (open.er-api.com) and are cached in memory
 * for six hours so we do not hammer it. If the feed is unreachable we fall back
 * to an approximate static table so pricing never breaks. INR is always 1.
 *
 * This endpoint reads nothing user specific and mutates nothing — safe to cache
 * hard at the CDN.
 */

// Approximate units-per-USD fallback, mirrored from src/lib/currency-catalog.ts.
// Kept here too so the function is self contained (serverless isolation).
const FALLBACK_USD: Record<string, number> = {
  INR: 85, AED: 3.67, ALL: 92, AMD: 388, ARS: 1000, AUD: 1.52, AWG: 1.79,
  AZN: 1.7, BAM: 1.8, BBD: 2, BDT: 120, BGN: 1.8, BHD: 0.376, BIF: 2900,
  BMD: 1, BND: 1.35, BOB: 6.9, BRL: 5.5, BSD: 1, BTN: 85, BWP: 13.6, BZD: 2,
  CAD: 1.38, CHF: 0.9, CLP: 950, CNY: 7.2, COP: 4100, CRC: 515, CUP: 24,
  CVE: 101, CZK: 23, DJF: 178, DKK: 6.9, DOP: 60, DZD: 134, EGP: 49, ETB: 126,
  EUR: 0.92, FJD: 2.25, GBP: 0.79, GHS: 15, GIP: 0.79, GMD: 71, GNF: 8600,
  GTQ: 7.7, GYD: 209, HKD: 7.8, HNL: 25, HRK: 6.9, HTG: 132, HUF: 360,
  IDR: 16000, ILS: 3.7, IQD: 1310, ISK: 138, JMD: 157, JOD: 0.71, JPY: 150,
  KES: 129, KGS: 87, KHR: 4050, KMF: 452, KRW: 1350, KWD: 0.307, KYD: 0.83,
  KZT: 480, LAK: 21500, LKR: 295, LRD: 190, LSL: 18, MAD: 9.9, MDL: 17.8,
  MGA: 4600, MKD: 57, MMK: 2100, MNT: 3400, MOP: 8, MUR: 46, MVR: 15.4,
  MWK: 1730, MXN: 18.5, MYR: 4.5, MZN: 63.5, NAD: 18, NGN: 1550, NIO: 36.7,
  NOK: 10.7, NPR: 136, NZD: 1.66, OMR: 0.385, PEN: 3.75, PGK: 3.9, PHP: 58,
  PKR: 278, PLN: 3.95, PYG: 7600, QAR: 3.64, RON: 4.6, RSD: 108, RUB: 92,
  RWF: 1350, SAR: 3.75, SCR: 13.5, SEK: 10.5, SGD: 1.35, SOS: 571, SSP: 3000,
  SVC: 8.75, SZL: 18, THB: 34, TND: 3.1, TRY: 34, TTD: 6.8, TWD: 32, TZS: 2650,
  UAH: 41, UGX: 3700, USD: 1, UYU: 42, UZS: 12800, VND: 25400, VUV: 120,
  XAF: 605, XCD: 2.7, XOF: 605, XPF: 110, YER: 250, ZAR: 18, ZMW: 27,
};

const SUPPORTED = Object.keys(FALLBACK_USD);

function fallbackRates(): Record<string, number> {
  const inrPerUsd = FALLBACK_USD.INR;
  const out: Record<string, number> = {};
  for (const [code, usd] of Object.entries(FALLBACK_USD)) out[code] = usd / inrPerUsd;
  return out;
}

// Simple in-memory cache. Survives across warm invocations of the same lambda.
let cache: { rates: Record<string, number>; source: string; updatedAt: string; at: number } | null = null;
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Serve from cache when fresh.
  if (cache && Date.now() - cache.at < TTL_MS) {
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=21600');
    return res.status(200).json({ base: 'INR', rates: cache.rates, source: cache.source, updatedAt: cache.updatedAt });
  }

  let rates = fallbackRates();
  let source = 'fallback';
  let updatedAt = new Date().toISOString();

  try {
    const r = await fetch('https://open.er-api.com/v6/latest/INR', {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) {
      const data = (await r.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
      if (data.result === 'success' && data.rates && typeof data.rates.INR === 'number') {
        // Keep only the codes we support; guarantee INR = 1.
        const live: Record<string, number> = { INR: 1 };
        for (const code of SUPPORTED) {
          const v = data.rates[code];
          if (typeof v === 'number' && v > 0) live[code] = v;
          else if (code !== 'INR') live[code] = rates[code]; // fall back per missing code
        }
        rates = live;
        source = 'open.er-api.com';
        updatedAt = data.time_last_update_utc || updatedAt;
      }
    }
  } catch {
    // Keep fallback rates.
  }

  cache = { rates, source, updatedAt, at: Date.now() };
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=21600');
  return res.status(200).json({ base: 'INR', rates, source, updatedAt });
}
