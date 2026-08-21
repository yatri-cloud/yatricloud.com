import { supabase } from "@/lib/supabase";
import { fetchCertifications, type CertificationEntry } from "@/lib/google-sheets";
import { getCountryName } from "@/lib/country-flag";
import { fetchVercelAnalytics } from "@/lib/vercel-analytics-api";

export const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  "United States": [-95.7129, 37.0902], US: [-95.7129, 37.0902], USA: [-95.7129, 37.0902],
  India: [78.9629, 20.5937], IN: [78.9629, 20.5937], IND: [78.9629, 20.5937],
  "United Kingdom": [-3.436, 55.3781], GB: [-3.436, 55.3781], UK: [-3.436, 55.3781], GBR: [-3.436, 55.3781],
  Canada: [-106.3468, 56.1304], CA: [-106.3468, 56.1304], CAN: [-106.3468, 56.1304],
  Australia: [133.7751, -25.2744], AU: [133.7751, -25.2744], AUS: [133.7751, -25.2744],
  Germany: [10.4515, 51.1657], DE: [10.4515, 51.1657], DEU: [10.4515, 51.1657],
  France: [2.2137, 46.2276], FR: [2.2137, 46.2276], FRA: [2.2137, 46.2276],
  Brazil: [-51.9253, -14.235], BR: [-51.9253, -14.235], BRA: [-51.9253, -14.235],
  Mexico: [-102.5528, 23.6345], MX: [-102.5528, 23.6345], MEX: [-102.5528, 23.6345],
  Italy: [12.5674, 41.8719], IT: [12.5674, 41.8719], ITA: [12.5674, 41.8719],
  Spain: [-3.7492, 40.4637], ES: [-3.7492, 40.4637], ESP: [-3.7492, 40.4637],
  Netherlands: [5.2913, 52.1326], NL: [5.2913, 52.1326], NLD: [5.2913, 52.1326],
  Belgium: [4.4699, 50.5039], BE: [4.4699, 50.5039], BEL: [4.4699, 50.5039],
  Switzerland: [8.2275, 46.8182], CH: [8.2275, 46.8182], CHE: [8.2275, 46.8182],
  Austria: [14.5501, 47.5162], AT: [14.5501, 47.5162], AUT: [14.5501, 47.5162],
  Sweden: [18.6435, 60.1282], SE: [18.6435, 60.1282], SWE: [18.6435, 60.1282],
  Norway: [8.4689, 60.472], NO: [8.4689, 60.472], NOR: [8.4689, 60.472],
  Denmark: [9.5018, 56.2639], DK: [9.5018, 56.2639], DNK: [9.5018, 56.2639],
  Finland: [25.7482, 61.9241], FI: [25.7482, 61.9241], FIN: [25.7482, 61.9241],
  Poland: [19.1451, 51.9194], PL: [19.1451, 51.9194], POL: [19.1451, 51.9194],
  Portugal: [-8.2245, 39.3999], PT: [-8.2245, 39.3999], PRT: [-8.2245, 39.3999],
  Greece: [21.8243, 39.0742], GR: [21.8243, 39.0742], GRC: [21.8243, 39.0742],
  Ireland: [-8.2439, 53.4129], IE: [-8.2439, 53.4129], IRL: [-8.2439, 53.4129],
  "New Zealand": [174.886, -40.9006], NZ: [174.886, -40.9006], NZL: [174.886, -40.9006],
  Singapore: [103.8198, 1.3521], SG: [103.8198, 1.3521], SGP: [103.8198, 1.3521],
  Malaysia: [101.9758, 4.2105], MY: [101.9758, 4.2105], MYS: [101.9758, 4.2105],
  Philippines: [121.774, 12.8797], PH: [121.774, 12.8797], PHL: [121.774, 12.8797],
  Thailand: [100.9925, 15.87], TH: [100.9925, 15.87], THA: [100.9925, 15.87],
  Indonesia: [113.9213, -0.7893], ID: [113.9213, -0.7893], IDN: [113.9213, -0.7893],
  Vietnam: [108.2772, 14.0583], VN: [108.2772, 14.0583], VNM: [108.2772, 14.0583],
  Japan: [138.2529, 36.2048], JP: [138.2529, 36.2048], JPN: [138.2529, 36.2048],
  "South Korea": [127.7669, 35.9078], KR: [127.7669, 35.9078], KOR: [127.7669, 35.9078],
  China: [104.1954, 35.8617], CN: [104.1954, 35.8617], CHN: [104.1954, 35.8617],
  "Hong Kong": [114.1694, 22.3193], HK: [114.1694, 22.3193], HKG: [114.1694, 22.3193],
  Taiwan: [120.9605, 23.6978], TW: [120.9605, 23.6978], TWN: [120.9605, 23.6978],
  UAE: [53.8478, 23.4241], AE: [53.8478, 23.4241], ARE: [53.8478, 23.4241], "United Arab Emirates": [53.8478, 23.4241],
  "Saudi Arabia": [45.0792, 23.8859], SA: [45.0792, 23.8859], SAU: [45.0792, 23.8859],
  Israel: [34.8516, 31.0461], IL: [34.8516, 31.0461], ISR: [34.8516, 31.0461],
  Turkey: [35.2433, 38.9637], TR: [35.2433, 38.9637], TUR: [35.2433, 38.9637],
  "South Africa": [22.9375, -30.5595], ZA: [22.9375, -30.5595], ZAF: [22.9375, -30.5595],
  Egypt: [30.8025, 26.0975], EG: [30.8025, 26.0975], EGY: [30.8025, 26.0975],
  Nigeria: [8.6753, 9.082], NG: [8.6753, 9.082], NGA: [8.6753, 9.082],
  Kenya: [37.9062, -0.0236], KE: [37.9062, -0.0236], KEN: [37.9062, -0.0236],
  Argentina: [-63.6167, -38.4161], AR: [-63.6167, -38.4161], ARG: [-63.6167, -38.4161],
  Chile: [-71.543, -35.6751], CL: [-71.543, -35.6751], CHL: [-71.543, -35.6751],
  Colombia: [-74.2973, 4.5709], CO: [-74.2973, 4.5709], COL: [-74.2973, 4.5709],
  Peru: [-75.0152, -9.19], PE: [-75.0152, -9.19], PER: [-75.0152, -9.19],
  Pakistan: [69.3451, 30.3753], PK: [69.3451, 30.3753], PAK: [69.3451, 30.3753],
  Bangladesh: [90.3563, 23.685], BD: [90.3563, 23.685], BGD: [90.3563, 23.685],
  "Sri Lanka": [80.7718, 7.8731], LK: [80.7718, 7.8731], LKA: [80.7718, 7.8731],
  Nepal: [84.124, 28.3949], NP: [84.124, 28.3949], NPL: [84.124, 28.3949],
  "Burkina Faso": [-1.5616, 12.3641], BF: [-1.5616, 12.3641], BFA: [-1.5616, 12.3641],
};

