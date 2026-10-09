import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";
import { Building2, Server, Copyright, Gavel, Mail, AlertCircle } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import heroImage from "@/assets/hero-slide-5.jpg";

const LegalNotice = () => {
  const { config } = useSiteConfigContext();
  const siteName = config.branding.siteName;

  const sections = [
    {
      icon: Building2,
      title: "1. Éditeur du site",
      content: [
        `Le site ${siteName} (accessible notamment à l'adresse app.bossiz.com) est édité par :`,
        "",
        "**CONCIERGERIE BOSSIZ**, Société à Responsabilité Limitée Unipersonnelle (SARLU)",
        "• Capital social : 5 000 000 FCFA",
        "• Siège social : Abidjan, Cocody, Riviera CIAD, face à la Pharmacie Mpouto, Immeuble Diamantine, Côte d'Ivoire",
        "• RCCM : CI-ABJ-03-2024-B13-05959 (Tribunal de Commerce d'Abidjan)",
        "• Numéro de Compte Contribuable (NCC) : 2402095S",
        "• Gérante / Directrice de la publication : N'Guessan Elie Ahou Sara",
        "• E-mail : contact@bossiz.com",
      ],
    },
    {
      icon: Gavel,
      title: "2. Activité",
      content: [
        `${siteName} exerce notamment, dans le cadre de son objet social enregistré au RCCM, des activités de billetterie, agence de voyage et circuit touristique, aux côtés d'opérations de conciergerie privée et d'entreprise, commerce général et prestations de services.`,
        "L'objet social complet est consultable auprès du greffe du Tribunal de Commerce d'Abidjan sous le numéro RCCM ci-dessus.",
      ],
    },
    {
      icon: Server,
      title: "3. Hébergement",
      content: [
        "**Hébergement du site web** : Contabo GmbH (serveur privé virtuel), Allemagne.",
        "**Infrastructure technique (base de données, authentification, stockage, fonctions serveur)** : Supabase Inc., dont les serveurs pour ce projet sont situés dans la région Europe (Irlande).",
      ],
    },
    {
      icon: Copyright,
      title: "4. Propriété intellectuelle",
      content: [
        `L'ensemble des éléments du site ${siteName} (structure, textes, logos, éléments graphiques) est protégé par le droit de la propriété intellectuelle. Voir les Conditions Générales d'Utilisation, section « Propriété intellectuelle », pour le détail.`,
      ],
    },
    {
      icon: AlertCircle,
      title: "5. Droit applicable et réclamations",
      content: [
        "Les présentes mentions légales sont soumises au droit ivoirien. En cas de litige, les tribunaux compétents d'Abidjan sont seuls compétents, sauf disposition légale contraire.",
        "Pour toute réclamation relative à vos données personnelles, voir la Politique de Confidentialité (section « Contact et réclamations »).",
      ],
    },
    {
      icon: Mail,
      title: "6. Contact",
      content: [
        `Pour toute question relative au site ${siteName} ou à la présente page :`,
        "",
        "E-mail : contact@bossiz.com",
        "Formulaire : voir la page Contact du site",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-16">
      <Navbar />
      <PageHero
        image={heroImage}
        title={<>Mentions Légales</>}
        subtitle={<>Informations légales relatives à l'éditeur et à l'hébergement du site {siteName}, conformément à la réglementation ivoirienne applicable aux sites marchands.</>}
      />
      <main className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">

          <div className="space-y-8">
            {sections.map((section, index) => {
              return (
                <section key={index} className="bg-card border border-border rounded-xl p-6 md:p-8">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                  </div>
                  <div className="space-y-2">
                    {section.content.map((line, i) => (
                      <p
                        key={i}
                        className={`text-sm leading-relaxed ${line.includes("à compléter") ? "text-warning-foreground font-medium" : "text-muted-foreground"}`}
                        dangerouslySetInnerHTML={{
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>'),
                        }}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalNotice;
