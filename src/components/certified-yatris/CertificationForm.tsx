import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, Upload, X, Calendar, Check, Edit, Trash2, Plus } from "lucide-react";
import { submitCertification, fetchCertifications } from "@/lib/google-sheets";
import { getUserCertifications, updateCertification, deleteCertification } from "@/lib/yatris-api";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CertificationFormData {
  fullName: string;
  email: string;
  selectedProviders: string[]; // Array of selected provider values
  selectedCertifications: string[]; // Array of certification values
  certificationDate: string;
  linkedinUrl: string;
  verifiedCredential: string;
  country: string;
  stateProvince: string;
  city: string;
  countryCode: string;
  phoneNumber: string;
  photo: File | null;
  additionalNotes?: string;
}

interface SelectedCertification {
  value: string;
  label: string;
  code: string;
  logo?: string;
  logoLight?: string;
}

// Base URL for certification logos
const LOGO_BASE_URL = "https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications";

// Provider logos mapping
const PROVIDER_LOGOS: Record<string, { logo: string; logoLight?: string }> = {
  aws: { logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  azure: { logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  gcp: { logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  github: { logo: `${LOGO_BASE_URL}/github-white-icon.webp`, logoLight: `${LOGO_BASE_URL}/github-white-icon.webp` },
  oracle: { logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  salesforce: { logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  servicenow: { logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
};

// Only include providers that have logos available
const CERTIFICATION_PROVIDERS = [
  { value: "aws", label: "AWS", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "azure", label: "Azure", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "gcp", label: "Google Cloud", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "github", label: "GitHub", logo: `${LOGO_BASE_URL}/github-white-icon.webp`, logoLight: `${LOGO_BASE_URL}/github-white-icon.webp` }, // Interchanged: white icon for dark theme, will add dark icon for light theme
  { value: "oracle", label: "Oracle", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "salesforce", label: "Salesforce", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "servicenow", label: "ServiceNow", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
];

// AWS Certifications - Only those specified
const AWS_CERTIFICATIONS: SelectedCertification[] = [
  { value: "cloud-practitioner", label: "AWS Certified Cloud Practitioner", code: "CLF-C02", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "ai-practitioner", label: "AWS Certified AI Practitioner", code: "AIF-C01", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "cloudops-associate", label: "AWS Certified CloudOps Engineer - Associate", code: "SOA-C03", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "solutions-architect-associate", label: "AWS Certified Solutions Architect - Associate", code: "SAA-C03", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "developer-associate", label: "AWS Certified Developer - Associate", code: "DVA-C02", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "data-engineer-associate", label: "AWS Certified Data Engineer - Associate", code: "DEA-C01", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "machine-learning-engineer-associate", label: "AWS Certified Machine Learning Engineer - Associate", code: "MLE-C01", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "solutions-architect-professional", label: "AWS Certified Solutions Architect - Professional", code: "SAP-C02", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "devops-engineer-professional", label: "AWS Certified DevOps Engineer - Professional", code: "DOP-C02", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "genai-developer-professional", label: "AWS Certified Generative AI Developer - Professional (Beta)", code: "GENAI", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "advanced-networking-specialty", label: "AWS Certified Advanced Networking - Specialty", code: "ANS-C01", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "security-specialty", label: "AWS Certified Security - Specialty", code: "SCS-C02", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
  { value: "machine-learning-specialty", label: "AWS Certified Machine Learning - Specialty", code: "MLS-C01", logo: `${LOGO_BASE_URL}/aws.svg`, logoLight: `${LOGO_BASE_URL}/aws-light.png` },
];

// Azure Certifications - Only those specified
const AZURE_CERTIFICATIONS: SelectedCertification[] = [
  // Fundamentals
  { value: "az-900", label: "AZ-900: Azure Fundamentals", code: "AZ-900", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "ai-900", label: "AI-900: Azure AI Fundamentals", code: "AI-900", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "dp-900", label: "DP-900: Azure Data Fundamentals", code: "DP-900", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "sc-900", label: "SC-900: Security, Compliance, and Identity Fundamentals", code: "SC-900", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "ms-900", label: "MS-900: Microsoft 365 Fundamentals", code: "MS-900", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-910", label: "MB-910: Dynamics 365 Fundamentals (CRM)", code: "MB-910", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-920", label: "MB-920: Dynamics 365 Fundamentals (ERP)", code: "MB-920", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },

  // Role-based – Azure & Data
  { value: "az-104", label: "AZ-104: Azure Administrator Associate", code: "AZ-104", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "az-204", label: "AZ-204: Azure Developer Associate", code: "AZ-204", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "dp-203", label: "DP-203: Azure Data Engineer Associate", code: "DP-203", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "dp-300", label: "DP-300: Azure Database Administrator Associate", code: "DP-300", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "az-400", label: "AZ-400: DevOps Engineer Expert", code: "AZ-400", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "az-500", label: "AZ-500: Azure Security Engineer Associate", code: "AZ-500", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "az-700", label: "AZ-700: Azure Network Engineer Associate", code: "AZ-700", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "az-305", label: "AZ-305: Azure Solutions Architect Expert", code: "AZ-305", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "dp-600", label: "DP-600: Fabric Analytics Engineer Associate", code: "DP-600", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "dp-700", label: "DP-700: Fabric Data Engineer Associate", code: "DP-700", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "ai-102", label: "AI-102: Azure AI Engineer Associate", code: "AI-102", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "dp-100", label: "DP-100: Azure Data Scientist Associate", code: "DP-100", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },

  // Role-based – Power Platform
  { value: "pl-400", label: "PL-400: Power Platform Developer Associate", code: "PL-400", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "pl-200", label: "PL-200: Power Platform Functional Consultant Associate", code: "PL-200", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "pl-500", label: "PL-500: Power Automate RPA Developer Associate", code: "PL-500", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "pl-300", label: "PL-300: Power BI Data Analyst Associate", code: "PL-300", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "pl-600", label: "PL-600: Power Platform Solution Architect Expert", code: "PL-600", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "pl-900", label: "PL-900: Power Platform Fundamentals", code: "PL-900", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },

  // Role-based – Security
  { value: "sc-200", label: "SC-200: Security Operations Analyst Associate", code: "SC-200", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "sc-300", label: "SC-300: Identity and Access Administrator Associate", code: "SC-300", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "sc-400", label: "SC-400: Information Protection and Compliance Administrator Associate", code: "SC-400", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "sc-401", label: "SC-401: Information Protection and Compliance Administrator Associate", code: "SC-401", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "sc-100", label: "SC-100: Cybersecurity Architect Expert", code: "SC-100", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },

  // Role-based – Modern Work
  { value: "md-102", label: "MD-102: Endpoint Administrator Associate", code: "MD-102", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "ms-102", label: "MS-102: Administrator Expert", code: "MS-102", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "ms-700", label: "MS-700: Teams Administrator Associate", code: "MS-700", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "ms-721", label: "MS-721: Collaboration Communications Systems Engineer Associate", code: "MS-721", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },

  // Role-based – Dynamics 365 Business Applications
  { value: "mb-800", label: "MB-800: Dynamics 365 Business Central Functional Consultant Associate", code: "MB-800", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-820", label: "MB-820: Dynamics 365 Business Central Developer Associate", code: "MB-820", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-700", label: "MB-700: Dynamics 365: Finance and Operations Apps Solution Architect Expert", code: "MB-700", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-230", label: "MB-230: Dynamics 365 Customer Service Functional Consultant Associate", code: "MB-230", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-240", label: "MB-240: Dynamics 365 Field Service Functional Consultant Associate", code: "MB-240", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-280", label: "MB-280: Dynamics 365 Customer Experience Analyst Associate", code: "MB-280", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-300", label: "MB-300: Dynamics 365 Finance and Operations Apps Core", code: "MB-300", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-310", label: "MB-310: Dynamics 365 Finance Functional Consultant Associate", code: "MB-310", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-330", label: "MB-330: Dynamics 365 Supply Chain Management Functional Consultant Associate", code: "MB-330", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-335", label: "MB-335: Dynamics 365: Supply Chain Management Functional Consultant Expert", code: "MB-335", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "mb-500", label: "MB-500: Dynamics 365: Finance and Operations Apps Developer Associate", code: "MB-500", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },

  // Specialty
  { value: "windows-server-hybrid-admin-associate", label: "Windows Server Hybrid Administrator Associate (AZ-800 / AZ-801)", code: "AZ-800 / AZ-801", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "az-120", label: "AZ-120: Azure for SAP Workloads Specialty", code: "AZ-120", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "az-140", label: "AZ-140: Azure Virtual Desktop Specialty", code: "AZ-140", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "az-720", label: "AZ-720: Azure Stack HCI Specialty", code: "AZ-720", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
  { value: "dp-420", label: "DP-420: Azure Cosmos DB Developer Specialty", code: "DP-420", logo: `${LOGO_BASE_URL}/Microsoft_Azure.svg` },
];

// GCP Certifications
const GCP_CERTIFICATIONS: SelectedCertification[] = [
  { value: "cloud-digital-leader", label: "Cloud Digital Leader", code: "CDL", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "generative-ai-leader", label: "Generative AI Leader (NEW - May 2025)", code: "GAIL", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "associate-cloud-engineer", label: "Associate Cloud Engineer", code: "ACE", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "professional-cloud-architect", label: "Professional Cloud Architect", code: "PCA", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "professional-data-engineer", label: "Professional Data Engineer", code: "PDE", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "professional-cloud-developer", label: "Professional Cloud Developer", code: "PCD", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "professional-cloud-devops-engineer", label: "Professional Cloud DevOps Engineer", code: "PCDE", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "professional-cloud-network-engineer", label: "Professional Cloud Network Engineer", code: "PCNE", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "professional-cloud-security-engineer", label: "Professional Cloud Security Engineer", code: "PCSE", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "professional-machine-learning-engineer", label: "Professional Machine Learning Engineer", code: "PMLE", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "professional-cloud-database-engineer", label: "Professional Cloud Database Engineer", code: "PCDBE", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
  { value: "professional-google-workspace-administrator", label: "Professional Google Workspace Administrator", code: "PGWA", logo: `${LOGO_BASE_URL}/google_cloud.svg` },
];

// GitHub Certifications
const GITHUB_CERTIFICATIONS: SelectedCertification[] = [
  { value: "gh-900", label: "GitHub Foundations GH-900", code: "GH-900", logo: `${LOGO_BASE_URL}/github-white-icon.webp`, logoLight: `${LOGO_BASE_URL}/github-white-icon.webp` },
  { value: "gh-1001", label: "GitHub Copilot Certification GH-1001 (NEW - Live)", code: "GH-1001", logo: `${LOGO_BASE_URL}/github-white-icon.webp`, logoLight: `${LOGO_BASE_URL}/github-white-icon.webp` },
  { value: "gh-400", label: "GitHub Actions GH-400", code: "GH-400", logo: `${LOGO_BASE_URL}/github-white-icon.webp`, logoLight: `${LOGO_BASE_URL}/github-white-icon.webp` },
  { value: "gh-500", label: "GitHub Advanced Security GH-500", code: "GH-500", logo: `${LOGO_BASE_URL}/github-white-icon.webp`, logoLight: `${LOGO_BASE_URL}/github-white-icon.webp` },
  { value: "gh-300", label: "GitHub Administration GH-300", code: "GH-300", logo: `${LOGO_BASE_URL}/github-white-icon.webp`, logoLight: `${LOGO_BASE_URL}/github-white-icon.webp` },
];

// Oracle Certifications
const ORACLE_CERTIFICATIONS: SelectedCertification[] = [
  { value: "oci-foundations-associate", label: "OCI Foundations Associate 1Z0-1085-25", code: "1Z0-1085-25", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-database-foundations", label: "Oracle Database Foundations 1Z0-006", code: "1Z0-006", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "java-foundations-junior-associate", label: "Java Foundations Certified Junior Associate 1Z0-811", code: "1Z0-811", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-ai-foundations-specialist", label: "Oracle AI Foundations Specialist (NEW Beta)", code: "OAI-FS", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-fusion-cloud-applications-fundamentals", label: "Oracle Fusion Cloud Applications Fundamentals", code: "OFCAF", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-mysql-database-fundamentals", label: "Oracle MySQL Database Fundamentals (NEW 2025)", code: "OMDF", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oci-architect-associate", label: "OCI Architect Associate 1Z0-1072-25", code: "1Z0-1072-25", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oci-developer-associate", label: "OCI Developer Associate 1Z0-1084-25", code: "1Z0-1084-25", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oci-data-management-foundations-associate", label: "OCI Data Management Foundations Associate 1Z0-1088-25", code: "1Z0-1088-25", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oci-multicloud-architect-associate", label: "OCI Multicloud Architect Associate 1Z0-1115-25", code: "1Z0-1115-25", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-database-sql-certified-associate", label: "Oracle Database SQL Certified Associate 1Z0-071", code: "1Z0-071", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oci-architect-professional", label: "OCI Architect Professional 1Z0-997-25", code: "1Z0-997-25", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oci-data-science-professional", label: "OCI Data Science Professional 1Z0-1090-25", code: "1Z0-1090-25", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oci-application-integration-professional", label: "OCI Application Integration Professional 1Z0-1042-24", code: "1Z0-1042-24", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-autonomous-database-cloud-professional", label: "Oracle Autonomous Database Cloud Professional 1Z0-1105-25", code: "1Z0-1105-25", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-cloud-database-aws-architect-professional", label: "Oracle Cloud Database@AWS Architect Professional (NEW)", code: "OCD-AWS", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-certified-professional-java-se-21-developer", label: "Oracle Certified Professional Java SE 21 Developer 1Z0-830", code: "1Z0-830", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-certified-professional-java-se-17-developer", label: "Oracle Certified Professional Java SE 17 Developer 1Z0-829", code: "1Z0-829", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-certified-professional-java-se-11-developer", label: "Oracle Certified Professional Java SE 11 Developer 1Z0-819", code: "1Z0-819", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-ai-cloud-database-services-2025-professional", label: "Oracle AI Cloud Database Services 2025 Professional (NEW)", code: "OAICDS-2025", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-analytics-cloud-2024-professional", label: "Oracle Analytics Cloud 2024 Professional 1Z0-1105-24", code: "1Z0-1105-24", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oracle-ai-agent-studio-fusion-applications-developer-2025", label: "Oracle AI Agent Studio for Fusion Applications Developer 2025 (NEW)", code: "OAIAS-FAD-2025", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oci-database-migration-integration-specialist", label: "OCI Database Migration & Integration Specialist 1Z0-1093-25", code: "1Z0-1093-25", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
  { value: "oci-data-integration-specialist", label: "OCI Data Integration Specialist 1Z0-1094-25", code: "1Z0-1094-25", logo: `${LOGO_BASE_URL}/Oracle_logo.svg` },
];

// Salesforce Certifications
const SALESFORCE_CERTIFICATIONS: SelectedCertification[] = [
  { value: "platform-foundations", label: "Platform Foundations", code: "PF", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "sales-foundations", label: "Sales Foundations", code: "SF", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "marketing-cloud-engagement-foundations", label: "Marketing Cloud Engagement Foundations", code: "MCEF", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "tableau-desktop-foundations", label: "Tableau Desktop Foundations", code: "TDF", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "mulesoft-integration-foundations", label: "MuleSoft Integration Foundations", code: "MIF", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "slack-administrator", label: "Slack Administrator", code: "SA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "tableau-server-administrator", label: "Tableau Server Administrator", code: "TSA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "cpq-administrator", label: "CPQ Administrator", code: "CPQA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "slack-consultant", label: "Slack Consultant", code: "SC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "ai-associate", label: "AI Associate", code: "AIA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-administrator", label: "Platform Administrator", code: "PA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-administrator-ii", label: "Platform Administrator II", code: "PA2", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-app-builder", label: "Platform App Builder", code: "PAB", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-developer", label: "Platform Developer", code: "PD", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "javascript-developer", label: "JavaScript Developer", code: "JSD", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "industries-cpq-developer", label: "Industries CPQ Developer", code: "ICPQD", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "b2c-commerce-developer", label: "B2C Commerce Developer", code: "B2CCD", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "sales-cloud-consultant", label: "Sales Cloud Consultant", code: "SCC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "service-cloud-consultant", label: "Service Cloud Consultant", code: "SCC2", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "experience-cloud-consultant", label: "Experience Cloud Consultant", code: "ECC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "field-service-cloud-consultant", label: "Field Service Cloud Consultant", code: "FSCC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "data-cloud-consultant", label: "Data Cloud Consultant", code: "DCC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "agentforce-specialist", label: "Agentforce Specialist", code: "AFS", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "mulesoft-developer", label: "MuleSoft Developer", code: "MSD", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "slack-developer", label: "Slack Developer", code: "SD", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "identity-access-management-architect", label: "Identity & Access Management Architect", code: "IAMA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "business-analyst", label: "Business Analyst", code: "BA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-developer-ii", label: "Platform Developer II", code: "PD2", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "omnistudio-developer", label: "OmniStudio Developer", code: "OSD", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "omnistudio-consultant", label: "OmniStudio Consultant", code: "OSC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "marketing-cloud-administrator", label: "Marketing Cloud Administrator", code: "MCA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "marketing-cloud-engagement-consultant", label: "Marketing Cloud Engagement Consultant", code: "MCEC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "marketing-cloud-engagement-developer", label: "Marketing Cloud Engagement Developer", code: "MCED", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "marketing-cloud-email-specialist", label: "Marketing Cloud Email Specialist", code: "MCES", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "marketing-cloud-account-engagement-consultant", label: "Marketing Cloud Account Engagement Consultant", code: "MCAEC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "marketing-cloud-account-engagement-specialist", label: "Marketing Cloud Account Engagement Specialist", code: "MCAES", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "b2c-solution-architect", label: "B2C Solution Architect", code: "B2CSA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-strategy-designer", label: "Platform Strategy Designer", code: "PSD", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-user-experience-designer", label: "Platform User Experience Designer", code: "PUXD", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "nonprofit-cloud-consultant", label: "Nonprofit Cloud Consultant", code: "NPCC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "nonprofit-success-pack-consultant", label: "Nonprofit Success Pack Consultant", code: "NSPC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "education-cloud-consultant", label: "Education Cloud Consultant", code: "ECC2", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "tableau-crm-einstein-discovery-consultant", label: "Tableau CRM & Einstein Discovery Consultant", code: "TCEDC", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-sharing-visibility-architect", label: "Platform Sharing & Visibility Architect", code: "PSVA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "mulesoft-developer-ii", label: "MuleSoft Developer II", code: "MSD2", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "mulesoft-hyperautomation-developer", label: "MuleSoft Hyperautomation Developer", code: "MSHD", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-dev-lifecycle-deployment-architect", label: "Platform Dev Lifecycle & Deployment Architect", code: "PDLDA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "system-architect", label: "System Architect", code: "SA2", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "application-architect", label: "Application Architect", code: "AA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "b2b-solution-architect", label: "B2B Solution Architect", code: "B2BSA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "b2c-commerce-architect", label: "B2C Commerce Architect", code: "B2CCA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "heroku-architect", label: "Heroku Architect", code: "HA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "tableau-architect", label: "Tableau Architect", code: "TA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "mulesoft-platform-architect", label: "MuleSoft Platform Architect", code: "MSPA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "mulesoft-integration-architect", label: "MuleSoft Integration Architect", code: "MSIA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-integration-architect", label: "Platform Integration Architect", code: "PIA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "platform-data-architect", label: "Platform Data Architect", code: "PDA", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
  { value: "technical-architect", label: "Technical Architect", code: "TA2", logo: `${LOGO_BASE_URL}/Salesforce.com_logo.svg` },
];

// ServiceNow Certifications
const SERVICENOW_CERTIFICATIONS: SelectedCertification[] = [
  { value: "certified-technical-architect", label: "Certified Technical Architect (CTA)", code: "CTA", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "certified-master-architect", label: "Certified Master Architect (CMA)", code: "CMA", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "certified-system-administrator", label: "Certified System Administrator (CSA)", code: "CSA", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "certified-application-developer", label: "Certified Application Developer (CAD)", code: "CAD", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-itsm", label: "CIS - IT Service Management (CIS-ITSM)", code: "CIS-ITSM", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-itom", label: "CIS - IT Operations Management (CIS-ITOM)", code: "CIS-ITOM", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-csm", label: "CIS - Customer Service Management (CIS-CSM)", code: "CIS-CSM", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-hr", label: "CIS - HR Service Delivery (CIS-HR)", code: "CIS-HR", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-sir", label: "CIS - Security Incident Response (CIS-SIR)", code: "CIS-SIR", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-vr", label: "CIS - Vulnerability Response (CIS-VR)", code: "CIS-VR", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-discovery", label: "CIS - Discovery (CIS-Discovery)", code: "CIS-Discovery", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-em", label: "CIS - Event Management (CIS-EM)", code: "CIS-EM", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-sam", label: "CIS - Software Asset Management (CIS-SAM)", code: "CIS-SAM", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-ham", label: "CIS - Hardware Asset Management (CIS-HAM)", code: "CIS-HAM", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-rc", label: "CIS - Risk and Compliance (CIS-RC)", code: "CIS-RC", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-cloud-provisioning-governance", label: "CIS - Cloud Provisioning and Governance", code: "CIS-CPG", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-fsm", label: "CIS - Field Service Management (CIS-FSM)", code: "CIS-FSM", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-apm", label: "CIS - Application Portfolio Management (CIS-APM)", code: "CIS-APM", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-spm", label: "CIS - Strategic Portfolio Management (CIS-SPM)", code: "CIS-SPM", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-irm", label: "CIS - Integrated Risk Management (CIS-IRM)", code: "CIS-IRM", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cis-ape", label: "CIS - App Engine (CIS-APE)", code: "CIS-APE", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-welcome-to-servicenow", label: "MC - Welcome to ServiceNow", code: "MC-WTS", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-predictive-intelligence", label: "MC - Predictive Intelligence", code: "MC-PI", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-virtual-agent", label: "MC - Virtual Agent", code: "MC-VA", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-automated-test-framework", label: "MC - Automated Test Framework", code: "MC-ATF", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-flow-designer", label: "MC - Flow Designer", code: "MC-FD", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-integration-hub", label: "MC - Integration Hub", code: "MC-IH", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-performance-analytics", label: "MC - Performance Analytics", code: "MC-PA", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-service-portal", label: "MC - Service Portal", code: "MC-SP", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-agile-development", label: "MC - Agile Development", code: "MC-AD", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-application-developer-process-creator", label: "MC - Application Developer Process Creator", code: "MC-ADPC", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-citizen-developer-application-creator", label: "MC - Citizen Developer Application Creator", code: "MC-CDAC", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-generative-ai-executive", label: "MC - Generative AI (Executive)", code: "MC-GAI-E", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "mc-now-assist", label: "MC - Now Assist (NEW 2025)", code: "MC-NA", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
  { value: "cloud-cost-management-accreditation", label: "Cloud Cost Management Accreditation (NEW)", code: "CCMA", logo: `${LOGO_BASE_URL}/ServiceNow_logo.svg` },
];


interface CertificationCredential {
  certificationValue: string;
  certificationName: string;
  examCode: string;
  certificationDate: string;
  verifiedCredential: string;
}

interface CertificationFormProps {
  user?: {
    email: string;
    fullName: string;
    linkedinUrl?: string;
    photoUrl?: string;
    country?: string;
  };
}

export const CertificationForm = ({ user }: CertificationFormProps) => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [existingCertifications, setExistingCertifications] = useState<any[]>([]);
  const [userCertifications, setUserCertifications] = useState<any[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);
  const [editingCert, setEditingCert] = useState<number | null>(null);
  const [currentCertIndex, setCurrentCertIndex] = useState(0);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [sortOrder, setSortOrder] = useState<'a-z' | 'z-a' | 'default'>('a-z');
  const [certSearchQuery, setCertSearchQuery] = useState('');
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<'selection' | 'common-info' | 'credentials'>('selection');
  const [certificationCredentials, setCertificationCredentials] = useState<CertificationCredential[]>([]);
  
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CertificationFormData>({
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      selectedProviders: [],
      selectedCertifications: [],
      linkedinUrl: user?.linkedinUrl || "",
      country: "",
      stateProvince: "",
      city: "",
      countryCode: "",
      phoneNumber: "",
      photo: null,
      additionalNotes: "",
    },
    mode: "onChange", // Enable validation on change
  });

  // Check if user has submitted certifications before
  const [hasSubmittedBefore, setHasSubmittedBefore] = useState(false);
  const [showAddNew, setShowAddNew] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    const addNewParam = params.get("addNew");
    return addNewParam === "true" || addNewParam === "1";
  });
  const [isEditMode, setIsEditMode] = useState(false);


  // Load user certifications on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const addNewParam = params.get("addNew");
      if (addNewParam === "true" || addNewParam === "1") {
        setShowAddNew(true);
      }
    }

    if (user?.email) {
      loadUserCertifications();
      // Set photo preview if user has photo
      if (user.photoUrl) {
        setPhotoPreview(user.photoUrl);
      }
    }
    
    // Check if editing a certification from ManageCertifications page
    const editingCertStr = sessionStorage.getItem("editingCertification");
    if (editingCertStr) {
      try {
        const editingCert = JSON.parse(editingCertStr);
        // Get all certifications (not filtered by selected providers)
        const allCerts: SelectedCertification[] = [
          ...AWS_CERTIFICATIONS,
          ...AZURE_CERTIFICATIONS,
          ...GCP_CERTIFICATIONS,
          ...GITHUB_CERTIFICATIONS,
          ...ORACLE_CERTIFICATIONS,
          ...SALESFORCE_CERTIFICATIONS,
          ...SERVICENOW_CERTIFICATIONS,
        ];
        
        const matchingCert = allCerts.find(c => 
          c.label.toLowerCase() === editingCert.certificationName?.toLowerCase() ||
          c.code === editingCert.examCode
        );
        
        if (matchingCert) {
          // Set edit mode
          setIsEditMode(true);
          
          // Set the provider first
          const provider = matchingCert.value.split('-')[0];
          if (provider && CERTIFICATION_PROVIDERS.find(p => p.value === provider)) {
            setValue("selectedProviders", [provider]);
          }
          
          setValue("selectedCertifications", [matchingCert.value]);
          // Initialize credentials with the editing certification data
          const editCredential = {
            certificationValue: matchingCert.value,
            certificationName: editingCert.certificationName,
            examCode: editingCert.examCode,
            certificationDate: editingCert.certificationDate,
            verifiedCredential: editingCert.verifiedCredential || "",
            additionalNotes: editingCert.additionalNotes || "",
          };
          setCertificationCredentials([editCredential]);
          // Skip common-info step and go directly to credentials in edit mode
          setCurrentStep('credentials');
          
          // Pre-fill the credential form
          setTimeout(() => {
            setCredentialValue('certificationDate', editCredential.certificationDate || '');
            setCredentialValue('verifiedCredential', editCredential.verifiedCredential || '');
            setCredentialValue('additionalNotes', editCredential.additionalNotes || '');
          }, 100);
          
          toast({
            title: "Edit Mode",
            description: "Editing certification details only. Profile information will remain unchanged.",
          });
        }
        
        // Clear sessionStorage
        sessionStorage.removeItem("editingCertification");
      } catch (error) {
        console.error("Error parsing editing certification:", error);
      }
    }
  }, [user]);

  // Load user's existing certifications - instant from cache
  const loadUserCertifications = async () => {
    setIsLoadingCerts(true);
    
    // Load from cache immediately
    if (user?.email) {
      const cacheKey = `yatris_user_certifications_${user.email}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const certs = JSON.parse(cachedData);
          setUserCertifications(certs);
          setHasSubmittedBefore(certs.length > 0);
          setIsLoadingCerts(false);
        } catch (error) {
          console.warn("Error parsing cached certifications:", error);
        }
      }
    }
    
    // Then fetch fresh data in background
    try {
      const certs = await getUserCertifications();
      setUserCertifications(certs);
      setHasSubmittedBefore(certs.length > 0);
    } catch (error) {
      console.error("Error loading user certifications:", error);
    } finally {
      setIsLoadingCerts(false);
    }
  };

  // Separate form for certification credentials
  const {
    register: registerCredential,
    handleSubmit: handleSubmitCredential,
    formState: { errors: credentialErrors },
    setValue: setCredentialValue,
    watch: watchCredential,
    reset: resetCredential,
  } = useForm<{
    certificationDate: string;
    verifiedCredential: string;
    additionalNotes?: string;
  }>({
    defaultValues: {
      certificationDate: "",
      verifiedCredential: "",
      additionalNotes: "",
    },
  });

  const selectedProviders = watch("selectedProviders") || [];
  const selectedCertifications = watch("selectedCertifications") || [];
  const email = watch("email");

  // Load existing certifications on mount for duplicate checking
  useEffect(() => {
    const loadExistingCertifications = async () => {
      try {
        const certs = await fetchCertifications();
        setExistingCertifications(certs);
      } catch (error) {
        console.error("Error loading existing certifications:", error);
        // Continue anyway - duplicate check will be done on submit
      }
    };
    loadExistingCertifications();
  }, []);


  // Get certifications based on provider
  const getCertifications = () => {
    const allCerts: SelectedCertification[] = [];
    if (selectedProviders.includes("aws")) {
      allCerts.push(...AWS_CERTIFICATIONS);
    }
    if (selectedProviders.includes("azure")) {
      allCerts.push(...AZURE_CERTIFICATIONS);
    }
    if (selectedProviders.includes("gcp")) {
      allCerts.push(...GCP_CERTIFICATIONS);
    }
    if (selectedProviders.includes("github")) {
      allCerts.push(...GITHUB_CERTIFICATIONS);
    }
    if (selectedProviders.includes("oracle")) {
      allCerts.push(...ORACLE_CERTIFICATIONS);
    }
    if (selectedProviders.includes("salesforce")) {
      allCerts.push(...SALESFORCE_CERTIFICATIONS);
    }
    if (selectedProviders.includes("servicenow")) {
      allCerts.push(...SERVICENOW_CERTIFICATIONS);
    }
    return allCerts;
  };

  // Get provider for a certification value
  const getProviderForCertification = (certValue: string): string => {
    if (AWS_CERTIFICATIONS.some(c => c.value === certValue)) return "aws";
    if (AZURE_CERTIFICATIONS.some(c => c.value === certValue)) return "azure";
    if (GCP_CERTIFICATIONS.some(c => c.value === certValue)) return "gcp";
    if (GITHUB_CERTIFICATIONS.some(c => c.value === certValue)) return "github";
    if (ORACLE_CERTIFICATIONS.some(c => c.value === certValue)) return "oracle";
    if (SALESFORCE_CERTIFICATIONS.some(c => c.value === certValue)) return "salesforce";
    if (SERVICENOW_CERTIFICATIONS.some(c => c.value === certValue)) return "servicenow";
    return "other";
  };

  // Handle provider toggle
  const handleProviderToggle = (providerValue: string, checked: boolean) => {
    const current = selectedProviders || [];
    if (checked) {
      if (!current.includes(providerValue)) {
        setValue("selectedProviders", [...current, providerValue], { shouldValidate: true });
      }
    } else {
      // Remove provider and all its certifications
      const newProviders = current.filter(p => p !== providerValue);
      setValue("selectedProviders", newProviders, { shouldValidate: true });
      // Remove certifications from this provider
      const certsToRemove = getCertificationsForProvider(providerValue).map(c => c.value);
      const remainingCerts = selectedCertifications.filter(certValue => !certsToRemove.includes(certValue));
      setValue("selectedCertifications", remainingCerts, { shouldValidate: true });
    }
  };

  // Get certifications for a specific provider
  const getCertificationsForProvider = (provider: string) => {
    if (provider === "aws") return AWS_CERTIFICATIONS;
    if (provider === "azure") return AZURE_CERTIFICATIONS;
    if (provider === "gcp") return GCP_CERTIFICATIONS;
    if (provider === "github") return GITHUB_CERTIFICATIONS;
    if (provider === "oracle") return ORACLE_CERTIFICATIONS;
    if (provider === "salesforce") return SALESFORCE_CERTIFICATIONS;
    if (provider === "servicenow") return SERVICENOW_CERTIFICATIONS;
    return [];
  };

  // Check for duplicate submission
  const checkDuplicate = (email: string, certificationName: string, examCode: string, provider?: string): boolean => {
    if (!email || !certificationName || !examCode) return false;
    
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCertName = certificationName.toLowerCase().trim();
    const normalizedExamCode = examCode.toLowerCase().trim();
    const normalizedProvider = provider ? provider.toLowerCase().trim() : null;

    const duplicate = existingCertifications.find((cert) => {
      const existingEmail = (cert.email || "").toLowerCase().trim();
      const existingCertName = (cert.certificationName || "").toLowerCase().trim();
      const existingExamCode = (cert.examCode || "").toLowerCase().trim();
      const existingProvider = (cert.certificationProvider || "").toLowerCase().trim();

      // First check: email, certification name, and exam code must match
      const basicMatch = (
        existingEmail === normalizedEmail &&
        existingCertName === normalizedCertName &&
        existingExamCode === normalizedExamCode
      );

      if (!basicMatch) return false;

      // If provider is provided in the check, it MUST match
      // This ensures AWS and Azure certs with same name are treated separately
      if (normalizedProvider) {
        // If we're checking with a provider, the existing cert must also have that provider
        if (!existingProvider) {
          return false; // Existing cert has no provider, can't be a duplicate
        }
        return existingProvider === normalizedProvider;
      }

      // If no provider specified in check, match without provider requirement
      return true;
    });

    if (duplicate) {
      console.log(`🔍 Duplicate match found:`, {
        existing: {
          email: duplicate.email,
          certName: duplicate.certificationName,
          examCode: duplicate.examCode,
          provider: duplicate.certificationProvider
        },
        new: {
          email: normalizedEmail,
          certName: normalizedCertName,
          examCode: normalizedExamCode,
          provider: normalizedProvider
        }
      });
    } else {
      console.log(`✅ No duplicate found for:`, {
        email: normalizedEmail,
        certName: normalizedCertName,
        examCode: normalizedExamCode,
        provider: normalizedProvider,
        totalExistingCerts: existingCertifications.length
      });
    }

    return !!duplicate;
  };

  // Handle certification toggle (multiple selection)
  const handleCertificationToggle = (certValue: string, checked: boolean) => {
    const current = selectedCertifications || [];
    if (checked) {
      // Only add if not already in the array
      if (!current.includes(certValue)) {
        setValue("selectedCertifications", [...current, certValue], { shouldValidate: true });
      }
    } else {
      // Remove from array
      setValue("selectedCertifications", current.filter(v => v !== certValue), { shouldValidate: true });
    }
  };

  // Handle "Done" button - move to common info step
  const handleDoneSelection = () => {
    if (selectedCertifications.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one certification.",
        variant: "destructive",
      });
      return;
    }
    // Initialize credentials array for each selected certification
    const certifications = getCertifications();
    const initialCredentials: CertificationCredential[] = selectedCertifications.map(certValue => {
      const cert = certifications.find(c => c.value === certValue);
      return {
        certificationValue: certValue,
        certificationName: cert?.label || '',
        examCode: cert?.code || '',
        certificationDate: '',
        verifiedCredential: '',
      };
    });
    setCertificationCredentials(initialCredentials);
    setCurrentStep('common-info');
  };

  // Handle final submission - submit all certifications with credentials
  const handleCommonInfoSubmit = async (data: CertificationFormData) => {
    // Validate that we have selected certifications
    if (!selectedCertifications || selectedCertifications.length === 0) {
      toast({
        title: "Error",
        description: "Please go back and select at least one certification.",
        variant: "destructive",
      });
      return;
    }

    // Validate photo (only if user hasn't submitted before AND user doesn't have a photo from signup)
    // If user is logged in and has a photo from signup, use that instead
    if (!hasSubmittedBefore && !user?.photoUrl && (!data.photo || !photoPreview)) {
      toast({
        title: "Validation Error",
        description: "Please upload a photo.",
        variant: "destructive",
      });
      return;
    }
    
    // If user has photo from signup, ensure it's set in photoPreview
    if (user?.photoUrl && !photoPreview) {
      setPhotoPreview(user.photoUrl);
    }

    // Validate that all certifications are selected
    const missingCerts = certificationCredentials.filter(
      (cred) => !cred.certificationValue || cred.certificationValue.trim() === ''
    );
    
    if (missingCerts.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please select a certification for all ${missingCerts.length} certification(s).`,
        variant: "destructive",
      });
      return;
    }
    
    if (false) {
      toast({
        title: "Validation Error",
        description: `Please enter a valid year (2000 - ${currentYear}) for all certifications.`,
        variant: "destructive",
      });
      return;
    }

    // Submit all certifications (fire and forget - it handles its own state)
    submitAllCertifications();
  };

  // Handle credential field updates
  const handleCredentialUpdate = (certValue: string, field: 'certificationDate' | 'verifiedCredential', value: string) => {
    const updated = [...certificationCredentials];
    const index = updated.findIndex(c => c.certificationValue === certValue);
    if (index >= 0) {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      setCertificationCredentials(updated);
    }
  };

  // Handle credential submission for current certification
  const handleCredentialSubmit = async (credentialData: { certificationDate: string; verifiedCredential: string; additionalNotes?: string }) => {
    const updated = [...certificationCredentials];
    updated[currentCertIndex] = {
      ...updated[currentCertIndex],
      ...credentialData,
    };
    setCertificationCredentials(updated);

    // If in edit mode, update immediately and navigate back
    if (isEditMode) {
      const currentCert = updated[currentCertIndex];
      if (currentCert && user?.email) {
        // Optimistically update cache immediately
        updateCacheOptimistically(currentCert, credentialData);
        
        // Submit in background
        submitAllCertifications();
        
        // Navigate back immediately
        setTimeout(() => {
          window.location.href = '/manage-certifications';
        }, 100);
      }
      return;
    }

    // Move to next certification or submit all
    if (currentCertIndex < certificationCredentials.length - 1) {
      setCurrentCertIndex(currentCertIndex + 1);
      resetCredential();
      // Pre-fill next certification's exam code if available
      const nextCert = updated[currentCertIndex + 1];
      if (nextCert) {
        setCredentialValue('certificationDate', '');
        setCredentialValue('verifiedCredential', '');
        setCredentialValue('additionalNotes', '');
      }
    } else {
      // All credentials collected, submit everything
      submitAllCertifications();
    }
  };
  
  // Optimistically update cache with new certifications immediately
  const updateCacheWithNewCertifications = (credentials: CertificationCredential[], userEmail: string) => {
    try {
      const cacheKey = `yatris_user_certifications_${userEmail}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      const newCerts = credentials.map((cred, index) => {
        // Use the getProviderForCertification function
        const provider = getProviderForCertification(cred.certificationValue);
        return {
          id: `${provider}-${cred.examCode}-${userEmail}-${Date.now()}-${index}`,
          fullName: user?.fullName || '',
          email: userEmail,
          certificationProvider: provider,
          certificationName: cred.certificationName,
          examCode: cred.examCode,
          certificationDate: '', // Year Passed field removed
          verifiedCredential: cred.verifiedCredential || '',
          additionalNotes: cred.additionalNotes || '',
          linkedinUrl: user?.linkedinUrl || '',
          photoUrl: user?.photoUrl || '',
          country: user?.country || '',
        };
      });
      
      const existingCerts = cachedData ? JSON.parse(cachedData) : [];
      const updatedCerts = [...existingCerts, ...newCerts];
      
      // Update cache immediately
      localStorage.setItem(cacheKey, JSON.stringify(updatedCerts));
      localStorage.setItem(`yatris_user_certifications_timestamp_${userEmail}`, Date.now().toString());
      
      // Dispatch custom event to update ManageCertifications page
      window.dispatchEvent(new CustomEvent('certificationsUpdated', { detail: updatedCerts }));
    } catch (error) {
      console.warn("Error updating cache with new certifications:", error);
    }
  };
  
  // Optimistically update cache immediately
  const updateCacheOptimistically = (cert: any, updatedData: any) => {
    if (!user?.email) return;
    
    try {
      const cacheKey = `yatris_user_certifications_${user.email}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const certs = JSON.parse(cachedData);
        const updatedCerts = certs.map((c: any) => {
          // Match by exam code and provider
          if (c.examCode === cert.examCode && 
              c.certificationProvider?.toLowerCase() === cert.certificationProvider?.toLowerCase()) {
            return {
              ...c,
              certificationDate: updatedData.certificationDate || c.certificationDate,
              verifiedCredential: updatedData.verifiedCredential || c.verifiedCredential,
              additionalNotes: updatedData.additionalNotes || c.additionalNotes,
            };
          }
          return c;
        });
        
        // Update cache immediately
        localStorage.setItem(cacheKey, JSON.stringify(updatedCerts));
        localStorage.setItem(`yatris_user_certifications_timestamp_${user.email}`, Date.now().toString());
        
        // Dispatch custom event to update ManageCertifications page
        window.dispatchEvent(new CustomEvent('certificationsUpdated', { detail: updatedCerts }));
      }
    } catch (error) {
      console.warn("Error updating cache optimistically:", error);
    }
  };

  // Submit all certifications with their credentials
  const submitAllCertifications = async () => {
    setIsSubmitting(true);
    try {
      const commonData = watch();

      const submissionPromises = certificationCredentials.map(async (cred) => {
        try {
          // Determine provider for this certification
          const certProvider = getProviderForCertification(cred.certificationValue);
          console.log(`🔍 Processing certification: ${cred.certificationName} (${cred.examCode})`);
          console.log(`📋 Detected provider: ${certProvider}`);
          console.log(`📋 Certification value: ${cred.certificationValue}`);
          
          const sheetName = certProvider === "aws" 
            ? "certified-aws-yatris" 
            : certProvider === "azure"
            ? "certified-azure-yatris"
            : certProvider === "gcp"
            ? "certified-gcp-yatris"
            : certProvider === "github"
            ? "certified-github-yatris"
            : certProvider === "oracle"
            ? "certified-oracle-yatris"
            : certProvider === "salesforce"
            ? "certified-salesforce-yatris"
            : certProvider === "servicenow"
            ? "certified-servicenow-yatris"
            : "certified-other-yatris";

          console.log(`📊 Target sheet: ${sheetName}`);

          // Check for duplicates (include provider in check)
          const isDuplicate = checkDuplicate(commonData.email, cred.certificationName, cred.examCode, certProvider);
          if (isDuplicate) {
            console.warn(`⚠️ Duplicate detected: ${cred.certificationName} (${cred.examCode}) for ${commonData.email} from ${certProvider.toUpperCase()}`);
            console.warn(`⚠️ This exact certification already exists. Skipping to prevent duplicate entries.`);
            return { success: false, reason: 'duplicate', provider: certProvider, cert: cred.certificationName };
          }
          
          console.log(`✅ No duplicate found for ${certProvider.toUpperCase()}: ${cred.certificationName} (${cred.examCode})`);

          const subSheetName = `${cred.examCode}: ${cred.certificationName}`;

          console.log(`📤 Submitting ${certProvider.toUpperCase()} certification: ${cred.certificationName} to ${sheetName}`);

          // Always use the old API to write to separate provider sheets
          // This ensures data appears in achievements section
          // Use user data if available (when hasSubmittedBefore), otherwise use form data
          // For photo: use user's photoUrl if available, otherwise use form photo
          const photoToUse = user?.photoUrl 
            ? null // If user has photoUrl, we'll pass it as photoUrl string (handled separately)
            : (commonData.photo || null);
          
          await submitCertification({
            fullName: hasSubmittedBefore ? (user?.fullName || '') : (user?.fullName || commonData.fullName),
            email: hasSubmittedBefore ? (user?.email || '') : (user?.email || commonData.email),
            certificationProvider: certProvider,
            certificationName: cred.certificationName,
            examCode: cred.examCode,
            certificationDate: '', // Year Passed field removed
            linkedinUrl: user?.linkedinUrl || '',
            verifiedCredential: cred.verifiedCredential,
            country: user?.country || '',
            stateProvince: user?.stateProvince || '',
            city: user?.city || '',
            countryCode: user?.countryCode || '',
            phoneNumber: user?.phoneNumber || '',
            photo: photoToUse,
            photoUrl: user?.photoUrl || (photoPreview && !photoPreview.startsWith('data:') ? photoPreview : ''), // Pass photoUrl if user has one from signup
            additionalNotes: commonData.additionalNotes || '',
            sheetName,
            subSheetName,
          });

          console.log(`✅ Successfully submitted ${certProvider.toUpperCase()} certification: ${cred.certificationName}`);
          return { success: true, provider: certProvider, cert: cred.certificationName };
        } catch (error: any) {
          console.error(`❌ Error submitting certification ${cred.certificationName}:`, error);
          const certProvider = getProviderForCertification(cred.certificationValue);
          return { success: false, reason: 'error', error: error.message, provider: certProvider, cert: cred.certificationName };
        }
      });

      const results = await Promise.all(submissionPromises);
      const successful = results.filter(r => r && r.success === true).length;
      const failed = results.filter(r => r && r.success === false);
      const total = certificationCredentials.length;

      // Log detailed results
      console.log(`📊 Submission Summary: ${successful}/${total} successful`);
      if (failed.length > 0) {
        console.error(`❌ Failed submissions:`, failed);
        failed.forEach((f: any) => {
          console.error(`  - ${f.provider.toUpperCase()}: ${f.cert} - ${f.reason}${f.error ? `: ${f.error}` : ''}`);
        });
      }

      // Show detailed success/error message
      if (failed.length > 0) {
        const failedProviders = [...new Set(failed.map((f: any) => f.provider))];
        toast({
          title: "Partial Success",
          description: `${successful} of ${total} certification${total > 1 ? 's' : ''} submitted. ${failed.length} failed (${failedProviders.join(', ').toUpperCase()}). Check browser console for details.`,
          variant: "destructive",
        });
        // Don't reset form if there were failures - let user see what happened
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      reset();
      resetCredential();
      setPhotoPreview(null);
      setCurrentStep('selection');
      setCurrentCertIndex(0);
      setCertificationCredentials([]);
      setShowAddNew(false); // Reset to show certifications view
      
      toast({
        title: "Success! 🎉",
        description: `Successfully submitted ${successful} of ${total} certification${total > 1 ? 's' : ''}!`,
      });
      
      // Optimistically update cache immediately with submitted certifications
      if (user?.email) {
        updateCacheWithNewCertifications(certificationCredentials, user.email);
      }
      
      // Reload certifications from achievements in background (no delay)
      (async () => {
        const currentCerts = await fetchCertifications();
        setExistingCertifications(currentCerts);
        // Also reload user certifications if authenticated
        if (user?.email) {
          await loadUserCertifications();
        }
      })();
    } catch (error: any) {
      console.error("Error submitting certifications:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit certifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setValue("photo", file, { shouldValidate: true, shouldDirty: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setValue("photo", null, { shouldValidate: true });
      setPhotoPreview(null);
    }
  };

  // Handle form submission
  const onSubmit = async (data: CertificationFormData) => {
    // Validate required fields
    if (!selectedProviders || selectedProviders.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one certification provider",
        variant: "destructive",
      });
      return;
    }

    // Validation is now handled in the submission function

    if (!photoPreview || !data.photo) {
      toast({
        title: "Validation Error",
        description: "Please upload your photo",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate submission
    setIsCheckingDuplicates(true);
    try {
      // Refresh certifications list before checking to get latest data
      console.log("🔄 Refreshing existing certifications before submission...");
      const currentCerts = await fetchCertifications();
      console.log(`📊 Loaded ${currentCerts.length} existing certifications for duplicate check`);
      setExistingCertifications(currentCerts);
      // Duplicate checking is now done per certification in the submission loop
    } catch (error) {
      console.error("Error checking duplicates:", error);
      // Continue with submission if duplicate check fails
    } finally {
      setIsCheckingDuplicates(false);
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      // Validate that at least one certification is selected
      if (!data.selectedCertifications || data.selectedCertifications.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one certification.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get all certifications for selected providers
      const certifications = getCertifications();
      
      // Submit each selected certification separately
      const submissionPromises = data.selectedCertifications.map(async (certValue) => {
        const selectedCert = certifications.find((c) => c.value === certValue);
        if (!selectedCert) {
          throw new Error(`Certification not found: ${certValue}`);
        }

        // Determine provider for this certification
        const certProvider = getProviderForCertification(certValue);
        const sheetName = certProvider === "aws" 
          ? "certified-aws-yatris" 
          : certProvider === "azure"
          ? "certified-azure-yatris"
          : certProvider === "gcp"
          ? "certified-gcp-yatris"
          : certProvider === "github"
          ? "certified-github-yatris"
          : certProvider === "oracle"
          ? "certified-oracle-yatris"
          : certProvider === "salesforce"
          ? "certified-salesforce-yatris"
          : certProvider === "servicenow"
          ? "certified-servicenow-yatris"
          : "certified-other-yatris";

        const fullCertificationName = selectedCert.label;
        const examCode = selectedCert.code;

        // Check for duplicates before submitting (include provider)
        if (checkDuplicate(data.email, fullCertificationName, examCode, certProvider)) {
          console.warn(`⚠️ Skipping duplicate: ${fullCertificationName} (${examCode}) for ${data.email} from ${certProvider.toUpperCase()}`);
          return null; // Skip this one
        }

        // Create sub-sheet name in format: "Exam Code: Certification Name"
        const subSheetName = `${examCode}: ${fullCertificationName}`;

        // Submit to Google Sheets (always use old flow to write to separate provider sheets)
        return await submitCertification({
          fullName: user?.fullName || data.fullName,
          email: user?.email || data.email,
          certificationProvider: certProvider,
          certificationName: fullCertificationName,
          examCode: examCode,
          certificationDate: data.certificationDate,
          linkedinUrl: user?.linkedinUrl || data.linkedinUrl,
          verifiedCredential: data.verifiedCredential,
          country: user?.country || '',
          stateProvince: user?.stateProvince || '',
          city: user?.city || '',
          countryCode: user?.countryCode || '',
          phoneNumber: user?.phoneNumber || '',
          photo: user?.photoUrl || null,
          additionalNotes: data.additionalNotes,
          sheetName,
          subSheetName,
        });
      });

      // Wait for all submissions to complete
      const results = await Promise.all(submissionPromises);
      const successful = results.filter(r => r !== null).length;
      const total = data.selectedCertifications.length;

      setIsSuccess(true);
      reset();
      setPhotoPreview(null);
      
      toast({
        title: "Success! 🎉",
        description: `Successfully submitted ${successful} of ${total} certification${total > 1 ? 's' : ''}!`,
      });
    } catch (error: any) {
      console.error("Error submitting certification:", error);
      const errorMessage = error?.message || "Failed to submit certification. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
        <p className="text-muted-foreground mb-8">
          Your certification has been submitted successfully. You'll appear on the Wall of Fame soon!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button onClick={() => {
            setIsSuccess(false);
            reset();
            setCurrentStep('selection');
            setShowAddNew(false);
            if (user?.email) {
              loadUserCertifications();
            }
          }}>Submit Another</Button>
          <Button 
            variant="default"
            onClick={() => {
              window.location.href = "/achievements";
            }}
          >
            View Achievements
          </Button>
          {user?.email && (
            <Button 
              variant="outline" 
              onClick={() => {
                window.location.href = "/manage-certifications";
              }}
            >
              Manage Certifications
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // Handle delete certification
  // Note: Since certifications are in separate provider sheets, 
  // deletion would require updating each provider's Apps Script.
  // For now, we'll show a message that deletion isn't available.
  const handleDeleteCertification = async (cert: any) => {
    if (!confirm("Are you sure you want to delete this certification?\n\nNote: This action cannot be undone. The certification will be removed from the achievements section.")) {
      return;
    }

    toast({
      title: "Delete Not Available",
      description: "Certification deletion requires updating the provider's Apps Script. Please contact support or resubmit with updated information.",
      variant: "destructive",
    });
    
    // TODO: Implement delete functionality by calling provider-specific webhook
    // For now, we'll just reload to show current state
    await loadUserCertifications();
  };

  // Handle edit certification
  // Navigate to edit mode with certification data
  const handleEditCertification = (cert: any) => {
    // Store certification data in sessionStorage for edit mode
    sessionStorage.setItem("editingCertification", JSON.stringify({
      certificationName: cert.certificationName,
      examCode: cert.examCode,
      certificationDate: cert.certificationDate,
      certificationProvider: cert.certificationProvider,
      verifiedCredential: cert.verifiedCredential || "",
      additionalNotes: cert.additionalNotes || "",
    }));
    
    // Navigate to form (remove edit param to show form)
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    // Navigate to the form page without edit param
    window.location.href = url.toString();
  };

  // Group certifications by provider
  const groupedCerts = userCertifications.reduce((acc, cert) => {
    const provider = cert.certificationProvider?.toLowerCase() || "other";
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(cert);
    return acc;
  }, {} as Record<string, any[]>);

  const providerLabels: Record<string, string> = {
    aws: "AWS",
    azure: "Azure",
    gcp: "Google Cloud",
    github: "GitHub",
    oracle: "Oracle",
    salesforce: "Salesforce",
    servicenow: "ServiceNow",
    other: "Other",
  };

  // Check if we're editing a certification first (before redirecting)
  const isEditingCert = sessionStorage.getItem("editingCertification");
  
  // If editing, don't redirect - show the edit form
  // The edit mode useEffect will set currentStep to 'credentials' and isEditMode to true
  if (isEditingCert || isEditMode || currentStep === 'credentials') {
    // Let the edit mode logic handle the display - don't redirect
  } else if (hasSubmittedBefore && !showAddNew && user?.email && !isLoadingCerts) {
    // Redirect to manage certifications page
    window.location.href = '/manage-certifications';
    return null;
  }

  // Render step 1: Certification Selection (for new submissions or when showAddNew is true)
  if (currentStep === 'selection') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">

        {/* New Certification Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-xl"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Select Your Certifications</h2>
          <p className="text-muted-foreground mb-8">
            Choose the certifications you want to submit
          </p>

          <div className="space-y-6">
            {/* Show message that profile info will be used from account if user is logged in */}
            {(hasSubmittedBefore || showAddNew || user?.email) ? (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  ✓ Your profile information will be used from your account. You can update it in the Profile section.
                </p>
              </div>
            ) : (
              <>
                {/* Full Name - only show if user is not logged in */}
                <div>
                  <Label htmlFor="fullName" className="mb-2">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName", { required: "Full name is required" })}
                    placeholder="Your full name"
                    className="w-full"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email - only show if user is not logged in */}
                <div>
                  <Label htmlFor="email" className="mb-2">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    placeholder="your.email@example.com"
                    className="w-full"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>
              </>
            )}

          {/* Multiple Provider Selection - Card Style */}
          <div>
            <Label className="mb-3 block text-base font-semibold">
              Step 1: Select Your Certification Provider(s) <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Choose one or more providers. You can select multiple providers to submit certifications from different platforms.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CERTIFICATION_PROVIDERS.map((provider) => {
                const isChecked = selectedProviders.includes(provider.value);
                return (
                  <motion.div
                    key={provider.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleProviderToggle(provider.value, !isChecked)}
                    className={`
                      relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200
                      ${isChecked 
                        ? 'bg-primary/10 border-primary shadow-lg ring-2 ring-offset-2 ring-offset-background' 
                        : 'bg-muted/30 border-border hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                  >
                    {/* Check Icon */}
                    {isChecked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}
                    
                    {/* Provider Content */}
                    <div className="flex flex-col items-center text-center space-y-2">
                      {provider.logo && (
                        <div className="flex justify-center mb-2">
                          <img 
                            src={
                              provider.value === 'github'
                                ? (theme === 'dark' ? provider.logo : (provider as any).logoLight || provider.logo) // Interchanged for GitHub
                                : (theme === 'dark' && (provider as any).logoLight ? (provider as any).logoLight : provider.logo)
                            }
                            alt={provider.label}
                            className={`h-12 w-auto object-contain ${
                              provider.value === 'terraform' 
                                ? 'dark:invert' 
                                : provider.value === 'github' && theme === 'light'
                                ? 'invert' // Invert white icon for light theme
                                : ''
                            } ${
                              provider.value === 'oracle' || provider.value === 'servicenow'
                                ? 'max-w-[120px]' // Limit width for Oracle and ServiceNow
                                : ''
                            }`}
                            onError={(e) => {
                              // Hide image if it fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="font-semibold text-base text-foreground">
                        {provider.label}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Selection Feedback */}
            {selectedProviders.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Please select at least one provider to continue
                </p>
              </motion.div>
            )}
            {selectedProviders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg"
              >
                <p className="text-sm text-primary font-medium">
                  ✓ {selectedProviders.length} provider{selectedProviders.length > 1 ? 's' : ''} selected
                  {selectedProviders.length > 1 && " - Great! You can submit certifications from multiple platforms."}
                </p>
              </motion.div>
            )}
          </div>

          {/* Multiple Certification Selection - Grouped by Provider */}
          {selectedProviders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="block text-base font-semibold">
                  Step 2: Select Your Certifications <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="w-full sm:w-64">
                    <Input
                      type="text"
                      value={certSearchQuery}
                      onChange={(e) => setCertSearchQuery(e.target.value)}
                      placeholder="Search certifications by name or code..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Sort:</Label>
                    <Select value={sortOrder} onValueChange={(value: 'a-z' | 'z-a' | 'default') => setSortOrder(value)}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a-z">A to Z</SelectItem>
                        <SelectItem value="z-a">Z to A</SelectItem>
                        <SelectItem value="default">Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the specific certifications you want to submit. You can select multiple certifications from your chosen providers.
              </p>
              <div className="border border-border rounded-xl p-4 max-h-96 overflow-y-auto bg-muted/30 space-y-6">
                {selectedProviders.map((providerValue) => {
                  const provider = CERTIFICATION_PROVIDERS.find(p => p.value === providerValue);
                  const providerCerts = getCertificationsForProvider(providerValue);
                  if (providerCerts.length === 0) return null;
                  
                  const providerColors: Record<string, string> = {
                    aws: "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
                    azure: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                    gcp: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
                    github: "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800",
                    oracle: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
                    salesforce: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                    servicenow: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                    other: "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800"
                  };
                  const colorClass = providerColors[providerValue] || providerColors.other;
                  
                  return (
                    <div key={providerValue} className="space-y-3">
                      <div className={`flex items-center gap-2 pb-2 border-b ${colorClass.split(' ')[2]}`}>
                        <h4 className={`font-semibold text-sm ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
                          {provider?.label} Certifications
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2 ml-2">
                        {[...providerCerts]
                          .filter((cert) => {
                            if (!certSearchQuery) return true;
                            const query = certSearchQuery.toLowerCase();
                            return (
                              cert.label.toLowerCase().includes(query) ||
                              cert.code.toLowerCase().includes(query)
                            );
                          })
                          .sort((a, b) => {
                          if (sortOrder === 'a-z') {
                            return a.label.localeCompare(b.label);
                          } else if (sortOrder === 'z-a') {
                            return b.label.localeCompare(a.label);
                          }
                          return 0;
                        }).map((cert) => {
                          const isChecked = selectedCertifications.includes(cert.value);
                          return (
                            <motion.div
                              key={cert.value}
                              whileHover={{ x: 4 }}
                              className={`
                                flex items-center space-x-3 py-2.5 px-3 rounded-lg border transition-all cursor-pointer
                                ${isChecked 
                                  ? 'bg-primary/10 border-primary/50 shadow-sm' 
                                  : 'hover:bg-muted/70 border-border/50'
                                }
                              `}
                              onClick={() => handleCertificationToggle(cert.value, !isChecked)}
                            >
                              <div className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                                ${isChecked 
                                  ? 'bg-primary border-primary' 
                                  : 'border-muted-foreground/40'
                                }
                              `}>
                                {isChecked && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              {cert.logo && (
                                <div className="flex-shrink-0">
                                  <img 
                                    src={
                                      cert.logo.includes('github-white-icon')
                                        ? (theme === 'dark' ? cert.logo : (cert as any).logoLight || cert.logo) // Interchanged for GitHub
                                        : (theme === 'dark' && (cert as any).logoLight ? (cert as any).logoLight : cert.logo)
                                    }
                                    alt={cert.label}
                                    className={`h-8 w-auto object-contain ${
                                      cert.logo && cert.logo.includes('HashiCorp')
                                        ? 'dark:invert'
                                        : cert.logo.includes('github-white-icon') && theme === 'light'
                                        ? 'invert' // Invert white icon for light theme
                                        : ''
                                    } ${
                                      cert.logo && (cert.logo.includes('Oracle') || cert.logo.includes('ServiceNow'))
                                        ? 'max-w-[80px]' // Limit width for Oracle and ServiceNow certifications
                                        : ''
                                    }`}
                                    onError={(e) => {
                                      // Hide image if it fails to load
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium text-sm ${isChecked ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {cert.label}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Exam Code: <span className="font-mono font-semibold">{cert.code}</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Selection Feedback */}
              {selectedCertifications.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                >
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Please select at least one certification to continue
                  </p>
                </motion.div>
              )}
              {selectedCertifications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg"
                >
                  <p className="text-sm text-primary font-medium">
                    ✓ {selectedCertifications.length} certification{selectedCertifications.length > 1 ? 's' : ''} selected
                    {selectedCertifications.length > 1 && " - Ready to proceed!"}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Selected Certifications Summary */}
          {selectedCertifications.length > 0 && (
            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">Selected Certifications:</h3>
              <div className="space-y-2">
                {selectedCertifications.map((certValue) => {
                  const cert = getCertifications().find(c => c.value === certValue);
                  if (!cert) return null;
                  return (
                    <div key={certValue} className="flex items-center justify-between p-2 bg-background rounded border">
                      <div>
                        <span className="font-medium">{cert.label}</span>
                        <span className="text-sm text-muted-foreground ml-2">({cert.code})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCertificationToggle(certValue, false)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Done Button */}
          {selectedCertifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-end pt-6 border-t border-border mt-6"
            >
              <div className="text-sm text-muted-foreground mb-3 text-right">
                {selectedCertifications.length} certification{selectedCertifications.length > 1 ? 's' : ''} ready to submit
              </div>
              <Button
                type="button"
                onClick={handleDoneSelection}
                className="px-8 py-6 text-base font-semibold"
                disabled={selectedCertifications.length === 0}
                size="lg"
              >
                Continue to Next Step →
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-right max-w-md">
                You can add more certifications later by clicking "Back to Add More Certifications" in the next step
              </p>
            </motion.div>
          )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Render step 2: Common Information
  if (currentStep === 'common-info') {
    return (
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-xl"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Your Information</h2>
          <p className="text-muted-foreground mb-8">
            Enter your personal details (this will be used for all certifications)
          </p>

          {/* Back to Selection Button */}
          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentStep('selection');
              }}
              className="mb-4"
            >
              ← Back to Add More Certifications
            </Button>
            <p className="text-sm text-muted-foreground">
              You can go back to add more certifications from other providers
            </p>
          </div>

          {/* Selected Certifications Summary */}
          {selectedCertifications.length > 0 && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h3 className="font-semibold mb-3 text-primary">Selected Certifications ({selectedCertifications.length}):</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedCertifications.map((certValue) => {
                  const cert = getCertifications().find(c => c.value === certValue);
                  if (!cert) return null;
                  const provider = getProviderForCertification(certValue);
                  const providerLabel = CERTIFICATION_PROVIDERS.find(p => p.value === provider)?.label || provider;
                  return (
                    <div key={certValue} className="flex items-center justify-between p-2 bg-background rounded border text-sm">
                      <div>
                        <span className="font-medium">{cert.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">({cert.code}) - {providerLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(handleCommonInfoSubmit)} className="space-y-6">
            {/* Show message that profile info will be used from account */}
            {(hasSubmittedBefore || showAddNew || user?.email) ? (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  ✓ Your profile information will be used from your account. You can update it in the Profile section.
                </p>
              </div>
            ) : (
              <>
                {/* Full Name - only show if user is not logged in */}
                <div>
                  <Label htmlFor="fullName" className="mb-2">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName", { required: "Full name is required" })}
                    placeholder="Your full name"
                    className="w-full"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email - only show if user is not logged in */}
                <div>
                  <Label htmlFor="email" className="mb-2">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    placeholder="your.email@example.com"
                    className="w-full"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Selected Certifications with Credential Inputs */}
            <div className="space-y-6 mt-8">
              <h3 className="text-xl font-semibold text-primary">Enter Credentials for Each Certification</h3>
              {certificationCredentials.map((cred) => {
                const cert = getCertifications().find(c => c.value === cred.certificationValue);
                if (!cert) return null;
                
                              return (
                  <div key={cred.certificationValue} className="p-6 bg-muted/30 border border-border rounded-lg space-y-4">
                    <div className="pb-3 border-b border-border">
                      <h4 className="text-lg font-semibold">{cert.label}</h4>
                      <p className="text-sm text-muted-foreground">Exam Code: {cert.code}</p>
                    </div>
                    

                    {/* Verified Credential URL */}
                    <div>
                      <Label htmlFor={`verified-${cred.certificationValue}`} className="mb-2">
                        Verified Credential URL <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`verified-${cred.certificationValue}`}
                        type="url"
                        value={cred.verifiedCredential || ''}
                        onChange={(e) => handleCredentialUpdate(cred.certificationValue, 'verifiedCredential', e.target.value)}
                        placeholder="https://www.credly.com/badges/... or https://learn.microsoft.com/..."
                        className="w-full"
                        required
                      />
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Additional Notes - Single field for all certifications */}
            <div className="mt-8">
              <Label htmlFor="additionalNotes" className="mb-2">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="additionalNotes"
                {...register("additionalNotes")}
                placeholder="Any additional information about your certifications..."
                className="w-full min-h-[100px]"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('selection')}
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting} className="px-8">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  `Submit All ${certificationCredentials.length} Certification${certificationCredentials.length > 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  // Render step 3: Individual Certification Credentials
  if (currentStep === 'credentials') {
    const currentCert = certificationCredentials[currentCertIndex];
    if (!currentCert) {
      return null;
    }

    return (
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-xl"
        >
          {isEditMode && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium">
                ✓ Edit Mode: Only certification details will be updated. Your profile information remains unchanged.
              </p>
            </div>
          )}
          
          <div className="mb-6">
            {!isEditMode && (
              <div className="text-sm text-muted-foreground mb-2">
                Certification {currentCertIndex + 1} of {certificationCredentials.length}
              </div>
            )}
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {isEditMode ? 'Edit Certification' : currentCert.certificationName}
            </h2>
            <div className="space-y-1">
              <p className="text-muted-foreground">
                <span className="font-semibold">Certification:</span> {currentCert.certificationName}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold">Exam Code:</span> {currentCert.examCode}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitCredential(handleCredentialSubmit)} className="space-y-6">
            {/* Certification Selection */}
            <div>
              <Label htmlFor="credential-certification" className="mb-2">
                Certification <span className="text-destructive">*</span>
              </Label>
              <Select
                value={currentCert.certificationValue || ''}
                onValueChange={(value) => {
                  const allCerts = getCertifications();
                  const selectedCert = allCerts.find(c => c.value === value);
                  if (selectedCert) {
                    setCredentialValue("certificationValue", value);
                    // Update the current cert in the credentials array
                    const updatedCreds = [...certificationCredentials];
                    updatedCreds[currentCertIndex] = {
                      ...updatedCreds[currentCertIndex],
                      certificationValue: value,
                      certificationName: selectedCert.label,
                      examCode: selectedCert.code,
                    };
                    setCertificationCredentials(updatedCreds);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a certification" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCertifications
                    .map(certValue => {
                      const allCerts = getCertifications();
                      return allCerts.find(c => c.value === certValue);
                    })
                    .filter(cert => cert !== undefined)
                    .sort((a, b) => {
                      if (!a || !b) return 0;
                      if (sortOrder === 'a-z') {
                        return a.label.localeCompare(b.label);
                      } else if (sortOrder === 'z-a') {
                        return b.label.localeCompare(a.label);
                      }
                      return 0;
                    })
                    .map((cert) => (
                      <SelectItem key={cert!.value} value={cert!.value}>
                        {cert!.label} ({cert!.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Verified Credential URL */}
            <div>
              <Label htmlFor="credential-verifiedCredential" className="mb-2">
                Verified Credential URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="credential-verifiedCredential"
                type="url"
                defaultValue={currentCert.verifiedCredential || ''}
                {...registerCredential("verifiedCredential", {
                  required: "Verified Credential URL is required",
                  pattern: {
                    value: /^https?:\/\/.+/i,
                    message: "Please enter a valid URL",
                  },
                })}
                placeholder="https://www.credly.com/badges/..."
                className="w-full"
              />
              {credentialErrors.verifiedCredential && (
                <p className="text-sm text-destructive mt-1">
                  {credentialErrors.verifiedCredential.message}
                </p>
              )}
            </div>

            {/* Additional Notes */}
            <div>
              <Label htmlFor="credential-additionalNotes" className="mb-2">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="credential-additionalNotes"
                defaultValue={currentCert.additionalNotes || ''}
                {...registerCredential("additionalNotes")}
                placeholder="Any additional information about this certification..."
                className="w-full min-h-[100px]"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                    if (isEditMode) {
                      // In edit mode, go back to manage certifications
                      window.location.href = '/manage-certifications';
                    } else if (currentCertIndex > 0) {
                    setCurrentCertIndex(currentCertIndex - 1);
                    const prevCert = certificationCredentials[currentCertIndex - 1];
                    setCredentialValue('certificationDate', prevCert.certificationDate);
                    setCredentialValue('verifiedCredential', prevCert.verifiedCredential);
                  } else {
                    setCurrentStep('common-info');
                  }
                }}
              >
                {isEditMode ? 'Cancel' : (currentCertIndex > 0 ? 'Previous' : 'Back')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isEditMode ? 'Update Certification' : (currentCertIndex < certificationCredentials.length - 1 ? 'Next Certification' : 'Submit All')}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  // Fallback (should not reach here)
  return null;
};
