import { motion } from "framer-motion";
import { Check, ArrowRight, Star, GraduationCap, Crown, Trophy, Gem, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MAJESTIC_PLANS, MajesticPlan } from "./MajesticPlansData";

export function MembershipPlans() {
  const navigate = useNavigate();

  const handleSubscribe = (planId: string) => {
    navigate(`/subscription-payment?planId=${planId}`);
  };

  return (
    <div className="space-y-20 animate-in fade-in duration-1000">
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <Badge className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 rounded-none px-6 py-2 font-bold uppercase tracking-[0.4em] text-[10px]">
          Programmes d'Adhésion
        </Badge>
        <h2 className="majestic-title text-5xl md:text-6xl leading-tight">L'Exclusivité comme Standard</h2>
        <p className="text-white/30 text-sm md:text-base italic font-light leading-relaxed tracking-wide">
          Rejoindre le Majestic Club, c'est s'ouvrir les portes d'un monde où chaque détail est orchestré pour votre souveraineté. Choisissez le niveau d'accès qui correspond à votre art de vivre.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pb-20">
        {MAJESTIC_PLANS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: index * 0.2 }}
            className="flex"
          >
            <Card className={`majestic-card flex flex-col w-full relative group ${
              plan.popular ? 'border-[#C5A059]/40 bg-gradient-to-b from-[#C5A059]/5 to-transparent' : 'border-white/5'
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <Badge className="bg-[#C5A059] text-[#0A192F] px-6 py-1 font-black text-[9px] uppercase tracking-[0.3em] rounded-none shadow-[0_0_20px_rgba(197,160,89,0.4)]">
                    Recommandé
                  </Badge>
                </div>
              )}

              <CardHeader className="p-10 space-y-8 border-b border-white/5 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${plan.color} opacity-10 -mr-16 -mt-16 blur-3xl`} />
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="p-4 border border-[#C5A059]/30 rounded-sm">
                    <plan.icon className="w-8 h-8 text-[#C5A059]" strokeWidth={1} />
                  </div>
                </div>

                <div className="space-y-2 relative z-10">
                  <h3 className="majestic-title text-3xl tracking-tight">{plan.name}</h3>
                  <p className="text-[10px] text-[#C5A059] font-bold uppercase tracking-[0.2em]">{plan.profile}</p>
                </div>

                <div className="space-y-1 relative z-10">
                  {plan.foundersOffer ? (
                    <div className="space-y-2">
                       <span className="text-white/20 line-through text-sm font-light italic">{plan.price}</span>
                       <div className="flex items-baseline gap-2">
                         <span className="text-4xl font-light tracking-tighter tabular-nums">{plan.foundersOffer.discountPrice}</span>
                         <span className="text-xs text-white/30 font-light uppercase tracking-widest">/ an</span>
                       </div>
                       <Badge className="bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 text-[8px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-none">
                         Offre Fondateurs : {plan.foundersOffer.remainingSeats} places
                       </Badge>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-light tracking-tighter tabular-nums">{plan.price.split(' /')[0]}</span>
                      <span className="text-xs text-white/30 font-light uppercase tracking-widest">/ an</span>
                    </div>
                  )}
                  <p className="text-[9px] text-white/20 italic font-light">{plan.initiationFee}</p>
                </div>
              </CardHeader>

              <CardContent className="p-10 flex-1 flex flex-col space-y-10">
                <p className="text-white/30 text-xs leading-relaxed italic font-light h-12 overflow-hidden">
                  {plan.description}
                </p>

                <ul className="space-y-6 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-4 group/item">
                      <div className="mt-1">
                        <Check className="w-3.5 h-3.5 text-[#C5A059] opacity-40 group-hover/item:opacity-100 transition-opacity" strokeWidth={3} />
                      </div>
                      <span className="text-xs text-white/40 group-hover/item:text-white transition-colors font-light tracking-wide">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-4 pt-6">
                  <Button 
                    className={`w-full py-8 text-[10px] font-bold uppercase tracking-[0.4em] rounded-none transition-all duration-500 ${
                      plan.popular 
                        ? 'majestic-button-gold shadow-[0_0_30px_rgba(197,160,89,0.1)]' 
                        : 'bg-white/[0.03] hover:bg-[#C5A059] hover:text-[#0A192F] border border-white/5'
                    }`}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    Souscrire maintenant <ArrowRight className="w-4 h-4 ml-4" strokeWidth={1} />
                  </Button>
                  <p className="text-[8px] text-white/10 text-center uppercase tracking-widest italic">Paiement sécurisé via Mobile Money & Carte</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trust factors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/5 pt-20 pb-10">
        {[
          { icon: ShieldCheck, title: "Souveraineté", desc: "Confidentialité absolue garantie" },
          { icon: Zap, title: "Instantanéité", desc: "Traitement prioritaire 24/7" },
          { icon: Star, title: "Exclusivité", desc: "Accès au marché off-market" }
        ].map((item, i) => (
          <div key={i} className="text-center space-y-4">
            <item.icon className="w-10 h-10 text-[#C5A059] mx-auto opacity-20" strokeWidth={1} />
            <h4 className="majestic-title text-sm tracking-[0.3em] font-normal">{item.title}</h4>
            <p className="text-[9px] text-white/20 italic uppercase tracking-[0.2em] font-light">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
