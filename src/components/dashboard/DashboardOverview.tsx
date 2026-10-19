import { useEffect, useState, type ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  Car,
  Check,
  ChevronRight,
  Circle,
  Compass,
  CreditCard,
  Crown,
  Hotel,
  Hourglass,
  Luggage,
  MapPin,
  Package,
  Plane,
  Smile,
  Ticket,
  TrainFront,
  UserCircle2,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { MemberCard } from "@/components/MemberCard";
import { cn } from "@/lib/utils";
import { currentLocaleTag } from "@/lib/dateLocale";
import { fetchLoyaltySummary, type LoyaltySummary } from "@/hooks/useLoyalty";

// Réservation telle que renvoyée par useOfflineBookings
export interface OverviewBooking {
  id: string;
  start_date: string;
  end_date: string | null;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  services: { name: string; type: string; location: string } | null;
}

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string | null;
  status: string;
  end_date: string | null;
}

interface PriceAlert {
  id: string;
  destination: string;
  origin: string | null;
  service_type: string;
  target_price: number | null;
  current_price: number | null;
  currency: string;
  is_active: boolean;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  member_code: string | null;
}

const TYPE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  flight: Plane,
  hotel: Hotel,
  stay: Hotel,
  car: Car,
  train: TrainFront,
  event: Ticket,
  activity: Compass,
  tour: Compass,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Vue d'ensemble du compte client : actions à faire, chiffres clés, prochain
