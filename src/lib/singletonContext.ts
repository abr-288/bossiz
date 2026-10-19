import { createContext, type Context } from "react";

/**
 * Crée un contexte React unique pour toute la page.
 *
 * Si le module d'un contexte est exécuté deux fois (rechargement à chaud en
 * développement, ou onglet resté ouvert pendant une mise à jour qui mélange
 * des fichiers de deux versions), React voit deux contextes différents : le
 * fournisseur et ses lecteurs ne se trouvent plus, d'où l'erreur
 * « must be used within …Provider » et une page blanche. On garde donc
 * l'objet contexte sur `globalThis`.
 */
export function singletonContext<T>(name: string, defaultValue: T): Context<T> {
  const store = globalThis as unknown as Record<string, Context<T> | undefined>;
  const key = `__bossiz_context_${name}`;
  if (!store[key]) store[key] = createContext<T>(defaultValue);
  return store[key]!;
}
