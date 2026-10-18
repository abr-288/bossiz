import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageGalleryField } from "@/components/agency/ImageGalleryField";
import { HOTEL_AMENITIES, HOTEL_GALLERY_MAX, type HotelSpecs } from "@/lib/hotels";

interface HotelDetailsFieldsProps {
  specs: HotelSpecs;
  onSpecsChange: (specs: HotelSpecs) => void;
  images: string[];
  onImagesChange: (images: string[]) => void;
  amenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
}

// Partie « hôtel » du formulaire de service : ce qui s'affiche en haut de la
// fiche publique (galerie, étoiles, points forts, équipements, horaires).
// Les chambres et leurs tarifs se gèrent ensuite dans « Chambres & tarifs ».
export function HotelDetailsFields({
  specs,
  onSpecsChange,
  images,
  onImagesChange,
  amenities,
  onAmenitiesChange,
}: HotelDetailsFieldsProps) {
  const toggleAmenity = (amenity: string, checked: boolean) =>
    onAmenitiesChange(checked ? [...amenities, amenity] : amenities.filter((a) => a !== amenity));

  return (
    <div className="space-y-4 border-t pt-4">
      <p className="text-sm font-medium">Fiche de l'hôtel</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Classement</Label>
          <Select value={String(specs.stars)} onValueChange={(v) => onSpecsChange({ ...specs, stars: Number(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Non classé</SelectItem>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{"★".repeat(n)} ({n} étoile{n > 1 ? "s" : ""})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Arrivée à partir de</Label>
          <Input type="time" value={specs.checkInFrom} onChange={(e) => onSpecsChange({ ...specs, checkInFrom: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Départ jusqu'à</Label>
          <Input type="time" value={specs.checkOutUntil} onChange={(e) => onSpecsChange({ ...specs, checkOutUntil: e.target.value })} />
        </div>
      </div>

      <ImageGalleryField
        label="Photos de l'établissement"
        hint="Façade, réception, piscine, restaurant... La première photo est la photo principale."
        folder="agency-hotels"
        value={images}
        onChange={onImagesChange}
        max={HOTEL_GALLERY_MAX}
      />

      <div className="space-y-2">
        <Label>Points forts</Label>
        <Textarea
          rows={3}
          placeholder={"Un point fort par ligne, ex. :\nÀ 5 minutes de l'aéroport\nPiscine à débordement"}
          value={specs.highlights.join("\n")}
          onChange={(e) => onSpecsChange({ ...specs, highlights: e.target.value.split("\n") })}
        />
      </div>

      <div className="space-y-2">
        <Label>Équipements de l'établissement</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border p-3">
          {HOTEL_AMENITIES.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={amenities.includes(amenity)}
                onCheckedChange={(checked) => toggleAmenity(amenity, checked === true)}
              />
              {amenity}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Règlement intérieur</Label>
        <Textarea
          rows={2}
          placeholder="Ex. : fêtes interdites, pièce d'identité demandée à l'arrivée..."
          value={specs.houseRules}
          onChange={(e) => onSpecsChange({ ...specs, houseRules: e.target.value })}
        />
      </div>
    </div>
  );
}
