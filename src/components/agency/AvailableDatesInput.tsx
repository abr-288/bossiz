import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export function AvailableDatesInput({ dates, onChange, label = "Dates de disponibilité" }: { dates: string[]; onChange: (dates: string[]) => void; label?: string }) {
  const [date, setDate] = useState("");
  const addDate = () => {
    if (!date || dates.includes(date)) return;
    onChange([...dates, date].sort());
    setDate("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} />
        <Button type="button" variant="outline" onClick={addDate} disabled={!date}>Ajouter</Button>
      </div>
      {dates.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Dates ajoutées">
          {dates.map((item) => (
            <span key={item} className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm">
              {new Date(`${item}T12:00:00`).toLocaleDateString("fr-FR")}
              <button type="button" className="rounded-full p-0.5 hover:bg-background" aria-label={`Retirer la date ${item}`} onClick={() => onChange(dates.filter((dateValue) => dateValue !== item))}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      ) : <p className="text-xs text-muted-foreground">Aucune date précise ajoutée. Le service reste ouvert selon ses disponibilités habituelles.</p>}
    </div>
  );
}
