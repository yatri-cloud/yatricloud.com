import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Guess a visitor's currency from where the request comes from.
 *
 * Vercel populates the `x-vercel-ip-country` header (ISO 3166-1 alpha-2) at the
 * edge, so we never call an external geo service. We map that country to a
 * currency; anything we do not recognise defaults to USD, and a missing header
 * (local dev, unknown) defaults to INR (our base). The client caches the result
 * and the visitor can always override with the "Pay in" picker.
 *
 * Returns { country, currency }.
 */

// ISO2 country -> currency code. Eurozone all map to EUR. Mirrors
// src/lib/currency-catalog.ts (kept here for serverless isolation).
const COUNTRY_CURRENCY: Record<string, string> = {
  IN: 'INR', US: 'USD', UM: 'USD', PA: 'USD', SV: 'SVC', GB: 'GBP', GI: 'GIP',
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR',
  GR: 'EUR', IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR',
  NL: 'EUR', PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR', HR: 'EUR', AD: 'EUR',
  MC: 'EUR', SM: 'EUR', VA: 'EUR', ME: 'EUR', XK: 'EUR',
  AE: 'AED', AL: 'ALL', AM: 'AMD', AR: 'ARS', AU: 'AUD', AW: 'AWG', AZ: 'AZN',
  BA: 'BAM', BB: 'BBD', BD: 'BDT', BG: 'BGN', BH: 'BHD', BI: 'BIF', BM: 'BMD',
  BN: 'BND', BO: 'BOB', BR: 'BRL', BS: 'BSD', BT: 'BTN', BW: 'BWP', BZ: 'BZD',
  CA: 'CAD', CH: 'CHF', LI: 'CHF', CL: 'CLP', CN: 'CNY', CO: 'COP', CR: 'CRC',
  CU: 'CUP', CV: 'CVE', CZ: 'CZK', DJ: 'DJF', DK: 'DKK', FO: 'DKK', GL: 'DKK',
  DO: 'DOP', DZ: 'DZD', EG: 'EGP', ET: 'ETB', FJ: 'FJD', GH: 'GHS', GM: 'GMD',
  GN: 'GNF', GT: 'GTQ', GY: 'GYD', HK: 'HKD', HN: 'HNL', HT: 'HTG', HU: 'HUF',
  ID: 'IDR', IL: 'ILS', PS: 'ILS', IQ: 'IQD', IS: 'ISK', JM: 'JMD', JO: 'JOD',
  JP: 'JPY', KE: 'KES', KG: 'KGS', KH: 'KHR', KM: 'KMF', KR: 'KRW', KW: 'KWD',
  KY: 'KYD', KZ: 'KZT', LA: 'LAK', LK: 'LKR', LR: 'LRD', LS: 'LSL', MA: 'MAD',
  EH: 'MAD', MD: 'MDL', MG: 'MGA', MK: 'MKD', MM: 'MMK', MN: 'MNT', MO: 'MOP',
  MU: 'MUR', MV: 'MVR', MW: 'MWK', MX: 'MXN', MY: 'MYR', MZ: 'MZN', NA: 'NAD',
  NG: 'NGN', NI: 'NIO', NO: 'NOK', NP: 'NPR', NZ: 'NZD', CK: 'NZD', NU: 'NZD',
  OM: 'OMR', PE: 'PEN', PG: 'PGK', PH: 'PHP', PK: 'PKR', PL: 'PLN', PY: 'PYG',
  QA: 'QAR', RO: 'RON', RS: 'RSD', RU: 'RUB', RW: 'RWF', SA: 'SAR', SC: 'SCR',
  SE: 'SEK', SG: 'SGD', SO: 'SOS', SS: 'SSP', SZ: 'SZL', TH: 'THB', TN: 'TND',
  TR: 'TRY', TT: 'TTD', TW: 'TWD', TZ: 'TZS', UA: 'UAH', UG: 'UGX', UY: 'UYU',
  UZ: 'UZS', VN: 'VND', VU: 'VUV', YE: 'YER', ZA: 'ZAR', ZM: 'ZMW',
  CM: 'XAF', CF: 'XAF', CG: 'XAF', TD: 'XAF', GQ: 'XAF', GA: 'XAF',
  BJ: 'XOF', BF: 'XOF', CI: 'XOF', GW: 'XOF', ML: 'XOF', NE: 'XOF', SN: 'XOF', TG: 'XOF',
  PF: 'XPF', NC: 'XPF', WF: 'XPF',
  AG: 'XCD', DM: 'XCD', GD: 'XCD', KN: 'XCD', LC: 'XCD', VC: 'XCD', AI: 'XCD', MS: 'XCD',
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  const raw = (req.headers['x-vercel-ip-country'] as string) || '';
  const country = raw.toUpperCase();
  const currency = country ? COUNTRY_CURRENCY[country] || 'USD' : 'INR';
  // Vary per visitor country; do not let the CDN share one answer across regions.
  res.setHeader('Cache-Control', 'private, max-age=3600');
  return res.status(200).json({ country: country || null, currency });
}
