import { supabase } from "@/lib/supabase";

/**
 * Certification catalog loader. Reads providers and their certifications from
 * Supabase (`cert_providers`, `provider_certifications`) with hardcoded
 * fallbacks that match the live rows exactly. If Supabase is slow, errors,
 * or returns nothing, every getter resolves with the fallback so the site
 * keeps rendering the same content visitors see today. Each resource is
 * fetched once per session and every consumer shares the same promise.
 */

/* ------------------------------------------------------------------ */
/* Shared hook                                                          */
/* ------------------------------------------------------------------ */

/** Render with the fallback first, then swap in the fetched value. */
export { useSiteContent as useCertCatalog } from "@/lib/site-content";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type CatalogCert = { value: string; label: string; examCode: string };

export type FormProvider = {
  slug: string;
  label: string;
  enumValue: string;
  logoUrl: string;
  logoLightUrl?: string;
  brandColor?: string;
};

export type HomeProvider = {
  slug: string;
  name: string;
  short: string;
  count: number;
  blurb: string;
  logo?: string;
};

export type ReviewProvider = { id: string; label: string; color: string };

export type ProviderLogo = { logo: string; light?: string };

export type CertificationLogoInfo = {
  label: string;
  logo: string;
  logoLight?: string;
};

/* ------------------------------------------------------------------ */
/* Fallbacks. These must always equal the live catalog rows so the      */
/* first paint and the offline path look exactly like today.            */
/* ------------------------------------------------------------------ */

export const LOGO_BASE_URL =
  "https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications";

