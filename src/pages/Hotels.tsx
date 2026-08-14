import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HotelBookingDialog } from "@/components/HotelBookingDialog";
import { HotelRoomDetailsDialog } from "@/components/HotelRoomDetailsDialog";
import { HotelComparisonDialog } from "@/components/HotelComparisonDialog";
import HotelsWidget from "@/components/HotelsWidget";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerHotels from "@/assets/banner-hotels.jpg";
import { BadgePercent, ShieldCheck, Headphones } from "lucide-react";

const reassurancePoints = [
  {
    icon: BadgePercent,
    title: "Meilleurs prix",
    description: "Comparez les offres de nos partenaires pour réserver au meilleur tarif disponible.",
  },
  {
    icon: ShieldCheck,
    title: "Réservation sécurisée",
    description: "Chaque réservation est finalisée directement chez nos partenaires certifiés (Booking.com, Expedia...).",
  },
  {
    icon: Headphones,
    title: "Support B-Reserve",
    description: "Notre équipe reste disponible pour vous accompagner avant, pendant et après votre séjour.",
  },
];

const Hotels = () => {
  // Ces dialogues restent en place mais inactifs (rien ne les déclenche plus
  // depuis que la recherche passe par le widget Stay22) : à réactiver quand
  // une vraie source de données propriétaire sera branchée.
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roomDetailsOpen, setRoomDetailsOpen] = useState(false);
  const [selectedHotels, setSelectedHotels] = useState<any[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const removeHotelFromComparison = (hotelId: string | number) => {
    setSelectedHotels((prev) => prev.filter((h) => h.id !== hotelId));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative min-h-[40vh] md:min-h-[46vh] flex items-center justify-center overflow-hidden pb-16 md:pb-20">
        <LazyImage
          src={bannerHotels}
          alt="Trouvez votre hôtel à Abidjan"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        <div className="relative z-10 container mx-auto px-4 text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
            Trouvez votre hôtel à Abidjan
          </h1>
        </div>
      </div>

      {/* Carte du widget, qui chevauche légèrement le bas du hero */}
      <div className="container mx-auto px-4 -mt-14 md:-mt-16 relative z-20">
        <HotelsWidget />
      </div>

      {/* Réassurance */}
      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {reassurancePoints.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#00F59B]/15">
                <Icon className="w-7 h-7 text-[#00F59B]" strokeWidth={2.2} />
              </div>
              <h3 className="text-lg font-semibold text-[#192443]">{title}</h3>
              <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {selectedHotel && (
        <>
          <HotelRoomDetailsDialog
            open={roomDetailsOpen}
            onOpenChange={setRoomDetailsOpen}
            hotel={selectedHotel}
            onBookNow={() => {
              setRoomDetailsOpen(false);
              setDialogOpen(true);
            }}
          />
          <HotelBookingDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            hotel={selectedHotel}
          />
        </>
      )}

      <HotelComparisonDialog
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        hotels={selectedHotels}
        onRemoveHotel={removeHotelFromComparison}
        onBookHotel={(hotel) => {
          setSelectedHotel({
            id: hotel.id.toString(),
            name: hotel.name,
            location: hotel.location,
            price: hotel.price,
            offerSignature: (hotel as any).offerSignature,
            offerExpiresAt: (hotel as any).offerExpiresAt,
          });
          setDialogOpen(true);
        }}
      />

      <Footer />
    </div>
  );
};

export default Hotels;