// voyage, abonnement et carte membre, Smiles, alertes prix et profil.
export function DashboardOverview({ userId, bookings }: { userId: string; bookings: OverviewBooking[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: profileRow }, { data: subs }, summary, { data: alertRows }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, avatar_url, member_code").eq("id", userId).maybeSingle(),
        supabase
          .from("user_subscriptions")
          .select("id, plan_id, plan_name, status, end_date")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        fetchLoyaltySummary(),
        supabase
          .from("price_alerts")
          .select("id, destination, origin, service_type, target_price, current_price, currency, is_active")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setProfile((profileRow as Profile | null) ?? null);
      const rows = (subs as Subscription[] | null) ?? [];
      const active = rows
        .filter((row) => row.status === "active")
        .sort((a, b) => (b.end_date ?? "").localeCompare(a.end_date ?? ""))[0];
      setSubscription(active ?? rows.find((row) => row.status === "pending") ?? null);
      setLoyalty(summary);
      setAlerts((alertRows as PriceAlert[] | null) ?? []);
    };
    void load();
  }, [userId]);

  const nf = new Intl.NumberFormat(currentLocaleTag());
  const today = startOfToday();
  const fmtDate = (iso: string, withYear = false) =>
    new Date(iso).toLocaleDateString(currentLocaleTag(), { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });

  // ------------------------------------------------------------- Réservations
  const live = bookings.filter((b) => b.status !== "cancelled");
  const upcoming = live
    .filter((b) => new Date(b.start_date) >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const nextTrip = upcoming[0];
  const toPay = live.filter((b) => b.payment_status === "pending");
  const totalSpent = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const daysToNextTrip = nextTrip ? Math.round((new Date(nextTrip.start_date).getTime() - today.getTime()) / DAY_MS) : null;

  // ------------------------------------------------------------- Abonnement
  const subActive = subscription?.status === "active";
  const subDaysLeft = subActive && subscription?.end_date
    ? Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / DAY_MS)
    : null;

  // ------------------------------------------------------------- Profil
  const profileChecks = [
    { key: "name", done: !!profile?.full_name },
    { key: "phone", done: !!profile?.phone },
    { key: "photo", done: !!profile?.avatar_url },
    { key: "booking", done: bookings.length > 0 },
  ];
  const profilePercent = Math.round((profileChecks.filter((c) => c.done).length / profileChecks.length) * 100);
  const activeAlerts = alerts.filter((a) => a.is_active);

  // ------------------------------------------------------------- Actions requises
  const todo: { key: string; icon: ComponentType<{ className?: string }>; text: string; cta: string; to: string; tone: string }[] = [];
  if (toPay.length > 0) {
    todo.push({
      key: "pay",
      icon: CreditCard,
      text: t("ux.dash.todoPay", { count: toPay.length }),
      cta: t("ux.dash.pay"),
      to: toPay.length === 1 ? `/payment?bookingId=${toPay[0].id}` : "/booking-history",
      tone: "text-warning-foreground bg-warning/20",
    });
  }
  if (subscription?.status === "pending") {
    todo.push({
      key: "sub-pending",
      icon: Crown,
      text: t("ux.dash.todoSubPending", { plan: subscription.plan_name || subscription.plan_id }),
      cta: t("ux.dash.resume"),
      to: `/subscription-payment?planId=${subscription.plan_id}`,
      tone: "text-primary bg-primary/10",
    });
  }
  if (subDaysLeft !== null && subDaysLeft <= 14) {
    todo.push({
      key: "sub-expiring",
      icon: Crown,
      text: t("ux.dash.todoSubExpiring", { count: Math.max(subDaysLeft, 0) }),
      cta: t("ux.dash.renew"),
      to: `/subscription-payment?planId=${subscription!.plan_id}`,
      tone: "text-warning-foreground bg-warning/20",
    });
  }
  if (loyalty && loyalty.expiring_soon > 0) {
    todo.push({
      key: "smiles-expiring",
      icon: Hourglass,
      text: t("ux.dash.todoSmilesExpiring", { points: nf.format(loyalty.expiring_soon) }),
      cta: t("ux.dash.see"),
      to: "/smiles",
      tone: "text-info bg-info/10",
    });
  }
  if (profile && !profile.phone) {
    todo.push({
      key: "phone",
      icon: UserCircle2,
      text: t("ux.dash.todoPhone"),
      cta: t("ux.dash.complete"),
      to: "/account",
      tone: "text-muted-foreground bg-muted",
    });
  }

  // ------------------------------------------------------------- Tuiles
  const tiles = [
    {
      key: "trips",
      icon: Luggage,
      label: t("ux.dash.tileTrips"),
      value: nf.format(live.length),
      hint: t("ux.dash.tileTripsHint", { count: upcoming.length }),
      to: "/booking-history",
    },
    {
      key: "spent",
      icon: Wallet,
      label: t("ux.dash.tileSpent"),
      value: <Price amount={totalSpent} />,
      hint: t("ux.dash.tileSpentHint", { count: bookings.filter((b) => b.payment_status === "paid").length }),
      to: "/booking-history",
    },
    {
      key: "smiles",
      icon: Smile,
      label: "Smiles",
      value: loyalty ? nf.format(loyalty.balance) : "—",
      hint: loyalty ? t(`ux.smiles.tier_${loyalty.tier?.code ?? "bronze"}`) : "",
      to: "/smiles",
    },
    {
      key: "sub",
      icon: Crown,
      label: t("ux.dash.tileSub"),
      value: subActive ? subscription!.plan_name || subscription!.plan_id : t("ux.dash.none"),
      hint: subActive && subscription?.end_date
        ? t("ux.dash.until", { date: fmtDate(subscription.end_date, true) })
        : t("ux.dash.discoverPlans"),
      to: subActive ? "/account" : "/",
    },
    {
      key: "alerts",
      icon: Bell,
      label: t("ux.dash.tileAlerts"),
      value: nf.format(activeAlerts.length),
      hint: t("ux.dash.tileAlertsHint"),
      to: "/price-alerts",
    },
  ];

  const TripIcon = TYPE_ICONS[nextTrip?.services?.type ?? ""] ?? Package;

  return (
    <div className="space-y-6">
      {/* Actions requises */}
      {todo.length > 0 && (
        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <AlertCircle className="h-5 w-5 text-warning-foreground" />
            {t("ux.dash.todoTitle")}
          </h2>
          <ul className="space-y-2">
            {todo.map(({ key, icon: Icon, text, cta, to, tone }) => (
              <li key={key} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/40 p-3">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="min-w-[12rem] flex-1 text-sm">{text}</p>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate(to)}>
                  {cta}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Chiffres clés */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map(({ key, icon: Icon, label, value, hint, to }, index) => (
          <Link
            key={key}
            to={to}
            className={cn(
              "group rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
              // Nombre impair de tuiles : la dernière prend toute la largeur sur mobile
              index === tiles.length - 1 && tiles.length % 2 === 1 && "col-span-2 md:col-span-1",
            )}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2 text-xs font-medium">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-2 truncate text-xl font-bold">{value}</div>
            {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ------------------------------ Colonne principale ------------------------------ */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Prochain voyage */}
          {nextTrip ? (
            <section
              className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl"
              style={{ background: "linear-gradient(135deg, #0F1A33 0%, #163A5C 60%, #0F7B5F 140%)" }}
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{t("ux.dash.nextTrip")}</p>
                  <h2 className="mt-2 truncate text-2xl font-bold">{nextTrip.services?.name || t("ux.dash.trip")}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
                    <MapPin className="h-4 w-4" />
                    {nextTrip.services?.location || "—"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
                    <CalendarDays className="h-4 w-4" />
                    {fmtDate(nextTrip.start_date, true)}
                    {nextTrip.end_date && nextTrip.end_date !== nextTrip.start_date && ` → ${fmtDate(nextTrip.end_date, true)}`}
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <TripIcon className="mx-auto h-5 w-5 text-white/80" />
                  <p className="mt-1 text-2xl font-extrabold leading-none">
                    {daysToNextTrip === 0 ? t("ux.dash.today") : `J-${daysToNextTrip}`}
                  </p>
                </div>
              </div>
              <div className="relative mt-5 flex flex-wrap items-center gap-2">
                <Badge className={nextTrip.payment_status === "paid" ? "bg-success text-white" : "bg-warning text-warning-foreground"}>
                  {nextTrip.payment_status === "paid" ? t("ux.dash.paid") : t("ux.dash.toPay")}
                </Badge>
                <span className="text-sm font-semibold"><Price amount={nextTrip.total_price} fromCurrency={nextTrip.currency} /></span>
                <Button
                  size="sm"
                  className="ml-auto bg-white text-primary hover:bg-white/90"
                  onClick={() => navigate(nextTrip.payment_status === "pending" ? `/payment?bookingId=${nextTrip.id}` : "/booking-history")}
                >
                  {nextTrip.payment_status === "pending" ? t("ux.dash.pay") : t("ux.dash.details")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
              <Luggage className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 font-semibold">{t("ux.dash.noTripTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("ux.dash.noTripDesc")}</p>
              <Button className="mt-4" onClick={() => navigate("/")}>{t("ux.dash.bookTrip")}</Button>
            </section>
          )}

          {/* Voyages à venir */}
          {upcoming.length > 1 && (
            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold">{t("ux.dash.upcomingTitle")}</h2>
                <Link to="/booking-history" className="text-sm text-primary hover:underline">{t("ux.dash.seeAll")}</Link>
              </div>
              <ul className="divide-y divide-border">
                {upcoming.slice(1, 5).map((booking) => {
                  const Icon = TYPE_ICONS[booking.services?.type ?? ""] ?? Package;
                  return (
                    <li key={booking.id} className="flex items-center gap-3 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{booking.services?.name || t("ux.dash.trip")}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(booking.start_date, true)} · {booking.services?.location || "—"}
                        </p>
                      </div>
                      {booking.payment_status === "pending" ? (
                        <Badge variant="outline" className="border-warning/50 text-warning-foreground">{t("ux.dash.toPay")}</Badge>
                      ) : (
                        <Badge variant="outline" className="border-success/40 text-success">{t("ux.dash.paid")}</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* ------------------------------ Colonne latérale ------------------------------ */}
        <aside className="flex flex-col gap-6">
          {/* Carte membre / abonnement */}
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Crown className="h-5 w-5 text-primary" />
                {t("ux.dash.membership")}
              </h2>
              {subActive && <Link to="/ma-carte" className="text-sm text-primary hover:underline">{t("ux.dash.showCard")}</Link>}
            </div>
            {subActive && profile?.member_code ? (
              <MemberCard
                planId={subscription!.plan_id}
                planName={subscription!.plan_name || subscription!.plan_id}
                holderName={profile.full_name || ""}
                memberCode={profile.member_code}
                validUntil={subscription!.end_date}
              />
            ) : (
              <div className="rounded-2xl bg-muted/50 p-4 text-sm">
                <p className="text-muted-foreground">{t("ux.dash.noMembership")}</p>
                <Button size="sm" className="mt-3" onClick={() => navigate("/")}>{t("ux.dash.discoverPlans")}</Button>
              </div>
            )}
          </section>

          {/* Smiles */}
          {loyalty && (
            <Link to="/smiles" className="block rounded-3xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Smile className="h-5 w-5 text-primary" />
                  Smiles
                </h2>
                <Badge variant="outline">{t(`ux.smiles.tier_${loyalty.tier?.code ?? "bronze"}`)}</Badge>
              </div>
              <p className="mt-3 text-3xl font-extrabold tabular-nums">
                {nf.format(loyalty.balance)}
                <span className="ml-1 text-sm font-semibold text-muted-foreground">
                  ≈ {nf.format(loyalty.balance * loyalty.settings.point_value_xof)} FCFA
                </span>
              </p>
              {loyalty.next_tier && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, Math.round(((loyalty.lifetime - (loyalty.tier?.min_points ?? 0)) / (loyalty.next_tier.min_points - (loyalty.tier?.min_points ?? 0))) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {t("ux.dash.toNextTier", {
                      points: nf.format(loyalty.next_tier.min_points - loyalty.lifetime),
                      tier: t(`ux.smiles.tier_${loyalty.next_tier.code}`),
                    })}
                  </p>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{t("ux.dash.streak", { count: loyalty.streak })}</span>
                <span className="font-mono font-semibold text-foreground">{loyalty.referral_code}</span>
              </div>
            </Link>
          )}

          {/* Alertes prix */}
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Bell className="h-5 w-5 text-primary" />
                {t("ux.dash.tileAlerts")}
              </h2>
              <Link to="/price-alerts" className="text-sm text-primary hover:underline">{t("ux.dash.manage")}</Link>
            </div>
            {activeAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("ux.dash.noAlerts")}</p>
            ) : (
              <ul className="space-y-2">
                {activeAlerts.slice(0, 3).map((alert) => {
                  const reached = alert.target_price != null && alert.current_price != null && alert.current_price <= alert.target_price;
                  return (
                    <li key={alert.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate">
                        {alert.origin ? `${alert.origin} → ` : ""}{alert.destination}
                      </span>
                      {alert.target_price != null && (
                        <span className={cn("shrink-0 text-xs font-semibold", reached ? "text-success" : "text-muted-foreground")}>
                          {reached && <Check className="mr-0.5 inline h-3.5 w-3.5" />}
                          ≤ <Price amount={alert.target_price} fromCurrency={alert.currency} />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Profil */}
          {profile && profilePercent < 100 && (
            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <UserCircle2 className="h-5 w-5 text-primary" />
                  {t("ux.dash.profileTitle")}
                </h2>
                <span className="text-sm font-bold">{profilePercent} %</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success" style={{ width: `${profilePercent}%` }} />
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {profileChecks.map(({ key, done }) => (
                  <li key={key} className={cn("flex items-center gap-2", done ? "text-muted-foreground line-through" : "")}>
                    {done ? <Check className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground/50" />}
                    {t(`ux.dash.check_${key}`)}
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => navigate("/account")}>
                {t("ux.dash.complete")}
              </Button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
