import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Hammer, Loader2, Phone, MessageCircle } from "lucide-react";
import { useArtisans } from "@/hooks/useArtisans";
import { Price } from "@/components/ui/price";

const CRAFT_TYPES = ["Sculpture sur bois", "Bijoux & Accessoires", "Textile & Tissage", "Poterie & Céramique", "Maroquinerie", "Peinture & Art", "Vannerie", "Autre"];

const waLink = (whatsapp: string, message: string) =>
  `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;

const Artisans = () => {
  const { artisans, loading, error } = useArtisans();
  const [search, setSearch] = useState("");
  const [craftFilter, setCraftFilter] = useState("all");
  const [selectedArtisan, setSelectedArtisan] = useState<any>(null);

  const filtered = useMemo(() => {
    let result = artisans;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(s) || a.location.toLowerCase().includes(s) || a.craft_type.toLowerCase().includes(s)
      );
    }
    if (craftFilter !== "all") {
      result = result.filter(a => a.craft_type === craftFilter);
    }
    return result;
  }, [artisans, search, craftFilter]);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      <div className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-secondary via-secondary to-primary">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <Hammer className="w-12 h-12 text-white mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
            Artisans Locaux
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto">
            Découvrez le savoir-faire et les créations d'artisans locaux
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input placeholder="Rechercher un artisan, une ville..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={craftFilter} onValueChange={setCraftFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Métier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les métiers</SelectItem>
              {CRAFT_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-12 text-center text-muted-foreground">
            Impossible de charger les artisans pour le moment.
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Hammer className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">Aucun artisan mis en avant pour le moment</p>
            <p className="text-muted-foreground mb-6">Nos partenaires ajoutent bientôt leurs artisans locaux. Revenez vite !</p>
            <Button variant="outline" asChild>
              <a href="/devenir-partenaire">Vous représentez un artisan ? Rejoignez-nous</a>
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((artisan) => (
              <Card
                key={artisan.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                onClick={() => setSelectedArtisan(artisan)}
              >
                <img
                  src={artisan.image_url || "/placeholder.svg"}
                  alt={artisan.name}
                  className="w-full h-44 object-cover"
                  loading="lazy"
                />
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-1">{artisan.name}</h3>
                  <p className="text-sm text-primary font-medium mb-2">{artisan.craft_type}</p>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{artisan.location}</span>
                  </div>
                  {artisan.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{artisan.bio}</p>
                  )}
                  {artisan.products?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-auto pt-2">
                      {artisan.products.length} création{artisan.products.length > 1 ? "s" : ""} à découvrir
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedArtisan} onOpenChange={(open) => !open && setSelectedArtisan(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedArtisan && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedArtisan.name}</DialogTitle>
              </DialogHeader>

              <img
                src={selectedArtisan.image_url || "/placeholder.svg"}
                alt={selectedArtisan.name}
                className="w-full h-56 object-cover rounded-lg mb-4"
              />

              <div className="space-y-3 mb-6">
                <p className="text-sm text-primary font-medium">{selectedArtisan.craft_type}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{selectedArtisan.address || selectedArtisan.location}</span>
                </div>
                {selectedArtisan.bio && <p className="text-sm text-muted-foreground">{selectedArtisan.bio}</p>}

                <div className="flex flex-wrap gap-3 pt-2">
                  {selectedArtisan.whatsapp && (
                    <Button asChild className="gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white">
                      <a
                        href={waLink(selectedArtisan.whatsapp, `Bonjour, je vous contacte depuis B-Reserve au sujet de vos créations (${selectedArtisan.name}).`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    </Button>
                  )}
                  {selectedArtisan.phone && (
                    <Button variant="outline" asChild className="gap-2">
                      <a href={`tel:${selectedArtisan.phone}`}>
                        <Phone className="w-4 h-4" /> {selectedArtisan.phone}
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {selectedArtisan.products?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Créations</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {selectedArtisan.products.map((product: any, i: number) => (
                      <Card key={i} className="overflow-hidden">
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} className="w-full h-32 object-cover" loading="lazy" />
                        )}
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                          )}
                          {product.price > 0 && (
                            <p className="text-sm font-semibold text-primary mt-2">
                              <Price amount={product.price} fromCurrency={product.currency || "XOF"} />
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Artisans;
