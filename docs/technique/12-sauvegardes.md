# Sauvegardes de la base de données

## Ce qui est sauvegardé

Chaque nuit à 03:30 UTC, le workflow GitHub Actions [db-backup.yml](../../.github/workflows/db-backup.yml) exporte la base Supabase de production :

- `roles.sql` : les rôles Postgres ;
- `schema.sql` : les tables, fonctions, policies RLS et triggers ;
- `data.sql` : toutes les données (réservations, paiements, comptes, Smiles, partenaires…).

L'archive est chiffrée en AES-256 avec la phrase `BACKUP_PASSPHRASE`, puis conservée **14 jours** dans les artefacts du workflow (onglet Actions du dépôt GitHub). On peut aussi lancer une sauvegarde à la main : Actions > « Sauvegarde base de données » > *Run workflow*.

**Ce qui n'est pas inclus** : les fichiers du Storage Supabase (photos, logos, documents envoyés). Ils restent chez Supabase. Les comptes utilisateurs (`auth.users`) sont inclus dans `data.sql`.

Le plan gratuit de Supabase ne fait **aucune** sauvegarde. Le plan Pro fait une sauvegarde quotidienne (7 jours). Ce workflow est donc la seule copie hors de Supabase.

## Mise en place (une seule fois)

1. Dashboard Supabase > **Connect** > onglet *Session pooler* : copier l'URL (port 5432, utilisateur `postgres.gpwlzhegvjsbgbaepfjz`) et y mettre le mot de passe de la base.
   La connexion directe `db.gpwlzhegvjsbgbaepfjz.supabase.co` n'est joignable qu'en IPv6, ce que GitHub Actions ne gère pas.
2. GitHub > dépôt > Settings > Secrets and variables > Actions > *New repository secret* :
   - `SUPABASE_DB_URL` = l'URL de l'étape 1 ;
   - `BACKUP_PASSPHRASE` = une phrase longue (au moins 30 caractères).
3. **Noter la phrase de passe hors de GitHub**, par exemple dans un gestionnaire de mots de passe. Sans elle, les sauvegardes sont illisibles.
4. Le workflow doit être sur la branche `main` (branche par défaut) pour tourner chaque nuit.
5. Lancer une première fois à la main (*Run workflow*) et vérifier qu'il est vert.

## Restaurer

À faire sur un PC avec `gpg`, `tar` et `psql` (Git Bash suffit pour gpg et tar).

```bash
# 1. Télécharger l'artefact depuis GitHub Actions, le dézipper, puis :
sha256sum -c bossiz-db-AAAA-MM-JJ_HHMM.sha256
gpg --decrypt -o bossiz-db.tar.gz bossiz-db-AAAA-MM-JJ_HHMM.tar.gz.gpg   # demande la phrase de passe
mkdir restore && tar -xzf bossiz-db.tar.gz -C restore

# 2. Restaurer dans un NOUVEAU projet Supabase (jamais directement sur la prod) :
psql "$NOUVELLE_DB_URL" -v ON_ERROR_STOP=0 -f restore/roles.sql
psql "$NOUVELLE_DB_URL" -v ON_ERROR_STOP=1 -f restore/schema.sql
psql "$NOUVELLE_DB_URL" -v ON_ERROR_STOP=1 -c "SET session_replication_role = replica" -f restore/data.sql
```

`session_replication_role = replica` désactive les triggers pendant le chargement, pour éviter de renvoyer des e-mails ou de recalculer des soldes.

Ensuite, on bascule le site vers le nouveau projet (variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`, puis redéploiement). On redéploie aussi les Edge Functions et leurs secrets, et on recrée les secrets Vault (`project_url`, `anon_key`, `cron_secret`).

## Tester la restauration

Une fois par trimestre, restaurer la dernière sauvegarde dans un projet Supabase de test (gratuit), puis vérifier :

- le nombre de réservations : `select count(*) from bookings` ;
- les derniers paiements ;
- qu'on peut se connecter avec un compte de test.

Noter la date du test ici :

| Date | Sauvegarde utilisée | Résultat | Par |
|---|---|---|---|
|  |  |  |  |