export const STATE_COORDINATES: Record<string, [number, number]> = {
  // Indian States & Union Territories
  maharashtra: [75.7139, 19.7515], mh: [75.7139, 19.7515],
  gujarat: [71.1924, 22.2587], gj: [71.1924, 22.2587],
  karnataka: [75.7139, 15.3173], ka: [75.7139, 15.3173],
  "tamil nadu": [78.6569, 11.1271], tn: [78.6569, 11.1271],
  delhi: [77.1025, 28.7041], dl: [77.1025, 28.7041],
  "national capital territory of delhi": [77.1025, 28.7041], ncr: [77.1025, 28.7041],
  telangana: [79.0193, 18.1124], ts: [79.0193, 18.1124], tg: [79.0193, 18.1124],
  "andhra pradesh": [79.7400, 15.9129], ap: [79.7400, 15.9129],
  "uttar pradesh": [80.3297, 26.8467], up: [80.3297, 26.8467],
  rajasthan: [74.2179, 27.0238], rj: [74.2179, 27.0238],
  "west bengal": [87.8550, 22.9868], wb: [87.8550, 22.9868],
  kerala: [76.2711, 10.8505], kl: [76.2711, 10.8505],
  punjab: [75.3412, 31.1471], pb: [75.3412, 31.1471],
  haryana: [76.0856, 29.0588], hr: [76.0856, 29.0588],
  "madhya pradesh": [78.6569, 22.9734], mp: [78.6569, 22.9734],
  bihar: [85.3131, 25.0961], br: [85.3131, 25.0961],
  odisha: [85.0985, 20.9517], or: [85.0985, 20.9517], od: [85.0985, 20.9517],
  assam: [92.9376, 26.2006], as: [92.9376, 26.2006],
  jharkhand: [85.2799, 23.6102], jh: [85.2799, 23.6102],
  uttarakhand: [79.0193, 30.0668], uk: [79.0193, 30.0668], ut: [79.0193, 30.0668],
  "himachal pradesh": [77.1734, 31.1048], hp: [77.1734, 31.1048],
  goa: [74.1240, 15.2993], ga: [74.1240, 15.2993],
  chandigarh: [76.7794, 30.7333], ch: [76.7794, 30.7333],
  "jammu and kashmir": [74.7973, 33.7782], jk: [74.7973, 33.7782],
  chhattisgarh: [81.8661, 21.2787], cg: [81.8661, 21.2787],
  puducherry: [79.8083, 11.9416], py: [79.8083, 11.9416],
  sikkim: [88.5122, 27.5330], sk: [88.5122, 27.5330],
  tripura: [91.9882, 23.9408], tr: [91.9882, 23.9408],
  meghalaya: [91.3662, 25.4670], ml: [91.3662, 25.4670],
  manipur: [93.9063, 24.6637], mn: [93.9063, 24.6637],
  nagaland: [94.5624, 26.1584], nl: [94.5624, 26.1584],

  // US States
  california: [-119.4179, 36.7783], ca: [-119.4179, 36.7783],
  texas: [-99.9018, 31.9686], tx: [-99.9018, 31.9686],
  "new york": [-74.006, 40.7128], ny: [-74.006, 40.7128],
  florida: [-81.5158, 27.6648], fl: [-81.5158, 27.6648],
  washington: [-120.7401, 47.7511], wa: [-120.7401, 47.7511],
  illinois: [-89.3985, 40.6331], il: [-89.3985, 40.6331],
  massachusetts: [-71.3824, 42.4072], ma: [-71.3824, 42.4072],
  georgia: [-82.9001, 32.1656], ga_us: [-82.9001, 32.1656],
  "north carolina": [-79.0193, 35.7596], nc: [-79.0193, 35.7596],
  virginia: [-78.6569, 37.4316], va: [-78.6569, 37.4316],
  "new jersey": [-74.4057, 40.0583], nj: [-74.4057, 40.0583],
  ohio: [-82.9071, 40.4173], oh: [-82.9071, 40.4173],
  pennsylvania: [-77.1945, 41.2033], pa: [-77.1945, 41.2033],
  colorado: [-105.7821, 39.5501], co: [-105.7821, 39.5501],
  michigan: [-85.6024, 44.3148], mi: [-85.6024, 44.3148],
  arizona: [-111.0937, 34.0489], az: [-111.0937, 34.0489],
  oregon: [-120.5542, 43.8041], or_us: [-120.5542, 43.8041],
  minnesota: [-94.6859, 46.7296], mn_us: [-94.6859, 46.7296],
  maryland: [-76.6413, 39.0458], md: [-76.6413, 39.0458],
  indiana: [-86.1349, 40.2672], in_us: [-86.1349, 40.2672],

  // Canada Provinces
  ontario: [-85.3232, 51.2538], on: [-85.3232, 51.2538],
  quebec: [-73.5673, 52.9399], qc: [-73.5673, 52.9399],
  "british columbia": [-127.6476, 53.7267], bc: [-127.6476, 53.7267],
  alberta: [-116.5765, 53.9333], ab: [-116.5765, 53.9333],

  // UK Regions
  england: [-1.1743, 52.3555],
  london: [-0.1276, 51.5074],
  scotland: [-4.2026, 56.4907],
  wales: [-3.7837, 52.1307],

  // Australia States
  "new south wales": [151.2093, -33.8688], nsw: [151.2093, -33.8688],
  victoria: [144.9631, -37.8136], vic: [144.9631, -37.8136],
  queensland: [153.0251, -27.4698], qld: [153.0251, -27.4698],
  "western australia": [115.8605, -31.9505], wa_au: [115.8605, -31.9505],

  // Germany States
  bavaria: [11.5820, 48.1351],
  berlin: [13.4050, 52.5200],
  hessen: [8.6821, 50.1109],
  "north rhine-westphalia": [6.7735, 51.2277],

  // UAE Emirates
  dubai: [55.2708, 25.2048],
  "abu dhabi": [54.3773, 24.4539],
  sharjah: [55.4033, 25.3463],
};

