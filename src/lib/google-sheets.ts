/**
 * Google Sheets Integration Service
 * 
 * This service handles submitting and fetching certification data from Google Sheets.
 * 
 * For production, you'll need to set up one of the following:
 * 1. Google Apps Script Web App (recommended for security)
 * 2. Google Sheets API with service account
 * 3. Third-party service like Zapier/Make.com
 * 
 * The Google Sheet structure:
 * - Main sheet: "certified-aws-yatris", "certified-azure-yatris", etc.
 * - Sub-sheets within: "az900", "az104", "saa-c03", etc.
 */

const GOOGLE_SHEETS_WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL || "";
const AWS_CERTIFICATIONS_WEBHOOK_URL = import.meta.env.VITE_AWS_CERTIFICATIONS_WEBHOOK_URL || "";
const AZURE_CERTIFICATIONS_WEBHOOK_URL = import.meta.env.VITE_AZURE_CERTIFICATIONS_WEBHOOK_URL || "";
const GCP_CERTIFICATIONS_WEBHOOK_URL = import.meta.env.VITE_GCP_CERTIFICATIONS_WEBHOOK_URL || "";
const GITHUB_CERTIFICATIONS_WEBHOOK_URL = import.meta.env.VITE_GITHUB_CERTIFICATIONS_WEBHOOK_URL || "";
const ORACLE_CERTIFICATIONS_WEBHOOK_URL = import.meta.env.VITE_ORACLE_CERTIFICATIONS_WEBHOOK_URL || "";
const SALESFORCE_CERTIFICATIONS_WEBHOOK_URL = import.meta.env.VITE_SALESFORCE_CERTIFICATIONS_WEBHOOK_URL || "";
const SERVICENOW_CERTIFICATIONS_WEBHOOK_URL = import.meta.env.VITE_SERVICENOW_CERTIFICATIONS_WEBHOOK_URL || "";
const OPENAI_CERTIFICATIONS_WEBHOOK_URL = import.meta.env.VITE_OPENAI_CERTIFICATIONS_WEBHOOK_URL || "";
const HASHICORP_CERTIFICATIONS_WEBHOOK_URL = import.meta.env.VITE_HASHICORP_CERTIFICATIONS_WEBHOOK_URL || "";
const KUBERNETES_CERTIFICATIONS_WEBHOOK_URL = import.meta.env.VITE_KUBERNETES_CERTIFICATIONS_WEBHOOK_URL || "";

/**
 * Get the appropriate webhook URL based on certification provider
 */
