import { useEffect, useState } from "react";
import { MajesticClubTheme } from "@/components/majestic-club/MajesticClubTheme";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { motion } from "framer-motion";
import { Crown, Calendar, Package, MessageCircle, Star, Shield, Car, Utensils, Download, Key, CreditCard, Bell, Home, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMajesticSubscription } from "@/hooks/useMajesticSubscription";
import { MajesticProtectedRoute } from "@/components/majestic-club/MajesticProtectedRoute";
import { StayTimeline } from "@/components/majestic-club/StayTimeline";
import { ConciergeModule } from "@/components/majestic-club/ConciergeModule";
import { OffMarketCatalog } from "@/components/majestic-club/OffMarketCatalog";
import PaymentWallet from "@/components/majestic-club/PaymentWallet";
import { MembershipPlans } from "@/components/majestic-club/MembershipPlans";

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  completedServices: number;
  pendingRequests: number;
  unreadMessages: number;
  totalSpent: number;
}

const MajesticClub = () => {
  const { toast } = useToast();
  const { subscription, hasFeatureAccess } = useMajesticSubscription();
  const [userName, setUserName] = useState("Membre VIP");
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    completedServices: 0,
    pendingRequests: 0,
    unreadMessages: 0,
    totalSpent: 0
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.full_name) setUserName(profile.full_name);
        
        // Load dashboard stats
        loadDashboardStats(user.id);
      }
    };
    fetchProfile();
  }, []);

  const loadDashboardStats = async (userId: string) => {
    try {
      // Use generic any type to avoid TypeScript errors until database is migrated
      const { data: bookingsData } = await supabase
        .from('majestic_bookings' as any)
        .select('status, total_amount')
        .eq('user_id', userId);
      
      const { data: servicesData } = await supabase
        .from('majestic_service_requests' as any)
        .select('status')
        .eq('user_id', userId);
      
      const { data: messagesData } = await supabase
        .from('majestic_messages' as any)
        .select('is_read')
        .eq('user_id', userId)
        .eq('is_from_user', false);
      
      const { data: paymentsData } = await supabase
        .from('majestic_payments' as any)
        .select('amount, status')
        .eq('user_id', userId)
        .eq('status', 'completed');

      const bookings = bookingsData || [];
      const services = servicesData || [];
      const messages = messagesData || [];
      const payments = paymentsData || [];

      setStats({
        totalBookings: bookings.length,
        activeBookings: bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length,
        completedServices: services.filter(s => s.status === 'completed').length,
        pendingRequests: services.filter(s => s.status === 'pending').length,
        unreadMessages: messages.filter(m => !m.is_read).length,
        totalSpent: payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  return (
    <MajesticProtectedRoute>
      <UserDashboardLayout>
        <MajesticClubTheme>
          <div className="space-y-16 p-6 md:p-12 max-w-7xl mx-auto">
            {/* VIP Dashboard Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-2xl p-8 mb-16"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-serif text-[#F5F5F5] leading-tight">Tableau de Bord VIP</h1>
                  <p className="text-[#F5F5F5]/80 text-lg">Bienvenue, {userName}</p>
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-[#D4AF37] font-semibold">
                      {subscription?.plan === 'access_black' ? 'Black Card' :
                       subscription?.plan === 'access_prive' ? 'Privé' : 'Access'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#D4AF37] font-medium">Total dépensé</div>
                  <div className="text-3xl font-bold text-[#D4AF37]">
                    {stats.totalSpent.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
            >
              {[
                {
                  title: 'Réservations',
                  value: stats.totalBookings,
                  icon: <Package className="w-5 h-5" />,
                  color: 'text-blue-400',
                  bgColor: 'bg-blue-400/10'
                },
                {
                  title: 'Services Actifs',
                  value: stats.activeBookings,
                  icon: <Calendar className="w-5 h-5" />,
                  color: 'text-green-400',
                  bgColor: 'bg-green-400/10'
                },
                {
                  title: 'Demandes en Cours',
                  value: stats.pendingRequests,
                  icon: <Clock className="w-5 h-5" />,
                  color: 'text-yellow-400',
                  bgColor: 'bg-yellow-400/10'
                },
                {
                  title: 'Messages Non Lus',
                  value: stats.unreadMessages,
                  icon: <MessageCircle className="w-5 h-5" />,
                  color: 'text-purple-400',
                  bgColor: 'bg-purple-400/10'
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Card className="border-[#1E3A5F] bg-[#0A192F]/50 hover:border-[#D4AF37]/50 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#F5F5F5]/60 mb-1">{stat.title}</p>
                          <p className="text-2xl font-bold text-[#F5F5F5]">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                          {stat.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <h3 className="text-2xl font-serif text-[#F5F5F5] mb-8">Actions Rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Nouvelle Réservation',
                    description: 'Réserver un vol, hôtel ou service',
                    icon: <Calendar className="w-5 h-5" />,
                    action: () => {/* Navigate to booking */},
                    color: 'from-blue-500 to-blue-600'
                  },
                  {
                    title: 'Services Conciergerie',
                    description: 'Commander un service premium',
                    icon: <Car className="w-5 h-5" />,
                    action: () => {/* Navigate to concierge */},
                    color: 'from-purple-500 to-purple-600',
                    requiresAccess: 'concierge' as const
                  },
                  {
                    title: 'Propriétés Exclusives',
                    description: 'Découvrir les biens off-market',
                    icon: <Home className="w-5 h-5" />,
                    action: () => {/* Navigate to properties */},
                    color: 'from-amber-500 to-amber-600',
                    requiresAccess: 'properties' as const
                  },
                  {
                    title: 'Chat VIP',
                    description: 'Contacter votre assistant personnel',
                    icon: <MessageCircle className="w-5 h-5" />,
                    action: () => {/* Navigate to chat */},
                    color: 'from-green-500 to-green-600',
                    requiresAccess: 'chat' as const
                  }
                ].map((action, index) => {
                  const hasAccess = !action.requiresAccess || hasFeatureAccess(action.requiresAccess);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      <Card className={`border-[#1E3A5F] bg-[#0A192F]/50 hover:border-[#D4AF37]/50 transition-all duration-300 ${!hasAccess ? 'opacity-50' : ''}`}>
                        <CardContent className="p-6">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 ${!hasAccess ? 'grayscale' : ''}`}>
                            {action.icon}
                          </div>
                          <h4 className="font-semibold text-[#F5F5F5] mb-2">{action.title}</h4>
                          <p className="text-sm text-[#F5F5F5]/60 mb-4">{action.description}</p>
                          <Button
                            onClick={action.action}
                            disabled={!hasAccess}
                            className={`w-full bg-gradient-to-r ${action.color} hover:opacity-90 text-white border-0 ${!hasAccess ? 'cursor-not-allowed' : ''}`}
                          >
                            {hasAccess ? 'Accéder' : 'Nécessite une mise à niveau'}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Original Content */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="space-y-4"
            >
              <h1 className="majestic-title text-6xl md:text-8xl font-normal leading-[0.9]">Majestic<br />Club</h1>
              <p className="text-[#F5F5F5]/40 text-xl font-light tracking-[0.2em] uppercase italic">Service d'exception • {userName}</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="majestic-card p-8 flex items-center gap-6 border-[#C5A059]/30"
            >
              <div className="border border-[#C5A059]/40 p-5 rounded-sm">
                <Crown className="w-8 h-8 majestic-icon" strokeWidth={1} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#C5A059]/60">Échelon</p>
                <p className="majestic-title text-2xl tracking-tighter">Membre Suprême</p>
              </div>
            </motion.div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 mb-12 gap-12 overflow-x-auto scrollbar-hide">
              {[
                { value: "overview", label: "Dashboard" },
                { value: "stay", label: "Résidences" },
                { value: "services", label: "Conciergerie" },
                { value: "off-market", label: "Off-Market" },
                { value: "wallet", label: "Trésorerie" },
                { value: "membership", label: "Adhésion" }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b data-[state=active]:border-[#C5A059] data-[state=active]:text-[#C5A059] rounded-none px-0 py-6 text-[10px] font-bold uppercase tracking-[0.3em] bg-transparent border-none opacity-30 data-[state=active]:opacity-100 transition-all duration-700"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-16 animate-in fade-in duration-1000">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {/* Stay Summary */}
                <Card className="majestic-card border-none text-white p-2">
                  <CardHeader className="pb-8">
                    <CardTitle className="majestic-gold-text flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em]">
                      <Calendar className="w-5 h-5" strokeWidth={1} /> Prochain séjour
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 font-light italic text-sm">Villa Azure, Saint-Tropez</span>
                      <Badge className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 rounded-none px-3 py-1 font-bold text-[9px] uppercase tracking-widest">Confirmé</Badge>
                    </div>
                    <div className="majestic-title text-3xl tabular-nums">12 • 19 MAI</div>
                    <Button 
                      className="majestic-button-gold w-full py-7"
                      onClick={() => {
                        const tabTrigger = document.querySelector('[value="stay"]') as HTMLElement;
                        tabTrigger?.click();
                      }}
                    >
                      Détails du séjour
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Services */}
                <Card className="majestic-card border-none text-white p-2">
                  <CardHeader className="pb-8">
                    <CardTitle className="majestic-gold-text flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em]">
                      <Shield className="w-5 h-5" strokeWidth={1} /> Protection Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between text-xs tracking-widest uppercase">
                      <span className="text-white/40">Garde du corps</span>
                      <span className="text-[#C5A059] font-bold">Activé</span>
                    </div>
                    <div className="flex items-center justify-between text-xs tracking-widest uppercase">
                      <span className="text-white/40">Cyber-sécurité</span>
                      <span className="text-[#C5A059] font-bold">Protégé</span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-[#C5A059]/20 text-[#C5A059] hover:bg-[#C5A059]/5 py-7 font-bold uppercase text-[10px] tracking-[0.2em] rounded-none mb-0 mt-2"
                      onClick={() => {
                        const tabTrigger = document.querySelector('[value="services"]') as HTMLElement;
                        tabTrigger?.click();
                      }}
                    >
                      Protocole Sécurité
                    </Button>
                  </CardContent>
                </Card>

                {/* VIP Chat Shortcut */}
                <Card className="majestic-card border-none text-white bg-white/[0.02]">
                  <CardHeader className="pb-8">
                    <CardTitle className="majestic-gold-text flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em]">
                      <MessageCircle className="w-5 h-5" strokeWidth={1} /> Conciergerie 24/7
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-xs text-white/30 leading-loose tracking-wider uppercase font-light">Votre assistant personnel Jean-Baptiste répond à chacune de vos exigences.</p>
                    <Button 
                      className="w-full bg-[#B8860B] hover:bg-[#D4AF37] text-[#0A192F] py-7 font-bold uppercase text-[10px] tracking-[0.3em] rounded-none shadow-2xl"
                      onClick={() => window.open('https://wa.me/2250700000000', '_blank')}
                    >
                      <MessageCircle className="w-5 h-5" strokeWidth={1} /> Liaison Majestic
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Look at Timeline */}
              <StayTimeline />
            </TabsContent>

            <TabsContent value="stay" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <StayTimeline />
            </TabsContent>

            <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <ConciergeModule />
            </TabsContent>

            <TabsContent value="off-market" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <OffMarketCatalog />
            </TabsContent>

            <TabsContent value="wallet" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <PaymentWallet />
            </TabsContent>

            <TabsContent value="membership" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <MembershipPlans />
            </TabsContent>
          </Tabs>
        </div>
      </MajesticClubTheme>
    </UserDashboardLayout>
    </MajesticProtectedRoute>
  );
};

export default MajesticClub;