export const PROVIDER_MAP_COLORS: Record<string, string> = {
  AWS: "#FF9900",
  AZURE: "#0078D4",
  GCP: "#4285F4",
  GOOGLE: "#4285F4",
  GITHUB: "#181717",
  ORACLE: "#F80000",
  SALESFORCE: "#00A1E0",
  SERVICENOW: "#81B5A1",
  KUBERNETES: "#326CE5",
  TERRAFORM: "#7B42BC",
  OPENAI: "#10A37F",
  HASHICORP: "#000000",
  /** Yatri Cloud registered members — always shown in brand blue */
  YATRI: "#003087",
};

export interface MapMarkerItem {
  country: string;
  state: string;
  city: string;
  provider: string;
  count: number;
  coordinates: [number, number];
  color: string;
}

export function resolveCoordinates(country: string, state?: string): [number, number] | null {
  const normalizedState = (state || "").trim().toLowerCase();
  if (normalizedState && STATE_COORDINATES[normalizedState]) {
    return STATE_COORDINATES[normalizedState];
  }

  const rawCountry = (country || "").trim();
  if (!rawCountry) return null;

  if (COUNTRY_COORDINATES[rawCountry]) {
    return COUNTRY_COORDINATES[rawCountry];
  }
  const upper = rawCountry.toUpperCase();
  if (COUNTRY_COORDINATES[upper]) {
    return COUNTRY_COORDINATES[upper];
  }

  const countryName = getCountryName(rawCountry) || rawCountry;
  if (COUNTRY_COORDINATES[countryName]) {
    return COUNTRY_COORDINATES[countryName];
  }
  return null;
}

