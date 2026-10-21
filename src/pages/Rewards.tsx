import { useRef, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CalendarCheck,
  Check,
  Copy,
  Flame,
  Gift,
  History,
  Hourglass,
  Loader2,
  Send,
  Settings2,
  Share2,
  ShoppingBag,
  Smile,
  Sparkles,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadErrorRetry } from "@/components/LoadErrorRetry";
import { cn } from "@/lib/utils";
import { currentLocaleTag } from "@/lib/dateLocale";
import { LOYALTY_TIERS, useLoyalty, type LoyaltyTransaction } from "@/hooks/useLoyalty";

const TIER_COLORS: Record<string, string> = {
  bronze: "#C07A45",
  silver: "#A9B4BF",
  gold: "#D4AF37",
  platinum: "#9FB6CC",
};

const KIND_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  purchase: ShoppingBag,
  referral: Users,
  referral_welcome: Gift,
  checkin: CalendarCheck,
  streak: Flame,
  redeem: Ticket,
  adjustment: Settings2,
  expiry: Hourglass,
};

// Portail du programme de fidélité « Smiles Bossiz+ »
const Rewards = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { summary, transactions, loading, refresh, checkIn } = useLoyalty();
  const [checkingIn, setCheckingIn] = useState(false);
  const [howToUseOpen, setHowToUseOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const referralRef = useRef<HTMLDivElement>(null);
  const referralMobileRef = useRef<HTMLDivElement>(null);

  const nf = new Intl.NumberFormat(currentLocaleTag());
  const fmt = (n: number) => nf.format(Math.round(n));

  if (loading || !summary) {
    return (
      <UserDashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          {loading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <LoadErrorRetry onRetry={() => void refresh()} />
          )}
        </div>
      </UserDashboardLayout>
    );
  }

  const s = summary.settings;
  const tierCode = summary.tier?.code ?? "bronze";
  const tierColor = TIER_COLORS[tierCode] ?? TIER_COLORS.bronze;
  const tierName = t(`ux.smiles.tier_${tierCode}`, summary.tier?.name ?? "Bronze");
  const next = summary.next_tier;
  const progress = next
    ? Math.min(
        100,
        Math.round(
          ((summary.lifetime - (summary.tier?.min_points ?? 0)) / (next.min_points - (summary.tier?.min_points ?? 0))) *
            100,
        ),
      )
    : 100;
  const referralLink = `${window.location.origin}/auth?ref=${summary.referral_code}`;
  const streakInCycle =
    s.streak_days > 0 ? summary.streak % s.streak_days || (summary.streak > 0 ? s.streak_days : 0) : 0;

  const handleCheckIn = async () => {
    setCheckingIn(true);
    const result = await checkIn();
    setCheckingIn(false);
    if (result?.awarded) {
      toast.success(
        t("ux.smiles.checkinToast", { points: (result.points ?? 0) + (result.bonus ?? 0), streak: result.streak }),
      );
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success(t("ux.smiles.linkCopied"));
    } catch {
      toast.error(t("ux.smiles.copyFailed"));
    }
  };

  const shareMessage = t("ux.smiles.shareMessage", { points: fmt(s.referral_referee_points), link: referralLink });
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Bossiz+", text: shareMessage });
        return;
      } catch {
        // partage annulé : rien à faire
        return;
      }
    }
    await copyLink();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(currentLocaleTag(), {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Ajustement manuel : le motif saisi par l'équipe est montré au client
  const kindLabel = (row: LoyaltyTransaction) =>
    row.kind === "adjustment" && row.description
      ? row.description
      : t(`ux.smiles.kind_${row.kind}`, row.description ?? row.kind);

  // Carte de parrainage : rendue dans la colonne principale sur mobile
  // (juste après la série), dans la colonne latérale sur ordinateur.
  const referralCard = (ref: typeof referralRef) => (
    <section
      ref={ref}
      className="scroll-mt-20 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-success/10 p-5 shadow-sm"
    >
      <p className="flex items-center gap-2 font-semibold">
        <Gift className="h-5 w-5 text-primary" />
        {t("ux.smiles.referTitle")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("ux.smiles.referDesc", {
          referrer: fmt(s.referral_referrer_points),
          referee: fmt(s.referral_referee_points),
        })}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-background/70 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("ux.smiles.yourCode")}</p>
          <p className="font-mono text-xl font-bold tracking-widest">{summary.referral_code}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={copyLink} aria-label={t("ux.smiles.copyLink")}>
          <Copy className="h-5 w-5" />
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button onClick={share}>
          <Share2 className="mr-2 h-4 w-4" />
          {t("ux.smiles.share")}
        </Button>
        <Button variant="outline" asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {t("ux.smiles.referralsCount", { count: summary.referrals })}
      </p>
    </section>
  );

  const scrollToReferral = () => {
    const target = [referralRef.current, referralMobileRef.current].find((el) => el && el.offsetParent !== null);
    target?.scrollIntoView({ behavior: "smooth" });
  };

  const actions = [
    {
      key: "checkin",
      icon: summary.checked_in_today ? Check : CalendarCheck,
      label: summary.checked_in_today ? t("ux.smiles.actionCheckedIn") : t("ux.smiles.actionCheckin"),
      onClick: handleCheckIn,
      disabled: summary.checked_in_today || checkingIn,
      tone: "bg-success/15 text-success",
    },
    {
      key: "refer",
      icon: Send,
      label: t("ux.smiles.actionRefer"),
      onClick: scrollToReferral,
      tone: "bg-primary/10 text-primary",
    },
    {
      key: "use",
      icon: Ticket,
      label: t("ux.smiles.actionUse"),
      onClick: () => setHowToUseOpen(true),
      tone: "bg-warning/40 text-warning-foreground",
    },
    {
      key: "history",
      icon: History,
      label: t("ux.smiles.actionHistory"),
      onClick: () => historyRef.current?.scrollIntoView({ behavior: "smooth" }),
      tone: "bg-info/10 text-info",
    },
  ];

  return (
    <UserDashboardLayout>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* -------------------------------- Colonne principale -------------------------------- */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Solde */}
            <section
              className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8"
              style={{ background: "linear-gradient(135deg, #0F1A33 0%, #12304A 55%, #0F7B5F 130%)" }}
            >
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
              <div
                className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full"
                style={{ background: `${tierColor}33` }}
              />

              <div className="relative flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <Smile className="h-4 w-4" />
                  {t("ux.smiles.title")}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: `${tierColor}26`,
                    color: tierColor,
                    boxShadow: `inset 0 0 0 1px ${tierColor}66`,
                  }}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  {tierName}
                </span>
              </div>

              <div className="relative mt-6">
                <p className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
                  {fmt(summary.balance)}
                  <span className="ml-2 text-lg font-semibold text-white/70">Smiles</span>
                </p>
                <p className="mt-1 text-sm text-white/75">
                  {t("ux.smiles.worth", { amount: fmt(summary.balance * s.point_value_xof) })}
                  {summary.pending > 0 && ` · ${t("ux.smiles.pendingNote", { points: fmt(summary.pending) })}`}
                </p>
                {summary.expiring_soon > 0 && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                    <Hourglass className="h-3.5 w-3.5" />
                    {t("ux.smiles.expiringSoon", {
                      points: fmt(summary.expiring_soon),
                      date: new Date(summary.expiring_by).toLocaleDateString(currentLocaleTag(), {
                        day: "numeric",
                        month: "long",
                      }),
                    })}
                  </p>
                )}
              </div>

              <div className="relative mt-6">
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, background: tierColor }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/75">
                  {next
                    ? t("ux.smiles.toNextTier", {
                        points: fmt(next.min_points - summary.lifetime),
                        tier: t(`ux.smiles.tier_${next.code}`, next.name),
                        multiplier: nf.format(next.multiplier),
                      })
                    : t("ux.smiles.maxTier")}
                </p>
              </div>
            </section>

            {/* Actions rapides */}
            <section className="grid grid-cols-4 gap-2 sm:gap-4">
              {actions.map(({ key, icon: Icon, label, onClick, disabled, tone }) => (
                <button
                  key={key}
                  type="button"
                  onClick={onClick}
                  disabled={disabled}
                  className="group flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition-colors hover:bg-muted/60 disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <span
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-105 group-disabled:scale-100",
                      tone,
                    )}
                  >
                    {key === "checkin" && checkingIn ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </span>
                  <span className="text-xs font-medium leading-tight text-foreground">{label}</span>
                </button>
              ))}
            </section>

            {/* Série de visites */}
            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    <Flame className="h-5 w-5 text-warning" />
                    {t("ux.smiles.streakTitle", { count: summary.streak })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("ux.smiles.streakDesc", {
                      daily: s.daily_checkin_points,
                      bonus: fmt(s.streak_bonus_points),
                      days: s.streak_days,
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {Array.from({ length: s.streak_days }, (_, i) => {
                  const done = i < streakInCycle;
                  const isBonus = i === s.streak_days - 1;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex h-10 flex-1 items-center justify-center rounded-xl text-xs font-semibold",
                        done ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isBonus ? <Gift className="h-4 w-4" /> : done ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="lg:hidden">{referralCard(referralMobileRef)}</div>

            {/* Historique */}
            <section ref={historyRef} className="scroll-mt-20 rounded-3xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <History className="h-5 w-5 text-primary" />
                {t("ux.smiles.historyTitle")}
              </h2>
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t("ux.smiles.historyEmpty")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {transactions.map((row) => {
                    const Icon = KIND_ICONS[row.kind] ?? Sparkles;
                    const positive = row.points > 0;
                    return (
                      <li key={row.id} className="flex items-center gap-3 py-3">
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            positive ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{kindLabel(row)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(row.created_at)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              "text-sm font-bold tabular-nums",
                              positive ? "text-success" : "text-foreground",
                            )}
                          >
                            {positive ? "+" : "−"}
                            {fmt(Math.abs(row.points))}
                          </p>
                          {row.status === "pending" && (
                            <Badge variant="outline" className="mt-0.5 text-[10px]">
                              {t("ux.smiles.pending")}
                            </Badge>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* -------------------------------- Colonne latérale -------------------------------- */}
          <aside className="flex flex-col gap-6">
            <div className="hidden lg:block">{referralCard(referralRef)}</div>

            {/* Niveaux */}
            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <p className="mb-3 flex items-center gap-2 font-semibold">
                <Trophy className="h-5 w-5 text-primary" />
                {t("ux.smiles.tiersTitle")}
              </p>
              <ul className="space-y-2">
                {LOYALTY_TIERS.map((tier) => {
                  const current = tier.code === tierCode;
                  return (
                    <li
                      key={tier.code}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                        current ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/40",
                      )}
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: TIER_COLORS[tier.code] }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{t(`ux.smiles.tier_${tier.code}`, tier.name)}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("ux.smiles.tierFrom", { points: fmt(tier.min_points) })}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums">×{nf.format(tier.multiplier)}</span>
                      {current && <Check className="h-4 w-4 text-primary" />}
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Règles */}
            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <p className="mb-3 flex items-center gap-2 font-semibold">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("ux.smiles.earnTitle")}
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>
                    {t("ux.smiles.earnPurchase", {
                      points: nf.format(s.points_per_100_xof),
                      multiplier: nf.format(summary.tier?.multiplier ?? 1),
                    })}
                  </span>
                </li>
                <li className="flex gap-3">
                  <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>
                    {t("ux.smiles.earnCheckin", {
                      points: s.daily_checkin_points,
                      bonus: fmt(s.streak_bonus_points),
                      days: s.streak_days,
                    })}
                  </span>
                </li>
                <li className="flex gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{t("ux.smiles.earnReferral", { points: fmt(s.referral_referrer_points) })}</span>
                </li>
                {s.points_validity_months > 0 && (
                  <li className="flex gap-3 border-t border-border pt-3">
                    <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{t("ux.smiles.validityRule", { months: s.points_validity_months })}</span>
                  </li>
                )}
                <li className="flex gap-3 border-t border-border pt-3">
                  <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {t("ux.smiles.useRule", {
                      min: fmt(s.min_redeem_points),
                      ratio: Math.round(Number(s.max_redeem_ratio) * 100),
                      value: nf.format(s.point_value_xof),
                    })}
                  </span>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>

      <Dialog open={howToUseOpen} onOpenChange={setHowToUseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ux.smiles.howToUseTitle")}</DialogTitle>
            <DialogDescription>
              {t("ux.smiles.howToUseDesc", {
                min: fmt(s.min_redeem_points),
                ratio: Math.round(Number(s.max_redeem_ratio) * 100),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => navigate("/")}>{t("ux.smiles.bookTrip")}</Button>
            <Button variant="outline" onClick={() => navigate("/booking-history")}>
              {t("ux.smiles.myBookings")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </UserDashboardLayout>
  );
};

export default Rewards;
