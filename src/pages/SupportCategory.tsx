import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight, Search, Phone, Mail, MessageCircle, ArrowLeft } from "lucide-react";
import { SUPPORT_CATEGORIES } from "@/data/supportCategories";

const SupportCategory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchQuery, setSearchQuery] = useState("");

  const category = SUPPORT_CATEGORIES.find((c) => c.id === categoryId);

  const faqs = useMemo(() => {
    if (!category) return [];
    const items: { question: string; answer: string }[] = [];
    for (let i = 1; i <= 4; i++) {
      const question = t(`pages.support.faqByCategory.${category.id}.q${i}`, { defaultValue: "" });
      const answer = t(`pages.support.faqByCategory.${category.id}.a${i}`, { defaultValue: "" });
      if (question) items.push({ question, answer });
    }
    return items;
  }, [category, t]);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return faqs;
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [faqs, searchQuery]);

  const otherCategories = SUPPORT_CATEGORIES.filter((c) => c.id !== categoryId);

  const handleChatClick = () => {
    window.dispatchEvent(new CustomEvent('open-live-chat'));
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground mb-6">
            {t("pages.support.search.noResults", { query: categoryId ?? "" })}
          </p>
          <Button onClick={() => navigate("/support")}>
            {t("pages.support.categoryPage.backToSupport")}
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = category.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/support" className="hover:text-primary transition-colors">
            {t("pages.support.categoryPage.breadcrumbHome")}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">
            {t(`pages.support.categories.${category.id}.title`)}
          </span>
        </nav>

        {/* Category header */}
        <div className="flex items-start gap-5 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-foreground mb-2">
              {t(`pages.support.categories.${category.id}.title`)}
            </h1>
            <p className="text-muted-foreground font-medium">
              {t(`pages.support.categories.${category.id}.description`)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ column */}
          <div className="lg:col-span-2">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("pages.support.categoryPage.searchPlaceholder")}
                className="h-12 pl-11 rounded-xl"
              />
            </div>

            <Card>
              <CardContent className="p-2 sm:p-4">
                {filteredFaqs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    {t("pages.support.search.noResults", { query: searchQuery })}
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq, index) => (
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
                )}
              </CardContent>
            </Card>

            <Button
              variant="ghost"
              className="mt-6 gap-2 text-muted-foreground"
              onClick={() => navigate("/support")}
            >
              <ArrowLeft className="w-4 h-4" />
              {t("pages.support.categoryPage.backToSupport")}
            </Button>
          </div>

          {/* Sidebar: other categories + contact */}
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                {t("pages.support.categoryPage.otherCategoriesTitle")}
              </h3>
              <div className="space-y-2">
                {otherCategories.map(({ id, icon: OtherIcon }) => (
                  <Link
                    key={id}
                    to={`/support/${id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <OtherIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {t(`pages.support.categories.${id}.title`)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                {t("pages.support.stillNeedHelp")}
              </h3>
              <div className="space-y-3">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t('pages.support.callUs')}</p>
                      <p className="text-xs text-muted-foreground">+225 27 20 00 00 00</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t('pages.support.writeToUs')}</p>
                      <p className="text-xs text-muted-foreground">support@bossiz.com</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-bold text-sm">{t('pages.support.contact.chat')}</p>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-lg" onClick={handleChatClick}>
                      {t('pages.support.startChat')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SupportCategory;