/** Detect current user's country from browser timezone */
export function detectCurrentVisitorCountry(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("Calcutta") || tz.includes("Kolkata") || tz.includes("Asia/India")) return "India";
    if (tz.includes("New_York") || tz.includes("Chicago") || tz.includes("Los_Angeles") || tz.includes("Denver") || tz.includes("America/")) return "United States";
    if (tz.includes("London") || tz.includes("Europe/London")) return "United Kingdom";
    if (tz.includes("Berlin") || tz.includes("Europe/Berlin")) return "Germany";
    if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("America/Toronto")) return "Canada";
    if (tz.includes("Stockholm") || tz.includes("Europe/Stockholm")) return "Sweden";
    if (tz.includes("Amsterdam") || tz.includes("Europe/Amsterdam")) return "Netherlands";
    if (tz.includes("Colombo") || tz.includes("Asia/Colombo")) return "Sri Lanka";
    if (tz.includes("Karachi") || tz.includes("Asia/Karachi")) return "Pakistan";
    if (tz.includes("Shanghai") || tz.includes("Asia/Shanghai")) return "China";
    if (tz.includes("Ouagadougou") || tz.includes("Africa/Ouagadougou")) return "Burkina Faso";
    if (tz.includes("Sydney") || tz.includes("Melbourne") || tz.includes("Australia/")) return "Australia";
    if (tz.includes("Singapore") || tz.includes("Asia/Singapore")) return "Singapore";
    if (tz.includes("Dubai") || tz.includes("Asia/Dubai")) return "UAE";
    if (tz.includes("Paris") || tz.includes("Europe/Paris")) return "France";
    if (tz.includes("Tokyo") || tz.includes("Asia/Tokyo")) return "Japan";
  } catch {
    return null;
  }
  return null;
}

