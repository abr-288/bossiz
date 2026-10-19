import { Shield, Award, Headphones, Smartphone, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHomepageConfigContext } from "@/contexts/HomepageConfigContext";
import { localizeRow } from "@/lib/translatableContent";

// Les avantages en base ont des identifiants UUID : on retrouve la clé de
// traduction à partir des titres par défaut. Un titre personnalisé s'affiche tel quel.
// Lignes sans feature_id exploitable : correspondance par titre
const FEATURE_KEYS_BY_TITLE: Record<string, string> = {
  "Réservation Sécurisée": "secure-booking",
  "Meilleurs Prix Garantis": "best-prices",
  "Support 24/7": "support-247",
  "Paiement Mobile Money": "mobile-money",
  "Annulation simple": "easy-cancellation",
};
// Textes traduits par argument
const FEATURE_TEXT: Record<string, { title: string; description: string }> = {
  "secure-booking": { title: "homepage.features.secure-booking.title", description: "homepage.features.secure-booking.description" },
  "best-prices": { title: "homepage.features.best-prices.title", description: "homepage.features.best-prices.description" },
  "support-247": { title: "ux.features.supportTitle", description: "ux.features.supportDesc" },
  "mobile-money": { title: "ux.features.mobileMoneyTitle", description: "ux.features.mobileMoneyDesc" },
  "easy-cancellation": { title: "ux.features.cancellationTitle", description: "ux.features.cancellationDesc" },
};
const featureKey = (feature: { id: string; key?: string; title: string }) =>
  feature.key ?? FEATURE_KEYS_BY_TITLE[feature.title] ?? feature.id;

const FeaturesSection = () => {
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language.startsWith("fr");
  const { config, loading } = useHomepageConfigContext();

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Shield': return Shield;
      case 'Award': return Award;
      case 'Headphones': return Headphones;
      case 'Smartphone': return Smartphone;
      case 'RotateCcw': return RotateCcw;
      default: return Shield;
    }
  };

  if (loading) {
    return (
      <section className="py-10 md:py-14 bg-background w-full">
        <div className="site-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const features = config.features;

  return (
    <section className="py-10 md:py-14 bg-background w-full">
      <div className="site-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = getIconComponent(feature.icon);
            // Français : texte saisi dans l'admin ; autres langues : traduction intégrée
            // Autres langues : traduction automatique du texte saisi, sinon traduction intégrée
            const text = FEATURE_TEXT[featureKey(feature)];
            const auto = localizeRow(feature, i18n.language);
            const hasAuto = auto !== feature;
            const title = isFrench || hasAuto || !text ? auto.title : t(text.title);
            const description = isFrench || hasAuto || !text ? auto.description : t(text.description);
            return (
              <div
                key={feature.id}
                className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color || 'from-primary to-primary/80'} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
