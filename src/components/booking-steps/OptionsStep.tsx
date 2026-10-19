import { motion } from "framer-motion";
import { Briefcase, Plus, Minus, Check, Shield, Utensils, Wifi, Car, Bed, Star, Users, Camera, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnifiedSubmitButton } from "@/components/forms/UnifiedSubmitButton";
import { Price } from "@/components/ui/price";
import { BaggageInfo } from "./BaggageInfo";
import { getBaggageAllowance } from "@/utils/baggageUtils";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
          title: t("ux.booking.baggageTitle"),
          subtitle: t("ux.booking.baggageSubtitle", { count: guestsCount }),
          currency: "EUR",
          options: [
            { 
              id: "checked-additional", 
              name: t("ux.booking.extraBag", { kg: allowance.checked.weightKg }),
              description: t("ux.booking.extraBagDesc"),
              price: additionalBagPrice, 
              included: false, 
              icon: <Briefcase className="h-5 w-5" /> 
            },
          ],
        };
      case "hotel":
      case "stay":
        return {
          title: t("ux.booking.hotelTitle"),
          subtitle: t("ux.booking.hotelSubtitle"),
          currency: "XOF",
          options: [
            { id: "breakfast", name: t("ux.booking.breakfast"), description: t("ux.booking.breakfastDesc"), price: 8000, included: false, icon: <Utensils className="h-5 w-5" /> },
            { id: "wifi-premium", name: t("ux.booking.wifi"), description: t("ux.booking.wifiDesc"), price: 3000, included: false, icon: <Wifi className="h-5 w-5" /> },
            { id: "late-checkout", name: t("ux.booking.lateCheckout"), description: t("ux.booking.lateCheckoutDesc"), price: 15000, included: false, icon: <Bed className="h-5 w-5" /> },
            { id: "room-upgrade", name: t("ux.booking.upgrade"), description: t("ux.booking.upgradeDesc"), price: 25000, included: false, icon: <Star className="h-5 w-5" /> },
          ],
        };
      case "car":
        return {
          title: t("ux.booking.carTitle"),
          subtitle: t("ux.booking.carSubtitle"),
          currency: "XOF",
          options: [
            { id: "basic-insurance", name: t("ux.booking.basicInsurance"), description: t("ux.booking.basicInsuranceDesc"), price: 0, included: true, icon: <Shield className="h-5 w-5" /> },
            { id: "full-insurance", name: t("ux.booking.fullInsurance"), description: t("ux.booking.fullInsuranceDesc"), price: 15000, included: false, icon: <Shield className="h-5 w-5" /> },
            { id: "gps", name: t("ux.booking.gps"), description: t("ux.booking.gpsDesc"), price: 5000, included: false, icon: <Car className="h-5 w-5" /> },
            { id: "child-seat", name: t("ux.booking.childSeat"), description: t("ux.booking.childSeatDesc"), price: 8000, included: false, icon: <Car className="h-5 w-5" /> },
            { id: "extra-driver", name: t("ux.booking.extraDriver"), description: t("ux.booking.extraDriverDesc"), price: 10000, included: false, icon: <Car className="h-5 w-5" /> },
          ],
        };
      case "tour":
      case "event":
      case "destination":
        return {
          title: t("ux.booking.tourTitleOptions"),
          subtitle: t("ux.booking.tourSubtitle"),
          currency: "XOF",
          options: [
            { id: "guide-private", name: t("ux.booking.guide"), description: t("ux.booking.guideDesc"), price: 25000, included: false, icon: <Users className="h-5 w-5" /> },
            { id: "meals", name: t("ux.booking.meals"), description: t("ux.booking.mealsDesc"), price: 15000, included: false, icon: <Utensils className="h-5 w-5" /> },
            { id: "photo-pack", name: t("ux.booking.photo"), description: t("ux.booking.photoDesc"), price: 20000, included: false, icon: <Camera className="h-5 w-5" /> },
            { id: "transport-vip", name: t("ux.booking.vip"), description: t("ux.booking.vipDesc"), price: 35000, included: false, icon: <Car className="h-5 w-5" /> },
          ],
        };
      default:
        return {
          title: t("ux.booking.otherTitle"),
          subtitle: t("ux.booking.otherSubtitle"),
          currency: "XOF",
          options: [
            { id: "premium", name: t("ux.booking.premium"), description: t("ux.booking.premiumDesc"), price: 15000, included: false, icon: <Crown className="h-5 w-5" /> },
            { id: "support", name: t("ux.booking.support"), description: t("ux.booking.supportDesc"), price: 10000, included: false, icon: <Shield className="h-5 w-5" /> },
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
      case "flight": return t("ux.booking.continueSeats");
      case "hotel":
      case "stay": return t("ux.booking.continuePreferences");
      case "car": return t("ux.booking.continueDetails");
      default: return t("ux.booking.continue");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
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
                <Badge className="bg-success shrink-0">
                  <Check className="h-3 w-3 mr-1" />
                  {t("ux.booking.included")}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-2xl font-bold text-primary">
                {option.price === 0 ? t("ux.booking.free") : <Price amount={option.price} fromCurrency={currency} showLoader />}
              </div>
              {!option.included && (
                <div className="flex items-center gap-2">
                  <Button
                    aria-label={t("ux.booking.remove", { name: option.name })}
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
                    aria-label={t("ux.booking.add", { name: option.name })}
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
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">{t("ux.booking.optionsTotal")}</span>
            <span className="text-2xl font-bold text-primary">
              <Price amount={getTotalOptionsPrice()} fromCurrency={currency} showLoader />
            </span>
          </div>
        </Card>
      )}

      <div className="booking-actions flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          {t("ux.booking.back")}
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
