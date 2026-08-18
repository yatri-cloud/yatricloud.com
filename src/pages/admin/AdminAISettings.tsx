import { useState, useEffect } from "react";
import {
    Sparkles,
    Key,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save,
    RefreshCw,
    Sliders,
    Zap,
    FileText,
    Shield,
    Plus,
    Trash,
    Edit3,
    Eye,
    EyeOff,
    Copy,
    Check,
    Radio,
    Clock,
    Server,
    ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    listAiKeys,
    createAiKey,
    updateAiKey,
    deleteAiKey,
    setActiveAiKey,
    toggleKeyActive,
    setAllKeysActive,
    testGeminiApi,
    fetchLiveGeminiModels,
    AVAILABLE_MODELS,
    type AiKeyRecord,
} from "@/lib/ai-config";


export default function AdminAISettings() {
    const [keys, setKeys] = useState<AiKeyRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Add / Edit Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<AiKeyRecord | null>(null);
    const [formName, setFormName] = useState("");
    const [formProvider, setFormProvider] = useState<AiKeyRecord["provider"]>("google_gemini");
    const [formApiKey, setFormApiKey] = useState("");
    const [formModel, setFormModel] = useState("gemini-3.6-flash");
    const [formTemperature, setFormTemperature] = useState(0.2);
    const [formMaxTokens, setFormMaxTokens] = useState(4096);
    const [formIsActive, setFormIsActive] = useState(false);
    const [formPurpose, setFormPurpose] = useState<AiKeyRecord["usagePurpose"]>("all");

    // Modal Live Model list & testing
    const [availableModels, setAvailableModels] = useState(AVAILABLE_MODELS);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [showKeyPassword, setShowKeyPassword] = useState(false);
    const [modalTesting, setModalTesting] = useState(false);
    const [modalTestResult, setModalTestResult] = useState<{
        success: boolean;
        latencyMs: number;
        message: string;
    } | null>(null);
    const [savingForm, setSavingForm] = useState(false);

    // Row testing state
    const [testingId, setTestingId] = useState<string | null>(null);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

    // Delete confirmation modal
    const [deleteConfirmKey, setDeleteConfirmKey] = useState<AiKeyRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const refreshKeys = async () => {
        setLoading(true);
        const data = await listAiKeys();
        setKeys(data);
        setLoading(false);
    };

    useEffect(() => {
        refreshKeys();
    }, []);

    const handleOpenAddModal = () => {
        setEditingKey(null);
        setFormName("New Gemini API Key");
        setFormProvider("google_gemini");
        setFormApiKey("");
        setFormModel("gemini-2.5-flash");
        setFormTemperature(0.2);
        setFormMaxTokens(4096);
        setFormIsActive(keys.length === 0);
        setFormPurpose("all");
        setAvailableModels(AVAILABLE_MODELS);
        setModalTestResult(null);
        setShowKeyPassword(false);
        setModalOpen(true);
    };

    const handleOpenEditModal = async (key: AiKeyRecord) => {
        setEditingKey(key);
        setFormName(key.name);
        setFormProvider(key.provider || "google_gemini");
        setFormApiKey(key.apiKey);
        setFormModel(key.model || "gemini-2.5-flash");
        setFormTemperature(key.temperature ?? 0.2);
        setFormMaxTokens(key.maxTokens ?? 4096);
        setFormIsActive(key.isActive);
        setFormPurpose(key.usagePurpose || "all");
        setModalTestResult(null);
        setShowKeyPassword(false);
        setModalOpen(true);

        if (key.apiKey) {
            const live = await fetchLiveGeminiModels(key.apiKey);
            setAvailableModels(live);
        } else {
            setAvailableModels(AVAILABLE_MODELS);
        }
    };

    const handleFetchModelsForForm = async () => {
        if (!formApiKey.trim()) {
            toast.error("Please enter the API key first.");
            return;
        }
        setFetchingModels(true);
        try {
            const live = await fetchLiveGeminiModels(formApiKey.trim());
            setAvailableModels(live);
            toast.success(`Retrieved ${live.length} available models for this key!`);
        } catch {
            toast.error("Could not fetch models for this key.");
        } finally {
            setFetchingModels(false);
        }
    };

    const handleTestKeyInModal = async () => {
        if (!formApiKey.trim()) {
            toast.error("Enter an API key to test.");
            return;
        }
        setModalTesting(true);
        setModalTestResult(null);
        try {
            const res = await testGeminiApi(formApiKey.trim(), formModel);
            setModalTestResult(res);
            if (res.success) {
                toast.success(`Key verified! Response time: ${res.latencyMs}ms`);
            } else {
                toast.error(`Verification failed: ${res.message}`);
            }
        } catch (e: any) {
            toast.error(e?.message || "Test failed");
        } finally {
            setModalTesting(false);
        }
    };

    const handleSaveModal = async () => {
        if (!formName.trim()) {
            toast.error("Please enter a descriptive name for this API key.");
            return;
        }
        if (!formApiKey.trim()) {
            toast.error("Please enter the API key.");
            return;
        }

        setSavingForm(true);
        try {
            if (editingKey) {
                // Update
                const updated = await updateAiKey(editingKey.id, {
                    name: formName.trim(),
                    provider: formProvider,
                    apiKey: formApiKey.trim(),
                    model: formModel,
                    temperature: formTemperature,
                    maxTokens: formMaxTokens,
                    isActive: formIsActive,
                    usagePurpose: formPurpose,
                    lastTestedAt: modalTestResult?.success ? new Date().toISOString() : editingKey.lastTestedAt,
                    lastLatencyMs: modalTestResult?.success ? modalTestResult.latencyMs : editingKey.lastLatencyMs,
                    lastTestStatus: modalTestResult ? (modalTestResult.success ? "success" : "error") : editingKey.lastTestStatus,
                });
                if (updated) {
                    toast.success("API key updated successfully!");
                    setModalOpen(false);
                    refreshKeys();
                } else {
                    toast.error("Failed to update API key.");
                }
            } else {
                // Create
                const created = await createAiKey({
                    name: formName.trim(),
                    provider: formProvider,
                    apiKey: formApiKey.trim(),
                    model: formModel,
                    temperature: formTemperature,
                    maxTokens: formMaxTokens,
                    isActive: formIsActive,
                    usagePurpose: formPurpose,
                    lastTestedAt: modalTestResult?.success ? new Date().toISOString() : undefined,
                    lastLatencyMs: modalTestResult?.success ? modalTestResult.latencyMs : undefined,
                    lastTestStatus: modalTestResult ? (modalTestResult.success ? "success" : "error") : undefined,
                });
                if (created) {
                    toast.success("New API key added successfully!");
                    setModalOpen(false);
                    refreshKeys();
                } else {
                    toast.error("Failed to add API key.");
                }
            }
        } catch (e: any) {
            toast.error(e?.message || "Error saving key");
        } finally {
            setSavingForm(false);
        }
    };

    const handleTestRowKey = async (k: AiKeyRecord) => {
        setTestingId(k.id);
        try {
            const res = await testGeminiApi(k.apiKey, k.model);
            await updateAiKey(k.id, {
                lastTestedAt: new Date().toISOString(),
                lastLatencyMs: res.latencyMs,
                lastTestStatus: res.success ? "success" : "error",
            });
            await refreshKeys();
            if (res.success) {
                toast.success(`Key "${k.name}" verified! Latency: ${res.latencyMs}ms`);
            } else {
                toast.error(`Key test failed: ${res.message}`);
            }
        } catch (e: any) {
            toast.error(e?.message || "Test failed");
        } finally {
            setTestingId(null);
        }
    };

    const activeKeysCount = keys.filter((k) => k.isActive).length;

    const handleToggleActive = async (k: AiKeyRecord) => {
        const ok = await toggleKeyActive(k.id);
        if (ok) {
            toast.success(k.isActive ? `"${k.name}" disabled.` : `"${k.name}" is now active in failover pool!`);
            refreshKeys();
        } else {
            toast.error("Failed to toggle key status.");
        }
    };

    const handleActivateAll = async () => {
        const ok = await setAllKeysActive(true);
        if (ok) {
            toast.success("All configured API keys are now active in the failover pool!");
            refreshKeys();
        } else {
            toast.error("Failed to activate all keys.");
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirmKey) return;
        setDeleting(true);
        try {
            const ok = await deleteAiKey(deleteConfirmKey.id);
            if (ok) {
                toast.success(`Deleted key "${deleteConfirmKey.name}".`);
                setDeleteConfirmKey(null);
                refreshKeys();
            } else {
                toast.error("Failed to delete key.");
            }
        } catch (e: any) {
            toast.error(e?.message || "Delete failed");
        } finally {
            setDeleting(false);
        }
    };

    const handleCopyMasked = (k: AiKeyRecord) => {
        navigator.clipboard.writeText(k.apiKey);
        setCopiedKeyId(k.id);
        toast.success("API key copied to clipboard!");
        setTimeout(() => setCopiedKeyId(null), 2000);
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-6xl mx-auto space-y-8">
            {/* Header band */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1.5">
                        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">AI API Keys & Models</h1>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            onClick={handleOpenAddModal}
                            className="rounded-xl h-11 px-5 gap-2 bg-primary text-primary-foreground shadow-inset-btn"
                        >
                            <Plus className="w-4 h-4" /> Add API Key
                        </Button>
                    </div>
                </div>

                {/* Pool Status Strip */}
                {keys.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${activeKeysCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
                            <span className="font-semibold text-foreground">
                                Active Failover Pool: <span className="text-primary font-bold">{activeKeysCount}</span> of {keys.length} keys active
                            </span>
                            {activeKeysCount > 1 && (
                                <Badge className="bg-success text-white border-0 text-[10px] py-0 px-2">
                                    High Availability Enabled
                                </Badge>
                            )}
                        </div>

                        {activeKeysCount < keys.length && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleActivateAll}
                                className="h-7 text-xs rounded-lg gap-1.5 self-start sm:self-auto"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Activate All Keys
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Keys Table / List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : keys.length === 0 ? (
                <Card className="rounded-2xl border border-dashed p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <Key className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-display text-lg font-bold">No API Keys Configured</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Add your Google Gemini API keys to activate high-availability ATS resume scoring and failover.
                        </p>
                    </div>
                    <Button onClick={handleOpenAddModal} className="rounded-xl gap-2">
                        <Plus className="w-4 h-4" /> Add First API Key
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Configured Keys ({keys.length})
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {keys.map((k) => {
                            const isTesting = testingId === k.id;
                            const isCopied = copiedKeyId === k.id;

                            return (
                                <Card
                                    key={k.id}
                                    className={`rounded-2xl border transition-all ${k.isActive ? "border-primary/50 bg-primary/[0.02] shadow-sm ring-1 ring-primary/20" : "border-border bg-card opacity-80"}`}
                                >
                                    <CardContent className="p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="font-bold text-base text-foreground flex items-center gap-2">
                                                    <Key className="w-4 h-4 text-primary" />
                                                    {k.name}
                                                </span>

                                                {k.isActive ? (
                                                    <Badge className="bg-success text-white border-0 text-xs px-2.5 py-0.5">
                                                        Active in Pool
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground text-xs">
                                                        Disabled
                                                    </Badge>
                                                )}

                                                <Badge variant="outline" className="font-mono text-xs bg-muted/40">
                                                    {k.model}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                                <span className="font-mono bg-muted/60 px-2 py-0.5 rounded-md border text-[11px]">
                                                    ••••••••••••{k.apiKey.slice(-6) || "••••"}
                                                </span>
                                                <button
                                                    onClick={() => handleCopyMasked(k)}
                                                    className="hover:text-foreground text-[11px] flex items-center gap-1 font-medium transition"
                                                >
                                                    {isCopied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                                                    {isCopied ? "Copied" : "Copy"}
                                                </button>

                                                {k.lastTestedAt && (
                                                    <span className="flex items-center gap-1 text-[11px]">
                                                        <Clock className="w-3 h-3" />
                                                        Tested {new Date(k.lastTestedAt).toLocaleDateString()}
                                                    </span>
                                                )}

                                                {k.lastLatencyMs && (
                                                    <Badge variant="outline" className="text-[10px] bg-success text-white border-0">
                                                        {k.lastLatencyMs} ms
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0 flex-wrap">
                                            {/* Toggle switch for multi-active pool */}
                                            <div className="flex items-center gap-2 mr-2 bg-muted/40 px-3 py-1.5 rounded-xl border">
                                                <Switch
                                                    checked={k.isActive}
                                                    onCheckedChange={() => handleToggleActive(k)}
                                                    id={`switch-${k.id}`}
                                                />
                                                <Label htmlFor={`switch-${k.id}`} className="text-xs font-semibold cursor-pointer select-none">
                                                    {k.isActive ? "Active" : "Off"}
                                                </Label>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleTestRowKey(k)}
                                                disabled={isTesting}
                                                className="rounded-xl h-9 text-xs gap-1.5"
                                            >
                                                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                                                Test
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenEditModal(k)}
                                                className="rounded-xl h-9 text-xs gap-1.5"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" /> Edit
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setDeleteConfirmKey(k)}
                                                className="h-8 w-8 rounded-full p-0 bg-destructive text-white hover:bg-destructive/90 hover:text-white"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}


            {/* ADD / EDIT KEY MODAL */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl rounded-2xl p-6 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Key className="w-5 h-5 text-primary" />
                            {editingKey ? "Update AI API Key" : "Add New AI API Key"}
                        </DialogTitle>
                        <DialogDescription>
                            Configure your model credentials and hyperparameters for the ATS engine.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Key Name / Label *</Label>
                                <Input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Primary Gemini Flash"
                                    className="rounded-xl h-10"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Provider</Label>
                                <Select
                                    value={formProvider}
                                    onValueChange={(val: any) => setFormProvider(val)}
                                >
                                    <SelectTrigger className="rounded-xl h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="google_gemini">Google Gemini (Default)</SelectItem>
                                        <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                                        <SelectItem value="custom">Custom Endpoint</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">API Key *</Label>
                            <div className="relative">
                                <Input
                                    type={showKeyPassword ? "text" : "password"}
                                    value={formApiKey}
                                    onChange={(e) => setFormApiKey(e.target.value)}
                                    placeholder="Enter your Gemini API key..."
                                    className="rounded-xl h-10 font-mono text-xs pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKeyPassword(!showKeyPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showKeyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Model</Label>
                                <button
                                    type="button"
                                    onClick={handleFetchModelsForForm}
                                    disabled={fetchingModels}
                                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                                >
                                    <RefreshCw className={`w-3 h-3 ${fetchingModels ? "animate-spin" : ""}`} />
                                    Fetch Live Models from Key
                                </button>
                            </div>
                            <Select value={formModel} onValueChange={setFormModel}>
                                <SelectTrigger className="rounded-xl h-10">
                                    <SelectValue placeholder="Select model..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableModels.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            <div className="flex items-center justify-between gap-4">
                                                <span>{m.name}</span>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {m.speed}
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-semibold">Temperature</Label>
                                    <span className="text-xs font-mono font-bold">{formTemperature}</span>
                                </div>
                                <Input
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={formTemperature}
                                    onChange={(e) => setFormTemperature(parseFloat(e.target.value) || 0.2)}
                                    className="rounded-xl h-10"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-xs font-semibold">Max Tokens</Label>
                                    <span className="text-xs font-mono font-bold">{formMaxTokens}</span>
                                </div>
                                <Input
                                    type="number"
                                    min={512}
                                    max={8192}
                                    step={256}
                                    value={formMaxTokens}
                                    onChange={(e) => setFormMaxTokens(parseInt(e.target.value) || 4096)}
                                    className="rounded-xl h-10"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/30">
                            <div>
                                <h4 className="text-xs font-semibold">Set as Active Model</h4>
                                <p className="text-[11px] text-muted-foreground">
                                    Immediately use this key for the ATS Resume Scanner & Builder.
                                </p>
                            </div>
                            <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                        </div>

                        {modalTestResult && (
                            <div className={`p-3 rounded-full border text-xs flex items-center gap-2 ${modalTestResult.success ? "bg-success text-white border-0" : "bg-destructive text-white border-0"}`}>
                                {modalTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                                <span>{modalTestResult.message}</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestKeyInModal}
                            disabled={modalTesting || !formApiKey.trim()}
                            className="rounded-xl gap-2"
                        >
                            {modalTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-500" />}
                            Test Key
                        </Button>
                        <div className="flex items-center gap-2 ml-auto">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setModalOpen(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveModal}
                                disabled={savingForm}
                                className="rounded-xl bg-primary text-primary-foreground shadow-inset-btn gap-2"
                            >
                                {savingForm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingKey ? "Update Key" : "Save Key"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION MODAL */}
            <Dialog open={Boolean(deleteConfirmKey)} onOpenChange={() => setDeleteConfirmKey(null)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Delete API Key</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteConfirmKey?.name}</strong>? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setDeleteConfirmKey(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Delete Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
