import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { getIOSInstallSituation, isIOSDevice, type IOSInstallSituation } from "@/lib/iosInstall";

/**
 * Étapes d'installation sur iPhone / iPad, adaptées au navigateur du visiteur
 * (src/lib/iosInstall.ts). Hors iOS, affiche les étapes Safari habituelles.
 */
const IOSInstallSteps = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const [situation, setSituation] = useState<IOSInstallSituation | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isIOSDevice()) setSituation(getIOSInstallSituation());
  }, []);

  const stepsBySituation: Record<IOSInstallSituation | "default", string[]> = {
    default: [t("ux.app.iosStep1"), t("ux.app.iosStep2"), t("ux.app.iosStep3")],
    safari: [t("ux.app.iosStep2"), t("ux.app.iosStep3")],
    "other-browser": [t("ux.app.iosOtherStep1"), t("ux.app.iosStep3")],
    "old-other-browser": [t("ux.app.iosStep1"), t("ux.app.iosStep2"), t("ux.app.iosStep3")],
    "in-app": [t("ux.app.iosInAppStep1"), t("ux.app.iosStep2"), t("ux.app.iosStep3")],
  };
  const note =
    situation === "in-app"
      ? t("ux.app.iosInAppNote")
      : situation === "old-other-browser"
        ? t("ux.app.iosOldNote")
        : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={className}>
      {note && <p className="mb-2 text-sm font-medium text-foreground">{note}</p>}
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        {stepsBySituation[situation ?? "default"].map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      {note && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>
            <Copy />
            {t("ux.app.copyLink")}
          </Button>
          {copied && (
            <span role="status" className="text-sm text-success">
              {t("ux.app.linkCopied")}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default IOSInstallSteps;
