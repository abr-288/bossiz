import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Cookie, ShieldCheck, Settings, BarChart3, Clock, Mail } from "lucide-react";

const CookiePolicy = () => {
  const { config } = useSiteConfigContext();
  const siteName = config.branding.siteName;
  const { consent, savePreferences } = useCookieConsent();
  const [preferences, setPreferences] = useState(consent?.preferences ?? false);
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);

  const handleSave = () => {
    savePreferences({ preferences, analytics });
    toast.success("Vos préférences de cookies ont été enregistrées");
  };

  const sections = [
    {
      icon: Cookie,
      title: "1. Qu'est-ce qu'un cookie ?",
      content: [
        "Un cookie est un petit fichier texte déposé sur votre appareil lors de votre visite. Il permet au site de reconnaître votre navigateur d'une visite à l'autre et de retenir certaines informations (préférences, session de connexion).",
        `Cette page décrit les cookies et technologies similaires (stockage local du navigateur) utilisés par ${siteName}, conformément à la loi ivoirienne n°2013-450 relative à la protection des données à caractère personnel (régulateur : ARTCI) et, pour nos visiteurs situés dans l'Union européenne, au Règlement Général sur la Protection des Données (RGPD).`,
      ],
    },
    {
      icon: ShieldCheck,
      title: "2. Cookies essentiels (toujours actifs)",
      content: [
        "Strictement nécessaires au fonctionnement du site. Ils ne peuvent pas être désactivés et ne nécessitent pas de consentement :",
        "• **Session d'authentification** : vous garder connecté à votre compte en toute sécurité.",
        "• **Sécurité** : protection contre la fraude et les accès non autorisés (jetons CSRF, limitation de débit).",
        "• **Panier de réservation** : conserver votre réservation en cours pendant le parcours de paiement.",
      ],
    },
    {
      icon: Settings,
      title: "3. Cookies de préférence (avec votre accord)",
      content: [
        "Améliorent votre confort d'utilisation sans être indispensables :",
        "• Langue d'affichage (français, anglais, chinois).",
        "• Devise préférée.",
        "• Mode sombre / clair.",
      ],
    },
    {
      icon: BarChart3,
      title: "4. Cookies analytiques (avec votre accord)",
      content: [
        `À ce jour, ${siteName} n'a pas activé d'outil de mesure d'audience tiers. Cette catégorie existe pour vous permettre de donner par avance votre préférence : si un outil d'analyse anonymisée est activé à l'avenir, votre choix ici sera respecté sans nouveau bandeau, sauf changement substantiel qui redemanderait votre consentement.`,
      ],
    },
    {
      icon: Clock,
      title: "5. Durée de conservation",
      content: [
        "• **Cookies de session** (authentification) : supprimés à la fermeture du navigateur ou à la déconnexion.",
        "• **Choix de consentement aux cookies** : conservé 6 mois, puis nous vous redemanderons votre préférence.",
        "• **Préférences (langue, devise, thème)** : conservées jusqu'à modification ou effacement de vos données de navigateur.",
      ],
    },
    {
      icon: Mail,
      title: "6. Gérer votre consentement",
      content: [
        "Vous pouvez modifier vos préférences à tout moment ci-dessous, ou en effaçant les données de site de votre navigateur pour revoir le bandeau de consentement.",
        `Pour toute question : privacy@bossiz.com. Voir aussi notre Politique de Confidentialité pour le détail des données collectées et vos droits (accès, rectification, suppression, opposition, portabilité).`,
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Cookie className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Politique des Cookies
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comment {siteName} utilise les cookies et comment vous pouvez contrôler vos préférences.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <section key={index} className="bg-card border border-border rounded-xl p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground pt-1.5">{section.title}</h2>
                  </div>
                  <div className="pl-14 space-y-2">
                    {section.content.map((line, i) => (
                      <p
                        key={i}
                        className="text-muted-foreground text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>'),
                        }}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Panneau de gestion des préférences */}
            <section className="bg-card border border-border rounded-xl p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground pt-1.5">Gérer mes préférences</h2>
              </div>
              <div className="pl-0 md:pl-14 space-y-3 max-w-xl">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-sm">Essentiels</p>
                    <p className="text-xs text-muted-foreground">Toujours actifs.</p>
                  </div>
                  <Switch checked disabled aria-label="Cookies essentiels (toujours actifs)" />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <div>
                    <Label htmlFor="cp-pref" className="font-medium text-sm cursor-pointer">Préférences</Label>
                  </div>
                  <Switch id="cp-pref" checked={preferences} onCheckedChange={setPreferences} />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <div>
                    <Label htmlFor="cp-analytics" className="font-medium text-sm cursor-pointer">Analytique</Label>
                  </div>
                  <Switch id="cp-analytics" checked={analytics} onCheckedChange={setAnalytics} />
                </div>
                <Button onClick={handleSave} className="mt-2">Enregistrer mes choix</Button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
