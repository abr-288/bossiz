import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIOD_LABELS, type Period, type PeriodPreset, isoDay, periodFromPreset } from "@/lib/adminFinance";

interface PeriodPickerProps {
  value: Period;
  onChange: (period: Period) => void;
  presets: Exclude<PeriodPreset, "custom">[];
}

// Période prédéfinie ou dates libres (du / au).
export function PeriodPicker({ value, onChange, presets }: PeriodPickerProps) {
  const selectPreset = (preset: string) => {
    if (preset === "custom") {
      const today = isoDay(new Date());
      onChange({ preset: "custom", from: value.from || today, to: value.to || today });
    } else {
      onChange(periodFromPreset(preset as Exclude<PeriodPreset, "custom">));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value.preset} onValueChange={selectPreset}>
        <SelectTrigger className="w-[200px]" aria-label="Période">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[...presets, "custom" as const].map((p) => (
            <SelectItem key={p} value={p}>
              {PERIOD_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value.preset === "custom" && (
        <>
          <Input
            type="date"
            className="w-[160px]"
            aria-label="Du"
            value={value.from}
            max={value.to}
            onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })}
          />
          <span className="text-sm text-muted-foreground">au</span>
          <Input
            type="date"
            className="w-[160px]"
            aria-label="Au"
            value={value.to}
            min={value.from}
            onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })}
          />
        </>
      )}
    </div>
  );
}
