import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LazyImage } from "@/components/ui/lazy-image";
import {
  Handshake,
  Hotel,
  UtensilsCrossed,
  Compass,
  Hammer,
  Car,
  Sparkles,
  Check,
  FileText,
  Search,
  Rocket,
  LayoutGrid,
  Percent,
  Clock,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import bannerTours from "@/assets/banner-tours.jpg";
import { useTranslation } from "react-i18next";
import { MOTION } from "@/lib/motion";

interface PartnershipType {
  id: string;
  icon: typeof Hotel;
  title: string;
  tagline: string;
  facts: string[];
  conditions: string[];
  ctaLabel: string;
  ctaTo: string;
  highlight?: string;
}

const partnershipTypes: PartnershipType[] = [
  {
    id: "hotels",
    icon: Hotel,
    title: "ux.partnershipData.hotelsTitle",
    tagline: "ux.partnershipData.hotelsTagline",
    facts: ["ux.partnershipData.free", "ux.partnershipData.share"],
    conditions: [
      "ux.partnershipData.signup",
      "ux.partnershipData.hotelsC2",
      "ux.partnershipData.hotelsC3",
      "ux.partnershipData.hotelsC4",
    ],
    ctaLabel: "ux.partnershipData.hotelsCta",
    ctaTo: "/devenir-partenaire?type=hotel",
  },
  {
    id: "restaurants",
    icon: UtensilsCrossed,
    title: "ux.partnershipData.restaurantsTitle",
    tagline: "ux.partnershipData.restaurantsTagline",
    facts: ["ux.partnershipData.free", "ux.partnershipData.share"],
    conditions: [
      "ux.partnershipData.signup",
      "ux.partnershipData.restaurantsC2",
      "ux.partnershipData.restaurantsC3",
      "ux.partnershipData.restaurantsC4",
    ],
    ctaLabel: "ux.partnershipData.restaurantsCta",
    ctaTo: "/devenir-partenaire?type=restaurant",
  },
  {
    id: "activities",
    icon: Compass,
    title: "ux.partnershipData.activitiesTitle",
    tagline: "ux.partnershipData.activitiesTagline",
    facts: ["ux.partnershipData.free", "ux.partnershipData.share"],
    conditions: [
      "ux.partnershipData.signup",
      "ux.partnershipData.activitiesC2",
      "ux.partnershipData.activitiesC3",
    ],
    ctaLabel: "ux.partnershipData.activitiesCta",
    ctaTo: "/devenir-partenaire?type=activity",
  },
  {
    id: "artisans",
    icon: Hammer,
    title: "ux.partnershipData.artisansTitle",
    tagline: "ux.partnershipData.artisansTagline",
    facts: ["ux.partnershipData.free", "ux.partnershipData.share"],
    conditions: [
      "ux.partnershipData.signup",
      "ux.partnershipData.artisansC2",
      "ux.partnershipData.artisansC3",
      "ux.partnershipData.artisansC4",
    ],
    ctaLabel: "ux.partnershipData.artisansCta",
    ctaTo: "/devenir-partenaire?type=artisan",
  },
  {
    id: "wellness",
    icon: Sparkles,
    title: "ux.partnershipData.wellnessTitle",
    tagline: "ux.partnershipData.wellnessTagline",
    facts: ["ux.partnershipData.free", "ux.partnershipData.share"],
    conditions: [
      "ux.partnershipData.signup",
      "ux.partnershipData.wellnessC2",
      "ux.partnershipData.wellnessC3",
    ],
    ctaLabel: "ux.partnershipData.wellnessCta",
    ctaTo: "/devenir-partenaire?type=wellness",
  },
  {
    id: "cars",
    icon: Car,
    title: "ux.partnershipData.carsTitle",
    tagline: "ux.partnershipData.carsTagline",
    facts: ["ux.partnershipData.carsFrom", "ux.partnershipData.carsCommission"],
    conditions: [
      "ux.partnershipData.carsC1",
      "ux.partnershipData.carsC2",
      "ux.partnershipData.carsC3",
    ],
    ctaLabel: "ux.partnershipData.carsCta",
    ctaTo: "/devenir-partenaire?type=cars",
    highlight: "ux.partnershipData.paidPlans",
  },
];

const PartnershipCard = ({ type, index }: { type: PartnershipType; index: number }) => {
  const { t } = useTranslation();
  const Icon = type.icon;
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: MOTION.slow, delay: index * 0.05 }}
    >
      <Card className="flex flex-col h-full transition-all duration-slow ease-standard hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <CardContent className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-11 h-11 flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            {type.highlight && (
              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                {t(type.highlight)}
              </Badge>
            )}
          </div>

          <h3 className="font-bold text-base mb-0.5">{t(type.title)}</h3>
          <p className="text-sm text-muted-foreground mb-3">{t(type.tagline)}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {type.facts.map((fact) => (
              <span
                key={fact}
                className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground"
              >
                {t(fact)}
              </span>
            ))}
          </div>

          <Collapsible open={open} onOpenChange={setOpen} className="mb-4">
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              {t("ux.partnershipData.seeConditions")}
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-1.5 mt-3">
                {type.conditions.map((condition) => (
                  <li key={condition} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t(condition)}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>

          <Button asChild className="w-full mt-auto">
            <Link to={type.ctaTo}>{t(type.ctaLabel)}</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const steps = [
  {
    icon: FileText,
    title: "ux.partnershipData.step1Title",
    description: "ux.partnershipData.step1Desc",
  },
  {
    icon: Search,
    title: "ux.partnershipData.step2Title",
    description: "ux.partnershipData.step2Desc",
  },
  {
    icon: Rocket,
    title: "ux.partnershipData.step3Title",
    description: "ux.partnershipData.step3Desc",
  },
];

const Partnership = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 md:py-20 bg-brand overflow-hidden">
        <LazyImage
          src={bannerTours}
          alt={t("ux.partnership.bannerAlt")}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand/70" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 text-white/90 text-sm font-medium mb-3">
            <Handshake className="w-4 h-4" />
            {t("ux.partnership.eyebrow")}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tighter drop-shadow-lg">
            {t("ux.partnership.title")}
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto font-medium mb-8">
            {t("ux.partnershipData.heroDesc")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-white/90 text-sm font-medium">
            <span className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-gold" />
              {t("ux.partnership.categories")}
            </span>
            <span className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-gold" />
              {t("ux.partnershipData.share")}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              {t("ux.partnership.response")}
            </span>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        {/* Partnership types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {partnershipTypes.map((type, index) => (
            <PartnershipCard key={type.id} type={type} index={index} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-3xl mx-auto -mt-10 mb-16">
          {t("ux.partnershipData.footnote")}
        </p>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-2xl font-extrabold text-foreground mb-10 text-center">{t("ux.partnership.how")}</h2>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 max-w-4xl mx-auto">
            <div className="hidden md:block absolute top-7 left-[16.5%] right-[16.5%] h-px bg-border" />
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative text-center px-4">
                  <div className="relative w-14 h-14 mx-auto mb-4 bg-background border-2 border-primary/20 rounded-2xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="font-bold mb-2">{t(step.title)}</h3>
                  <p className="text-sm text-muted-foreground">{t(step.description)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center max-w-xl mx-auto">
          <p className="text-sm text-muted-foreground mb-2">
            {t("ux.partnership.other")}
          </p>
          <Button asChild variant="outline" size="lg">
            <Link to="/devenir-partenaire">{t("ux.partnership.general")}</Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-6">
            {t("ux.partnershipData.alreadyPartner")}{" "}
            <Link to="/agency" className="text-primary font-medium hover:underline">
              {t("ux.partnership.agencySpace")}
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Partnership;
