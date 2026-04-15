import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Download, 
  Eye, 
  EyeOff, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Plane, 
  Car, 
  Hotel,
  Key,
  Shield,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MajesticProtectedRoute } from './MajesticProtectedRoute';

interface Booking {
  id: string;
  user_id: string;
  booking_type: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location: string;
  status: string;
  total_amount: number;
  currency: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  user_id: string;
  booking_id?: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  is_encrypted: boolean;
  access_code?: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  booking_id: string;
  title: string;
  description: string;
  event_date: string;
  event_type: string;
  status: string;
  icon: string;
}

const StayManagement = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    date_range: 'all'
  });
  const [revealedDocuments, setRevealedDocuments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load bookings with filters
      let bookingsQuery = supabase
        .from('majestic_bookings' as any)
        .select('*')
        .eq('user_id', user.id);

      if (filters.status !== 'all') {
        bookingsQuery = bookingsQuery.eq('status', filters.status);
      }
      
      if (filters.type !== 'all') {
        bookingsQuery = bookingsQuery.eq('booking_type', filters.type);
      }

      if (filters.date_range !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.date_range) {
          case 'upcoming':
            startDate = now;
            break;
          case 'past':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
            break;
          case 'current':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
            break;
          default:
            startDate = new Date(0);
        }
        
        if (filters.date_range === 'upcoming') {
          bookingsQuery = bookingsQuery.gte('start_date', startDate.toISOString());
        } else {
          bookingsQuery = bookingsQuery.gte('start_date', startDate.toISOString());
        }
      }

      const bookingsResult = await bookingsQuery
        .order('start_date', { ascending: true });

      if (bookingsResult.error) throw bookingsResult.error;

      // Load documents
      const documentsResult = await supabase
        .from('majestic_documents' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (documentsResult.error) throw documentsResult.error;

      setBookings(bookingsResult.data || []);
      setDocuments(documentsResult.data || []);

      // Auto-select first booking for timeline
      if (bookingsData && bookingsData.length > 0 && !selectedBooking) {
        setSelectedBooking(bookingsData[0]);
        loadTimelineEvents(bookingsData[0].id);
      }
    } catch (error) {
      console.error('Error loading stay data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos données de séjour',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTimelineEvents = async (bookingId: string) => {
    try {
      // Generate timeline events from booking metadata and create mock events
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      const events: TimelineEvent[] = [
        {
          id: '1',
          booking_id: bookingId,
          title: 'Réservation Confirmée',
          description: `Votre réservation ${booking.title} a été confirmée`,
          event_date: booking.created_at,
          event_type: 'check_in',
          status: 'completed',
          icon: 'check_circle'
        },
        {
          id: '2',
          booking_id: bookingId,
          title: 'Arrivée Prévue',
          description: `Arrivée à ${booking.location}`,
          event_date: booking.start_date,
          event_type: 'arrival',
          status: 'pending',
          icon: 'plane'
        }
      ];

      // Add service-specific events
      if (booking.booking_type === 'chauffeur') {
        events.push({
          id: '3',
          booking_id: bookingId,
          title: 'Chauffeur Disponible',
          description: 'Votre chauffeur personnel sera disponible',
          event_date: booking.start_date,
          event_type: 'chauffeur',
          status: 'pending',
          icon: 'car'
        });
      }

      if (booking.end_date) {
        events.push({
          id: '4',
          booking_id: bookingId,
          title: 'Départ',
          description: `Départ de ${booking.location}`,
          event_date: booking.end_date,
          event_type: 'departure',
          status: 'pending',
          icon: 'plane'
        });
      }

      setTimelineEvents(events);
    } catch (error) {
      console.error('Error loading timeline events:', error);
    }
  };

  const handleRevealDocument = (documentId: string) => {
    setRevealedDocuments(prev => new Set([...prev, documentId]));
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('majestic-documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Téléchargement réussi',
        description: `${document.title} a été téléchargé`
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive'
      });
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'hotel':
      case 'villa': return <Hotel className="w-5 h-5" />;
      case 'chauffeur': return <Car className="w-5 h-5" />;
      case 'service': return <Users className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventIcon = (icon: string) => {
    switch (icon) {
      case 'check_circle': return <CheckCircle className="w-4 h-4" />;
      case 'plane': return <Plane className="w-4 h-4" />;
      case 'car': return <Car className="w-4 h-4" />;
      case 'hotel': return <Hotel className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-serif text-[#F5F5F5] mb-2">Gestion de Séjour</h1>
                  <p className="text-[#F5F5F5]/80">
                    Suivez votre itinéraire et accédez à vos documents sécurisés
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#D4AF37] font-medium">Réservations actives</div>
                  <div className="text-2xl font-bold text-[#D4AF37]">
                    {bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-[#F5F5F5]/60 mb-2 block">Statut</label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A192F] border-[#1E3A5F]">
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmé</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#F5F5F5]/60 mb-2 block">Type</label>
                    <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A192F] border-[#1E3A5F]">
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="flight">Vols</SelectItem>
                        <SelectItem value="hotel">Hôtels</SelectItem>
                        <SelectItem value="villa">Villas</SelectItem>
                        <SelectItem value="chauffeur">Chauffeurs</SelectItem>
                        <SelectItem value="service">Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#F5F5F5]/60 mb-2 block">Période</label>
                    <Select value={filters.date_range} onValueChange={(value) => setFilters(prev => ({ ...prev, date_range: value }))}>
                      <SelectTrigger className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A192F] border-[#1E3A5F]">
                        <SelectItem value="all">Toutes les périodes</SelectItem>
                        <SelectItem value="upcoming">À venir</SelectItem>
                        <SelectItem value="current">En cours</SelectItem>
                        <SelectItem value="past">Passées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bookings List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <Card className="border-[#1E3A5F] bg-[#0A192F]/50">
                <CardHeader>
                  <h3 className="text-lg font-serif text-[#F5F5F5]">Mes Réservations</h3>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
                      <p className="text-[#F5F5F5]/60">Aucune réservation</p>
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => {
                          setSelectedBooking(booking);
                          loadTimelineEvents(booking.id);
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedBooking?.id === booking.id
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                            : 'border-[#1E3A5F] hover:border-[#D4AF37]/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center text-[#D4AF37]">
                            {getBookingIcon(booking.booking_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[#F5F5F5] truncate">{booking.title}</h4>
                            <p className="text-sm text-[#F5F5F5]/60 truncate">{booking.location}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status === 'pending' ? 'En attente' :
                                 booking.status === 'confirmed' ? 'Confirmé' :
                                 booking.status === 'in_progress' ? 'En cours' :
                                 booking.status === 'completed' ? 'Terminé' : 'Annulé'}
                              </Badge>
                              <span className="text-xs text-[#F5F5F5]/40">
                                {formatDateTime(booking.start_date)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#0A192F]/50 border border-[#1E3A5F]">
                  <TabsTrigger value="timeline" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A192F]">
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A192F]">
                    Documents
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="mt-6">
                  {selectedBooking ? (
                    <Card className="border-[#1E3A5F] bg-[#0A192F]/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-[#F5F5F5] flex items-center gap-3">
                              {getBookingIcon(selectedBooking.booking_type)}
                              {selectedBooking.title}
                            </CardTitle>
                            <p className="text-[#F5F5F5]/60">{selectedBooking.location}</p>
                          </div>
                          <Badge className={getStatusColor(selectedBooking.status)}>
                            {selectedBooking.status === 'pending' ? 'En attente' :
                             selectedBooking.status === 'confirmed' ? 'Confirmé' :
                             selectedBooking.status === 'in_progress' ? 'En cours' :
                             selectedBooking.status === 'completed' ? 'Terminé' : 'Annulé'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {timelineEvents.map((event, index) => (
                            <div key={event.id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  event.status === 'completed' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#1E3A5F] text-[#F5F5F5]/60'
                                }`}>
                                  {getEventIcon(event.icon)}
                                </div>
                                {index < timelineEvents.length - 1 && (
                                  <div className="w-0.5 h-16 bg-[#1E3A5F] mt-2" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[#F5F5F5]">{event.title}</h4>
                                <p className="text-sm text-[#F5F5F5]/60 mb-2">{event.description}</p>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                                  <span className="text-xs text-[#F5F5F5]/40">
                                    {formatDateTime(event.event_date)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-[#1E3A5F] bg-[#0A192F]/50">
                      <CardContent className="text-center py-12">
                        <Calendar className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
                        <p className="text-[#F5F5F5]/60">
                          Sélectionnez une réservation pour voir son timeline
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                  <Card className="border-[#1E3A5F] bg-[#0A192F]/50">
                    <CardHeader>
                      <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Documents Sécurisés
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {documents.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
                          <p className="text-[#F5F5F5]/60">Aucun document</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {documents.map((document) => (
                            <div key={document.id} className="flex items-center justify-between p-4 border border-[#1E3A5F] rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-[#F5F5F5]">{document.title}</h4>
                                  <p className="text-sm text-[#F5F5F5]/60">
                                    {(document.file_size / 1024).toFixed(1)} KB • {document.file_type}
                                  </p>
                                  {document.is_encrypted && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Lock className="w-3 h-3 text-[#D4AF37]" />
                                      <span className="text-xs text-[#D4AF37]">Chiffré</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {document.is_encrypted && !revealedDocuments.has(document.id) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRevealDocument(document.id)}
                                    className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Révéler
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => handleDownloadDocument(document)}
                                  className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Télécharger
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </MajesticProtectedRoute>
  );
};

export default StayManagement;
