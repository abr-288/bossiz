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
import { useCookieConsent } from "@/hooks/useCookieConsent";

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
  // Le chat n'apparaît qu'une fois le bandeau cookies traité : sur mobile, son
  // bouton flottant recouvrait sinon les boutons du bandeau.
  const { hasResponded: cookieChoiceMade } = useCookieConsent();
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
        text: t("ux.chat.welcome"),
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
        text: reply || t("ux.chat.noAnswer"),
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentResponse]);
    } catch (err) {
      console.error("Chatbot error:", err);
      toast.error(t("ux.chat.unavailable"));
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: t("ux.chat.technicalIssue"),
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    }
  };

  if (isTransactionalPage || !cookieChoiceMade) return null;

  const quickActions = [
    { label: t("ux.chat.quickHelp"), prompt: t("ux.chat.quickHelpPrompt"), icon: null },
    { label: t("ux.chat.quickDestinations"), prompt: t("ux.chat.quickDestinationsPrompt"), icon: Info },
    { label: t("ux.chat.quickAccount"), prompt: t("ux.chat.quickAccountPrompt"), icon: Settings },
  ];

  return (
    <div
      className={cn(
        "chat-widget-container fixed z-chat flex flex-col items-end pointer-events-none",
        isOpen
          ? "inset-0 sm:bottom-6 sm:left-auto sm:right-6 sm:top-auto"
          : "bottom-[calc(max(1rem,env(safe-area-inset-bottom))+var(--bottom-nav-h,0px))] right-[max(1rem,env(safe-area-inset-right))] lg:bottom-[max(1rem,env(safe-area-inset-bottom))]"
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
            aria-label={t("ux.chat.title")}
            id="bossiz-chat-dialog"
            className="chat-widget-panel flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-card pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl pointer-events-auto sm:mb-4 sm:mr-1 sm:h-[min(680px,calc(100dvh-6rem))] sm:max-h-[calc(100dvh-6rem)] sm:w-[min(420px,calc(100vw-3rem))] sm:rounded-modal sm:rounded-b-modal sm:border sm:border-border sm:pt-0 sm:pb-0 sm:shadow-xl md:h-[min(720px,calc(100dvh-6rem))]"
          >
            {/* Header */}
            <div className="bg-primary p-4 pb-6 text-primary-foreground relative sm:p-6 sm:pb-8">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="relative group">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-primary-foreground/30 bg-primary-foreground/15 sm:h-14 sm:w-14">
                      <Headphones className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-2 border-primary rounded-full">
                      <div className="w-full h-full bg-success rounded-full animate-ping opacity-75 motion-reduce:animate-none" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="truncate font-extrabold text-base tracking-tight sm:text-lg">{t("ux.chat.title")}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-success rounded-full" aria-hidden="true" />
                      <p className="text-xs text-primary-foreground/85 font-medium">{t("ux.chat.online")}</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label={t("ux.chat.close")}
                  className="h-11 w-11 shrink-0 rounded-2xl border border-primary-foreground/15 text-primary-foreground transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Actions rapides : pré-remplissent la question (avant : puces sans action) */}
            <div className="relative z-20 -mt-3 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none sm:-mt-4 sm:px-6">
              {quickActions.map(({ label, prompt, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setInputValue(prompt)}
                  className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                  {label}
                </button>
              ))}
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
                      "max-w-full break-words rounded-3xl px-4 py-3 text-sm leading-[1.6] shadow-sm transition-all duration-slow ease-standard sm:px-5 sm:py-3.5",
                      m.sender === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground border border-border rounded-tl-none"
                    )}
                  >
                    {m.text}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 px-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.sender === 'user' && (
                       <CheckCheck className="w-3.5 h-3.5 text-secondary" aria-label={t("ux.chat.sent")} />
                    )}
                  </div>
                </div>
              ))}
              
              {aiLoading && (
                <div className="flex items-center gap-2 bg-muted border border-border px-5 py-3.5 rounded-3xl rounded-tl-none w-fit shadow-sm">
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
            <div className="border-t border-border bg-card p-4 sm:p-6">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 relative group">
                  <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    aria-label={t("ux.chat.inputLabel")}
                    placeholder={aiLoading ? t("ux.chat.thinking") : t("ux.chat.placeholder")}
                    className="h-12 rounded-2xl border-input bg-background pl-4 pr-11 text-base sm:h-14 sm:pl-5 sm:text-sm"
                    disabled={aiLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("ux.chat.emoji")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-primary rounded-xl"
                    disabled={aiLoading}
                  >
                    <Smile className="w-6 h-6" />
                  </Button>
                </div>
                <Button
                  type="submit"
                  size="icon"
                  aria-label={t("ux.chat.send")}
                  className="h-12 w-12 flex-shrink-0 rounded-2xl bg-secondary text-secondary-foreground shadow-md transition-colors hover:bg-secondary/90 sm:h-14 sm:w-14"
                  disabled={!inputValue.trim() || aiLoading}
                >
                  {aiLoading ? (
                    <div className="w-5 h-5 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </Button>
              </form>
              <div className="mt-2 text-center sm:mt-3">
                <p className="text-xs text-muted-foreground">{t("ux.chat.footer")}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleChat}
        aria-label={isOpen ? t("ux.chat.close") : t("ux.chat.open")}
        aria-expanded={isOpen}
        aria-controls="bossiz-chat-dialog"
        className={cn(
          "chat-widget-launcher pointer-events-auto relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border shadow-lg transition-colors sm:h-16 sm:w-16",
          isOpen && "hidden sm:flex",
          isOpen 
            ? "bg-card text-primary border-border"
            : "bg-primary text-primary-foreground border-transparent hover:bg-primary/90"
        )}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-8 h-8" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative z-10 w-full h-full flex items-center justify-center">
              <MessageCircle className="w-9 h-9" />
              {unreadCount > 0 && (
                <div className="absolute top-1.5 right-1.5 min-w-[1.25rem] h-5 px-1 bg-secondary rounded-full border-2 border-primary flex items-center justify-center">
                  <span className="text-[11px] font-bold text-secondary-foreground leading-none tabular-nums">{unreadCount}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default ChatWidget;
