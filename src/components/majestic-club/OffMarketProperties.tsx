import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Eye, 
  EyeOff, 
  Lock, 
  Key, 
  Download,
  Shield,
  Star,
  Heart,
  Calendar,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MajesticProtectedRoute } from './MajesticProtectedRoute';
import { useMajesticSubscription } from '@/hooks/useMajesticSubscription';

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  currency: string;
  property_type: 'villa' | 'apartment' | 'mansion' | 'penthouse';
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  images: string[];
  is_available: boolean;
  is_featured: boolean;
  access_level: 'vip' | 'black';
  metadata: Record<string, any>;
  created_at: string;
}

const OffMarketProperties = () => {
  const { toast } = useToast();
  const { getAccessLevel } = useMajesticSubscription();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [revealedProperties, setRevealedProperties] = useState<Set<string>>(new Set());
  const [favoritedProperties, setFavoritedProperties] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    property_type: 'all',
    min_price: '',
    max_price: '',
    location: ''
  });

  useEffect(() => {
    loadProperties();
  }, [filters]);

  const loadProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('majestic_properties')
        .select('*')
        .eq('is_available', true);

      // Apply filters
      if (filters.property_type !== 'all') {
        query = query.eq('property_type', filters.property_type);
      }
      
      if (filters.min_price) {
        query = query.gte('price', parseInt(filters.min_price));
      }
      
      if (filters.max_price) {
        query = query.lte('price', parseInt(filters.max_price));
      }
      
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les propriétés',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevealProperty = (propertyId: string) => {
    setRevealedProperties(prev => new Set([...prev, propertyId]));
  };

  const handleFavoriteProperty = (propertyId: string) => {
    setFavoritedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleRequestAccess = (property: Property) => {
    setSelectedProperty(property);
    setShowRequestForm(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('majestic_service_requests')
        .insert({
          user_id: user.id,
          title: `Demande d'accès: ${selectedProperty.title}`,
          description: `Je souhaite accéder aux informations complètes de la propriété "${selectedProperty.title}" située à ${selectedProperty.location}.`,
          priority: 'high',
          requested_date: new Date().toISOString(),
          notes: `Property ID: ${selectedProperty.id}\nAccess Level: ${selectedProperty.access_level}\nPrice: ${selectedProperty.price.toLocaleString('fr-FR')} ${selectedProperty.currency}`,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Demande envoyée',
        description: 'Votre demande d\'accès confidentiel a été envoyée avec succès',
      });

      setShowRequestForm(false);
      setSelectedProperty(null);
    } catch (error: any) {
      console.error('Error submitting property request:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer votre demande',
        variant: 'destructive'
      });
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('fr-FR')} ${currency}`;
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'black':
        return <Badge className="bg-black text-white border-black">Black Card</Badge>;
      case 'vip':
        return <Badge className="bg-[#D4AF37] text-[#0A192F] border-[#D4AF37]">VIP</Badge>;
      default:
        return null;
    }
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'villa': return <Home className="w-4 h-4" />;
      case 'apartment': return <Home className="w-4 h-4" />;
      case 'mansion': return <Home className="w-4 h-4" />;
      case 'penthouse': return <Home className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const isPropertyRevealed = (propertyId: string) => {
    return revealedProperties.has(propertyId);
  };

  const isPropertyFavorited = (propertyId: string) => {
    return favoritedProperties.has(propertyId);
  };

  const userAccessLevel = getAccessLevel();
  const canAccessProperty = (property: Property) => {
    if (property.access_level === 'vip') {
      return ['access_prive', 'access_black'].includes(userAccessLevel || '');
    }
    if (property.access_level === 'black') {
      return userAccessLevel === 'access_black';
    }
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <MajesticProtectedRoute requiredFeature="properties">
      <div className="min-h-screen bg-[#0A192F] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-serif text-[#F5F5F5] mb-2">Propriétés Exclusives</h1>
                  <p className="text-[#F5F5F5]/80">
                    Accès à des biens immobiliers non visibles publiquement
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#D4AF37] font-medium mb-1">
                    Votre niveau d'accès
                  </div>
                  <div className="text-xl font-bold text-[#D4AF37]">
                    {userAccessLevel === 'access_black' ? 'Black Card' :
                     userAccessLevel === 'access_prive' ? 'Privé' : 'Access'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-[#1E3A5F] bg-[#0A192F]/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-serif text-[#F5F5F5]">Filtres</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-[#F5F5F5]/60 mb-2 block">Type de bien</label>
                    <Select value={filters.property_type} onValueChange={(value) => setFilters(prev => ({ ...prev, property_type: value }))}>
                      <SelectTrigger className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A192F] border-[#1E3A5F]">
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="apartment">Appartement</SelectItem>
                        <SelectItem value="mansion">Mansion</SelectItem>
                        <SelectItem value="penthouse">Penthouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#F5F5F5]/60 mb-2 block">Prix minimum</label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.min_price}
                      onChange={(e) => setFilters(prev => ({ ...prev, min_price: e.target.value }))}
                      className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#F5F5F5]/60 mb-2 block">Prix maximum</label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.max_price}
                      onChange={(e) => setFilters(prev => ({ ...prev, max_price: e.target.value }))}
                      className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#F5F5F5]/60 mb-2 block">Localisation</label>
                    <Input
                      placeholder="Ville ou quartier"
                      value={filters.location}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className={`border-[#1E3A5F] bg-[#0A192F]/50 hover:border-[#D4AF37]/50 transition-all duration-300 group relative overflow-hidden ${property.is_featured ? 'ring-2 ring-[#D4AF37]/30' : ''}`}>
                  {/* Featured Badge */}
                  {property.is_featured && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-[#D4AF37] text-[#0A192F] border-[#D4AF37]">
                        <Star className="w-3 h-3 mr-1" />
                        Exclusif
                      </Badge>
                    </div>
                  )}

                  {/* Access Level Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    {getAccessLevelBadge(property.access_level)}
                  </div>

                  {/* Favorite Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFavoriteProperty(property.id)}
                    className="absolute top-4 right-4 z-10 text-[#F5F5F5]/60 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Heart className={`w-4 h-4 ${isPropertyFavorited(property.id) ? 'fill-current text-red-400' : ''}`} />
                  </Button>

                  {/* Property Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                    
                    {!isPropertyRevealed(property.id) && !canAccessProperty(property) ? (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
                          <p className="text-[#F5F5F5] font-semibold mb-2">Propriété Confidentielle</p>
                          <p className="text-[#F5F5F5]/60 text-sm mb-4">
                            Niveau d'accès requis: {property.access_level === 'black' ? 'Black Card' : 'VIP Privé'}
                          </p>
                          <Button
                            onClick={() => handleRequestAccess(property)}
                            className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0"
                          >
                            Demander l'Accès
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={property.images?.[0] || '/api/placeholder/400/300'}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    
                    {/* Watermark for revealed properties */}
                    {isPropertyRevealed(property.id) && (
                      <div className="absolute bottom-4 left-4 z-10">
                        <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                          <p className="text-xs text-[#D4AF37] font-medium">
                            {userAccessLevel === 'access_black' ? 'Black Card Member' : 'VIP Member'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-[#F5F5F5] text-lg truncate">{property.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3 text-[#D4AF37]" />
                          <span className="text-sm text-[#F5F5F5]/70 truncate">{property.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#D4AF37]">
                          {formatPrice(property.price, property.currency)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Property Features */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <Bed className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                        <p className="text-sm text-[#F5F5F5]">{property.bedrooms}</p>
                        <p className="text-xs text-[#F5F5F5]/60">Chambres</p>
                      </div>
                      <div className="text-center">
                        <Bath className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                        <p className="text-sm text-[#F5F5F5]">{property.bathrooms}</p>
                        <p className="text-xs text-[#F5F5F5]/60">Salles</p>
                      </div>
                      <div className="text-center">
                        <Square className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                        <p className="text-sm text-[#F5F5F5]">{property.area_sqm}</p>
                        <p className="text-xs text-[#F5F5F5]/60">m²</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#F5F5F5]/70 mb-4 line-clamp-2">
                      {property.description}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {canAccessProperty(property) ? (
                        <>
                          {!isPropertyRevealed(property.id) && (
                            <Button
                              onClick={() => handleRevealProperty(property.id)}
                              className="flex-1 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Révéler
                            </Button>
                          )}
                          {isPropertyRevealed(property.id) && (
                            <Button
                              variant="outline"
                              className="flex-1 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          onClick={() => handleRequestAccess(property)}
                          className="flex-1 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0"
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Demander l'Accès
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {properties.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Home className="w-16 h-16 text-[#D4AF37]/30 mx-auto mb-4" />
              <h3 className="text-xl font-serif text-[#F5F5F5] mb-2">Aucune propriété trouvée</h3>
              <p className="text-[#F5F5F5]/60">
                Essayez d'ajuster vos filtres ou revenez plus tard pour découvrir de nouvelles exclusivités
              </p>
            </motion.div>
          )}
        </div>

        {/* Request Access Modal */}
        <AnimatePresence>
          {showRequestForm && selectedProperty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0A192F] border border-[#1E3A5F] rounded-2xl p-8 max-w-2xl w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-serif text-[#F5F5F5]">
                    Demande d'Accès Confidentiel
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={() => setShowRequestForm(false)}
                    className="text-[#F5F5F5]/60 hover:text-[#F5F5F5]"
                  >
                    ×
                  </Button>
                </div>

                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#D4AF37] rounded-xl flex items-center justify-center">
                      <Home className="w-6 h-6 text-[#0A192F]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#F5F5F5]">{selectedProperty.title}</h4>
                      <p className="text-[#F5F5F5]/70">{selectedProperty.location}</p>
                      <p className="text-xl font-bold text-[#D4AF37] mt-2">
                        {formatPrice(selectedProperty.price, selectedProperty.currency)}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitRequest} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm text-[#F5F5F5]/60">Message additionnel</label>
                    <textarea
                      placeholder="Précisez votre intérêt pour cette propriété..."
                      rows={4}
                      className="w-full bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5] rounded-lg p-3"
                    />
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-500 font-medium mb-1">
                          Processus de vérification confidentiel
                        </p>
                        <p className="text-xs text-yellow-500/80">
                          Votre demande sera examinée par notre équipe de sécurité. 
                          Une vérification d'identité peut être requise pour les propriétés Black Card.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRequestForm(false)}
                      className="border-[#1E3A5F] text-[#F5F5F5] hover:bg-[#1E3A5F]"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0 flex-1"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Envoyer la Demande
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MajesticProtectedRoute>
  );
};

export default OffMarketProperties;
