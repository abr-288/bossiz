import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import { BossizSiteLayout } from "@/components/bossiz/BossizSiteLayout";
import { useBossizMicrositeContent } from "@/hooks/useBossizMicrositeContent";
import { getBossizIcon } from "@/data/bossizIconMap";
import bannerImage from "@/assets/hero-slide-4.jpg";

const BossizSNServices = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { content, loading } = useBossizMicrositeContent("sn");

  if (loading || !content) {
    return (
      <BossizSiteLayout country="sn" activePage="services">
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-bossiz-teal-dark" />
        </div>
      </BossizSiteLayout>
    );
  }

  return (
    <BossizSiteLayout country="sn" activePage="services" tagline={content.tagline}>
      {/* Bannière avec image de fond */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img src={bannerImage} alt="Services Bossiz Sénégal" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-bossiz-teal-dark/80" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <p className="text-bossiz-gold-light text-sm font-semibold uppercase tracking-[0.25em] mb-3">{content.services.eyebrow}</p>
          <h1 className="font-black text-3xl md:text-5xl text-white drop-shadow-lg">
            {content.services.title}
          </h1>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <p className="text-bossiz-navy-dark/60 leading-relaxed">
              {content.services.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {content.servicesList.map((service) => {
              const Icon = getBossizIcon(service.icon);
              return (
                <Card key={service.id} className="rounded-xl border-0 border-t-4 border-t-bossiz-gold shadow-md bg-white">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-full bg-bossiz-cream-mint flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-bossiz-teal-dark" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-bold text-xl text-bossiz-navy-dark mb-2">{service.title}</h3>
                    <p className="text-sm text-bossiz-navy-dark/60 mb-5">{service.description}</p>
                    <ul className="space-y-2 mb-6">
                      {service.features.slice(0, 3).map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-bossiz-navy-dark/70">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-bossiz-gold shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => navigate("/support")}
                      className="text-xs font-semibold uppercase tracking-wider text-bossiz-teal-dark hover:text-bossiz-gold-dark inline-flex items-center gap-1"
                    >
                      {t("bossizSite.requestQuote")} <ChevronRight className="w-3 h-3" />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.additionalServicesList.map((service) => {
              const Icon = getBossizIcon(service.icon);
              return (
                <Card key={service.id} className="rounded-xl border border-bossiz-cream-taupe/40 bg-bossiz-cream-warm/30">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-bossiz-cream-mint flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-bossiz-teal-dark" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-bossiz-navy-dark mb-2">{service.title}</h4>
                      <ul className="space-y-1">
                        {service.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-xs text-bossiz-navy-dark/60">
                            <CheckCircle className="w-3 h-3 text-bossiz-gold-dark shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </BossizSiteLayout>
  );
};

export default BossizSNServices;
