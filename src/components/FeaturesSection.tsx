import { Shield, Award, Headphones } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHomepageConfigContext } from "@/contexts/HomepageConfigContext";

const FeaturesSection = () => {
  const { t } = useTranslation();
  const { config, loading } = useHomepageConfigContext();

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Shield': return Shield;
      case 'Award': return Award;
      case 'Headphones': return Headphones;
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
            return (
              <div
                key={feature.id}
                className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color || 'from-blue-500 to-blue-600'} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
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
