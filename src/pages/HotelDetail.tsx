import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { HotelAvailabilityTable, type RoomSelection } from "@/components/hotels/HotelAvailabilityTable";
import {
  addDays,
  isoDate,
  nightsBetween,
  parseHotelSpecs,
  parseStringList,
  type HotelRate,
  type HotelRoomType,
} from "@/lib/hotels";
import {
  Car,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  Dumbbell,
  Images,
  MapPin,
  Plane,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  ThumbsUp,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wine,
  type LucideIcon,
} from "lucide-react";

const AMENITY_ICONS: [string, LucideIcon][] = [
  ["wi-fi", Wifi],
  ["wifi", Wifi],
  ["parking", Car],
  ["piscine", Waves],
  ["plage", Waves],
  ["climatisation", Snowflake],
  ["restaurant", UtensilsCrossed],
  ["bar", Wine],
  ["petit-déjeuner", Coffee],
  ["réception", Clock],
  ["navette", Plane],
  ["sport", Dumbbell],
  ["spa", Sparkles],
  ["famil", Users],
  ["sécurité", ShieldCheck],
];

const amenityIcon = (label: string): LucideIcon => {
  const lower = label.toLowerCase();
  return AMENITY_ICONS.find(([key]) => lower.includes(key))?.[1] ?? Check;
};

interface HotelService {
  id: string;
  name: string;
  description: string | null;
  location: string;
  maps_url: string | null;
  image_url: string | null;
  images: string[] | null;
  amenities: unknown;
  specifications: unknown;
  rating: number | null;
  total_reviews: number | null;
}

