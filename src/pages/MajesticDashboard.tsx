import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crown, 
  Shield, 
  Zap, 
  Users, 
  Calendar, 
  CreditCard, 
  Star,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  Plane,
  Car,
  Hotel,
  Diamond,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Heart,
  Sparkles,
  ChevronRight,
  Headphones,
  Video,
  FileText,
  Settings
} from "lucide-react";

interface UserSubscription {
  id: string;
  plan_id: string;
  subscription_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  plan_name: string;
  assistance_level: string;
  price: string;
}

interface ConciergeRequest {
  id: string;
  user_id: string;
  request_type: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  response_time?: string;
  assigned_concierge?: string;
}

interface VIPEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  exclusive: boolean;
  registered: boolean;
}

const MajesticDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [conciergeRequests, setConciergeRequests] = useState<ConciergeRequest[]>([]);
  const [vipEvents, setVipEvents] = useState<VIPEvent[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newRequest, setNewRequest] = useState({ type: '', description: '', priority: 'normal' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        setUserProfile(user);

        // Check if user has majestic subscription
        const { data: subscription, error } = await supabase
          .from('active_subscriptions' as any)
          .select('*')
          .eq('user_id', user.id)
          .eq('subscription_type', 'majestic')
          .single();

        if (error || !subscription) {
          // Redirect to standard dashboard if no majestic subscription
          navigate('/dashboard');
          return;
        }

        setUserSubscription(subscription);

        // Fetch concierge requests
        const { data: requests } = await supabase
          .from('concierge_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setConciergeRequests(requests || []);

        // Fetch VIP events
        const { data: events } = await supabase
          .from('vip_events')
          .select('*')
          .eq('exclusive', true)
          .order('date', { ascending: true })
          .limit(6);

        setVipEvents(events || []);

      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleConciergeRequest = async () => {
    if (!newRequest.description.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez décrire votre demande',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('concierge_requests')
        .insert({
          user_id: userProfile?.id,
          request_type: newRequest.type,
          description: newRequest.description,
          priority: newRequest.priority,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setConciergeRequests([data, ...conciergeRequests]);
      setNewRequest({ type: '', description: '', priority: 'normal' });
      
      toast({
        title: 'Demande envoyée !',
        description: 'Votre concierge personnel vous contactera dans les plus brefs délais.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEventRegistration = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('vip_event_registrations')
        .insert({
          event_id: eventId,
          user_id: userProfile?.id
        });

      if (error) throw error;

      setVipEvents(vipEvents.map(event => 
        event.id === eventId ? { ...event, registered: true } : event
      ));

      toast({
        title: 'Inscription confirmée !',
        description: 'Vous recevrez une confirmation par email.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 rounded-2xl flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-black">Tableau de Bord Majestic</h1>
                <p className="text-gray-700">Bienvenue dans votre espace VIP exclusif</p>
              </div>
            </div>
            <Badge className="bg-black text-white px-4 py-2">
              {userSubscription?.plan_name}
            </Badge>
          </div>
        </motion.div>

        {/* Premium Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: <Headphones className="w-6 h-6" />,
              label: "Assistance 24/7",
              value: "Active",
              color: "bg-green-500",
              description: "Concierge personnel disponible"
            },
            {
              icon: <MessageCircle className="w-6 h-6" />,
              label: "Demandes en cours",
              value: conciergeRequests.filter(r => r.status === 'pending').length,
              color: "bg-blue-500",
              description: "En traitement par votre concierge"
            },
            {
              icon: <Calendar className="w-6 h-6" />,
              label: "Événements VIP",
              value: vipEvents.length,
              color: "bg-purple-500",
              description: "Événements exclusifs disponibles"
            },
            {
              icon: <Diamond className="w-6 h-6" />,
              label: "Services Premium",
              value: "Illimités",
              color: "bg-yellow-500",
              description: "Accès à tous les services VIP"
            }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-2 border-gray-300 bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                      <div className="text-white">{stat.icon}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {stat.value}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-black mb-1">{stat.label}</h3>
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="concierge" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="concierge">Concierge Personnel</TabsTrigger>
            <TabsTrigger value="events">Événements VIP</TabsTrigger>
            <TabsTrigger value="services">Services Exclusifs</TabsTrigger>
            <TabsTrigger value="benefits">Avantages Majestic</TabsTrigger>
          </TabsList>

          {/* Concierge Personnel Tab */}
          <TabsContent value="concierge">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* New Request */}
              <Card className="border-2 border-gray-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black">
                    <MessageCircle className="w-5 h-5" />
                    Nouvelle Demande Concierge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Type de demande</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg text-black"
                      value={newRequest.type}
                      onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="travel">Voyage</option>
                      <option value="dining">Restaurant</option>
                      <option value="entertainment">Divertissement</option>
                      <option value="shopping">Shopping</option>
                      <option value="wellness">Bien-être</option>
                      <option value="business">Affaires</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Priorité</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg text-black"
                      value={newRequest.priority}
                      onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                    >
                      <option value="normal">Normale</option>
                      <option value="urgent">Urgente</option>
                      <option value="immediate">Immédiate</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Description</label>
                    <textarea 
                      className="w-full p-2 border border-gray-300 rounded-lg text-black"
                      rows={4}
                      placeholder="Décrivez votre demande en détail..."
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleConciergeRequest}
                    className="w-full bg-black hover:bg-gray-800 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer la demande
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Requests */}
              <Card className="border-2 border-gray-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black">
                    <Clock className="w-5 h-5" />
                    Demandes Récentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conciergeRequests.length === 0 ? (
                      <p className="text-gray-600 text-center py-8">Aucune demande récente</p>
                    ) : (
                      conciergeRequests.map((request) => (
                        <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={request.priority === 'immediate' ? 'destructive' : request.priority === 'urgent' ? 'default' : 'secondary'}>
                              {request.priority}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-black mb-1">{request.request_type}</h4>
                          <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={request.status === 'completed' ? 'bg-green-500' : request.status === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-500'}>
                              {request.status === 'completed' ? 'Terminé' : request.status === 'in_progress' ? 'En cours' : 'En attente'}
                            </Badge>
                            {request.assigned_concierge && (
                              <span className="text-xs text-gray-500">Concierge: {request.assigned_concierge}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* VIP Events Tab */}
          <TabsContent value="events">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vipEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-2 border-gray-300 hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-white" />
                      </div>
                      {event.exclusive && (
                        <Badge className="absolute top-2 right-2 bg-black text-white">
                          Exclusif
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-black mb-2">{event.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <Button 
                        className={`w-full ${event.registered ? 'bg-green-500 hover:bg-green-600' : 'bg-black hover:bg-gray-800'} text-white`}
                        onClick={() => handleEventRegistration(event.id)}
                        disabled={event.registered}
                      >
                        {event.registered ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Inscrit
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4 mr-2" />
                            S'inscrire
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Exclusive Services Tab */}
          <TabsContent value="services">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Plane className="w-8 h-8" />,
                  title: "Avion Privé",
                  description: "Accès à notre flotte d'avions privés 24/7",
                  available: true
                },
                {
                  icon: <Car className="w-8 h-8" />,
                  title: "Chauffeur Personnel",
                  description: "Chauffeur dédié disponible à tout moment",
                  available: true
                },
                {
                  icon: <Hotel className="w-8 h-8" />,
                  title: "Hôtels de Luxe",
                  description: "Réservations dans les meilleurs hôtels du monde",
                  available: true
                },
                {
                  icon: <Globe className="w-8 h-8" />,
                  title: "Événements Exclusifs",
                  description: "Invitations aux événements VIP et galas",
                  available: true
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Sécurité Personnelle",
                  description: "Protection et sécurité renforcées",
                  available: true
                },
                {
                  icon: <Video className="w-8 h-8" />,
                  title: "Consultations Privées",
                  description: "Accès à des experts dans tous les domaines",
                  available: true
                }
              ].map((service, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-2 border-gray-300 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <div className="text-white">{service.icon}</div>
                      </div>
                      <h3 className="font-bold text-black mb-2">{service.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                      <Button className="w-full bg-black hover:bg-gray-800 text-white">
                        {service.available ? 'Réserver' : 'Bientôt disponible'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Benefits Tab */}
          <TabsContent value="benefits">
            <div className="space-y-6">
              <Card className="border-2 border-gray-300">
                <CardHeader>
                  <CardTitle className="text-black">Vos Avantages Majestic Club</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      "Assistance 24/7 avec concierge personnel",
                      "Accès prioritaire à tous les services",
                      "Événements exclusifs et invitations VIP",
                      "Transport privé (avion, yacht, voiture)",
                      "Hébergements de luxe et résidences exclusives",
                      "Service de sécurité personnel",
                      "Consultations avec des experts de renom",
                      "Gestion complète de votre agenda",
                      "Accès aux réseaux et opportunités exclusives",
                      "Service de traduction et interprétation",
                      "Assistance juridique et financière",
                      "Programme de fidélité et récompenses"
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-black">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default MajesticDashboard;
