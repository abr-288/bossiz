import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Utensils, 
  Car, 
  Shield, 
  MessageCircle, 
  ArrowRight, 
  Loader2,
  ChefHat,
  Sparkles,
  Plus,
  Clock,
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MajesticProtectedRoute } from "./MajesticProtectedRoute";

interface ConciergeService {
  id: string;
  name: string;
  category: 'concierge' | 'chauffeur' | 'chef' | 'security' | 'custom';
  description: string;
  base_price: number;
  image_url?: string;
  metadata: Record<string, any>;
  is_active: boolean;
}

const ICON_MAP: Record<string, any> = {
  Utensils: Utensils,
  Car: Car,
  Shield: Shield,
  ChefHat: ChefHat,
  Sparkles: Sparkles,
};

export function ConciergeModule() {
  const { toast } = useToast();
  const [services, setServices] = useState<ConciergeService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const { data, error } = await supabase
          .from("majestic_services" as any)
          .select("*")
          .eq("is_active", true);

        if (error) throw error;
        
        // Transform data to match interface
        const transformedServices = (data || []).map((service: any) => ({
          ...service,
          price_range: `${service.base_price?.toLocaleString('fr-FR') || '0'} XOF`
        }));
        
        setServices(transformedServices);
      } catch (error) {
        console.error("Error fetching concierge services:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  const handleOrder = (serviceName: string) => {
    toast({
      title: "Demande reçue",
      description: `Votre demande pour "${serviceName}" a été transmise à votre concierge.`,
    });
  };

  const openWhatsApp = (serviceName?: string) => {
    const message = serviceName 
      ? `Bonjour, je souhaite commander le service "${serviceName}" pour mon prochain séjour.`
      : "Bonjour, j'ai besoin d'une assistance personnalisée.";
    window.open(`https://wa.me/2250700000000?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-20 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <h2 className="majestic-title text-4xl">Services de Prestige</h2>
          <p className="text-white/30 text-sm tracking-widest uppercase font-light italic">L'excellence au service de vos exigences.</p>
        </div>
        <Button 
          onClick={() => openWhatsApp()}
          className="majestic-button-gold px-12 py-8 h-auto"
        >
          <MessageCircle className="w-5 h-5 mr-3" strokeWidth={1} /> Liaison Concierge
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {services.map((service) => {
          const Icon = ICON_MAP[service.icon_name] || ArrowRight;
          return (
            <motion.div
              key={service.id}
              whileHover={{ y: -4 }}
              className="majestic-card group"
            >
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="border border-[#C5A059]/30 p-5 rounded-sm bg-[#C5A059]/5">
                    <Icon className="w-8 h-8 text-[#C5A059]" strokeWidth={1} />
                  </div>
                  <Badge variant="outline" className="border-[#C5A059]/40 text-[#C5A059] font-bold text-[9px] uppercase tracking-[0.3em] rounded-none px-3 py-1">
                    {service.category}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <h3 className="majestic-title text-xl tracking-tight leading-tight">{service.name}</h3>
                  <p className="text-xs text-white/30 leading-loose italic font-light">
                    {service.description}
                  </p>
                </div>

                <div className="pt-8 flex items-center justify-between border-t border-white/5">
                  <span className="text-xs font-bold text-[#C5A059] tabular-nums tracking-widest">{service.price_range}</span>
                  <Button 
                    variant="ghost" 
                    className="text-white/40 hover:text-[#C5A059] hover:bg-transparent group-hover:translate-x-2 transition-all font-bold uppercase text-[9px] tracking-[0.3em]"
                    onClick={() => handleOrder(service.name)}
                  >
                    Solliciter <ArrowRight className="w-4 h-4 ml-3" strokeWidth={1} />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Card className="majestic-card border-none bg-white/[0.01] overflow-hidden">
        <CardContent className="p-20 text-center space-y-10">
          <Shield className="w-16 h-16 text-[#C5A059] mx-auto opacity-20" strokeWidth={1} />
          <div className="space-y-4">
            <h3 className="text-3xl font-normal majestic-title tracking-[0.2em]">Majestic On-Demand</h3>
            <p className="text-white/30 max-w-2xl mx-auto leading-loose text-sm italic font-light">
              Votre statut privilège vous ouvre les portes de l'impossible. 
              Réservations de jets, yachts impériaux, ou accès confidentiels aux cercles les plus fermés de la planète.
            </p>
          </div>
          <Button 
            className="majestic-button-gold px-16 py-8 h-auto"
            onClick={() => openWhatsApp()}
          >
            Formuler une requête d'exception
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
