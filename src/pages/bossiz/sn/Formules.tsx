import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BossizSiteLayout } from "@/components/bossiz/BossizSiteLayout";
import { useBossizMicrositeContent } from "@/hooks/useBossizMicrositeContent";
import bannerImage from "@/assets/hero-slide-5.jpg";

const BossizSNFormules = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { content, loading } = useBossizMicrositeContent("sn");

  if (loading || !content) {
    return (
      <BossizSiteLayout country="sn" activePage="formules">
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-bossiz-teal-dark" />
        </div>
      </BossizSiteLayout>
    );
  }

  return (
    <BossizSiteLayout country="sn" activePage="formules" tagline={content.tagline}>
      {/* Bannière avec image de fond */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img src={bannerImage} alt="Formules Bossiz Sénégal" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-bossiz-teal-dark/80" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-black text-3xl md:text-5xl text-white drop-shadow-lg">
            {content.plans.title}
          </h1>
        </div>
      </section>

      <section className="py-24 bg-bossiz-cream-warm/30 min-h-[80vh]">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-bossiz-navy-dark/60 leading-relaxed">
              {content.plans.subtitle}
            </p>
          </div>

          <p className="text-center text-sm uppercase tracking-[0.2em] text-bossiz-teal-dark font-semibold mb-6">
            {content.plans.monthlyLabel}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {content.monthlyPlansList.map((plan) => (
              <Card
                key={plan.name}
                className={`rounded-xl bg-white ${
                  plan.featured ? "border-2 border-bossiz-gold shadow-xl" : "border border-bossiz-cream-taupe/40"
                }`}
              >
                <CardContent className="p-10 text-center">
                  {plan.featured && (
                    <span className="inline-block mb-4 text-[10px] uppercase tracking-widest bg-bossiz-gold text-bossiz-navy-dark px-3 py-1 rounded-full font-bold">
                      {content.plans.recommendedLabel}
                    </span>
                  )}
                  <h3 className="font-bold text-2xl text-bossiz-navy-dark mb-4">{plan.name}</h3>
                  <p className="text-sm text-bossiz-navy-dark/60 mb-8 leading-relaxed">{plan.detail}</p>
                  <Button
                    className="w-full rounded-full bg-bossiz-teal-dark text-white hover:bg-bossiz-teal font-semibold text-sm py-5"
                    onClick={() => navigate("/support")}
                  >
                    {t("bossizSite.requestQuote")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm uppercase tracking-[0.2em] text-bossiz-teal-dark font-semibold mb-6">
            {content.plans.shortStayLabel}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.shortStayPlansList.map((plan) => (
              <Card key={plan.name} className="rounded-xl border border-bossiz-cream-taupe/40 bg-white/60">
                <CardContent className="p-8 text-center">
                  <h3 className="font-bold text-xl text-bossiz-navy-dark mb-3">{plan.name}</h3>
                  <p className="text-xs text-bossiz-navy-dark/60 mb-6 leading-relaxed">{plan.detail}</p>
                  <button
                    onClick={() => navigate("/support")}
                    className="text-xs font-semibold uppercase tracking-wider text-bossiz-teal-dark hover:text-bossiz-gold-dark"
                  >
                    {t("bossizSite.requestQuote")} →
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </BossizSiteLayout>
  );
};

export default BossizSNFormules;
