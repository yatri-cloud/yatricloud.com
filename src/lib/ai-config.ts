import { supabase } from "@/lib/supabase";

export interface AiKeyRecord {
    id: string;
    name: string;
    provider: "google_gemini" | "openai" | "anthropic" | "custom";
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    isActive: boolean;
    usagePurpose: "ats_resume" | "general" | "all";
    lastTestedAt?: string;
    lastLatencyMs?: number;
    lastTestStatus?: "success" | "error";
    createdAt: string;
    updatedAt: string;
}

export interface AiConfig {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    enabled: boolean;
    systemPrompt?: string;
    lastTestedAt?: string;
}

export interface AtsSectionScore {
    name: string;
    score: number;
    feedback: string;
}

export interface AtsBulletImprovement {
    original: string;
    improved: string;
    reason: string;
}

export interface AtsAnalysisResult {
    ats_score: number;
    overall_verdict: string;
    summary: string;
    strengths: string[];
    critical_issues: string[];
    matching_keywords: string[];
    missing_keywords: string[];
    section_scores: {
        contact_info: number;
        summary: number;
        experience: number;
        skills: number;
        education: number;
        formatting: number;
    };
    bullet_point_improvements: AtsBulletImprovement[];
    optimized_resume_markdown?: string;
    action_plan: string[];
}

const DEFAULT_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
const DEFAULT_MODEL = "gemini-2.5-flash";
const LOCAL_STORAGE_KEY = "yc_gemini_ai_config";
const LOCAL_STORAGE_KEYS_LIST = "yc_ai_keys_list";

export const AVAILABLE_MODELS = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Fast, Accurate & Recommended)", speed: "Blazing", maxOutput: 8192 },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Deep Reasoning & Executive Analysis)", speed: "Standard", maxOutput: 8192 },
    { id: "gemini-flash-latest", name: "Gemini Flash (Latest Stable)", speed: "Ultra Fast", maxOutput: 8192 },
    { id: "gemini-pro-latest", name: "Gemini Pro (Latest Stable)", speed: "High Intelligence", maxOutput: 8192 },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite (Lightweight & Instant)", speed: "Instant", maxOutput: 8192 },
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", speed: "Next-Gen", maxOutput: 8192 },
];

/**
 * Dynamically list active models for the given API key.
 */
