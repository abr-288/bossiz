import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface Nationality {
  code: string;
  name: string;
  flag: string;
}

const nationalities: Nationality[] = [
  { code: "CI", name: "Ivoirienne", flag: "🇨🇮" },
  { code: "SN", name: "Sénégalaise", flag: "🇸🇳" },
  { code: "ML", name: "Malienne", flag: "🇲🇱" },
  { code: "BF", name: "Burkinabè", flag: "🇧🇫" },
  { code: "NE", name: "Nigérienne", flag: "🇳🇪" },
  { code: "TG", name: "Togolaise", flag: "🇹🇬" },
  { code: "BJ", name: "Béninoise", flag: "🇧🇯" },
  { code: "GN", name: "Guinéenne", flag: "🇬🇳" },
  { code: "CM", name: "Camerounaise", flag: "🇨🇲" },
  { code: "CG", name: "Congolaise", flag: "🇨🇬" },
  { code: "CD", name: "Congolaise (RDC)", flag: "🇨🇩" },
  { code: "GA", name: "Gabonaise", flag: "🇬🇦" },
  { code: "CF", name: "Centrafricaine", flag: "🇨🇫" },
  { code: "TD", name: "Tchadienne", flag: "🇹🇩" },
  { code: "FR", name: "Française", flag: "🇫🇷" },
  { code: "US", name: "Américaine", flag: "🇺🇸" },
  { code: "GB", name: "Britannique", flag: "🇬🇧" },
  { code: "DE", name: "Allemande", flag: "🇩🇪" },
  { code: "IT", name: "Italienne", flag: "🇮🇹" },
  { code: "ES", name: "Espagnole", flag: "🇪🇸" },
  { code: "PT", name: "Portugaise", flag: "🇵🇹" },
  { code: "BE", name: "Belge", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", flag: "🇨🇭" },
  { code: "MA", name: "Marocaine", flag: "🇲🇦" },
  { code: "DZ", name: "Algérienne", flag: "🇩🇿" },
  { code: "TN", name: "Tunisienne", flag: "🇹🇳" },
  { code: "EG", name: "Égyptienne", flag: "🇪🇬" },
  { code: "NG", name: "Nigériane", flag: "🇳🇬" },
  { code: "GH", name: "Ghanéenne", flag: "🇬🇭" },
  { code: "KE", name: "Kényane", flag: "🇰🇪" },
  { code: "ZA", name: "Sud-Africaine", flag: "🇿🇦" },
  { code: "IN", name: "Indienne", flag: "🇮🇳" },
  { code: "CN", name: "Chinoise", flag: "🇨🇳" },
  { code: "JP", name: "Japonaise", flag: "🇯🇵" },
  { code: "BR", name: "Brésilienne", flag: "🇧🇷" },
  { code: "MX", name: "Mexicaine", flag: "🇲🇽" },
  { code: "CA", name: "Canadienne", flag: "🇨🇦" },
  { code: "AU", name: "Australienne", flag: "🇦🇺" },
  { code: "OTHER", name: "Autre", flag: "🌍" },
];

interface NationalitySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const NationalitySelect = ({ value, onValueChange }: NationalitySelectProps) => {
  const { t } = useTranslation();
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 border-2">
        <SelectValue placeholder={t('nationalitySelect.placeholder')} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {nationalities.map((nat) => (
          <SelectItem key={nat.code} value={nat.code}>
            <span className="flex items-center gap-2">
              <span>{nat.flag}</span>
              <span>{nat.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};