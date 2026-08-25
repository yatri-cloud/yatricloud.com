/**
 * Centralized Input Sanitization & Anti-XSS Engine
 * Protects against Cross-Site Scripting (XSS), HTML Injection,
 * Script Tag Injection, and Malicious URI Schemes (javascript:, data:).
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /onfocus\s*=/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
];

/**
 * Escapes raw HTML characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitizes general free-text input by removing script tags and event handlers.
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== "string") return "";
  let clean = input;
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  return clean.trim();
}

/**
 * Validates and sanitizes a URL to ensure safe protocols (http, https, mailto, tel).
 * Blocks javascript: and data: URIs.
 */
export function sanitizeUrl(url: string, fallback = "#"): string {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  
  // Block protocol-relative, backslash bypasses, and control characters
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.includes("\0")) {
    return fallback;
  }

  // Allow internal relative paths without directory traversal
  if (trimmed.startsWith("/") && !trimmed.includes("../") && !trimmed.includes("..\\")) {
    return trimmed;
  }

  // Allow standard web protocols
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

/**
 * Validates if an IP address or hostname is a private/internal network target (SSRF Protection).
 * Covers IPv4, IPv6, Hex/Octal notations, and Cloud metadata endpoints.
 */
export function isInternalAddress(host: string): boolean {
  if (!host) return true;
  const clean = host.toLowerCase().trim();

  // Block localhost and loopback IPv4/IPv6
  if (
    clean === "localhost" ||
    clean === "127.0.0.1" ||
    clean === "::1" ||
    clean === "0.0.0.0" ||
    clean === "::" ||
    clean.startsWith("127.")
  ) {
    return true;
  }

  // Block IPv6 link-local and unique local addresses (RFC 4193 / RFC 4291)
  if (clean.startsWith("fe80:") || clean.startsWith("fc00:") || clean.startsWith("fd00:")) {
    return true;
  }

  // Block AWS / GCP / Azure Cloud Instance Metadata Services
  if (clean === "169.254.169.254" || clean.startsWith("169.254.") || clean === "metadata.google.internal") {
    return true;
  }

  // Block RFC1918 Private IPv4 ranges
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;

  // Block Hex/Decimal encoded loopback IPs (e.g. 2130706433, 0x7f000001, 0177.0.0.1)
  if (/^\d{8,10}$/.test(clean) || /^0x[0-9a-f]+$/i.test(clean) || /^0\d+\./.test(clean)) {
    return true;
  }

  // Block local domains
  if (clean.endsWith(".local") || clean.endsWith(".internal") || clean.endsWith(".localhost") || clean.endsWith(".localdomain")) {
    return true;
  }

  return false;
}
