/**
 * Production Security & Header Audit using Local Ollama (qwen2.5-coder:14b)
 * Analyzes live production response headers, SSL/TLS, and endpoint configurations
 * from https://www.yatricloud.com against OWASP Top 10 standards.
 */

const OLLAMA_URL = process.env.OLLAMA_HOST || "http://localhost:11434";
const MODEL_NAME = process.env.OLLAMA_MODEL || "qwen2.5-coder:14b";
const PROD_URL = "https://www.yatricloud.com";

async function fetchProdHeaders(path = "") {
  const target = `${PROD_URL}${path}`;
  try {
    const res = await fetch(target, { method: "HEAD", redirect: "manual" });
    const headersObj = {};
    for (const [key, value] of res.headers.entries()) {
      headersObj[key] = value;
    }
    return {
      url: target,
      status: res.status,
      headers: headersObj,
    };
  } catch (err) {
    return { url: target, error: err.message };
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
        num_predict: 900,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned status ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.response;
}

async function runProdAudit() {
  console.log("===============================================================");
  console.log(`🌐 FETCHING LIVE PRODUCTION DATA FROM ${PROD_URL}`);
  console.log(`🤖 ANALYZING WITH LOCAL OLLAMA (${MODEL_NAME})`);
  console.log("===============================================================\n");

  const endpoints = ["/", "/api/send-email", "/resources", "/login"];
  const liveResults = [];

  for (const ep of endpoints) {
    console.log(`📡 Fetching live headers for ${PROD_URL}${ep}...`);
    const data = await fetchProdHeaders(ep);
    liveResults.push(data);
  }

  console.log("\n===============================================================");
  console.log("🧠 FEEDING LIVE PRODUCTION METRICS TO QWEN2.5-CODER:14B...");
  console.log("===============================================================\n");

  const prompt = `You are a Principal Application Security Engineer auditing the live production deployment of Yatri Cloud (${PROD_URL}).

Here is the live HTTP response metadata collected directly from the production servers:
\`\`\`json
${JSON.stringify(liveResults, null, 2)}
\`\`\`

Perform a comprehensive Production Security Evaluation covering:
1. Security Header Posture: (Evaluate HSTS, X-Content-Type-Options, X-Frame-Options, Permissions-Policy, Referrer-Policy, and X-XSS-Protection).
2. Defense against Common Web Attacks: (Assess protection against Clickjacking, MIME Confusion, SSL-Stripping, and Insecure Cross-Origin Embedding).
3. Production Status Rating: Provide a rating from 1 to 10 and a concise 3-bullet summary with any suggested improvements.`;

  try {
    const aiAnalysis = await queryOllama(prompt);
    console.log("--- 📋 OLLAMA PRODUCTION SECURITY REPORT ---");
    console.log(aiAnalysis.trim());
    console.log("---------------------------------------------------------------");
  } catch (err) {
    console.error("❌ Error running Ollama production evaluation:", err.message);
  }
}

runProdAudit();
