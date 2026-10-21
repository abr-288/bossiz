import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";
import { countryFlag, countryName, eventCategory, formatFcfa, type EventOrderDetails } from "@/lib/events";
import { Bot, ExternalLink, RefreshCw, Star, Ticket } from "lucide-react";

interface ConciergeOrder {
  id: string;
  created_at: string;
  status: string;
  payment_status: string;
  total_price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  booking_details: EventOrderDetails;
}

// Réglages site_config 'events_sync' et 'event_concierge'.
type EventsSyncConfig = {
  countries?: string[];
  perCountry?: number;
  daysAhead?: number;
  lastResult?: { at?: string; total?: number; errors?: string[] };
};

type EventConciergeConfig = {
  enabled?: boolean;
  feePercent?: number;
  minFeeXof?: number;
  maxTickets?: number;
};

interface CatalogEvent {
  id: string;
  slug: string;
  name: string;
  category: string;
  local_date: string;
  city: string | null;
  country_code: string | null;
  price_min_xof: number | null;
  highlight_score: number | null;
  curated_at: string | null;
  is_featured: boolean;
  is_published: boolean;
}

const ORDER_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  to_purchase: { label: "Billets à acheter", variant: "destructive" },
  purchased: { label: "Billets envoyés", variant: "default" },
  unavailable: { label: "Remboursée", variant: "secondary" },
  awaiting_payment: { label: "Paiement en attente", variant: "outline" },
};

const shortDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// Événements : commandes de billets à traiter par la conciergerie, catalogue
// (mise à la une, publication) et réglages de la synchronisation et des frais.
export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [orderFilter, setOrderFilter] = useState<"todo" | "all">("todo");
  const [search, setSearch] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState<ConciergeOrder | null>(null);
  const [unavailableOrder, setUnavailableOrder] = useState<ConciergeOrder | null>(null);
  const [ticketsInfo, setTicketsInfo] = useState("");
  const [ticketLinks, setTicketLinks] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["admin-event-orders", orderFilter],
    queryFn: async () => {
      let q = supabase
        .from("bookings")
        .select(
          "id, created_at, status, payment_status, total_price, customer_name, customer_email, customer_phone, notes, booking_details",
        )
        .eq("booking_details->>kind", "event_concierge")
        .order("created_at", { ascending: false })
        .limit(200);
      if (orderFilter === "todo") q = q.eq("booking_details->>conciergeStatus", "to_purchase");
      else q = q.neq("payment_status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as ConciergeOrder[];
    },
  });

  const catalogQuery = useQuery({
    queryKey: ["admin-events-catalog", search],
    queryFn: async () => {
      let q = supabase
        .from("events")
        .select(
          "id, slug, name, category, local_date, city, country_code, price_min_xof, highlight_score, curated_at, is_featured, is_published",
        )
        .gte("local_date", new Date().toISOString().slice(0, 10))
        .order("highlight_score", { ascending: false, nullsFirst: false })
        .limit(60);
      if (search.trim()) q = q.ilike("name", `%${search.trim().replace(/[%,]/g, " ")}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CatalogEvent[];
    },
  });

  const statsQuery = useQuery({
    queryKey: ["admin-events-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [all, pending, featured] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }).gte("local_date", today),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .gte("local_date", today)
          .is("curated_at", null),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .gte("local_date", today)
          .eq("is_featured", true),
      ]);
      return { total: all.count ?? 0, uncurated: pending.count ?? 0, featured: featured.count ?? 0 };
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["admin-events-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_config")
        .select("config_key, config_value")
        .in("config_key", ["events_sync", "event_concierge"]);
      const byKey = Object.fromEntries((data || []).map((r) => [r.config_key, r.config_value]));
      return {
        sync: (byKey.events_sync ?? {}) as EventsSyncConfig,
        concierge: (byKey.event_concierge ?? {}) as EventConciergeConfig,
      };
    },
  });

  const [syncForm, setSyncForm] = useState({ countries: "", perCountry: "200", daysAhead: "180" });
  const [conciergeForm, setConciergeForm] = useState({
    enabled: true,
    feePercent: "15",
    minFeeXof: "10000",
    maxTickets: "8",
  });
  useEffect(() => {
    const s = settingsQuery.data;
    if (!s) return;
    setSyncForm({
      countries: (s.sync.countries ?? []).join(", "),
      perCountry: String(s.sync.perCountry ?? 200),
      daysAhead: String(s.sync.daysAhead ?? 180),
    });
    setConciergeForm({
      enabled: s.concierge.enabled !== false,
      feePercent: String(s.concierge.feePercent ?? 15),
      minFeeXof: String(s.concierge.minFeeXof ?? 10000),
      maxTickets: String(s.concierge.maxTickets ?? 8),
    });
  }, [settingsQuery.data]);

  const invokeAdmin = async (fn: string, body: object, label: string) => {
    setBusy(label);
    try {
      const { data, error } = await supabase.functions.invoke(fn, { body });
      if (error || data?.success === false) {
        toast.error(
          error
            ? await getEdgeFunctionErrorMessage(error)
            : data?.error || (data?.failures ?? []).join(" · ") || "Échec",
        );
        return data;
      }
      return data;
    } finally {
      setBusy(null);
    }
  };

  const runSync = async () => {
    const data = await invokeAdmin("sync-events", {}, "sync");
    if (data?.total !== undefined) toast.success(`${data.total} événements importés ou mis à jour.`);
    await queryClient.invalidateQueries({ queryKey: ["admin-events-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-events-settings"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-events-catalog"] });
  };

  const runCurate = async () => {
    const data = await invokeAdmin("curate-events", {}, "curate");
    if (data?.curated !== undefined) toast.success(`${data.curated} événements présentés par l'agent IA.`);
    await queryClient.invalidateQueries({ queryKey: ["admin-events-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-events-catalog"] });
  };

  const saveSettings = async () => {
    const countries = syncForm.countries
      .split(/[\s,;]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c));
    const s = settingsQuery.data;
    const rows = [
      {
        config_key: "events_sync",
        config_value: {
          ...(s?.sync ?? {}),
          countries,
          perCountry: Number(syncForm.perCountry) || 200,
          daysAhead: Number(syncForm.daysAhead) || 180,
        },
        category: "events",
        description: "Événements : pays importés de Ticketmaster, nombre par pays et horizon en jours",
      },
      {
        config_key: "event_concierge",
        config_value: {
          enabled: conciergeForm.enabled,
          feePercent: Number(conciergeForm.feePercent) || 0,
          minFeeXof: Number(conciergeForm.minFeeXof) || 0,
          maxTickets: Number(conciergeForm.maxTickets) || 8,
        },
        category: "events",
        description:
          "Achat de billets par la conciergerie : frais de service (pourcentage, minimum en FCFA) et billets maximum par commande",
      },
    ];
    const { error } = await supabase.from("site_config").upsert(rows, { onConflict: "config_key" });
    if (error) return toast.error(error.message);
    toast.success("Réglages enregistrés.");
    await queryClient.invalidateQueries({ queryKey: ["admin-events-settings"] });
    await queryClient.invalidateQueries({ queryKey: ["site_config"] });
  };

  const toggleEvent = async (event: CatalogEvent, field: "is_featured" | "is_published") => {
    const { error } = await supabase
      .from("events")
      .update({ [field]: !event[field] })
      .eq("id", event.id);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["admin-events-catalog"] });
  };

  const markPurchased = async () => {
    if (!purchaseOrder) return;
    const links = ticketLinks
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const data = await invokeAdmin(
      "manage-event-order",
      {
        booking_id: purchaseOrder.id,
        action: "purchased",
        tickets_info: ticketsInfo,
        ticket_links: links,
        purchase_cost: Number(purchaseCost) || undefined,
      },
      "order",
    );
    if (data?.success) {
      toast.success("Billets envoyés au client.");
      setPurchaseOrder(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-event-orders"] });
    }
  };

  const markUnavailable = async () => {
    if (!unavailableOrder) return;
    const data = await invokeAdmin(
      "manage-event-order",
      { booking_id: unavailableOrder.id, action: "unavailable", reason },
      "order",
    );
    if (data?.success) {
      toast.success("Client remboursé et prévenu.");
      setUnavailableOrder(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-event-orders"] });
    }
  };

  const lastResult = settingsQuery.data?.sync?.lastResult;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Événements</h1>
          <p className="text-muted-foreground">
            Catalogue mondial mis à jour chaque nuit (Ticketmaster), présenté par l'agent IA, et achats de billets par
            la conciergerie.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Événements à venir</p>
              <p className="text-2xl font-bold">{statsQuery.data?.total ?? "…"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">À présenter par l'agent IA</p>
              <p className="text-2xl font-bold">{statsQuery.data?.uncurated ?? "…"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">À la une</p>
              <p className="text-2xl font-bold">{statsQuery.data?.featured ?? "…"}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="catalog">Catalogue</TabsTrigger>
            <TabsTrigger value="settings">Réglages</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={orderFilter === "todo" ? "default" : "outline"}
                onClick={() => setOrderFilter("todo")}
              >
                À traiter
              </Button>
              <Button
                size="sm"
                variant={orderFilter === "all" ? "default" : "outline"}
                onClick={() => setOrderFilter("all")}
              >
                Toutes les commandes payées
              </Button>
            </div>
            {ordersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground py-6">Chargement…</p>
            ) : !ordersQuery.data?.length ? (
              <div className="rounded-lg border p-10 text-center text-muted-foreground">
                <Ticket className="h-10 w-10 mx-auto mb-2 opacity-50" />
                {orderFilter === "todo" ? "Aucune commande à traiter." : "Aucune commande payée pour l'instant."}
              </div>
            ) : (
              <div className="space-y-3">
                {ordersQuery.data.map((order) => {
                  const d = order.booking_details;
                  const status = ORDER_STATUS[d.conciergeStatus] ?? {
                    label: d.conciergeStatus,
                    variant: "outline" as const,
                  };
                  return (
                    <Card key={order.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div>
                            <p className="font-semibold">{d.eventName}</p>
                            <p className="text-xs text-muted-foreground">
                              {shortDate(d.localDate)}
                              {d.localTime ? ` · ${d.localTime}` : ""} ·{" "}
                              {[d.venue, d.city, d.country].filter(Boolean).join(", ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Réf. {order.id.slice(0, 8).toUpperCase()} · commandé le {shortDate(order.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <span className="font-bold">{formatFcfa(Number(order.total_price))}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <p>
                            <strong>
                              {d.quantity} billet{d.quantity > 1 ? "s" : ""}
                            </strong>{" "}
                            · {d.tier === "best" ? "meilleures places" : "meilleur prix"} · budget billets{" "}
                            {formatFcfa(Number(d.subtotalXof))} (frais {formatFcfa(Number(d.feeXof))})
                            {d.sourcePrice ? ` · prix source ${d.sourcePrice}` : ""}
                          </p>
                          <p>
                            {order.customer_name} · {order.customer_phone} · {order.customer_email}
                          </p>
                        </div>
                        {order.notes && (
                          <p className="rounded-md bg-muted/50 p-2 text-sm">
                            <span className="font-medium">Préférences : </span>
                            {order.notes}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {d.ticketUrl && (
                            <Button asChild size="sm" variant="outline">
                              <a href={d.ticketUrl} target="_blank" rel="noopener noreferrer">
                                Page de vente <ExternalLink className="h-3.5 w-3.5 ml-1" />
                              </a>
                            </Button>
                          )}
                          {d.conciergeStatus === "to_purchase" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setPurchaseOrder(order);
                                  setTicketsInfo("");
                                  setTicketLinks("");
                                  setPurchaseCost("");
                                }}
                              >
                                Billets achetés
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => {
                                  setUnavailableOrder(order);
                                  setReason("");
                                }}
                              >
                                Indisponible – rembourser
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="catalog" className="space-y-4">
            <Input
              placeholder="Rechercher un événement…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <div className="rounded-lg border divide-y">
              {catalogQuery.data?.map((event) => (
                <div key={event.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/events/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {event.name}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {shortDate(event.local_date)} · {event.city} {countryFlag(event.country_code)}{" "}
                      {countryName(event.country_code)} · {eventCategory(event.category).label}
                      {event.price_min_xof ? ` · dès ${formatFcfa(event.price_min_xof)}` : " · prix non communiqué"}
                    </p>
                  </div>
                  <Badge variant={event.curated_at ? "secondary" : "outline"} className="w-fit">
                    {event.curated_at ? `Intérêt ${event.highlight_score ?? "–"}/100` : "Non présenté"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={event.is_featured ? "Retirer de la une" : "Mettre à la une"}
                    onClick={() => toggleEvent(event, "is_featured")}
                  >
                    <Star
                      className={`h-4 w-4 ${event.is_featured ? "fill-gold text-gold" : "text-muted-foreground"}`}
                    />
                  </Button>
                  <Switch
                    checked={event.is_published}
                    onCheckedChange={() => toggleEvent(event, "is_published")}
                    aria-label="Publié"
                  />
                </div>
              ))}
              {catalogQuery.data?.length === 0 && (
                <p className="p-6 text-center text-muted-foreground">
                  Aucun événement. Lancez une synchronisation dans les réglages.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mise à jour automatique</CardTitle>
                <CardDescription>
                  Import Ticketmaster chaque nuit à 2 h (UTC), puis présentation par l'agent IA chaque heure.
                  {lastResult?.at &&
                    ` Dernière synchronisation : ${new Date(lastResult.at).toLocaleString("fr-FR")} – ${lastResult.total ?? 0} événements.`}
                  {lastResult?.errors?.length ? ` Erreurs : ${lastResult.errors.join(" · ")}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Pays importés (codes ISO, séparés par des virgules)</Label>
                  <Input
                    value={syncForm.countries}
                    onChange={(e) => setSyncForm({ ...syncForm, countries: e.target.value })}
                    placeholder="FR, GB, US, AE…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Événements par pays</Label>
                    <Input
                      type="number"
                      min="20"
                      max="800"
                      value={syncForm.perCountry}
                      onChange={(e) => setSyncForm({ ...syncForm, perCountry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Horizon (jours)</Label>
                    <Input
                      type="number"
                      min="7"
                      max="365"
                      value={syncForm.daysAhead}
                      onChange={(e) => setSyncForm({ ...syncForm, daysAhead: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={runSync} disabled={busy !== null}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${busy === "sync" ? "animate-spin" : ""}`} />
                    Synchroniser maintenant
                  </Button>
                  <Button variant="outline" onClick={runCurate} disabled={busy !== null}>
                    <Bot className="h-4 w-4 mr-2" />
                    Lancer l'agent IA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achat par la conciergerie</CardTitle>
                <CardDescription>Frais ajoutés au prix des billets, affichés au client avant paiement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={conciergeForm.enabled}
                    onCheckedChange={(c) => setConciergeForm({ ...conciergeForm, enabled: c })}
                  />
                  Achat de billets ouvert aux clients
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Frais (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={conciergeForm.feePercent}
                      onChange={(e) => setConciergeForm({ ...conciergeForm, feePercent: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Frais minimum (FCFA)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={conciergeForm.minFeeXof}
                      onChange={(e) => setConciergeForm({ ...conciergeForm, minFeeXof: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Billets max par commande</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={conciergeForm.maxTickets}
                      onChange={(e) => setConciergeForm({ ...conciergeForm, maxTickets: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={saveSettings}>Enregistrer les réglages</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!purchaseOrder} onOpenChange={(v) => !v && setPurchaseOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Billets achetés</DialogTitle>
            <DialogDescription>
              {purchaseOrder?.booking_details.eventName} · {purchaseOrder?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Billets et accès (envoyé au client)</Label>
              <Textarea
                rows={5}
                value={ticketsInfo}
                onChange={(e) => setTicketsInfo(e.target.value)}
                placeholder="Ex. : 2 billets catégorie 1, rang F, places 12-13. Billets transférés sur votre compte Ticketmaster (email …) : acceptez le transfert depuis l'application."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Liens des billets (un par ligne, optionnel)</Label>
              <Textarea
                rows={2}
                value={ticketLinks}
                onChange={(e) => setTicketLinks(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Coût réel d'achat en FCFA (interne, optionnel)</Label>
              <Input type="number" min="0" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPurchaseOrder(null)}>
                Annuler
              </Button>
              <Button onClick={markPurchased} disabled={busy === "order"}>
                Envoyer les billets au client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!unavailableOrder} onOpenChange={(v) => !v && setUnavailableOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Billets indisponibles</DialogTitle>
            <DialogDescription>
              Le client sera remboursé intégralement (
              {unavailableOrder ? formatFcfa(Number(unavailableOrder.total_price)) : ""}) et prévenu par email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Message au client (optionnel)</Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex. : l'événement affiche complet chez le vendeur officiel."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUnavailableOrder(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={markUnavailable} disabled={busy === "order"}>
                Rembourser et prévenir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
