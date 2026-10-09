import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, Filter, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Price } from "@/components/ui/price";
import { useTranslation } from "react-i18next";
import { BookingStatusBadge, BOOKING_STATUS_DOT_COLOR } from "@/components/dashboard/BookingStatusBadge";
import { currentDateFnsLocale } from "@/lib/dateLocale";

interface Booking {
  id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string | null;
  guests: number;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  services: {
    name: string;
    type: string;
    location: string;
  };
}

interface BookingCalendarProps {
  bookings: Booking[];
}

export const BookingCalendar = ({ bookings }: BookingCalendarProps) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (filterStatus !== "all" && booking.status !== filterStatus) return false;
      if (filterType !== "all" && booking.services.type !== filterType) return false;
      return true;
    });
  }, [bookings, filterStatus, filterType]);

  // Get bookings for selected date
  const bookingsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredBookings.filter((booking) => {
      const startDate = parseISO(booking.start_date);
      const endDate = booking.end_date ? parseISO(booking.end_date) : startDate;
      return (
        isSameDay(startDate, selectedDate) ||
        isSameDay(endDate, selectedDate) ||
        (selectedDate >= startDate && selectedDate <= endDate)
      );
    });
  }, [selectedDate, filteredBookings]);

  // Get all dates with bookings in current month
  const datesWithBookings = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    return filteredBookings.reduce((acc, booking) => {
      const startDate = parseISO(booking.start_date);
      const endDate = booking.end_date ? parseISO(booking.end_date) : startDate;
      
      if (startDate >= monthStart && startDate <= monthEnd) {
        const dateKey = format(startDate, "yyyy-MM-dd");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(booking);
      }
      
      return acc;
    }, {} as Record<string, Booking[]>);
  }, [filteredBookings, selectedMonth]);

  // Custom day content to show booking indicators
  const modifiers = useMemo(() => {
    const dates = Object.keys(datesWithBookings).map((dateStr) => parseISO(dateStr));
    return {
      booked: dates,
    };
  }, [datesWithBookings]);

  const modifiersClassNames = {
    booked: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hotel: t("ux.calendar.hotel"),
      flight: "Vol",
      car: "Voiture",
      tour: "Tour",
      event: t("ux.calendar.event"),
      flight_hotel: t("ux.calendar.flightHotel"),
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("ux.calendar.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Statut</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t("ux.calendar.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("ux.calendar.allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("ux.calendar.pending")}</SelectItem>
                <SelectItem value="confirmed">{t("ux.calendar.confirmed")}</SelectItem>
                <SelectItem value="completed">{t("ux.calendar.completed")}</SelectItem>
                <SelectItem value="cancelled">{t("ux.calendar.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">{t("ux.calendar.serviceType")}</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder={t("ux.calendar.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("ux.calendar.allTypes")}</SelectItem>
                <SelectItem value="hotel">{t("ux.calendar.hotel")}</SelectItem>
                <SelectItem value="flight">Vol</SelectItem>
                <SelectItem value="car">Voiture</SelectItem>
                <SelectItem value="tour">Tour</SelectItem>
                <SelectItem value="event">{t("ux.calendar.event")}</SelectItem>
                <SelectItem value="flight_hotel">{t("ux.calendar.flightHotel")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilterStatus("all");
                setFilterType("all");
              }}
            >
              {t("ux.calendar.reset")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t("ux.calendar.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              locale={currentDateFnsLocale()}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className={cn("rounded-md border pointer-events-auto")}
            />
          </CardContent>
        </Card>

        {/* Bookings for selected date */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Réservations du ${format(selectedDate, "d MMMM yyyy", { locale: currentDateFnsLocale() })}`
                : t("ux.calendar.pickDate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsForSelectedDate.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("ux.calendar.noneOnDate")}
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {bookingsForSelectedDate.map((booking) => (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{booking.services.name}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.services.location}
                        </p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {booking.guests} voyageur{booking.guests > 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold">
                        <Price amount={Number(booking.total_price)} fromCurrency={booking.currency} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("ux.calendar.details")}</DialogTitle>
            <DialogDescription>
              #{selectedBooking?.id.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Service</label>
                  <p className="font-semibold">{selectedBooking.services.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="font-semibold">
                    {getServiceTypeLabel(selectedBooking.services.type)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Destination</label>
                  <p className="font-semibold">{selectedBooking.services.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <BookingStatusBadge status={selectedBooking.status} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("ux.calendar.startDate")}</label>
                  <p className="font-semibold">
                    {format(parseISO(selectedBooking.start_date), "d MMMM yyyy", { locale: currentDateFnsLocale() })}
                  </p>
                </div>
                {selectedBooking.end_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("ux.calendar.endDate")}</label>
                    <p className="font-semibold">
                      {format(parseISO(selectedBooking.end_date), "d MMMM yyyy", { locale: currentDateFnsLocale() })}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Voyageurs</label>
                  <p className="font-semibold">
                    {selectedBooking.guests} personne{selectedBooking.guests > 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("ux.calendar.total")}</label>
                  <p className="font-semibold">
                    <Price amount={Number(selectedBooking.total_price)} fromCurrency={selectedBooking.currency} showLoader />
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Client</label>
                  <p className="font-semibold">{selectedBooking.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.customer_email}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.customer_phone}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("ux.calendar.legend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(BOOKING_STATUS_DOT_COLOR).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", color)} />
                <span className="text-sm">
                  {t(`booking.status.${status}`, status)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
