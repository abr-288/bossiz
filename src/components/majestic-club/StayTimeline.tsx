import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, Clock, MapPin, Key, Car, Utensils, 
  Plane, Home, Shield, Download, FileText, Lock, Loader2, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TimelineEvent {
  id: number;
  label: string;
  time: string;
  icon: any;
  status: "completed" | "active" | "pending";
  description?: string;
}

interface StayDetails {
  id: string;
  booking_id: string;
  timeline: TimelineEvent[];
  smart_lock_code: string;
  welcome_guide_url: string;
  documents: Array<{ name: string; url: string; type: string }>;
}

export function StayTimeline() {
  const { toast } = useToast();
  const [details, setDetails] = useState<StayDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Default timeline for demonstration if no data is found
  const events: TimelineEvent[] = [
    { id: 1, label: "Arrivée Aéroport", time: "12 Mai, 14:30", icon: Plane, status: "completed", description: "Votre hôte vous attend au Terminal A." },
    { id: 2, label: "Transfert Privé", time: "12 Mai, 15:00", icon: Car, status: "active", description: "En route vers votre villa en Berline de Classe S." },
    { id: 3, label: "Accueil Villa", time: "12 Mai, 15:45", icon: Home, status: "pending", description: "Check-in personnalisé et remise des clés digitales." },
    { id: 4, label: "Dîner de Bienvenue", time: "12 Mai, 20:00", icon: Utensils, status: "pending", description: "Menu gastronomique préparé par le Chef Marc." },
  ];

  const lockCode = details?.smart_lock_code || "8 4 9 2";

  useEffect(() => {
    async function fetchStayDetails() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: booking } = await supabase
          .from("bookings")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (booking) {
          const { data: lData } = await supabase
            .from("luxe_stay_details")
            .select("*")
            .eq("booking_id", booking.id)
            .maybeSingle();

          if (lData) {
            setDetails(lData);
          }
        }
      } catch (error) {
        console.error("Error fetching stay details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStayDetails();
  }, []);

  const handleDownload = (docName: string) => {
    toast({
      title: "Téléchargement",
      description: `Préparation de "${docName}"...`,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#C5A059]" strokeWidth={1} />
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <h2 className="majestic-title text-4xl">Suivi d'Expérience</h2>
          <p className="text-white/30 text-sm tracking-widest uppercase font-light italic">Le calendrier de vos privilèges en temps réel.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-[#C5A059] font-bold uppercase tracking-[0.2em]">Check-in</p>
            <p className="text-xl font-light tabular-nums">14:00</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-[10px] text-[#C5A059] font-bold uppercase tracking-[0.2em]">Temp. Villa</p>
            <p className="text-xl font-light tabular-nums">22°C</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Timeline column */}
        <div className="lg:col-span-2 space-y-12">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-12 group">
              {/* Vertical line connector */}
              {index !== events.length - 1 && (
                <div className="absolute left-[19px] top-10 bottom-[-40px] w-px bg-gradient-to-b from-[#C5A059]/40 to-transparent" />
              )}
              
              <div className="absolute left-0 top-0 w-10 h-10 border border-[#C5A059]/30 bg-[#101820] flex items-center justify-center rounded-sm z-10 group-hover:border-[#C5A059] transition-colors">
                <event.icon className={`w-5 h-5 ${event.status === 'completed' ? 'text-[#C5A059]' : 'text-white/20'}`} strokeWidth={1} />
              </div>

              <div className="majestic-card p-8 group-hover:bg-white/[0.03]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.3em]">{event.time}</span>
                    <h3 className="majestic-title text-xl tracking-tight">{event.label}</h3>
                  </div>
                  <Badge className={`rounded-none px-4 py-1 text-[9px] font-bold uppercase tracking-widest ${
                    event.status === 'completed' ? 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30' : 'bg-white/5 text-white/30 border-white/10'
                  }`}>
                    {event.status === 'completed' ? 'Délivré' : 'À venir'}
                  </Badge>
                </div>
                <p className="text-white/30 text-xs italic font-light leading-relaxed">{event.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-12">
          {/* Smart Lock Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="majestic-card p-10 space-y-8 bg-[#C5A059]/5 border-[#C5A059]/20"
          >
            <div className="flex items-center gap-6">
              <div className="p-4 border border-[#C5A059]/40 rounded-sm">
                <Key className="w-8 h-8 text-[#C5A059]" strokeWidth={1} />
              </div>
              <div className="space-y-1">
                <h3 className="majestic-title text-lg">Sésame Digital</h3>
                <p className="text-[9px] text-[#C5A059] uppercase tracking-widest font-bold">Code Privé Dynamique</p>
              </div>
            </div>
            
            <div className="bg-[#0A192F] p-8 text-center border border-[#C5A059]/20">
              <span className="text-5xl font-light tabular-nums tracking-[0.3em] text-[#F5F5F5]">{lockCode}</span>
            </div>
            
            <p className="text-[9px] text-white/30 text-center uppercase tracking-widest italic">Valide jusqu'au départ • 11:00 AM</p>
          </motion.div>

          {/* Quick Documents */}
          <div className="space-y-6">
            <h4 className="majestic-title text-xs tracking-[0.3em]">Coffre-fort Numérique</h4>
            <div className="space-y-4">
              {[
                { label: "Livret d'accueil Villa", icon: MapPin },
                { label: "Facture Proforma #2024-XP", icon: FileText },
                { label: "Protocole Sécurité VIP", icon: Shield }
              ].map((doc, i) => (
                <div key={i} className="majestic-card p-6 flex items-center justify-between group cursor-pointer hover:bg-[#C5A059]/5">
                  <div className="flex items-center gap-4">
                    <doc.icon className="w-5 h-5 text-white/20 group-hover:text-[#C5A059]" strokeWidth={1} />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 group-hover:text-white transition-colors">{doc.label}</span>
                  </div>
                  <Download className="w-4 h-4 text-white/10 group-hover:text-[#C5A059]" strokeWidth={1} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
