import { WifiOff, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

// Affiché quand le chargement d'une page a dépassé le délai d'attente ou a
// échoué faute de réseau : explique la situation et propose de réessayer.
export function LoadErrorRetry({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
      <WifiOff className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-lg font-semibold">{t("ux.common.loadFailedTitle")}</p>
        <p className="text-sm text-muted-foreground max-w-sm">{t("ux.common.loadFailedDesc")}</p>
      </div>
      <Button onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        {t("ux.common.retry")}
      </Button>
    </div>
  );
}
