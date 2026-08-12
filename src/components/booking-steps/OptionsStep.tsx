import { motion } from "framer-motion";
import { Briefcase, Plus, Minus, Check, Shield, Utensils, Wifi, Car, Bed, Star, Users, Camera, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnifiedSubmitButton } from "@/components/forms/UnifiedSubmitButton";
import { Price } from "@/components/ui/price";
import { BaggageInfo } from "./BaggageInfo";
import { getBaggageAllowance } from "@/utils/baggageUtils";

interface Option {
  id: string;
  name: string;
  description: string;
  price: number;
  included: boolean;
  icon: React.ReactNode;
}

interface OptionsStepProps {
  serviceType: string;
  selectedOptions: Record<string, number>;
  onOptionsChange: (optionId: string, quantity: number) => void;
  guestsCount: number;
  onNext: () => void;
  onBack: () => void;
  airline?: string;
  fareType?: string;
  cabinClass?: string;
}

export const OptionsStep = ({
  serviceType,
  selectedOptions,
  onOptionsChange,
  guestsCount,
  onNext,
  onBack,
  airline,
  fareType = "basic",
  cabinClass = "ECONOMY",
}: OptionsStepProps) => {
  
  // Baggage fees come from getBaggageAllowance in EUR (real airline fee scale);
  // every other vertical's options below are flat XOF amounts. Mixing them
  // under one hardcoded fromCurrency="EUR" was causing XOF amounts to be
  // re-converted as if they were EUR (~656x too high on display).
  const getOptionsForService = (): { title: string; subtitle: string; currency: "EUR" | "XOF"; options: Option[] } => {
    switch (serviceType) {
      case "flight":
        // Get real baggage allowance for the airline
        const allowance = getBaggageAllowance(airline || "Air France", fareType, cabinClass);
        const additionalBagPrice = allowance.additionalBagPrice || 30;

        return {
          title: "Sélection des bagages",
          subtitle: `Ajoutez des bagages supplémentaires pour votre voyage (${guestsCount} passager${guestsCount > 1 ? "s" : ""})`,
          currency: "EUR",
          options: [
            { 
              id: "checked-additional", 
              name: `Bagage soute supplémentaire ${allowance.checked.weightKg}kg`, 
              description: "Valise enregistrée en soute", 
              price: additionalBagPrice, 
              included: false, 
              icon: <Briefcase className="h-5 w-5" /> 
            },
          ],
        };
      case "hotel":
      case "stay":
        return {
          title: "Options et services",
          subtitle: "Personnalisez votre séjour avec nos options",
          currency: "XOF",
          options: [
            { id: "breakfast", name: "Petit-déjeuner inclus", description: "Buffet complet chaque matin", price: 8000, included: false, icon: <Utensils className="h-5 w-5" /> },
            { id: "wifi-premium", name: "Wi-Fi Premium", description: "Connexion haut débit illimitée", price: 3000, included: false, icon: <Wifi className="h-5 w-5" /> },
            { id: "late-checkout", name: "Départ tardif", description: "Check-out jusqu'à 16h", price: 15000, included: false, icon: <Bed className="h-5 w-5" /> },
            { id: "room-upgrade", name: "Surclassement chambre", description: "Vue mer ou suite", price: 25000, included: false, icon: <Star className="h-5 w-5" /> },
          ],
        };
      case "car":
        return {
          title: "Assurances et extras",
          subtitle: "Protégez votre location avec nos options",
          currency: "XOF",
          options: [
            { id: "basic-insurance", name: "Assurance de base", description: "Couverture collision - Inclus", price: 0, included: true, icon: <Shield className="h-5 w-5" /> },
            { id: "full-insurance", name: "Assurance tous risques", description: "Couverture complète sans franchise", price: 15000, included: false, icon: <Shield className="h-5 w-5" /> },
            { id: "gps", name: "GPS Navigation", description: "Système de navigation intégré", price: 5000, included: false, icon: <Car className="h-5 w-5" /> },
            { id: "child-seat", name: "Siège enfant", description: "Siège auto homologué", price: 8000, included: false, icon: <Car className="h-5 w-5" /> },
            { id: "extra-driver", name: "Conducteur additionnel", description: "Ajouter un conducteur", price: 10000, included: false, icon: <Car className="h-5 w-5" /> },
          ],
        };
      case "tour":
      case "event":
      case "destination":
        return {
          title: "Options et extras",
          subtitle: "Enrichissez votre expérience",
          currency: "XOF",
          options: [
            { id: "guide-private", name: "Guide privé", description: "Guide francophone dédié", price: 25000, included: false, icon: <Users className="h-5 w-5" /> },
            { id: "meals", name: "Repas inclus", description: "Déjeuner et dîner locaux", price: 15000, included: false, icon: <Utensils className="h-5 w-5" /> },
            { id: "photo-pack", name: "Pack photo souvenir", description: "Photos professionnelles", price: 20000, included: false, icon: <Camera className="h-5 w-5" /> },
            { id: "transport-vip", name: "Transport VIP", description: "Véhicule climatisé privé", price: 35000, included: false, icon: <Car className="h-5 w-5" /> },
          ],
        };
      default:
        return {
          title: "Options supplémentaires",
          subtitle: "Personnalisez votre réservation",
          currency: "XOF",
          options: [
            { id: "premium", name: "Option Premium", description: "Service prioritaire", price: 15000, included: false, icon: <Crown className="h-5 w-5" /> },
            { id: "support", name: "Support dédié", description: "Assistance 24/7", price: 10000, included: false, icon: <Shield className="h-5 w-5" /> },
          ],
        };
    }
  };

  const { title, subtitle, currency, options } = getOptionsForService();

  const handleQuantityChange = (optionId: string, delta: number) => {
    const currentQuantity = selectedOptions[optionId] || 0;
    const maxQuantity = serviceType === "flight" ? guestsCount : 1;
    const newQuantity = Math.max(0, Math.min(maxQuantity, currentQuantity + delta));
    onOptionsChange(optionId, newQuantity);
  };

  const getTotalOptionsPrice = () => {
    return Object.entries(selectedOptions).reduce((total, [id, quantity]) => {
      const option = options.find((opt) => opt.id === id);
      return total + (option?.price || 0) * quantity;
    }, 0);
  };

  const getNextButtonText = () => {
    switch (serviceType) {
      case "flight": return "Continuer vers les sièges";
      case "hotel":
      case "stay": return "Continuer vers les préférences";
      case "car": return "Continuer vers les détails";
      default: return "Continuer";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
        <h2 className="text-2xl font-bold text-primary mb-2">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {/* Show baggage allowance info for flights */}
      {serviceType === "flight" && airline && (
        <BaggageInfo 
          airline={airline}
          fareType={fareType}
          cabinClass={cabinClass}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => (
          <Card
            key={option.id}
            className={`p-6 transition-all ${
              option.included
                ? "border-2 border-primary bg-primary/5"
                : "border border-border hover:border-primary/50"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {option.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">{option.name}</h4>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
              {option.included && (
                <Badge className="bg-green-500 shrink-0">
                  <Check className="h-3 w-3 mr-1" />
                  Inclus
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-2xl font-bold text-primary">
                {option.price === 0 ? "Gratuit" : <Price amount={option.price} fromCurrency={currency} showLoader />}
              </div>
              {!option.included && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(option.id, -1)}
                    disabled={(selectedOptions[option.id] || 0) === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">
                    {selectedOptions[option.id] || 0}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(option.id, 1)}
                    disabled={(selectedOptions[option.id] || 0) >= (serviceType === "flight" ? guestsCount : 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {getTotalOptionsPrice() > 0 && (
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total options</span>
            <span className="text-2xl font-bold text-primary">
              <Price amount={getTotalOptionsPrice()} fromCurrency={currency} showLoader />
            </span>
          </div>
        </Card>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Retour
        </Button>
        <div className="flex-1">
          <UnifiedSubmitButton variant="booking" fullWidth onClick={onNext}>
            {getNextButtonText()}
          </UnifiedSubmitButton>
        </div>
      </div>
    </motion.div>
  );
};