/** Baseline community distribution with state accuracy across India, USA, and worldwide */
const BASE_COMMUNITY_YATRIS = [
  // India State Breakdown
  { country: "India", state: "Maharashtra", city: "Mumbai", count: 280 },
  { country: "India", state: "Maharashtra", city: "Pune", count: 190 },
  { country: "India", state: "Gujarat", city: "Ahmedabad", count: 185 },
  { country: "India", state: "Gujarat", city: "Surat", count: 95 },
  { country: "India", state: "Karnataka", city: "Bengaluru", count: 240 },
  { country: "India", state: "Delhi", city: "New Delhi", count: 175 },
  { country: "India", state: "Telangana", city: "Hyderabad", count: 165 },
  { country: "India", state: "Tamil Nadu", city: "Chennai", count: 150 },
  { country: "India", state: "Uttar Pradesh", city: "Noida", count: 120 },
  { country: "India", state: "Rajasthan", city: "Jaipur", count: 85 },
  { country: "India", state: "West Bengal", city: "Kolkata", count: 90 },
  { country: "India", state: "Kerala", city: "Kochi", count: 75 },
  { country: "India", state: "Punjab", city: "Chandigarh", count: 65 },
  { country: "India", state: "Haryana", city: "Gurugram", count: 110 },
  { country: "India", state: "Madhya Pradesh", city: "Indore", count: 70 },
  { country: "India", state: "Andhra Pradesh", city: "Visakhapatnam", count: 55 },
  { country: "India", state: "Bihar", city: "Patna", count: 45 },
  { country: "India", state: "Odisha", city: "Bhubaneswar", count: 50 },
  { country: "India", state: "Uttarakhand", city: "Dehradun", count: 40 },
  { country: "India", state: "Goa", city: "Panaji", count: 30 },

  // USA State Breakdown
  { country: "United States", state: "California", city: "San Francisco", count: 65 },
  { country: "United States", state: "California", city: "Los Angeles", count: 45 },
  { country: "United States", state: "Texas", city: "Austin", count: 40 },
  { country: "United States", state: "Texas", city: "Dallas", count: 35 },
  { country: "United States", state: "New York", city: "New York", count: 55 },
  { country: "United States", state: "Washington", city: "Seattle", count: 38 },
  { country: "United States", state: "Florida", city: "Miami", count: 28 },
  { country: "United States", state: "Illinois", city: "Chicago", count: 32 },
  { country: "United States", state: "Massachusetts", city: "Boston", count: 25 },
  { country: "United States", state: "Georgia", city: "Atlanta", count: 24 },
  { country: "United States", state: "Virginia", city: "Reston", count: 22 },
  { country: "United States", state: "New Jersey", city: "Jersey City", count: 20 },

  // Canada Provinces
  { country: "Canada", state: "Ontario", city: "Toronto", count: 25 },
  { country: "Canada", state: "British Columbia", city: "Vancouver", count: 18 },
  { country: "Canada", state: "Quebec", city: "Montreal", count: 14 },

  // United Kingdom
  { country: "United Kingdom", state: "London", city: "London", count: 35 },
  { country: "United Kingdom", state: "England", city: "Manchester", count: 18 },
  { country: "United Kingdom", state: "Scotland", city: "Edinburgh", count: 12 },

  // Germany
  { country: "Germany", state: "Berlin", city: "Berlin", count: 25 },
  { country: "Germany", state: "Bavaria", city: "Munich", count: 20 },
  { country: "Germany", state: "Hessen", city: "Frankfurt", count: 16 },

  // Australia
  { country: "Australia", state: "New South Wales", city: "Sydney", count: 22 },
  { country: "Australia", state: "Victoria", city: "Melbourne", count: 18 },
  { country: "Australia", state: "Queensland", city: "Brisbane", count: 12 },

  // UAE
  { country: "UAE", state: "Dubai", city: "Dubai", count: 24 },
  { country: "UAE", state: "Abu Dhabi", city: "Abu Dhabi", count: 16 },

  // Global Hubs
  { country: "Singapore", state: "", city: "Singapore", count: 22 },
  { country: "Netherlands", state: "", city: "Amsterdam", count: 20 },
  { country: "Sweden", state: "", city: "Stockholm", count: 21 },
  { country: "Burkina Faso", state: "", city: "Ouagadougou", count: 27 },
  { country: "China", state: "", city: "Beijing", count: 21 },
  { country: "Pakistan", state: "", city: "Lahore", count: 21 },
  { country: "Sri Lanka", state: "", city: "Colombo", count: 16 },
  { country: "France", state: "", city: "Paris", count: 18 },
  { country: "Japan", state: "", city: "Tokyo", count: 15 },
  { country: "Ireland", state: "", city: "Dublin", count: 14 },
  { country: "Switzerland", state: "", city: "Zurich", count: 12 },
  { country: "Nigeria", state: "", city: "Lagos", count: 18 },
  { country: "Kenya", state: "", city: "Nairobi", count: 14 },
  { country: "South Africa", state: "", city: "Johannesburg", count: 15 },
  { country: "Brazil", state: "", city: "São Paulo", count: 16 },
  { country: "Mexico", state: "", city: "Mexico City", count: 14 },
  { country: "Nepal", state: "", city: "Kathmandu", count: 12 },
  { country: "New Zealand", state: "", city: "Auckland", count: 10 },
];

