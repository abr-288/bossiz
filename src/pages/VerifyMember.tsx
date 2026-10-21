import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, HelpCircle, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { currentLocaleTag } from "@/lib/dateLocale";
import { memberCardTheme } from "@/lib/memberCardThemes";

interface Verification {
  holder_name: string;
  plan_id: string | null;
  plan_name: string | null;
  valid_until: string | null;
  is_valid: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Page publique ouverte en scannant le QR code d'une carte de membre :
// indique au personnel / partenaire si l'abonnement est valide.
const VerifyMember = () => {
  const { t } = useTranslation();
  const { code = "" } = useParams();
  const [result, setResult] = useState<Verification | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (UUID_RE.test(code)) {
        const { data } = await supabase.rpc("verify_member_card", { p_code: code });
        setResult(data?.[0] ?? null);
      }
      setLoaded(true);
    };
    void verify();
  }, [code]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(currentLocaleTag(), { day: "numeric", month: "long", year: "numeric" });

  const known = !!result?.plan_id;
  const theme = result?.plan_id ? memberCardTheme(result.plan_id) : null;

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md overflow-hidden">
        {theme && (
          <div
            className="px-6 py-4 text-white"
            style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
          >
            <p className="text-xs uppercase tracking-widest opacity-75">Bossiz+ · {t("ux.memberCard.title")}</p>
            <p className="text-xl font-extrabold uppercase" style={{ color: theme.accent }}>
              {result?.plan_name}
            </p>
          </div>
        )}
        <CardContent className="pt-6 pb-8 text-center space-y-4">
          <h1 className="text-sm font-medium text-muted-foreground">{t("ux.memberCard.verifyTitle")}</h1>
          {!loaded ? (
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          ) : !known ? (
            <>
              <HelpCircle className="h-14 w-14 mx-auto text-muted-foreground" />
              <p className="text-xl font-bold">{t("ux.memberCard.unknown")}</p>
              <p className="text-sm text-muted-foreground">{t("ux.memberCard.unknownDesc")}</p>
            </>
          ) : (
            <>
              {result!.is_valid ? (
                <CheckCircle2 className="h-14 w-14 mx-auto text-success" />
              ) : (
                <XCircle className="h-14 w-14 mx-auto text-destructive" />
              )}
              <p
                className={result!.is_valid ? "text-2xl font-bold text-success" : "text-2xl font-bold text-destructive"}
              >
                {result!.is_valid ? t("ux.memberCard.valid") : t("ux.memberCard.invalid")}
              </p>
              <dl className="mx-auto max-w-xs space-y-2 text-sm text-left">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("ux.memberCard.holder")}</dt>
                  <dd className="font-semibold">{result!.holder_name || "-"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("ux.memberCard.plan")}</dt>
                  <dd className="font-semibold">{result!.plan_name}</dd>
                </div>
                {result!.valid_until && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {result!.is_valid ? t("ux.memberCard.validUntil") : t("ux.memberCard.endedOn")}
                    </dt>
                    <dd className="font-semibold">{formatDate(result!.valid_until)}</dd>
                  </div>
                )}
              </dl>
            </>
          )}
          <Link to="/" className="inline-block pt-2 text-sm text-primary hover:underline">
            Bossiz+
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyMember;
