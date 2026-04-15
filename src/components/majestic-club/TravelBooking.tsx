import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plane, 
  Hotel, 
  Home, 
  Car, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Star, 
  Search, 
  Filter,
  ArrowRight,
  CreditCard,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MajesticProtectedRoute } from './MajesticProtectedRoute';

interface TravelService {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'villa' | 'chauffeur' | 'yacht' | 'jet';
  description: string;
  base_price: number;
  currency: string;
  image_url?: string;
  features: string[];
  availability: boolean;
  metadata: Record<string, any>;
}

interface BookingForm {
  service_type: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  passengers?: number;
  rooms?: number;
  special_requests?: string;
}

const TravelBooking = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<TravelService[]>([]);
  const [selectedService, setSelectedService] = useState<TravelService | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    service_type: 'flight',
    passengers: 1,
    rooms: 1
  });
  const [searchResults, setSearchResults] = useState<TravelService[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    price_range: 'all',
    features: 'all'
  });

  useEffect(() => {
    loadServices();
  }, [filters]);

  const loadServices = async () => {
    try {
      // Mock data for luxury travel services
      const mockServices: TravelService[] = [
        {
          id: '1',
          name: 'Jet Privé - Citation XLS',
          type: 'jet',
          description: 'Jet privé ultra-luxueux pour vols intercontinentaux',
          base_price: 1500000,
          currency: 'XOF',
          image_url: '/api/placeholder/400/300',
          features: ['Sièges en cuir', 'Suite privée', 'Chef personnel', 'WiFi satellite'],
          availability: true,
          metadata: { capacity: 12, range: 5800 }
        },
        {
          id: '2',
          name: 'Suite Présidentielle - Hôtel Crillon',
          type: 'hotel',
          description: 'Suite présidentielle avec vue sur la Tour Eiffel',
          base_price: 850000,
          currency: 'XOF',
          image_url: '/api/placeholder/400/300',
          features: ['Butler personnel', 'Accès spa privé', 'Transfert aéroport', 'Petit-déjeuner gourmet'],
          availability: true,
          metadata: { rooms: 3, size: '250m²' }
        },
        {
          id: '3',
          name: 'Villa de Luxe - Saint-Tropez',
          type: 'villa',
          description: 'Villa privée avec piscine et accès direct à la mer',
          base_price: 1200000,
          currency: 'XOF',
          image_url: '/api/placeholder/400/300',
          features: ['Piscine infinie', 'Personnel de maison', 'Yacht inclus', 'Sécurité privée'],
          availability: true,
          metadata: { bedrooms: 6, bathrooms: 8, area: '1200m²' }
        },
        {
          id: '4',
          name: 'Chauffeur Personnel - Mercedes S-Class',
          type: 'chauffeur',
          description: 'Chauffeur professionnel avec véhicule de luxe',
          base_price: 150000,
          currency: 'XOF',
          image_url: '/api/placeholder/400/300',
          features: ['Disponibilité 24/7', 'Véhicules multiples', 'Formation sécurité', 'Multilingue'],
          availability: true,
          metadata: { vehicle_type: 'Mercedes S-Class', languages: ['FR', 'EN', 'DE'] }
        },
        {
          id: '5',
          name: 'Yacht de Luxe - Azimut S7',
          type: 'yacht',
          description: 'Yacht moderne avec équipage complet',
          base_price: 2500000,
          currency: 'XOF',
          image_url: '/api/placeholder/400/300',
          features: ['Équipage professionnel', 'Équipements de plongée', 'Jet ski', 'Cuisine gastronomique'],
          availability: true,
          metadata: { length: '21m', cabins: 4, capacity: 12 }
        },
        {
          id: '6',
          name: 'Vol First Class - Paris-New York',
          type: 'flight',
          description: 'Vol premium en classe affaires avec tous les privilèges',
          base_price: 3500000,
          currency: 'XOF',
          image_url: '/api/placeholder/400/300',
          features: ['Suite privée', 'Chef personnel', 'Spa à bord', 'Lounge accès prioritaire'],
          availability: true,
          metadata: { airline: 'Air France', duration: '8h', aircraft: 'A380' }
        }
      ];

      // Apply filters
      let filteredServices = mockServices;
      
      if (filters.type !== 'all') {
        filteredServices = filteredServices.filter(s => s.type === filters.type);
      }
      
      if (filters.price_range !== 'all') {
        filteredServices = filteredServices.filter(s => {
          switch (filters.price_range) {
            case 'budget': return s.base_price < 500000;
            case 'premium': return s.base_price >= 500000 && s.base_price < 1500000;
            case 'luxury': return s.base_price >= 1500000 && s.base_price < 3000000;
            case 'ultra': return s.base_price >= 3000000;
            default: return true;
          }
        });
      }

      setServices(filteredServices);
      setSearchResults(filteredServices);
    } catch (error) {
      console.error('Error loading travel services:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les services de voyage',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults(services);
      return;
    }

    const filtered = services.filter(service => 
      service.name.toLowerCase().includes(query.toLowerCase()) ||
      service.description.toLowerCase().includes(query.toLowerCase()) ||
      service.features.some(f => f.toLowerCase().includes(query.toLowerCase()))
    );
    
    setSearchResults(filtered);
  };

  const handleBookService = (service: TravelService) => {
    setSelectedService(service);
    setBookingForm(prev => ({
      ...prev,
      service_type: service.type
    }));
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create booking
      const { error } = await supabase
        .from('majestic_bookings')
        .insert({
          user_id: user.id,
          booking_type: selectedService.type,
          title: selectedService.name,
          description: selectedService.description,
          start_date: bookingForm.departure_date || new Date().toISOString(),
          end_date: bookingForm.return_date,
          location: bookingForm.destination || 'À déterminer',
          status: 'pending',
          total_amount: selectedService.base_price,
          currency: selectedService.currency,
          metadata: {
            ...selectedService.metadata,
            booking_details: bookingForm
          }
        });

      if (error) throw error;

      toast({
        title: 'Réservation créée',
        description: 'Votre demande de réservation a été envoyée avec succès',
      });

      setShowBookingModal(false);
      setSelectedService(null);
      setBookingForm({
        service_type: 'flight',
        passengers: 1,
        rooms: 1
      });
    } catch (error: any) {
      console.error('Error submitting booking:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer votre réservation',
        variant: 'destructive'
      });
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-6 h-6" />;
      case 'hotel': return <Hotel className="w-6 h-6" />;
      case 'villa': return <Home className="w-6 h-6" />;
      case 'chauffeur': return <Car className="w-6 h-6" />;
      case 'yacht':
      case 'jet': return <Plane className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('fr-FR')} ${currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <MajesticProtectedRoute>
      <div className="min-h-screen bg-[#0A192F] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-2xl p-8">
              <div className="text-center">
                <h1 className="text-4xl font-serif text-[#F5F5F5] mb-4">Réservations de Luxe</h1>
                <p className="text-[#F5F5F5]/80 text-lg max-w-2xl mx-auto">
                  Accédez à des services de voyage exclusifs : jets privés, yachts, suites présidentielles et villas de prestige
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-[#1E3A5F] bg-[#0A192F]/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-serif text-[#F5F5F5]">Recherche et Filtres</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Rechercher un service de voyage..."
                      onChange={(e) => handleSearch(e.target.value)}
                      className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5] placeholder-[#F5F5F5]/40"
                    />
                  </div>
                  
                  <div>
                    <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]">
                        <SelectValue placeholder="Type de service" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A192F] border-[#1E3A5F]">
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="flight">Vols</SelectItem>
                        <SelectItem value="hotel">Hôtels</SelectItem>
                        <SelectItem value="villa">Villas</SelectItem>
                        <SelectItem value="chauffeur">Chauffeurs</SelectItem>
                        <SelectItem value="yacht">Yachts</SelectItem>
                        <SelectItem value="jet">Jets privés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Select value={filters.price_range} onValueChange={(value) => setFilters(prev => ({ ...prev, price_range: value }))}>
                      <SelectTrigger className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]">
                        <SelectValue placeholder="Gamme de prix" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A192F] border-[#1E3A5F]">
                        <SelectItem value="all">Tous les prix</SelectItem>
                        <SelectItem value="budget">Budget (&lt;500k)</SelectItem>
                        <SelectItem value="premium">Premium (500k-1.5M)</SelectItem>
                        <SelectItem value="luxury">Luxe (1.5M-3M)</SelectItem>
                        <SelectItem value="ultra">Ultra-Luxe (&gt;3M)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Service Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-[#0A192F]/50 border border-[#1E3A5F]">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A192F]">
                  Tous
                </TabsTrigger>
                <TabsTrigger value="flight" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A192F]">
                  Vols
                </TabsTrigger>
                <TabsTrigger value="accommodation" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A192F]">
                  Hébergement
                </TabsTrigger>
                <TabsTrigger value="transport" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A192F]">
                  Transport
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {searchResults.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="border-[#1E3A5F] bg-[#0A192F]/50 hover:border-[#D4AF37]/50 transition-all duration-300 group overflow-hidden">
                  {/* Service Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.image_url || '/api/placeholder/400/300'}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-[#D4AF37] text-[#0A192F] border-[#D4AF37]">
                        {service.type === 'flight' ? 'Vol' :
                         service.type === 'hotel' ? 'Hôtel' :
                         service.type === 'villa' ? 'Villa' :
                         service.type === 'chauffeur' ? 'Chauffeur' :
                         service.type === 'yacht' ? 'Yacht' : 'Jet'}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="w-10 h-10 bg-[#D4AF37]/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                        {getServiceIcon(service.type)}
                      </div>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#F5F5F5] text-lg group-hover:text-[#D4AF37] transition-colors">
                      {service.name}
                    </CardTitle>
                    <p className="text-[#F5F5F5]/60 text-sm line-clamp-2">
                      {service.description}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Features */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {service.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {service.features.length > 3 && (
                          <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] text-xs">
                            +{service.features.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price and Booking */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-[#D4AF37]">
                          {formatPrice(service.base_price, service.currency)}
                        </div>
                        <div className="text-xs text-[#F5F5F5]/40">
                          Prix de base
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleBookService(service)}
                        className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0"
                      >
                        Réserver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {searchResults.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Search className="w-16 h-16 text-[#D4AF37]/30 mx-auto mb-4" />
              <h3 className="text-xl font-serif text-[#F5F5F5] mb-2">Aucun service trouvé</h3>
              <p className="text-[#F5F5F5]/60">
                Essayez d'ajuster vos filtres ou votre recherche
              </p>
            </motion.div>
          )}
        </div>

        {/* Booking Modal */}
        {showBookingModal && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0A192F] border border-[#1E3A5F] rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif text-[#F5F5F5]">
                  Réserver: {selectedService.name}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowBookingModal(false)}
                  className="text-[#F5F5F5]/60 hover:text-[#F5F5F5]"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmitBooking} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-[#F5F5F5]/60">Lieu de départ</label>
                    <Input
                      placeholder="Ville ou aéroport"
                      value={bookingForm.origin || ''}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, origin: e.target.value }))}
                      className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-[#F5F5F5]/60">Destination</label>
                    <Input
                      placeholder="Ville ou aéroport"
                      value={bookingForm.destination || ''}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, destination: e.target.value }))}
                      className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-[#F5F5F5]/60">Date de départ</label>
                    <Input
                      type="datetime-local"
                      value={bookingForm.departure_date || ''}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, departure_date: e.target.value }))}
                      className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-[#F5F5F5]/60">Date de retour</label>
                    <Input
                      type="datetime-local"
                      value={bookingForm.return_date || ''}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, return_date: e.target.value }))}
                      className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-[#F5F5F5]/60">Nombre de passagers</label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={bookingForm.passengers || 1}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                      className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]"
                    />
                  </div>
                  
                  {(selectedService.type === 'hotel' || selectedService.type === 'villa') && (
                    <div className="space-y-2">
                      <label className="text-sm text-[#F5F5F5]/60">Nombre de chambres</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={bookingForm.rooms || 1}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, rooms: parseInt(e.target.value) }))}
                        className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#F5F5F5]/60">Demandes spéciales</label>
                  <textarea
                    placeholder="Précisez vos besoins spécifiques..."
                    rows={3}
                    value={bookingForm.special_requests || ''}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, special_requests: e.target.value }))}
                    className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5] w-full"
                  />
                </div>

                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#D4AF37] font-medium">Total estimé</p>
                      <p className="text-2xl font-bold text-[#D4AF37]">
                        {formatPrice(selectedService.base_price, selectedService.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#F5F5F5]/40">Prix de base</p>
                      <p className="text-xs text-[#F5F5F5]/40">Peut varier selon les options</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBookingModal(false)}
                    className="border-[#1E3A5F] text-[#F5F5F5] hover:bg-[#1E3A5F]"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0 flex-1"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirmer la Réservation
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </MajesticProtectedRoute>
  );
};

export default TravelBooking;