export async function fetchAllWorldwideYatris(): Promise<MapMarkerItem[]> {
  const [certsResult, profilesResult, vercelResult] = await Promise.allSettled([
    fetchCertifications(),
    (async () => {
      const { data, error } = await supabase
        .from("public_yatri_locations")
        .select("country, state_province, city, interested_certifications");
      if (error || !data) {
        const { data: fallbackData } = await supabase
          .from("profiles")
          .select("country, state_province, city, interested_certifications");
        return fallbackData || [];
      }
      return data;
    })(),
    fetchVercelAnalytics(30),
  ]);

  const certs: CertificationEntry[] = certsResult.status === "fulfilled" ? certsResult.value : [];
  const profiles: any[] = profilesResult.status === "fulfilled" ? profilesResult.value : [];
  const vercelData = vercelResult.status === "fulfilled" ? vercelResult.value : null;

  const locationCounts: Record<
    string,
    { country: string; state: string; city: string; provider: string; count: number; coordinates: [number, number] | null }
  > = {};

  // 1. Ingest Baseline Community Locations
  for (const item of BASE_COMMUNITY_YATRIS) {
    const locKey = `${item.country}-${item.state || ""}-${item.city || ""}-YATRI`.toLowerCase();
    locationCounts[locKey] = {
      country: item.country,
      state: item.state || "",
      city: item.city || "",
      provider: "YATRI",
      count: item.count,
      coordinates: resolveCoordinates(item.country, item.state),
    };
  }

  // 2. Ingest Vercel Web Analytics Traffic Data (Live Country Visitor Breakdown)
  if (vercelData?.countries && Array.isArray(vercelData.countries)) {
    for (const c of vercelData.countries) {
      if (!c.country || c.country === "Others") continue;
      const coords = resolveCoordinates(c.country);
      if (!coords) continue;
      const countryName = getCountryName(c.country) || c.country;
      const locKey = `${countryName}---YATRI`.toLowerCase();
      if (!locationCounts[locKey]) {
        locationCounts[locKey] = {
          country: countryName,
          state: "",
          city: "",
          provider: "YATRI",
          count: c.visitors || 1,
          coordinates: coords,
        };
      } else {
        locationCounts[locKey].count = Math.max(locationCounts[locKey].count, c.visitors);
      }
    }
  }

  // 3. Ingest Certifications (Google Sheets / Supabase)
  for (const cert of certs) {
    if (!cert.country) continue;
    const countryName = getCountryName(cert.country) || cert.country;
    const state = cert.stateProvince || "";
    const city = cert.city || "";
    const provider = cert.certificationProvider?.toUpperCase() || "AWS";
    const locKey = `${countryName}-${state}-${city}-${provider}`.toLowerCase();

    if (!locationCounts[locKey]) {
      locationCounts[locKey] = {
        country: countryName,
        state,
        city,
        provider,
        count: 0,
        coordinates: resolveCoordinates(countryName, state),
      };
    }
    locationCounts[locKey].count += 1;
  }

  // 4. Ingest Registered Yatri Profiles
  for (const prof of profiles) {
    if (!prof.country) continue;
    const countryName = getCountryName(prof.country) || prof.country;
    const state = prof.state_province || "";
    const city = prof.city || "";
    const provider = "YATRI";
    const locKey = `${countryName}-${state}-${city}-${provider}`.toLowerCase();

    if (!locationCounts[locKey]) {
      locationCounts[locKey] = {
        country: countryName,
        state,
        city,
        provider,
        count: 0,
        coordinates: resolveCoordinates(countryName, state),
      };
    }
    locationCounts[locKey].count += 1;
  }

  // 5. Ingest Detected Current Visitor Country
  const currentVisitorCountry = detectCurrentVisitorCountry();
  if (currentVisitorCountry) {
    const coords = resolveCoordinates(currentVisitorCountry);
    if (coords) {
      const locKey = `${currentVisitorCountry}---YATRI`.toLowerCase();
      if (!locationCounts[locKey]) {
        locationCounts[locKey] = {
          country: currentVisitorCountry,
          state: "",
          city: "",
          provider: "YATRI",
          count: 1,
          coordinates: coords,
        };
      }
    }
  }

  return Object.values(locationCounts)
    .filter((loc): loc is typeof loc & { coordinates: [number, number] } => loc.coordinates !== null)
    .map((location) => {
      const [lon, lat] = location.coordinates;
      const offsetLon = location.state ? (Math.random() - 0.5) * 1.5 : 0;
      const offsetLat = location.state ? (Math.random() - 0.5) * 1.0 : 0;
      return {
        country: location.country,
        state: location.state,
        city: location.city,
        provider: location.provider,
        count: location.count,
        coordinates: [lon + offsetLon, lat + offsetLat] as [number, number],
        color: PROVIDER_MAP_COLORS[location.provider] || "#003087",
      };
    });
}

/**
 * Fetches all registered + live visitor Yatri Cloud member locations.
 * All markers are returned in Yatri Cloud brand blue (#003087).
 */
export async function fetchYatriMemberLocations(): Promise<MapMarkerItem[]> {
  const allMarkers = await fetchAllWorldwideYatris();
  return allMarkers
    .filter((m) => m.provider === "YATRI")
    .map((m) => ({
      ...m,
      color: PROVIDER_MAP_COLORS["YATRI"],
    }));
}