function getWebhookUrl(provider: string): string {
  const providerLower = provider.toLowerCase();
  console.log(`🔍 Getting webhook URL for provider: ${providerLower}`);

  switch (providerLower) {
    case 'aws':
      console.log(`🔗 AWS webhook URL: ${AWS_CERTIFICATIONS_WEBHOOK_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      if (!AWS_CERTIFICATIONS_WEBHOOK_URL) {
        console.error(`❌ AWS webhook URL is missing! Check VITE_AWS_CERTIFICATIONS_WEBHOOK_URL in .env`);
      }
      return AWS_CERTIFICATIONS_WEBHOOK_URL || '';
    case 'azure':
      console.log(`🔗 Azure webhook URL: ${AZURE_CERTIFICATIONS_WEBHOOK_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      return AZURE_CERTIFICATIONS_WEBHOOK_URL || GOOGLE_SHEETS_WEBHOOK_URL;
    case 'gcp':
      console.log(`🔗 GCP webhook URL: ${GCP_CERTIFICATIONS_WEBHOOK_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      return GCP_CERTIFICATIONS_WEBHOOK_URL || '';
    case 'github':
      console.log(`🔗 GitHub webhook URL: ${GITHUB_CERTIFICATIONS_WEBHOOK_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      return GITHUB_CERTIFICATIONS_WEBHOOK_URL || '';
    case 'oracle':
      console.log(`🔗 Oracle webhook URL: ${ORACLE_CERTIFICATIONS_WEBHOOK_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      return ORACLE_CERTIFICATIONS_WEBHOOK_URL || '';
    case 'salesforce':
      console.log(`🔗 Salesforce webhook URL: ${SALESFORCE_CERTIFICATIONS_WEBHOOK_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      return SALESFORCE_CERTIFICATIONS_WEBHOOK_URL || '';
    case 'servicenow':
      console.log(`🔗 ServiceNow webhook URL: ${SERVICENOW_CERTIFICATIONS_WEBHOOK_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      return SERVICENOW_CERTIFICATIONS_WEBHOOK_URL || '';
    case 'openai':
      console.log(`🔗 OpenAI webhook URL: ${OPENAI_CERTIFICATIONS_WEBHOOK_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      return OPENAI_CERTIFICATIONS_WEBHOOK_URL || '';
    case 'hashicorp':
      console.log(`🔗 HashiCorp webhook URL: ${HASHICORP_CERTIFICATIONS_WEBHOOK_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      return HASHICORP_CERTIFICATIONS_WEBHOOK_URL || '';
    case 'kubernetes':
      console.log(`🔗 Kubernetes webhook URL: ${KUBERNETES_CERTIFICATIONS_WEBHOOK_URL ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      return KUBERNETES_CERTIFICATIONS_WEBHOOK_URL || '';
    default:
      console.log(`🔗 Using general webhook URL for ${providerLower}`);
      return GOOGLE_SHEETS_WEBHOOK_URL;
  }
}

export interface CertificationSubmission {
  fullName: string;
  email: string;
  certificationProvider: string;
  certificationName: string;
  examCode: string;
  certificationDate: string;
  linkedinUrl: string;
  verifiedCredential: string;
  country: string;
  stateProvince?: string;
  city: string;
  countryCode: string;
  phoneNumber: string;
  photo: File | null;
  photoUrl?: string; // Optional: if user has photo from signup, use this instead of uploading
  additionalNotes?: string;
  sheetName: string;
  subSheetName: string;
}

export interface CertificationEntry {
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
  countryCode?: string;
  phoneNumber?: string;
  photoUrl: string;
  additionalNotes?: string;
}

/**
 * Convert file to base64 for Google Sheets submission
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Upload photo to a storage service (e.g., Imgur, Cloudinary, or your own server)
 * For now, we'll convert to base64 and store in Google Sheets
 * In production, you should upload to a proper image hosting service
 */
async function uploadPhoto(photo: File): Promise<string> {
  // Option 1: Convert to base64 (stored in sheet - not recommended for large images)
  const base64 = await fileToBase64(photo);

  // Option 2: Upload to image hosting service (recommended)
  // Example with Imgur API:
  // const formData = new FormData();
  // formData.append('image', photo);
  // const response = await fetch('https://api.imgur.com/3/image', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Client-ID ${IMGUR_CLIENT_ID}` },
  //   body: formData
  // });
  // const data = await response.json();
  // return data.data.link;

  return base64;
}

/**
 * Submit certification to Google Sheets
 */
export async function submitCertification(
  data: CertificationSubmission
): Promise<void> {
  // Get the appropriate webhook URL based on provider
  const webhookUrl = getWebhookUrl(data.certificationProvider);

  console.log(`🔗 Provider: ${data.certificationProvider.toUpperCase()}`);
  console.log(`🔗 Webhook URL: ${webhookUrl ? webhookUrl.substring(0, 50) + '...' : 'NOT CONFIGURED'}`);

  if (!webhookUrl) {
    // In development, show a helpful message
    if (import.meta.env.DEV) {
      console.error(`❌ ${data.certificationProvider.toUpperCase()} webhook URL not configured!`);
      console.error(`Please set VITE_${data.certificationProvider.toUpperCase()}_CERTIFICATIONS_WEBHOOK_URL in your .env file`);
      console.error("Current env vars:", {
        AWS: AWS_CERTIFICATIONS_WEBHOOK_URL ? 'SET' : 'NOT SET',
        AZURE: AZURE_CERTIFICATIONS_WEBHOOK_URL ? 'SET' : 'NOT SET',
        GENERAL: GOOGLE_SHEETS_WEBHOOK_URL ? 'SET' : 'NOT SET'
      });
      // Don't simulate success - throw error so user knows
      throw new Error(
        `${data.certificationProvider.toUpperCase()} webhook URL not configured. Please set VITE_${data.certificationProvider.toUpperCase()}_CERTIFICATIONS_WEBHOOK_URL in your .env file.`
      );
    }
    throw new Error(
      `${data.certificationProvider.toUpperCase()} webhook URL not configured. Please contact support.`
    );
  }

  // Use photoUrl from user profile if available, otherwise upload photo file
  let photoUrl = "";
  if (data.photoUrl) {
    // User has photo from signup/profile - use it directly
    photoUrl = data.photoUrl;
    console.log("📸 Using photo from user profile");
  } else if (data.photo) {
    // Upload new photo file
    photoUrl = await uploadPhoto(data.photo);
    console.log("📸 Uploaded new photo file");
  }

  // Prepare submission data
  const submissionData = {
    fullName: data.fullName,
    email: data.email,
    certificationProvider: data.certificationProvider,
    certificationName: data.certificationName,
    examCode: data.examCode,
    certificationDate: data.certificationDate,
    linkedinUrl: data.linkedinUrl,
    verifiedCredential: data.verifiedCredential,
    country: data.country,
    stateProvince: data.stateProvince || "",
    city: data.city,
    photoUrl: photoUrl,
    additionalNotes: data.additionalNotes || "",
    sheetName: data.sheetName,
    subSheetName: data.subSheetName,
    timestamp: new Date().toISOString(),
  };

  // Debug: Log what we're sending
  console.log("📤 Submitting to Google Sheets:", {
    provider: data.certificationProvider,
    url: webhookUrl,
    data: {
      ...submissionData,
      photoUrl: photoUrl ? `${photoUrl.substring(0, 50)}...` : "No photo",
    },
  });

  // Validate URL
  if (!webhookUrl) {
    throw new Error(`${data.certificationProvider.toUpperCase()} webhook URL is not configured. Please check your .env file.`);
  }

  if (!webhookUrl.includes('/macros/s/')) {
    console.error("❌ Invalid webhook URL format. Should be: https://script.google.com/macros/s/.../exec");
    throw new Error("Invalid webhook URL. Please use the Web App URL, not the library URL.");
  }

  // Submit to Google Sheets via webhook
  try {
    // Try with CORS first, fallback to no-cors if it fails
    let response: Response;
    try {
      console.log(`📤 [${data.certificationProvider.toUpperCase()}] Submitting to: ${webhookUrl.substring(0, 60)}...`);
      console.log(`📤 [${data.certificationProvider.toUpperCase()}] Data:`, {
        certificationName: data.certificationName,
        examCode: data.examCode,
        sheetName: data.sheetName,
        subSheetName: data.subSheetName,
        email: data.email
      });

      response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      console.log(`📥 [${data.certificationProvider.toUpperCase()}] Response status: ${response.status} ${response.statusText}`);

      // If response is ok, try to parse it
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [${data.certificationProvider.toUpperCase()}] Google Sheets response:`, result);
        if (result.success === false) {
          throw new Error(result.error || "Submission failed");
        }
        // Success!
        console.log(`✅ [${data.certificationProvider.toUpperCase()}] Successfully submitted: ${data.certificationName} to ${data.sheetName}`);
        return;
      } else {
        const errorText = await response.text();
        console.error(`❌ [${data.certificationProvider.toUpperCase()}] Google Sheets error:`, response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 200)}`);
      }
    } catch (corsError: any) {
      // If CORS fails, try with no-cors mode (data will still be saved)
      console.warn(`⚠️ [${data.certificationProvider.toUpperCase()}] CORS error, trying no-cors mode:`, corsError.message);
      console.log(`📤 [${data.certificationProvider.toUpperCase()}] Sending data (no-cors mode):`, {
        certificationName: data.certificationName,
        examCode: data.examCode,
        sheetName: data.sheetName,
        subSheetName: data.subSheetName
      });

      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      // With no-cors, we can't verify success, but data should be saved
      console.warn(`⚠️ [${data.certificationProvider.toUpperCase()}] Submitted with no-cors mode. Check Google Apps Script execution logs to verify data was saved.`);
      console.warn("💡 Tip: Update Google Apps Script with CORS headers for better error handling (see CORS_FIX_INSTRUCTIONS.md)");
      return; // Assume success
    }
  } catch (error: any) {
    console.error(`❌ [${data.certificationProvider.toUpperCase()}] Error submitting certification:`, error);
    // If it's already an Error, rethrow it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, wrap it
    throw new Error(`Network error for ${data.certificationProvider.toUpperCase()}: ${error?.message || "Unknown error"}`);
  }
}

/**
 * Fetch certifications from a single webhook URL
 */
async function fetchFromWebhook(url: string, provider: string): Promise<CertificationEntry[]> {
  if (!url) {
    console.warn(`⚠️ ${provider} webhook URL not configured`);
    return [];
  }

  try {
    console.log(`📥 Fetching ${provider} certifications from:`, url);

    // Try with CORS first (no Content-Type header to avoid preflight)
    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        mode: "cors",
      });
    } catch (corsError) {
      console.warn(`⚠️ CORS error for ${provider}, skipping...`);
      return [];
    }

    if (!response.ok) {
      console.error(`❌ Failed to fetch ${provider}:`, response.status);
      return [];
    }

    const data = await response.json();

    // Handle both response formats
    let certifications: CertificationEntry[] = [];
    if (data.certifications && Array.isArray(data.certifications)) {
      certifications = data.certifications;
    } else if (Array.isArray(data)) {
      certifications = data;
    } else {
      console.warn(`⚠️ Unexpected response format for ${provider}:`, data);
      return [];
    }

    console.log(`✅ Fetched ${certifications.length} ${provider} certifications`);

    // Normalize fields (handle different naming variations from Google Sheets)
    return certifications.map((cert: any) => {
      const verifiedCredential =
        cert.verifiedCredential ||
        cert.verifiedcredential ||
        cert['verified-credential'] ||
        cert['Verified Credential'] ||
        cert.verified_credential ||
        '';

      // Apps Script lowercases headers, so check lowercase variations
      const country =
        cert.country ||
        cert['country'] ||
        cert['Country'] ||
        '';

      // Debug country field for first cert
      if (certifications.indexOf(cert) === 0) {
        console.log('🌍 Country field in frontend:', {
          'cert.country': cert.country,
          'cert[country]': cert['country'],
          'cert[Country]': cert['Country'],
          'resolved country': country,
          'allKeys': Object.keys(cert)
        });
      }

      const stateProvince =
        cert.stateProvince ||
        cert.stateprovince ||
        cert['state-province'] ||
        cert['State/Province'] ||
        cert.State ||
        cert.Province ||
        '';

      const city =
        cert.city ||
        cert.City ||
        cert.CITY ||
        '';

      const countryCode =
        cert.countryCode ||
        cert.countrycode ||
        cert['country-code'] ||
        cert['Country Code'] ||
        '';

      const phoneNumber =
        cert.phoneNumber ||
        cert.phonenumber ||
        cert['phone-number'] ||
        cert['Phone Number'] ||
        '';

      return {
        ...cert,
        verifiedCredential: verifiedCredential.trim(),
        country: country && country.trim() !== '' ? country.trim() : undefined,
        stateProvince: stateProvince && stateProvince.trim() !== '' ? stateProvince.trim() : undefined,
        city: city && city.trim() !== '' ? city.trim() : undefined,
        countryCode: countryCode && countryCode.trim() !== '' ? countryCode.trim() : undefined,
        phoneNumber: phoneNumber && phoneNumber.trim() !== '' ? phoneNumber.trim() : undefined,
        certificationDate:
          cert.certificationDate ||
          cert.certificationdate ||
          cert['certification-date'] ||
          cert['Certification Date'] ||
          cert.Date ||
          '',
        additionalNotes:
          cert.additionalNotes ||
          cert.additionalnotes ||
          cert['additional-notes'] ||
          cert['Additional Notes'] ||
          cert.Notes ||
          ''
      };
    });
  } catch (error: any) {
    console.error(`❌ Error fetching ${provider} certifications:`, error);
    return [];
  }
}

/**
 * Fetch certifications from Google Sheets
 * Fetches from multiple webhooks (AWS, Azure, GCP, GitHub, Oracle, Salesforce, ServiceNow) and combines results
 */
export async function fetchCertifications(): Promise<CertificationEntry[]> {
  const allCertifications: CertificationEntry[] = [];

  // Fetch from all configured webhooks in parallel
  const fetchPromises: Promise<CertificationEntry[]>[] = [];

  // Fetch from AWS webhook
  if (AWS_CERTIFICATIONS_WEBHOOK_URL) {
    fetchPromises.push(fetchFromWebhook(AWS_CERTIFICATIONS_WEBHOOK_URL, 'AWS'));
  } else {
    console.warn('⚠️ AWS webhook URL not configured');
  }

  // Fetch from Azure webhook
  if (AZURE_CERTIFICATIONS_WEBHOOK_URL) {
    fetchPromises.push(fetchFromWebhook(AZURE_CERTIFICATIONS_WEBHOOK_URL, 'Azure'));
  } else {
    console.warn('⚠️ Azure webhook URL not configured');
  }

  // Fetch from GCP webhook
  if (GCP_CERTIFICATIONS_WEBHOOK_URL) {
    fetchPromises.push(fetchFromWebhook(GCP_CERTIFICATIONS_WEBHOOK_URL, 'GCP'));
  } else {
    console.warn('⚠️ GCP webhook URL not configured');
  }

  // Fetch from GitHub webhook
  if (GITHUB_CERTIFICATIONS_WEBHOOK_URL) {
    fetchPromises.push(fetchFromWebhook(GITHUB_CERTIFICATIONS_WEBHOOK_URL, 'GitHub'));
  } else {
    console.warn('⚠️ GitHub webhook URL not configured');
  }

  // Fetch from Oracle webhook
  if (ORACLE_CERTIFICATIONS_WEBHOOK_URL) {
    fetchPromises.push(fetchFromWebhook(ORACLE_CERTIFICATIONS_WEBHOOK_URL, 'Oracle'));
  } else {
    console.warn('⚠️ Oracle webhook URL not configured');
  }

  // Fetch from Salesforce webhook
  if (SALESFORCE_CERTIFICATIONS_WEBHOOK_URL) {
    fetchPromises.push(fetchFromWebhook(SALESFORCE_CERTIFICATIONS_WEBHOOK_URL, 'Salesforce'));
  } else {
    console.warn('⚠️ Salesforce webhook URL not configured');
  }

  // Fetch from ServiceNow webhook
  if (SERVICENOW_CERTIFICATIONS_WEBHOOK_URL) {
    fetchPromises.push(fetchFromWebhook(SERVICENOW_CERTIFICATIONS_WEBHOOK_URL, 'ServiceNow'));
  } else {
    console.warn('⚠️ ServiceNow webhook URL not configured');
  }

  // Fetch from general webhook (fallback for other providers)
  if (GOOGLE_SHEETS_WEBHOOK_URL) {
    fetchPromises.push(fetchFromWebhook(GOOGLE_SHEETS_WEBHOOK_URL, 'Other'));
  }

  // Wait for all fetches to complete
  const results = await Promise.all(fetchPromises);

  // Combine all results
  results.forEach((certs) => {
    allCertifications.push(...certs);
  });

  console.log(`📊 Total certifications fetched: ${allCertifications.length}`);
  console.log(`📊 Breakdown by provider:`, {
    AWS: allCertifications.filter(c => c.certificationProvider?.toLowerCase() === 'aws').length,
    Azure: allCertifications.filter(c => c.certificationProvider?.toLowerCase() === 'azure').length,
    GCP: allCertifications.filter(c => c.certificationProvider?.toLowerCase() === 'gcp').length,
    GitHub: allCertifications.filter(c => c.certificationProvider?.toLowerCase() === 'github').length,
    Oracle: allCertifications.filter(c => c.certificationProvider?.toLowerCase() === 'oracle').length,
    Salesforce: allCertifications.filter(c => c.certificationProvider?.toLowerCase() === 'salesforce').length,
    ServiceNow: allCertifications.filter(c => c.certificationProvider?.toLowerCase() === 'servicenow').length,
  });

  return allCertifications;
}

/**
 * Mock certifications for development/testing
 * Returns empty array - no dummy data
 */
function getMockCertifications(): CertificationEntry[] {
  return [];
}

