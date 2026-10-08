import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface Nationality {
  code: string;
  name: string;
}

const nationalities: Nationality[] = [
  { code: "CI", name: "Ivoirienne" },
  { code: "SN", name: "Sénégalaise" },
  { code: "ML", name: "Malienne" },
  { code: "BF", name: "Burkinabè" },
  { code: "NE", name: "Nigérienne" },
  { code: "TG", name: "Togolaise" },
  { code: "BJ", name: "Béninoise" },
  { code: "GN", name: "Guinéenne" },
  { code: "CM", name: "Camerounaise" },
  { code: "CG", name: "Congolaise" },
  { code: "CD", name: "Congolaise (RDC)" },
  { code: "GA", name: "Gabonaise" },
  { code: "CF", name: "Centrafricaine" },
  { code: "TD", name: "Tchadienne" },
  { code: "FR", name: "Française" },
  { code: "US", name: "Américaine" },
  { code: "GB", name: "Britannique" },
  { code: "DE", name: "Allemande" },
  { code: "IT", name: "Italienne" },
  { code: "ES", name: "Espagnole" },
  { code: "PT", name: "Portugaise" },
  { code: "BE", name: "Belge" },
  { code: "CH", name: "Suisse" },
  { code: "MA", name: "Marocaine" },
  { code: "DZ", name: "Algérienne" },
  { code: "TN", name: "Tunisienne" },
  { code: "EG", name: "Égyptienne" },
  { code: "NG", name: "Nigériane" },
  { code: "GH", name: "Ghanéenne" },
  { code: "KE", name: "Kényane" },
  { code: "ZA", name: "Sud-Africaine" },
  { code: "IN", name: "Indienne" },
  { code: "CN", name: "Chinoise" },
  { code: "JP", name: "Japonaise" },
  { code: "BR", name: "Brésilienne" },
  { code: "MX", name: "Mexicaine" },
  { code: "CA", name: "Canadienne" },
  { code: "AU", name: "Australienne" },
  { code: "OTHER", name: "Autre" },
];

const NationalityFlag = ({ code, name }: Nationality) =>
  code === "OTHER" ? (
    <span aria-hidden="true" className="text-base leading-none">🌍</span>
  ) : (
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt={`${name} : drapeau`}
      className="h-4 w-6 shrink-0 rounded-sm border border-border/50 object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );

interface NationalitySelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
}

export const NationalitySelect = ({ id, value, onValueChange }: NationalitySelectProps) => {
  const { t } = useTranslation();
  const selectedNationality = nationalities.find(
    (nationality) =>
      nationality.code === value ||
      nationality.name.toLocaleLowerCase() === value.toLocaleLowerCase()
  );

  return (
    <Select value={selectedNationality?.code ?? value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="h-12 border-2">
        <SelectValue placeholder={t('nationalitySelect.placeholder')}>
          {selectedNationality && (
            <span className="flex items-center gap-2">
              <NationalityFlag {...selectedNationality} />
              <span>{selectedNationality.name}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {nationalities.map((nat) => (
          <SelectItem key={nat.code} value={nat.code}>
            <span className="flex items-center gap-2">
              <NationalityFlag {...nat} />
              <span>{nat.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};