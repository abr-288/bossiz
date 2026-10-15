# Assistante en ligne (chat du site)

Documents de ce dossier :
- [audit-chat.md](audit-chat.md) : audit du 15 octobre 2026 et état des corrections.
- [scenarios.json](scenarios.json) : les 20 scénarios de test.
- [tests-avant.md](tests-avant.md) et [tests-apres.md](tests-apres.md) : réponses de l'assistante avant et après les corrections.

## Modifier ce que dit l'assistante

Le comportement et les connaissances de l'assistante sont dans un seul fichier, sans code :
[supabase/functions/travel-chatbot/prompt-systeme.md](../../supabase/functions/travel-chatbot/prompt-systeme.md).

1. Modifier le fichier (ton, règles, parcours de réservation, politiques…).
2. Le publier :
   ```
   npx supabase functions deploy travel-chatbot --project-ref gpwlzhegvjsbgbaepfjz
   ```
3. Vérifier avec les scénarios de test (voir plus bas).

**À ne pas modifier dans ce fichier :**
- le marqueur `[[CONSEILLER]]`, qui fait apparaître le bouton « Transmettre à un conseiller » ;
- la liste des pages (`/flights`, `/devenir-partenaire`…). Une page n'y figure qu'avec un bouton défini dans [ChatWidget.tsx](../../src/components/ChatWidget.tsx) (`CHAT_PAGES`) et un nom dans les fichiers de traduction (`ux.chat.pages`).

**Ce qui se met à jour tout seul**, sans toucher au fichier ni redéployer, car relu en base toutes les 10 minutes :
- services, formules et coordonnées de la Conciergerie (Admin › Microsites Bossiz) ;
- téléphone et WhatsApp du support (Admin › Configuration › Contact). Un numéro de démonstration (« +225 00 00 00 00 ») n'est jamais donné ni affiché.

## Comment ça marche

| Élément | Fichier |
|---|---|
| Bulle de discussion, boutons rapides, formulaire de transmission | [src/components/ChatWidget.tsx](../../src/components/ChatWidget.tsx) |
| Appel au serveur | [src/hooks/useTravelChatbot.ts](../../src/hooks/useTravelChatbot.ts) |
| Réponse de l'assistante (API Claude) | [supabase/functions/travel-chatbot/index.ts](../../supabase/functions/travel-chatbot/index.ts) |
| Données vivantes : conciergerie, contacts, client connecté et ses 5 dernières réservations | [supabase/functions/travel-chatbot/context.ts](../../supabase/functions/travel-chatbot/context.ts) |
| Transmission à un conseiller : email au support avec résumé | [supabase/functions/chat-handoff/index.ts](../../supabase/functions/chat-handoff/index.ts) |
| Masquage des numéros de carte | [src/lib/sensitiveText.ts](../../src/lib/sensitiveText.ts), [supabase/functions/_shared/sensitive.ts](../../supabase/functions/_shared/sensitive.ts) |

Points de sécurité :
- la clé de l'API IA reste côté serveur (secret Supabase `ANTHROPIC_API_KEY`) ;
- les réservations sont lues avec le jeton du client connecté : la base ne renvoie que les siennes ;
- l'assistante ne peut rien modifier ;
- les numéros de carte sont masqués avant d'être gardés ou envoyés ;
- la conversation est effacée du navigateur à la déconnexion ;
- limites : 60 messages par heure et par IP pour le chat, 5 transmissions par heure et par IP ; délai maximal de 25 secondes par réponse.

Les transmissions partent vers l'adresse du secret `SUPPORT_INBOX_EMAIL` (par défaut `support@bossiz.com`), avec l'email du client en adresse de réponse.

## Rejouer les tests

```
node scripts/assistant-scenarios.mjs docs/assistant/tests-apres.md "Tests de l'assistante — APRÈS corrections"
```

Le script interroge l'assistante en ligne comme un visiteur non connecté, environ 1 centime de dollar par scénario. Il ne teste donc pas la consultation des réservations : celle-ci se vérifie à la main, avec un compte client connecté.
