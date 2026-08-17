import { useState, useEffect } from "react";
import {
    Sparkles,
    Key,
    Cpu,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save,
    RefreshCw,
    Sliders,
    Zap,
    FileText,
    Shield,
    ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
    getAiConfig,
    saveAiConfig,
    testGeminiApi,
    fetchLiveGeminiModels,
    AVAILABLE_MODELS,
    type AiConfig,
} from "@/lib/ai-config";

export default function AdminAISettings() {
    const [config, setConfig] = useState<AiConfig>({
        apiKey: "",
        model: "gemini-2.5-flash",
        temperature: 0.2,
        maxTokens: 4096,
        enabled: true,
        systemPrompt: "",
    });
    const [models, setModels] = useState(AVAILABLE_MODELS);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        latencyMs: number;
        message: string;
        modelUsed: string;
    } | null>(null);

    useEffect(() => {
        getAiConfig().then((c) => {
            const finalModel = c.model === "gemini-1.5-flash" ? "gemini-2.5-flash" : c.model;
            setConfig({ ...c, model: finalModel });
            setLoading(false);

            if (c.apiKey) {
                fetchLiveGeminiModels(c.apiKey).then((live) => setModels(live));
            }
        });
    }, []);

    const handleRefreshModels = async () => {
        if (!config.apiKey) {
            toast.error("Please enter an API key first.");
            return;
        }
        setLoadingModels(true);
        try {
            const live = await fetchLiveGeminiModels(config.apiKey);
            setModels(live);
            toast.success(`Loaded ${live.length} available models from Gemini!`);
        } catch {
            toast.error("Could not fetch models from key.");
        } finally {
            setLoadingModels(false);
        }
    };


    const handleSave = async () => {
        setSaving(true);
        try {
            const ok = await saveAiConfig(config);
            if (ok) {
                toast.success("AI model configuration saved successfully!");
            } else {
                toast.error("Failed to save to Supabase (saved locally).");
            }
        } catch (e: any) {
            toast.error(e?.message || "Error saving configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const result = await testGeminiApi(config.apiKey, config.model);
            setTestResult(result);
            if (result.success) {
                toast.success(`Connection verified! Latency: ${result.latencyMs}ms`);
            } else {
                toast.error(`Connection failed: ${result.message}`);
            }
        } catch (e: any) {
            toast.error(e?.message || "Connection test failed");
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-5xl mx-auto space-y-8">
            {/* Header band */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1.5">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                            <Sparkles className="h-4 w-4" /> AI & Large Language Models
                        </p>
                        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Gemini AI Configuration</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage Gemini API credentials, choose AI models for ATS resume evaluation, and verify live connectivity.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testing}
                            className="rounded-xl h-11 px-4 gap-2"
                        >
                            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-500" />}
                            Test Connection
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-xl h-11 px-5 gap-2 bg-primary text-primary-foreground shadow-inset-btn"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Settings
                        </Button>
                    </div>
                </div>
            </div>

            {/* Test Result Banner */}
            {testResult && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${testResult.success ? "bg-success/10 border-success/30 text-foreground" : "bg-destructive/10 border-destructive/30 text-foreground"}`}>
                    {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                                {testResult.success ? "Gemini API Ready" : "Connection Test Failed"}
                            </span>
                            {testResult.success && (
                                <Badge className="bg-success/20 text-success border-0 text-xs">
                                    {testResult.latencyMs} ms
                                </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                                {testResult.modelUsed}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{testResult.message}</p>
                    </div>
                </div>
            )}

            {/* Settings Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Settings (Left 2 cols) */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-2xl border border-border bg-card shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Key className="w-4 h-4 text-primary" /> API Key Configuration
                            </CardTitle>
                            <CardDescription>
                                Secure Google Gemini API key used across ATS Resume analyzer, course generators, and automation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="apiKey" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Google Gemini API Key
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        placeholder="AQ.Ab8RN6KTK4s..."
                                        value={config.apiKey}
                                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                        className="h-11 rounded-xl font-mono text-sm pr-10"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Stored securely in Supabase <code>site_settings</code> and encrypted in transit.
                                </p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="model" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Active Model Selection
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={handleRefreshModels}
                                        disabled={loadingModels}
                                        className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${loadingModels ? "animate-spin" : ""}`} />
                                        Fetch Models from Key
                                    </button>
                                </div>
                                <Select
                                    value={config.model}
                                    onValueChange={(val) => setConfig({ ...config, model: val })}
                                >
                                    <SelectTrigger id="model" className="h-11 rounded-xl">
                                        <SelectValue placeholder="Select model..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {models.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="font-medium">{m.name}</span>
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        {m.speed}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-border bg-card shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-primary" /> Model Hyperparameters
                            </CardTitle>
                            <CardDescription>
                                Tune creativity, determinism, and maximum output length for ATS evaluation prompts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temperature</Label>
                                        <span className="text-xs font-bold font-mono">{config.temperature}</span>
                                    </div>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={config.temperature}
                                        onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) || 0.2 })}
                                        className="h-10 rounded-xl"
                                    />
                                    <p className="text-[11px] text-muted-foreground">Lower (0.1 - 0.3) is recommended for strict ATS analysis.</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Output Tokens</Label>
                                        <span className="text-xs font-bold font-mono">{config.maxTokens}</span>
                                    </div>
                                    <Input
                                        type="number"
                                        min={512}
                                        max={8192}
                                        step={256}
                                        value={config.maxTokens}
                                        onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 4096 })}
                                        className="h-10 rounded-xl"
                                    />
                                    <p className="text-[11px] text-muted-foreground">Ensures complete detailed JSON analysis with rewritten resumes.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Info Cards */}
                <div className="space-y-6">
                    <Card className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" /> Supported AI Features
                        </h3>
                        <div className="space-y-2.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2 text-foreground font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                ATS Resume Scanner & Score (0-100)
                            </div>
                            <p className="pl-3.5 text-[11px]">
                                Scans candidate resumes against target job descriptions and extracts missing hard skills.
                            </p>

                            <div className="flex items-center gap-2 text-foreground font-medium pt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                Action-Verb & Metric Rewriter
                            </div>
                            <p className="pl-3.5 text-[11px]">
                                Converts weak bullet points into high-impact XYZ formula achievements.
                            </p>

                            <div className="flex items-center gap-2 text-foreground font-medium pt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                Full ATS Resume Markdown Builder
                            </div>
                            <p className="pl-3.5 text-[11px]">
                                Produces cleanly formatted ATS-safe markdown ready for instant export.
                            </p>
                        </div>
                    </Card>

                    <Card className="rounded-2xl border border-border bg-muted/40 p-5 space-y-3 shadow-none">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Quick Status</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">Engine</span>
                                <span className="font-semibold">Google Gemini REST API</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">Active Model</span>
                                <span className="font-mono font-semibold">{config.model}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Last Tested</span>
                                <span className="text-muted-foreground">{config.lastTestedAt ? new Date(config.lastTestedAt).toLocaleTimeString() : "Not tested yet"}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
