import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, Plane, Hotel, Car, CreditCard, Shield, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LazyImage } from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const Help = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const categories = [
    {
      icon: Plane,
      title: "Vols",
      description: "Questions sur les réservations de vols",
      color: "text-blue-500",
    },
    {
      icon: Hotel,
      title: "Hôtels",
      description: "Aide pour les réservations d'hôtels",
      color: "text-green-500",
    },
    {
      icon: Car,
      title: "Locations de voiture",
      description: "Guide pour louer une voiture",
      color: "text-orange-500",
    },
    {
      icon: CreditCard,
      title: "Paiements",
      description: "Informations sur les paiements",
      color: "text-purple-500",
    },
    {
      icon: Shield,
      title: "Sécurité",
      description: "Protection et assurance voyage",
      color: "text-red-500",
    },
  ];

  const faqs = [
    {
      category: "Général",
      questions: [
        {
          q: "Comment créer un compte sur Bossiz ?",
          a: "Cliquez sur 'Connexion' en haut à droite, puis sélectionnez 'S'inscrire'. Remplissez le formulaire avec votre email et mot de passe. Vous recevrez un email de confirmation.",
        },
        {
          q: "Puis-je modifier ou annuler ma réservation ?",
          a: "Oui, connectez-vous à votre compte et accédez à 'Mes Réservations'. Vous pourrez modifier ou annuler selon les conditions de votre réservation.",
        },
        {
          q: "Comment contacter le service client ?",
          a: "Vous pouvez nous contacter via le formulaire de support, par email à support@bossiz.com, ou par téléphone au +225 XX XX XX XX XX.",
        },
      ],
    },
    {
      category: "Vols",
      questions: [
        {
          q: "Comment réserver un vol ?",
          a: "1. Saisissez votre destination, dates et nombre de passagers. 2. Comparez les résultats. 3. Sélectionnez votre vol. 4. Remplissez les informations passagers. 5. Effectuez le paiement.",
        },
        {
          q: "Quels documents sont nécessaires pour voyager ?",
          a: "Un passeport valide est requis pour les vols internationaux. Vérifiez les exigences de visa pour votre destination. Une carte d'identité suffit pour les vols domestiques.",
        },
        {
          q: "Puis-je choisir mon siège ?",
          a: "Oui, après avoir réservé, vous pouvez sélectionner votre siège dans la section 'Mes Réservations'. Certaines compagnies facturent ce service.",
        },
        {
          q: "Que faire en cas de vol retardé ou annulé ?",
          a: "Contactez immédiatement notre service client. Selon la situation, vous aurez droit à un remboursement, un vol de remplacement ou une compensation.",
        },
      ],
    },
    {
      category: "Hôtels",
      questions: [
        {
          q: "Comment réserver un hôtel ?",
          a: "Recherchez votre destination et dates, comparez les hôtels disponibles, sélectionnez votre chambre et confirmez votre réservation avec paiement.",
        },
        {
          q: "À quelle heure puis-je faire le check-in ?",
          a: "L'heure de check-in standard est 14h-15h. Le check-out est généralement à 11h-12h. Contactez l'hôtel pour des arrangements spéciaux.",
        },
        {
          q: "Puis-je annuler gratuitement ?",
          a: "Cela dépend des conditions de votre réservation. Les tarifs flexibles permettent généralement une annulation gratuite jusqu'à 24-48h avant l'arrivée.",
        },
      ],
    },
    {
      category: "Paiement",
      questions: [
        {
          q: "Quels moyens de paiement acceptez-vous ?",
          a: "Nous acceptons les cartes Visa, Mastercard, American Express, ainsi que les paiements mobile money (Orange Money, MTN Mobile Money, Moov Money).",
        },
        {
          q: "Mon paiement est-il sécurisé ?",
          a: "Oui, toutes les transactions sont sécurisées avec cryptage SSL. Nous ne stockons pas vos informations bancaires.",
        },
        {
          q: "Quand serai-je débité ?",
          a: "Le débit est immédiat pour la plupart des réservations. Pour certains hôtels, le paiement peut être effectué à l'établissement.",
        },
        {
          q: "Comment obtenir une facture ?",
          a: "Votre facture est envoyée automatiquement par email après le paiement. Vous pouvez aussi la télécharger depuis 'Mes Réservations'.",
        },
      ],
    },
    {
      category: "Location de voiture",
      questions: [
        {
          q: "Quels documents sont nécessaires ?",
          a: "Vous devez présenter un permis de conduire valide (depuis au moins 1 an), une pièce d'identité et une carte de crédit au nom du conducteur principal.",
        },
        {
          q: "Quel âge minimum pour louer ?",
          a: "L'âge minimum est généralement 21 ans. Un supplément jeune conducteur peut s'appliquer pour les moins de 25 ans.",
        },
        {
          q: "L'assurance est-elle incluse ?",
          a: "Une assurance de base est incluse. Vous pouvez souscrire des assurances complémentaires pour une meilleure couverture.",
        },
      ],
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter((category) => category.questions.length > 0)
    : faqs;

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />

      {/* Hero Section Synchronized with other bannières */}
      <div className="relative min-h-[50vh] md:min-h-[55vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src="https://images.unsplash.com/photo-1454165833762-0204b2816701?w=1920"
          alt="Help Center"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background/20"></div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">

            <h1 className="text-4xl md:text-7xl font-black mb-6 text-white drop-shadow-lg tracking-tighter">
              {t("help.title", "Comment pouvons-nous vous aider ?")}
            </h1>
            <p className="text-lg md:text-2xl text-white/95 drop-shadow-md max-w-2xl mx-auto font-medium">
              {t("help.subtitle", "Recherchez dans notre base de connaissances ou parcourez les catégories")}
            </p>
          </div>

          <div className="max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Rechercher dans l'aide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-16 pr-6 py-8 text-xl bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl rounded-2xl focus-visible:ring-primary/20 transition-all font-medium"
              />
              <Button className="absolute right-3 top-1/2 -translate-y-1/2 h-12 px-8 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-all shadow-lg active:scale-95">
                Rechercher
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-background py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Catégories d'aide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <Icon className={`h-12 w-12 mx-auto mb-4 ${category.color}`} />
                    <h3 className="font-semibold mb-2">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-gradient-to-br from-secondary/5 to-accent/5 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Questions Fréquentes</h2>

            {filteredFaqs.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="mb-6">
                <CardHeader>
                  <CardTitle>{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}

            {filteredFaqs.length === 0 && searchQuery && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <HelpCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    Nous n'avons pas trouvé de réponse correspondant à votre recherche
                  </p>
                  <Button onClick={() => navigate("/support")}>
                    <Mail className="mr-2 h-4 w-4" />
                    Contacter le support
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Vous n'avez pas trouvé votre réponse ?</h2>
          <p className="text-xl mb-8 text-white/90">
            Notre équipe est là pour vous aider 24/7
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/support")}
            >
              <Mail className="mr-2 h-5 w-5" />
              Contacter le support
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
              <Phone className="mr-2 h-5 w-5" />
              +225 XX XX XX XX
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

// Missing import
import { Phone } from "lucide-react";

export default Help;
