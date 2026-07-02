import { useState, useEffect } from "react";
import { Bot, Save, Wand2, Cpu, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAIModel, setAIModel } from "@/lib/ai-store";
import { useToast } from "@/hooks/use-toast";

export default function AdminYatriAI() {
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [customModel, setCustomModel] = useState<string>("");
    const [isCustom, setIsCustom] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchModels = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/ai/models');
            if (!response.ok) throw new Error('Failed to fetch models');
            const data = await response.json();
            setAvailableModels(data.models || []);

            // Re-check selection after fetching models
            const savedModel = getAIModel();
            if (data.models && data.models.includes(savedModel)) {
                setSelectedModel(savedModel);
                setIsCustom(false);
            } else if (savedModel) {
                // If it's not in the list but was saved, it might be a custom one
                setSelectedModel("custom");
                setCustomModel(savedModel);
                setIsCustom(true);
            }
        } catch (err) {
            console.error('Error fetching models:', err);
            setError("Could not connect to Ollama. Make sure it's running locally.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    const handleSave = () => {
        const finalModel = isCustom ? customModel : selectedModel;

        if (!finalModel || (isCustom && !customModel.trim())) {
            toast({
                title: "Error",
                description: "Please select or enter a model name",
                variant: "destructive",
            });
            return;
        }

        setAIModel(finalModel);
        toast({
            title: "Settings Saved",
            description: `Yatri AI will now use the ${finalModel} model.`,
        });
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
                {/* Header band — distinct blue-tinted workspace panel */}
                <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                    <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div className="space-y-1.5">
                                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Yatri AI
                                </p>
                                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Yatri AI Configuration</h1>
                                <p className="text-muted-foreground">Choose the local model that powers Yatri AI.</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={fetchModels}
                            disabled={isLoading}
                            className="w-fit min-h-[44px] rounded-xl flex items-center gap-2 self-start md:self-auto"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh Models
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6">
                    <div className="border border-border rounded-2xl bg-card p-5 md:p-6 space-y-6">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-primary" />
                            <h2 className="font-display text-lg font-semibold tracking-tight">Model Selection</h2>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 text-destructive">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="model-select">Running Local Model (Detected via Ollama)</Label>
                                <Select
                                    value={selectedModel}
                                    onValueChange={(value) => {
                                        setSelectedModel(value);
                                        setIsCustom(value === "custom");
                                    }}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="model-select" className="w-full min-h-[44px] rounded-xl">
                                        <SelectValue placeholder={isLoading ? "Detecting models..." : "Select an AI model"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableModels.map(model => (
                                            <SelectItem key={model} value={model}>
                                                {model}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="custom">Custom / Other Model...</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {isCustom && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="custom-model">Custom Model Name</Label>
                                    <Input
                                        id="custom-model"
                                        placeholder="e.g. deepseek-coder"
                                        value={customModel}
                                        onChange={(e) => setCustomModel(e.target.value)}
                                        className="min-h-[44px] rounded-xl"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Ensure this model is already pulled in Ollama (<code>ollama pull {customModel || 'model-name'}</code>)
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full sm:w-auto px-8 min-h-[44px] rounded-xl bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Configuration
                            </Button>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 md:p-6 flex items-start gap-4">
                        <Wand2 className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <h3 className="font-display font-semibold tracking-tight text-primary">Live Detection</h3>
                            <p className="text-sm text-primary/80">
                                The list above shows models actually running on your local machine.
                                If you just downloaded a new model, click <strong>Refresh</strong> to see it.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
