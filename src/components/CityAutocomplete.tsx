import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface City {
  name: string;
  code?: string;
  country: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const popularCities: City[] = [
  // Afrique de l'Ouest
  { name: "Abidjan", code: "ABJ", country: "Côte d'Ivoire" },
  { name: "Lomé", code: "LFW", country: "Togo" },
  { name: "Dakar", code: "DSS", country: "Sénégal" },
  { name: "Accra", code: "ACC", country: "Ghana" },
  { name: "Lagos", code: "LOS", country: "Nigeria" },
  { name: "Bamako", code: "BKO", country: "Mali" },
  { name: "Ouagadougou", code: "OUA", country: "Burkina Faso" },
  { name: "Niamey", code: "NIM", country: "Niger" },
  { name: "Conakry", code: "CKY", country: "Guinée" },
  { name: "Freetown", code: "FNA", country: "Sierra Leone" },
  { name: "Monrovia", code: "MLW", country: "Libéria" },
  { name: "Cotonou", code: "COO", country: "Bénin" },
  
  // Afrique du Nord
  { name: "Casablanca", code: "CMN", country: "Maroc" },
  { name: "Tunis", code: "TUN", country: "Tunisie" },
  { name: "Alger", code: "ALG", country: "Algérie" },
  { name: "Le Caire", code: "CAI", country: "Égypte" },
  { name: "Tripoli", code: "TIP", country: "Libye" },
  
  // Afrique de l'Est
  { name: "Nairobi", code: "NBO", country: "Kenya" },
  { name: "Addis-Abeba", code: "ADD", country: "Éthiopie" },
  { name: "Dar es Salaam", code: "DAR", country: "Tanzanie" },
  { name: "Kampala", code: "EBB", country: "Ouganda" },
  { name: "Kigali", code: "KGL", country: "Rwanda" },
  
  // Afrique Australe
  { name: "Johannesburg", code: "JNB", country: "Afrique du Sud" },
  { name: "Le Cap", code: "CPT", country: "Afrique du Sud" },
  { name: "Luanda", code: "LAD", country: "Angola" },
  { name: "Maputo", code: "MPM", country: "Mozambique" },
  { name: "Harare", code: "HRE", country: "Zimbabwe" },
  
  // Europe
  { name: "Paris", code: "CDG", country: "France" },
  { name: "Londres", code: "LHR", country: "Royaume-Uni" },
  { name: "Bruxelles", code: "BRU", country: "Belgique" },
  { name: "Amsterdam", code: "AMS", country: "Pays-Bas" },
  { name: "Madrid", code: "MAD", country: "Espagne" },
  { name: "Rome", code: "FCO", country: "Italie" },
  { name: "Berlin", code: "BER", country: "Allemagne" },
  { name: "Lisbonne", code: "LIS", country: "Portugal" },
  
  // Moyen-Orient
  { name: "Dubaï", code: "DXB", country: "Émirats Arabes Unis" },
  { name: "Istanbul", code: "IST", country: "Turquie" },
  { name: "Doha", code: "DOH", country: "Qatar" },
  { name: "Beyrouth", code: "BEY", country: "Liban" },
  
  // Amériques
  { name: "New York", code: "JFK", country: "États-Unis" },
  { name: "Los Angeles", code: "LAX", country: "États-Unis" },
  { name: "Miami", code: "MIA", country: "États-Unis" },
  { name: "Toronto", code: "YYZ", country: "Canada" },
  { name: "São Paulo", code: "GRU", country: "Brésil" },
  
  // Asie
  { name: "Pékin", code: "PEK", country: "Chine" },
  { name: "Tokyo", code: "NRT", country: "Japon" },
  { name: "Singapour", code: "SIN", country: "Singapour" },
  { name: "Bangkok", code: "BKK", country: "Thaïlande" },
  { name: "Mumbai", code: "BOM", country: "Inde" },
];

export const CityAutocomplete = ({
  value,
  onChange,
  placeholder = "Ville ou aéroport",
  className,
}: CityAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = popularCities.filter(
        (city) =>
          city.name.toLowerCase().includes(value.toLowerCase()) ||
          city.code?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCities(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredCities([]);
      setIsOpen(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCity = (city: City) => {
    onChange(city.code ? `${city.name} (${city.code})` : city.name);
    setIsOpen(false);
  };

  return (
    <div ref={inputRef} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length > 0 && setIsOpen(true)}
        className={className}
      />
      {isOpen && filteredCities.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover/100 backdrop-blur-sm border-2 border-primary/20 rounded-lg shadow-2xl z-popover max-h-[300px] overflow-y-auto">
          {filteredCities.map((city, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectCity(city)}
              className="w-full px-4 py-3 text-left hover:bg-secondary/10 hover:border-l-4 hover:border-l-secondary flex items-start gap-3 transition-all duration-base ease-standard first:rounded-t-lg last:rounded-b-lg border-b border-border/50 last:border-b-0 group"
            >
              <MapPin className="w-4 h-4 mt-0.5 text-secondary flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-popover-foreground group-hover:text-secondary">
                  {city.name} {city.code && `(${city.code})`}
                </p>
                <p className="text-sm text-muted-foreground">{city.country}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
