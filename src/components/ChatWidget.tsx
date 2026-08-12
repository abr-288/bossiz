import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Paperclip, Smile,
  MoreHorizontal, User, ShieldCheck, CheckCheck,
  Headphones, Info, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useTravelChatbot } from "@/hooks/useTravelChatbot";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const ChatWidget = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { sendMessage, loading: aiLoading } = useTravelChatbot();
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("b_reserve_chat_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        text: "Bonjour ! Je suis votre assistant B-Reserve boosté à l'IA. Comment puis-je vous aider aujourd'hui ? 🌍",
        sender: 'agent',
        timestamp: new Date(),
      }]);
    }
  }, []);

  const [unreadCount, setUnreadCount] = useState(() => {
    const saved = localStorage.getItem("b_reserve_chat_messages");
    return (!isOpen && !saved) ? 1 : 0;
  });

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, aiLoading, isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("b_reserve_chat_messages", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setUnreadCount(0);
    };
    window.addEventListener('open-live-chat', handleOpenChat);
    return () => window.removeEventListener('open-live-chat', handleOpenChat);
  }, []);

  const toggleChat = () => {
    if (!isOpen) {
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || aiLoading) return;

    const userText = inputValue.trim();
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue("");
    
    // Convert history for AI API
    const history = messages.concat(newUserMessage).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant' as "user" | "assistant",
      content: m.text
    }));

    try {
      const reply = await sendMessage(history);
      
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: reply || "Je suis désolé, je n'ai pas pu générer de réponse. Pouvez-vous reformuler ?",
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentResponse]);
    } catch (err) {
      console.error("Chatbot error:", err);
      toast.error("Le service d'assistance IA est temporairement indisponible.");
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Désolé, je rencontre une petite difficulté technique. Vous pouvez nous contacter par téléphone au +225 27 00 00 00 si c'est urgent !",
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[10000] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.85, y: 30, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="w-[calc(100vw-2rem)] max-w-[340px] sm:w-[340px] md:w-[380px] h-[min(72vh,480px)] sm:h-[500px] md:h-[540px] bg-white/80 backdrop-blur-2xl rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden flex flex-col pointer-events-auto mb-4 sm:mb-6 sm:mr-1"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-primary/95 via-primary to-primary-dark p-6 text-white pb-8 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-inner overflow-hidden transition-transform group-hover:scale-105">
                      <Headphones className="w-8 h-8 text-secondary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm">
                      <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-lg tracking-tight">Conciergerie B-Reserve</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-xs text-white/80 font-semibold uppercase tracking-widest">IA Active</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fermer le chat"
                  className="hover:bg-white/10 text-white rounded-2xl h-10 w-10 border border-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 px-6 -mt-4 relative z-20 overflow-x-auto scrollbar-none pb-2">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-md border border-primary/10 shadow-sm cursor-pointer hover:bg-primary hover:text-white transition-colors py-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0">
                Aide AI
              </Badge>
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-md border border-primary/10 shadow-sm cursor-pointer hover:bg-primary hover:text-white transition-colors py-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0">
                <Info className="w-3 h-3 mr-1" /> Destinations
              </Badge>
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-md border border-primary/10 shadow-sm cursor-pointer hover:bg-primary hover:text-white transition-colors py-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0">
                <Settings className="w-3 h-3 mr-1" /> Mon Compte
              </Badge>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pt-8 scrollbar-thin scrollbar-thumb-primary/5">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={cn(
                    "flex flex-col max-w-[85%] group",
                    m.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div 
                    className={cn(
                      "px-5 py-3.5 rounded-3xl text-sm leading-[1.6] shadow-sm transition-all duration-300",
                      m.sender === 'user' 
                        ? "bg-primary text-white rounded-tr-none shadow-primary/10" 
                        : "bg-white/60 text-foreground border border-white/60 backdrop-blur-lg rounded-tl-none"
                    )}
                  >
                    {m.text}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.sender === 'user' && (
                       <CheckCheck className="w-3.5 h-3.5 text-secondary" />
                    )}
                  </div>
                </div>
              ))}
              
              {aiLoading && (
                <div className="flex items-center gap-2 bg-white/40 border border-white/60 backdrop-blur-lg px-5 py-3.5 rounded-3xl rounded-tl-none w-fit shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/40 border-t border-white/60 backdrop-blur-xl">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <div className="flex-1 relative group">
                  <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={aiLoading ? "L'IA réfléchit..." : "Posez votre question..."}
                    className="bg-white/80 border-white/60 h-14 pl-5 pr-12 rounded-2xl shadow-inner focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm font-medium"
                    disabled={aiLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Insérer un émoji"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-primary rounded-xl transition-transform active:scale-90"
                    disabled={aiLoading}
                  >
                    <Smile className="w-6 h-6" />
                  </Button>
                </div>
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Envoyer le message"
                  className="h-14 w-14 rounded-2xl bg-secondary text-primary hover:bg-secondary/90 shadow-lg shadow-secondary/30 transition-all active:scale-90 flex-shrink-0"
                  disabled={!inputValue.trim() || aiLoading}
                >
                  {aiLoading ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </Button>
              </form>
              <div className="mt-3 text-center">
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">IA Intelligente B-Reserve • Sécurisé</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleChat}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
        className={cn(
          "h-16 w-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 transition-all pointer-events-auto border overflow-hidden relative group",
          isOpen 
            ? "bg-white text-primary border-border" 
            : "bg-primary text-white border-white/20"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary-darker opacity-0 group-hover:opacity-100 transition-opacity" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-8 h-8" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative z-10 w-full h-full flex items-center justify-center">
              <MessageCircle className="w-9 h-9" />
              {unreadCount > 0 && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-secondary rounded-lg border-2 border-primary flex items-center justify-center animate-bounce shadow-lg">
                  <span className="text-[10px] font-black text-primary leading-none">{unreadCount}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

const Badge = ({ children, className, variant }: any) => (
  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", className)}>
    {children}
  </span>
);

export default ChatWidget;

