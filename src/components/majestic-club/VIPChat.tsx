import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreHorizontal, 
  User, 
  ShieldCheck, 
  CheckCheck,
  Bot,
  Phone,
  Video
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MajesticProtectedRoute } from './MajesticProtectedRoute';

interface Message {
  id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  is_from_user: boolean;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

interface TypingIndicator {
  user_id: string;
  is_typing: boolean;
  last_seen: string;
}

const VIPChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conciergeOnline, setConciergeOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadMessages();
    setupRealtimeSubscription();
    checkConciergeStatus();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('majestic_messages' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read
      const unreadMessages = data?.filter(m => !m.is_read && !m.is_from_user) || [];
      const { error: updateError } = await supabase
        .from('majestic_messages' as any)
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('id', unreadMessages.map(m => m.id));
      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('majestic_chat')
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const message = payload.payload as Message;
        setMessages(prev => [...prev, message]);
      })
      .on('broadcast', { event: 'typing_indicator' }, (payload) => {
        const indicator = payload.payload as TypingIndicator;
        if (!indicator.is_typing) {
          setIsTyping(false);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to Majestic Chat');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const checkConciergeStatus = async () => {
    // Simulate concierge status check
    setConciergeOnline(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Send message to database
      const { data, error } = await supabase
        .from('majestic_messages')
        .insert({
          user_id: user.id,
          content: messageContent,
          message_type: 'text',
          is_from_user: true,
          is_read: false,
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;

      // Add message to local state immediately
      setMessages(prev => [...prev, data]);

      // Broadcast to real-time channel
      await supabase
        .channel('majestic_chat')
        .send({
          type: 'broadcast',
          event: 'new_message',
          payload: data
        });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer votre message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    // Send typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      setIsTyping(true);
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } else {
      setIsTyping(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatus = (message: Message) => {
    if (message.is_from_user) {
      return message.is_read ? (
        <CheckCheck className="w-4 h-4 text-blue-500" />
      ) : (
        <CheckCheck className="w-4 h-4 text-gray-400" />
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <MajesticProtectedRoute requiredFeature="chat">
      <div className="min-h-screen bg-[#0A192F] flex">
        {/* Chat Sidebar */}
        <div className="w-80 border-r border-[#1E3A5F] bg-[#0A192F]/95 backdrop-blur-sm">
          {/* Concierge Info */}
          <div className="p-6 border-b border-[#1E3A5F]">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0A192F] ${conciergeOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
              <div>
                <h3 className="text-[#F5F5F5] font-semibold">Concierge Majestic</h3>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${conciergeOnline ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                    {conciergeOnline ? 'En ligne' : 'Hors ligne'}
                  </Badge>
                  <span className="text-xs text-[#F5F5F5]/60">
                    Réponse en 2-5 min
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[#F5F5F5]/80 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                <Phone className="w-4 h-4 mr-2" />
                Appeler
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[#F5F5F5]/80 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                <Video className="w-4 h-4 mr-2" />
                Vidéo
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-b border-[#1E3A5F]">
            <h4 className="text-sm font-semibold text-[#F5F5F5] mb-3">Actions Rapides</h4>
            <div className="space-y-2">
              {[
                { icon: <Car className="w-4 h-4" />, label: 'Réserver un chauffeur' },
                { icon: <Utensils className="w-4 h-4" />, label: 'Commander un chef' },
                { icon: <ShieldCheck className="w-4 h-4" />, label: 'Sécurité privée' }
              ].map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-[#F5F5F5]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs"
                >
                  <span className="mr-2">{action.icon}</span>
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#1E3A5F] bg-[#0A192F]/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-serif text-[#F5F5F5]">Chat VIP</h2>
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30">
                  Chiffé de bout en bout
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#F5F5F5]/60 hover:text-[#D4AF37]"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#F5F5F5]/60 hover:text-[#D4AF37]"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
                <p className="text-[#F5F5F5]/60">Commencez une conversation avec votre concierge personnel</p>
                <p className="text-sm text-[#F5F5F5]/40 mt-2">
                  Disponible 24/7 pour toutes vos demandes
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${message.is_from_user ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${message.is_from_user ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-end gap-2 ${message.is_from_user ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!message.is_from_user && (
                          <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        <div className={`px-4 py-2 rounded-2xl ${
                          message.is_from_user 
                            ? 'bg-[#D4AF37] text-[#0A192F]' 
                            : 'bg-[#1E3A5F] text-[#F5F5F5]'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className={`flex items-center gap-2 mt-1 ${message.is_from_user ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs opacity-60">
                              {formatTime(message.created_at)}
                            </span>
                            {getMessageStatus(message)}
                          </div>
                        </div>
                        
                        {message.is_from_user && (
                          <div className="w-8 h-8 bg-[#0A192F] rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-[#F5F5F5]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-[#1E3A5F] text-[#F5F5F5] px-4 py-2 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#D4AF37]/60 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-[#D4AF37]/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-[#D4AF37]/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-[#1E3A5F] bg-[#0A192F]/95 backdrop-blur-sm">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[#F5F5F5]/60 hover:text-[#D4AF37]"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5] placeholder-[#F5F5F5]/40 pr-12"
                  disabled={sending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#F5F5F5]/60 hover:text-[#D4AF37]"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-[#0A192F] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </MajesticProtectedRoute>
  );
};

export default VIPChat;
