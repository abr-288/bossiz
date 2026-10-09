/**
 * Stockage de session qui ne fait jamais planter l'application.
 *
 * Certains navigateurs refusent l'accès à localStorage : Chrome ou Edge avec
 * « Bloquer tous les cookies », navigation privée de vieux Safari, navigateurs
 * intégrés de certaines applications (Facebook, Instagram, messageries).
 * Le simple fait de lire `window.localStorage` y lève une exception, ce qui
 * empêchait toute connexion et toute réinitialisation de mot de passe.
 *
 * Ordre de repli : localStorage, puis sessionStorage, puis mémoire (la session
 * dure alors le temps de l'onglet, ce qui suffit pour changer son mot de passe).
 */
type SimpleStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const memory = new Map<string, string>();
const memoryStorage: SimpleStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key)! : null),
  setItem: (key, value) => {
    memory.set(key, value);
  },
  removeItem: (key) => {
    memory.delete(key);
  },
};

function usable(get: () => Storage): Storage | null {
  try {
    const storage = get();
    const probe = "__bossiz_probe__";
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

const backing: SimpleStorage =
  usable(() => window.localStorage) ?? usable(() => window.sessionStorage) ?? memoryStorage;

// Chaque appel est protégé : un quota plein ou un blocage tardif ne doit pas
// interrompre la connexion.
export const safeStorage: SimpleStorage = {
  getItem: (key) => {
    try {
      return backing.getItem(key);
    } catch {
      return memoryStorage.getItem(key);
    }
  },
  setItem: (key, value) => {
    try {
      backing.setItem(key, value);
    } catch {
      memoryStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    try {
      backing.removeItem(key);
    } catch {
      /* rien à faire */
    }
    memoryStorage.removeItem(key);
  },
};
