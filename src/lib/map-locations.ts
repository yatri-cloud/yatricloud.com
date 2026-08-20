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
  // Indian States & Territories
  maharashtra: [75.7139, 19.7515],
  gujarat: [71.1924, 22.2587],
  karnataka: [75.7139, 15.3173],
  "tamil nadu": [78.6569, 11.1271],
  delhi: [77.1025, 28.7041],
  "national capital territory of delhi": [77.1025, 28.7041],
  telangana: [79.0193, 18.1124],
  "andhra pradesh": [79.7400, 15.9129],
  "uttar pradesh": [80.3297, 26.8467],
  rajasthan: [74.2179, 27.0238],
  "west bengal": [87.8550, 22.9868],
  kerala: [76.2711, 10.8505],
  punjab: [75.3412, 31.1471],
  haryana: [76.0856, 29.0588],
  "madhya pradesh": [78.6569, 22.9734],
  bihar: [85.3131, 25.0961],
  odisha: [85.0985, 20.9517],
  assam: [92.9376, 26.2006],
  jharkhand: [85.2799, 23.6102],
  uttarakhand: [79.0193, 30.0668],
  "himachal pradesh": [77.1734, 31.1048],
  goa: [74.1240, 15.2993],
  chandigarh: [76.7794, 30.7333],
  "jammu and kashmir": [74.7973, 33.7782],
  chhattisgarh: [81.8661, 21.2787],

  // US States
  california: [-119.4179, 36.7783], ca: [-119.4179, 36.7783],
  texas: [-99.9018, 31.9686], tx: [-99.9018, 31.9686],
  "new york": [-74.006, 40.7128], ny: [-74.006, 40.7128],
  florida: [-81.5158, 27.6648], fl: [-81.5158, 27.6648],
  washington: [-120.7401, 47.7511], wa: [-120.7401, 47.7511],
  illinois: [-89.3985, 40.6331], il: [-89.3985, 40.6331],
  massachusetts: [-71.3824, 42.4072], ma: [-71.3824, 42.4072],
  georgia: [-82.9001, 32.1656], ga: [-82.9001, 32.1656],
  "north carolina": [-79.0193, 35.7596], nc: [-79.0193, 35.7596],
  virginia: [-78.6569, 37.4316], va: [-78.6569, 37.4316],
  "new jersey": [-74.4057, 40.0583], nj: [-74.4057, 40.0583],
  ohio: [-82.9071, 40.4173], oh: [-82.9071, 40.4173],
  pennsylvania: [-77.1945, 41.2033], pa: [-77.1945, 41.2033],
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

/** Baseline community distribution so worldwide map always represents real active global Yatris */
const BASE_COMMUNITY_YATRIS = [
  { country: "India", state: "Maharashtra", city: "Mumbai", count: 770 },
  { country: "United States", state: "California", city: "San Francisco", count: 109 },
  { country: "Germany", state: "", city: "Berlin", count: 36 },
  { country: "Burkina Faso", state: "", city: "Ouagadougou", count: 27 },
  { country: "China", state: "", city: "Beijing", count: 21 },
  { country: "Pakistan", state: "", city: "Lahore", count: 21 },
  { country: "Sweden", state: "", city: "Stockholm", count: 21 },
  { country: "Canada", state: "Ontario", city: "Toronto", count: 19 },
  { country: "Netherlands", state: "", city: "Amsterdam", count: 19 },
  { country: "Sri Lanka", state: "", city: "Colombo", count: 16 },
  { country: "United Kingdom", state: "", city: "London", count: 28 },
  { country: "Australia", state: "", city: "Sydney", count: 15 },
  { country: "Singapore", state: "", city: "Singapore", count: 12 },
  { country: "UAE", state: "", city: "Dubai", count: 15 },
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
