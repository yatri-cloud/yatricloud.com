import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Linkedin, Calendar, Award, Trophy, Medal, CheckCircle2, Star, ExternalLink, ShieldCheck, TrendingUp, Users, Building2, Calendar as CalendarIcon, BadgeCheck, GraduationCap, Briefcase, Zap, Star as StarIcon, CheckCircle, Clock, FileText, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import html2canvas from "html2canvas";
import { downloadCanvaImage } from "@/lib/canva-api";
import { fetchCertifications } from "@/lib/google-sheets";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/ThemeProvider";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { FALLBACK_FORM_PROVIDERS } from "@/lib/cert-catalog";

// Base URL for certification logos
const LOGO_BASE_URL = "https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications";

// Provider logo mapping
const PROVIDER_LOGOS: Record<string, { logo: string; logoLight?: string }> = {
  AWS: {
    logo: `https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/logo/certifications/aws-light.png`, // Dark mode
    logoLight: `https://raw.githubusercontent.com/yatricloud/yatri-images/9ee0e0a7c0c59ce45631091027b84069b3c4574f/certification.yatricloud.com/logo/certifications/aws.svg` // Light mode
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

// Country coordinates mapping (approximate center of each country)
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  "United States": [-95.7129, 37.0902],
  "US": [-95.7129, 37.0902],
  "India": [78.9629, 20.5937],
  "IN": [78.9629, 20.5937],
  "United Kingdom": [-3.4360, 55.3781],
  "GB": [-3.4360, 55.3781],
  "Canada": [-106.3468, 56.1304],
  "CA": [-106.3468, 56.1304],
  "Australia": [133.7751, -25.2744],
  "AU": [133.7751, -25.2744],
  "Germany": [10.4515, 51.1657],
  "DE": [10.4515, 51.1657],
  "France": [2.2137, 46.2276],
  "FR": [2.2137, 46.2276],
  "Brazil": [-51.9253, -14.2350],
  "BR": [-51.9253, -14.2350],
  "Mexico": [-102.5528, 23.6345],
  "MX": [-102.5528, 23.6345],
  "Italy": [12.5674, 41.8719],
  "IT": [12.5674, 41.8719],
  "Spain": [-3.7492, 40.4637],
  "ES": [-3.7492, 40.4637],
  "Netherlands": [5.2913, 52.1326],
  "NL": [5.2913, 52.1326],
  "Belgium": [4.4699, 50.5039],
  "BE": [4.4699, 50.5039],
  "Switzerland": [8.2275, 46.8182],
  "CH": [8.2275, 46.8182],
  "Austria": [14.5501, 47.5162],
  "AT": [14.5501, 47.5162],
  "Sweden": [18.6435, 60.1282],
  "SE": [18.6435, 60.1282],
  "Norway": [8.4689, 60.4720],
  "NO": [8.4689, 60.4720],
  "Denmark": [9.5018, 56.2639],
  "DK": [9.5018, 56.2639],
  "Finland": [25.7482, 61.9241],
  "FI": [25.7482, 61.9241],
  "Poland": [19.1451, 51.9194],
  "PL": [19.1451, 51.9194],
  "Portugal": [-8.2245, 39.3999],
  "PT": [-8.2245, 39.3999],
  "Greece": [21.8243, 39.0742],
  "GR": [21.8243, 39.0742],
  "Ireland": [-8.2439, 53.4129],
  "IE": [-8.2439, 53.4129],
  "New Zealand": [174.8860, -40.9006],
  "NZ": [174.8860, -40.9006],
  "Singapore": [103.8198, 1.3521],
  "SG": [103.8198, 1.3521],
  "Malaysia": [101.9758, 4.2105],
  "MY": [101.9758, 4.2105],
  "Philippines": [121.7740, 12.8797],
  "PH": [121.7740, 12.8797],
  "Thailand": [100.9925, 15.8700],
  "TH": [100.9925, 15.8700],
  "Indonesia": [113.9213, -0.7893],
  "ID": [113.9213, -0.7893],
  "Vietnam": [108.2772, 14.0583],
  "VN": [108.2772, 14.0583],
  "Japan": [138.2529, 36.2048],
  "JP": [138.2529, 36.2048],
  "South Korea": [127.7669, 35.9078],
  "KR": [127.7669, 35.9078],
  "China": [104.1954, 35.8617],
  "CN": [104.1954, 35.8617],
  "Hong Kong": [114.1694, 22.3193],
  "HK": [114.1694, 22.3193],
  "Taiwan": [120.9605, 23.6978],
  "TW": [120.9605, 23.6978],
  "UAE": [53.8478, 23.4241],
  "AE": [53.8478, 23.4241],
  "Saudi Arabia": [45.0792, 23.8859],
  "SA": [45.0792, 23.8859],
  "Israel": [34.8516, 31.0461],
  "IL": [34.8516, 31.0461],
  "Turkey": [35.2433, 38.9637],
  "TR": [35.2433, 38.9637],
  "South Africa": [22.9375, -30.5595],
  "ZA": [22.9375, -30.5595],
  "Egypt": [30.8025, 26.0975],
  "EG": [30.8025, 26.0975],
  "Nigeria": [8.6753, 9.0820],
  "NG": [8.6753, 9.0820],
  "Kenya": [37.9062, -0.0236],
  "KE": [37.9062, -0.0236],
  "Argentina": [-63.6167, -38.4161],
  "AR": [-63.6167, -38.4161],
  "Chile": [-71.5430, -35.6751],
  "CL": [-71.5430, -35.6751],
  "Colombia": [-74.2973, 4.5709],
  "CO": [-74.2973, 4.5709],
  "Peru": [-75.0152, -9.1900],
  "PE": [-75.0152, -9.1900],
  "Pakistan": [69.3451, 30.3753],
  "PK": [69.3451, 30.3753],
  "Bangladesh": [90.3563, 23.6850],
  "BD": [90.3563, 23.6850],
  "Sri Lanka": [80.7718, 7.8731],
  "LK": [80.7718, 7.8731],
  "Nepal": [84.1240, 28.3949],
  "NP": [84.1240, 28.3949],
};

// Provider badge/card colors — unified ON-PALETTE (blue/white), single source of truth
// Keys come from the certification catalog slugs plus the extra aliases the
// data uses (GOOGLE, TERRAFORM, MULTIPLE); every key maps to the same styles.
const _PROVIDER_KEYS = [
  ...FALLBACK_FORM_PROVIDERS.map((p) => p.slug.toUpperCase()),
  "GOOGLE",
  "TERRAFORM",
  "MULTIPLE",
];
const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = Object.fromEntries(
  _PROVIDER_KEYS.map((p) => [p, { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' }])
);

// Provider card gradients — unified ON-PALETTE (soft blue), all providers
const PROVIDER_BRAND_COLORS: Record<string, { from: string; via: string; to: string; border: string }> = Object.fromEntries(
  _PROVIDER_KEYS.map((p) => [p, { from: 'from-primary/20', via: 'via-primary/12', to: 'to-primary/5', border: 'border-primary/30' }])
);

interface CertificationEntry {
  id: string;
  fullName: string;
  email: string;
  certificationProvider: string;
  certificationName: string;
  examCode: string;
  certificationDate: string;
  linkedinUrl: string;
  verifiedCredential?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  photoUrl: string;
  additionalNotes?: string;
}

// Function to get country flag emoji from ISO country code or country name
const getCountryFlag = (countryValue?: string): string => {
  if (!countryValue || countryValue.trim() === '') return "🌍";

  const trimmed = countryValue.trim();

  // If it's already a 2-letter country code (like "US", "IN")
  if (trimmed.length === 2) {
    try {
      const codePoints = trimmed
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch (e) {
      console.warn('Failed to generate flag for code:', trimmed, e);
      return "🌍";
    }
  }

  // If it's a country name, try to find the code
  const countryNameToCode: Record<string, string> = {
    "United States": "US", "India": "IN", "United Kingdom": "GB", "Canada": "CA",
    "Australia": "AU", "Germany": "DE", "France": "FR", "Brazil": "BR",
    "Mexico": "MX", "Italy": "IT", "Spain": "ES", "Netherlands": "NL",
    "Belgium": "BE", "Switzerland": "CH", "Austria": "AT", "Sweden": "SE",
    "Norway": "NO", "Denmark": "DK", "Finland": "FI", "Poland": "PL",
    "Portugal": "PT", "Greece": "GR", "Ireland": "IE", "New Zealand": "NZ",
    "Singapore": "SG", "Malaysia": "MY", "Philippines": "PH", "Thailand": "TH",
    "Indonesia": "ID", "Vietnam": "VN", "Japan": "JP", "South Korea": "KR",
    "China": "CN", "Hong Kong": "HK", "Taiwan": "TW", "UAE": "AE",
    "Saudi Arabia": "SA", "Israel": "IL", "Turkey": "TR", "South Africa": "ZA",
    "Egypt": "EG", "Nigeria": "NG", "Kenya": "KE", "Argentina": "AR",
    "Chile": "CL", "Colombia": "CO", "Peru": "PE", "Pakistan": "PK",
    "Bangladesh": "BD", "Sri Lanka": "LK", "Nepal": "NP"
  };

  const code = countryNameToCode[trimmed] || trimmed.substring(0, 2).toUpperCase();
  if (code && code.length === 2) {
    try {
      const codePoints = code
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch (e) {
      console.warn('Failed to generate flag for code:', code, e);
    }
  }

  return "🌍";
};

// Function to get country name from code or name
const getCountryName = (countryValue?: string): string => {
  if (!countryValue) return "Unknown";

  // If it's already a country name, return it
  const countryNames: Record<string, string> = {
    "US": "United States", "IN": "India", "GB": "United Kingdom", "CA": "Canada",
    "AU": "Australia", "DE": "Germany", "FR": "France", "BR": "Brazil",
    "MX": "Mexico", "IT": "Italy", "ES": "Spain", "NL": "Netherlands",
    "BE": "Belgium", "CH": "Switzerland", "AT": "Austria", "SE": "Sweden",
    "NO": "Norway", "DK": "Denmark", "FI": "Finland", "PL": "Poland",
    "PT": "Portugal", "GR": "Greece", "IE": "Ireland", "NZ": "New Zealand",
    "SG": "Singapore", "MY": "Malaysia", "PH": "Philippines", "TH": "Thailand",
    "ID": "Indonesia", "VN": "Vietnam", "JP": "Japan", "KR": "South Korea",
    "CN": "China", "HK": "Hong Kong", "TW": "Taiwan", "AE": "UAE",
    "SA": "Saudi Arabia", "IL": "Israel", "TR": "Turkey", "ZA": "South Africa",
    "EG": "Egypt", "NG": "Nigeria", "KE": "Kenya", "AR": "Argentina",
    "CL": "Chile", "CO": "Colombia", "PE": "Peru", "PK": "Pakistan",
    "BD": "Bangladesh", "LK": "Sri Lanka", "NP": "Nepal"
  };

  // If it's a 2-letter code, look it up
  if (countryValue.length === 2) {
    return countryNames[countryValue.toUpperCase()] || countryValue;
  }

  // If it's already a country name, return it as-is
  return countryValue;
};

interface GroupedPerson {
  id: string; // unique identifier: name + email
  fullName: string;
  email: string;
  linkedinUrl: string;
  photoUrl: string;
  country?: string;
  certifications: CertificationEntry[];
}

const Achievements = () => {
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");
  const [selectedMapProvider, setSelectedMapProvider] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<GroupedPerson | null>(null);
  const [useCanva, setUseCanva] = useState(false);
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // Canva template ID - Set this to your Canva template ID
  // Get it from your Canva template URL or Canva API
  // Get template ID from environment variable
  const CANVA_TEMPLATE_ID = import.meta.env.VITE_CANVA_TEMPLATE_ID;

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadCertifications();
  }, []);

  const loadCertifications = async () => {
    // Load from cache immediately for instant display
    const cacheKey = 'yatri_certifications_cache';
    const cacheTimestampKey = 'yatri_certifications_cache_timestamp';
    const cacheMaxAge = 10 * 60 * 1000; // 10 minutes (increased for better persistence)

    // Load from cache FIRST - this ensures instant display
    // MODIFIED: We want to show loading state until fresh data is fetched to avoid "stale" 2 vs "fresh" 57 flash
    // We will only use cache if it matches the fresh fetch or if fetch fails.
    setIsLoading(true);

    // Always fetch fresh data in the background (even if cache was loaded)
    setError(null);
    try {
      const data = await fetchCertifications();

      // Cache the fresh data
      try {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(cacheTimestampKey, Date.now().toString());
        } catch (e: any) {
          if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
            console.warn('LocalStorage quota exceeded. Clearing old cache...');
            // Clear all non-essenatial keys or specific large keys
            // For now, clear the cache key itself and try to clear other potentially large items
            localStorage.removeItem(cacheKey);

            // Clear other potential large API caches
            Object.keys(localStorage).forEach(k => {
              if (k.startsWith('yatri_') && k !== cacheKey && k !== 'yatri_user' && k !== 'yatri_token') {
                localStorage.removeItem(k);
              }
            });

            // Try setting again
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(cacheTimestampKey, Date.now().toString());
          } else {
            throw e;
          }
        }
      } catch (cacheError) {
        console.warn("⚠️ Error caching data:", cacheError);
        // Continue without caching - do not block the UI
      }

      // Update with fresh data
      setCertifications(data);
      setIsLoading(false);
    } catch (error: any) {
      console.error("❌ Error loading certifications:", error);

      // Fallback to cache if request fails
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          if (parsedData && Array.isArray(parsedData)) {
            setCertifications(parsedData);
            setIsLoading(false);
            return;
          }
        }
      } catch (cacheError) {
        console.warn("Failed to load fallback cache", cacheError);
      }

      setIsLoading(false);
      setError("Failed to load certifications. Please try again shortly.");
    }
  };

  // Group certifications by person (name + email)
  const groupedByPerson = certifications.reduce((acc, cert) => {
    const personKey = `${cert.fullName.toLowerCase().trim()}_${cert.email.toLowerCase().trim()}`;
    if (!acc[personKey]) {
      acc[personKey] = {
        id: personKey,
        fullName: cert.fullName,
        email: cert.email,
        linkedinUrl: cert.linkedinUrl,
        photoUrl: cert.photoUrl,
        country: cert.country,
        certifications: []
      };
    }
    acc[personKey].certifications.push(cert);
    return acc;
  }, {} as Record<string, GroupedPerson>);

  // Convert to array and sort by name (Yatharth always first, then Nensi, then others alphabetically)
  const persons = Object.values(groupedByPerson).sort((a, b) => {
    // Special ordering: Yatharth first, then Nensi, then others
    if (a.fullName === "Yatharth Chauhan") return -1;
    if (b.fullName === "Yatharth Chauhan") return 1;
    if (a.fullName === "Nensi Ravaliya") return -1;
    if (b.fullName === "Nensi Ravaliya") return 1;
    // Alphabetical for others
    return a.fullName.localeCompare(b.fullName);
  });

  // Group persons by provider - filter certifications by provider for each person
  // Store total certification count for each person
  const groupedByProvider = persons.reduce((acc, person) => {
    const totalCerts = person.certifications.length; // Total across all providers
    person.certifications.forEach(cert => {
      const provider = cert.certificationProvider.toUpperCase();
      if (!acc[provider]) {
        acc[provider] = [];
      }
      // Only add person once per provider, with only their certs from that provider
      const existingPerson = acc[provider].find(p => p.id === person.id);
      if (!existingPerson) {
        // Filter certifications to only include those from this provider
        const providerCerts = person.certifications.filter(
          c => c.certificationProvider.toUpperCase() === provider
        );
        acc[provider].push({
          ...person,
          certifications: providerCerts,
          totalCertifications: totalCerts // Store total for display
        });
      }
    });
    return acc;
  }, {} as Record<string, (GroupedPerson & { totalCertifications?: number })[]>);

  // Get unique providers
  const providers = Object.keys(groupedByProvider).sort();

  // Filter based on selected provider first
  let providerFilteredPersons = persons;
  if (selectedProvider !== "all") {
    providerFilteredPersons = groupedByProvider[selectedProvider] || [];
  }

  // Group provider-filtered persons by country (for accurate counts in country filter)
  const groupedByCountry = providerFilteredPersons.reduce((acc, person) => {
    // Get country from person's certifications if person.country is not available
    const personCountry = person.country || person.certifications[0]?.country || '';
    const countryName = getCountryName(personCountry);
    if (!countryName || countryName === 'Unknown') return acc;

    if (!acc[countryName]) {
      acc[countryName] = [];
    }
    acc[countryName].push(person);
    return acc;
  }, {} as Record<string, GroupedPerson[]>);

  // Get unique countries
  const countries = Object.keys(groupedByCountry).sort();

  // Debug: Log countries for troubleshooting
  console.log('🌍 Countries found:', countries);
  console.log('🌍 Grouped by country:', groupedByCountry);

  // Apply country filter
  let filteredPersons = providerFilteredPersons;
  if (selectedCountry !== "all") {
    filteredPersons = filteredPersons.filter(person => {
      const countryName = getCountryName(person.country || '');
      return countryName === selectedCountry;
    });
  }

  // Free-text search across name, certification name / provider / exam code
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filteredPersons = filteredPersons.filter(person =>
      person.fullName.toLowerCase().includes(q) ||
      person.certifications.some(c =>
        (c.certificationName || "").toLowerCase().includes(q) ||
        (c.certificationProvider || "").toLowerCase().includes(q) ||
        (c.examCode || "").toLowerCase().includes(q)
      )
    );
  }

  // Optional sort (default keeps the curated person order)
  if (sortBy === "name") {
    filteredPersons = [...filteredPersons].sort((a, b) => a.fullName.localeCompare(b.fullName));
  } else if (sortBy === "certs") {
    filteredPersons = [...filteredPersons].sort((a, b) => b.certifications.length - a.certifications.length);
  }

  // Filter based on selected provider
  // For "all", show unique persons (not grouped by provider)
  // For specific provider, show persons filtered by that provider
  const displayGroups = selectedProvider === "all"
    ? { "All": filteredPersons } // Show all unique persons (filtered by country if selected)
    : { [selectedProvider]: filteredPersons };

  // Provider color mapping for map dots
  const PROVIDER_MAP_COLORS: Record<string, string> = {
    AWS: '#FF9900', // Orange
    AZURE: '#0078D4', // Blue
    GCP: '#4285F4', // Google Blue
    GOOGLE: '#4285F4', // Google Blue
    GITHUB: '#181717', // Black/Dark Gray
    ORACLE: '#F80000', // Red
    SALESFORCE: '#00A1E0', // Blue
    SERVICENOW: '#81B5A1', // Teal
    KUBERNETES: '#326CE5', // Blue
    TERRAFORM: '#7B42BC', // Purple
    OPENAI: '#10A37F', // OpenAI Green
    HASHICORP: '#000000', // Black
  };

  // Calculate location distribution for map (state-wise if available, otherwise country-wise)
  const locationCounts = certifications.reduce((acc, cert) => {
    if (!cert.country) return acc;
    const countryName = getCountryName(cert.country);
    const state = cert.stateProvince || '';
    const city = cert.city || '';
    const provider = cert.certificationProvider?.toUpperCase() || 'OTHER';

    // Create a unique key: country-state-city-provider or just country-provider
    const locationKey = state && city
      ? `${countryName}-${state}-${city}-${provider}`
      : state
        ? `${countryName}-${state}-${provider}`
        : `${countryName}-${provider}`;

    if (!acc[locationKey]) {
      acc[locationKey] = {
        country: countryName,
        state: state || '',
        city: city || '',
        provider: provider,
        count: 0,
        coordinates: COUNTRY_COORDINATES[countryName] || COUNTRY_COORDINATES[getCountryName(countryName)] || null,
      };
    }
    acc[locationKey].count += 1;
    return acc;
  }, {} as Record<string, { country: string; state: string; city: string; provider: string; count: number; coordinates: [number, number] | null }>);

  // Create markers for map - add slight offset for multiple locations in same country
  const allMapMarkers = Object.entries(locationCounts)
    .map(([locationKey, location], index) => {
      if (!location.coordinates) return null;

      // Add slight random offset for locations in the same country to avoid overlap
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
        color: PROVIDER_MAP_COLORS[location.provider] || '#6b7280', // Gray for unknown providers
      };
    })
    .filter((marker): marker is { country: string; state: string; city: string; provider: string; count: number; coordinates: [number, number]; color: string } => marker !== null);

  // Filter map markers based on selected map provider (separate from achievements filter)
  const mapMarkers = selectedMapProvider === "all"
    ? allMapMarkers
    : allMapMarkers.filter(marker => marker.provider === selectedMapProvider);

  // Get unique providers for map filter
  const mapProviders = Array.from(new Set(allMapMarkers.map(m => m.provider))).sort();

  // Get max count for sizing dots (based on filtered markers)
  const maxCount = mapMarkers.length > 0
    ? Math.max(...mapMarkers.map(m => m.count), 1)
    : 1;

  // Calculate stats
  const totalCertifications = certifications.length;
  const uniquePersons = persons.length;
  const uniqueProviders = providers.length;
  const thisMonth = certifications.filter((c) => {
    // Handle year-only format (just a number like "2024")
    const certYear = parseInt(c.certificationDate);
    if (!isNaN(certYear)) {
      const now = new Date();
      return certYear === now.getFullYear() && now.getMonth() === 0; // January
    }
    // Fallback for date format
    try {
      const certDate = new Date(c.certificationDate);
      const now = new Date();
      return certDate.getMonth() === now.getMonth() && certDate.getFullYear() === now.getFullYear();
    } catch {
      return false;
    }
  }).length;

  // Open person modal
  const openPersonModal = (person: GroupedPerson) => {
    setSelectedPerson(person);
  };

  // Close person modal
  const closePersonModal = () => {
    setSelectedPerson(null);
  };

  // Download person card as image
  const downloadPersonImage = async () => {
    if (!selectedPerson) return;

    // If Canva is enabled and template ID is set, use Canva API
    if (useCanva && CANVA_TEMPLATE_ID) {
      try {
        // Get all person certifications to determine providers and counts
        const allPersonCerts = persons.find(p => p.id === selectedPerson.id)?.certifications || selectedPerson.certifications;
        const providerCounts = allPersonCerts.reduce((acc, cert) => {
          const provider = cert.certificationProvider.toUpperCase();
          acc[provider] = (acc[provider] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const uniqueProviders = Object.keys(providerCounts).sort();
        const providerCertList = uniqueProviders.map(provider =>
          `${providerCounts[provider]}x ${provider}`
        ).join(' • ');

        await downloadCanvaImage({
          templateId: CANVA_TEMPLATE_ID,
          name: selectedPerson.fullName,
          photoUrl: selectedPerson.photoUrl || 'https://via.placeholder.com/300',
          certifications: providerCertList,
          country: selectedPerson.country ? getCountryName(selectedPerson.country) : '',
          totalCertifications: selectedPerson.certifications.length.toString(),
        });
        return;
      } catch (error: any) {
        console.error('Canva download failed, falling back to html2canvas:', error);
        // Fall through to html2canvas method
      }
    }

    try {
      // Get all person certifications to determine providers and counts
      const allPersonCerts = persons.find(p => p.id === selectedPerson.id)?.certifications || selectedPerson.certifications;
      const providerCounts = allPersonCerts.reduce((acc, cert) => {
        const provider = cert.certificationProvider.toUpperCase();
        acc[provider] = (acc[provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const uniqueProviders = Object.keys(providerCounts).sort();

      // Calculate total certifications
      const totalCertifications = allPersonCerts.length;

      // Get provider logo URLs
      // For blue background, we want logos that will be inverted to white
      // Use regular logo (not logoLight) as we'll invert it
      const getProviderLogo = (provider: string) => {
        const providerKey = provider.toUpperCase();
        const logoData = PROVIDER_LOGOS[providerKey];
        if (logoData) {
          // Use regular logo (will be inverted to white on blue background)
          // For GitHub, use the white icon directly
          if (providerKey === 'GITHUB') {
            return logoData.logo || logoData.logoLight;
          }
          return logoData.logo;
        }
        return null;
      };

      // Solid primary blue color
      const primaryBlue = '#3b82f6';
      const primaryBlueLight = '#60a5fa';
      const primaryBlueDark = '#2563eb';

      // Create a container for the image
      const container = document.createElement('div');
      container.style.width = '1000px';
      container.style.height = '1000px';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.backgroundColor = primaryBlue;
      container.style.padding = '0';
      container.style.boxSizing = 'border-box';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'space-between';
      document.body.appendChild(container);

      // Provider brand colors for circular logos
      const providerColors: Record<string, string> = {
        'AWS': '#FF9900', // Orange
        'AZURE': '#0078D4', // Blue
        'GCP': '#4285F4', // Google Blue
        'GOOGLE': '#4285F4',
        'GITHUB': '#181717', // Black
        'ORACLE': '#F80000', // Red
        'SALESFORCE': '#00A1E0', // Blue
        'SERVICENOW': '#81B5A1', // Teal
      };

      // Generate provider logos HTML (circular with colored backgrounds)
      const providerLogosHTML = uniqueProviders.map(provider => {
        const logoUrl = getProviderLogo(provider);
        if (!logoUrl) return '';
        const providerKey = provider.toUpperCase();
        const bgColor = providerColors[providerKey] || '#666666';

        return `
          <div style="
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: ${bgColor};
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            padding: 10px;
            box-sizing: border-box;
          ">
            <img 
              src="${logoUrl}" 
              alt="${provider}"
              style="
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: brightness(0) invert(1);
              "
              crossorigin="anonymous"
            />
          </div>
        `;
      }).filter(html => html !== '').join('');

      // Create the card content matching the exact design
      const cardHTML = `
        <div style="
          width: 100%;
          height: 100%;
          position: relative;
          background: linear-gradient(180deg, #2196F3 0%, #003366 100%);
          padding: 50px 40px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        ">
          <!-- Top Left: Yatri Cloud Branding -->
          <div style="
            position: absolute;
            top: 50px;
            left: 40px;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10;
          ">
            <img 
              src="/logo-192.png"
              alt="Yatri Cloud"
              style="width: 40px; height: 40px; filter: brightness(0) invert(1);"
              crossorigin="anonymous"
            />
            <span style="
              font-size: 20px;
              font-weight: 400;
              color: white;
              letter-spacing: 0.2px;
            ">Yatri Cloud</span>
          </div>

          <!-- Center Content -->
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            width: 100%;
            gap: 20px;
            margin-top: 100px;
          ">
            <!-- Profile Photo -->
            <img 
              src="${selectedPerson.photoUrl || 'https://via.placeholder.com/300'}" 
              alt="${selectedPerson.fullName}"
              style="
                width: 400px;
                height: 400px;
                border-radius: 50%;
                object-fit: cover;
                border: 5px solid white;
              "
              crossorigin="anonymous"
            />

            <!-- Name -->
            <h2 style="
              font-size: 64px;
              font-weight: 700;
              color: white;
              margin: 0;
              text-align: center;
              letter-spacing: -1px;
              line-height: 1.2;
              margin-top: 16px;
            ">${selectedPerson.fullName}</h2>

            <!-- Certification Breakdown Text -->
            <div style="
              font-size: 32px;
              font-weight: 500;
              color: white;
              text-align: center;
              letter-spacing: 0.2px;
              margin-top: 12px;
              line-height: 1.4;
            ">
              ${uniqueProviders.map((provider, idx) => {
        const count = providerCounts[provider];
        return `${count}<span style="font-size: 0.65em; vertical-align: super; line-height: 0; position: relative; top: -0.1em;">x</span> ${provider}${idx < uniqueProviders.length - 1 ? ' <span style="margin: 0 14px; font-weight: 300; opacity: 0.8;">|</span> ' : ''}`;
      }).join('')}
            </div>

            <!-- Provider Logos -->
            ${providerLogosHTML ? `
            <div style="
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 24px;
              margin-top: 20px;
            ">
              ${providerLogosHTML}
            </div>
            ` : ''}
          </div>

          <!-- Bottom: Total Certification Badge -->
          <div style="
            width: 100%;
            display: flex;
            justify-content: center;
            margin-top: auto;
            padding-bottom: 50px;
          ">
            <div style="
              background: #000000;
              border-radius: 50px;
              padding: 18px 56px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="
                font-size: 36px;
                font-weight: 700;
                color: white;
                text-transform: uppercase;
                letter-spacing: 1.2px;
                line-height: 1;
              ">
                ${totalCertifications}<span style="font-size: 0.6em; vertical-align: super; line-height: 0; position: relative; top: -0.15em;">X</span> CERTIFIED
              </span>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = cardHTML;

      // Wait for images to load
      await new Promise((resolve) => {
        const images = container.querySelectorAll('img');
        let loaded = 0;
        const total = images.length;
        if (total === 0) {
          setTimeout(resolve, 500);
          return;
        }
        images.forEach((img) => {
          const checkComplete = () => {
            loaded++;
            if (loaded === total) {
              setTimeout(resolve, 300);
            }
          };
          if (img.complete) {
            checkComplete();
          } else {
            img.onload = checkComplete;
            img.onerror = checkComplete;
          }
        });
        // Timeout fallback
        setTimeout(() => {
          if (loaded < total) resolve(undefined);
        }, 5000);
      });

      // Generate canvas
      const canvas = await html2canvas(container, {
        width: 1000,
        height: 1000,
        scale: 2,
        backgroundColor: primaryBlue,
        useCORS: true,
        logging: false,
        allowTaint: false,
      });

      // Download the image
      const link = document.createElement('a');
      link.download = `${selectedPerson.fullName.replace(/\s+/g, '_')}_Yatri_Cloud_Certification.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Cleanup
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Achievements · Celebrate Your Certification Win"
        description="You worked hard for that certificate. Share your achievement, create a celebration card and inspire 50K+ Yatris on their cloud journey."
      />
      <div className="noise-overlay" />
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-28 md:pt-40 pb-20 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <ScrollReveal>
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center justify-center mb-8"
                >
                  <img
                    src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/All/yatri-certified.png"
                    alt="Yatri Certified"
                    className="w-auto h-20 md:h-28 object-contain"
                  />
                </motion.div>

                <h1 className="text-4xl md:text-6xl font-bold font-display mb-4">
                  The <span className="gradient-text">Wall of Fame</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                  Every face here is a Yatri who studied, sat the exam, and passed.
                  Real people, real certifications — and proof you can do it too.
                </p>

                {/* Stats */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-12 max-w-5xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white border border-border rounded-2xl px-8 py-7 text-center hover:border-primary/40 hover:shadow-card transition-all duration-300 w-full sm:w-[260px]"
                  >
                    <div className="text-4xl md:text-5xl font-extrabold font-display gradient-text mb-2 tabular-nums">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-brand-300"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                          />
                          <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-brand-500"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-brand-700"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      ) : (
                        totalCertifications
                      )}
                    </div>
                    <div className="mx-auto mt-4 mb-3 h-px w-10 bg-border" />
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">Certifications earned</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white border border-border rounded-2xl px-8 py-7 text-center hover:border-primary/40 hover:shadow-card transition-all duration-300 w-full sm:w-[260px]"
                  >
                    <div className="text-4xl md:text-5xl font-extrabold font-display gradient-text mb-2 tabular-nums">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-brand-300"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                          />
                          <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-brand-500"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-brand-700"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      ) : (
                        uniquePersons
                      )}
                    </div>
                    <div className="mx-auto mt-4 mb-3 h-px w-10 bg-border" />
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">Certified Yatris</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white border border-border rounded-2xl px-8 py-7 text-center hover:border-primary/40 hover:shadow-card transition-all duration-300 w-full sm:w-[260px]"
                  >
                    <div className="text-4xl md:text-5xl font-extrabold font-display gradient-text mb-2 tabular-nums">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-brand-300"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                          />
                          <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-brand-500"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-brand-700"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      ) : (
                        uniqueProviders
                      )}
                    </div>
                    <div className="mx-auto mt-4 mb-3 h-px w-10 bg-border" />
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">Cloud providers</div>
                  </motion.div>

                  {thisMonth > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="bg-white border border-border rounded-2xl px-8 py-7 text-center hover:border-primary/40 hover:shadow-card transition-all duration-300 w-full sm:w-[260px]"
                    >
                      <div className="text-4xl md:text-5xl font-extrabold font-display gradient-text mb-2 tabular-nums">
                        {thisMonth}
                      </div>
                      <div className="mx-auto mt-4 mb-3 h-px w-10 bg-border" />
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">Certified this month</div>
                    </motion.div>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Share Your Achievement Button */}
            <ScrollReveal delay={0.15}>
              <div className="flex justify-center mt-8 mb-8">
                <motion.a
                  href="/certifiedyatris"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-all duration-300 hover:shadow-3xl hover:shadow-primary/40 overflow-hidden relative"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <Trophy className="relative z-10 w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10">Add your name to the wall</span>
                  <ExternalLink className="relative z-10 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />

                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/0 group-hover:bg-primary/25 blur-2xl transition-all duration-300" />
                </motion.a>
              </div>
            </ScrollReveal>

            {/* Provider Filter */}
            {providers.length > 1 && (
              <ScrollReveal delay={0.1}>
                <div className="flex justify-center mb-6">
                  <div className="inline-flex bg-muted rounded-xl p-1 border border-border max-w-full overflow-x-auto scrollbar-hide">
                    <div className="inline-flex min-w-max">
                      <button
                        onClick={() => setSelectedProvider("all")}
                        className={`flex items-center gap-2 px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm rounded-lg font-semibold transition-all ${selectedProvider === "all"
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <BadgeCheck className="w-4 h-4" />
                        All ({certifications.length})
                      </button>
                      {providers.map((provider) => {
                        const providerLogo = PROVIDER_LOGOS[provider];
                        if (!providerLogo) return null;

                        const logoSrc = provider === 'AWS'
                          ? (theme === 'dark'
                            ? providerLogo.logo  // aws-light.png for dark mode
                            : (providerLogo.logoLight || providerLogo.logo))  // aws.svg for light mode
                          : (theme === 'dark'
                            ? (providerLogo.logoLight || providerLogo.logo)
                            : (provider === 'GITHUB'
                              ? providerLogo.logo
                              : (providerLogo.logoLight || providerLogo.logo)));

                        return (
                          <button
                            key={provider}
                            onClick={() => setSelectedProvider(provider)}
                            className={`flex items-center gap-2 px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm rounded-lg font-semibold transition-all ${selectedProvider === provider
                              ? "bg-primary text-primary-foreground shadow-lg"
                              : "text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            <img
                              src={logoSrc}
                              alt={provider}
                              className={`object-contain ${provider === 'GITHUB' && theme === 'light' ? 'invert' : ''} ${provider === 'ORACLE' || provider === 'SERVICENOW'
                                ? 'w-7 h-7'
                                : 'w-5 h-5'
                                }`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span className="hidden sm:inline">
                              {provider} ({groupedByProvider[provider]?.reduce((sum, person) => sum + person.certifications.length, 0) || 0})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Search + sort by name or certification */}
            {!isLoading && certifications.length > 0 && (
              <ScrollReveal delay={0.12}>
                <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search Yatris by name or certification"
                      aria-label="Search the Wall of Fame"
                      className="h-11 rounded-xl pl-9"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-11 w-full rounded-xl sm:w-[200px]" aria-label="Sort the Wall of Fame">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Featured order</SelectItem>
                      <SelectItem value="name">Name: A to Z</SelectItem>
                      <SelectItem value="certs">Most certifications</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </ScrollReveal>
            )}

          </div>
        </section>

        {/* Achievements Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-[1600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading the Wall of Fame…</p>
                </div>
              </div>
            ) : error ? (
              <ScrollReveal delay={0.2}>
                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c3.231 0 5.982-2.35 6.544-5.411.563-3.061-1.694-6.01-4.797-6.01v-.01C13.93 2.5 12 4.5 12 7h-2c0-2.5-1.93-4.5-4.315-4.5-3.103 0-5.36 2.949-4.797 6.01C1.982 11.65 4.733 14 7.964 14h13.856z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-destructive mb-2">Error Loading Certifications</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <button
                    onClick={loadCertifications}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Try Again
                  </button>
                  <p className="text-sm text-muted-foreground mt-4">
                    💡 Check <code className="bg-muted px-2 py-1 rounded">FIX_CORS_GET_REQUEST.md</code> for setup instructions
                  </p>
                </div>
              </ScrollReveal>
            ) : certifications.length === 0 ? (
              <ScrollReveal delay={0.2}>
                <div className="text-center py-24 max-w-md mx-auto">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 border border-brand-100 mb-5">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold font-display mb-2">The wall is waiting, Yatris</h3>
                  <p className="text-muted-foreground">
                    No certifications up here yet — be the first to plant your flag.
                    Pass your exam, then <a href="/certifiedyatris" className="text-primary font-semibold hover:underline">share it here</a> and kick off the Wall of Fame. 🎉
                  </p>
                </div>
              </ScrollReveal>
            ) : filteredPersons.length === 0 ? (
              <ScrollReveal delay={0.2}>
                <div className="text-center py-24 max-w-md mx-auto">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 border border-brand-100 mb-5">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold font-display mb-2">No Yatris match your search</h3>
                  <p className="text-muted-foreground">
                    Try a different name, certification or provider — or clear the filters to see the whole wall.
                  </p>
                </div>
              </ScrollReveal>
            ) : (
              <div className="space-y-20">
                {Object.entries(displayGroups).map(([provider, certs], groupIndex) => {
                  const isAllView = provider === "All";

                  return (
                    <ScrollReveal key={provider} delay={0.1 + groupIndex * 0.1}>
                      <div className="mb-16">
                        {/* Provider Header */}
                        <div className="mb-12">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                            <div>
                              <h3 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-2">
                                {isAllView ? "Every certified Yatri" : `${provider} Certifications`}
                              </h3>
                              <p className="text-lg text-muted-foreground">
                                {certs.length} {certs.length === 1 ? "Yatri" : "Yatris"} on the wall
                              </p>
                            </div>
                            {/* Country Filter - Only show for "All" view */}
                            {isAllView && countries.length > 0 && (
                              <div className="flex-shrink-0">
                                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                  <SelectTrigger className="w-[280px] bg-muted border-border">
                                    <SelectValue placeholder="All Countries">
                                      {selectedCountry === "all"
                                        ? `All (${providerFilteredPersons.length})`
                                        : `${getCountryFlag(countries.find(c => c === selectedCountry) || '')} ${selectedCountry} (${groupedByCountry[selectedCountry]?.length || 0})`
                                      }
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">
                                      <span className="flex items-center gap-2">
                                        <BadgeCheck className="w-4 h-4" />
                                        All ({providerFilteredPersons.length})
                                      </span>
                                    </SelectItem>
                                    {countries.map((country) => {
                                      const countryCount = groupedByCountry[country]?.length || 0;
                                      // Find a certification from this country to get the flag
                                      const countryCert = certifications.find(c => getCountryName(c.country) === country);
                                      const countryFlag = countryCert ? getCountryFlag(countryCert.country) : getCountryFlag(country);
                                      return (
                                        <SelectItem key={country} value={country}>
                                          <span className="flex items-center gap-2">
                                            <span className="text-lg">{countryFlag}</span>
                                            {country} ({countryCount})
                                          </span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Achievements Grid - 4 Column Layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                          {certs.map((person, index) => {
                            const providerCertCount = person.certifications.length; // Count for this provider
                            const totalCertCount = isAllView ? person.certifications.length : ((person as any).totalCertifications || person.certifications.length); // Total across all providers
                            const currentProvider = isAllView ? "" : provider; // Current provider being displayed

                            // Get ALL certifications for this person (not just current view)
                            // Look up the person in the original persons array to get all their certifications
                            const allPersonCerts = persons.find(p => p.id === person.id)?.certifications || person.certifications;


                            // Get unique providers from ALL person's certifications with counts
                            const providerCounts = allPersonCerts.reduce((acc, cert) => {
                              const provider = cert.certificationProvider.toUpperCase();
                              acc[provider] = (acc[provider] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            const uniqueProviders = Object.keys(providerCounts);


                            // Determine card background color based on providers
                            // Single provider = brand color, Multiple providers = primary blue
                            const getCardColor = () => {
                              if (uniqueProviders.length === 1) {
                                const singleProvider = uniqueProviders[0];
                                const brandColor = PROVIDER_BRAND_COLORS[singleProvider] || PROVIDER_BRAND_COLORS.MULTIPLE;
                                return brandColor;
                              } else {
                                // Multiple providers - use primary blue
                                return PROVIDER_BRAND_COLORS.MULTIPLE;
                              }
                            };
                            const cardColor = getCardColor();

                            // Featured founders (Yatharth Chauhan, Nensi Ravaliya) get a premium blue treatment
                            const isSpecialPerson = person.fullName === "Yatharth Chauhan" || person.fullName === "Nensi Ravaliya";
                            const specialCardClasses = isSpecialPerson
                              ? "bg-gradient-to-br from-brand-50 to-white border-2 border-primary ring-2 ring-primary/20 shadow-glow-soft"
                              : "bg-white border border-brand-100";

                            return (
                              <motion.div
                                key={person.id}
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 30, scale: 0.94 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: prefersReducedMotion ? 0 : index * 0.07, duration: 0.5, ease: "easeOut" }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className={`group relative flex flex-col ${specialCardClasses} rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-elevated overflow-hidden cursor-pointer`}
                                onClick={() => openPersonModal(person)}
                              >
                                {/* Animated gradient background */}
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  whileHover={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                  className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"
                                />

                                {/* Photo */}
                                <div className="relative mb-6 z-10 flex justify-center">
                                  <motion.div
                                    className={`relative overflow-visible rounded-full border-4 shadow-xl transition-all duration-300 ${isSpecialPerson
                                      ? "border-primary group-hover:border-brand-600"
                                      : "border-primary/20 group-hover:border-primary/40"
                                      }`}
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    <img
                                      src={person.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName)}&background=007CFF&color=fff&size=200`}
                                      alt={person.fullName}
                                      className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName)}&background=007CFF&color=fff&size=200`;
                                      }}
                                    />
                                    {/* Certification Count Badge - On the circular border, bottom right */}
                                    <motion.div
                                      className={`absolute bottom-0 right-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 shadow-lg z-20 ${isSpecialPerson
                                        ? "bg-gradient-to-br from-primary to-brand-700 border-white"
                                        : "bg-gradient-to-br from-primary to-primary/80 border-background"
                                        }`}
                                      style={{
                                        transform: 'translate(10%, 25%)'
                                      }}
                                    >
                                      <span className={`text-xs md:text-sm font-bold leading-none ${isSpecialPerson
                                        ? "text-primary-foreground"
                                        : "text-primary-foreground"
                                        }`}>
                                        {totalCertCount}x
                                      </span>
                                    </motion.div>
                                  </motion.div>
                                </div>

                                {/* Name */}
                                <h4 className={`text-xl md:text-2xl font-bold font-display mb-4 text-center relative z-10 transition-colors ${isSpecialPerson
                                  ? "text-foreground group-hover:text-primary"
                                  : "text-foreground group-hover:text-primary"
                                  }`}>
                                  {person.fullName}
                                </h4>

                                {/* Certification Logos Horizontal Row */}
                                <div className="flex flex-col items-center gap-2 mb-4 relative z-10">
                                  <div className="flex items-center justify-center gap-2 flex-wrap">
                                    {uniqueProviders.map((providerName) => {
                                      const providerLogo = PROVIDER_LOGOS[providerName];
                                      const count = providerCounts[providerName];

                                      if (!providerLogo) return null;

                                      // Special AWS logo alternation for Yatharth and Nensi (theme-dependent)
                                      let logoSrc;
                                      if (providerName === 'AWS' && isSpecialPerson) {
                                        // Alternate AWS logos based on theme: swaps when theme changes
                                        if (person.fullName === "Yatharth Chauhan") {
                                          // Yatharth: logoLight in light mode, logo in dark mode
                                          logoSrc = theme === 'dark'
                                            ? providerLogo.logo  // aws-light.png in dark mode
                                            : (providerLogo.logoLight || providerLogo.logo); // aws.svg in light mode
                                        } else if (person.fullName === "Nensi Ravaliya") {
                                          // Nensi: logo in light mode, logoLight in dark mode (opposite of Yatharth)
                                          logoSrc = theme === 'dark'
                                            ? (providerLogo.logoLight || providerLogo.logo) // aws.svg in dark mode
                                            : providerLogo.logo; // aws-light.png in light mode
                                        } else {
                                          logoSrc = theme === 'dark'
                                            ? providerLogo.logo
                                            : (providerLogo.logoLight || providerLogo.logo);
                                        }
                                      } else {
                                        // Normal logo selection for other providers or non-special persons
                                        logoSrc = providerName === 'AWS'
                                          ? (theme === 'dark'
                                            ? providerLogo.logo  // aws-light.png for dark mode
                                            : (providerLogo.logoLight || providerLogo.logo))  // aws.svg for light mode
                                          : (theme === 'dark'
                                            ? (providerLogo.logoLight || providerLogo.logo)
                                            : (providerName === 'GITHUB'
                                              ? providerLogo.logo
                                              : (providerLogo.logoLight || providerLogo.logo)));
                                      }

                                      return (
                                        <motion.div
                                          key={providerName}
                                          whileHover={{ scale: 1.15, y: -2 }}
                                          className="flex items-center gap-1"
                                        >
                                          {/* Certification count before logo - only show if NOT in "All" view */}
                                          {!isAllView && (
                                            <span className={`text-xs font-bold ${isSpecialPerson
                                              ? "text-foreground/80"
                                              : "text-foreground/80"
                                              }`}>
                                              {count}x
                                            </span>
                                          )}
                                          <div className={`flex items-center justify-center rounded-lg border p-1 ${providerName === 'ORACLE' || providerName === 'SERVICENOW'
                                            ? 'w-12 h-12'
                                            : 'w-8 h-8'
                                            } ${isSpecialPerson
                                              ? "bg-brand-50 border-brand-200"
                                              : "bg-background/50 border-border/40"
                                            }`}>
                                            <img
                                              src={logoSrc}
                                              alt={providerName}
                                              className={`w-full h-full object-contain ${providerName === 'GITHUB' && theme === 'light' ? 'invert' : ''}`}
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                  {/* Country Flag at center bottom with name */}
                                  {person.country && (
                                    <motion.div
                                      whileHover={{ scale: 1.1 }}
                                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isSpecialPerson
                                        ? "bg-brand-50 border-brand-200"
                                        : "bg-background/50 border-border/40"
                                        }`}
                                      title={getCountryName(person.country)}
                                    >
                                      <span className="text-lg leading-none">
                                        {getCountryFlag(person.country)}
                                      </span>
                                      <span className={`text-xs font-medium ${isSpecialPerson
                                        ? "text-foreground/80 font-semibold"
                                        : "text-foreground/80"
                                        }`}>
                                        {getCountryName(person.country)}
                                      </span>
                                    </motion.div>
                                  )}
                                </div>

                                {/* Action buttons — text only, no icons: quiet outline for
                                    LinkedIn, solid primary for the profile view. */}
                                <div className="flex items-center justify-center gap-2.5 mt-auto relative z-10">
                                  {person.linkedinUrl && (
                                    <a
                                      href={person.linkedinUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex min-h-[40px] flex-1 max-w-[130px] items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                                    >
                                      LinkedIn
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    className="inline-flex min-h-[40px] flex-1 max-w-[130px] items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-inset-btn transition-colors hover:bg-brand-600"
                                  >
                                    View profile
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* World Map Section */}
        {allMapMarkers.length > 0 && (
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

                          const providerCount = allMapMarkers.filter(m => m.provider === provider).length;
                          const logoSrc = provider === 'AWS'
                            ? (theme === 'dark'
                              ? providerLogo.logo  // aws-light.png for dark mode
                              : (providerLogo.logoLight || providerLogo.logo))  // aws.svg for light mode
                            : (theme === 'dark'
                              ? (providerLogo.logoLight || providerLogo.logo)
                              : (provider === 'GITHUB'
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
                                className={`object-contain ${provider === 'GITHUB' && theme === 'light' ? 'invert' : ''} ${provider === 'ORACLE' || provider === 'SERVICENOW'
                                  ? 'w-7 h-7'
                                  : 'w-5 h-5'
                                  }`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
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
                    <div className="w-full" style={{ height: '500px', minHeight: '500px', position: 'relative' }}>
                      <ComposableMap
                        projection="geoEquirectangular"
                        projectionConfig={{
                          scale: 147,
                        }}
                        style={{ width: '100%', height: '100%' }}
                        className="w-full h-full"
                      >
                        <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
                          {({ geographies }) => {
                            // Theme-based colors
                            const isDark = theme === 'dark';
                            const fillColor = isDark ? "#374151" : "#e5e7eb"; // Dark gray in dark mode, light gray in light mode
                            const strokeColor = isDark ? "#4b5563" : "#9ca3af"; // Darker gray border in dark mode
                            const hoverFill = isDark ? "#4b5563" : "#d1d5db"; // Slightly lighter on hover

                            return geographies.map((geo) => {
                              // Get country name from geography properties
                              const countryName = geo.properties?.NAME || geo.properties?.name || geo.properties?.NAME_LONG || '';

                              return (
                                <Geography
                                  key={geo.rsmKey}
                                  geography={geo}
                                  fill={fillColor}
                                  stroke={strokeColor}
                                  style={{
                                    default: {
                                      fill: fillColor,
                                      stroke: strokeColor,
                                      strokeWidth: 0.6,
                                      outline: "none",
                                    },
                                    hover: {
                                      fill: hoverFill,
                                      stroke: strokeColor,
                                      strokeWidth: 0.6,
                                      outline: "none",
                                    },
                                    pressed: {
                                      fill: hoverFill,
                                      stroke: strokeColor,
                                      strokeWidth: 0.6,
                                      outline: "none",
                                    },
                                  }}
                                >
                                  {countryName && (
                                    <title>{countryName}</title>
                                  )}
                                </Geography>
                              );
                            });
                          }}
                        </Geographies>
                        {mapMarkers.map(({ country, state, city, provider, count, coordinates, color }, index) => {
                          // Very small dots: min 3px, max 8px for better visibility of all states
                          const size = Math.max(3, Math.min(8, (count / maxCount) * 8));
                          const locationLabel = state && city
                            ? `${city}, ${state}, ${country}`
                            : state
                              ? `${state}, ${country}`
                              : country;
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
                        const providerCount = mapMarkers.filter(m => m.provider === provider).length;
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
        )}
      </main>

      {/* Certifications Modal */}
      <Dialog open={selectedPerson !== null} onOpenChange={(open) => !open && closePersonModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPerson && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    {(() => {
                      const isSpecialPerson = selectedPerson.fullName === "Yatharth Chauhan" || selectedPerson.fullName === "Nensi Ravaliya";
                      return (
                        <img
                          src={selectedPerson.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPerson.fullName)}&background=007CFF&color=fff&size=150`}
                          alt={selectedPerson.fullName}
                          className={`w-20 h-20 rounded-full object-cover border-4 ${isSpecialPerson
                            ? "border-yellow-500"
                            : "border-primary/30"
                            }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPerson.fullName)}&background=007CFF&color=fff&size=150`;
                          }}
                        />
                      );
                    })()}
                    {/* Certification Count Badge - On the circular border, bottom right */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center border-2 border-background shadow-lg z-20 translate-x-1/4 translate-y-1/4">
                      <span className="text-[10px] font-bold text-primary-foreground leading-none">
                        {selectedPerson.certifications.length}x
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <DialogTitle className="text-2xl md:text-3xl font-bold">
                        {selectedPerson.fullName}
                      </DialogTitle>
                      {/* Country Flag and Name - Right side of name */}
                      {selectedPerson.country && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-background/50 rounded-lg border border-border/40">
                          <span className="text-lg leading-none">
                            {getCountryFlag(selectedPerson.country)}
                          </span>
                          <span className="text-xs font-medium text-foreground/80">
                            {getCountryName(selectedPerson.country)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <a
                        href={selectedPerson.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        <span className="text-sm font-semibold">LinkedIn</span>
                      </a>
                      <a
                        href={`/yatri/${selectedPerson.fullName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary hover:bg-brand-600 text-primary-foreground transition-all"
                      >
                        <span className="text-sm font-semibold">View full profile</span>
                      </a>
                      {/* Download button - commented out
                      <button
                        onClick={downloadPersonImage}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-sm font-semibold">Download</span>
                      </button>
                      */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30">
                        <span className="text-sm font-bold">{selectedPerson.certifications.length}x Certified</span>
                        {/* Certification Logos */}
                        {(() => {
                          const uniqueProviders = Array.from(new Set(selectedPerson.certifications.map(c => c.certificationProvider.toUpperCase())));

                          const isSpecialPerson = selectedPerson.fullName === "Yatharth Chauhan" || selectedPerson.fullName === "Nensi Ravaliya";

                          return (
                            <div className="flex items-center gap-1 ml-2">
                              {uniqueProviders.map((providerName) => {
                                const providerLogo = PROVIDER_LOGOS[providerName];
                                if (!providerLogo) return null;

                                // Special AWS logo alternation for Yatharth and Nensi (theme-dependent)
                                let logoSrc;
                                if (providerName === 'AWS' && isSpecialPerson) {
                                  // Alternate AWS logos based on theme: swaps when theme changes
                                  if (selectedPerson.fullName === "Yatharth Chauhan") {
                                    // Yatharth: logoLight in light mode, logo in dark mode
                                    logoSrc = theme === 'dark'
                                      ? providerLogo.logo  // aws-light.png in dark mode
                                      : (providerLogo.logoLight || providerLogo.logo); // aws.svg in light mode
                                  } else if (selectedPerson.fullName === "Nensi Ravaliya") {
                                    // Nensi: logo in light mode, logoLight in dark mode (opposite of Yatharth)
                                    logoSrc = theme === 'dark'
                                      ? (providerLogo.logoLight || providerLogo.logo) // aws.svg in dark mode
                                      : providerLogo.logo; // aws-light.png in light mode
                                  } else {
                                    logoSrc = theme === 'dark'
                                      ? providerLogo.logo
                                      : (providerLogo.logoLight || providerLogo.logo);
                                  }
                                } else {
                                  // Normal logo selection for other providers or non-special persons
                                  logoSrc = providerName === 'AWS'
                                    ? (theme === 'dark'
                                      ? providerLogo.logo  // aws-light.png for dark mode
                                      : (providerLogo.logoLight || providerLogo.logo))  // aws.svg for light mode
                                    : (theme === 'dark'
                                      ? (providerLogo.logoLight || providerLogo.logo)
                                      : (providerName === 'GITHUB'
                                        ? providerLogo.logo
                                        : (providerLogo.logoLight || providerLogo.logo)));
                                }

                                return (
                                  <div
                                    key={providerName}
                                    className={`flex items-center justify-center bg-background/50 rounded border border-border/40 p-0.5 ${providerName === 'ORACLE' || providerName === 'SERVICENOW'
                                      ? 'w-7 h-7'
                                      : 'w-5 h-5'
                                      }`}
                                  >
                                    <img
                                      src={logoSrc}
                                      alt={providerName}
                                      className={`w-full h-full object-contain ${providerName === 'GITHUB' && theme === 'light' ? 'invert' : ''}`}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Group certifications by provider */}
                {(() => {
                  const certsByProvider = selectedPerson.certifications.reduce((acc, cert) => {
                    const provider = cert.certificationProvider.toUpperCase();
                    if (!acc[provider]) {
                      acc[provider] = [];
                    }
                    acc[provider].push(cert);
                    return acc;
                  }, {} as Record<string, typeof selectedPerson.certifications>);

                  return (
                    <>
                      {Object.entries(certsByProvider).map(([provider, certs]) => {
                        const providerLogo = PROVIDER_LOGOS[provider];

                        const logoSrc = providerLogo
                          ? (provider === 'AWS'
                            ? (theme === 'dark'
                              ? providerLogo.logo  // aws-light.png for dark mode
                              : (providerLogo.logoLight || providerLogo.logo))  // aws.svg for light mode
                            : (theme === 'dark'
                              ? (providerLogo.logoLight || providerLogo.logo)
                              : (provider === 'GITHUB'
                                ? providerLogo.logo
                                : (providerLogo.logoLight || providerLogo.logo))))
                          : null;

                        return (
                          <div key={provider} className="space-y-4 mb-8">
                            {/* Provider Header with Logo */}
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-border/60">
                              {logoSrc && (
                                <div className="w-11 h-11 bg-background rounded-lg border-2 border-primary/30 p-2 flex items-center justify-center shadow-sm">
                                  <img
                                    src={logoSrc}
                                    alt={provider}
                                    className={`w-full h-full object-contain ${provider === 'GITHUB' && theme === 'light' ? 'invert' : ''}`}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <div>
                                <h3 className="text-xl font-bold text-foreground mb-0.5">
                                  {provider} Certifications
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium">
                                  {certs.length} {certs.length === 1 ? 'certification' : 'certifications'}
                                </p>
                              </div>
                            </div>

                            {/* Certifications Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {certs.map((cert, index) => {
                                const providerName = cert.certificationProvider.toUpperCase();
                                const certProviderLogo = PROVIDER_LOGOS[providerName];

                                const certLogoSrc = certProviderLogo
                                  ? (providerName === 'AWS'
                                    ? (theme === 'dark'
                                      ? certProviderLogo.logo  // aws-light.png for dark mode
                                      : (certProviderLogo.logoLight || certProviderLogo.logo))  // aws.svg for light mode
                                    : (theme === 'dark'
                                      ? (certProviderLogo.logoLight || certProviderLogo.logo)
                                      : (providerName === 'GITHUB'
                                        ? certProviderLogo.logo
                                        : (certProviderLogo.logoLight || certProviderLogo.logo))))
                                  : null;

                                return (
                                  <motion.div
                                    key={cert.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative p-4 bg-card rounded-lg border-2 border-border/60 hover:border-primary/60 transition-all duration-200 hover:shadow-md"
                                  >
                                    {/* Certification Name */}
                                    <h4 className="font-semibold text-sm text-foreground mb-2.5 line-clamp-2 group-hover:text-primary transition-colors">
                                      {cert.certificationName}
                                    </h4>

                                    {/* Exam Code and Verified */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${PROVIDER_COLORS[providerName]
                                        ? `${PROVIDER_COLORS[providerName].bg} ${PROVIDER_COLORS[providerName].text} ${PROVIDER_COLORS[providerName].border}`
                                        : 'bg-primary/20 text-primary border-primary/30'
                                        }`}>
                                        {cert.examCode}
                                      </div>
                                      {cert.verifiedCredential && cert.verifiedCredential.trim() !== '' && (
                                        <>
                                          <span className="text-xs text-muted-foreground">•</span>
                                          <a
                                            href={cert.verifiedCredential}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/50 text-green-700 dark:text-green-400 transition-colors text-xs font-medium"
                                          >
                                            <span>Verified</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        </>
                                      )}
                                    </div>

                                    {/* Additional Notes */}
                                    {cert.additionalNotes && (
                                      <div className="mt-2.5 pt-2.5 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2" title={cert.additionalNotes}>
                                          "{cert.additionalNotes}"
                                        </p>
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Achievements;

