# Sauvegardes de la base de données

## Sauvegarde automatique (principale)

Chaque nuit à 03:30 UTC (heure d'Abidjan), pg_cron appelle la fonction [backup-database](../../supabase/functions/backup-database/index.ts). Elle exporte dans un seul fichier compressé :

- toutes les tables du schéma `public` : réservations, paiements, partenaires, Smiles, Impact… ;
- les comptes (`auth.users`, `auth.identities`), avec les mots de passe chiffrés d'origine.

Le fichier `bossiz-AAAA-MM-JJ.jsonl.gz` va dans le stockage **privé** `db-backups`. Les 14 derniers jours sont gardés.

Aucun mot de passe de base ni réglage GitHub n'est nécessaire : la fonction lit la base avec la clé service-role. La mise en place se fait par la migration [20261104000000_database_backups.sql](../../supabase/migrations/20261104000000_database_backups.sql).

**Où les trouver** : Admin > Surveillance > « Sauvegardes de la base ». On y trouve la liste, le bouton *Télécharger* et le bouton *Sauvegarder maintenant*.

**Contrôle** : la fonction health-check vérifie toutes les 5 minutes que la dernière sauvegarde a moins de 30 h. Sinon, un e-mail d'alerte part.

**Non inclus** : les fichiers du Storage (photos, logos, documents envoyés).

**Bonne pratique** : une fois par mois, télécharger la dernière sauvegarde et la garder hors de Supabase (clé USB, Google Drive). Si le projet Supabase disparaît, les sauvegardes du stockage disparaissent avec lui.

## Vérifier ou restaurer une sauvegarde

```bash
# Voir le contenu (nombre de lignes par table, erreurs d'export) :
node scripts/backup/restore.mjs bossiz-2026-11-08.jsonl.gz

# Restaurer dans un NOUVEAU projet Supabase (le script refuse la prod) :
#  1. créer le projet, y appliquer toutes les migrations de supabase/migrations ;
#  2. puis :
TARGET_URL=https://nouveau-projet.supabase.co TARGET_SERVICE_ROLE_KEY=... \
  node scripts/backup/restore.mjs bossiz-2026-11-08.jsonl.gz --restore
```

Le script recrée les comptes avec le même identifiant et le même mot de passe, puis insère les tables. Il fait plusieurs passes, jusqu'à ce que les clés étrangères soient satisfaites.

Ensuite, on bascule le site sur le nouveau projet :

- variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`, puis redéploiement du site ;
- Edge Functions et leurs secrets ;
- secrets Vault `project_url`, `anon_key` et `cron_secret`.

## Copie GitHub (facultative)

Le workflow [db-backup.yml](../../.github/workflows/db-backup.yml) peut en plus faire une copie complète au format SQL, chiffrée et hors de Supabase. Il faut pour cela le mot de passe de la base et deux secrets GitHub, `SUPABASE_DB_URL` (Session pooler) et `BACKUP_PASSPHRASE`. Sans ces secrets, le workflow s'arrête sans erreur.

## Tests de restauration

| Date | Sauvegarde utilisée | Résultat | Par |
|---|---|---|---|
|  |  |  |  |
