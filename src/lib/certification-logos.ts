/**
 * Certification provider logos — shared with Certified Yatris and Reviews.
 * Same source as certification.yatricloud.com / certifiedyatris?addNew=true.
 */

export const LOGO_BASE_URL =
  "https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications";

export type CertificationLogoInfo = {
  label: string;
  logo: string;
  logoLight?: string;
};

/** Provider id -> logo URLs and label. Used by Reviews and Certified Yatris. */
export const CERTIFICATION_PROVIDER_LOGOS: Record<string, CertificationLogoInfo> = {
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

/** Resolve logo URL for a provider by theme (light theme uses logoLight when available). */
export function getCertificationLogoUrl(
  providerId: string,
  theme: "light" | "dark"
): string | undefined {
  const info = CERTIFICATION_PROVIDER_LOGOS[providerId];
  if (!info) return undefined;
  if (theme === "light" && info.logoLight) return info.logoLight;
  return info.logo;
}
