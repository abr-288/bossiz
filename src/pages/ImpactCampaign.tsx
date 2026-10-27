import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ContributeDialog } from "@/components/impact/ContributeDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { parseArticle } from "@/lib/culture";
import {
  IMPACT_DEFAULT_SLUG,
  describeBenefit,
  formatImpactDate,
  formatXof,
  impactMethodLabel,
  offerSmiles,
  useImpactCampaign,
} from "@/lib/impact";
import { CheckCircle2, Circle, HeartHandshake, Mail, Phone, ShieldCheck, Smile, Users } from "lucide-react";

// Réponses toujours affichées, avant celles saisies par l'admin.
const BASE_FAQ = [
  {
    question: "Ma contribution est-elle un placement ?",
    answer:
      "Non. Votre contribution est volontaire et soutient le développement de Conciergerie Bossiz. Elle ne donne droit à aucun rendement, intérêt, dividende ni part de l'entreprise, et n'est pas remboursable comme un prêt.",
  },
  {
    question: "Que sont les Smiles ?",
    answer:
      "Les Smiles sont les points du programme de fidélité Bossiz Smiles. Ils ne sont pas de l'argent : ils ne se retirent pas et ne se convertissent pas en espèces. Ils s'utilisent sur les services Conciergerie Bossiz selon les conditions du programme.",
  },
  {
    question: "Quand ma contribution est-elle confirmée ?",
    answer:
      "Dès que notre prestataire de paiement nous confirme la transaction. Vous recevez alors un e-mail et retrouvez votre contribution, vos avantages et leur date d'expiration dans « Mon espace Impact ».",
  },
];

const RichText = ({ text }: { text: string | null }) => (
  <div className="space-y-4 leading-relaxed">
    {parseArticle(text).map((block, i) =>
      block.kind === "heading" ? (
        <h3 key={i} className="pt-2 text-lg font-bold">
          {block.text}
        </h3>
      ) : block.kind === "list" ? (
        <ul key={i} className="list-disc space-y-1 pl-6">
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      ) : (
        <p key={i} className="whitespace-pre-line">
          {block.text}
        </p>
      ),
    )}
  </div>
);

