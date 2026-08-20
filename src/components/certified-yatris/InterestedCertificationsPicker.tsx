import { useState, KeyboardEvent } from "react";
import { Award, Plus, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const POPULAR_PROVIDERS = [
  { id: "aws", label: "Amazon AWS", code: "AWS" },
  { id: "azure", label: "Microsoft Azure", code: "Azure" },
  { id: "gcp", label: "Google Cloud (GCP)", code: "GCP" },
  { id: "kubernetes", label: "Kubernetes / CNCF", code: "K8s" },
  { id: "github", label: "GitHub", code: "GitHub" },
  { id: "hashicorp", label: "HashiCorp / Terraform", code: "Terraform" },
  { id: "linux", label: "Linux Foundation", code: "Linux" },
  { id: "comptia", label: "CompTIA", code: "CompTIA" },
  { id: "cisco", label: "Cisco", code: "Cisco" },
  { id: "salesforce", label: "Salesforce", code: "Salesforce" },
  { id: "servicenow", label: "ServiceNow", code: "ServiceNow" },
  { id: "openai", label: "OpenAI / Generative AI", code: "AI / ML" },
  { id: "oracle", label: "Oracle", code: "Oracle" },
  { id: "docker", label: "Docker", code: "Docker" },
  { id: "redis", label: "Redis", code: "Redis" },
];

interface InterestedCertificationsPickerProps {
  value: string[];
  onChange: (items: string[]) => void;
  label?: string;
  description?: string;
  required?: boolean;
}

export const InterestedCertificationsPicker = ({
  value = [],
  onChange,
  label = "Which certifications/providers are you interested in?",
  description = "Select from top providers and/or type custom certifications (e.g. CKA, AWS SAA, AZ-104).",
  required = false,
}: InterestedCertificationsPickerProps) => {
  const [customInput, setCustomInput] = useState("");
  const [showAllProviders, setShowAllProviders] = useState(false);

  const handleToggle = (providerLabel: string) => {
    if (value.includes(providerLabel)) {
      onChange(value.filter((v) => v !== providerLabel));
    } else {
      onChange([...value, providerLabel]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!value.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...value, trimmed]);
    }
    setCustomInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter((v) => v !== itemToRemove));
  };

  const displayedProviders = showAllProviders
    ? POPULAR_PROVIDERS
    : POPULAR_PROVIDERS.slice(0, 8);

  return (
    <div className="space-y-3">
      <div>
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Award className="w-4 h-4 text-primary" />
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 border border-border/60 rounded-xl min-h-[38px] items-center">
          {value.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20 text-xs px-2 py-0.5 flex items-center gap-1.5 font-medium transition-all"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="rounded-full hover:bg-primary/30 p-0.5 transition-colors"
                title={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Quick Select from Provider Dropdown */}
      <div>
        <Select
          onValueChange={(val) => {
            if (val && !value.includes(val)) {
              onChange([...value, val]);
            }
          }}
        >
          <SelectTrigger className="w-full text-xs h-9 bg-background">
            <SelectValue placeholder="⚡ Choose from Provider dropdown..." />
          </SelectTrigger>
          <SelectContent className="max-h-[220px]">
            {POPULAR_PROVIDERS.map((p) => {
              const isSelected = value.includes(p.label);
              return (
                <SelectItem key={p.id} value={p.label} className="text-xs">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span>{p.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Checkboxes Grid */}
      <div className="grid grid-cols-2 gap-1.5 bg-card/60 border border-border/60 p-2.5 rounded-xl">
        {displayedProviders.map((p) => {
          const isChecked = value.includes(p.label);
          return (
            <label
              key={p.id}
              onClick={(e) => {
                e.preventDefault();
                handleToggle(p.label);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                isChecked
                  ? "bg-primary/10 border-primary/40 text-foreground font-medium"
                  : "bg-background/80 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Checkbox
                checked={isChecked}
                className="w-3.5 h-3.5 pointer-events-none"
              />
              <span className="truncate">{p.label}</span>
            </label>
          );
        })}
      </div>

      {POPULAR_PROVIDERS.length > 8 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAllProviders(!showAllProviders)}
            className="text-[11px] text-primary hover:underline font-medium"
          >
            {showAllProviders ? "Show less providers" : `+ Show ${POPULAR_PROVIDERS.length - 8} more providers`}
          </button>
        </div>
      )}

      {/* Custom input for typing specific exams or others */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type other/custom (e.g. CKA, AWS SAA, CISSP)..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-xs h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCustom}
          disabled={!customInput.trim()}
          className="h-9 px-3 shrink-0 text-xs gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
};
