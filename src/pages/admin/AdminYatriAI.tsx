import { useState, useEffect } from "react";
import { Bot, Save, Sparkles, Cpu, RefreshCw, AlertCircle } from "lucide-react";
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
        <div className="p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold">Yatri AI Configuration</h1>
                        <p className="text-muted-foreground">Configure the intelligence behind Yatri AI</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchModels}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Models
                </Button>
            </div>

            <div className="grid gap-8">
                <div className="bg-card border rounded-2xl p-8 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">Model Selection</h2>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 text-destructive">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
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
                                <SelectTrigger id="model-select" className="w-full h-12">
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
                                    className="h-12"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Ensure this model is already pulled in Ollama (<code>ollama pull {customModel || 'model-name'}</code>)
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-8 h-12 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Configuration
                        </Button>
                    </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
                    <Sparkles className="w-6 h-6 text-primary mt-1" />
                    <div className="space-y-1">
                        <h3 className="font-semibold text-primary">Live Detection</h3>
                        <p className="text-sm text-primary/80">
                            The list above shows models actually running on your local machine.
                            If you just downloaded a new model, click <strong>Refresh</strong> to see it.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
