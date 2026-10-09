import { useEffect, useState } from "react";
import { Apple, ChevronDown, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type OS = "ios" | "android" | "desktop";

const APP_STORE_URL = "https://apps.apple.com/app/bossiz-plus/id123456789";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.bossizplus.app";

const detectOS = (): OS => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
};

/**
 * Bandeau compact « Téléchargez Bossiz+ » : un titre, les boutons des stores
 * (seulement celui du téléphone sur mobile) et les étapes d'installation
 * repliées. Remplace l'ancienne section pleine page (cartes, statistiques
 * locales, alertes).
 */
const iOSDownloadSection = () => {
  const { t } = useTranslation();
  const [os, setOS] = useState<OS>("desktop");

  useEffect(() => {
    setOS(detectOS());
  }, []);

  const showIOS = os !== "android";
  const showAndroid = os !== "ios";
  const steps = (key: string) => t(key, { returnObjects: true }) as string[];

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
                  {t("iosDownload.title")} {t("iosDownload.titleHighlight").toLowerCase()}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("iosDownload.subtitle")}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
              {showIOS && (
                <Button asChild variant={os === "ios" ? "default" : "outline"}>
                  <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                    <Apple />
                    App Store
                  </a>
                </Button>
              )}
              {showAndroid && (
                <Button asChild variant={os === "android" ? "default" : "outline"}>
                  <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                    <Smartphone />
                    Google Play
                  </a>
                </Button>
              )}
            </div>
          </div>

          <details className="group mt-4 border-t border-border pt-3">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
              {t("iosDownload.instructions.title")}
              <ChevronDown className="h-4 w-4 transition-transform duration-base ease-standard group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className={os === "desktop" ? "mt-3 grid gap-4 md:grid-cols-2" : "mt-3"}>
              {showIOS && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Apple className="h-4 w-4" aria-hidden="true" />
                    {t("iosDownload.instructions.iosTitle")}
                  </p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                    {steps("iosDownload.instructions.iosSteps").map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              {showAndroid && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Smartphone className="h-4 w-4" aria-hidden="true" />
                    Android
                  </p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                    {steps("iosDownload.instructions.androidSteps").map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
};

export default iOSDownloadSection;
