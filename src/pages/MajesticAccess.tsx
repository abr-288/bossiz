import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Crown, 
  Shield, 
  Star, 
  Check, 
  Lock, 
  Key, 
  Sparkles,
  ArrowRight,
  CreditCard,
  Users,
  MapPin,
  Car,
  Utensils
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const MajesticAccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'access' | 'access_prive' | 'access_black' | null>(null);

  const plans = [
    {
      id: 'access' as const,
      name: 'Majestic Access',
      description: 'Accès VIP aux services exclusifs',
      price: '250 000 FCFA/mois',
      features: [
        'Accès au dashboard VIP',
        'Services de conciergerie',
        'Chat prioritaire 24/7',
        'Réservations prioritaires',
        'Support dédié'
      ],
      icon: <Key className="w-6 h-6" />,
      color: 'from-amber-500 to-amber-600',
      popular: false
    },
    {
      id: 'access_prive' as const,
      name: 'Majestic Privé',
      description: 'Accès premium avec propriétés exclusives',
      price: '750 000 FCFA/mois',
      features: [
        'Tout ce qui est inclus dans Access',
        'Propriétés off-market',
        'Chef privé à domicile',
        'Chauffeur personnel',
        'Événements exclusifs',
        'Accès anticipé'
      ],
      icon: <Crown className="w-6 h-6" />,
      color: 'from-violet-500 to-purple-600',
      popular: true
    },
    {
      id: 'access_black' as const,
      name: 'Majestic Black',
      description: 'Le summum du luxe et de l\'exclusivité',
      price: '2 500 000 FCFA/mois',
      features: [
        'Tout ce qui est inclus dans Privé',
        'Propriétés Black Card uniquement',
        'Jet privé disponible',
        'Yacht de luxe',
        'Équipe de sécurité dédiée',
        'Concierge personnel 24/7',
        'Événements sur mesure',
        'Accès mondial illimité'
      ],
      icon: <Shield className="w-6 h-6" />,
      color: 'from-gray-800 to-black',
      popular: false
    }
  ];

  const handleSubscribe = async (planId: 'access' | 'access_prive' | 'access_black') => {
    setLoading(true);
    setSelectedPlan(planId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth?redirect=/majestic-access');
        return;
      }

      // Create subscription request
      const { error } = await supabase
        .from('majestic_subscriptions' as any)
        .insert({
          user_id: user.id,
          plan: planId,
          status: 'pending',
          start_date: new Date().toISOString(),
          metadata: {
            source: 'majestic_access_page',
            plan_name: plans.find(p => p.id === planId)?.name
          }
        });

      if (error) throw error;

      // Redirect to payment
      navigate(`/subscription-payment?planId=majestic_${planId}`);
      
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer votre abonnement. Veuillez réessayer.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] via-[#132F4C] to-[#0A192F]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4AF37]/3 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-8">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm font-medium text-[#D4AF37]">Majestic Club</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif text-[#F5F5F5] mb-6 leading-tight">
              L'Excellence
              <span className="block text-[#D4AF37]">Redéfinie</span>
            </h1>
            
            <p className="text-xl text-[#F5F5F5]/80 max-w-3xl mx-auto mb-12 leading-relaxed">
              Accédez à un monde d'exclusivité où chaque désir devient réalité. 
              Le Majestic Club offre des privilèges au-delà de l'imagination.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-serif text-[#F5F5F5] mb-8">
              Privilèges Exclusifs
            </h2>
            <p className="text-[#F5F5F5]/70 text-lg max-w-2xl mx-auto">
              Découvrez les avantages qui transforment chaque expérience en moment inoubliable
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {[
              {
                icon: <MapPin className="w-6 h-6" />,
                title: 'Propriétés Exclusives',
                description: 'Accès à des villas et propriétés non visibles publiquement'
              },
              {
                icon: <Car className="w-6 h-6" />,
                title: 'Transport Premium',
                description: 'Chauffeurs privés, jet privé et yachts de luxe'
              },
              {
                icon: <Utensils className="w-6 h-6" />,
                title: 'Expériences Gastronomiques',
                description: 'Chefs privés et restaurants exclusifs'
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Événements Privés',
                description: 'Invitations à des événements mondialement exclusifs'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/30">
                  <div className="text-[#D4AF37]">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-serif text-[#F5F5F5] mb-2">{feature.title}</h3>
                <p className="text-[#F5F5F5]/60 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-serif text-[#F5F5F5] mb-8">
              Choisissez Votre Niveau d'Excellence
            </h2>
            <p className="text-[#F5F5F5]/70 text-lg max-w-2xl mx-auto">
              Chaque niveau offre des privilèges uniques adaptés à votre style de vie
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
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
                    <CardDescription className="text-[#F5F5F5]/70 text-sm">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <div className="text-3xl font-bold text-[#D4AF37] mb-1">
                        {plan.price}
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
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading}
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white border-0 h-12 font-semibold transition-all duration-300 hover:scale-105`}
                    >
                      {loading && selectedPlan === plan.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Traitement...
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-8 max-w-2xl mx-auto">
              <Shield className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
              <h3 className="text-2xl font-serif text-[#F5F5F5] mb-4">
                Garantie de Satisfaction
              </h3>
              <p className="text-[#F5F5F5]/80 mb-6">
                Votre satisfaction est notre priorité absolue. Si vous n'êtes pas entièrement satisfait, 
                nous vous offrons un remboursement complet pendant les 30 premiers jours.
              </p>
              <Button
                variant="outline"
                className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A192F]"
                onClick={() => navigate('/contact')}
              >
                Contacter un Conseiller
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default MajesticAccess;
