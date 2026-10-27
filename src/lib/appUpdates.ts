// Mise à jour en direct de l'application mobile (Android / iOS).
// L'app embarque une copie du site. À chaque déploiement, redeploy.sh publie
// la nouvelle copie sur app.bossiz.com/app-updates/ (scripts/mobile/
// package-app-update.mjs). L'app la télécharge en arrière-plan et l'installe
// la prochaine fois qu'elle passe en arrière-plan ou redémarre : rien
// n'interrompt l'utilisateur, et pas besoin de repasser par les stores.
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";

const MANIFEST_URL = "https://app.bossiz.com/app-updates/latest.json";

interface UpdateManifest {
  version: string;
  url: string;
  checksum: string;
}

// Versions « 1.AAAAMMJJ.HHMMSS » (vite.config.ts) : comparaison numérique.
export const isNewerVersion = (candidate: string, current: string) => {
  const a = candidate.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
};

const runningVersion = () => document.querySelector<HTMLMetaElement>('meta[name="app-version"]')?.content ?? "0";

let checking = false;

const checkForUpdate = async () => {
  if (checking) return;
  checking = true;
  try {
    // Requête native : pas de CORS depuis l'app (origine https://localhost).
    const res = await CapacitorHttp.get({ url: MANIFEST_URL, headers: { "Cache-Control": "no-cache" } });
    if (res.status !== 200) return;
    const manifest = (typeof res.data === "string" ? JSON.parse(res.data) : res.data) as UpdateManifest;
    if (!manifest?.version || !isNewerVersion(manifest.version, runningVersion())) return;

    const { bundles } = await CapacitorUpdater.list();
    const known = bundles.find((b) => b.version === manifest.version);
    // Version déjà essayée et revenue en arrière (plantage au démarrage) : on attend la suivante.
    if (known?.status === "error") return;
    const bundle =
      known ??
      (await CapacitorUpdater.download({ url: manifest.url, version: manifest.version, checksum: manifest.checksum }));
    await CapacitorUpdater.next({ id: bundle.id });
  } catch {
    // Hors ligne ou serveur indisponible : nouvel essai au prochain retour dans l'app.
  } finally {
    checking = false;
  }
};

export const startAppUpdates = () => {
  if (!Capacitor.isNativePlatform()) return;
  // Confirme que cette version démarre bien ; sans cet appel, le plugin
  // reviendrait à la version précédente au prochain lancement.
  void CapacitorUpdater.notifyAppReady();
  void checkForUpdate();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void checkForUpdate();
  });
};
