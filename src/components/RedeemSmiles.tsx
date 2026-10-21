import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Smile } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { currentLocaleTag } from "@/lib/dateLocale";
import { fetchLoyaltySummary, maxRedeemablePoints, type LoyaltySummary } from "@/hooks/useLoyalty";

interface RedeemSmilesProps {
  // Montant à payer avant Smiles, en XOF
  amountXof: number;
  // Smiles à utiliser (0 = aucun) et réduction correspondante en XOF ;
  // le serveur revérifie tout
  onChange: (points: number, discountXof: number) => void;
}

// Bloc « Utiliser mes Smiles » des pages de paiement, avec l'estimation des
// Smiles que rapportera l'achat.
export function RedeemSmiles({ amountXof, onChange }: RedeemSmilesProps) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    void fetchLoyaltySummary().then(setSummary);
  }, []);

  const max = summary ? maxRedeemablePoints(summary, amountXof) : 0;
  const points = enabled ? max : 0;
  const pointValue = summary?.settings.point_value_xof ?? 0;

  useEffect(() => {
    onChange(points, points * pointValue);
  }, [points, pointValue, onChange]);

  if (!summary) return null;

  const nf = new Intl.NumberFormat(currentLocaleTag());
  const s = summary.settings;
  const discount = points * s.point_value_xof;
  const earned = Math.floor(((amountXof - discount) / 100) * s.points_per_100_xof * (summary.tier?.multiplier ?? 1));

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Smile className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("ux.smiles.redeemTitle")}</p>
          <p className="text-xs text-muted-foreground">
            {max > 0
              ? t("ux.smiles.redeemAvailable", { points: nf.format(max), amount: nf.format(max * s.point_value_xof) })
              : t("ux.smiles.redeemUnavailable", {
                  balance: nf.format(summary.balance),
                  min: nf.format(s.min_redeem_points),
                  ratio: Math.round(Number(s.max_redeem_ratio) * 100),
                })}
          </p>
        </div>
        {max > 0 && <Switch checked={enabled} onCheckedChange={setEnabled} aria-label={t("ux.smiles.redeemTitle")} />}
      </div>
      {enabled && max > 0 && (
        <p className="mt-2 text-right text-sm font-semibold text-success">−{nf.format(discount)} FCFA</p>
      )}
      {earned > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("ux.smiles.willEarn", { points: nf.format(earned) })}{" "}
          <Link to="/smiles" className="text-primary hover:underline">
            {t("ux.smiles.learnMore")}
          </Link>
        </p>
      )}
    </div>
  );
}
