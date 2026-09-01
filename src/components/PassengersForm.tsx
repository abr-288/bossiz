import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

export interface Passenger {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  document_type?: string;
  document_number?: string;
  nationality?: string;
}

interface PassengersFormProps {
  passengers: Passenger[];
  onChange: (passengers: Passenger[]) => void;
  minPassengers?: number;
  maxPassengers?: number;
}

export const PassengersForm = ({
  passengers,
  onChange,
  minPassengers = 1,
  maxPassengers = 9,
}: PassengersFormProps) => {
  const { t } = useTranslation();
  const addPassenger = () => {
    if (passengers.length < maxPassengers) {
      onChange([
        ...passengers,
        {
          first_name: "",
          last_name: "",
          date_of_birth: "",
          document_type: "passport",
          document_number: "",
          nationality: "",
        },
      ]);
    }
  };

  const removePassenger = (index: number) => {
    if (passengers.length > minPassengers) {
      onChange(passengers.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Passagers</h3>
        {passengers.length < maxPassengers && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPassenger}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un passager
          </Button>
        )}
      </div>

      {passengers.map((passenger, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Passager {index + 1}
              </CardTitle>
              {passengers.length > minPassengers && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePassenger(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`first_name_${index}`}>Prénom *</Label>
                <Input
                  id={`first_name_${index}`}
                  value={passenger.first_name}
                  onChange={(e) => updatePassenger(index, "first_name", e.target.value)}
                  placeholder="Jean"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`last_name_${index}`}>Nom *</Label>
                <Input
                  id={`last_name_${index}`}
                  value={passenger.last_name}
                  onChange={(e) => updatePassenger(index, "last_name", e.target.value)}
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`dob_${index}`}>Date de naissance</Label>
                <Input
                  id={`dob_${index}`}
                  type="date"
                  value={passenger.date_of_birth || ""}
                  onChange={(e) => updatePassenger(index, "date_of_birth", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`nationality_${index}`}>Nationalité</Label>
                <Input
                  id={`nationality_${index}`}
                  value={passenger.nationality || ""}
                  onChange={(e) => updatePassenger(index, "nationality", e.target.value)}
                  placeholder={t('passengersForm.nationalityPlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`doc_type_${index}`}>Type de document</Label>
                <Select
                  value={passenger.document_type || "passport"}
                  onValueChange={(value) => updatePassenger(index, "document_type", value)}
                >
                  <SelectTrigger id={`doc_type_${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passeport</SelectItem>
                    <SelectItem value="id_card">Carte d'identité</SelectItem>
                    <SelectItem value="driver_license">Permis de conduire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`doc_number_${index}`}>Numéro de document</Label>
                <Input
                  id={`doc_number_${index}`}
                  value={passenger.document_number || ""}
                  onChange={(e) => updatePassenger(index, "document_number", e.target.value)}
                  placeholder="123456789"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