/** The ten providers shown in the certification form, in form order. */
export const FALLBACK_FORM_PROVIDERS: FormProvider[] = [
  { slug: "aws", label: "AWS", enumValue: "AWS", logoUrl: `${LOGO_BASE_URL}/aws.svg`, logoLightUrl: `${LOGO_BASE_URL}/aws-light.png`, brandColor: "#FF9900" },
  { slug: "azure", label: "Azure", enumValue: "AZURE", logoUrl: `${LOGO_BASE_URL}/Microsoft_Azure.svg`, brandColor: "#0078D4" },
  { slug: "gcp", label: "Google Cloud", enumValue: "GCP", logoUrl: `${LOGO_BASE_URL}/google_cloud.svg`, brandColor: "#4285F4" },
  { slug: "github", label: "GitHub", enumValue: "GITHUB", logoUrl: `${LOGO_BASE_URL}/github-white-icon.webp`, logoLightUrl: `${LOGO_BASE_URL}/github-white-icon.webp`, brandColor: "#181717" },
  { slug: "oracle", label: "Oracle", enumValue: "ORACLE", logoUrl: `${LOGO_BASE_URL}/Oracle_logo.svg`, brandColor: "#F80000" },
  { slug: "salesforce", label: "Salesforce", enumValue: "SALESFORCE", logoUrl: `${LOGO_BASE_URL}/Salesforce.com_logo.svg`, brandColor: "#00A1E0" },
  { slug: "servicenow", label: "ServiceNow", enumValue: "SERVICENOW", logoUrl: `${LOGO_BASE_URL}/ServiceNow_logo.svg`, brandColor: "#00A82E" },
  { slug: "openai", label: "OpenAI", enumValue: "OPENAI", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
  { slug: "hashicorp", label: "HashiCorp Certified", enumValue: "HASHICORP", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Terraform_Logo.svg/1280px-Terraform_Logo.svg.png?20181016201549" },
  { slug: "kubernetes", label: "Kubernetes Certified", enumValue: "KUBERNETES", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Kubernetes_logo_without_workmark.svg/1280px-Kubernetes_logo_without_workmark.svg.png?20190926210707", brandColor: "#326CE5" },
];

/**
 * The sixteen providers on the homepage grid, in the exact visible order.
 * `name`, `short` and `logo` are display choices that live here (the table
 * keeps shorter labels and different logo files), so the grid never shifts.
 */
export const FALLBACK_HOME_PROVIDERS: HomeProvider[] = [
  { slug: "aws", name: "Amazon AWS", short: "AWS", count: 30, blurb: "Cloud computing & DevOps", logo: "/logos/aws.svg" },
  { slug: "azure", name: "Microsoft Azure", short: "Azure", count: 25, blurb: "Cloud solutions & infra", logo: "/logos/azure.svg" },
  { slug: "gcp", name: "Google Cloud", short: "GCP", count: 18, blurb: "Enterprise cloud & data", logo: "/logos/googlecloud.svg" },
  { slug: "github", name: "GitHub", short: "GitHub", count: 20, blurb: "Version control & CI/CD", logo: "/logos/github.svg" },
  { slug: "kubernetes", name: "Kubernetes", short: "K8s", count: 14, blurb: "Container orchestration", logo: "/logos/kubernetes.svg" },
  { slug: "linux", name: "Linux Foundation", short: "Linux", count: 15, blurb: "Open-source & Linux", logo: "/logos/linux.svg" },
  { slug: "comptia", name: "CompTIA", short: "CompTIA", count: 20, blurb: "Vendor-neutral IT", logo: "/logos/comptia.svg" },
  { slug: "cisco", name: "Cisco", short: "Cisco", count: 16, blurb: "Networking & security", logo: "/logos/cisco.svg" },
  { slug: "salesforce", name: "Salesforce", short: "SF", count: 15, blurb: "CRM & cloud solutions", logo: "/logos/salesforce.svg" },
  { slug: "isc2", name: "ISC2", short: "ISC2", count: 13, blurb: "Security incl. CISSP" },
  { slug: "oracle", name: "Oracle", short: "Oracle", count: 12, blurb: "Database & enterprise", logo: "/logos/oracle.svg" },
  { slug: "ibm", name: "IBM", short: "IBM", count: 12, blurb: "Enterprise & cloud", logo: "/logos/ibm.svg" },
  { slug: "alibaba", name: "Alibaba", short: "Alibaba", count: 11, blurb: "Cloud & enterprise", logo: "/logos/alibabacloud.svg" },
  { slug: "servicenow", name: "ServiceNow", short: "SNOW", count: 10, blurb: "ITSM & automation", logo: "/logos/servicenow.svg" },
  { slug: "cncf", name: "CNCF", short: "CNCF", count: 10, blurb: "Cloud-native tech", logo: "/logos/cncf.svg" },
  { slug: "nvidia", name: "NVIDIA", short: "NVIDIA", count: 8, blurb: "AI & deep learning", logo: "/logos/nvidia.svg" },
];

/** Provider logos used by the certification form. */
export const FALLBACK_PROVIDER_LOGOS: Record<string, ProviderLogo> = {
  aws: { logo: `${LOGO_BASE_URL}/aws.svg`, light: `${LOGO_BASE_URL}/aws-light.png` },
  azure: { logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  gcp: { logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  github: { logo: `${LOGO_BASE_URL}/github-white-icon.webp`, light: `${LOGO_BASE_URL}/github-white-icon.webp` },
  oracle: { logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  salesforce: { logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  servicenow: { logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  openai: { logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
  hashicorp: { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Terraform_Logo.svg/1280px-Terraform_Logo.svg.png?20181016201549" },
  kubernetes: { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Kubernetes_logo_without_workmark.svg/1280px-Kubernetes_logo_without_workmark.svg.png?20190926210707" },
};

/** Brand hex colors per provider slug. */
export const FALLBACK_PROVIDER_COLORS: Record<string, string> = {
  aws: "#FF9900",
  azure: "#0078D4",
  gcp: "#4285F4",
  kubernetes: "#326CE5",
  terraform: "#844FBA",
  docker: "#2496ED",
  github: "#181717",
  salesforce: "#00A1E0",
  oracle: "#F80000",
  servicenow: "#00A82E",
};

/** The provider choices on the review form, with their exact labels. */
export const FALLBACK_REVIEW_PROVIDERS: ReviewProvider[] = [
  { id: "aws", label: "AWS", color: "#FF9900" },
  { id: "azure", label: "Azure", color: "#0078D4" },
  { id: "gcp", label: "Google Cloud", color: "#4285F4" },
  { id: "kubernetes", label: "Kubernetes", color: "#326CE5" },
  { id: "terraform", label: "Terraform", color: "#844FBA" },
  { id: "docker", label: "Docker", color: "#2496ED" },
  { id: "github", label: "GitHub", color: "#181717" },
  { id: "salesforce", label: "Salesforce", color: "#00A1E0" },
  { id: "oracle", label: "Oracle", color: "#F80000" },
  { id: "servicenow", label: "ServiceNow", color: "#00A82E" },
];

/**
 * Logo map for the review wall and Certified Yatris. Some entries are theme
 * tuned on purpose (the aws pair swaps dark and light art), so live rows
 * never replace these; new providers are only added alongside them.
 */
export const FALLBACK_CERTIFICATION_PROVIDER_LOGOS: Record<string, CertificationLogoInfo> = {
  aws: {
    label: "AWS",
    logo: "https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/logo/certifications/aws-light.png",
    logoLight: "https://raw.githubusercontent.com/yatricloud/yatri-images/9ee0e0a7c0c59ce45631091027b84069b3c4574f/certification.yatricloud.com/logo/certifications/aws.svg",
  },
  azure: {
    label: "Azure",
    logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg`,
  },
  gcp: {
    label: "Google Cloud",
    logo: `${LOGO_BASE_URL}/google_cloud.svg`,
  },
  kubernetes: {
    label: "Kubernetes",
    logo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Kubernetes_logo_without_workmark.svg/1280px-Kubernetes_logo_without_workmark.svg.png?20190926210707",
  },
  terraform: {
    label: "Terraform",
    logo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Terraform_Logo.svg/1280px-Terraform_Logo.svg.png?20181016201549",
  },
  hashicorp: {
    label: "HashiCorp Certified",
    logo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Terraform_Logo.svg/1280px-Terraform_Logo.svg.png?20181016201549",
  },
  docker: {
    label: "Docker",
    logo: "https://cdn.simpleicons.org/docker/2496ED",
  },
  github: {
    label: "GitHub",
    logo: "https://cdn.simpleicons.org/github/white",
    logoLight: "https://cdn.simpleicons.org/github/000000",
  },
  salesforce: {
    label: "Salesforce",
    logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg`,
  },
  oracle: {
    label: "Oracle",
    logo: `${LOGO_BASE_URL}/Oracle_logo.svg`,
  },
  servicenow: {
    label: "ServiceNow",
    logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg`,
  },
  openai: {
    label: "OpenAI",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
  },
};

/**
 * Decorative marquee tracks behind the hero headline. This is display copy,
 * not catalog data (Terraform and DevOps are tracks, not provider labels),
 * so it stays a fixed list and the marquee never reflows.
 */
export const FALLBACK_CERT_TRACKS = ["AWS", "Azure", "GCP", "Kubernetes", "Terraform", "DevOps"];

/** The provider choices on the voucher request form, with their exact wording. */
export const FALLBACK_VOUCHER_PROVIDERS: string[] = [
  "AWS (Amazon Web Services)",
  "Microsoft Azure",
  "Google Cloud (GCP)",
  "GitHub",
  "Oracle Cloud",
  "Salesforce",
  "ServiceNow",
  "OpenAI",
  "HashiCorp Certified",
  "Kubernetes Certified",
  "Other",
];

/** Voucher wording per slug. These strings ride along with each submission. */
const VOUCHER_LABELS_BY_SLUG: Record<string, string> = {
  aws: "AWS (Amazon Web Services)",
  azure: "Microsoft Azure",
  gcp: "Google Cloud (GCP)",
  github: "GitHub",
  oracle: "Oracle Cloud",
  salesforce: "Salesforce",
  servicenow: "ServiceNow",
  openai: "OpenAI",
  hashicorp: "HashiCorp Certified",
  kubernetes: "Kubernetes Certified",
};

/** Every certification per provider slug, copied from the live catalog. */
export const FALLBACK_PROVIDER_CERTS: Record<string, CatalogCert[]> = {
  aws: [
    { value: "cloud-practitioner", label: "AWS Certified Cloud Practitioner", examCode: "CLF-C02" },
    { value: "ai-practitioner", label: "AWS Certified AI Practitioner", examCode: "AIF-C01" },
    { value: "cloudops-associate", label: "AWS Certified CloudOps Engineer - Associate", examCode: "SOA-C03" },
    { value: "solutions-architect-associate", label: "AWS Certified Solutions Architect - Associate", examCode: "SAA-C03" },
    { value: "developer-associate", label: "AWS Certified Developer - Associate", examCode: "DVA-C02" },
    { value: "data-engineer-associate", label: "AWS Certified Data Engineer - Associate", examCode: "DEA-C01" },
    { value: "machine-learning-engineer-associate", label: "AWS Certified Machine Learning Engineer - Associate", examCode: "MLE-C01" },
    { value: "solutions-architect-professional", label: "AWS Certified Solutions Architect - Professional", examCode: "SAP-C02" },
    { value: "devops-engineer-professional", label: "AWS Certified DevOps Engineer - Professional", examCode: "DOP-C02" },
    { value: "genai-developer-professional", label: "AWS Certified Generative AI Developer - Professional (Beta)", examCode: "GENAI" },
    { value: "advanced-networking-specialty", label: "AWS Certified Advanced Networking - Specialty", examCode: "ANS-C01" },
    { value: "security-specialty", label: "AWS Certified Security - Specialty", examCode: "SCS-C02" },
    { value: "machine-learning-specialty", label: "AWS Certified Machine Learning - Specialty", examCode: "MLS-C01" },
  ],
  azure: [
    { value: "az-900", label: "AZ-900: Azure Fundamentals", examCode: "AZ-900" },
    { value: "ai-900", label: "AI-900: Azure AI Fundamentals", examCode: "AI-900" },
    { value: "dp-900", label: "DP-900: Azure Data Fundamentals", examCode: "DP-900" },
    { value: "sc-900", label: "SC-900: Security, Compliance, and Identity Fundamentals", examCode: "SC-900" },
    { value: "ms-900", label: "MS-900: Microsoft 365 Fundamentals", examCode: "MS-900" },
    { value: "mb-910", label: "MB-910: Dynamics 365 Fundamentals (CRM)", examCode: "MB-910" },
    { value: "mb-920", label: "MB-920: Dynamics 365 Fundamentals (ERP)", examCode: "MB-920" },
    { value: "az-104", label: "AZ-104: Azure Administrator Associate", examCode: "AZ-104" },
    { value: "az-204", label: "AZ-204: Azure Developer Associate", examCode: "AZ-204" },
    { value: "dp-203", label: "DP-203: Azure Data Engineer Associate", examCode: "DP-203" },
    { value: "dp-300", label: "DP-300: Azure Database Administrator Associate", examCode: "DP-300" },
    { value: "az-400", label: "AZ-400: DevOps Engineer Expert", examCode: "AZ-400" },
    { value: "az-500", label: "AZ-500: Azure Security Engineer Associate", examCode: "AZ-500" },
    { value: "az-700", label: "AZ-700: Azure Network Engineer Associate", examCode: "AZ-700" },
    { value: "az-305", label: "AZ-305: Azure Solutions Architect Expert", examCode: "AZ-305" },
    { value: "dp-600", label: "DP-600: Fabric Analytics Engineer Associate", examCode: "DP-600" },
    { value: "dp-700", label: "DP-700: Fabric Data Engineer Associate", examCode: "DP-700" },
    { value: "ai-102", label: "AI-102: Azure AI Engineer Associate", examCode: "AI-102" },
    { value: "dp-100", label: "DP-100: Azure Data Scientist Associate", examCode: "DP-100" },
    { value: "pl-400", label: "PL-400: Power Platform Developer Associate", examCode: "PL-400" },
    { value: "pl-200", label: "PL-200: Power Platform Functional Consultant Associate", examCode: "PL-200" },
    { value: "pl-500", label: "PL-500: Power Automate RPA Developer Associate", examCode: "PL-500" },
    { value: "pl-300", label: "PL-300: Power BI Data Analyst Associate", examCode: "PL-300" },
    { value: "pl-600", label: "PL-600: Power Platform Solution Architect Expert", examCode: "PL-600" },
    { value: "pl-900", label: "PL-900: Power Platform Fundamentals", examCode: "PL-900" },
    { value: "sc-200", label: "SC-200: Security Operations Analyst Associate", examCode: "SC-200" },
    { value: "sc-300", label: "SC-300: Identity and Access Administrator Associate", examCode: "SC-300" },
    { value: "sc-400", label: "SC-400: Information Protection and Compliance Administrator Associate", examCode: "SC-400" },
    { value: "sc-401", label: "SC-401: Information Protection and Compliance Administrator Associate", examCode: "SC-401" },
    { value: "sc-100", label: "SC-100: Cybersecurity Architect Expert", examCode: "SC-100" },
    { value: "md-102", label: "MD-102: Endpoint Administrator Associate", examCode: "MD-102" },
    { value: "ms-102", label: "MS-102: Administrator Expert", examCode: "MS-102" },
    { value: "ms-700", label: "MS-700: Teams Administrator Associate", examCode: "MS-700" },
    { value: "ms-721", label: "MS-721: Collaboration Communications Systems Engineer Associate", examCode: "MS-721" },
    { value: "mb-800", label: "MB-800: Dynamics 365 Business Central Functional Consultant Associate", examCode: "MB-800" },
    { value: "mb-820", label: "MB-820: Dynamics 365 Business Central Developer Associate", examCode: "MB-820" },
    { value: "mb-700", label: "MB-700: Dynamics 365: Finance and Operations Apps Solution Architect Expert", examCode: "MB-700" },
    { value: "mb-230", label: "MB-230: Dynamics 365 Customer Service Functional Consultant Associate", examCode: "MB-230" },
    { value: "mb-240", label: "MB-240: Dynamics 365 Field Service Functional Consultant Associate", examCode: "MB-240" },
    { value: "mb-280", label: "MB-280: Dynamics 365 Customer Experience Analyst Associate", examCode: "MB-280" },
    { value: "mb-300", label: "MB-300: Dynamics 365 Finance and Operations Apps Core", examCode: "MB-300" },
    { value: "mb-310", label: "MB-310: Dynamics 365 Finance Functional Consultant Associate", examCode: "MB-310" },
    { value: "mb-330", label: "MB-330: Dynamics 365 Supply Chain Management Functional Consultant Associate", examCode: "MB-330" },
    { value: "mb-335", label: "MB-335: Dynamics 365: Supply Chain Management Functional Consultant Expert", examCode: "MB-335" },
    { value: "mb-500", label: "MB-500: Dynamics 365: Finance and Operations Apps Developer Associate", examCode: "MB-500" },
    { value: "windows-server-hybrid-admin-associate", label: "Windows Server Hybrid Administrator Associate (AZ-800 / AZ-801)", examCode: "AZ-800 / AZ-801" },
    { value: "az-120", label: "AZ-120: Azure for SAP Workloads Specialty", examCode: "AZ-120" },
    { value: "az-140", label: "AZ-140: Azure Virtual Desktop Specialty", examCode: "AZ-140" },
    { value: "az-720", label: "AZ-720: Azure Stack HCI Specialty", examCode: "AZ-720" },
    { value: "dp-420", label: "DP-420: Azure Cosmos DB Developer Specialty", examCode: "DP-420" },
  ],
  gcp: [
    { value: "cloud-digital-leader", label: "Cloud Digital Leader (Foundational)", examCode: "CDL" },
    { value: "generative-ai-leader", label: "Generative AI Leader (Foundational)", examCode: "GAIL" },
    { value: "associate-cloud-engineer", label: "Associate Cloud Engineer", examCode: "ACE" },
    { value: "google-workspace-administrator", label: "Google Workspace Administrator (Associate)", examCode: "GWA" },
    { value: "data-practitioner", label: "Data Practitioner (Associate)", examCode: "DP" },
    { value: "professional-cloud-architect", label: "Cloud Architect (Professional)", examCode: "PCA" },
    { value: "professional-cloud-database-engineer", label: "Cloud Database Engineer (Professional)", examCode: "PCDBE" },
    { value: "professional-cloud-developer", label: "Cloud Developer (Professional)", examCode: "PCD" },
    { value: "professional-data-engineer", label: "Data Engineer (Professional)", examCode: "PDE" },
    { value: "professional-cloud-devops-engineer", label: "Cloud DevOps Engineer (Professional)", examCode: "PCDE" },
    { value: "professional-cloud-security-engineer", label: "Cloud Security Engineer (Professional)", examCode: "PCSE" },
    { value: "professional-cloud-network-engineer", label: "Cloud Network Engineer (Professional)", examCode: "PCNE" },
    { value: "professional-machine-learning-engineer", label: "Machine Learning Engineer (Professional)", examCode: "PMLE" },
    { value: "professional-security-operations-engineer", label: "Security Operations Engineer (Professional)", examCode: "PSOE" },
  ],
  github: [
    { value: "gh-900", label: "GitHub Foundations GH-900", examCode: "GH-900" },
    { value: "gh-1001", label: "GitHub Copilot Certification GH-1001 (NEW - Live)", examCode: "GH-1001" },
    { value: "gh-400", label: "GitHub Actions GH-400", examCode: "GH-400" },
    { value: "gh-500", label: "GitHub Advanced Security GH-500", examCode: "GH-500" },
    { value: "gh-300", label: "GitHub Administration GH-300", examCode: "GH-300" },
  ],
  oracle: [
    { value: "oci-2025-foundations-associate", label: "Oracle Cloud Infrastructure 2025 Foundations Associate", examCode: "OCI-FOUND-2025" },
    { value: "oracle-data-platform-2025-foundations-associate", label: "Oracle Data Platform 2025 Foundations Associate", examCode: "ODP-FOUND-2025" },
    { value: "oci-2025-ai-foundations-associate", label: "Oracle Cloud Infrastructure 2025 AI Foundations Associate", examCode: "OCI-AI-FOUND-2025" },
    { value: "oci-2025-architect-associate", label: "Oracle Cloud Infrastructure 2025 Architect Associate", examCode: "OCI-ARCH-ASSOC-2025" },
    { value: "oracle-redwood-application-2025-developer-associate", label: "Oracle Redwood Application 2025 Developer Associate", examCode: "REDWOOD-DEV-2025" },
    { value: "oci-2025-architect-professional", label: "Oracle Cloud Infrastructure 2025 Architect Professional", examCode: "OCI-ARCH-PRO-2025" },
    { value: "oracle-ai-vector-search-professional", label: "Oracle AI Vector Search Professional", examCode: "OAIVS-PRO" },
    { value: "oci-2025-multicloud-architect-professional", label: "Oracle Cloud Infrastructure 2025 Multicloud Architect Professional", examCode: "OCI-MULTI-ARCH-PRO-2025" },
    { value: "oci-2025-networking-professional", label: "Oracle Cloud Infrastructure 2025 Networking Professional", examCode: "OCI-NET-PRO-2025" },
    { value: "oci-2025-developer-professional", label: "Oracle Cloud Infrastructure 2025 Developer Professional", examCode: "OCI-DEV-PRO-2025" },
    { value: "oci-2025-devops-professional", label: "Oracle Cloud Infrastructure 2025 DevOps Professional", examCode: "OCI-DEVOPS-PRO-2025" },
    { value: "oracle-analytics-cloud-2025-professional", label: "Oracle Analytics Cloud 2025 Professional", examCode: "OAC-PRO-2025" },
    { value: "oracle-apex-cloud-developer-professional", label: "Oracle APEX Cloud Developer Professional", examCode: "APEX-CLOUD-PRO" },
    { value: "oci-2025-security-professional", label: "Oracle Cloud Infrastructure 2025 Security Professional", examCode: "OCI-SEC-PRO-2025" },
    { value: "oci-2025-cloud-operations-professional", label: "Oracle Cloud Infrastructure 2025 Cloud Operations Professional", examCode: "OCI-OPS-PRO-2025" },
    { value: "oci-2025-observability-professional", label: "Oracle Cloud Infrastructure 2025 Observability Professional", examCode: "OCI-OBS-PRO-2025" },
    { value: "oci-2025-migration-architect-professional", label: "Oracle Cloud Infrastructure 2025 Migration Architect Professional", examCode: "OCI-MIG-ARCH-PRO-2025" },
    { value: "oci-2025-generative-ai-professional", label: "Oracle Cloud Infrastructure 2025 Generative AI Professional", examCode: "OCI-GENAI-PRO-2025" },
    { value: "oci-2025-data-science-professional", label: "Oracle Cloud Infrastructure 2025 Data Science Professional", examCode: "OCI-DS-PRO-2025" },
    { value: "oci-2025-application-integration-professional", label: "Oracle Cloud Infrastructure 2025 Application Integration Professional", examCode: "OCI-APP-INT-PRO-2025" },
    { value: "oracle-ai-cloud-database-services-2025-professional", label: "Oracle AI Cloud Database Services 2025 Professional", examCode: "OAICDS-2025" },
    { value: "oracle-ai-autonomous-database-2025-professional", label: "Oracle AI Autonomous Database 2025 Professional", examCode: "OAIADB-PRO-2025" },
    { value: "oracle-database-aws-architect-professional", label: "Oracle Database@AWS Architect Professional", examCode: "ODB-AWS-ARCH-PRO" },
    { value: "oci-sunbird-ed-specialty", label: "Oracle Cloud Infrastructure for Sunbird ED Specialty", examCode: "OCI-SUNBIRD-ED" },
    { value: "oracle-database-administration-i", label: "Oracle Database Administration I", examCode: "DBA-I" },
    { value: "oracle-database-administration-ii", label: "Oracle Database Administration II", examCode: "DBA-II" },
    { value: "oracle-database-19c-performance-management-and-tuning", label: "Oracle Database 19c: Performance Management and Tuning", examCode: "DB-19C-PERF" },
    { value: "oracle-database-19c-data-guard-administration", label: "Oracle Database 19c: Data Guard Administration", examCode: "DB-19C-DG" },
    { value: "oracle-database-19c-rac-asm-grid", label: "Oracle Database 19c: RAC, ASM, and Grid Infrastructure Administration", examCode: "DB-19C-RAC-ASM" },
    { value: "oracle-database-sql", label: "Oracle Database SQL", examCode: "1Z0-071" },
    { value: "oracle-database-program-with-plsql", label: "Oracle Database Program with PL/SQL", examCode: "1Z0-149" },
    { value: "oracle-apex-cloud-developer-professional-db", label: "Oracle APEX Cloud Developer Professional", examCode: "APEX-CLOUD-PRO" },
    { value: "oracle-database-security-administration", label: "Oracle Database Security Administration", examCode: "DB-SEC-ADMIN" },
    { value: "oracle-database-foundations", label: "Oracle Database Foundations", examCode: "1Z0-006" },
    { value: "oracle-ai-database-administration-associate", label: "Oracle AI Database Administration Associate", examCode: "OAI-DBA-ASSOC" },
    { value: "oracle-ai-database-administration-professional", label: "Oracle AI Database Administration Professional", examCode: "OAI-DBA-PRO" },
    { value: "oracle-ai-database-sql-associate", label: "Oracle AI Database SQL Associate", examCode: "OAI-SQL-ASSOC" },
    { value: "oracle-ai-vector-search-professional-db", label: "Oracle AI Vector Search Professional", examCode: "OAIVS-PRO" },
    { value: "oracle-database-aws-architect-professional-db", label: "Oracle Database@AWS Architect Professional", examCode: "ODB-AWS-ARCH-PRO" },
    { value: "java-ee-7-application-developer", label: "Java EE 7 Application Developer", examCode: "1Z0-900" },
    { value: "java-se-8-programmer-i", label: "Java SE 8 Programmer I", examCode: "1Z0-808" },
    { value: "java-se-8-programmer-ii", label: "Java SE 8 Programmer II", examCode: "1Z0-809" },
    { value: "java-foundations", label: "Java Foundations", examCode: "1Z0-811" },
    { value: "java-se-11-developer", label: "Java SE 11 Developer", examCode: "1Z0-819" },
    { value: "java-se-17-developer", label: "Java SE 17 Developer", examCode: "1Z0-829" },
    { value: "java-se-21-developer-professional", label: "Java SE 21 Developer Professional", examCode: "1Z0-830" },
    { value: "helidon-microservices-developer", label: "Helidon Microservices Developer", examCode: "1Z0-1113" },
    { value: "mysql-8-database-administrator", label: "MySQL 8.0 Database Administrator", examCode: "MYSQL-8-DBA" },
    { value: "mysql-heatwave-implementation-associate-rel1", label: "MySQL HeatWave Implementation Associate Rel 1", examCode: "MYSQL-HW-ASSOC-1" },
    { value: "mysql-8-database-developer", label: "MySQL 8.0 Database Developer", examCode: "MYSQL-8-DEV" },
    { value: "mysql-implementation-associate", label: "MySQL Implementation Associate", examCode: "MYSQL-IMPL-ASSOC" },
    { value: "oracle-communications-sbc-implementation", label: "Oracle Communications Session Border Controller Implementation", examCode: "OC-SBC-IMPL" },
    { value: "oracle-communications-sbc-troubleshooting", label: "Oracle Communications Session Border Controller Troubleshooting", examCode: "OC-SBC-TSHOOT" },
    { value: "oracle-utilities-work-asset-cloud-2024-impl-pro", label: "Oracle Utilities Work and Asset Cloud 2024 Implementation Professional", examCode: "UTIL-WAC-2024-PRO" },
    { value: "oracle-utilities-meter-solution-cloud-2024-impl-pro", label: "Oracle Utilities Meter Solution Cloud Service 2024 Implementation Professional", examCode: "UTIL-MTR-2024-PRO" },
    { value: "oracle-utilities-c2m-customer-cloud-2025-impl-pro", label: "Oracle Utilities Customer to Meter and Customer Cloud Service 2025 Implementation Professional", examCode: "UTIL-C2M-2025-PRO" },
    { value: "primavera-p6-eppm-professional", label: "Primavera P6 Enterprise Project Portfolio Management Professional", examCode: "P6-EPPM-PRO" },
    { value: "primavera-unifier-administration-professional", label: "Primavera Unifier Administration Professional", examCode: "UNIFIER-ADMIN-PRO" },
    { value: "ebs-r12-1-gl-essentials", label: "Oracle E-Business Suite R12.1 General Ledger Essentials", examCode: "EBS-R12-GL" },
    { value: "ebs-r12-1-payables-essentials", label: "Oracle E-Business Suite R12.1 Payables Essentials", examCode: "EBS-R12-PAY" },
    { value: "ebs-r12-1-receivables-essentials", label: "Oracle E-Business Suite R12.1 Receivables Essentials", examCode: "EBS-R12-REC" },
    { value: "ebs-r12-hcm-essentials", label: "Oracle E-Business Suite (EBS) R12 Human Capital Management Essentials", examCode: "EBS-R12-HCM" },
    { value: "ebs-r12-1-purchasing-essentials", label: "Oracle E-Business Suite R12.1 Purchasing Essentials", examCode: "EBS-R12-PUR" },
    { value: "ebs-r12-project-essentials", label: "Oracle E-Business Suite (EBS) R12 Project Essentials", examCode: "EBS-R12-PROJ" },
    { value: "ebs-r12-1-inventory-essentials", label: "Oracle E-Business Suite R12.1 Inventory Essentials", examCode: "EBS-R12-INV" },
    { value: "ebs-r12-1-order-management-essentials", label: "Oracle E-Business Suite R12.1 Order Management Essentials", examCode: "EBS-R12-OM" },
    { value: "jde-e1-financial-mgmt-9-2-impl-essentials", label: "JD Edwards EnterpriseOne Financial Management 9.2 Implementation Essentials", examCode: "JDE-FIN-9-2" },
    { value: "jde-e1-distribution-9-2-impl-essentials", label: "JD Edwards EnterpriseOne Distribution 9.2 Implementation Essentials", examCode: "JDE-DIST-9-2" },
    { value: "jde-e1-cnc-9-2-impl-essentials", label: "JD Edwards EnterpriseOne Configurable Network Computing 9.2 Implementation Essentials", examCode: "JDE-CNC-9-2" },
    { value: "oracle-hyperion-planning-11-essentials", label: "Oracle Hyperion Planning 11 Essentials", examCode: "HYP-PLAN-11" },
    { value: "oracle-hyperion-fm-11-essentials", label: "Oracle Hyperion Financial Management 11 Essentials", examCode: "HYP-FM-11" },
    { value: "oracle-hyperion-drm-essentials", label: "Oracle Hyperion Data Relationship Management Essentials", examCode: "HYP-DRM" },
    { value: "oracle-weblogic-12c-admin-i", label: "Oracle WebLogic Server 12c: Administration I", examCode: "WLS-12C-ADMIN-I" },
    { value: "oracle-weblogic-12c-advanced-admin-ii", label: "Oracle WebLogic Server 12c: Advanced Administrator II", examCode: "WLS-12C-ADMIN-II" },
    { value: "oracle-weblogic-12c-essentials", label: "Oracle WebLogic Server 12c Essentials", examCode: "WLS-12C-ESS" },
    { value: "oracle-weblogic-14c-admin-pro", label: "Oracle WebLogic Server 14c Administrator Professional", examCode: "WLS-14C-ADMIN-PRO" },
    { value: "oracle-soa-suite-12c-essentials", label: "Oracle SOA Suite 12c Essentials", examCode: "SOA-12C-ESS" },
    { value: "oracle-bpm-12c-essentials", label: "Oracle Business Process Management Suite 12c Essentials", examCode: "BPM-12C-ESS" },
    { value: "oracle-data-integrator-12c-essentials", label: "Oracle Data Integrator 12c Essentials", examCode: "ODI-12C-ESS" },
    { value: "oracle-goldengate-12c-impl-essentials", label: "Oracle GoldenGate 12c Implementation Essentials", examCode: "OGG-12C-IMPL" },
    { value: "oracle-goldengate-19c-impl-pro", label: "Oracle GoldenGate 19c Implementation Certified Professional", examCode: "OGG-19C-PRO" },
    { value: "oracle-goldengate-23ai-impl-associate", label: "Oracle GoldenGate 23ai Implementation Associate", examCode: "OGG-23AI-ASSOC" },
    { value: "oracle-linux-8-advanced-sysadmin", label: "Oracle Linux 8 Advanced System Administration", examCode: "OL-8-ADV-SYSADMIN" },
    { value: "oracle-linux-virtualization-manager-assoc", label: "Oracle Linux Virtualization Manager Associate", examCode: "OL-VIRT-MGR-ASSOC" },
    { value: "oracle-solaris-11-system-admin", label: "Oracle Solaris 11 System Administration", examCode: "SOL-11-SYSADMIN" },
    { value: "oracle-solaris-11-advanced-system-admin", label: "Oracle Solaris 11 Advanced System Administration", examCode: "SOL-11-ADV-SYSADMIN" },
    { value: "oracle-solaris-11-install-config-essentials", label: "Oracle Solaris 11 Installation and Configuration Essentials", examCode: "SOL-11-INST-CONF" },
    { value: "oracle-solaris-11-upgrade-sysadmin", label: "Upgrade to Oracle Solaris 11 System Administrator", examCode: "SOL-11-UPGRADE" },
    { value: "oracle-exadata-x9m-impl-essentials", label: "Oracle Exadata Database Machine X9M Implementation Essentials", examCode: "EXADATA-X9M-IMPL" },
    { value: "oracle-vm-3-x86-essentials", label: "Oracle VM 3.0 for x86 Essentials", examCode: "OVM-3-X86-ESS" },
    { value: "oracle-analytics-cloud-2025-professional-dup", label: "Oracle Analytics Cloud 2025 Professional", examCode: "OAC-PRO-2025" },
    { value: "oracle-fusion-data-intelligence-2024-impl-pro", label: "Oracle Fusion Data Intelligence 2024 Implementation Professional", examCode: "FDI-2024-IMPL-PRO" },
    { value: "oracle-fccm-applications-professional", label: "Financial Crime and Compliance Management (FCCM) Applications Professional", examCode: "FCCM-APPS-PRO" },
    { value: "oracle-siebel-crm-foundations-assoc", label: "Oracle Siebel CRM Foundations Associate", examCode: "SIEBEL-FOUND-ASSOC" },
    { value: "oracle-siebel-crm-professional", label: "Oracle Siebel CRM Professional", examCode: "SIEBEL-PRO" },
    { value: "oracle-erp-process-essentials-certified", label: "Oracle Fusion Cloud Applications ERP Process Essentials Certified", examCode: "ERP-PROC-ESS" },
    { value: "oracle-erp-accounting-hub-2025-impl-pro", label: "Oracle Accounting Hub Cloud 2025 Implementation Professional", examCode: "ERP-AH-2025-PRO" },
    { value: "oracle-erp-accounting-hub-2025-impl-pro-delta", label: "Oracle Accounting Hub Cloud 2025 Implementation Professional\u2014Delta", examCode: "ERP-AH-2025-PRO-DELTA" },
    { value: "oracle-erp-gl-2025-impl-pro", label: "Oracle Financials Cloud: General Ledger 2025 Implementation Professional", examCode: "ERP-GL-2025-PRO" },
    { value: "oracle-erp-gl-2025-impl-pro-delta", label: "Oracle Financials Cloud: General Ledger 2025 Implementation Professional\u2014Delta", examCode: "ERP-GL-2025-PRO-DELTA" },
    { value: "oracle-erp-pay-exp-2025-impl-pro", label: "Oracle Financials Cloud: Payables and Expenses 2025 Implementation Professional", examCode: "ERP-AP-EXP-2025-PRO" },
    { value: "oracle-erp-pay-exp-2025-impl-pro-delta", label: "Oracle Financials Cloud: Payables and Expenses 2025 Implementation Professional\u2014Delta", examCode: "ERP-AP-EXP-2025-PRO-DELTA" },
    { value: "oracle-erp-rec-col-2025-impl-pro", label: "Oracle Financials Cloud: Receivables and Collections 2025 Implementation Professional", examCode: "ERP-AR-COLL-2025-PRO" },
    { value: "oracle-erp-rec-col-2025-impl-pro-delta", label: "Oracle Financials Cloud: Receivables and Collections 2025 Implementation Professional\u2014Delta", examCode: "ERP-AR-COLL-2025-PRO-DELTA" },
    { value: "oracle-erp-revenue-mgmt-2025-impl-pro", label: "Oracle Revenue Management Cloud Service 2025 Implementation Professional", examCode: "ERP-REV-2025-PRO" },
    { value: "oracle-erp-revenue-mgmt-2025-impl-pro-delta", label: "Oracle Revenue Management Cloud Service 2025 Implementation Professional\u2014Delta", examCode: "ERP-REV-2025-PRO-DELTA" },
    { value: "oracle-erp-risk-mgmt-2025-impl-pro", label: "Oracle Risk Management Cloud 2025 Implementation Professional", examCode: "ERP-RISK-2025-PRO" },
    { value: "oracle-erp-risk-mgmt-2025-impl-pro-delta", label: "Oracle Risk Management Cloud 2025 Implementation Professional\u2014Delta", examCode: "ERP-RISK-2025-PRO-DELTA" },
    { value: "oracle-erp-project-mgmt-2025-impl-pro", label: "Oracle Project Management Cloud 2025 Implementation Professional", examCode: "ERP-PM-2025-PRO" },
    { value: "oracle-erp-project-mgmt-2025-impl-pro-delta", label: "Oracle Project Management Cloud 2025 Implementation Professional\u2014Delta", examCode: "ERP-PM-2025-PRO-DELTA" },
    { value: "oracle-erp-fusion-ai-agent-studio-foundations", label: "Oracle Fusion AI Agent Studio Foundations Associate", examCode: "ERP-AI-AGENT-FOUND" },
    { value: "oracle-erp-ai-agent-studio-dev-pro", label: "Oracle AI Agent Studio for Fusion Applications Developers Professional", examCode: "ERP-AI-AGENT-DEV-PRO" },
    { value: "oracle-hcm-process-essentials-certified", label: "Oracle Fusion Cloud Applications HCM Process Essentials Certified", examCode: "HCM-PROC-ESS" },
    { value: "oracle-hcm-ghr-2025-impl-pro", label: "Oracle Global Human Resources Cloud 2025 Implementation Professional", examCode: "HCM-GHR-2025-PRO" },
    { value: "oracle-hcm-ghr-2025-impl-pro-delta", label: "Oracle Global Human Resources Cloud 2025 Implementation Professional\u2014Delta", examCode: "HCM-GHR-2025-PRO-DELTA" },
    { value: "oracle-hcm-benefits-2025-impl-pro", label: "Oracle Benefits Cloud 2025 Implementation Professional", examCode: "HCM-BEN-2025-PRO" },
    { value: "oracle-hcm-benefits-2025-impl-pro-delta", label: "Oracle Benefits Cloud 2025 Implementation Professional\u2014Delta", examCode: "HCM-BEN-2025-PRO-DELTA" },
    { value: "oracle-hcm-comp-2025-impl-pro", label: "Oracle Compensation Cloud 2025 Implementation Professional", examCode: "HCM-COMP-2025-PRO" },
    { value: "oracle-hcm-comp-2025-impl-pro-delta", label: "Oracle Compensation Cloud 2025 Implementation Professional\u2014Delta", examCode: "HCM-COMP-2025-PRO-DELTA" },
    { value: "oracle-hcm-payroll-2025-impl-pro", label: "Oracle Payroll Cloud 2025 Implementation Professional", examCode: "HCM-PAY-2025-PRO" },
    { value: "oracle-hcm-payroll-2025-impl-pro-delta", label: "Oracle Payroll Cloud 2025 Implementation Professional\u2014Delta", examCode: "HCM-PAY-2025-PRO-DELTA" },
    { value: "oracle-hcm-talent-2025-impl-pro", label: "Oracle Talent Management Cloud 2025 Implementation Professional", examCode: "HCM-TALENT-2025-PRO" },
    { value: "oracle-hcm-talent-2025-impl-pro-delta", label: "Oracle Talent Management Cloud 2025 Implementation Professional\u2014Delta", examCode: "HCM-TALENT-2025-PRO-DELTA" },
    { value: "oracle-hcm-learning-2025-impl-pro", label: "Oracle Learning Cloud 2025 Implementation Professional", examCode: "HCM-LEARN-2025-PRO" },
    { value: "oracle-hcm-learning-2025-impl-pro-delta", label: "Oracle Learning Cloud 2025 Implementation Professional\u2014Delta", examCode: "HCM-LEARN-2025-PRO-DELTA" },
    { value: "oracle-hcm-recruiting-2025-impl-pro", label: "Oracle Recruiting Cloud 2025 Implementation Professional", examCode: "HCM-REC-2025-PRO" },
    { value: "oracle-hcm-recruiting-2025-impl-pro-delta", label: "Oracle Recruiting Cloud 2025 Implementation Professional\u2014Delta", examCode: "HCM-REC-2025-PRO-DELTA" },
    { value: "oracle-hcm-absence-2025-impl-pro", label: "Oracle Absence Management Cloud 2025 Implementation Professional", examCode: "HCM-ABS-2025-PRO" },
    { value: "oracle-hcm-absence-2025-impl-pro-delta", label: "Oracle Absence Management Cloud 2025 Implementation Professional\u2014Delta", examCode: "HCM-ABS-2025-PRO-DELTA" },
    { value: "oracle-hcm-time-labor-2025-impl-pro", label: "Oracle Time and Labor Cloud 2025 Implementation Professional", examCode: "HCM-TL-2025-PRO" },
    { value: "oracle-hcm-time-labor-2025-impl-pro-delta", label: "Oracle Time and Labor Cloud 2025 Implementation Professional\u2014Delta", examCode: "HCM-TL-2025-PRO-DELTA" },
    { value: "oracle-hcm-fusion-ai-agent-studio-foundations", label: "Oracle Fusion AI Agent Studio Foundations Associate", examCode: "HCM-AI-AGENT-FOUND" },
    { value: "oracle-hcm-ai-agent-studio-dev-pro", label: "Oracle AI Agent Studio for Fusion Applications Developers Professional", examCode: "HCM-AI-AGENT-DEV-PRO" },
    { value: "oracle-epm-process-essentials-rel1", label: "Oracle Cloud Applications EPM Process Essentials - Rel 1", examCode: "EPM-PROC-ESS-REL1" },
    { value: "oracle-epm-fcc-2025-impl-pro", label: "Oracle Financial Consolidation and Close 2025 Implementation Professional", examCode: "EPM-FCC-2025-PRO" },
    { value: "oracle-epm-fcc-2025-impl-pro-delta", label: "Oracle Financial Consolidation and Close 2025 Implementation Professional - Delta", examCode: "EPM-FCC-2025-PRO-DELTA" },
    { value: "oracle-epm-planning-2025-impl-pro", label: "Oracle Planning 2025 Implementation Professional", examCode: "EPM-PLAN-2025-PRO" },
    { value: "oracle-epm-planning-2025-impl-pro-delta", label: "Oracle Planning 2025 Implementation Professional - Delta", examCode: "EPM-PLAN-2025-PRO-DELTA" },
    { value: "oracle-epm-account-rec-2025-impl-pro", label: "Oracle Account Reconciliation 2025 Implementation Professional", examCode: "EPM-AR-2025-PRO" },
    { value: "oracle-epm-account-rec-2025-impl-pro-delta", label: "Oracle Account Reconciliation 2025 Implementation Professional - Delta", examCode: "EPM-AR-2025-PRO-DELTA" },
    { value: "oracle-epm-data-int-2025-impl-pro", label: "Oracle Cloud EPM Data Integration 2025 Implementation Professional", examCode: "EPM-DI-2025-PRO" },
    { value: "oracle-epm-data-int-2025-impl-cert-pro-delta", label: "Oracle Cloud EPM Data Integration 2025 Implementation Certified Professional - Delta", examCode: "EPM-DI-2025-PRO-DELTA" },
    { value: "oracle-epm-narrative-reporting-2025-impl-pro", label: "Oracle Narrative Reporting 2025 Implementation Professional", examCode: "EPM-NR-2025-PRO" },
    { value: "oracle-epm-narrative-reporting-2025-impl-pro-delta", label: "Oracle Narrative Reporting 2025 Implementation Professional - Delta", examCode: "EPM-NR-2025-PRO-DELTA" },
    { value: "oracle-epm-pcm-2025-impl-pro", label: "Oracle Profitability and Cost Management 2025 Implementation Professional", examCode: "EPM-PCM-2025-PRO" },
    { value: "oracle-epm-pcm-2025-impl-pro-delta", label: "Oracle Profitability and Cost Management 2025 Implementation Professional - Delta", examCode: "EPM-PCM-2025-PRO-DELTA" },
    { value: "oracle-epm-edm-2025-impl-pro", label: "Oracle Enterprise Data Management Cloud 2025 Implementation Professional", examCode: "EPM-EDM-2025-PRO" },
    { value: "oracle-epm-edm-2025-impl-pro-delta", label: "Oracle Enterprise Data Management Cloud 2025 Implementation Professional - Delta", examCode: "EPM-EDM-2025-PRO-DELTA" },
    { value: "oracle-epm-fusion-ai-agent-studio-foundations", label: "Oracle Fusion AI Agent Studio Foundations Associate", examCode: "EPM-AI-AGENT-FOUND" },
    { value: "oracle-epm-ai-agent-studio-dev-pro", label: "Oracle AI Agent Studio for Fusion Applications Developers Professional", examCode: "EPM-AI-AGENT-DEV-PRO" },
    { value: "oracle-scm-pcm-2025-impl-pro-delta", label: "Oracle Profitability and Cost Management 2025 Implementation Professional - Delta", examCode: "SCM-PCM-2025-PRO-DELTA" },
    { value: "oracle-scm-edm-2025-impl-pro", label: "Oracle Enterprise Data Management Cloud 2025 Implementation Professional", examCode: "SCM-EDM-2025-PRO" },
    { value: "oracle-scm-edm-2025-impl-pro-delta", label: "Oracle Enterprise Data Management Cloud 2025 Implementation Professional - Delta", examCode: "SCM-EDM-2025-PRO-DELTA" },
    { value: "oracle-scm-fusion-ai-agent-studio-foundations", label: "Oracle Fusion AI Agent Studio Foundations Associate", examCode: "SCM-AI-AGENT-FOUND" },
    { value: "oracle-scm-ai-agent-studio-dev-pro", label: "Oracle AI Agent Studio for Fusion Applications Developers Professional", examCode: "SCM-AI-AGENT-DEV-PRO" },
    { value: "oracle-cx-process-essentials-certified", label: "Oracle Fusion Cloud Applications CX Process Essentials Certified", examCode: "CX-PROC-ESS" },
    { value: "oracle-cx-sales-2025-impl-pro", label: "Oracle CX Sales 2025 Implementation Professional", examCode: "CX-SALES-2025-PRO" },
    { value: "oracle-cx-sales-2025-impl-pro-delta", label: "Oracle CX Sales 2025 Implementation Professional - Delta", examCode: "CX-SALES-2025-PRO-DELTA" },
    { value: "oracle-cx-commerce-2025-impl-pro", label: "Oracle CX Commerce 2025 Implementation Professional", examCode: "CX-COMM-2025-PRO" },
    { value: "oracle-cx-commerce-2025-impl-pro-delta", label: "Oracle CX Commerce 2025 Implementation Professional - Delta", examCode: "CX-COMM-2025-PRO-DELTA" },
    { value: "oracle-cx-cpq-2025-impl-pro", label: "Oracle CPQ 2025 Implementation Professional", examCode: "CX-CPQ-2025-PRO" },
    { value: "oracle-cx-cpq-2025-impl-pro-delta", label: "Oracle CPQ 2025 Implementation Professional - Delta", examCode: "CX-CPQ-2025-PRO-DELTA" },
    { value: "oracle-cx-fusion-service-2025-impl-pro", label: "Oracle Fusion Service 2025 Implementation Professional", examCode: "CX-SVC-2025-PRO" },
    { value: "oracle-cx-fusion-service-2025-impl-pro-delta", label: "Oracle Fusion Service 2025 Implementation Professional - Delta", examCode: "CX-SVC-2025-PRO-DELTA" },
    { value: "oracle-cx-intelligent-advisor-2025-impl-pro", label: "Oracle Intelligent Advisor 2025 Implementation Professional", examCode: "CX-IA-2025-PRO" },
    { value: "oracle-cx-intelligent-advisor-2025-impl-pro-delta", label: "Oracle Intelligent Advisor 2025 Implementation Professional - Delta", examCode: "CX-IA-2025-PRO-DELTA" },
    { value: "oracle-cx-field-service-2025-impl-pro", label: "Oracle Field Service 2025 Implementation Professional", examCode: "CX-FS-2025-PRO" },
    { value: "oracle-cx-field-service-2025-impl-pro-delta", label: "Oracle Field Service 2025 Implementation Professional - Delta", examCode: "CX-FS-2025-PRO-DELTA" },
    { value: "oracle-cx-b2c-service-2025-impl-pro", label: "Oracle B2C Service 2025 Implementation Professional", examCode: "CX-B2C-2025-PRO" },
    { value: "oracle-cx-b2c-service-2025-impl-pro-delta", label: "Oracle B2C Service 2025 Implementation Professional - Delta", examCode: "CX-B2C-2025-PRO-DELTA" },
    { value: "oracle-cx-eloqua-2025-impl-pro", label: "Oracle Eloqua Marketing 2025 Implementation Professional", examCode: "CX-ELOQUA-2025-PRO" },
    { value: "oracle-cx-eloqua-2025-impl-pro-delta", label: "Oracle Eloqua Marketing 2025 Implementation Professional - Delta", examCode: "CX-ELOQUA-2025-PRO-DELTA" },
    { value: "oracle-cx-responsys-2025-impl-pro", label: "Oracle Responsys Marketing Platform 2025 Implementation Professional", examCode: "CX-RESP-2025-PRO" },
    { value: "oracle-cx-responsys-2025-impl-pro-delta", label: "Oracle Responsys Marketing Platform 2025 Implementation Professional \u2013 Delta", examCode: "CX-RESP-2025-PRO-DELTA" },
    { value: "oracle-cx-fusion-ai-agent-studio-foundations", label: "Oracle Fusion AI Agent Studio Foundations Associate", examCode: "CX-AI-AGENT-FOUND" },
    { value: "oracle-cx-ai-agent-studio-dev-pro", label: "Oracle AI Agent Studio for Fusion Applications Developers Professional", examCode: "CX-AI-AGENT-DEV-PRO" },
    { value: "oracle-gl-content-dev-foundations-assoc", label: "Oracle Guided Learning Content Developer Foundations Associate", examCode: "OGL-CONTENT-FOUND" },
    { value: "oracle-gl-project-mgmt-foundations-assoc", label: "Oracle Guided Learning Project Management Foundations Associate", examCode: "OGL-PM-FOUND" },
    { value: "oracle-gl-admin-foundations-assoc", label: "Oracle Guided Learning Administrator Foundations Associate", examCode: "OGL-ADMIN-FOUND" },
  ],
  salesforce: [
    { value: "platform-foundations", label: "Platform Foundations", examCode: "PF" },
    { value: "sales-foundations", label: "Sales Foundations", examCode: "SF" },
    { value: "marketing-cloud-engagement-foundations", label: "Marketing Cloud Engagement Foundations", examCode: "MCEF" },
    { value: "tableau-desktop-foundations", label: "Tableau Desktop Foundations", examCode: "TDF" },
    { value: "mulesoft-integration-foundations", label: "MuleSoft Integration Foundations", examCode: "MIF" },
    { value: "slack-administrator", label: "Slack Administrator", examCode: "SA" },
    { value: "tableau-server-administrator", label: "Tableau Server Administrator", examCode: "TSA" },
    { value: "cpq-administrator", label: "CPQ Administrator", examCode: "CPQA" },
    { value: "slack-consultant", label: "Slack Consultant", examCode: "SC" },
    { value: "ai-associate", label: "AI Associate", examCode: "AIA" },
    { value: "platform-administrator", label: "Platform Administrator", examCode: "PA" },
    { value: "platform-administrator-ii", label: "Platform Administrator II", examCode: "PA2" },
    { value: "platform-app-builder", label: "Platform App Builder", examCode: "PAB" },
    { value: "platform-developer", label: "Platform Developer", examCode: "PD" },
    { value: "javascript-developer", label: "JavaScript Developer", examCode: "JSD" },
    { value: "industries-cpq-developer", label: "Industries CPQ Developer", examCode: "ICPQD" },
    { value: "b2c-commerce-developer", label: "B2C Commerce Developer", examCode: "B2CCD" },
    { value: "sales-cloud-consultant", label: "Sales Cloud Consultant", examCode: "SCC" },
    { value: "service-cloud-consultant", label: "Service Cloud Consultant", examCode: "SCC2" },
    { value: "experience-cloud-consultant", label: "Experience Cloud Consultant", examCode: "ECC" },
    { value: "field-service-cloud-consultant", label: "Field Service Cloud Consultant", examCode: "FSCC" },
    { value: "data-cloud-consultant", label: "Data Cloud Consultant", examCode: "DCC" },
    { value: "agentforce-specialist", label: "Agentforce Specialist", examCode: "AFS" },
    { value: "mulesoft-developer", label: "MuleSoft Developer", examCode: "MSD" },
    { value: "slack-developer", label: "Slack Developer", examCode: "SD" },
    { value: "identity-access-management-architect", label: "Identity & Access Management Architect", examCode: "IAMA" },
    { value: "business-analyst", label: "Business Analyst", examCode: "BA" },
    { value: "platform-developer-ii", label: "Platform Developer II", examCode: "PD2" },
    { value: "omnistudio-developer", label: "OmniStudio Developer", examCode: "OSD" },
    { value: "omnistudio-consultant", label: "OmniStudio Consultant", examCode: "OSC" },
    { value: "marketing-cloud-administrator", label: "Marketing Cloud Administrator", examCode: "MCA" },
    { value: "marketing-cloud-engagement-consultant", label: "Marketing Cloud Engagement Consultant", examCode: "MCEC" },
    { value: "marketing-cloud-engagement-developer", label: "Marketing Cloud Engagement Developer", examCode: "MCED" },
    { value: "marketing-cloud-email-specialist", label: "Marketing Cloud Email Specialist", examCode: "MCES" },
    { value: "marketing-cloud-account-engagement-consultant", label: "Marketing Cloud Account Engagement Consultant", examCode: "MCAEC" },
    { value: "marketing-cloud-account-engagement-specialist", label: "Marketing Cloud Account Engagement Specialist", examCode: "MCAES" },
    { value: "b2c-solution-architect", label: "B2C Solution Architect", examCode: "B2CSA" },
    { value: "platform-strategy-designer", label: "Platform Strategy Designer", examCode: "PSD" },
    { value: "platform-user-experience-designer", label: "Platform User Experience Designer", examCode: "PUXD" },
    { value: "nonprofit-cloud-consultant", label: "Nonprofit Cloud Consultant", examCode: "NPCC" },
    { value: "nonprofit-success-pack-consultant", label: "Nonprofit Success Pack Consultant", examCode: "NSPC" },
    { value: "education-cloud-consultant", label: "Education Cloud Consultant", examCode: "ECC2" },
    { value: "tableau-crm-einstein-discovery-consultant", label: "Tableau CRM & Einstein Discovery Consultant", examCode: "TCEDC" },
    { value: "platform-sharing-visibility-architect", label: "Platform Sharing & Visibility Architect", examCode: "PSVA" },
    { value: "mulesoft-developer-ii", label: "MuleSoft Developer II", examCode: "MSD2" },
    { value: "mulesoft-hyperautomation-developer", label: "MuleSoft Hyperautomation Developer", examCode: "MSHD" },
    { value: "platform-dev-lifecycle-deployment-architect", label: "Platform Dev Lifecycle & Deployment Architect", examCode: "PDLDA" },
    { value: "system-architect", label: "System Architect", examCode: "SA2" },
    { value: "application-architect", label: "Application Architect", examCode: "AA" },
    { value: "b2b-solution-architect", label: "B2B Solution Architect", examCode: "B2BSA" },
    { value: "b2c-commerce-architect", label: "B2C Commerce Architect", examCode: "B2CCA" },
    { value: "heroku-architect", label: "Heroku Architect", examCode: "HA" },
    { value: "tableau-architect", label: "Tableau Architect", examCode: "TA" },
    { value: "mulesoft-platform-architect", label: "MuleSoft Platform Architect", examCode: "MSPA" },
    { value: "mulesoft-integration-architect", label: "MuleSoft Integration Architect", examCode: "MSIA" },
    { value: "platform-integration-architect", label: "Platform Integration Architect", examCode: "PIA" },
    { value: "platform-data-architect", label: "Platform Data Architect", examCode: "PDA" },
    { value: "technical-architect", label: "Technical Architect", examCode: "TA2" },
  ],
  servicenow: [
    { value: "certified-technical-architect", label: "Certified Technical Architect (CTA)", examCode: "CTA" },
    { value: "certified-master-architect", label: "Certified Master Architect (CMA)", examCode: "CMA" },
    { value: "certified-system-administrator", label: "Certified System Administrator (CSA)", examCode: "CSA" },
    { value: "certified-application-developer", label: "Certified Application Developer (CAD)", examCode: "CAD" },
    { value: "cis-itsm", label: "CIS - IT Service Management (CIS-ITSM)", examCode: "CIS-ITSM" },
    { value: "cis-itom", label: "CIS - IT Operations Management (CIS-ITOM)", examCode: "CIS-ITOM" },
    { value: "cis-csm", label: "CIS - Customer Service Management (CIS-CSM)", examCode: "CIS-CSM" },
    { value: "cis-hr", label: "CIS - HR Service Delivery (CIS-HR)", examCode: "CIS-HR" },
    { value: "cis-sir", label: "CIS - Security Incident Response (CIS-SIR)", examCode: "CIS-SIR" },
    { value: "cis-vr", label: "CIS - Vulnerability Response (CIS-VR)", examCode: "CIS-VR" },
    { value: "cis-discovery", label: "CIS - Discovery (CIS-Discovery)", examCode: "CIS-Discovery" },
    { value: "cis-em", label: "CIS - Event Management (CIS-EM)", examCode: "CIS-EM" },
    { value: "cis-sam", label: "CIS - Software Asset Management (CIS-SAM)", examCode: "CIS-SAM" },
    { value: "cis-ham", label: "CIS - Hardware Asset Management (CIS-HAM)", examCode: "CIS-HAM" },
    { value: "cis-rc", label: "CIS - Risk and Compliance (CIS-RC)", examCode: "CIS-RC" },
    { value: "cis-cloud-provisioning-governance", label: "CIS - Cloud Provisioning and Governance", examCode: "CIS-CPG" },
    { value: "cis-fsm", label: "CIS - Field Service Management (CIS-FSM)", examCode: "CIS-FSM" },
    { value: "cis-apm", label: "CIS - Application Portfolio Management (CIS-APM)", examCode: "CIS-APM" },
    { value: "cis-spm", label: "CIS - Strategic Portfolio Management (CIS-SPM)", examCode: "CIS-SPM" },
    { value: "cis-irm", label: "CIS - Integrated Risk Management (CIS-IRM)", examCode: "CIS-IRM" },
    { value: "cis-ape", label: "CIS - App Engine (CIS-APE)", examCode: "CIS-APE" },
    { value: "mc-welcome-to-servicenow", label: "MC - Welcome to ServiceNow", examCode: "MC-WTS" },
    { value: "mc-predictive-intelligence", label: "MC - Predictive Intelligence", examCode: "MC-PI" },
    { value: "mc-virtual-agent", label: "MC - Virtual Agent", examCode: "MC-VA" },
    { value: "mc-automated-test-framework", label: "MC - Automated Test Framework", examCode: "MC-ATF" },
    { value: "mc-flow-designer", label: "MC - Flow Designer", examCode: "MC-FD" },
    { value: "mc-integration-hub", label: "MC - Integration Hub", examCode: "MC-IH" },
    { value: "mc-performance-analytics", label: "MC - Performance Analytics", examCode: "MC-PA" },
    { value: "mc-service-portal", label: "MC - Service Portal", examCode: "MC-SP" },
    { value: "mc-agile-development", label: "MC - Agile Development", examCode: "MC-AD" },
    { value: "mc-application-developer-process-creator", label: "MC - Application Developer Process Creator", examCode: "MC-ADPC" },
    { value: "mc-citizen-developer-application-creator", label: "MC - Citizen Developer Application Creator", examCode: "MC-CDAC" },
    { value: "mc-generative-ai-executive", label: "MC - Generative AI (Executive)", examCode: "MC-GAI-E" },
    { value: "mc-now-assist", label: "MC - Now Assist (NEW 2025)", examCode: "MC-NA" },
    { value: "cloud-cost-management-accreditation", label: "Cloud Cost Management Accreditation (NEW)", examCode: "CCMA" },
  ],
  openai: [
    { value: "chatgpt-foundations-teachers", label: "ChatGPT Foundations for Teachers", examCode: "CGFT" },
  ],
  hashicorp: [
    { value: "terraform-associate", label: "Terraform Associate", examCode: "TA" },
    { value: "terraform-authoring-operations-professional", label: "Terraform Authoring and Operations Professional", examCode: "TAOP" },
    { value: "vault-associate", label: "Vault Associate", examCode: "VA" },
    { value: "vault-operations-professional", label: "Vault Operations Professional", examCode: "VOP" },
    { value: "consul-associate", label: "Consul Associate", examCode: "CA" },
  ],
  kubernetes: [
    { value: "kcna", label: "Kubernetes and Cloud Native Associate (KCNA)", examCode: "KCNA" },
    { value: "kcsa", label: "Kubernetes and Cloud Native Security Associate (KCSA)", examCode: "KCSA" },
    { value: "ckad", label: "Certified Kubernetes Application Developer (CKAD)", examCode: "CKAD" },
    { value: "cka", label: "Certified Kubernetes Administrator (CKA)", examCode: "CKA" },
    { value: "cks", label: "Certified Kubernetes Security Specialist (CKS)", examCode: "CKS" },
  ],
};

/* ------------------------------------------------------------------ */
/* Session cache. One shared promise per resource.                      */
/* ------------------------------------------------------------------ */

type CertProviderRow = {
  slug: string;
  label: string | null;
  enum_value: string | null;
  logo_url: string | null;
  logo_light_url: string | null;
  brand_color: string | null;
  blurb: string | null;
  cert_count: number | null;
  show_on_home: boolean | null;
  show_in_forms: boolean | null;
};

let providerRowsPromise: Promise<CertProviderRow[] | null> | null = null;

/** Active `cert_providers` rows in sort order, or null when unavailable. */
function fetchProviderRows(): Promise<CertProviderRow[] | null> {
  if (!providerRowsPromise) {
    providerRowsPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("cert_providers")
          .select(
            "slug, label, enum_value, logo_url, logo_light_url, brand_color, blurb, cert_count, show_on_home, show_in_forms"
          )
          .eq("active", true)
          .order("sort_order", { ascending: true });
        if (error || !data || data.length === 0) return null;
        return data as CertProviderRow[];
      } catch {
        return null;
      }
    })();
  }
  return providerRowsPromise;
}

let formProvidersPromise: Promise<FormProvider[]> | null = null;
let homeProvidersPromise: Promise<HomeProvider[]> | null = null;
let providerCertsPromise: Promise<Record<string, CatalogCert[]>> | null = null;
let providerLogosPromise: Promise<Record<string, ProviderLogo>> | null = null;
let providerColorsPromise: Promise<Record<string, string>> | null = null;
let reviewProvidersPromise: Promise<ReviewProvider[]> | null = null;
let certificationLogosPromise: Promise<Record<string, CertificationLogoInfo>> | null = null;
let voucherProvidersPromise: Promise<string[]> | null = null;

/* ------------------------------------------------------------------ */
/* Getters. Never throw; they resolve with the fallback instead.        */
/* ------------------------------------------------------------------ */

/** Active form providers (show_in_forms) in sort order. */
export function getFormProviders(): Promise<FormProvider[]> {
  if (!formProvidersPromise) {
    formProvidersPromise = (async () => {
      const rows = await fetchProviderRows();
      const forms = (rows || []).filter((r) => r.show_in_forms);
      if (forms.length === 0) return FALLBACK_FORM_PROVIDERS;
      return forms.map((r) => ({
        slug: String(r.slug),
        label: String(r.label ?? r.slug),
        enumValue: String(r.enum_value ?? r.slug).toUpperCase(),
        logoUrl: r.logo_url || FALLBACK_PROVIDER_LOGOS[r.slug]?.logo || "",
        logoLightUrl: r.logo_light_url || undefined,
        brandColor: r.brand_color || undefined,
      }));
    })();
  }
  return formProvidersPromise;
}

/**
 * Active homepage providers (show_on_home). Counts and blurbs come from the
 * table; the display name, short tag and grid logo stay with the fallback
 * entry for the same slug so the homepage grid keeps its exact look.
 */
export function getHomeProviders(): Promise<HomeProvider[]> {
  if (!homeProvidersPromise) {
    homeProvidersPromise = (async () => {
      const rows = await fetchProviderRows();
      const home = (rows || []).filter((r) => r.show_on_home);
      if (home.length === 0) return FALLBACK_HOME_PROVIDERS;
      const bySlug = new Map(home.map((r) => [r.slug, r]));
      const merged: HomeProvider[] = [];
      for (const p of FALLBACK_HOME_PROVIDERS) {
        const row = bySlug.get(p.slug);
        if (!row) continue;
        bySlug.delete(p.slug);
        merged.push({
          ...p,
          count: typeof row.cert_count === "number" ? row.cert_count : p.count,
          blurb: row.blurb || p.blurb,
        });
      }
      for (const row of bySlug.values()) {
        merged.push({
          slug: String(row.slug),
          name: String(row.label ?? row.slug),
          short: String(row.label ?? row.slug),
          count: row.cert_count ?? 0,
          blurb: row.blurb || "",
          logo: row.logo_url || undefined,
        });
      }
      return merged.length > 0 ? merged : FALLBACK_HOME_PROVIDERS;
    })();
  }
  return homeProvidersPromise;
}

/** Every active certification grouped by provider slug, in sort order. */
export function getAllProviderCerts(): Promise<Record<string, CatalogCert[]>> {
  if (!providerCertsPromise) {
    providerCertsPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("provider_certifications")
          .select("provider_slug, value, label, exam_code")
          .eq("active", true)
          .order("sort_order", { ascending: true });
        if (error || !data || data.length === 0) return FALLBACK_PROVIDER_CERTS;
        const grouped: Record<string, CatalogCert[]> = {};
        type CertRow = {
          provider_slug: string | null;
          value: string | null;
          label: string | null;
          exam_code: string | null;
        };
        for (const row of data as CertRow[]) {
          const slug = String(row.provider_slug ?? "");
          if (!slug || !row.value) continue;
          (grouped[slug] ||= []).push({
            value: String(row.value),
            label: String(row.label ?? ""),
            examCode: String(row.exam_code ?? ""),
          });
        }
        // A provider missing from the table keeps its fallback list so the
        // form always has choices to offer.
        return { ...FALLBACK_PROVIDER_CERTS, ...grouped };
      } catch {
        return FALLBACK_PROVIDER_CERTS;
      }
    })();
  }
  return providerCertsPromise;
}

/** Certifications for one provider slug. */
export async function getProviderCerts(slug: string): Promise<CatalogCert[]> {
  const all = await getAllProviderCerts();
  return all[slug] || [];
}

/** Logo pair per provider slug (dark art plus optional light art). */
export function getProviderLogos(): Promise<Record<string, ProviderLogo>> {
  if (!providerLogosPromise) {
    providerLogosPromise = (async () => {
      const rows = await fetchProviderRows();
      if (!rows) return FALLBACK_PROVIDER_LOGOS;
      const fromDb: Record<string, ProviderLogo> = {};
      for (const r of rows) {
        if (!r.logo_url) continue;
        fromDb[r.slug] = { logo: r.logo_url, light: r.logo_light_url || undefined };
      }
      return { ...FALLBACK_PROVIDER_LOGOS, ...fromDb };
    })();
  }
  return providerLogosPromise;
}

/** Brand hex color per provider slug. */
export function getProviderColors(): Promise<Record<string, string>> {
  if (!providerColorsPromise) {
    providerColorsPromise = (async () => {
      const rows = await fetchProviderRows();
      if (!rows) return FALLBACK_PROVIDER_COLORS;
      const fromDb: Record<string, string> = {};
      for (const r of rows) {
        if (r.brand_color) fromDb[r.slug] = r.brand_color;
      }
      return { ...FALLBACK_PROVIDER_COLORS, ...fromDb };
    })();
  }
  return providerColorsPromise;
}

/**
 * Provider choices for the review form. Colors come from the catalog; the
 * labels keep the wording reviewers already see (for example "Kubernetes"
 * rather than the longer form label) so the dropdown reads the same.
 */
export function getReviewProviders(): Promise<ReviewProvider[]> {
  if (!reviewProvidersPromise) {
    reviewProvidersPromise = (async () => {
      const colors = await getProviderColors();
      return FALLBACK_REVIEW_PROVIDERS.map((p) => ({
        ...p,
        color: colors[p.id] || p.color,
      }));
    })();
  }
  return reviewProvidersPromise;
}

/**
 * Logo map for the review surfaces. Existing entries always win because a
 * few are theme tuned by hand; catalog rows only contribute providers the
 * map does not know yet.
 */
export function getCertificationProviderLogos(): Promise<Record<string, CertificationLogoInfo>> {
  if (!certificationLogosPromise) {
    certificationLogosPromise = (async () => {
      const rows = await fetchProviderRows();
      if (!rows) return FALLBACK_CERTIFICATION_PROVIDER_LOGOS;
      const merged: Record<string, CertificationLogoInfo> = {
        ...FALLBACK_CERTIFICATION_PROVIDER_LOGOS,
      };
      for (const r of rows) {
        if (merged[r.slug] || !r.logo_url) continue;
        merged[r.slug] = {
          label: String(r.label ?? r.slug),
          logo: r.logo_url,
          logoLight: r.logo_light_url || undefined,
        };
      }
      return merged;
    })();
  }
  return certificationLogosPromise;
}

/**
 * Provider names for the voucher request form, ending with "Other". Known
 * slugs keep their exact voucher wording (submissions store these strings);
 * providers added to the catalog later appear with their catalog label.
 */
export function getVoucherProviders(): Promise<string[]> {
  if (!voucherProvidersPromise) {
    voucherProvidersPromise = (async () => {
      const forms = await getFormProviders();
      if (forms === FALLBACK_FORM_PROVIDERS) return FALLBACK_VOUCHER_PROVIDERS;
      const labels = forms.map((fp) => VOUCHER_LABELS_BY_SLUG[fp.slug] || fp.label);
      return [...labels, "Other"];
    })();
  }
  return voucherProvidersPromise;
}
