import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Train, Clock, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Price } from "@/components/ui/price";

interface TrainResult {
  id: string;
  operator: string;
  trainNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  class: string;
  availableSeats: number;
}

interface TrainResultsProps {
  trains: TrainResult[];
}

export const TrainResults = ({ trains }: TrainResultsProps) => {
  const { t } = useTranslation();

  if (!trains || trains.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">
        {trains.length} {t("search.results")}
      </h2>
      <div className="space-y-4">
        {trains.map((train) => (
          <Card key={train.id} className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Train className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">
                    {train.operator} - {train.trainNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      <span>{t("search.from")}</span>
                    </div>
                    <p className="font-semibold">{train.origin}</p>
                    <p className="text-lg">{train.departureTime}</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{train.duration}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      <span>{t("search.to")}</span>
                    </div>
                    <p className="font-semibold">{train.destination}</p>
                    <p className="text-lg">{train.arrivalTime}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {t("search.class.title")}: <span className="font-medium text-foreground">{train.class}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {train.availableSeats} {t("search.seatsAvailable")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    <Price amount={train.price} fromCurrency={train.currency} showLoader />
                  </p>
                </div>
                <Button className="w-full md:w-auto">{t("search.book")}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
