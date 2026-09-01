import { motion } from "framer-motion";
import { Armchair, X, Bed, Car, MapPin, Clock, User, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnifiedSubmitButton } from "@/components/forms/UnifiedSubmitButton";
import { useState } from "react";
import { Price } from "@/components/ui/price";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "react-i18next";

interface Seat {
  id: string;
  row: number;
  letter: string;
  type: "standard" | "extra" | "front";
  price: number;
  available: boolean;
}

interface PreferencesStepProps {
  serviceType: string;
  selectedPreferences: Record<string, any>;
  onPreferencesChange: (preferences: Record<string, any>) => void;
  guestsCount: number;
  onNext: () => void;
  onBack: () => void;
}

export const PreferencesStep = ({
  serviceType,
  selectedPreferences,
  onPreferencesChange,
  guestsCount,
  onNext,
  onBack,
}: PreferencesStepProps) => {
  const { t } = useTranslation();
  const rows = 20;
  const letters = ["A", "B", "C", "", "D", "E", "F"];

  const generateSeats = (): Seat[] => {
    const seats: Seat[] = [];
    for (let row = 1; row <= rows; row++) {
      for (const letter of letters) {
        if (letter === "") continue;
        
        let type: "standard" | "extra" | "front" = "standard";
        let price = 5000;
        
        if (row <= 3) {
          type = "front";
          price = 15000;
        } else if (row === 10 || row === 20 || ["A", "F"].includes(letter)) {
          type = "extra";
          price = 10000;
        }
        
        const available = Math.random() > 0.3;
        
        seats.push({
          id: `${row}${letter}`,
          row,
          letter,
          type,
          price,
          available,
        });
      }
    }
    return seats;
  };

  const [seats] = useState<Seat[]>(generateSeats());
  const selectedSeats = (selectedPreferences.seats as string[]) || [];

  const handleSeatClick = (seatId: string) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat?.available) return;

    let newSeats: string[];
    if (selectedSeats.includes(seatId)) {
      newSeats = selectedSeats.filter((id) => id !== seatId);
    } else if (selectedSeats.length < guestsCount) {
      newSeats = [...selectedSeats, seatId];
    } else {
      return;
    }
    onPreferencesChange({ ...selectedPreferences, seats: newSeats });
  };

  const getTotalSeatsPrice = () => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seats.find((s) => s.id === seatId);
      return total + (seat?.price || 0);
    }, 0);
  };

  const getSeatColor = (seat: Seat) => {
    if (!seat.available) return "bg-muted text-muted-foreground";
    if (selectedSeats.includes(seat.id)) return "bg-primary text-white";
    if (seat.type === "front") return "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300";
    if (seat.type === "extra") return "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
    return "bg-secondary text-foreground hover:bg-secondary/80";
  };

  const handlePreferenceChange = (key: string, value: any) => {
    onPreferencesChange({ ...selectedPreferences, [key]: value });
  };

  // Render flight seat selection
  if (serviceType === "flight") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
          <h2 className="text-2xl font-bold text-primary mb-2">Sélection des sièges</h2>
          <p className="text-muted-foreground">
            Sélectionnez {guestsCount} siège{guestsCount > 1 ? "s" : ""} pour votre voyage
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-6 h-fit">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Armchair className="h-5 w-5 text-primary" />
              {t('preferencesStep.legend')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                  <Armchair className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Standard</p>
                  <p className="text-xs text-muted-foreground"><Price amount={5000} /></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                  <Armchair className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium">Espace extra</p>
                  <p className="text-xs text-muted-foreground"><Price amount={10000} /></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                  <Armchair className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm font-medium">Avant de l'avion</p>
                  <p className="text-xs text-muted-foreground"><Price amount={15000} /></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                  <Armchair className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sélectionné</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-semibold mb-2">
                Sièges sélectionnés: {selectedSeats.length}/{guestsCount}
              </p>
              {selectedSeats.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seatId) => (
                    <Badge key={seatId} variant="secondary" className="px-3 py-1">
                      {seatId}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {getTotalSeatsPrice() > 0 && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Total sièges</p>
                <p className="text-xl font-bold text-primary">
                  <Price amount={getTotalSeatsPrice()} showLoader />
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6 lg:col-span-2 overflow-x-auto">
            <div className="mb-6 text-center">
              <div className="inline-block bg-primary/10 px-6 py-2 rounded-full">
                <p className="text-sm font-semibold text-primary">Avant de l'avion</p>
              </div>
            </div>

            <div className="space-y-2 min-w-fit">
              <div className="flex gap-2 justify-center mb-4">
                {letters.map((letter, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-6 flex items-center justify-center text-sm font-semibold text-muted-foreground"
                  >
                    {letter}
                  </div>
                ))}
              </div>

              {Array.from({ length: rows }, (_, i) => i + 1).map((row) => (
                <div key={row} className="flex gap-2 justify-center items-center">
                  <div className="w-8 text-sm font-semibold text-muted-foreground text-right">
                    {row}
                  </div>
                  {letters.map((letter, idx) => {
                    if (letter === "") {
                      return <div key={idx} className="w-10" />;
                    }
                    const seat = seats.find((s) => s.row === row && s.letter === letter);
                    if (!seat) return null;

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => handleSeatClick(seat.id)}
                        disabled={!seat.available}
                        className={`w-10 h-10 rounded flex items-center justify-center text-xs font-medium transition-all ${getSeatColor(seat)} ${!seat.available ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      >
                        {seat.available ? <Armchair className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </button>
                    );
                  })}
                  <div className="w-8 text-sm font-semibold text-muted-foreground">{row}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="inline-block bg-muted px-6 py-2 rounded-full">
                <p className="text-sm font-semibold text-muted-foreground">Arrière de l'avion</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Retour
          </Button>
          <div className="flex-1">
            <UnifiedSubmitButton variant="booking" fullWidth onClick={onNext}>
              {t('booking.summary.continueToPayment')}
            </UnifiedSubmitButton>
          </div>
        </div>
      </motion.div>
    );
  }

  // Render hotel/stay room preferences
  if (serviceType === "hotel" || serviceType === "stay") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
          <h2 className="text-2xl font-bold text-primary mb-2">Préférences de chambre</h2>
          <p className="text-muted-foreground">Personnalisez votre séjour selon vos préférences</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bed className="h-5 w-5 text-primary" />
              Type de lit
            </h3>
            <RadioGroup
              value={selectedPreferences.bedType || "double"}
              onValueChange={(value) => handlePreferenceChange("bedType", value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="double" id="double" />
                <Label htmlFor="double" className="flex-1 cursor-pointer">
                  <span className="font-medium">Lit double</span>
                  <p className="text-sm text-muted-foreground">Grand lit 160cm</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="twin" id="twin" />
                <Label htmlFor="twin" className="flex-1 cursor-pointer">
                  <span className="font-medium">Lits jumeaux</span>
                  <p className="text-sm text-muted-foreground">2 lits simples</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="king" id="king" />
                <Label htmlFor="king" className="flex-1 cursor-pointer">
                  <span className="font-medium">Lit King Size</span>
                  <p className="text-sm text-muted-foreground">Très grand lit 180cm</p>
                </Label>
              </div>
            </RadioGroup>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t('preferencesStep.floorPreferenceLabel')}
            </h3>
            <Select
              value={selectedPreferences.floorPreference || "any"}
              onValueChange={(value) => handlePreferenceChange("floorPreference", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t('preferencesStep.choosePreferencePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Peu importe</SelectItem>
                <SelectItem value="low">Étages bas (1-3)</SelectItem>
                <SelectItem value="mid">Étages moyens (4-7)</SelectItem>
                <SelectItem value="high">Étages élevés (8+)</SelectItem>
              </SelectContent>
            </Select>

            <h3 className="font-semibold mt-6 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {t('preferencesStep.estimatedArrivalTimeLabel')}
            </h3>
            <Select
              value={selectedPreferences.arrivalTime || "14-18"}
              onValueChange={(value) => handlePreferenceChange("arrivalTime", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t('preferencesStep.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before-14">Avant 14h00</SelectItem>
                <SelectItem value="14-18">14h00 - 18h00</SelectItem>
                <SelectItem value="18-22">18h00 - 22h00</SelectItem>
                <SelectItem value="after-22">Après 22h00</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-6 md:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              {t('preferencesStep.hotelSpecialRequestsLabel')}
            </h3>
            <Textarea
              placeholder={t('preferencesStep.hotelSpecialRequestsPlaceholder')}
              value={selectedPreferences.specialRequests || ""}
              onChange={(e) => handlePreferenceChange("specialRequests", e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Les demandes spéciales sont soumises à disponibilité et ne peuvent être garanties.
            </p>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Retour
          </Button>
          <div className="flex-1">
            <UnifiedSubmitButton variant="booking" fullWidth onClick={onNext}>
              {t('booking.summary.continueToPayment')}
            </UnifiedSubmitButton>
          </div>
        </div>
      </motion.div>
    );
  }

  // Render car rental details
  if (serviceType === "car") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
          <h2 className="text-2xl font-bold text-primary mb-2">Détails de la location</h2>
          <p className="text-muted-foreground">Informations sur le conducteur et préférences</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Type de carburant
            </h3>
            <RadioGroup
              value={selectedPreferences.fuelPolicy || "full"}
              onValueChange={(value) => handlePreferenceChange("fuelPolicy", value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <span className="font-medium">Plein à plein</span>
                  <p className="text-sm text-muted-foreground">Retour avec le plein</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="prepaid" id="prepaid" />
                <Label htmlFor="prepaid" className="flex-1 cursor-pointer">
                  <span className="font-medium">Carburant prépayé</span>
                  <p className="text-sm text-muted-foreground">Payer le plein à l'avance</p>
                </Label>
              </div>
            </RadioGroup>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Heure de prise en charge
            </h3>
            <Select
              value={selectedPreferences.pickupTime || "10:00"}
              onValueChange={(value) => handlePreferenceChange("pickupTime", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t('preferencesStep.selectTimePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 13 }, (_, i) => i + 7).map((hour) => (
                  <SelectItem key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                    {hour.toString().padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <h3 className="font-semibold mt-6 mb-4">Heure de retour</h3>
            <Select
              value={selectedPreferences.returnTime || "10:00"}
              onValueChange={(value) => handlePreferenceChange("returnTime", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t('preferencesStep.selectTimePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 13 }, (_, i) => i + 7).map((hour) => (
                  <SelectItem key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                    {hour.toString().padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-6 md:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Remarques
            </h3>
            <Textarea
              placeholder={t('preferencesStep.carNotesPlaceholder')}
              value={selectedPreferences.notes || ""}
              onChange={(e) => handlePreferenceChange("notes", e.target.value)}
              className="min-h-[100px]"
            />
          </Card>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Retour
          </Button>
          <div className="flex-1">
            <UnifiedSubmitButton variant="booking" fullWidth onClick={onNext}>
              {t('booking.summary.continueToPayment')}
            </UnifiedSubmitButton>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default: tour/event/other services
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
        <h2 className="text-2xl font-bold text-primary mb-2">Vos préférences</h2>
        <p className="text-muted-foreground">Personnalisez votre expérience</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t('preferencesStep.desiredDepartureTimeLabel')}
          </h3>
          <Select
            value={selectedPreferences.departureTime || "09:00"}
            onValueChange={(value) => handlePreferenceChange("departureTime", value)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder={t('preferencesStep.selectTimePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="06:00">06:00 - Tôt le matin</SelectItem>
              <SelectItem value="09:00">09:00 - Matin</SelectItem>
              <SelectItem value="12:00">12:00 - Midi</SelectItem>
              <SelectItem value="14:00">14:00 - Après-midi</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            {t('preferencesStep.dietaryPreferencesLabel')}
          </h3>
          <Select
            value={selectedPreferences.dietaryPreference || "none"}
            onValueChange={(value) => handlePreferenceChange("dietaryPreference", value)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder={t('preferencesStep.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune restriction</SelectItem>
              <SelectItem value="vegetarian">Végétarien</SelectItem>
              <SelectItem value="vegan">Végan</SelectItem>
              <SelectItem value="halal">Halal</SelectItem>
              <SelectItem value="gluten-free">Sans gluten</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {t('preferencesStep.particularRequestsLabel')}
          </h3>
          <Textarea
            placeholder={t('preferencesStep.genericSpecialRequestsPlaceholder')}
            value={selectedPreferences.specialRequests || ""}
            onChange={(e) => handlePreferenceChange("specialRequests", e.target.value)}
            className="min-h-[100px]"
          />
        </Card>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Retour
        </Button>
        <div className="flex-1">
          <UnifiedSubmitButton variant="booking" fullWidth onClick={onNext}>
            {t('booking.summary.continueToPayment')}
          </UnifiedSubmitButton>
        </div>
      </div>
    </motion.div>
  );
};

const Utensils = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);
