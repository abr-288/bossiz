import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Phone, Mail, MessageCircle, Clock, HelpCircle, Sparkles } from "lucide-react";
import { useSupportMessage } from "@/hooks/useSupportMessage";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNewsletterSubscribe } from "@/hooks/useNewsletterSubscribe";
import { UnifiedForm, UnifiedFormField, UnifiedSubmitButton } from "@/components/forms";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const Support = () => {
  const { t } = useTranslation();
  const { sendMessage, loading: sendingMessage } = useSupportMessage();
  const { subscribe, loading: subscribing } = useNewsletterSubscribe();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bookingReference: "",
    subject: "",
    message: ""
  });
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await sendMessage(formData);
    if (success) {
      setFormData({
        name: "",
        email: "",
        bookingReference: "",
        subject: "",
        message: ""
      });
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await subscribe(newsletterEmail);
    if (result) {
      toast({
        title: "Inscription réussie",
        description: result.message,
      });
      setNewsletterEmail("");
    }
  };

  const handleChatClick = () => {
    // Dispatch custom event to open the ChatWidget
    window.dispatchEvent(new CustomEvent('open-live-chat'));
  };
  const faqs = [
    {
      question: t("pages.support.faq.q1"),
      answer: t("pages.support.faq.a1")
    },
    {
      question: t("pages.support.faq.q2"),
      answer: t("pages.support.faq.a2")
    },
    {
      question: t("pages.support.faq.q3"),
      answer: t("pages.support.faq.a3")
    },
    {
      question: t("pages.support.faq.q4"),
      answer: t("pages.support.faq.a4")
    },
    {
      question: t("pages.support.faq.q5"),
      answer: t("pages.support.faq.a5")
    },
    {
      question: t("pages.support.faq.q6"),
      answer: t("pages.support.faq.a6")
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />
      
      {/* Clean Hero Section without Gradient */}
      {/* Hero Section Synchronized with other bannières */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden bg-primary">
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background/10"></div>
        
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">

            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-lg">
              {t("support.title", "Nous sommes là pour vous aider")}
            </h1>
            <p className="text-lg md:text-2xl text-white/95 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-md">
              {t("support.subtitle", "Notre équipe d'experts est disponible 24/7 pour répondre à toutes vos questions et vous accompagner.")}
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Contact Cards with Refined Arrangement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-16 relative z-20 mb-20 pointer-events-auto">
          <Card className="hover:shadow-2xl transition-all duration-300 border-white/20 bg-white/80 backdrop-blur-xl group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/10 group-hover:bg-primary transition-colors" />
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <Phone className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-black text-xl mb-2 text-foreground">Appelez-nous</h3>
              <p className="text-muted-foreground text-sm mb-6 font-medium">
                Support vocal global <br /> Disponible 24h/24 et 7j/7
              </p>
              <p className="font-black text-primary text-2xl tracking-tighter">+225 27 20 00 00 00</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 border-white/20 bg-white/80 backdrop-blur-xl group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-secondary/10 group-hover:bg-secondary transition-colors" />
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <Mail className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="font-black text-xl mb-2 text-foreground">Écrivez-nous</h3>
              <p className="text-muted-foreground text-sm mb-6 font-medium">
                Support technique & facturation <br /> Réponse sous 12h-24h
              </p>
              <p className="font-black text-secondary text-2xl tracking-tighter">support@bossiz.com</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 border-white/20 bg-white/80 backdrop-blur-xl group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent/10 group-hover:bg-accent transition-colors" />
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <MessageCircle className="w-10 h-10 text-accent" />
              </div>
              <h3 className="font-black text-xl mb-2 text-foreground">Chat en direct</h3>
              <p className="text-muted-foreground text-sm mb-6 font-medium">
                Agents disponibles <br /> Réponse instantanée
              </p>
              <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-black rounded-xl shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]" onClick={handleChatClick}>
                Démarrer le chat
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Questions Fréquentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Envoyez-nous un message</CardTitle>
              </CardHeader>
              <CardContent>
                <UnifiedForm onSubmit={handleSubmit} variant="contact" loading={sendingMessage}>
                  <UnifiedFormField
                    label="Nom complet"
                    name="name"
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <UnifiedFormField
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <UnifiedFormField
                    label="Numéro de réservation (optionnel)"
                    name="bookingReference"
                    placeholder="Ex: BK123456"
                    value={formData.bookingReference}
                    onChange={(e) => setFormData({...formData, bookingReference: e.target.value})}
                  />
                  <UnifiedFormField
                    label="Sujet"
                    name="subject"
                    placeholder="Objet de votre demande"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">Message</label>
                    <Textarea 
                      placeholder="Décrivez votre problème ou votre question..." 
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required
                      className="w-full"
                    />
                  </div>
                  <UnifiedSubmitButton loading={sendingMessage} fullWidth>
                    Envoyer le message
                  </UnifiedSubmitButton>
                </UnifiedForm>
              </CardContent>
            </Card>

            {/* Horaires */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Horaires d'ouverture</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Support téléphonique :</strong> 24h/24 et 7j/7</p>
                      <p><strong>Agences :</strong> Lun-Ven 8h-18h, Sam 9h-13h</p>
                      <p><strong>Chat en ligne :</strong> 24h/24 et 7j/7</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Newsletter Banner - Solid Version */}
        <div className="mt-16">
          <Card className="border-0 bg-primary text-white rounded-3xl overflow-hidden shadow-2xl relative">
            {/* Background texture (dots or lines) */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, white 25%, transparent 25%, transparent 50%, white 50%, white 75%, transparent 75%, transparent)', backgroundSize: '40px 40px' }} />
              <div className="absolute -top-24 -left-24 w-64 h-64 border-8 border-white rounded-full" />
              <div className="absolute top-1/2 -right-32 w-64 h-64 border-8 border-white rounded-full -translate-y-1/2" />
            </div>
            
            <CardContent className="p-10 md:p-16 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full mb-6 text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3 text-secondary" />
                  Privilèges exclusifs
                </div>
                <h3 className="text-3xl md:text-5xl font-black mb-6 leading-tight">Suivez l'actualité <br className="hidden md:block" /> B-Reserve</h3>
                <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto font-medium">
                  Recevez nos meilleures offres et conseils de voyage directement dans votre boîte mail.
                </p>
                <UnifiedForm onSubmit={handleNewsletterSubmit} variant="contact" loading={subscribing} className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
                  <div className="flex-1">
                    <UnifiedFormField
                      name="email"
                      type="email"
                      placeholder="Votre adresse email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-14 rounded-2xl"
                    />
                  </div>
                  <UnifiedSubmitButton loading={subscribing} className="bg-secondary text-primary h-14 px-8 rounded-2xl font-black text-lg shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95">
                    S'inscrire
                  </UnifiedSubmitButton>
                </UnifiedForm>
                <p className="mt-6 text-xs text-white/50 font-medium">En vous inscrivant, vous acceptez notre politique de confidentialité.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
