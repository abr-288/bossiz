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
import { useLocation } from "react-router-dom";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const ChatWidget = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isTransactionalPage = [
    "/payment",
    "/booking-history",
    "/booking-process",
    "/flight-hotel/booking",
  ].includes(pathname) || pathname.startsWith("/booking/") || pathname.startsWith("/admin");
  const { sendMessage, loading: aiLoading } = useTravelChatbot();
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("b_reserve_chat_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: unknown) => {
          const message = item as Partial<Message>;
          return { ...message, timestamp: new Date(message.timestamp ?? Date.now()) } as Message;
        });
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
        text: "Bonjour ! Je suis votre assistant Bossiz+ boosté à l'IA. Comment puis-je vous aider aujourd'hui ? 🌍",
        sender: 'agent',
        timestamp: new Date(),
      }]);
    }
  }, []);

  useEffect(() => {
    if (isTransactionalPage) setIsOpen(false);
  }, [isTransactionalPage, pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

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

  if (isTransactionalPage) return null;

  return (
    <div
      className={cn(
        "chat-widget-container fixed z-[10000] flex flex-col items-end pointer-events-none",
        isOpen
          ? "inset-0 sm:bottom-6 sm:left-auto sm:right-6 sm:top-auto"
          : "bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]"
      )}
      data-open={isOpen}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.85, y: 30, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            role="dialog"
            aria-label="Conciergerie Bossiz+"
            id="bossiz-chat-dialog"
            className="chat-widget-panel flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-white/95 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl backdrop-blur-2xl pointer-events-auto sm:mb-4 sm:mr-1 sm:h-[min(680px,calc(100dvh-6rem))] sm:max-h-[calc(100dvh-6rem)] sm:w-[min(420px,calc(100vw-3rem))] sm:rounded-[1.5rem] sm:rounded-b-[1.5rem] sm:border sm:border-white/40 sm:bg-white/80 sm:pt-0 sm:pb-0 sm:shadow-[0_20px_50px_rgba(0,0,0,0.15)] md:h-[min(720px,calc(100dvh-6rem))]"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-primary/95 via-primary to-primary-dark p-4 pb-6 text-white relative sm:p-6 sm:pb-8">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="relative group">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white/20 shadow-inner backdrop-blur-xl transition-transform group-hover:scale-105 sm:h-14 sm:w-14">
                      <Headphones className="h-6 w-6 text-secondary sm:h-8 sm:w-8" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm">
                      <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="truncate font-extrabold text-base tracking-tight sm:text-lg">Conciergerie Bossiz+</h3>
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
                  className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 text-white transition-colors hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="relative z-20 -mt-3 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none sm:-mt-4 sm:px-6">
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
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 pt-5 scrollbar-thin scrollbar-thumb-primary/5 sm:space-y-6 sm:p-6 sm:pt-8">
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
                      "max-w-full break-words rounded-3xl px-4 py-3 text-sm leading-[1.6] shadow-sm transition-all duration-300 sm:px-5 sm:py-3.5",
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
            <div className="border-t border-white/60 bg-white/60 p-4 backdrop-blur-xl sm:p-6">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 relative group">
                  <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    aria-label="Votre message à l'assistant"
                    placeholder={aiLoading ? "L'IA réfléchit..." : "Posez votre question..."}
                    className="h-12 rounded-2xl border-white/60 bg-white/80 pl-4 pr-11 text-sm font-medium shadow-inner transition-all focus-visible:ring-1 focus-visible:ring-primary/20 sm:h-14 sm:pl-5"
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
                  className="h-12 w-12 flex-shrink-0 rounded-2xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30 transition-all hover:bg-secondary/90 active:scale-90 sm:h-14 sm:w-14"
                  disabled={!inputValue.trim() || aiLoading}
                >
                  {aiLoading ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </Button>
              </form>
              <div className="mt-2 text-center sm:mt-3">
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">IA Intelligente Bossiz+ • Sécurisé</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleChat}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
        aria-expanded={isOpen}
        aria-controls="bossiz-chat-dialog"
        className={cn(
          "chat-widget-launcher pointer-events-auto relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border shadow-2xl shadow-primary/30 transition-all group sm:h-16 sm:w-16",
          isOpen && "hidden sm:flex",
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

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", className)}>
    {children}
  </span>
);

export default ChatWidget;
