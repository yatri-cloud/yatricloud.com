import { supabase } from "@/lib/supabase";

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
const DEFAULT_MODEL = "gemini-1.5-flash";
const LOCAL_STORAGE_KEY = "yc_gemini_ai_config";


export const AVAILABLE_MODELS = [
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fast & Balanced - Recommended)", speed: "Ultra Fast", maxOutput: 8192 },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Deep Reasoning & Analysis)", speed: "Standard", maxOutput: 8192 },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Next-Gen High Performance)", speed: "Blazing", maxOutput: 8192 },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", speed: "Ultra Fast", maxOutput: 8192 },
];

/**
 * Retrieve current AI configuration from Supabase site_settings with fallback to localStorage / defaults.
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
    } catch (e) {
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
 * Test the Gemini API connection.
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
        // Save test timestamp
        await saveAiConfig({ lastTestedAt: new Date().toISOString() });

        return {
            success: true,
            latencyMs,
            message: `Connection successful! Response: "${candidateText}" in ${latencyMs}ms`,
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
 * Call Gemini API with arbitrary prompt and generation configuration.
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
    const config = await getAiConfig();
    const apiKey = (config.apiKey || DEFAULT_API_KEY).trim();
    const model = (config.model || DEFAULT_MODEL).trim();

    if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
    }

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
            temperature: options?.temperature ?? config.temperature ?? 0.2,
            maxOutputTokens: options?.maxTokens ?? config.maxTokens ?? 4096,
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

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
    });

    const data = await response.json();

    if (!response.ok) {
        const msg = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(msg);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error("No response generated by Gemini model.");
    }

    return text;
}

/**
 * Comprehensive ATS Resume Analysis using Gemini AI.
 */
export async function analyzeResumeWithGemini(
    resumeText: string,
    jobDescription?: string
): Promise<AtsAnalysisResult> {
    const systemPrompt = `You are a Senior Executive Recruiter and elite Applicant Tracking System (ATS) algorithm specialist.
Analyze the provided resume against modern ATS scanning standards (Workday, Greenhouse, Taleo, Lever) and ${jobDescription ? 'the provided target Job Description' : 'standard industry hiring benchmarks'}.

Evaluate the resume meticulously and return a strictly valid JSON object matching this schema:
{
  "ats_score": number between 0 and 100,
  "overall_verdict": "Exceptional ATS Match (85-100)" | "Good ATS Match (70-84)" | "Needs Improvement (50-69)" | "Critical ATS Issues (<50)",
  "summary": "2-3 concise sentences summarizing the candidate's ATS viability",
  "strengths": ["List of 3-5 strong ATS points (e.g. strong metrics, clear job titles)"],
  "critical_issues": ["List of 2-5 issues that will hurt ATS parsing or human review"],
  "matching_keywords": ["Keywords and technical hard skills found in the resume"],
  "missing_keywords": ["Crucial high-demand keywords or skills missing from the resume based on the role/JD"],
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
      "original": "Weak/vague bullet point from resume",
      "improved": "Action-oriented, quantified rewrite (Action Verb + Context + Metric)",
      "reason": "Why this improved version scores higher on ATS"
    }
  ],
  "optimized_resume_markdown": "Full clean ATS-friendly markdown resume rewritten with strong bullet points and clean structure",
  "action_plan": ["Step 1 to boost score", "Step 2 to boost score", "Step 3 to boost score"]
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
