import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BedDouble, Hotel } from "lucide-react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { HotelRoomsManager } from "@/components/agency/HotelRoomsManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerPortal } from "@/hooks/usePartnerPortal";

// Tarifs et disponibilités des hôtels : types de chambres, tarifs et stock,
// gérés comme depuis « Chambres & tarifs » du catalogue.
export default function AgencyRates() {
  const { t } = useTranslation();
  const { data: portal } = usePartnerPortal();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const hotels = useQuery({
    queryKey: ["partner-hotels", portal?.agency_id],
    enabled: !!portal?.agency_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, location, available")
        .eq("agency_id", portal!.agency_id)
        .eq("type", "hotel")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("ux.partner.rates.title")}</h1>
          <p className="text-muted-foreground">{t("ux.partner.rates.subtitle")}</p>
        </div>

        {hotels.isLoading ? (
          <p className="text-muted-foreground">{t("ux.partner.loading")}</p>
        ) : (hotels.data ?? []).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
              <Hotel className="h-10 w-10" />
              <p>{t("ux.partner.rates.empty")}</p>
              <Button asChild>
                <Link to="/agency/services?type=hotel">{t("ux.partner.rates.addHotel")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(hotels.data ?? []).map((hotel) => (
              <Card key={hotel.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{hotel.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{hotel.location}</p>
                    {!hotel.available && (
                      <Badge variant="outline" className="mt-1">
                        {t("ux.partner.rates.unavailable")}
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setSelected({ id: hotel.id, name: hotel.name })}>
                    <BedDouble className="mr-2 h-4 w-4" />
                    {t("ux.partner.rates.manage")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <HotelRoomsManager
          serviceId={selected.id}
          hotelName={selected.name}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
          onChanged={() => hotels.refetch()}
        />
      )}
    </AgencyLayout>
  );
}
