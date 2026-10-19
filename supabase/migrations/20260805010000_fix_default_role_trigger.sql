-- Bug : le trigger on_auth_user_created_role insère inconditionnellement un
-- rôle 'user' pour CHAQUE inscription (sauf l'email exact 'admin@bossiz.com').
-- Résultat : tout compte promu admin/sub_agency après coup (via AdminUsers,
-- un script de seed, etc.) se retrouve avec DEUX lignes dans user_roles
-- ('user' + le rôle réel). Le front (useUserRole) utilisait `.maybeSingle()`
-- qui plante sur plusieurs lignes et retombe silencieusement sur 'user' —
-- ce qui rendait le dashboard admin invisible pour ces comptes.
--
-- Fix applicatif déjà en place (useUserRole.ts choisit le rôle le plus
-- privilégié parmi toutes les lignes). Cette migration corrige la cause
-- racine côté base : n'assigner 'user' par défaut que si l'utilisateur n'a
-- encore AUCUN rôle.
--
-- N'a pas pu être appliquée automatiquement au moment de sa rédaction (le
-- CLI Supabase échoue sur ce projet avec une erreur de permission côté
-- plateforme lors de toute connexion Postgres directe — voir
-- 20260805000000_drop_majestic_club.sql pour le même blocage). À exécuter
-- manuellement dans le SQL Editor du dashboard Supabase.

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'admin@bossiz.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

-- Nettoyage des doublons existants : pour tout utilisateur ayant plusieurs
-- rôles, ne garder que le plus privilégié (admin > sub_agency > user).
DELETE FROM public.user_roles ur
WHERE EXISTS (
  SELECT 1 FROM public.user_roles higher
  WHERE higher.user_id = ur.user_id
    AND higher.id <> ur.id
    AND (
      CASE higher.role WHEN 'admin' THEN 3 WHEN 'sub_agency' THEN 2 ELSE 1 END
      >
      CASE ur.role WHEN 'admin' THEN 3 WHEN 'sub_agency' THEN 2 ELSE 1 END
    )
);
