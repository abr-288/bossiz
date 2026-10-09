/**
 * À importer en tout premier dans main.tsx.
 *
 * Quand le navigateur bloque le stockage (Chrome/Edge « Bloquer tous les
 * cookies », certains navigateurs intégrés aux applications), la simple lecture
 * de `localStorage` lève une exception. Langue, thème, consentement cookies et
 * session la lisent au démarrage : la page restait blanche. On remplace alors
 * le stockage bloqué par un stockage en mémoire, valable le temps de l'onglet.
 */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => (data.has(key) ? data.get(key)! : null),
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => {
      data.delete(key);
    },
    setItem: (key: string, value: string) => {
      data.set(key, String(value));
    },
  };
}

for (const name of ["localStorage", "sessionStorage"] as const) {
  let ok = false;
  try {
    const storage = window[name];
    const probe = "__bossiz_probe__";
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    ok = true;
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      Object.defineProperty(window, name, { value: memoryStorage(), configurable: true });
    } catch {
      /* navigateur qui refuse la redéfinition : safeStorage protège au moins la session */
    }
  }
}

export {};
