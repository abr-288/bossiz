import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone, Mail, MessageCircle, MapPin, Clock, Facebook, Twitter,
  Instagram, Youtube, Linkedin, Building2
} from "lucide-react";
import { useSupportMessage } from "@/hooks/useSupportMessage";
import { UnifiedForm, UnifiedFormField, UnifiedSubmitButton } from "@/components/forms";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";

const Contact = () => {
  const { t } = useTranslation();
  const { config } = useSiteConfigContext();
  const { sendMessage, loading: sendingMessage } = useSupportMessage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bookingReference: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await sendMessage(formData);
    if (success) {
      setFormData({ name: "", email: "", bookingReference: "", subject: "", message: "" });
    }
  };

  const handleChatClick = () => {
    window.dispatchEvent(new CustomEvent("open-live-chat"));
  };

  const directChannels = [
    {
      icon: Phone,
      title: t("pages.contact.channels.phone.title", "Téléphone"),
      description: t("pages.contact.channels.phone.description", "Support disponible 24h/24 et 7j/7"),
      value: "+225 27 20 00 00 00",
      href: "tel:+22527200000000",
    },
    {
      icon: MessageCircle,
      title: t("pages.contact.channels.whatsapp.title", "WhatsApp"),
      description: t("pages.contact.channels.whatsapp.description", "Réponse rapide, du lundi au dimanche"),
      value: "+225 07 00 00 00 00",
      href: "https://wa.me/2250700000000",
    },
    {
      icon: Mail,
      title: t("pages.contact.channels.email.title", "Email"),
      description: t("pages.contact.channels.email.description", "Réponse sous 24h"),
      value: "support@bossiz.com",
      href: "mailto:support@bossiz.com",
    },
    {
      icon: MessageCircle,
      title: t("pages.contact.channels.chat.title", "Chat en direct"),
      description: t("pages.contact.channels.chat.description", "Réponse immédiate, assistant disponible en continu"),
      value: t("pages.contact.channels.chat.cta", "Démarrer une conversation"),
      onClick: handleChatClick,
    },
  ];

  const agencies = [
    {
      country: t("bossizSite.countries.ci", "Côte d'Ivoire"),
      address: "Cocody Riviera, Abidjan",
      phone: "+225 07 01 67 60 09",
      email: "support@bossiz.com",
      hours: t("pages.support.agenciesHours", "Lun-Ven 8h-18h, Sam 9h-13h"),
    },
    {
      country: t("bossizSite.countries.sn", "Sénégal"),
      address: "Dakar, Sénégal",
      phone: null,
      email: "support@bossiz.com",
      hours: t("pages.support.agenciesHours", "Lun-Ven 8h-18h, Sam 9h-13h"),
    },
  ];

  const socialLinks = [
    { key: "facebook", icon: Facebook, url: config.social.facebook },
    { key: "twitter", icon: Twitter, url: config.social.twitter },
    { key: "instagram", icon: Instagram, url: config.social.instagram },
    { key: "youtube", icon: Youtube, url: config.social.youtube },
    { key: "linkedin", icon: Linkedin, url: config.social.linkedin },
  ].filter((s) => s.url);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 md:py-20 bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter drop-shadow-lg">
            {t("pages.contact.title", "Contactez-nous")}
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto font-medium">
            {t("pages.contact.subtitle", "Tous les moyens de nous joindre, réunis au même endroit")}
          </p>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Direct contact channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-16">
          {directChannels.map((channel) => {
            const Icon = channel.icon;
            const content = (
              <Card className="h-full hover:shadow-lg transition-all group cursor-pointer">
                <CardContent className="p-6 text-center flex flex-col items-center h-full">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-1">{channel.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{channel.description}</p>
                  <p className="font-bold text-primary text-sm mt-auto">{channel.value}</p>
                </CardContent>
              </Card>
            );
            if (channel.onClick) {
              return (
                <button key={channel.title} onClick={channel.onClick} className="text-left">
                  {content}
                </button>
              );
            }
            return (
              <a key={channel.title} href={channel.href} target={channel.href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                {content}
              </a>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Agencies */}
          <div>
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              {t("pages.contact.agenciesTitle", "Nos agences")}
            </h2>
            <div className="space-y-4">
              {agencies.map((agency) => (
                <Card key={agency.country}>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3">{agency.country}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        {agency.address}
                      </p>
                      {agency.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                          <a href={`tel:${agency.phone.replace(/\s/g, "")}`} className="hover:text-primary">{agency.phone}</a>
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                        <a href={`mailto:${agency.email}`} className="hover:text-primary">{agency.email}</a>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                        {agency.hours}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {socialLinks.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  {t("pages.contact.socialTitle", "Suivez-nous")}
                </h3>
                <div className="flex gap-3">
                  {socialLinks.map(({ key, icon: Icon, url }) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white text-primary transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t("pages.contact.formTitle", "Envoyez-nous un message")}</CardTitle>
              </CardHeader>
              <CardContent>
                <UnifiedForm onSubmit={handleSubmit} variant="contact" loading={sendingMessage}>
                  <UnifiedFormField
                    label={t("pages.support.form.name")}
                    name="name"
                    placeholder={t("pages.support.namePlaceholder")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <UnifiedFormField
                    label={t("pages.support.form.email")}
                    name="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <UnifiedFormField
                    label={t("pages.support.form.reference")}
                    name="bookingReference"
                    placeholder={t("pages.support.referencePlaceholder")}
                    value={formData.bookingReference}
                    onChange={(e) => setFormData({ ...formData, bookingReference: e.target.value })}
                  />
                  <UnifiedFormField
                    label={t("pages.support.form.subject")}
                    name="subject"
                    placeholder={t("pages.support.subjectPlaceholder")}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">{t("pages.support.form.message")}</label>
                    <Textarea
                      placeholder={t("pages.support.messagePlaceholder")}
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                  <UnifiedSubmitButton loading={sendingMessage} fullWidth>
                    {t("pages.support.sendMessage")}
                  </UnifiedSubmitButton>
                </UnifiedForm>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick links to help center / support */}
        <Card className="border-0 bg-muted/50">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {t("pages.contact.helpRedirect", "Vous cherchez une réponse rapide ? Consultez notre centre d'aide ou gérez votre réservation directement.")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" asChild>
                <a href="/help">{t("nav.help", "Centre d'aide")}</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/support">{t("nav.support", "Support")}</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
