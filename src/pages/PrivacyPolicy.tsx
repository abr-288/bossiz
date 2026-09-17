import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";
import { Shield, Lock, Eye, Database, UserCheck, Globe, Bell, Trash2, Mail, Handshake } from "lucide-react";

const PrivacyPolicy = () => {
  const { config } = useSiteConfigContext();
  const siteName = config.branding.siteName;

  const sections = [
    {
      icon: Database,
      title: "1. Données collectées",
      content: [
        `${siteName} collecte les données suivantes dans le cadre de ses services :`,
        "• **Données d'identité** : nom, prénom, date de naissance, nationalité, numéro de passeport ou pièce d'identité.",
        "• **Données de contact** : adresse e-mail, numéro de téléphone, adresse postale.",
        "• **Données de paiement** : informations de carte bancaire ou mobile money (traitées via des prestataires sécurisés certifiés PCI-DSS — nous ne stockons jamais vos numéros de carte complets).",
        "• **Données de réservation** : détails des vols, hôtels, locations de voiture, activités et séjours réservés.",
        "• **Données de navigation** : adresse IP, type de navigateur, pages visitées, durée de visite, cookies techniques.",
        "• **Données de communication** : messages envoyés au support, avis et commentaires.",
        "• **Données de candidature partenaire** : nom de l'établissement ou de l'agence, description de l'activité, e-mail et téléphone de contact, logo transmis, type de partenariat et, pour la location de voitures, le forfait souhaité.",
      ],
    },
    {
      icon: Eye,
      title: "2. Finalités du traitement",
      content: [
        "Vos données sont collectées et traitées pour les finalités suivantes :",
        "• **Exécution des services** : traitement des réservations, émission de billets, confirmations, factures.",
        "• **Gestion du compte** : création et administration de votre espace personnel.",
        "• **Paiements sécurisés** : traitement et vérification des transactions financières.",
        "• **Communication** : envoi de confirmations, notifications de voyage, alertes de prix.",
        "• **Amélioration des services** : analyse statistique anonymisée pour améliorer l'expérience utilisateur.",
        "• **Obligations légales** : conformité aux réglementations aériennes, fiscales et douanières.",
        "• **Sécurité** : prévention de la fraude, protection contre les accès non autorisés.",
        "• **Gestion des partenariats** : étude des candidatures partenaires et, en cas d'acceptation, création et administration de l'espace agence correspondant.",
      ],
    },
    {
      icon: Lock,
      title: "3. Protection et sécurité des données",
      content: [
        `${siteName} met en œuvre des mesures de sécurité strictes pour protéger vos données :`,
        "• **Chiffrement SSL/TLS** : toutes les communications sont chiffrées de bout en bout.",
        "• **Authentification renforcée** : authentification à deux facteurs (2FA/MFA) disponible pour sécuriser votre compte.",
        "• **Stockage sécurisé** : les données sont hébergées sur des serveurs sécurisés avec chiffrement au repos.",
        "• **Contrôle d'accès** : accès restreint aux données personnelles, basé sur les rôles et les politiques de sécurité (Row Level Security).",
        "• **Audit et surveillance** : journalisation des accès et détection des activités suspectes.",
        "• **Validation des entrées** : toutes les données utilisateur sont validées et assainies pour prévenir les injections et attaques.",
        "• **Conformité PCI-DSS** : les paiements sont traités par des prestataires certifiés. Aucune donnée de carte bancaire complète n'est stockée sur nos serveurs.",
      ],
    },
    {
      icon: Globe,
      title: "4. Partage et transfert des données",
      content: [
        "Vos données peuvent être partagées avec :",
        "• **Compagnies aériennes et hôtels** : pour l'exécution de vos réservations (transmission des informations passagers obligatoires).",
        "• **Prestataires de paiement** : pour le traitement sécurisé des transactions (CinetPay, Lygos).",
        "• **Sous-agences partenaires** : uniquement les données nécessaires à l'exécution du service réservé.",
        "• **Autorités compétentes** : en cas d'obligation légale (réglementations aériennes, fiscales, judiciaires).",
        "",
        "**Nous ne vendons JAMAIS vos données personnelles à des tiers à des fins publicitaires ou commerciales.**",
        "",
        "En cas de transfert international de données, nous nous assurons que les destinataires offrent un niveau de protection adéquat conformément aux réglementations en vigueur.",
      ],
    },
    {
      icon: Handshake,
      title: "5. Données des candidatures partenaires",
      content: [
        "Lorsque vous soumettez une candidature via la page « Devenir partenaire », des règles spécifiques s'appliquent :",
        "• **Accès restreint pendant l'étude** : tant que votre candidature est en attente, seules les équipes administratives y ont accès pour l'étudier.",
        "• **Logo transmis** : le fichier logo que vous téléversez est stocké sur un espace de stockage public et devient accessible via son lien direct dès son envoi, y compris avant toute décision sur votre candidature. Ne transmettez pas de fichier contenant des informations que vous souhaitez garder confidentielles.",
        `• **Rapprochement automatique de compte** : si votre candidature est retenue, l'adresse e-mail indiquée est utilisée pour la rattacher automatiquement à un compte ${siteName} existant portant la même adresse, afin de vous donner accès à votre espace agence. Si aucun compte ne correspond, vous devrez en créer un avec cette même adresse.`,
        "• **Publication après validation** : en cas d'acceptation, le nom, la description et le logo de votre établissement deviennent visibles publiquement sur la plateforme, dans le cadre normal du référencement de votre offre.",
        "• **Candidatures rejetées ou sans suite** : les données associées sont conservées 12 mois à compter de la décision, puis supprimées, sauf obligation légale contraire.",
      ],
    },
    {
      icon: UserCheck,
      title: "6. Vos droits",
      content: [
        "Conformément aux lois applicables en matière de protection des données, vous disposez des droits suivants :",
        "• **Droit d'accès** : obtenir une copie de toutes les données personnelles que nous détenons sur vous.",
        "• **Droit de rectification** : corriger toute donnée inexacte ou incomplète.",
        "• **Droit de suppression** : demander l'effacement de vos données personnelles (sous réserve des obligations légales de conservation).",
        "• **Droit d'opposition** : vous opposer au traitement de vos données à des fins de prospection commerciale.",
        "• **Droit à la portabilité** : recevoir vos données dans un format structuré et lisible par machine.",
        "• **Droit de retrait du consentement** : retirer votre consentement à tout moment pour les traitements basés sur celui-ci.",
        "",
        "Pour exercer ces droits, contactez-nous à l'adresse indiquée à la section « Contact ».",
      ],
    },
    {
      icon: Bell,
      title: "7. Cookies et technologies de suivi",
      content: [
        "Nous utilisons des cookies et technologies similaires pour :",
        "• **Cookies essentiels** : nécessaires au fonctionnement du site (authentification, panier de réservation, préférences de langue).",
        "• **Cookies de performance** : collecte anonyme de données de navigation pour améliorer nos services.",
        "• **Cookies de préférence** : mémorisation de vos préférences (langue, devise, mode sombre).",
        "",
        "Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur. La désactivation de certains cookies peut affecter le fonctionnement du site.",
      ],
    },
    {
      icon: Trash2,
      title: "8. Conservation des données",
      content: [
        "Nous conservons vos données personnelles pour les durées suivantes :",
        "• **Données de compte** : pendant toute la durée de votre inscription, puis 3 ans après la dernière activité.",
        "• **Données de réservation** : 5 ans après la date du voyage (obligations comptables et fiscales).",
        "• **Données de paiement** : selon les obligations légales du prestataire de paiement (maximum 13 mois après la transaction).",
        "• **Données de navigation** : 13 mois maximum.",
        "• **Communications support** : 3 ans après la dernière interaction.",
        "• **Candidatures partenaires** : voir la section « Données des candidatures partenaires » ci-dessus.",
        "",
        "À l'expiration de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.",
      ],
    },
    {
      icon: Mail,
      title: "9. Contact et réclamations",
      content: [
        "Pour toute question relative à la protection de vos données personnelles :",
        "",
        `**${siteName}**`,
        "E-mail : privacy@bossiz.com",
        "Support : via la page Contact de notre site",
        "",
        "Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l'autorité de protection des données compétente de votre pays.",
        "",
        `Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}`,
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chez {siteName}, la protection de vos données personnelles est une priorité absolue. 
              Cette politique détaille comment nous collectons, utilisons et protégeons vos informations.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <section
                  key={index}
                  className="bg-card border border-border rounded-xl p-6 md:p-8"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground pt-1.5">
                      {section.title}
                    </h2>
                  </div>
                  <div className="pl-14 space-y-2">
                    {section.content.map((line, i) => (
                      <p
                        key={i}
                        className="text-muted-foreground text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: line
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
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

export default PrivacyPolicy;