export async function fetchLiveGeminiModels(apiKey: string): Promise<Array<{ id: string; name: string; speed: string; maxOutput: number }>> {
    if (!apiKey) return AVAILABLE_MODELS;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`);
        if (!res.ok) return AVAILABLE_MODELS;
        const data = await res.json();
        if (Array.isArray(data?.models)) {
            const list = data.models
                .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
                .map((m: any) => {
                    const id = m.name.replace("models/", "");
                    return {
                        id,
                        name: m.displayName || id,
                        speed: id.includes("flash") ? "Ultra Fast" : "Standard",
                        maxOutput: m.outputTokenLimit || 8192,
                    };
                });
            return list.length > 0 ? list : AVAILABLE_MODELS;
        }
    } catch {
        // fallback
    }
    return AVAILABLE_MODELS;
}

/**
 * CRUD: List all configured AI API keys from site_settings.
 */
export async function listAiKeys(): Promise<AiKeyRecord[]> {
    try {
        const { data, error } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "ai_api_keys")
            .maybeSingle();

        if (!error && data?.value && Array.isArray(data.value)) {
            const list = data.value as AiKeyRecord[];
            localStorage.setItem(LOCAL_STORAGE_KEYS_LIST, JSON.stringify(list));
            return list;
        }
    } catch (e) {
        console.warn("[ai-config] Could not fetch keys list from Supabase:", e);
    }

    // Check localStorage
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS_LIST);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {
        // ignore
    }

    // Migrate from legacy single gemini_ai setting if keys list is empty
    const legacyConfig = await getAiConfig();
    if (legacyConfig.apiKey) {
        const migratedKey: AiKeyRecord = {
            id: "default-key-1",
            name: "Primary Gemini Key",
            provider: "google_gemini",
            apiKey: legacyConfig.apiKey,
            model: legacyConfig.model || DEFAULT_MODEL,
            temperature: legacyConfig.temperature ?? 0.2,
            maxTokens: legacyConfig.maxTokens ?? 4096,
            isActive: true,
            usagePurpose: "all",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastTestedAt: legacyConfig.lastTestedAt,
        };
        await saveAiKeysList([migratedKey]);
        return [migratedKey];
    }

    return [];
}

/**
 * Save keys list to Supabase and cache.
 */
async function saveAiKeysList(keys: AiKeyRecord[]): Promise<boolean> {
    localStorage.setItem(LOCAL_STORAGE_KEYS_LIST, JSON.stringify(keys));

    // Also sync active key to gemini_ai key for backwards compatibility
    const activeKey = keys.find((k) => k.isActive) || keys[0];
    if (activeKey) {
        saveAiConfig({
            apiKey: activeKey.apiKey,
            model: activeKey.model,
            temperature: activeKey.temperature,
            maxTokens: activeKey.maxTokens,
            enabled: activeKey.isActive,
            lastTestedAt: activeKey.lastTestedAt,
        }).catch(() => {});
    }

    try {
        const { error } = await supabase
            .from("site_settings")
            .upsert({
                key: "ai_api_keys",
                value: keys,
                updated_at: new Date().toISOString(),
            }, { onConflict: "key" });

        return !error;
    } catch {
        return false;
    }
}

/**
 * List all active keys in the failover/load-balancing pool.
 */
export async function listActiveAiKeys(): Promise<AiKeyRecord[]> {
    const all = await listAiKeys();
    const active = all.filter((k) => k.isActive && k.apiKey && k.apiKey.trim().length > 0);
    if (active.length > 0) return active;
    if (all.length > 0 && all[0].apiKey) return [all[0]];

    const legacy = await getAiConfig();
    if (legacy.apiKey) {
        return [{
            id: "default-legacy",
            name: "Primary Gemini Key",
            provider: "google_gemini",
            apiKey: legacy.apiKey,
            model: legacy.model || DEFAULT_MODEL,
            temperature: legacy.temperature ?? 0.2,
            maxTokens: legacy.maxTokens ?? 4096,
            isActive: true,
            usagePurpose: "all",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }];
    }
    return [];
}

/**
 * Toggle active status for a specific key (allowing multiple active keys).
 */
export async function toggleKeyActive(id: string): Promise<boolean> {
    const list = await listAiKeys();
    const idx = list.findIndex((k) => k.id === id);
    if (idx === -1) return false;
    list[idx].isActive = !list[idx].isActive;
    return saveAiKeysList(list);
}

/**
 * Set all keys active or inactive in bulk.
 */
export async function setAllKeysActive(active: boolean): Promise<boolean> {
    const list = await listAiKeys();
    const updated = list.map((k) => ({ ...k, isActive: active }));
    return saveAiKeysList(updated);
}

/**
 * CRUD: Create / Add a new API Key record (multiple keys can be active simultaneously).
 */
export async function createAiKey(data: Omit<AiKeyRecord, "id" | "createdAt" | "updatedAt">): Promise<AiKeyRecord> {
    const list = await listAiKeys();
    const id = "key_" + Math.random().toString(36).slice(2, 10);
    const now = new Date().toISOString();

    const newKey: AiKeyRecord = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
    };

    // If this is the first key, make sure it's active
    if (list.length === 0) {
        newKey.isActive = true;
    }

    const updatedList = [...list, newKey];
    await saveAiKeysList(updatedList);
    return newKey;
}

/**
 * CRUD: Update an existing API Key record without disabling others.
 */
export async function updateAiKey(id: string, patch: Partial<AiKeyRecord>): Promise<AiKeyRecord | null> {
    const list = await listAiKeys();
    const idx = list.findIndex((k) => k.id === id);
    if (idx === -1) return null;

    const updatedKey: AiKeyRecord = {
        ...list[idx],
        ...patch,
        id,
        updatedAt: new Date().toISOString(),
    };
    const updatedList = [...list];
    updatedList[idx] = updatedKey;

    await saveAiKeysList(updatedList);
    return updatedKey;
}

/**
 * CRUD: Delete an API Key record.
 */
export async function deleteAiKey(id: string): Promise<boolean> {
    const list = await listAiKeys();
    const filtered = list.filter((k) => k.id !== id);
    if (filtered.length > 0 && !filtered.some((k) => k.isActive)) {
        filtered[0].isActive = true;
    }
    return saveAiKeysList(filtered);
}

/**
 * CRUD: Set a key active.
 */
export async function setActiveAiKey(id: string): Promise<boolean> {
    return (await updateAiKey(id, { isActive: true })) !== null;
}


/**
 * Retrieve current active AI configuration.
 */
export async function getAiConfig(): Promise<AiConfig> {
    try {
        const { data, error } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "gemini_ai")
            .maybeSingle();

        if (!error && data?.value && typeof data.value === "object") {
            const val = data.value as any;
            const config: AiConfig = {
                apiKey: val.api_key || DEFAULT_API_KEY,
                model: val.model || DEFAULT_MODEL,
                temperature: typeof val.temperature === "number" ? val.temperature : 0.2,
                maxTokens: typeof val.max_tokens === "number" ? val.max_tokens : 4096,
                enabled: val.enabled !== false,
                systemPrompt: val.system_prompt || "",
                lastTestedAt: val.last_tested_at || undefined,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
            return config;
        }
    } catch (e) {
        console.warn("[ai-config] Could not fetch from Supabase:", e);
    }

    // Fallback to local storage
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            return { ...JSON.parse(saved), apiKey: JSON.parse(saved).apiKey || DEFAULT_API_KEY };
        }
    } catch {
        // ignore
    }

    return {
        apiKey: DEFAULT_API_KEY,
        model: DEFAULT_MODEL,
        temperature: 0.2,
        maxTokens: 4096,
        enabled: true,
    };
}

/**
 * Save AI configuration to Supabase site_settings & local storage.
 */
export async function saveAiConfig(config: Partial<AiConfig>): Promise<boolean> {
    const current = await getAiConfig();
    const updated: AiConfig = {
        ...current,
        ...config,
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    try {
        const { error } = await supabase
            .from("site_settings")
            .upsert({
                key: "gemini_ai",
                value: {
                    api_key: updated.apiKey,
                    model: updated.model,
                    temperature: updated.temperature,
                    max_tokens: updated.maxTokens,
                    enabled: updated.enabled,
                    system_prompt: updated.systemPrompt,
                    last_tested_at: updated.lastTestedAt,
                },
                updated_at: new Date().toISOString(),
            }, { onConflict: "key" });

        if (error) {
            console.error("[ai-config] Error saving to Supabase:", error.message);
        }
        return !error;
    } catch (e: any) {
        console.error("[ai-config] Exception saving to Supabase:", e?.message);
        return false;
    }
}

/**
 * Test a specific Gemini API connection.
 */
export async function testGeminiApi(
    customKey?: string,
    customModel?: string
): Promise<{ success: boolean; latencyMs: number; message: string; modelUsed: string }> {
    const config = await getAiConfig();
    const apiKey = (customKey || config.apiKey || DEFAULT_API_KEY).trim();
    const model = (customModel || config.model || DEFAULT_MODEL).trim();

    if (!apiKey) {
        return { success: false, latencyMs: 0, message: "API key is missing", modelUsed: model };
    }

    const startTime = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: "Respond strictly with the single word: OK" }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 10
                }
            })
        });

        const latencyMs = Date.now() - startTime;
        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
            return { success: false, latencyMs, message: errorMsg, modelUsed: model };
        }

        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "OK";

        return {
            success: true,
            latencyMs,
            message: `Connection successful! Model response: "${candidateText}" in ${latencyMs}ms`,
            modelUsed: model
        };
    } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        return {
            success: false,
            latencyMs,
            message: err.message || "Network request failed",
            modelUsed: model
        };
    }
}

/**
 * Call Gemini API with automatic pool load-balancing and failover across active keys.
 */
export async function callGeminiApi(
    prompt: string,
    options?: {
        systemInstruction?: string;
        temperature?: number;
        maxTokens?: number;
        jsonMode?: boolean;
    }
): Promise<string> {
    const activeKeys = await listActiveAiKeys();
    if (activeKeys.length === 0) {
        throw new Error("No active Gemini API keys configured in Admin Settings.");
    }

    let lastError: any = null;

    // Try active keys in sequence for automatic failover
    for (let i = 0; i < activeKeys.length; i++) {
        const keyRecord = activeKeys[i];
        const apiKey = keyRecord.apiKey.trim();
        const model = (keyRecord.model || DEFAULT_MODEL).trim();

        if (!apiKey) continue;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const bodyPayload: any = {
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: options?.temperature ?? keyRecord.temperature ?? 0.2,
                maxOutputTokens: options?.maxTokens ?? keyRecord.maxTokens ?? 8192,
            }
        };

        if (options?.jsonMode) {
            bodyPayload.generationConfig.responseMimeType = "application/json";
        }

        if (options?.systemInstruction) {
            bodyPayload.systemInstruction = {
                parts: [{ text: options.systemInstruction }]
            };
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                const msg = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                console.warn(`[AI Failover] Key "${keyRecord.name}" (${model}) failed: ${msg}. Switching to next key in pool...`);
                lastError = new Error(`[${keyRecord.name}] ${msg}`);
                continue; // Try next active key in pool
            }

            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                console.warn(`[AI Failover] Key "${keyRecord.name}" returned no text. Switching to next key...`);
                lastError = new Error(`[${keyRecord.name}] Empty response generated.`);
                continue;
            }

            return text;
        } catch (err: any) {
            console.warn(`[AI Failover] Network exception with key "${keyRecord.name}":`, err.message);
            lastError = err;
        }
    }

    throw lastError || new Error("All active Gemini API keys in the pool failed.");
}


/**
 * Comprehensive ATS Resume Analysis using Gemini AI.
 */
export async function analyzeResumeWithGemini(
    resumeText: string,
    jobDescription?: string
): Promise<AtsAnalysisResult> {
    const systemPrompt = `You are an elite Chief Talent Officer, Executive Resume Architect, and Applicant Tracking System (ATS) optimization specialist.
Your goal is to thoroughly analyze the candidate's input and REWRITE / ELEVATE their resume into a high-scoring, recruiter-ready masterpiece that targets 95+ on ATS systems (Workday, Greenhouse, Taleo, Lever) and aligns tightly with ${jobDescription ? 'the target Job Description' : 'modern senior engineering/industry standards'}.

TRANSFORMATION & REWRITING RULES:
1. REWRITE EVERY BULLET POINT: Do NOT copy raw or weak bullet points. Transform them using the Google XYZ Formula: "Accomplished [X], as measured by [Y], by doing [Z]". Begin each bullet with high-impact action verbs (Architected, Engineered, Spearheaded, Accelerated, Scaled, Automated, Optimized).
2. KEYWORD ENRICHMENT: Seamlessly integrate relevant technical keywords and industry standards matching the target role into the skills, experience bullets, and project descriptions.
3. EXECUTIVE SUMMARY: Craft a compelling 2-3 line summary highlighting the candidate's core expertise, years of experience, and quantifiable value.
4. ONE-PAGE ATS FORMAT: Structure "optimized_resume_markdown" cleanly using standard markdown headings (# for Name, ## for Sections, ### for Roles/Projects, - for Bullets).

Return a strictly valid JSON object matching this schema:
{
  "ats_score": number between 0 and 100,
  "overall_verdict": "Exceptional ATS Match (85-100)" | "Good ATS Match (70-84)" | "Needs Improvement (50-69)" | "Critical ATS Issues (<50)",
  "summary": "2-3 concise sentences summarizing the candidate's ATS viability",
  "strengths": ["List of 3-5 strong ATS points"],
  "critical_issues": ["List of 2-5 issues in original resume that were fixed"],
  "matching_keywords": ["Keywords and technical hard skills found"],
  "missing_keywords": ["Crucial high-demand keywords or skills missing from the original resume based on the role/JD"],
  "section_scores": {
    "contact_info": number (0-100),
    "summary": number (0-100),
    "experience": number (0-100),
    "skills": number (0-100),
    "education": number (0-100),
    "formatting": number (0-100)
  },
  "bullet_point_improvements": [
    {
      "original": "Original weak bullet point from user's input",
      "improved": "High-impact XYZ rewrite (Action Verb + Quantifiable Context + Measurable Metric)",
      "reason": "Why this improved version scores dramatically higher on ATS algorithms"
    }
  ],
  "optimized_resume_markdown": "Full rewritten and upgraded markdown resume with executive summary, categorized technical skills, rewritten XYZ experience bullets, key projects, education, and certifications. Must be fully fleshed out, professional, and ready to submit to recruiters.",
  "action_plan": ["Priority step 1 to maximize interview calls", "Priority step 2", "Priority step 3"]
}`;


    const userPrompt = `RESUME CONTENT TO EVALUATE:
\`\`\`
${resumeText.trim()}
\`\`\`

${jobDescription ? `TARGET JOB DESCRIPTION / ROLE:
\`\`\`
${jobDescription.trim()}
\`\`\`
` : 'NO SPECIFIC JOB DESCRIPTION PROVIDED. Analyze against general modern industry tech standards.'}

Please produce the JSON response now:`;

    const rawResponse = await callGeminiApi(userPrompt, {
        systemInstruction: systemPrompt,
        jsonMode: true,
        temperature: 0.1,
        maxTokens: 8192
    });

    try {
        const parsed = JSON.parse(rawResponse);
        return {
            ats_score: typeof parsed.ats_score === "number" ? parsed.ats_score : 70,
            overall_verdict: parsed.overall_verdict || "Good Match",
            summary: parsed.summary || "",
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            critical_issues: Array.isArray(parsed.critical_issues) ? parsed.critical_issues : [],
            matching_keywords: Array.isArray(parsed.matching_keywords) ? parsed.matching_keywords : [],
            missing_keywords: Array.isArray(parsed.missing_keywords) ? parsed.missing_keywords : [],
            section_scores: parsed.section_scores || {
                contact_info: 85,
                summary: 70,
                experience: 75,
                skills: 80,
                education: 90,
                formatting: 85,
            },
            bullet_point_improvements: Array.isArray(parsed.bullet_point_improvements)
                ? parsed.bullet_point_improvements
                : [],
            optimized_resume_markdown: parsed.optimized_resume_markdown || "",
            action_plan: Array.isArray(parsed.action_plan) ? parsed.action_plan : [],
        };
    } catch (err: any) {
        console.error("[ai-config] Failed to parse JSON response:", rawResponse);
        throw new Error("Failed to parse ATS response from Gemini AI. Please try again.");
    }
}
