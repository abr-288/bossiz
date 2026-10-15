// Délai maximal d'attente d'une requête réseau (auth, profil...) avant
// d'afficher un message « connexion lente » avec un bouton Réessayer, au lieu
// d'un indicateur de chargement qui tournerait indéfiniment. 15 s laisse le
// temps à une connexion mobile lente (quelques Ko/s) de répondre.
export const NETWORK_TIMEOUT_MS = 15000;

export class TimeoutError extends Error {
  constructor(message = "Délai d'attente dépassé") {
    super(message);
    this.name = "TimeoutError";
  }
}

// Rejette avec TimeoutError si la promesse ne s'est pas résolue à temps.
// Accepte tout « thenable » (les requêtes Supabase en sont).
export function withTimeout<T>(promise: PromiseLike<T>, ms: number = NETWORK_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
