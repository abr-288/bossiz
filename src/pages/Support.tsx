import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone, Mail, MessageCircle, Clock, Search,
  CalendarCheck, ArrowRight, X, ChevronRight
} from "lucide-react";
import { useSupportMessage } from "@/hooks/useSupportMessage";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNewsletterSubscribe } from "@/hooks/useNewsletterSubscribe";
import { UnifiedForm, UnifiedFormField, UnifiedSubmitButton } from "@/components/forms";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { SUPPORT_CATEGORIES } from "@/data/supportCategories";

const Support = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await sendMessage(formData);
    if (success) {
      setFormData({ name: "", email: "", bookingReference: "", subject: "", message: "" });
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await subscribe(newsletterEmail);
    if (result) {
      toast({
        title: t('footer.newsletter.subscribeSuccess'),
        description: result.message,
      });
      setNewsletterEmail("");
    }
  };

  const handleChatClick = () => {
    window.dispatchEvent(new CustomEvent('open-live-chat'));
  };

  // Aplatit toutes les FAQ de toutes les catégories pour la recherche globale
  const allFaqs = useMemo(() => {
    return SUPPORT_CATEGORIES.flatMap(({ id }) => {
      const items: { question: string; answer: string; category: string }[] = [];
      for (let i = 1; i <= 4; i++) {
        const question = t(`pages.support.faqByCategory.${id}.q${i}`, { defaultValue: "" });
        const answer = t(`pages.support.faqByCategory.${id}.a${i}`, { defaultValue: "" });
        if (question) items.push({ question, answer, category: id });
      }
      return items;
    });
  }, [t]);

  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const query = searchQuery.trim().toLowerCase();
    return allFaqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [isSearching, searchQuery, allFaqs]);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero Section with help search */}
      <section className="relative min-h-[45vh] md:min-h-[50vh] flex items-center justify-center overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background/10"></div>

        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter drop-shadow-lg">
              {t("pages.support.title")}
            </h1>
            <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md mb-8">
              {t("support.subtitle", "Notre équipe d'experts est disponible 24/7 pour répondre à toutes vos questions et vous accompagner.")}
            </p>

            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("pages.support.search.placeholder")}
                className="h-14 pl-14 pr-12 rounded-2xl text-base shadow-2xl border-0 bg-white text-foreground"
              />
              {isSearching && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label={t("common.close", "Fermer")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Manage my booking - prominent quick access */}
        <Card className="relative z-20 -mt-16 mb-12 border-0 bg-white shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-black text-foreground mb-1">
                {t("pages.support.manageBooking.title")}
              </h2>
              <p className="text-muted-foreground font-medium">
                {t("pages.support.manageBooking.description")}
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 px-8 rounded-xl font-bold gap-2 flex-shrink-0"
              onClick={() => navigate("/booking-history")}
            >
              {t("pages.support.manageBooking.cta")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {isSearching ? (
          /* Search results */
          <div className="mb-16">
            <Card>
              <CardHeader>
                <CardTitle>{t("pages.support.search.resultsCount", { count: searchResults.length })}</CardTitle>
              </CardHeader>
              <CardContent>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    {t("pages.support.search.noResults", { query: searchQuery })}
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {searchResults.map((faq, index) => (
                      <Link
                        key={index}
                        to={`/support/${faq.category}`}
                        className="flex items-start justify-between gap-4 py-4 group hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{faq.question}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{faq.answer}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Category grid */
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                {t("pages.support.categories.sectionTitle")}
              </h2>
              <p className="text-muted-foreground font-medium">
                {t("pages.support.categories.sectionSubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {SUPPORT_CATEGORIES.map(({ id, icon: Icon }) => (
                <Link
                  key={id}
                  to={`/support/${id}`}
                  className="text-left p-5 md:p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm md:text-base mb-1 text-foreground">
                    {t(`pages.support.categories.${id}.title`)}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {t(`pages.support.categories.${id}.description`)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Still need help? Contact channels */}
          <div>
            <h3 className="font-bold text-lg mb-1">{t("pages.support.stillNeedHelp")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("pages.support.stillNeedHelpDesc")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-all group">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">{t('pages.support.callUs')}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{t('pages.support.hours.247')}</p>
                  <p className="font-bold text-primary text-sm">+225 27 20 00 00 00</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all group">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 bg-secondary/5 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-secondary" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">{t('pages.support.writeToUs')}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{t('pages.support.responseWithin24h')}</p>
                  <p className="font-bold text-secondary text-sm">support@bossiz.com</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all group">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-sm mb-2">{t('pages.support.contact.chat')}</h4>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-lg" onClick={handleChatClick}>
                    {t('pages.support.startChat')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Horaires */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">{t('pages.support.hours.title')}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>{t('pages.support.phoneSupport')} :</strong> {t('pages.support.hours.247')}</p>
                      <p><strong>{t('pages.support.agencies')} :</strong> {t('pages.support.agenciesHours')}</p>
                      <p><strong>{t('pages.support.onlineChat')} :</strong> {t('pages.support.hours.247')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('pages.support.form.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <UnifiedForm onSubmit={handleSubmit} variant="contact" loading={sendingMessage}>
                  <UnifiedFormField
                    label={t('pages.support.form.name')}
                    name="name"
                    placeholder={t('pages.support.namePlaceholder')}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <UnifiedFormField
                    label={t('pages.support.form.email')}
                    name="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <UnifiedFormField
                    label={t('pages.support.form.reference')}
                    name="bookingReference"
                    placeholder={t('pages.support.referencePlaceholder')}
                    value={formData.bookingReference}
                    onChange={(e) => setFormData({...formData, bookingReference: e.target.value})}
                  />
                  <UnifiedFormField
                    label={t('pages.support.form.subject')}
                    name="subject"
                    placeholder={t('pages.support.subjectPlaceholder')}
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">{t('pages.support.form.message')}</label>
                    <Textarea
                      placeholder={t('pages.support.messagePlaceholder')}
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required
                      className="w-full"
                    />
                  </div>
                  <UnifiedSubmitButton loading={sendingMessage} fullWidth>
                    {t('pages.support.sendMessage')}
                  </UnifiedSubmitButton>
                </UnifiedForm>
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
                <h3 className="text-3xl md:text-5xl font-black mb-6 leading-tight">{t('pages.support.followNews')} <br className="hidden md:block" /> B-Reserve</h3>
                <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto font-medium">
                  {t('footer.newsletter.description')}
                </p>
                <UnifiedForm onSubmit={handleNewsletterSubmit} variant="contact" loading={subscribing} className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
                  <div className="flex-1">
                    <UnifiedFormField
                      name="email"
                      type="email"
                      placeholder={t('footer.newsletter.placeholder')}
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-14 rounded-2xl"
                    />
                  </div>
                  <UnifiedSubmitButton loading={subscribing} className="bg-secondary text-primary h-14 px-8 rounded-2xl font-black text-lg shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95">
                    {t('pages.support.subscribe')}
                  </UnifiedSubmitButton>
                </UnifiedForm>
                <p className="mt-6 text-xs text-white/50 font-medium">{t('pages.support.newsletterDisclaimer')}</p>
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
