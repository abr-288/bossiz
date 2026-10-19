-- Sécurité : le trigger handle_new_user_role accordait automatiquement le
-- rôle 'admin' à tout compte s'inscrivant avec l'email exact
-- 'admin@bossiz.com' (voir 20260805010000_fix_default_role_trigger.sql).
-- Si ce compte est un jour libéré (suppression via delete-account, qui
-- anonymise l'email vers *.deleted.invalid, redéploiement, environnement de
-- test), quiconque s'inscrit avec cet email obtient le rôle admin sans
-- aucune validation humaine. Ce cas spécial est supprimé : la promotion
-- admin doit toujours se faire manuellement (INSERT direct dans
-- user_roles, ou via /admin/users par un admin déjà en place).

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;
