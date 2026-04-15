import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, MapPin, Star, ArrowRight, Loader2, Eye, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LuxeProperty {
  id: string;
  name: string;
  description: string;
  location: string;
  price_info: string;
  images: string[];
  virtual_tour_url: string;
  specifications: any;
}

export function OffMarketCatalog() {
  const { toast } = useToast();
  const [properties, setProperties] = useState<LuxeProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const { data, error } = await supabase
          .from("luxe_properties")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error("Error fetching lux properties:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  const handleVisit = (name: string) => {
    toast({
      title: "Visite virtuelle",
      description: `Chargement de la visite 3D pour "${name}"...`,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-24 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <h2 className="majestic-title text-5xl">Résidences d'Élite</h2>
          <p className="text-white/30 text-sm tracking-[0.2em] uppercase font-light italic">Le catalogue confidentiel du Majestic Club.</p>
        </div>
        <Badge className="bg-[#C5A059] text-[#0A192F] flex items-center gap-3 px-8 py-3 h-auto font-bold uppercase tracking-[0.3em] text-[10px] rounded-none shadow-[0_0_20px_rgba(197,160,89,0.2)]">
          <Crown className="w-4 h-4" strokeWidth={1} /> Collection Privée
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {properties.map((property) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="majestic-card group"
          >
            <div className="relative h-[500px] overflow-hidden">
              <img 
                src={property.images[0] || "https://images.unsplash.com/photo-1613490493576-7fde63acd811"} 
                alt={property.name}
                className="w-full h-full object-cover majestic-image-ambient"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F] via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                <div className="space-y-2">
                  <h3 className="majestic-title text-4xl mb-4 leading-none">{property.name}</h3>
                  <div className="flex items-center gap-3 text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">
                    <MapPin className="w-4 h-4 text-[#C5A059]" strokeWidth={1} />
                    {property.location}
                  </div>
                </div>
                <div className="bg-[#C5A059] text-[#0A192F] font-black px-6 py-2 text-[10px] tracking-widest uppercase">
                  {property.price_info}
                </div>
              </div>
              <div className="absolute top-10 right-10">
                 <Badge className="bg-[#101820]/90 backdrop-blur-2xl border border-[#C5A059]/40 text-[#C5A059] px-6 py-2 font-bold tracking-[0.4em] text-[9px] rounded-none">
                   CONFIDENTIEL
                 </Badge>
              </div>
            </div>
            
            <div className="p-12 space-y-10">
              <p className="text-white/30 text-xs leading-loose italic font-light tracking-wide">
                {property.description || "Une immersion totale dans le privilège contemporain, où chaque perspective a été sculptée pour offrir une expérience de vie transcendante et intemporelle."}
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                <Button 
                  variant="outline" 
                  className="border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/5 flex items-center gap-3 font-bold uppercase text-[9px] tracking-[0.3em] py-8 rounded-none"
                  onClick={() => handleVisit(property.name)}
                >
                  <Eye className="w-5 h-5" strokeWidth={1} /> Immersion 3D
                </Button>
                <Button 
                  className="majestic-button-gold flex items-center gap-3 py-8"
                >
                  <Camera className="w-5 h-5" strokeWidth={1} /> Portfolio HD
                </Button>
              </div>
              
              <Button className="w-full bg-white/[0.03] hover:bg-[#C5A059] hover:text-[#0A192F] border border-white/5 transition-all font-bold uppercase tracking-[0.4em] py-10 text-[9px] rounded-none">
                Consulter un expert dédié <ArrowRight className="w-4 h-4 ml-4" strokeWidth={1} />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20 border-t border-white/5 pt-20 pb-10">
        {[
          { icon: Crown, title: "Exclusivité", desc: "Accès restreint au Club" },
          { icon: Shield, title: "Souveraineté", desc: "Discrétion chirurgicale" },
          { icon: Star, title: "Prestige", desc: "Patrimoine unique" }
        ].map((item, i) => (
          <div key={i} className="text-center space-y-4">
            <item.icon className="w-12 h-12 text-[#C5A059] mx-auto opacity-40" strokeWidth={1} />
            <h4 className="majestic-title text-sm tracking-[0.3em] font-normal">{item.title}</h4>
            <p className="text-[9px] text-white/20 italic uppercase tracking-[0.2em] font-light">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
