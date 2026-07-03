import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrencies, type CurrencyOption } from "@/lib/currency";

interface CurrencySelectProps {
  /** Selected currency code (defaults to INR). */
  value: string;
  /** Fires with the new code and its full option. */
  onChange: (code: string, option: CurrencyOption) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Small "Pay in" currency picker. Defaults to INR and lists every supported
 * currency. Brand styled, 44px tall. Pure presentation: value plus onChange.
 */
export function CurrencySelect({ value, onChange, disabled, className }: CurrencySelectProps) {
  const [options, setOptions] = useState<CurrencyOption[]>([]);

  useEffect(() => {
    let active = true;
    getCurrencies().then((list) => {
      if (active) setOptions(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (code: string) => {
    const option = options.find((o) => o.code === code);
    if (option) onChange(code, option);
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Pay in</span>
      <Select value={value} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className="h-11 w-[150px] rounded-lg border-border focus:ring-primary/40">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.code} value={o.code}>
              {o.code} {o.symbol}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