// Fiche d'un hôtel partenaire façon Booking : galerie, présentation, points
// forts, équipements, puis le tableau de disponibilités (types de chambre,
// voyageurs, tarif du séjour, options, sélection).
export default function HotelDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tomorrow = addDays(isoDate(new Date()), 1);
  const initialCheckIn = searchParams.get("checkin") || tomorrow;
  const [checkIn, setCheckIn] = useState(initialCheckIn >= isoDate(new Date()) ? initialCheckIn : tomorrow);
  const [checkOut, setCheckOut] = useState(() => {
    const fromUrl = searchParams.get("checkout");
    return fromUrl && fromUrl > initialCheckIn ? fromUrl : addDays(initialCheckIn, 1);
  });
  const [guests, setGuests] = useState(() => Math.min(Math.max(Number(searchParams.get("adults")) || 2, 1), 30));
  const [galleryOpen, setGalleryOpen] = useState(false);
  const nights = nightsBetween(checkIn, checkOut);

  useEffect(() => {
    setSearchParams({ checkin: checkIn, checkout: checkOut, adults: String(guests) }, { replace: true });
  }, [checkIn, checkOut, guests, setSearchParams]);

  const hotelQuery = useQuery({
    queryKey: ["partner-hotel", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: hotel, error } = await supabase
        .from("services")
        .select("id, name, description, location, maps_url, image_url, images, amenities, specifications, rating, total_reviews")
        .eq("id", id!)
        .eq("type", "hotel")
        .eq("available", true)
        .maybeSingle();
      if (error) throw error;
      if (!hotel) return null;

      const { data: roomTypes, error: roomError } = await supabase
        .from("hotel_room_types")
        .select("*")
        .eq("service_id", hotel.id)
        .eq("is_active", true)
        .order("sort_order")
        .order("created_at");
      if (roomError) throw roomError;

      const roomIds = (roomTypes || []).map((r) => r.id);
      const { data: rates, error: rateError } = roomIds.length
        ? await supabase.from("hotel_rates").select("*").in("room_type_id", roomIds).eq("is_active", true)
        : { data: [], error: null };
      if (rateError) throw rateError;

      return {
        hotel: hotel as HotelService,
        roomTypes: (roomTypes || []) as HotelRoomType[],
        rates: (rates || []) as HotelRate[],
      };
    },
  });

  const availabilityQuery = useQuery({
    queryKey: ["partner-hotel-availability", id, checkIn, checkOut],
    enabled: !!id && nights > 0 && !!hotelQuery.data,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("hotel_room_availability", {
        p_service_id: id!,
        p_check_in: checkIn,
        p_check_out: checkOut,
      });
      if (error) throw error;
      return Object.fromEntries((data || []).map((row) => [row.room_type_id, row.available_units])) as Record<string, number>;
    },
  });

  const hotel = hotelQuery.data?.hotel;
  const specs = useMemo(() => parseHotelSpecs((hotel?.specifications ?? null) as never), [hotel]);
  const amenities = useMemo(() => parseStringList((hotel?.amenities ?? null) as never), [hotel]);
  const photos = useMemo(() => {
    const list = hotel?.images?.length ? hotel.images : hotel?.image_url ? [hotel.image_url] : [];
    return list.filter(Boolean);
  }, [hotel]);

  const handleReserve = (selections: RoomSelection[]) => {
    // Étape 2 : création de la réservation multi-logements et paiement.
    console.info("Sélection", selections);
    toast.info("La réservation en ligne de ces logements arrive très bientôt. Contactez-nous pour réserver dès maintenant.");
  };

  const scrollToAvailability = () =>
    document.getElementById("disponibilites")?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (hotelQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-10">
          <div className="h-8 w-1/2 rounded bg-muted animate-pulse mb-4" />
          <div className="h-80 rounded-lg bg-muted animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Hôtel introuvable</h1>
          <p className="text-muted-foreground mb-6">Cet établissement n'est plus disponible à la réservation.</p>
          <Button asChild><Link to="/hotels-partenaires">Voir les hôtels partenaires</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 space-y-8">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:underline">Accueil</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/hotels-partenaires" className="hover:underline">Hôtels</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1">{hotel.name}</span>
        </nav>

        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1.5">
            {specs.stars > 0 && (
              <div className="flex items-center gap-0.5" aria-label={`${specs.stars} étoiles`}>
                {Array.from({ length: specs.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold">{hotel.name}</h1>
            <p className="flex items-start gap-1.5 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
              <span>
                {hotel.location}
                {hotel.maps_url && (
                  <>
                    {" – "}
                    <a href={hotel.maps_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                      Voir sur la carte
                    </a>
                  </>
                )}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(hotel.total_reviews ?? 0) > 0 && hotel.rating && (
              <div className="flex items-center gap-2">
                <div className="text-right text-sm">
                  <p className="font-semibold">Note des clients</p>
                  <p className="text-xs text-muted-foreground">{hotel.total_reviews} avis</p>
                </div>
                <span className="rounded-md rounded-bl-none bg-primary px-2 py-1.5 text-lg font-bold text-primary-foreground">
                  {(Number(hotel.rating) * 2).toFixed(1)}
                </span>
              </div>
            )}
            <Button size="lg" onClick={scrollToAvailability}>Réserver</Button>
          </div>
        </div>

        {/* Galerie */}
        {photos.length > 0 && (
          <div className="relative grid grid-cols-4 grid-rows-2 gap-2 h-64 md:h-[26rem] rounded-lg overflow-hidden">
            {photos.slice(0, 5).map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setGalleryOpen(true)}
                className={`relative overflow-hidden bg-muted ${
                  i === 0
                    ? photos.length === 1 ? "col-span-4 row-span-2" : "col-span-4 md:col-span-2 row-span-2"
                    : "hidden md:block"
                }`}
              >
                <img src={url} alt={`${hotel.name} - photo ${i + 1}`} className="h-full w-full object-cover transition-transform hover:scale-105" />
              </button>
            ))}
            {photos.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-3 right-3 shadow"
                onClick={() => setGalleryOpen(true)}
              >
                <Images className="h-4 w-4 mr-1.5" />
                Voir les {photos.length} photos
              </Button>
            )}
          </div>
        )}

        {/* Présentation + points forts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {hotel.description && (
              <section>
                <h2 className="text-xl font-bold mb-3">À propos de l'établissement</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line">{hotel.description}</p>
              </section>
            )}
            {amenities.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-3">Équipements les plus populaires</h2>
                <ul className="flex flex-wrap gap-x-6 gap-y-3">
                  {amenities.map((amenity) => {
                    const Icon = amenityIcon(amenity);
                    return (
                      <li key={amenity} className="flex items-center gap-2 text-sm">
                        <Icon className="h-5 w-5 text-success" />
                        {amenity}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
          <Card className="h-fit bg-primary/5 border-primary/20">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-bold">Points forts de l'établissement</h2>
              {specs.highlights.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {specs.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2"><ThumbsUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />{h}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{hotel.location}</p>
              )}
              <div className="text-sm space-y-1 border-t pt-3">
                <p className="flex items-center gap-2"><Clock className="h-4 w-4" />Arrivée à partir de {specs.checkInFrom}</p>
                <p className="flex items-center gap-2"><Clock className="h-4 w-4" />Départ jusqu'à {specs.checkOutUntil}</p>
              </div>
              <Button className="w-full" onClick={scrollToAvailability}>Réserver</Button>
            </CardContent>
          </Card>
        </div>

        {/* Disponibilités */}
        <section id="disponibilites" className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-bold">Disponibilités</h2>
          <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_10rem] gap-3 rounded-lg border-2 border-gold bg-gold/10 p-3">
            <div className="space-y-1">
              <Label htmlFor="hotel-checkin" className="text-xs">Arrivée</Label>
              <Input
                id="hotel-checkin"
                type="date"
                min={isoDate(new Date())}
                value={checkIn}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  setCheckIn(value);
                  if (checkOut <= value) setCheckOut(addDays(value, 1));
                }}
                className="bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hotel-checkout" className="text-xs">Départ</Label>
              <Input
                id="hotel-checkout"
                type="date"
                min={addDays(checkIn, 1)}
                max={addDays(checkIn, 60)}
                value={checkOut}
                onChange={(e) => e.target.value && setCheckOut(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1 col-span-2 md:col-span-1">
              <Label htmlFor="hotel-guests" className="text-xs">Voyageurs</Label>
              <Input
                id="hotel-guests"
                type="number"
                min={1}
                max={30}
                value={guests}
                onChange={(e) => setGuests(Math.min(Math.max(Number(e.target.value) || 1, 1), 30))}
                className="bg-background"
              />
            </div>
          </div>
          {nights === 0 ? (
            <p className="text-sm text-destructive">La date de départ doit être après la date d'arrivée.</p>
          ) : availabilityQuery.isError ? (
            <p className="text-sm text-destructive">Impossible de vérifier les disponibilités. Réessayez dans un instant.</p>
          ) : (
            <HotelAvailabilityTable
              key={`${checkIn}_${checkOut}`}
              roomTypes={hotelQuery.data?.roomTypes ?? []}
              rates={hotelQuery.data?.rates ?? []}
              availability={availabilityQuery.data}
              nights={nights}
              guests={guests}
              onReserve={handleReserve}
            />
          )}
        </section>

        {/* Règlement */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Règlement intérieur</h2>
          <div className="rounded-lg border divide-y text-sm">
            <div className="grid grid-cols-[8rem_1fr] gap-4 p-4">
              <span className="font-semibold">Arrivée</span>
              <span>À partir de {specs.checkInFrom}</span>
            </div>
            <div className="grid grid-cols-[8rem_1fr] gap-4 p-4">
              <span className="font-semibold">Départ</span>
              <span>Jusqu'à {specs.checkOutUntil}</span>
            </div>
            {specs.houseRules && (
              <div className="grid grid-cols-[8rem_1fr] gap-4 p-4">
                <span className="font-semibold">À savoir</span>
                <span className="whitespace-pre-line">{specs.houseRules}</span>
              </div>
            )}
          </div>
        </section>
      </main>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{hotel.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {photos.map((url, i) => (
              <img key={url} src={url} alt={`${hotel.name} - photo ${i + 1}`} className="w-full rounded object-cover aspect-[4/3]" />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
