import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface PartnerLocation {
  location: string;
  maps_url: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPickerProps {
  value: PartnerLocation;
  onChange: (value: PartnerLocation) => void;
  required?: boolean;
  showLocation?: boolean;
}

function getCoordinates(source: string): [number, number] | null {
  let decoded = source.replaceAll("+", " ");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // A partially encoded share link can still contain coordinates we can parse.
  }
  const patterns = [
    /@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /(?:[?&](?:q|query|ll|center)=)(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/i,
    /^\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/,
  ];
  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return [lat, lon];
  }
  return null;
}

export function LocationPicker({ value, onChange, required = false, showLocation = true }: LocationPickerProps) {
  const { t } = useTranslation();
  const hasCoordinates = Number.isFinite(value.latitude) && Number.isFinite(value.longitude);
  const mapEmbedUrl = useMemo(() => {
    if (!hasCoordinates) return "";
    const lat = value.latitude as number;
    const lon = value.longitude as number;
    const delta = 0.006;
    const params = new URLSearchParams({
      bbox: `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`,
      layer: "mapnik",
      marker: `${lat},${lon}`,
    });
    return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
  }, [hasCoordinates, value.latitude, value.longitude]);

  const update = (changes: Partial<PartnerLocation>) => onChange({ ...value, ...changes });

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-label={t("ux.bo.preciseLocation")}>
      <div>
        <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" />{t("ux.bo.serviceLocation")}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{t("ux.bo.enterAddressThenPasteGoogle")}</p>
      </div>
      {showLocation && (
        <Input
          value={value.location}
          onChange={(event) => update({ location: event.target.value })}
          placeholder={t("ux.bo.cityDistrictFullAddress")}
          required={required}
          aria-label={t("ux.bo.cityAddress")}
        />
      )}
      <Input
        type="url"
        value={value.maps_url}
        onChange={(event) => {
          const maps_url = event.target.value;
          const coords = getCoordinates(maps_url);
          update({ maps_url, ...(coords ? { latitude: coords[0], longitude: coords[1] } : {}) });
        }}
        placeholder={t("ux.bo.googleMapsOpenstreetmapLink")}
        aria-label={t("ux.bo.mapsLocationLink")}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs" htmlFor="partner-latitude">Latitude</Label><Input id="partner-latitude" type="number" step="any" min="-90" max="90" value={value.latitude ?? ""} onChange={(event) => update({ latitude: event.target.value === "" ? null : Number(event.target.value) })} placeholder="5.3364" /></div>
        <div className="space-y-1"><Label className="text-xs" htmlFor="partner-longitude">Longitude</Label><Input id="partner-longitude" type="number" step="any" min="-180" max="180" value={value.longitude ?? ""} onChange={(event) => update({ longitude: event.target.value === "" ? null : Number(event.target.value) })} placeholder="-4.0267" /></div>
      </div>
      {hasCoordinates && (
        <div className="space-y-2">
          <iframe title={t("ux.bo.locationPreview")} src={mapEmbedUrl} className="h-40 w-full rounded-md border" loading="lazy" />
          <a className="inline-flex items-center gap-1 text-sm text-primary underline" href={`https://www.google.com/maps/search/?api=1&query=${value.latitude},${value.longitude}`} target="_blank" rel="noreferrer">
            Ouvrir ce point dans Google Maps <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
      {!!value.maps_url && !hasCoordinates && (
        <p className="text-xs text-warning-foreground">{t("ux.bo.linkDoesNotContainReadable")}</p>
      )}
    </section>
  );
}
