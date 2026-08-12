import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, Mail, Phone, MessageCircle } from "lucide-react";
import { HELP_DOMAINS, HELP_FAQ } from "@/data/helpFaqData";

const Help = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const query = searchQuery.trim().toLowerCase();
    return HELP_FAQ.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [isSearching, searchQuery]);

  const faqCountByDomain = useMemo(() => {
    const counts: Record<string, number> = {};
    HELP_FAQ.forEach((faq) => {
      counts[faq.domain] = (counts[faq.domain] || 0) + 1;
    });
    return counts;
  }, []);

  const handleDomainClick = (domainId: string) => {
    setSearchQuery("");
    setActiveDomain(domainId);
    requestAnimationFrame(() => {
      sectionRefs.current[domainId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleChatClick = () => {
    window.dispatchEvent(new CustomEvent("open-live-chat"));
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />

      {/* Hero */}
      <div className="relative py-16 md:py-24 bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-black mb-4 text-white drop-shadow-lg tracking-tighter">
              {t("help.title", "Centre d'aide")}
            </h1>
            <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto font-medium">
              {t("help.subtitle", "Toutes les réponses à vos questions, classées par thème")}
            </p>
          </div>

          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder={t("help.searchPlaceholder", "Rechercher une question...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-6 h-14 text-base bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl rounded-2xl focus-visible:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Domain grid */}
      {!isSearching && (
        <div className="bg-background py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">{t("help.categoriesTitle", "Parcourir par thème")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {HELP_DOMAINS.map((domain) => {
                const Icon = domain.icon;
                return (
                  <button
                    key={domain.id}
                    onClick={() => handleDomainClick(domain.id)}
                    className={`text-left p-4 rounded-xl border transition-all hover:shadow-lg ${
                      activeDomain === domain.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <Icon className="h-8 w-8 mb-3 text-primary" />
                    <h3 className="font-semibold text-sm mb-1">{domain.label}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{domain.description}</p>
                    <p className="text-[11px] text-primary/70 font-semibold mt-2">
                      {t("help.questionsCount", "{{count}} questions", { count: faqCountByDomain[domain.id] || 0 })}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FAQ content */}
      <div className="bg-gradient-to-br from-secondary/5 to-accent/5 py-12 flex-1">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {isSearching ? (
              <>
                <h2 className="text-2xl font-bold mb-6 text-center">
                  {t("help.searchResultsCount", "{{count}} résultat(s) pour \"{{query}}\"", { count: searchResults.length, query: searchQuery })}
                </h2>
                {searchResults.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <HelpCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">{t("help.noResults.title", "Aucun résultat")}</h3>
                      <p className="text-muted-foreground mb-4">
                        {t("help.noResults.description", "Essayez un autre mot-clé, ou contactez directement notre équipe.")}
                      </p>
                      <Button onClick={() => navigate("/contact")}>
                        <Mail className="mr-2 h-4 w-4" />
                        {t("help.contactSupport", "Nous contacter")}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-2 sm:p-4">
                      <Accordion type="single" collapsible className="w-full">
                        {searchResults.map((faq, index) => (
                          <AccordionItem key={index} value={`search-${index}`}>
                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-8 text-center">{t("help.allQuestionsTitle", "Toutes les questions par thème")}</h2>
                {HELP_DOMAINS.map((domain) => {
                  const domainFaqs = HELP_FAQ.filter((faq) => faq.domain === domain.id);
                  if (domainFaqs.length === 0) return null;
                  const Icon = domain.icon;
                  return (
                    <div
                      key={domain.id}
                      ref={(el) => { sectionRefs.current[domain.id] = el; }}
                      className="scroll-mt-24"
                    >
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-primary" />
                            {domain.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Accordion type="single" collapsible className="w-full">
                            {domainFaqs.map((faq, index) => (
                              <AccordionItem key={index} value={`${domain.id}-${index}`}>
                                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("help.ctaTitle", "Vous ne trouvez pas votre réponse ?")}</h2>
          <p className="text-xl mb-8 text-white/90">
            {t("help.ctaSubtitle", "Notre équipe est disponible pour vous accompagner")}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate("/contact")}>
              <Mail className="mr-2 h-5 w-5" />
              {t("help.contactSupport", "Nous contacter")}
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" asChild>
              <a href="tel:+22527200000000">
                <Phone className="mr-2 h-5 w-5" />
                +225 27 20 00 00 00
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" onClick={handleChatClick}>
              <MessageCircle className="mr-2 h-5 w-5" />
              {t("pages.support.contact.chat", "Chat en direct")}
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Help;
