import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Lock, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";
import { formatXof, impactMethodLabel, offerSmiles, type ImpactPublicData } from "@/lib/impact";

const FREE = "free";

// Contribution : le serveur crée la contribution (montant, offre et
// conditions vérifiés), puis process-payment émet le lien de paiement Jèko.
// Aucun succès n'est affiché ici : la confirmation arrive du prestataire.
export function ContributeDialog({
  data,
  open,
  onOpenChange,
  initialOfferId,
}: {
  data: ImpactPublicData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOfferId: string | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { campaign } = data;
  const offers = useMemo(() => data.offers.filter((o) => o.available), [data.offers]);
  const [offerId, setOfferId] = useState<string>(FREE);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offer = offers.find((o) => o.id === offerId) ?? null;

  useEffect(() => {
    if (!open) return;
    const start =
      offers.find((o) => o.id === initialOfferId) ?? (campaign.allow_free_amount ? null : offers[0]) ?? null;
    setOfferId(start?.id ?? FREE);
    setAmount(String(start?.min_amount_xof ?? campaign.min_contribution_xof));
    setAccepted(false);
    setError(null);
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.full_name) setName(profile.full_name);
      if (profile?.phone) setPhone(profile.phone);
    });
  }, [open, initialOfferId, offers, campaign.allow_free_amount, campaign.min_contribution_xof]);

  const min = offer ? Number(offer.min_amount_xof) : Number(campaign.min_contribution_xof);
  const max = offer?.max_amount_xof ?? campaign.max_contribution_xof;
  // Aperçu seulement : le nombre de Smiles est recalculé et figé par le serveur.
  const smiles = offer ? offerSmiles(offer, Number(amount)) : 0;
  const flights = campaign.smiles_flights_min_xof != null && Number(amount) >= campaign.smiles_flights_min_xof;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setSubmitting(true);
    try {
      const { data: started, error: startError } = await supabase.rpc("impact_start_contribution", {
        p_campaign_id: campaign.id,
        p_offer_id: offer?.id ?? null,
        p_amount_xof: Number(amount),
        p_name: name,
        p_phone: phone,
        p_accept_terms: accepted,
      });
      if (startError) throw new Error(startError.message);
      const contributionId = (started as { id?: string } | null)?.id;
      if (!contributionId) throw new Error("La contribution n'a pas pu être créée.");

      const { data: payment, error: paymentError } = await supabase.functions.invoke("process-payment", {
        body: {
          impactContributionId: contributionId,
          paymentMethod: "jeko",
          customerInfo: { name, email: email || session.user.email, phone },
        },
      });
      if (paymentError) {
        throw new Error(await getEdgeFunctionErrorMessage(paymentError, "Le paiement n'a pas pu être initialisé."));
      }
      if (!payment?.success || typeof payment.payment_url !== "string") {
        throw new Error(payment?.error || "Aucun lien de paiement n'a été créé.");
      }
      // Paiement sur la page sécurisée du prestataire ; le statut se suit
      // ensuite dans « Mon espace Impact ».
      window.location.assign(payment.payment_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contribuer à Bossiz Impact</DialogTitle>
          <DialogDescription>{campaign.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Formule</Label>
            <Select
              value={offerId}
              onValueChange={(v) => {
                setOfferId(v);
                const o = offers.find((x) => x.id === v);
                setAmount(String(o?.min_amount_xof ?? campaign.min_contribution_xof));
              }}
            >
              <SelectTrigger aria-label="Formule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {offers.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name} · dès {formatXof(o.min_amount_xof)}
                  </SelectItem>
                ))}
                {campaign.allow_free_amount && <SelectItem value={FREE}>Contribution libre</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="impact-amount">Montant (FCFA)</Label>
            <Input
              id="impact-amount"
              type="number"
              inputMode="numeric"
              min={min}
              max={max ?? undefined}
              step={1}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                // La formule suit le montant saisi quand une formule couvre ce montant.
                const value = Number(e.target.value);
                const match = offers.find(
                  (o) => value >= Number(o.min_amount_xof) && (o.max_amount_xof == null || value <= o.max_amount_xof),
                );
                if (match) setOfferId(match.id);
              }}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum {formatXof(min)}
              {max != null ? `, maximum ${formatXof(max)}` : ""}. Aucun frais supplémentaire n'est ajouté par Bossiz.
            </p>
            {smiles > 0 && (
              <p className="flex items-center gap-1.5 rounded-md bg-primary/5 p-2 text-sm font-medium">
                <Smile className="h-4 w-4 shrink-0 text-primary" />
                Vous recevrez {smiles.toLocaleString("fr-FR")} Smiles, valables {offer?.validity_months} mois
                {flights ? ", utilisables aussi sur les billets d'avion" : ""}.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="impact-name">Nom complet</Label>
              <Input id="impact-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="impact-phone">Téléphone</Label>
              <Input
                id="impact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
                required
              />
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
            <span>
              J'ai lu et j'accepte les{" "}
              <a href="#conditions" className="underline" onClick={() => onOpenChange(false)}>
                conditions du programme
              </a>
              . Ma contribution est volontaire : ce n'est ni un placement, ni un prêt, ni une prise de participation, et
              elle ne donne droit à aucun rendement.
            </span>
          </label>

          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Vous serez redirigé vers la page de paiement sécurisée de notre prestataire Jèko
              {campaign.accepted_methods.length > 0
                ? ` (${campaign.accepted_methods.map(impactMethodLabel).join(", ")})`
                : ""}
              . Bossiz ne vous demandera jamais votre code secret Mobile Money. Votre contribution est confirmée dès que
              le prestataire nous la notifie.
            </p>
          </div>

          {error && (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting || !accepted}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Payer ${formatXof(Number(amount) || 0)}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
