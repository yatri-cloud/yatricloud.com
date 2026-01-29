/**
 * Country flag emoji and display name — same logic as Achievements page.
 */

/** Get flag emoji from ISO code (e.g. "US") or country name (e.g. "United States"). */
export function getCountryFlag(countryValue?: string): string {
  if (!countryValue || !countryValue.trim()) return "🌍";

  const trimmed = countryValue.trim();

  if (trimmed.length === 2) {
    try {
      const codePoints = trimmed
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return "🌍";
    }
  }

  const countryNameToCode: Record<string, string> = {
    "United States": "US",
    India: "IN",
    "United Kingdom": "GB",
    Canada: "CA",
    Australia: "AU",
    Germany: "DE",
    France: "FR",
    Brazil: "BR",
    Mexico: "MX",
    Italy: "IT",
    Spain: "ES",
    Netherlands: "NL",
    Belgium: "BE",
    Switzerland: "CH",
    Austria: "AT",
    Sweden: "SE",
    Norway: "NO",
    Denmark: "DK",
    Finland: "FI",
    Poland: "PL",
    Portugal: "PT",
    Greece: "GR",
    Ireland: "IE",
    "New Zealand": "NZ",
    Singapore: "SG",
    Malaysia: "MY",
    Philippines: "PH",
    Thailand: "TH",
    Indonesia: "ID",
    Vietnam: "VN",
    Japan: "JP",
    "South Korea": "KR",
    China: "CN",
    "Hong Kong": "HK",
    Taiwan: "TW",
    UAE: "AE",
    "Saudi Arabia": "SA",
    Israel: "IL",
    Turkey: "TR",
    "South Africa": "ZA",
    Egypt: "EG",
    Nigeria: "NG",
    Kenya: "KE",
    Argentina: "AR",
    Chile: "CL",
    Colombia: "CO",
    Peru: "PE",
    Pakistan: "PK",
    Bangladesh: "BD",
    "Sri Lanka": "LK",
    Nepal: "NP",
  };

  const code = countryNameToCode[trimmed] || trimmed.substring(0, 2).toUpperCase();
  if (code && code.length === 2) {
    try {
      const codePoints = code
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return "🌍";
    }
  }
  return "🌍";
}

/** Get display name from code or name. */
export function getCountryName(countryValue?: string): string {
  if (!countryValue) return "";

  const countryNames: Record<string, string> = {
    US: "United States",
    IN: "India",
    GB: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
    BR: "Brazil",
    MX: "Mexico",
    IT: "Italy",
    ES: "Spain",
    NL: "Netherlands",
    BE: "Belgium",
    CH: "Switzerland",
    AT: "Austria",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    PL: "Poland",
    PT: "Portugal",
    GR: "Greece",
    IE: "Ireland",
    NZ: "New Zealand",
    SG: "Singapore",
    MY: "Malaysia",
    PH: "Philippines",
    TH: "Thailand",
    ID: "Indonesia",
    VN: "Vietnam",
    JP: "Japan",
    KR: "South Korea",
    CN: "China",
    HK: "Hong Kong",
    TW: "Taiwan",
    AE: "UAE",
    SA: "Saudi Arabia",
    IL: "Israel",
    TR: "Turkey",
    ZA: "South Africa",
    EG: "Egypt",
    NG: "Nigeria",
    KE: "Kenya",
    AR: "Argentina",
    CL: "Chile",
    CO: "Colombia",
    PE: "Peru",
    PK: "Pakistan",
    BD: "Bangladesh",
    LK: "Sri Lanka",
    NP: "Nepal",
  };

  if (countryValue.length === 2) {
    return countryNames[countryValue.toUpperCase()] || countryValue;
  }
  return countryValue;
}

/** Country options for dropdowns (label + value as country name). */
export const COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: "United States", label: "United States" },
  { value: "India", label: "India" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Brazil", label: "Brazil" },
  { value: "Mexico", label: "Mexico" },
  { value: "Italy", label: "Italy" },
  { value: "Spain", label: "Spain" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Belgium", label: "Belgium" },
  { value: "Switzerland", label: "Switzerland" },
  { value: "Austria", label: "Austria" },
  { value: "Sweden", label: "Sweden" },
  { value: "Norway", label: "Norway" },
  { value: "Denmark", label: "Denmark" },
  { value: "Finland", label: "Finland" },
  { value: "Poland", label: "Poland" },
  { value: "Portugal", label: "Portugal" },
  { value: "Greece", label: "Greece" },
  { value: "Ireland", label: "Ireland" },
  { value: "New Zealand", label: "New Zealand" },
  { value: "Singapore", label: "Singapore" },
  { value: "Malaysia", label: "Malaysia" },
  { value: "Philippines", label: "Philippines" },
  { value: "Thailand", label: "Thailand" },
  { value: "Indonesia", label: "Indonesia" },
  { value: "Vietnam", label: "Vietnam" },
  { value: "Japan", label: "Japan" },
  { value: "South Korea", label: "South Korea" },
  { value: "China", label: "China" },
  { value: "Hong Kong", label: "Hong Kong" },
  { value: "Taiwan", label: "Taiwan" },
  { value: "UAE", label: "UAE" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "Israel", label: "Israel" },
  { value: "Turkey", label: "Turkey" },
  { value: "South Africa", label: "South Africa" },
  { value: "Egypt", label: "Egypt" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Kenya", label: "Kenya" },
  { value: "Argentina", label: "Argentina" },
  { value: "Chile", label: "Chile" },
  { value: "Colombia", label: "Colombia" },
  { value: "Peru", label: "Peru" },
  { value: "Pakistan", label: "Pakistan" },
  { value: "Bangladesh", label: "Bangladesh" },
  { value: "Sri Lanka", label: "Sri Lanka" },
  { value: "Nepal", label: "Nepal" },
].sort((a, b) => a.label.localeCompare(b.label));
