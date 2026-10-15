import QRCode from "react-qr-code";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { currentLocaleTag } from "@/lib/dateLocale";
import { memberCardTheme, memberNumber, memberVerifyUrl } from "@/lib/memberCardThemes";

interface MemberCardProps {
  planId: string;
  planName: string;
  holderName: string;
  memberCode: string;
  validUntil: string | null;
  expired?: boolean;
  size?: "md" | "lg";
  className?: string;
}

// Carte de membre électronique (format carte bancaire). Le QR code renvoie
// vers /verifier-membre/<code> pour qu'un partenaire contrôle la validité.
export function MemberCard({
  planId,
  planName,
  holderName,
  memberCode,
  validUntil,
  expired = false,
  size = "md",
  className,
}: MemberCardProps) {
  const { t } = useTranslation();
  const theme = memberCardTheme(planId);
  const Icon = theme.icon;
  const large = size === "lg";
  const until = validUntil
    ? new Date(validUntil).toLocaleDateString(currentLocaleTag(), { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";

  return (
    <div
      className={cn(
        "relative w-full aspect-[1.586] overflow-hidden rounded-2xl text-white shadow-2xl select-none",
        large ? "max-w-[520px] p-6" : "max-w-[400px] p-4",
        expired && "grayscale",
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
      role="img"
      aria-label={`${t("ux.memberCard.title")} ${planName} - ${holderName}`}
    >
      {/* Motif décoratif */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
        style={{ background: theme.accent }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full opacity-10"
        style={{ background: theme.accent }}
      />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn("flex items-center justify-center rounded-lg", large ? "h-11 w-11" : "h-8 w-8")}
              style={{ background: theme.accent, color: theme.to }}
            >
              <Icon className={large ? "h-6 w-6" : "h-4 w-4"} />
            </span>
            <div className="leading-tight">
              <p className={cn("font-bold", large ? "text-lg" : "text-sm")}>Bossiz+</p>
              <p className={cn("uppercase tracking-widest opacity-75", large ? "text-xs" : "text-[9px]")}>
                {t("ux.memberCard.title")}
              </p>
            </div>
          </div>
          <p
            className={cn("font-extrabold uppercase tracking-wider text-right", large ? "text-xl" : "text-base")}
            style={{ color: theme.accent }}
          >
            {planName}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className={cn("uppercase opacity-70", large ? "text-xs" : "text-[9px]")}>{t("ux.memberCard.holder")}</p>
            <p className={cn("truncate font-semibold uppercase", large ? "text-xl" : "text-sm")}>{holderName}</p>
            <p className={cn("font-mono tracking-wider", large ? "text-sm" : "text-[10px]")} style={{ color: theme.accent }}>
              {memberNumber(memberCode)}
            </p>
            <p className={cn("opacity-80", large ? "text-xs" : "text-[9px]")}>
              {t("ux.memberCard.validUntil")} {until}
            </p>
          </div>
          <div className={cn("shrink-0 rounded-lg bg-white", large ? "p-2" : "p-1.5")}>
            <QRCode value={memberVerifyUrl(memberCode)} size={large ? 112 : 72} level="M" />
          </div>
        </div>
      </div>

      {expired && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="-rotate-12 rounded-md border-4 border-white/80 px-4 py-1 text-2xl font-black tracking-widest text-white/90">
            {t("ux.memberCard.expired")}
          </span>
        </div>
      )}
    </div>
  );
}
