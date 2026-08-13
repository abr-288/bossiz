import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HotelBookingDialog } from "@/components/HotelBookingDialog";
import { HotelRoomDetailsDialog } from "@/components/HotelRoomDetailsDialog";
import { HotelComparisonDialog } from "@/components/HotelComparisonDialog";
import HotelsWidget from "@/components/HotelsWidget";
import { useTranslation } from "react-i18next";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerHotels from "@/assets/banner-hotels.jpg";

const Hotels = () => {
  const { t } = useTranslation();

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
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src={bannerHotels}
          alt={t('pages.hotels.title')}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{t('pages.hotels.title')}</h1>
            <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto">{t('pages.hotels.subtitle')}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <HotelsWidget />
      </main>

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
