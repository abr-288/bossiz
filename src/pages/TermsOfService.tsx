import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";
import { FileText, Scale, CreditCard, AlertTriangle, Ban, RefreshCcw, Gavel, ShieldCheck, Plane, Users, Handshake } from "lucide-react";

const TermsOfService = () => {
  const { config } = useSiteConfigContext();
  const siteName = config.branding.siteName;

  const sections = [
    {
      icon: FileText,
      title: "1. Objet et acceptation",
      content: [
        `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme ${siteName} et de l'ensemble de ses services de réservation de voyages.`,
        "",
        "En accédant à notre plateforme ou en utilisant nos services, vous acceptez sans réserve les présentes conditions. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.",
        "",
        `${siteName} se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés de toute modification substantielle. L'utilisation continue des services après modification vaut acceptation des nouvelles conditions.`,
      ],
    },
    {
      icon: Users,
      title: "2. Inscription et compte utilisateur",
      content: [
        "**2.1 Création de compte**",
        "• L'inscription nécessite une adresse e-mail valide et un mot de passe sécurisé.",
        "• Vous devez fournir des informations exactes et complètes.",
        "• Vous êtes responsable de la confidentialité de vos identifiants de connexion.",
        "• L'authentification à deux facteurs (2FA) est fortement recommandée.",
        "",
        "**2.2 Responsabilité du compte**",
        "• Vous êtes seul responsable de toutes les activités réalisées depuis votre compte.",
        "• En cas d'utilisation non autorisée, vous devez nous en informer immédiatement.",
        "• Nous nous réservons le droit de suspendre ou supprimer tout compte en cas de violation des présentes conditions.",
        "",
        "**2.3 Conditions d'âge**",
        "• Vous devez avoir au moins 18 ans pour créer un compte et effectuer des réservations.",
        "• Les mineurs peuvent voyager uniquement sous la responsabilité d'un adulte ayant effectué la réservation.",
        "",
        "**2.4 Acceptation préalable obligatoire**",
        "• La création d'un compte, quel que soit son type (client, agence partenaire ou compte entreprise), n'est possible qu'après acceptation expresse des présentes CGU et de notre Politique de Confidentialité, au moyen d'une case à cocher dédiée lors de l'inscription.",
        "• Cette acceptation constitue une preuve contractuelle de votre consentement, horodatée et conservée conformément à la section « Conservation des données » de la Politique de Confidentialité.",
      ],
    },
    {
      icon: Plane,
      title: "3. Services de réservation",
      content: [
        "**3.1 Nature des services**",
        `${siteName} agit en qualité d'intermédiaire entre les utilisateurs et les prestataires de services (compagnies aériennes, hôtels, loueurs de véhicules, organisateurs d'activités).`,
        "",
        "**3.2 Disponibilité et prix**",
        "• Les prix affichés sont indicatifs et peuvent varier en fonction de la disponibilité en temps réel.",
        "• Le prix définitif est confirmé au moment de la validation de la réservation.",
        "• Les prix incluent les taxes applicables sauf mention contraire.",
        "",
        "**3.3 Processus de réservation**",
        "• Toute réservation de vol passe par un système de pré-réservation sécurisé avec verrouillage du tarif pendant 10 minutes.",
        "• La réservation n'est confirmée qu'après réception du paiement complet.",
        "• Un numéro de confirmation (PNR pour les vols) est généré après paiement.",
        "",
        "**3.4 Exactitude des informations**",
        "• Vous êtes responsable de l'exactitude des informations fournies (noms des passagers, dates, destinations).",
        "• Toute erreur dans les informations passagers peut entraîner un refus d'embarquement sans possibilité de remboursement.",
      ],
    },
    {
      icon: CreditCard,
      title: "4. Paiement et tarification",
      content: [
        "**4.1 Moyens de paiement**",
        "• Nous acceptons les paiements par carte bancaire, mobile money et autres moyens proposés sur la plateforme.",
        "• Tous les paiements sont traités par des prestataires sécurisés et certifiés PCI-DSS.",
        "",
        "**4.2 Devise**",
        "• Les prix sont principalement affichés en Franc CFA (XOF). La conversion dans d'autres devises est indicative.",
        "• Le montant exact débité dépend du taux de change appliqué par votre banque au moment de la transaction.",
        "",
        "**4.3 Frais de service**",
        `• ${siteName} peut appliquer des frais de service pour le traitement des réservations.`,
        "• Ces frais sont clairement indiqués avant la validation du paiement.",
        "",
        "**4.4 Sécurité des paiements**",
        "• Les transactions sont sécurisées par chiffrement SSL/TLS.",
        "• Les paiements sont vérifiés par signature HMAC pour prévenir la fraude.",
        "• Aucune donnée de carte bancaire complète n'est stockée sur nos serveurs.",
      ],
    },
    {
      icon: RefreshCcw,
      title: "5. Annulation et remboursement",
      content: [
        "**5.1 Politique d'annulation**",
        "• Les conditions d'annulation varient selon le type de service et le prestataire.",
        "• Les vols : soumis aux conditions tarifaires de la compagnie aérienne (certains billets sont non remboursables).",
        "• Les hôtels : politique d'annulation gratuite selon les conditions du prestataire (généralement 24 à 48h avant l'arrivée).",
        "• Les locations de voiture : annulation gratuite selon les conditions du loueur.",
        "",
        "**5.2 Procédure de remboursement**",
        "• Les demandes de remboursement doivent être adressées via notre service support.",
        "• Le remboursement est effectué sur le même moyen de paiement utilisé pour la réservation.",
        "• Les délais de remboursement varient de 5 à 30 jours ouvrables selon le prestataire et la méthode de paiement.",
        "",
        "**5.3 Cas de force majeure**",
        `• En cas de force majeure (catastrophes naturelles, pandémies, conflits), ${siteName} s'efforcera de trouver des solutions alternatives mais ne pourra être tenu responsable des pertes financières.`,
      ],
    },
    {
      icon: AlertTriangle,
      title: "6. Limitation de responsabilité",
      content: [
        `**6.1 Rôle d'intermédiaire**`,
        `${siteName} agit en tant qu'intermédiaire et ne peut être tenu responsable :`,
        "• Des retards, annulations ou modifications de services par les prestataires tiers.",
        "• De la qualité des prestations fournies par les compagnies aériennes, hôtels ou autres prestataires.",
        "• Des dommages indirects résultant de l'utilisation de nos services.",
        "",
        "**6.2 Disponibilité de la plateforme**",
        "• Nous nous efforçons de maintenir la plateforme accessible 24h/24, mais ne garantissons pas une disponibilité ininterrompue.",
        "• Des interruptions pour maintenance sont possibles et seront signalées dans la mesure du possible.",
        "",
        "**6.3 Exactitude des informations**",
        "• Les informations de voyage (horaires, prix, disponibilités) sont fournies par les prestataires et peuvent être sujettes à modification.",
        `• ${siteName} décline toute responsabilité en cas d'erreur dans les informations fournies par les prestataires.`,
      ],
    },
    {
      icon: Ban,
      title: "7. Utilisations interdites",
      content: [
        "Il est strictement interdit de :",
        "• Utiliser la plateforme à des fins illégales ou frauduleuses.",
        "• Tenter d'accéder aux systèmes ou données de manière non autorisée.",
        "• Utiliser des robots, scrapers ou tout autre moyen automatisé pour extraire des données.",
        "• Usurper l'identité d'un tiers ou fournir de fausses informations.",
        "• Effectuer des réservations fictives ou dans le but de bloquer des disponibilités.",
        "• Contourner les mesures de sécurité de la plateforme.",
        "• Publier des avis ou commentaires diffamatoires, injurieux ou trompeurs.",
        "• Utiliser la plateforme pour toute forme de harcèlement ou discrimination.",
        "",
        "Toute violation peut entraîner la suspension immédiate du compte et des poursuites judiciaires.",
      ],
    },
    {
      icon: ShieldCheck,
      title: "8. Propriété intellectuelle",
      content: [
        `L'ensemble des éléments de la plateforme ${siteName} (logos, textes, images, design, base de données, logiciels) sont protégés par les lois sur la propriété intellectuelle.`,
        "",
        "• Toute reproduction, modification ou utilisation sans autorisation préalable est strictement interdite.",
        "• Les marques et logos des compagnies aériennes, hôtels et autres partenaires restent la propriété de leurs titulaires respectifs.",
        `• Le contenu généré par les utilisateurs (avis, commentaires) reste leur propriété, mais ${siteName} dispose d'une licence non exclusive pour les afficher sur la plateforme.`,
      ],
    },
    {
      icon: Handshake,
      title: "9. Partenariats (hôtels, restaurants, activités, artisans, location de voitures)",
      content: [
        "**9.1 Candidature et étude du dossier**",
        `• Toute personne ou entreprise souhaitant référencer ses services sur ${siteName} (hôtel, restaurant, activité/excursion, artisan/guide, location de voitures) doit soumettre une candidature via la page « Devenir partenaire ».`,
        "• Le dépôt d'une candidature ne constitue ni un engagement contractuel ni une garantie d'acceptation. Chaque dossier est étudié manuellement et peut être accepté, rejeté ou classé sans suite, sans obligation de motivation.",
        `• L'acceptation d'une candidature nécessite que le candidat dispose déjà d'un compte utilisateur ${siteName} enregistré avec la même adresse e-mail que celle indiquée dans sa candidature, ce compte étant ensuite rattaché à l'espace agence créé.`,
        "",
        "**9.2 Conditions spécifiques par catégorie**",
        "• Les conditions applicables (gratuité de l'inscription, taux de commission, forfaits payants pour la location de voitures) sont présentées de façon détaillée sur la page « Devenir partenaire » et doivent être expressément acceptées, catégorie par catégorie, avant l'envoi de toute candidature.",
        "• Ces conditions peuvent évoluer ; les partenaires déjà actifs seront informés de toute modification substantielle affectant leur taux de commission ou leur forfait.",
        "",
        "**9.3 Commission et paiement des partenaires**",
        `• ${siteName} agit en tant que plateforme d'intermédiation et prélève une commission sur chaque réservation confirmée, dont le taux dépend de la catégorie de service et, pour la location de voitures, du forfait souscrit.`,
        "• Le reversement des sommes dues au partenaire (montant de la réservation diminué de la commission) est effectué manuellement par nos équipes selon les modalités convenues ; il ne s'agit pas d'un virement automatique instantané.",
        "• Les forfaits payants (location de voitures) sont facturés par avance (mensuellement ou annuellement) et ne sont pas remboursables au prorata en cas de résiliation en cours de période, sauf disposition légale contraire.",
        "",
        "**9.4 Obligations du partenaire**",
        "• Le partenaire garantit l'exactitude des informations et tarifs qu'il publie, ainsi que sa capacité à honorer les réservations confirmées.",
        "• Le partenaire demeure seul responsable du respect des réglementations applicables à son secteur d'activité (autorisations d'exploitation, assurances, normes sanitaires ou de sécurité, réglementation du transport pour la location de voitures).",
        `• Le partenaire garantit détenir tous les droits nécessaires sur le logo, les photos et les textes qu'il transmet (y compris via le formulaire de candidature) et concède à ${siteName} une licence non exclusive, gratuite et mondiale pour les reproduire et les afficher dans le cadre de son référencement sur la plateforme.`,
        "• Un fichier logo transmis lors d'une candidature est stocké sur un espace de stockage public et accessible via son lien direct dès son téléversement, y compris avant toute validation de la candidature.",
        "",
        "**9.5 Suspension et résiliation du partenariat**",
        `• ${siteName} peut suspendre ou mettre fin à un partenariat, à tout moment et sans préavis en cas de manquement grave (fraude, non-respect des présentes conditions, plaintes répétées de clients, non-conformité réglementaire), et avec un préavis raisonnable dans les autres cas.`,
        "• La résiliation n'affecte pas les réservations déjà confirmées, qui doivent être honorées ou remboursées selon les conditions applicables.",
      ],
    },
    {
      icon: Scale,
      title: "10. Abonnements et services premium",
      content: [
        "**9.1 Plans d'abonnement**",
        `• ${siteName} propose des plans d'abonnement offrant des avantages exclusifs.`,
        "• Les détails des plans sont disponibles sur la page Abonnements.",
        "",
        "**9.2 Résiliation**",
        "• Vous pouvez résilier votre abonnement à tout moment depuis votre espace personnel.",
        "• La résiliation prend effet à la fin de la période en cours.",
        "• Aucun remboursement prorata temporis n'est effectué sauf disposition contraire.",
      ],
    },
    {
      icon: Gavel,
      title: "11. Droit applicable et litiges",
      content: [
        "**10.1 Droit applicable**",
        "Les présentes conditions sont régies par le droit en vigueur en Côte d'Ivoire et les conventions internationales applicables au transport aérien.",
        "",
        "**10.2 Résolution des litiges**",
        "• En cas de litige, une solution amiable sera recherchée en priorité via notre service support.",
        "• À défaut de résolution amiable, les tribunaux compétents d'Abidjan seront seuls compétents.",
        "",
        "**10.3 Médiation**",
        "• Conformément aux dispositions en vigueur, vous pouvez recourir à un médiateur avant toute action judiciaire.",
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
              <Scale className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Veuillez lire attentivement les conditions suivantes avant d'utiliser les services de {siteName}. 
              Ces conditions constituent un accord juridiquement contraignant entre vous et {siteName}.
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

export default TermsOfService;
