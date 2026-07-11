import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import ScrollReveal from "@/components/ScrollReveal";
import { useTheme } from "@/components/ThemeProvider";
import { fetchCertifications, type CertificationEntry } from "@/lib/google-sheets";
import { getCountryName } from "@/lib/country-flag";

/**
 * EXACT replica of the Achievements page "Yatris, worldwide" map section
 * (same heading, provider filter tabs, map colors, marker sizing, legend),
 * fed by the same public certifications data. Loaded lazily on the homepage
 * by YatrisWorldwideSection. When editing the Achievements map, mirror the
 * change here (and vice versa).
 */

const LOGO_BASE_URL =
  "https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications";

const PROVIDER_LOGOS: Record<string, { logo: string; logoLight?: string }> = {
  AWS: {
    logo: `https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/logo/certifications/aws-light.png`,
    logoLight: `https://raw.githubusercontent.com/yatricloud/yatri-images/9ee0e0a7c0c59ce45631091027b84069b3c4574f/certification.yatricloud.com/logo/certifications/aws.svg`,
  },
  AZURE: { logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  GCP: { logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  GOOGLE: { logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  GITHUB: { logo: `${LOGO_BASE_URL}/github-white-icon.webp`, logoLight: `${LOGO_BASE_URL}/github-white-icon.webp` },
  ORACLE: { logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  SALESFORCE: { logo: `${LOGO_BASE_URL}/Salesforce_logo.svg` },
  SERVICENOW: { logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  KUBERNETES: { logo: `${LOGO_BASE_URL}/kubernetes.svg` },
  TERRAFORM: { logo: `${LOGO_BASE_URL}/terraform.svg` },
  OPENAI: { logo: `https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg`, logoLight: `https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg` },
  HASHICORP: { logo: `https://upload.wikimedia.org/wikipedia/commons/6/6e/HashiCorp_logo.svg`, logoLight: `https://upload.wikimedia.org/wikipedia/commons/6/6e/HashiCorp_logo.svg` },
};

const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  "United States": [-95.7129, 37.0902], US: [-95.7129, 37.0902],
  India: [78.9629, 20.5937], IN: [78.9629, 20.5937],
  "United Kingdom": [-3.436, 55.3781], GB: [-3.436, 55.3781],
  Canada: [-106.3468, 56.1304], CA: [-106.3468, 56.1304],
  Australia: [133.7751, -25.2744], AU: [133.7751, -25.2744],
  Germany: [10.4515, 51.1657], DE: [10.4515, 51.1657],
  France: [2.2137, 46.2276], FR: [2.2137, 46.2276],
  Brazil: [-51.9253, -14.235], BR: [-51.9253, -14.235],
  Mexico: [-102.5528, 23.6345], MX: [-102.5528, 23.6345],
  Italy: [12.5674, 41.8719], IT: [12.5674, 41.8719],
  Spain: [-3.7492, 40.4637], ES: [-3.7492, 40.4637],
  Netherlands: [5.2913, 52.1326], NL: [5.2913, 52.1326],
  Belgium: [4.4699, 50.5039], BE: [4.4699, 50.5039],
  Switzerland: [8.2275, 46.8182], CH: [8.2275, 46.8182],
  Austria: [14.5501, 47.5162], AT: [14.5501, 47.5162],
  Sweden: [18.6435, 60.1282], SE: [18.6435, 60.1282],
  Norway: [8.4689, 60.472], NO: [8.4689, 60.472],
  Denmark: [9.5018, 56.2639], DK: [9.5018, 56.2639],
  Finland: [25.7482, 61.9241], FI: [25.7482, 61.9241],
  Poland: [19.1451, 51.9194], PL: [19.1451, 51.9194],
  Portugal: [-8.2245, 39.3999], PT: [-8.2245, 39.3999],
  Greece: [21.8243, 39.0742], GR: [21.8243, 39.0742],
  Ireland: [-8.2439, 53.4129], IE: [-8.2439, 53.4129],
  "New Zealand": [174.886, -40.9006], NZ: [174.886, -40.9006],
  Singapore: [103.8198, 1.3521], SG: [103.8198, 1.3521],
  Malaysia: [101.9758, 4.2105], MY: [101.9758, 4.2105],
  Philippines: [121.774, 12.8797], PH: [121.774, 12.8797],
  Thailand: [100.9925, 15.87], TH: [100.9925, 15.87],
  Indonesia: [113.9213, -0.7893], ID: [113.9213, -0.7893],
  Vietnam: [108.2772, 14.0583], VN: [108.2772, 14.0583],
  Japan: [138.2529, 36.2048], JP: [138.2529, 36.2048],
  "South Korea": [127.7669, 35.9078], KR: [127.7669, 35.9078],
  China: [104.1954, 35.8617], CN: [104.1954, 35.8617],
  "Hong Kong": [114.1694, 22.3193], HK: [114.1694, 22.3193],
  Taiwan: [120.9605, 23.6978], TW: [120.9605, 23.6978],
  UAE: [53.8478, 23.4241], AE: [53.8478, 23.4241],
  "Saudi Arabia": [45.0792, 23.8859], SA: [45.0792, 23.8859],
  Israel: [34.8516, 31.0461], IL: [34.8516, 31.0461],
  Turkey: [35.2433, 38.9637], TR: [35.2433, 38.9637],
  "South Africa": [22.9375, -30.5595], ZA: [22.9375, -30.5595],
  Egypt: [30.8025, 26.0975], EG: [30.8025, 26.0975],
  Nigeria: [8.6753, 9.082], NG: [8.6753, 9.082],
  Kenya: [37.9062, -0.0236], KE: [37.9062, -0.0236],
  Argentina: [-63.6167, -38.4161], AR: [-63.6167, -38.4161],
  Chile: [-71.543, -35.6751], CL: [-71.543, -35.6751],
  Colombia: [-74.2973, 4.5709], CO: [-74.2973, 4.5709],
  Peru: [-75.0152, -9.19], PE: [-75.0152, -9.19],
  Pakistan: [69.3451, 30.3753], PK: [69.3451, 30.3753],
  Bangladesh: [90.3563, 23.685], BD: [90.3563, 23.685],
  "Sri Lanka": [80.7718, 7.8731], LK: [80.7718, 7.8731],
  Nepal: [84.124, 28.3949], NP: [84.124, 28.3949],
};

const PROVIDER_MAP_COLORS: Record<string, string> = {
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
};

const YatrisWorldwideInner = () => {
  const { theme } = useTheme();
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [selectedMapProvider, setSelectedMapProvider] = useState<string>("all");

  useEffect(() => {
    let active = true;
    // certifications_public view already serves only public rows
    fetchCertifications()
      .then((data) => {
        if (active) setCertifications(data);
      })
      .catch(() => {
        /* section simply stays hidden */
      });
    return () => {
      active = false;
    };
  }, []);

  // ——— identical marker computation to Achievements.tsx ———
  const locationCounts = certifications.reduce((acc, cert) => {
    if (!cert.country) return acc;
    const countryName = getCountryName(cert.country);
    const state = cert.stateProvince || "";
    const city = cert.city || "";
    const provider = cert.certificationProvider?.toUpperCase() || "OTHER";
    const locationKey = state && city
      ? `${countryName}-${state}-${city}-${provider}`
      : state
        ? `${countryName}-${state}-${provider}`
        : `${countryName}-${provider}`;
    if (!acc[locationKey]) {
      acc[locationKey] = {
        country: countryName,
        state: state || "",
        city: city || "",
        provider,
        count: 0,
        coordinates: COUNTRY_COORDINATES[countryName] || COUNTRY_COORDINATES[getCountryName(countryName)] || null,
      };
    }
    acc[locationKey].count += 1;
    return acc;
  }, {} as Record<string, { country: string; state: string; city: string; provider: string; count: number; coordinates: [number, number] | null }>);

  const allMapMarkers = Object.entries(locationCounts)
    .map(([, location]) => {
      if (!location.coordinates) return null;
      const [lon, lat] = location.coordinates;
      const offsetLon = location.state ? (Math.random() - 0.5) * 3 : 0;
      const offsetLat = location.state ? (Math.random() - 0.5) * 2 : 0;
      return {
        country: location.country,
        state: location.state,
        city: location.city,
        provider: location.provider,
        count: location.count,
        coordinates: [lon + offsetLon, lat + offsetLat] as [number, number],
        color: PROVIDER_MAP_COLORS[location.provider] || "#6b7280",
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const mapMarkers = selectedMapProvider === "all"
    ? allMapMarkers
    : allMapMarkers.filter((marker) => marker.provider === selectedMapProvider);

  const mapProviders = Array.from(new Set(allMapMarkers.map((m) => m.provider))).sort();
  const maxCount = mapMarkers.length > 0 ? Math.max(...mapMarkers.map((m) => m.count), 1) : 1;

  if (allMapMarkers.length === 0) return null;

  // ——— identical JSX to the Achievements World Map Section ———
  return (
    <section className="py-14 md:py-24 band-tint">
      <div className="container mx-auto px-4 md:px-6 max-w-[1600px]">
        <ScrollReveal delay={0.2}>
          <div className="mb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
                Yatris, <span className="gradient-text">worldwide</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                From your city to theirs — see where our certified Yatris call home.
              </p>
            </div>

            {/* Map Provider Filter */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-muted rounded-xl p-1 border border-border max-w-full overflow-x-auto scrollbar-hide">
                <div className="inline-flex min-w-max">
                  <button
                    onClick={() => setSelectedMapProvider("all")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm rounded-lg font-semibold transition-all ${selectedMapProvider === "all"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <BadgeCheck className="w-4 h-4" />
                    All ({allMapMarkers.length})
                  </button>
                  {mapProviders.map((provider) => {
                    const providerLogo = PROVIDER_LOGOS[provider];
                    if (!providerLogo) return null;
                    const providerCount = allMapMarkers.filter((m) => m.provider === provider).length;
                    const logoSrc = provider === "AWS"
                      ? (theme === "dark"
                        ? providerLogo.logo
                        : (providerLogo.logoLight || providerLogo.logo))
                      : (theme === "dark"
                        ? (providerLogo.logoLight || providerLogo.logo)
                        : (provider === "GITHUB"
                          ? providerLogo.logo
                          : (providerLogo.logoLight || providerLogo.logo)));
                    return (
                      <button
                        key={provider}
                        onClick={() => setSelectedMapProvider(provider)}
                        className={`flex items-center gap-2 px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm rounded-lg font-semibold transition-all ${selectedMapProvider === provider
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <img
                          src={logoSrc}
                          alt={provider}
                          className={`object-contain ${provider === "GITHUB" && theme === "light" ? "invert" : ""} ${provider === "ORACLE" || provider === "SERVICENOW"
                            ? "w-7 h-7"
                            : "w-5 h-5"
                            }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <span className="hidden sm:inline">
                          {provider} ({providerCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-background rounded-2xl p-4 md:p-8 border border-border overflow-hidden">
              <div className="w-full" style={{ height: "500px", minHeight: "500px", position: "relative" }}>
                <ComposableMap
                  projection="geoEquirectangular"
                  projectionConfig={{ scale: 147 }}
                  style={{ width: "100%", height: "100%" }}
                  className="w-full h-full"
                >
                  <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
                    {({ geographies }) => {
                      const isDark = theme === "dark";
                      const fillColor = isDark ? "#374151" : "#e5e7eb";
                      const strokeColor = isDark ? "#4b5563" : "#9ca3af";
                      const hoverFill = isDark ? "#4b5563" : "#d1d5db";
                      return geographies.map((geo) => {
                        const countryName = geo.properties?.NAME || geo.properties?.name || geo.properties?.NAME_LONG || "";
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={fillColor}
                            stroke={strokeColor}
                            style={{
                              default: { fill: fillColor, stroke: strokeColor, strokeWidth: 0.6, outline: "none" },
                              hover: { fill: hoverFill, stroke: strokeColor, strokeWidth: 0.6, outline: "none" },
                              pressed: { fill: hoverFill, stroke: strokeColor, strokeWidth: 0.6, outline: "none" },
                            }}
                          >
                            {countryName && <title>{countryName}</title>}
                          </Geography>
                        );
                      });
                    }}
                  </Geographies>
                  {mapMarkers.map(({ country, state, city, provider, count, coordinates, color }, index) => {
                    const size = Math.max(3, Math.min(8, (count / maxCount) * 8));
                    return (
                      <Marker key={`${country}-${state}-${city}-${provider}-${index}`} coordinates={coordinates}>
                        <g>
                          <title>{provider}</title>
                          <motion.circle
                            r={size}
                            fill={color}
                            stroke="#ffffff"
                            strokeWidth={0.8}
                            opacity={0.9}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className="cursor-pointer"
                          />
                        </g>
                      </Marker>
                    );
                  })}
                </ComposableMap>
              </div>
              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                {Object.entries(PROVIDER_MAP_COLORS).map(([provider, color]) => {
                  const providerCount = mapMarkers.filter((m) => m.provider === provider).length;
                  if (providerCount === 0) return null;
                  return (
                    <div key={provider} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, opacity: 0.9 }} />
                      <span>{provider}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default YatrisWorldwideInner;