// Page publique Bossiz Impact. Les chiffres viennent du serveur et ne
// comptent que les paiements confirmés et non remboursés.
export default function ImpactCampaign() {
  const { slug = IMPACT_DEFAULT_SLUG } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useImpactCampaign(slug);
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [initialAmount, setInitialAmount] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Bossiz Impact - Ensemble, faisons grandir Conciergerie Bossiz | Bossiz+";
  }, []);

  // Un compte est nécessaire (Smiles et référence de membre y sont
  // rattachés) : il est demandé avant le formulaire, puis on revient ici avec
  // ?contribuer=<formule> pour rouvrir le formulaire.
  const open = async (id: string | null) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      const back = `${location.pathname}?contribuer=${id ?? "1"}`;
      navigate(`/auth?redirect=${encodeURIComponent(back)}`);
      return;
    }
    setOfferId(id);
    setInitialAmount(null);
    setDialogOpen(true);
  };

  // Retour de connexion ou d'inscription : formulaire rouvert avec la
  // formule (et le montant) choisis avant.
  useEffect(() => {
    const wanted = params.get("contribuer");
    if (!wanted || !data) return;
    const amount = Number(params.get("montant")) || null;
    const next = new URLSearchParams(params);
    next.delete("contribuer");
    next.delete("montant");
    setParams(next, { replace: true });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setOfferId(wanted === "1" ? null : wanted);
      setInitialAmount(amount);
      setDialogOpen(true);
    });
  }, [params, data, setParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-16 space-y-4">
          <div className="h-10 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-40 rounded-2xl bg-muted animate-pulse" />
        </main>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <HeartHandshake className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Bossiz Impact arrive bientôt</h1>
          <p className="text-muted-foreground mb-6">La campagne n'est pas encore ouverte.</p>
          <Button asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </main>
      </div>
    );
  }

  const { campaign } = data;
  const faq = [...BASE_FAQ, ...campaign.faq.filter((f) => f.question && f.answer)];
  const closedMessage =
    campaign.status === "closed" || (campaign.ends_at && new Date(campaign.ends_at) <= new Date())
      ? "La campagne est terminée. Merci à tous les Membres Impact !"
      : campaign.status === "suspended"
        ? "Les contributions sont momentanément suspendues."
        : campaign.starts_at && new Date(campaign.starts_at) > new Date()
          ? `Ouverture des contributions le ${formatImpactDate(campaign.starts_at)}.`
          : !campaign.terms
            ? "Les conditions du programme sont en cours de finalisation."
            : null;
  const canContribute = data.is_open && !!campaign.terms;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {campaign.status === "draft" && (
        <div className="bg-warning px-4 py-2 text-center text-sm text-warning-foreground" role="status">
          Aperçu administrateur : cette campagne est en brouillon et n'est pas visible du public.
        </div>
      )}

      <header className="relative isolate overflow-hidden bg-brand text-brand-foreground">
        {/* Bannière : logo Bossiz en grand, recouvert d'un dégradé aux
            couleurs de la marque pour garder le texte lisible. */}
        <img
          src="/logo-bossiz.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-20 h-[120%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none md:h-[190%]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-brand/80" />
        <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{campaign.tagline || campaign.name}</h1>
            {campaign.secondary_tagline && (
              <p className="text-lg md:text-xl text-white/90">{campaign.secondary_tagline}</p>
            )}
            {campaign.summary && <p className="max-w-xl text-white/85">{campaign.summary}</p>}
            <p className="text-sm text-white/75">Campagne « {campaign.name} »</p>
          </div>

          <Card className="self-start">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-3xl font-bold">{formatXof(data.collected_xof)}</p>
                <p className="text-sm text-muted-foreground">
                  collectés sur un objectif de {formatXof(campaign.goal_xof)}
                </p>
              </div>
              <Progress value={data.percent} aria-label={`${data.percent} % de l'objectif`} />
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-semibold">{data.percent.toLocaleString("fr-FR")} %</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {data.members} Membre{data.members > 1 ? "s" : ""} Impact
                  {campaign.target_members ? ` sur ${campaign.target_members} visés` : ""}
                </span>
              </div>
              {(campaign.starts_at || campaign.ends_at) && (
                <p className="text-xs text-muted-foreground">
                  {campaign.starts_at ? `Du ${formatImpactDate(campaign.starts_at)}` : ""}
                  {campaign.ends_at ? ` au ${formatImpactDate(campaign.ends_at)}` : ""}
                </p>
              )}
              <Button className="w-full" size="lg" disabled={!canContribute} onClick={() => open(null)}>
                Je contribue
              </Button>
              {closedMessage && <p className="text-center text-sm text-muted-foreground">{closedMessage}</p>}
              <p className="text-center text-xs text-muted-foreground">
                Seules les contributions confirmées par notre prestataire de paiement sont comptées.
              </p>
            </CardContent>
          </Card>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-12 space-y-14">
        {campaign.description && (
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">Pourquoi Bossiz Impact ?</h2>
            <RichText text={campaign.description} />
          </section>
        )}

        {campaign.funding_uses.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">À quoi serviront les fonds</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {campaign.funding_uses.map((use, i) => (
                <Card key={i}>
                  <CardContent className="space-y-1 p-5">
                    <p className="font-semibold">{use.title}</p>
                    {use.amount_xof ? <p className="text-sm text-primary">{formatXof(use.amount_xof)}</p> : null}
                    {use.description && <p className="text-sm text-muted-foreground">{use.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {campaign.milestones.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">Les étapes</h2>
            <ol className="space-y-3">
              {campaign.milestones.map((step, i) => (
                <li key={i} className="flex gap-3">
                  {step.done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-label="Réalisée" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-label="À venir" />
                  )}
                  <div>
                    <p className="font-medium">
                      {step.title}
                      {step.target_xof ? (
                        <span className="text-muted-foreground"> · {formatXof(step.target_xof)}</span>
                      ) : null}
                    </p>
                    {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="space-y-4" id="offres">
          <h2 className="text-2xl md:text-3xl font-bold">Les formules de contribution</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.offers.map((offer) => (
              <Card key={offer.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{offer.name}</CardTitle>
                  <p className="text-2xl font-bold text-primary">dès {formatXof(offer.min_amount_xof)}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                  {offer.smiles_percent ? (
                    <p className="flex items-center gap-1.5 font-medium">
                      <Smile className="h-4 w-4 text-primary" />
                      {offer.smiles_percent.toLocaleString("fr-FR")} % de votre contribution en Smiles
                    </p>
                  ) : null}
                  {offer.smiles_awarded > 0 && (
                    <p className="flex items-center gap-1.5 font-medium">
                      <Smile className="h-4 w-4 text-primary" />
                      {offer.smiles_percent ? "+ " : ""}
                      {offer.smiles_awarded.toLocaleString("fr-FR")} Smiles offerts
                    </p>
                  )}
                  {(offer.smiles_percent || offer.smiles_awarded > 0) && (
                    <p className="text-xs text-muted-foreground">
                      Exemple : {formatXof(offer.min_amount_xof)} ={" "}
                      {offerSmiles(offer, offer.min_amount_xof).toLocaleString("fr-FR")} Smiles.
                    </p>
                  )}
                  {offer.description && <p className="text-muted-foreground">{offer.description}</p>}
                  {offer.benefits.length > 0 && (
                    <ul className="space-y-2">
                      {offer.benefits.map((b, i) => (
                        <li key={i}>
                          <p className="font-medium">{b.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {describeBenefit(b)}
                            {b.services && b.services.length > 0 ? ` · ${b.services.join(", ")}` : ""}
                          </p>
                          {b.conditions && <p className="text-xs text-muted-foreground">{b.conditions}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {offer.benefits.length > 0 ? "Smiles et avantages valables" : "Smiles valables"}{" "}
                    {offer.validity_months} mois.
                  </p>
                  {offer.terms && <p className="text-xs text-muted-foreground">{offer.terms}</p>}
                  <Button
                    className="mt-auto"
                    variant="outline"
                    disabled={!canContribute || !offer.available}
                    onClick={() => open(offer.id)}
                  >
                    {offer.available ? "Choisir cette formule" : "Formule complète"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {campaign.allow_free_amount && (
            <p className="text-sm text-muted-foreground">
              Vous pouvez aussi faire une contribution libre à partir de {formatXof(campaign.min_contribution_xof)}.
            </p>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smile className="h-5 w-5 text-primary" />
                Vos avantages Bossiz Smiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                En remerciement, les Membres Impact reçoivent des Smiles Bossiz (1 Smile = 1 FCFA de réduction) et,
                selon la formule, des avantages commerciaux, utilisables sur la conciergerie et les services
                Conciergerie Bossiz.
              </p>
              {campaign.smiles_flights_min_xof ? (
                <p>
                  Les billets d'avion sont réservés aux contributions de {formatXof(campaign.smiles_flights_min_xof)} et
                  plus.
                </p>
              ) : null}
              <p>
                Ils sont valables {campaign.benefits_validity_months} mois
                {campaign.benefits_valid_from
                  ? ` à partir du ${formatImpactDate(campaign.benefits_valid_from)}`
                  : " à partir de la confirmation du paiement"}
                , ne sont ni de l'argent ni un solde retirable, et s'utilisent selon leurs conditions.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Paiement sécurisé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Le paiement se fait sur la page sécurisée de notre prestataire Jèko, par Mobile Money. Conciergerie
                Bossiz ne vous demande jamais votre code secret.
              </p>
              {campaign.accepted_methods.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {campaign.accepted_methods.map((m) => (
                    <Badge key={m} variant="secondary">
                      {impactMethodLabel(m)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p>Les moyens de paiement disponibles s'affichent sur la page de paiement.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">Questions fréquentes</h2>
          <Accordion type="single" collapsible>
            {faq.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section id="conditions" className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">Conditions du programme</h2>
          {campaign.legal_entity && <p className="text-sm">Collecte organisée par : {campaign.legal_entity}</p>}
          {campaign.terms ? (
            <Card>
              <CardContent className="p-6 text-sm">
                <RichText text={campaign.terms} />
                <p className="mt-4 text-xs text-muted-foreground">Version {campaign.terms_version}</p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Les conditions du programme sont en cours de finalisation.</p>
          )}
        </section>

        {(campaign.contact_email || campaign.contact_phone) && (
          <section className="space-y-2">
            <h2 className="text-2xl font-bold">Contact</h2>
            {campaign.contact_email && (
              <a href={`mailto:${campaign.contact_email}`} className="flex items-center gap-2 text-primary">
                <Mail className="h-4 w-4" /> {campaign.contact_email}
              </a>
            )}
            {campaign.contact_phone && (
              <a href={`tel:${campaign.contact_phone}`} className="flex items-center gap-2 text-primary">
                <Phone className="h-4 w-4" /> {campaign.contact_phone}
              </a>
            )}
          </section>
        )}
      </main>

      <ContributeDialog
        data={data}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialOfferId={offerId}
        initialAmount={initialAmount}
      />
    </div>
  );
}
