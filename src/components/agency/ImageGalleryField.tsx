import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

interface ImageGalleryFieldProps {
  label: string;
  hint?: string;
  folder: string;
  value: string[];
  onChange: (images: string[]) => void;
  max: number;
}

// Galerie de photos : la première sert de photo principale. Chaque envoi
// ajoute une photo ; on peut les réordonner et les retirer.
export function ImageGalleryField({ label, hint, folder, value, onChange, max }: ImageGalleryFieldProps) {
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, index) => (
            <div key={url} className="relative group rounded-md overflow-hidden border aspect-[4/3] bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {index === 0 && (
                <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Principale
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/80 p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Déplacer à gauche"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Retirer la photo"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  <X className="h-3 w-3 text-destructive" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Déplacer à droite"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {value.length < max ? (
        // key : remonte le champ après chaque envoi pour le vider.
        <ImageUpload
          key={value.length}
          label={`Ajouter une photo (${value.length}/${max})`}
          folder={folder}
          value=""
          onChange={(url) => url && onChange([...value, url])}
        />
      ) : (
        <p className="text-xs text-muted-foreground">Maximum {max} photos atteint.</p>
      )}
    </div>
  );
}
