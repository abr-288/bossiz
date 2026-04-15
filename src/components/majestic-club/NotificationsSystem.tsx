import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Car, 
  Users, 
  CreditCard, 
  Shield,
  X,
  Check,
  Archive,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MajesticProtectedRoute } from './MajesticProtectedRoute';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking' | 'chauffeur' | 'checkout' | 'service' | 'payment' | 'system';
  is_read: boolean;
  action_url?: string;
  metadata: Record<string, any>;
  created_at: string;
}

const NotificationsSystem = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    date_range: 'all'
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    setupRealtimeSubscription();
    
    return () => {
      // Cleanup subscription
    };
  }, [filters]);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load notifications with filters
      let query = supabase
        .from('majestic_notifications' as any)
        .select('*')
        .eq('user_id', user.id);

      if (filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      
      if (filters.status === 'unread') {
        query = query.eq('is_read', false);
      }
      
      if (filters.date_range !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.date_range) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      
      // Count unread notifications
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('majestic_notifications')
      .on('broadcast', { event: 'new_notification' }, (payload) => {
        const notification = payload.notification as Notification;
        setNotifications(prev => [notification, ...prev]);
        
        if (!notification.is_read) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to Majestic Notifications');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('majestic_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('majestic_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      setUnreadCount(0);
      
      toast({
        title: 'Notifications lues',
        description: 'Toutes vos notifications ont été marquées comme lues'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('majestic_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleArchiveNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Archive by updating with archived flag (assuming we add this field)
      // For now, we'll just mark as read
      await handleMarkAllAsRead();
    } catch (error) {
      console.error('Error archiving notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="w-5 h-5" />;
      case 'chauffeur': return <Car className="w-5 h-5" />;
      case 'checkout': return <MapPin className="w-5 h-5" />;
      case 'service': return <Users className="w-5 h-5" />;
      case 'payment': return <CreditCard className="w-5 h-5" />;
      case 'system': return <Shield className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    const baseOpacity = isRead ? 'opacity-50' : '';
    
    switch (type) {
      case 'booking': return `bg-blue-100 text-blue-800 border-blue-200 ${baseOpacity}`;
      case 'chauffeur': return `bg-green-100 text-green-800 border-green-200 ${baseOpacity}`;
      case 'checkout': return `bg-yellow-100 text-yellow-800 border-yellow-200 ${baseOpacity}`;
      case 'service': return `bg-purple-100 text-purple-800 border-purple-200 ${baseOpacity}`;
      case 'payment': return `bg-red-100 text-red-800 border-red-200 ${baseOpacity}`;
      case 'system': return `bg-gray-100 text-gray-800 border-gray-200 ${baseOpacity}`;
      default: return `bg-gray-100 text-gray-800 border-gray-200 ${baseOpacity}`;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'à l\'instant';
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)} jours`;
    return `il y a ${Math.floor(diffInSeconds / 604800)} sem`;
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-serif text-[#F5F5F5] mb-2">Notifications</h1>
                  <p className="text-[#F5F5F5]/80">
                    Restez informé de toutes vos activités Majestic Club
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-sm text-[#D4AF37] font-medium">Non lues</div>
                  <div className="text-2xl font-bold text-[#D4AF37] relative">
                    {unreadCount}
                    {unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                      />
                    )}
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif text-[#F5F5F5]">Filtres</h3>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <Button
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Tout marquer comme lu
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleArchiveNotifications}
                      className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                    >
                      <Archive className="w-4 h-4 mr-1" />
                      Archiver
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-[#F5F5F5]/60 mb-2 block">Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5] rounded-lg px-3 py-2"
                    >
                      <option value="all">Tous les types</option>
                      <option value="booking">Réservations</option>
                      <option value="chauffeur">Chauffeurs</option>
                      <option value="checkout">Check-outs</option>
                      <option value="service">Services</option>
                      <option value="payment">Paiements</option>
                      <option value="system">Système</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#F5F5F5]/60 mb-2 block">Statut</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5] rounded-lg px-3 py-2"
                    >
                      <option value="all">Tous</option>
                      <option value="unread">Non lues</option>
                      <option value="read">Lues</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#F5F5F5]/60 mb-2 block">Période</label>
                    <select
                      value={filters.date_range}
                      onChange={(e) => setFilters(prev => ({ ...prev, date_range: e.target.value }))}
                      className="w-full bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5] rounded-lg px-3 py-2"
                    >
                      <option value="all">Toutes les périodes</option>
                      <option value="today">Aujourd'hui</option>
                      <option value="week">Cette semaine</option>
                      <option value="month">Ce mois</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#1E3A5F] text-[#F5F5F5]/60 hover:text-[#F5F5F5]"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Paramètres
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-[#1E3A5F] bg-[#0A192F]/50">
              <CardHeader>
                <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Historique des Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
                    <p className="text-[#F5F5F5]/60">Aucune notification</p>
                    <p className="text-sm text-[#F5F5F5]/40 mt-2">
                      Vous serez notifié des nouvelles activités
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        !notification.is_read 
                          ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5' 
                          : 'border-[#1E3A5F] bg-[#0A192F]/30'
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          !notification.is_read ? 'bg-[#D4AF37]/20' : 'bg-[#1E3A5F]'
                        }`}>
                          <div className={`${!notification.is_read ? 'text-[#D4AF37]' : 'text-[#F5F5F5]/60'}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-semibold ${
                              !notification.is_read ? 'text-[#F5F5F5]' : 'text-[#F5F5F5]/70'
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge className={getNotificationColor(notification.type, notification.is_read)}>
                                {notification.type === 'booking' ? 'Réservation' :
                                 notification.type === 'chauffeur' ? 'Chauffeur' :
                                 notification.type === 'checkout' ? 'Check-out' :
                                 notification.type === 'service' ? 'Service' :
                                 notification.type === 'payment' ? 'Paiement' : 'Système'}
                              </Badge>
                              <span className="text-xs text-[#F5F5F5]/40">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                            </div>
                          </div>
                          
                          <p className={`text-sm mb-3 ${
                            !notification.is_read ? 'text-[#F5F5F5]/80' : 'text-[#F5F5F5]/50'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {notification.action_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.location.href = notification.action_url}
                                  className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs"
                                >
                                  Voir
                                </Button>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="text-[#F5F5F5]/40 hover:text-red-400 hover:bg-red-400/10"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Notification Detail Modal */}
        <AnimatePresence>
          {selectedNotification && (
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
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      !selectedNotification.is_read ? 'bg-[#D4AF37]/20' : 'bg-[#1E3A5F]'
                    }`}>
                      <div className={`${!selectedNotification.is_read ? 'text-[#D4AF37]' : 'text-[#F5F5F5]/60'}`}>
                        {getNotificationIcon(selectedNotification.type)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#F5F5F5]">
                        {selectedNotification.title}
                      </h3>
                      <p className="text-sm text-[#F5F5F5]/60">
                        {formatTimeAgo(selectedNotification.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedNotification(null)}
                    className="text-[#F5F5F5]/60 hover:text-[#F5F5F5]"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-6">
                    <p className="text-[#F5F5F5] leading-relaxed">
                      {selectedNotification.message}
                    </p>
                  </div>

                  {selectedNotification.action_url && (
                    <Button
                      onClick={() => window.location.href = selectedNotification.action_url}
                      className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0"
                    >
                      Accéder à la page
                    </Button>
                  )}

                  <div className="flex gap-4">
                    {!selectedNotification.is_read && (
                      <Button
                        onClick={() => {
                          handleMarkAsRead(selectedNotification.id);
                          setSelectedNotification(null);
                        }}
                        className="flex-1 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marquer comme lu
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setSelectedNotification(null)}
                      className="flex-1 border-[#1E3A5F] text-[#F5F5F5] hover:bg-[#1E3A5F]"
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MajesticProtectedRoute>
  );
};

export default NotificationsSystem;
