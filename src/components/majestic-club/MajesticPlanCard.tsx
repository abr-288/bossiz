import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Key, Check, CreditCard, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { autoConvertAndFormat } from "@/utils/currencyConverter";

interface MajesticPlan {
  id: 'access' | 'access_prive' | 'access_black';
  name: string;
  description: string;
  price: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  popular: boolean;
}

interface MajesticPlanCardProps {
  plan: MajesticPlan;
  index: number;
}

export function MajesticPlanCard({ plan, index }: MajesticPlanCardProps) {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    const planId = `majestic_${plan.id}`;
    console.log("MajesticPlanCard handleSubscribe appelé");
    console.log("plan.id:", plan.id);
    console.log("planId généré:", planId);
    console.log("URL de navigation:", `/majestic-subscription?planId=${planId}`);
    
    try {
      navigate(`/majestic-subscription?planId=${planId}`);
      console.log("Navigation Majestic lancée avec succès");
    } catch (error) {
      console.error("Erreur de navigation Majestic:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2 }}
      className="relative"
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-[#D4AF37] text-[#0A192F] px-4 py-1 text-sm font-semibold">
            Plus Populaire
          </Badge>
        </div>
      )}
      
      <Card className={`h-full border-[#D4AF37]/20 bg-[#0A192F]/80 backdrop-blur-sm hover:border-[#D4AF37]/50 transition-all duration-300 ${plan.popular ? 'ring-2 ring-[#D4AF37]/50' : ''}`}>
        <CardHeader className="text-center pb-6">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-4`}>
            <div className="text-white">{plan.icon}</div>
          </div>
          <CardTitle className="text-2xl font-serif text-[#F5F5F5] mb-2">
            {plan.name}
          </CardTitle>
          <div className="text-[#F5F5F5]/70 text-sm mb-4">
            {plan.description}
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-[#D4AF37] mb-1">
              {autoConvertAndFormat(parseFloat(plan.price), 'EUR')}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <ul className="space-y-3 mb-8">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <span className="text-[#F5F5F5]/80 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          
          <Button
            onClick={handleSubscribe}
            className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white border-2 border-white/20 h-14 font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl`}
          >
            {plan.id === 'access_black' ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Devenir Black
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Souscrire
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
