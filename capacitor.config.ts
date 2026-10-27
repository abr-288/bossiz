import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bossizplus.app',
  appName: 'Bossiz+',
  // Copie du site préparée par scripts/mobile/package-app-update.mjs (npm run build).
  webDir: 'dist-app',
  plugins: {
    // Mises à jour gérées par src/lib/appUpdates.ts depuis app.bossiz.com
    // (aucun service Capgo) : on coupe le mode automatique du plugin.
    CapacitorUpdater: {
      autoUpdate: false,
    },
  },
};

export default config;
