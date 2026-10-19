import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, ArrowRight } from "lucide-react";
import { currentLocaleTag } from "@/lib/dateLocale";

interface Booking {
  id: string;
  start_date: string;
  services: {
    name: string;
    type: string;
  };
}

interface UpcomingRemindersProps {
  bookings: Booking[];
  onViewDetails: (id: string) => void;
}

export const UpcomingReminders = ({ bookings, onViewDetails }: UpcomingRemindersProps) => {
  const upcomingBookings = bookings
    .filter((booking) => {
      const startDate = new Date(booking.start_date);
      const today = new Date();
      const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 3);

  if (upcomingBookings.length === 0) {
    return null;
  }

  const getDaysUntil = (date: string) => {
    const startDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    return `Dans ${diffDays} jours`;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Prochains départs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingBookings.map((booking) => (
          <div
            key={booking.id}
            className="flex items-center justify-between p-3 bg-background rounded-lg border"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{booking.services.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                {new Date(booking.start_date).toLocaleDateString(currentLocaleTag(), {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-semibold">
                {getDaysUntil(booking.start_date)}
              </Badge>
              <Button
                aria-label="Voir le détail"
                variant="ghost"
                size="icon"
                onClick={() => onViewDetails(booking.id)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
