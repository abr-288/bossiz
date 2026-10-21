import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneNumberInput } from "@/components/PhoneNumberInput";
import { EventCard } from "@/components/events/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";
import {
  EVENT_LIST_COLUMNS,
  EVENT_STATUS_LABEL,
  conciergeFee,
  countryFlag,
  countryName,
  eventCategory,
  eventDate,
  formatFcfa,
  isoDate,
  purchaseBlocker,
  useConciergeSettings,
  type EventItem,
} from "@/lib/events";
import { CalendarDays, ChevronRight, Clock, ExternalLink, Loader2, MapPin, ShieldCheck, Ticket } from "lucide-react";

type Tier = "standard" | "best";
const selectionKey = (slug: string) => `event-selection:${slug}`;

// Fiche d'un événement du catalogue : présentation (rédigée par l'agent IA),
// infos pratiques et achat des billets par la conciergerie (create-event-order).
export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: settings } = useConciergeSettings();
  const [quantity, setQuantity] = useState(2);
  const [tier, setTier] = useState<Tier>("standard");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", notes: "" });

  const eventQuery = useQuery({
    queryKey: ["event", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data as unknown as EventItem | null;
    },
  });
  const event = eventQuery.data;

  const relatedQuery = useQuery({
    queryKey: ["event-related", event?.id],
    enabled: !!event,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select(EVENT_LIST_COLUMNS)
        .eq("is_published", true)
        .eq("category", event!.category)
        .eq("country_code", event!.country_code ?? "")
        .neq("id", event!.id)
        .gte("local_date", isoDate(new Date()))
        .order("highlight_score", { ascending: false, nullsFirst: false })
        .limit(3);
      return (data || []) as unknown as EventItem[];
    },
  });

  useEffect(() => {
    if (event) document.title = `${event.name} – Événements | Bossiz+`;
  }, [event]);

  // Retour de la connexion : sélection restaurée, finalisation rouverte.
  useEffect(() => {
    if (!slug || !event) return;
    try {
      const raw = sessionStorage.getItem(selectionKey(slug));
      if (!raw) return;
      sessionStorage.removeItem(selectionKey(slug));
      const saved = JSON.parse(raw) as { quantity: number; tier: Tier };
      setQuantity(saved.quantity);
      setTier(saved.tier);
      void supabase.auth.getSession().then(({ data: { session } }) => session && openCheckout());
    } catch {
      // stockage indisponible
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, slug]);

  const maxTickets = settings?.maxTickets ?? 8;
  const blocker = event ? purchaseBlocker(event, settings) : null;
  const hasBestTier = !!(event?.price_max_xof && event.price_min_xof && event.price_max_xof > event.price_min_xof);
  const unitPrice = event ? (tier === "best" && hasBestTier ? event.price_max_xof! : (event.price_min_xof ?? 0)) : 0;
  const subtotal = unitPrice * quantity;
  const fee = settings ? conciergeFee(subtotal, settings) : 0;
  const total = subtotal + fee;
  const mapUrl = useMemo(() => {
    if (!event) return null;
    if (event.latitude && event.longitude)
      return `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
    const q = [event.venue_name, event.venue_address, event.city, event.country].filter(Boolean).join(", ");
    return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
  }, [event]);

  async function openCheckout() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      try {
        sessionStorage.setItem(selectionKey(slug!), JSON.stringify({ quantity, tier }));
      } catch {
        // sélection à refaire après connexion
      }
      toast.info("Connectez-vous ou créez un compte pour acheter vos billets.");
      navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    setContact((prev) => ({
      ...prev,
      name: prev.name || profile?.full_name || "",
      email: prev.email || user.email || "",
      phone: prev.phone || profile?.phone || "",
    }));
    setCheckoutOpen(true);
  }

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-event-order", {
        body: {
          event_id: event.id,
          quantity,
          tier: hasBestTier ? tier : "standard",
          customer_name: contact.name,
          customer_email: contact.email,
          customer_phone: contact.phone,
          notes: contact.notes,
        },
      });
      if (error || !data?.success) {
        toast.error(
          error
            ? await getEdgeFunctionErrorMessage(error, "La commande n'a pas pu être créée.")
            : data?.error || "La commande n'a pas pu être créée.",
        );
        return;
      }
      setCheckoutOpen(false);
      navigate(`/payment?bookingId=${data.booking_id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (eventQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-16">
        <Navbar />
        <div className="h-[45vh] bg-muted animate-pulse" />
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Événement introuvable</h1>
          <p className="text-muted-foreground mb-6">Cet événement est passé ou n'est plus proposé.</p>
          <Button asChild>
            <Link to="/events">Voir les événements</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const category = eventCategory(event.category);
  const status = EVENT_STATUS_LABEL[event.status];

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      <div className="relative h-[42vh] md:h-[55vh] overflow-hidden bg-brand">
        {event.image_url && (
          <img src={event.image_url} alt={event.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="container mx-auto px-4 pb-8 md:pb-12 text-white space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/15 text-white border-white/30 backdrop-blur">{category.label}</Badge>
              {event.genre && (
                <Badge className="bg-white/15 text-white border-white/30 backdrop-blur">{event.genre}</Badge>
              )}
              {status && <Badge variant="destructive">{status}</Badge>}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-lg max-w-4xl">{event.name}</h1>
            <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm md:text-base text-white/90">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {eventDate(event)}
              </span>
              {event.local_time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {event.local_time} (heure locale)
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {[event.venue_name, event.city].filter(Boolean).join(", ")} {countryFlag(event.country_code)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:underline">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/events" className="hover:underline">
            Événements
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1">{event.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-10">
          <article className="space-y-8 min-w-0">
            {event.summary_fr && <p className="text-lg leading-relaxed">{event.summary_fr}</p>}
            {event.ai_tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.ai_tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <section className="rounded-2xl border p-5 space-y-3 text-sm">
              <h2 className="text-lg font-bold">Infos pratiques</h2>
              <p className="flex gap-2">
                <CalendarDays className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>
                  {eventDate(event)}
                  {event.local_time ? ` à ${event.local_time}` : ""}
                  {event.timezone ? ` (fuseau ${event.timezone})` : ""}
                </span>
              </p>
              <p className="flex gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>
                  {[event.venue_name, event.venue_address].filter(Boolean).join(" – ")}
                  {event.venue_address ? "" : event.city ? ` – ${event.city}` : ""},{" "}
                  {countryName(event.country_code, event.country)}
                  {mapUrl && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Voir sur la carte
                      </a>
                    </>
                  )}
                </span>
              </p>
              {event.price_min_xof && (
                <p className="flex gap-2">
                  <Ticket className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>
                    Billets de {formatFcfa(event.price_min_xof)}
                    {event.price_max_xof && event.price_max_xof > event.price_min_xof
                      ? ` à ${formatFcfa(event.price_max_xof)}`
                      : ""}
                    {event.price_min && event.price_currency
                      ? ` (${event.price_min.toLocaleString("fr-FR")} ${event.price_currency} et plus chez le vendeur)`
                      : ""}
                  </span>
                </p>
              )}
            </section>

            {event.info && (
              <section className="space-y-2">
                <h2 className="text-lg font-bold">Informations de l'organisateur</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{event.info}</p>
              </section>
            )}

            <section className="rounded-2xl bg-muted/40 p-5 space-y-3 text-sm">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Comment ça marche
              </h2>
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Vous choisissez vos billets et payez en FCFA sur Bossiz+.</li>
                <li>
                  Notre conciergerie les achète auprès du vendeur officiel, au meilleur prix disponible pour la
                  catégorie choisie.
                </li>
                <li>Vous recevez vos billets et les instructions d'accès par email, généralement sous 48 heures.</li>
              </ol>
              <p className="text-muted-foreground">
                Si les billets ne sont plus disponibles ou si le prix réel dépasse votre budget, nous vous contactons
                avant tout achat ; sans solution qui vous convienne, vous êtes remboursé intégralement.
              </p>
            </section>

            {event.ticket_url && (
              <p className="text-xs text-muted-foreground">
                Données Ticketmaster ·{" "}
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline inline-flex items-center gap-1"
                >
                  Page officielle <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            )}
          </article>

          {/* Achat */}
          <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border shadow-sm p-5 space-y-4">
            <p className="text-lg font-bold">Vos billets</p>
            {blocker ? (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">{blocker}</p>
                <Button asChild variant="outline" className="w-full">
                  <a
                    href={`mailto:contact@bossiz.com?subject=${encodeURIComponent(`Billets : ${event.name} (${event.local_date})`)}`}
                  >
                    Demander à la conciergerie
                  </a>
                </Button>
              </div>
            ) : (
              <>
                {hasBestTier && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Catégorie</Label>
                    <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">
                          Meilleur prix – {formatFcfa(event.price_min_xof!)} / billet
                        </SelectItem>
                        <SelectItem value="best">
                          Meilleures places – {formatFcfa(event.price_max_xof!)} / billet
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre de billets</Label>
                  <Select value={String(quantity)} onValueChange={(v) => setQuantity(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: maxTickets }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} billet{n > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 border-t pt-3 text-sm">
                  <p className="flex justify-between">
                    <span>
                      {quantity} × {formatFcfa(unitPrice)}
                    </span>
                    <span>{formatFcfa(subtotal)}</span>
                  </p>
                  <p className="flex justify-between text-muted-foreground">
                    <span>Frais de conciergerie</span>
                    <span>{formatFcfa(fee)}</span>
                  </p>
                  <p className="flex justify-between text-base font-bold pt-1">
                    <span>Total</span>
                    <span>{formatFcfa(total)}</span>
                  </p>
                </div>
                <Button className="w-full" size="lg" onClick={openCheckout}>
                  Acheter mes billets
                </Button>
                <p className="text-xs text-muted-foreground">
                  Billets officiels · remboursement intégral si indisponibles.
                </p>
              </>
            )}
          </aside>
        </div>

        {(relatedQuery.data?.length ?? 0) > 0 && (
          <section className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold">Dans le même esprit</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedQuery.data!.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Dialog open={checkoutOpen} onOpenChange={(v) => !submitting && setCheckoutOpen(v)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finaliser votre commande</DialogTitle>
            <DialogDescription>
              {event.name} · {eventDate(event, { day: "numeric", month: "long", year: "numeric" })}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-3 text-sm space-y-1">
            <p className="flex justify-between">
              <span>
                {quantity} billet{quantity > 1 ? "s" : ""} ·{" "}
                {tier === "best" && hasBestTier ? "meilleures places" : "meilleur prix"}
              </span>
              <span>{formatFcfa(subtotal)}</span>
            </p>
            <p className="flex justify-between text-muted-foreground">
              <span>Frais de conciergerie</span>
              <span>{formatFcfa(fee)}</span>
            </p>
            <p className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatFcfa(total)}</span>
            </p>
          </div>
          <form className="space-y-4" onSubmit={submitOrder}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-name">Nom complet</Label>
                <Input
                  id="event-name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  required
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-email">Email (envoi des billets)</Label>
                <Input
                  id="event-email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-phone">Téléphone</Label>
              <PhoneNumberInput
                id="event-phone"
                value={contact.phone}
                onValueChange={(phone) => setContact((prev) => ({ ...prev, phone }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-notes">Préférences (optionnel)</Label>
              <Textarea
                id="event-notes"
                rows={3}
                maxLength={1000}
                placeholder="Places côte à côte, accès PMR, noms des spectateurs…"
                value={contact.notes}
                onChange={(e) => setContact({ ...contact, notes: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              En validant, vous mandatez Bossiz+ pour acheter ces billets en votre nom auprès du vendeur officiel. Les
              conditions d'annulation sont celles de l'organisateur ; en cas d'indisponibilité, vous êtes remboursé
              intégralement.
            </p>
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Payer {formatFcfa(total)}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
