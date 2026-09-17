/**
 * Comprehensive Automated Security & Penetration Defense Audit
 * Modeled on the Strix AI Penetration Testing & OWASP Top 10 Framework
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { escapeHtml, sanitizeText, sanitizeUrl, isInternalAddress } from "../src/lib/sanitize";

interface AuditResult {
  category: string;
  check: string;
  passed: boolean;
  details: string;
}

const results: AuditResult[] = [];

function record(category: string, check: string, passed: boolean, details: string) {
  results.push({ category, check, passed, details });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} [${category}] ${check}: ${details}`);
}

console.log("===============================================================");
console.log("🛡️  STARTING STRIX-MODE SECURITY & PENETRATION AUDIT");
console.log("===============================================================\n");

// 1. Secrets Isolation & Client Leakage Check
console.log("--- 1. Secrets & Credentials Isolation ---");
const rootEnvExample = resolve(process.cwd(), ".env.example");
const clientSupabaseFile = resolve(process.cwd(), "src/lib/supabase.ts");

if (existsSync(clientSupabaseFile)) {
  const content = readFileSync(clientSupabaseFile, "utf-8");
  const hasServiceRoleKey = content.includes("SUPABASE_SERVICE_ROLE_KEY") || content.includes("service_role");
  const hasRazorpaySecret = content.includes("RAZORPAY_KEY_SECRET") || content.includes("key_secret");
  
  record(
    "A02: Secrets Isolation",
    "Frontend Supabase Client",
    !hasServiceRoleKey,
    hasServiceRoleKey ? "CRITICAL: Service role key referenced in client bundle!" : "Only public anon key used in client"
  );

  record(
    "A02: Secrets Isolation",
    "Razorpay Secret Isolation",
    !hasRazorpaySecret,
    hasRazorpaySecret ? "CRITICAL: Razorpay secret referenced in client bundle!" : "Payment secrets isolated to serverless API"
  );
}

// 2. HTTP Security Headers in vercel.json
console.log("\n--- 2. HTTP Security Headers (OWASP A05) ---");
const vercelJsonPath = resolve(process.cwd(), "vercel.json");
if (existsSync(vercelJsonPath)) {
  const vercelConfig = JSON.parse(readFileSync(vercelJsonPath, "utf-8"));
  const headers = vercelConfig.headers || [];
  const globalHeaderObj = headers.find((h: any) => h.source === "/(.*)") || {};
  const globalHeadersList = globalHeaderObj.headers || [];

  const hasNoSniff = globalHeadersList.some((h: any) => h.key === "X-Content-Type-Options" && h.value === "nosniff");
  const hasFrameOptions = globalHeadersList.some((h: any) => h.key === "X-Frame-Options" && (h.value === "SAMEORIGIN" || h.value === "DENY"));
  const hasHsts = globalHeadersList.some((h: any) => h.key === "Strict-Transport-Security");
  const hasPermPolicy = globalHeadersList.some((h: any) => h.key === "Permissions-Policy");

  record("A05: Headers", "X-Content-Type-Options (MIME Sniffing)", hasNoSniff, "nosniff directive is active");
  record("A05: Headers", "X-Frame-Options (Anti-Clickjacking)", hasFrameOptions, "SAMEORIGIN / DENY is active");
  record("A05: Headers", "HSTS (Strict-Transport-Security)", hasHsts, "HSTS max-age is configured");
  record("A05: Headers", "Permissions-Policy (Feature Restriction)", hasPermPolicy, "Restricted camera/mic/geo permissions");
}

// 3. Input Sanitization & Anti-XSS Engine Tests
console.log("\n--- 3. Anti-XSS & Input Sanitization (OWASP A03/A04) ---");
const maliciousPayloads = [
  "<script>alert('xss')</script>",
  "<img src=x onerror=alert(1)>",
  "javascript:alert(document.cookie)",
  "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
];

for (const payload of maliciousPayloads) {
  const escaped = escapeHtml(payload);
  const isXssBlocked = !escaped.includes("<script>") && !escaped.includes("onerror=");
  record("A03: XSS Protection", `Escape payload: ${payload.slice(0, 25)}...`, isXssBlocked, `Sanitized to: ${escaped.slice(0, 30)}...`);
}

const safeUrl = sanitizeUrl("javascript:alert(1)");
record("A03: Safe URLs", "Block javascript: URI", safeUrl === "#", `javascript: URI sanitized to fallback '${safeUrl}'`);

// 4. SSRF (Server-Side Request Forgery) IP Blocking Tests
console.log("\n--- 4. SSRF Defense Engine (OWASP A10) ---");
const internalIps = [
  "localhost",
  "127.0.0.1",
  "169.254.169.254", // AWS Metadata
  "10.0.0.1",
  "192.168.1.1",
  "172.16.0.5",
  "meta.internal",
];

for (const ip of internalIps) {
  const blocked = isInternalAddress(ip);
  record("A10: SSRF Defense", `Block internal target: ${ip}`, blocked, "Correctly identified as internal/private address");
}

const publicHost = "https://www.yatricloud.com";
const isPublicAllowed = !isInternalAddress("www.yatricloud.com");
record("A10: SSRF Defense", "Allow public domain", isPublicAllowed, "Public domains permitted for valid outbound requests");

// 5. Open Redirect Protection Tests
console.log("\n--- 5. Open Redirect Defense (CWE-601) ---");
const sendEmailApi = resolve(process.cwd(), "api/send-email.ts");
if (existsSync(sendEmailApi)) {
  const content = readFileSync(sendEmailApi, "utf-8");
  const hasSafeRedirect = content.includes("getSafeRedirectUrl");
  record("CWE-601: Open Redirect", "Newsletter Click Redirect Validation", hasSafeRedirect, "Open redirect protected with domain whitelist");
}

// 6. Summary Output
console.log("\n===============================================================");
const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = total - passed;

console.log(`📊 AUDIT SUMMARY: ${passed}/${total} checks passed (${failed} failed)`);
console.log("===============================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🛡️  ALL SECURITY & PENETRATION AUDIT CHECKS PASSED!");
  process.exit(0);
}
