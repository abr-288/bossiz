import { useEffect, useState } from "react";
import { ChevronDown, Download, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

type OS = "ios" | "android" | "desktop";

const detectOS = (): OS => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
};

/**
 * Bandeau compact « Installez Bossiz+ ». L'application n'est pas sur les
 * stores : elle s'installe depuis le navigateur (PWA). Sur Chrome / Edge /
 * Android, le bouton ouvre directement la fenêtre d'installation ; ailleurs
 * (Safari iPhone notamment), il déplie les étapes à suivre.
 */
const iOSDownloadSection = () => {
  const { t } = useTranslation();
  const { isInstallable, install } = usePWA();
  const [os, setOS] = useState<OS>("desktop");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOS(detectOS());
  }, []);

  const handleInstall = async () => {
    if (isInstallable && (await install())) return;
    setOpen(true);
  };

  const groups: { key: OS; title: string; steps: string[] }[] = [
    { key: "ios", title: t("ux.app.iosTitle"), steps: [t("ux.app.iosStep1"), t("ux.app.iosStep2"), t("ux.app.iosStep3")] },
    { key: "android", title: t("ux.app.androidTitle"), steps: [t("ux.app.androidStep1"), t("ux.app.androidStep2"), t("ux.app.androidStep3")] },
    { key: "desktop", title: t("ux.app.desktopTitle"), steps: [t("ux.app.desktopStep1"), t("ux.app.desktopStep2")] },
  ];
  // Sur téléphone : seulement les étapes de l'appareil
  const visible = os === "desktop" ? groups : groups.filter((g) => g.key === os);

  return (
    <section aria-labelledby="app-title" className="w-full py-10 md:py-14">
      <div className="site-container">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Smartphone className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 id="app-title" className="text-xl font-bold text-foreground md:text-2xl">
                  {t("ux.app.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("ux.app.subtitle")}</p>
              </div>
            </div>
            <Button className="md:shrink-0" onClick={handleInstall}>
              <Download />
              {t("ux.app.install")}
            </Button>
          </div>

          <details
            className="group mt-4 border-t border-border pt-3"
            open={open}
            onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
          >
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
              {t("ux.app.howTo")}
              <ChevronDown className="h-4 w-4 transition-transform duration-base ease-standard group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className={visible.length > 1 ? "mt-3 grid gap-4 md:grid-cols-3" : "mt-3"}>
              {visible.map((group) => (
                <div key={group.key}>
                  <p className="mb-1.5 text-sm font-semibold text-foreground">{group.title}</p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                    {group.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
};

export default iOSDownloadSection;
