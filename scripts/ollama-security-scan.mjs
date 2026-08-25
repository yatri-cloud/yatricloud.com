/**
 * Local AI Penetration Testing & Security Audit Runner
 * Uses Ollama with qwen2.5-coder:14b running on local M4 Pro
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const OLLAMA_URL = process.env.OLLAMA_HOST || "http://localhost:11434";
const MODEL_NAME = process.env.OLLAMA_MODEL || "qwen2.5-coder:14b";

async function checkOllamaReady() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return false;
    const data = await res.json();
    return (data.models || []).some((m) => m.name.includes("qwen2.5-coder:14b") || m.model.includes("qwen2.5-coder:14b"));
  } catch {
    return false;
  }
}

async function queryOllama(prompt) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_NAME,
      prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 800,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned status ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.response;
}

async function runSecurityAudit() {
  console.log("===============================================================");
  console.log(`🤖 STARTING LOCAL AI SECURITY AUDIT WITH ${MODEL_NAME}`);
  console.log(`📡 Ollama Endpoint: ${OLLAMA_URL}`);
  console.log("===============================================================\n");

  const isReady = await checkOllamaReady();
  if (!isReady) {
    console.error(`❌ Model '${MODEL_NAME}' is not loaded in Ollama. Run: ollama run ${MODEL_NAME}`);
    process.exit(1);
  }

  const filesToAudit = [
    {
      name: "vercel.json (Security Headers & CORS)",
      path: "vercel.json",
      focus: "Review the HTTP security headers, CORS settings, and route protections against OWASP Top 10 vulnerabilities.",
    },
    {
      name: "api/send-email.ts (SSRF & Open Redirect Defenses)",
      path: "api/send-email.ts",
      focus: "Analyze the getSafeRedirectUrl function, email dispatch, and tracking endpoints for Open Redirect (CWE-601), SSRF, or Header Injection risks.",
    },
    {
      name: "api/razorpay/verify.ts (Payment Cryptographic Verification)",
      path: "api/razorpay/verify.ts",
      focus: "Audit the cryptographic HMAC-SHA256 signature verification and order state mutation for payment tampering or race conditions.",
    },
    {
      name: "src/lib/sanitize.ts (Anti-XSS & Anti-SSRF Engine)",
      path: "src/lib/sanitize.ts",
      focus: "Audit the regex patterns and HTML escaping functions for XSS bypasses or SSRF IP bypasses (e.g. IPv6, octal/hex IPs).",
    },
  ];

  for (const file of filesToAudit) {
    const fullPath = resolve(process.cwd(), file.path);
    if (!existsSync(fullPath)) {
      console.warn(`⚠️ Skipping ${file.path} (File not found)`);
      continue;
    }

    const code = readFileSync(fullPath, "utf-8");
    console.log(`🔍 [AI SCANNING] ${file.name}...`);

    const prompt = `You are a Senior Application Security & Penetration Testing Expert auditing the Yatri Cloud web application.
Audit the following source code from '${file.path}'.
Focus area: ${file.focus}

Source Code:
\`\`\`typescript
${code.slice(0, 3500)}
\`\`\`

Provide an executive security review with:
1. Threat Evaluation: Assess any remaining risks (OWASP Top 10, CWE).
2. Defense Verdict: Explain whether the current protections are effective.
3. Summary: 2-3 concise bullet points.`;

    try {
      const auditResult = await queryOllama(prompt);
      console.log("\n--- AI Security Findings ---");
      console.log(auditResult.trim());
      console.log("---------------------------------------------------------------\n");
    } catch (err) {
      console.error(`❌ Error auditing ${file.name}:`, err.message);
    }
  }

  console.log("===============================================================");
  console.log("✅ LOCAL AI SECURITY AUDIT COMPLETED BY QWEN2.5-CODER:14B!");
  console.log("===============================================================");
}

runSecurityAudit();
