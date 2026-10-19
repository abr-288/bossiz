-- Étend email_templates pour couvrir tous les emails transactionnels réels du
-- système (jusqu'ici la table n'était branchée sur aucune fonction d'envoi :
-- modifier un modèle depuis /admin/email-templates ne changeait rien).
--
-- 1. Remplace le CHECK sur `type` (limité à 5 valeurs historiques) par la
--    liste complète des clés utilisées par les Edge Functions.
-- 2. Seed les 19 modèles par défaut avec le design Bossiz+ (marine pour le
--    client, ardoise pour l'interne), en français, avec des placeholders
--    {{variable}} substitués par supabase/functions/_shared/emailTemplates.ts.
--    ON CONFLICT (name) DO NOTHING : si une ligne du même nom existe déjà
--    (admin ayant déjà personnalisé), on ne l'écrase pas.

ALTER TABLE public.email_templates DROP CONSTRAINT IF EXISTS email_templates_type_check;

ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_type_check CHECK (type IN (
  'password_reset',
  'partner_account_ready',
  'partner_application_received',
  'partner_application_admin_alert',
  'partner_approved',
  'partner_application_rejected',
  'partner_suspended',
  'partner_reactivated',
  'otp_login',
  'newsletter_welcome',
  'booking_confirmation',
  'flight_confirmation',
  'flight_ticket',
  'pnr_confirmation',
  'booking_pdf',
  'invoice',
  'subscription_confirmation',
  'contact_message_internal',
  'support_request_internal',
  -- valeurs historiques, conservées pour ne pas casser d'éventuelles lignes existantes
  'flight_confirmation', 'support', 'newsletter', 'invoice', 'support_confirmation'
));

INSERT INTO public.email_templates (name, type, subject, html_content, variables) VALUES

(
  'Réinitialisation mot de passe',
  'password_reset',
  $subj$Réinitialisation de votre mot de passe - Bossiz+$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Réinitialisation du mot de passe</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour,</p>
      <p>Vous avez demandé à réinitialiser le mot de passe de votre compte Bossiz+. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :</p>
      <p style="text-align:center; margin: 28px 0;">
        <a href="{{resetLink}}" style="background:#0b3d5c; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Choisir un nouveau mot de passe</a>
      </p>
      <p style="font-size: 13px; color:#666;">Ce lien est à usage unique et expire rapidement. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail : votre mot de passe actuel reste valable.</p>
      <p style="margin-top: 24px;">L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["resetLink", "year"]'::jsonb
),

(
  'Compte partenaire prêt',
  'partner_account_ready',
  $subj$Votre compte partenaire Bossiz+ est prêt$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Bienvenue chez Bossiz+</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour{{ownerGreeting}},</p>
      <p>Suite à votre candidature partenaire, nous avons créé votre compte Bossiz+ avec cette adresse email.</p>
      <p>Cliquez sur le bouton ci-dessous pour choisir votre mot de passe et accéder à votre espace :</p>
      <p style="text-align:center; margin: 28px 0;">
        <a href="{{setupLink}}" style="background:#0b3d5c; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Choisir mon mot de passe</a>
      </p>
      <p style="font-size: 13px; color:#666;">Ce lien est à usage unique et expire au bout d'un certain temps. S'il a expiré, utilisez « Mot de passe oublié » sur app.bossiz.com/auth. Si vous n'êtes pas à l'origine de cette candidature, ignorez cet email.</p>
      <p style="margin-top: 24px;">L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["ownerGreeting", "setupLink", "year"]'::jsonb
),

(
  'Candidature reçue (candidat)',
  'partner_application_received',
  $subj$Candidature partenaire reçue - Bossiz+$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Candidature bien reçue</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour,</p>
      <p>Nous avons bien reçu la candidature partenaire de <strong>{{applicationName}}</strong> sur Bossiz+.</p>
      <p>Notre équipe étudie chaque dossier manuellement. Vous serez recontacté par email à cette même adresse une fois l'étude terminée, avec la décision et les prochaines étapes si votre candidature est retenue.</p>
      <p style="margin-top: 24px;">Merci pour votre intérêt,<br/>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["applicationName", "year"]'::jsonb
),

(
  'Nouvelle candidature (interne)',
  'partner_application_admin_alert',
  $subj$Nouvelle candidature partenaire : {{applicationName}}$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #334155; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <p style="margin:0 0 6px; font-size: 11px; letter-spacing:.06em; text-transform:uppercase; opacity:.75;">Usage interne</p>
      <h1 style="margin:0; font-size: 18px;">Nouvelle candidature partenaire</h1>
    </div>
    <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p><strong>Nom :</strong> {{applicationName}}</p>
      <p><strong>Email :</strong> {{contactEmail}}</p>
      {{carPlanBlockHtml}}
      {{descriptionBlockHtml}}
      <p><strong>Reçue le :</strong> {{receivedAt}}</p>
      <p style="margin-top: 20px;">
        <a href="{{reviewLink}}" style="background:#334155;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">Étudier la candidature</a>
      </p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["applicationName", "contactEmail", "carPlanBlockHtml", "descriptionBlockHtml", "receivedAt", "reviewLink", "year"]'::jsonb
),

(
  'Candidature approuvée',
  'partner_approved',
  $subj$Votre candidature est approuvée - Bienvenue chez Bossiz+$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Félicitations, vous êtes partenaire !</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour{{ownerGreeting}},</p>
      <p>Votre candidature partenaire a été étudiée et approuvée : <strong>{{agencyName}}</strong> est maintenant un partenaire actif de Bossiz+.</p>
      <p>Vous pouvez dès à présent accéder à votre espace agence pour gérer vos offres, tarifs et réservations.</p>
      <p style="text-align:center; margin: 28px 0;">
        <a href="{{loginLink}}" style="background:#0b3d5c; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Accéder à mon espace agence</a>
      </p>
      <p style="margin-top: 24px;">Bienvenue,<br/>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["ownerGreeting", "agencyName", "loginLink", "year"]'::jsonb
),

(
  'Candidature rejetée',
  'partner_application_rejected',
  $subj$Réponse à votre candidature partenaire - Bossiz+$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Réponse à votre candidature</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour,</p>
      <p>Nous avons étudié avec attention la candidature partenaire de <strong>{{applicationName}}</strong> sur Bossiz+.</p>
      <p>Après examen, nous ne sommes malheureusement pas en mesure d'y donner suite pour le moment.</p>
      <p>Vous pouvez soumettre une nouvelle candidature à tout moment si votre situation évolue.</p>
      <p style="margin-top: 24px;">Merci pour votre intérêt,<br/>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["applicationName", "year"]'::jsonb
),

(
  'Partenaire suspendu',
  'partner_suspended',
  $subj$Votre espace partenaire Bossiz+ a été suspendu$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #7f1d1d; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Votre espace partenaire est suspendu</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour{{ownerGreeting}},</p>
      <p>L'espace partenaire de <strong>{{agencyName}}</strong> a été suspendu par notre équipe. Vos offres ne sont plus visibles et vous ne pouvez plus recevoir de nouvelles réservations tant que la suspension est active.</p>
      <p>Si vous pensez qu'il s'agit d'une erreur, contactez-nous à <a href="mailto:contact@bossiz.com">contact@bossiz.com</a>.</p>
      <p style="margin-top: 24px;">L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["ownerGreeting", "agencyName", "year"]'::jsonb
),

(
  'Partenaire réactivé',
  'partner_reactivated',
  $subj$Votre espace partenaire Bossiz+ est réactivé$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Votre espace partenaire est réactivé</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour{{ownerGreeting}},</p>
      <p>Bonne nouvelle : l'espace partenaire de <strong>{{agencyName}}</strong> vient d'être réactivé. Vos offres sont de nouveau visibles et vous pouvez à nouveau recevoir des réservations.</p>
      <p style="text-align:center; margin: 28px 0;">
        <a href="{{loginLink}}" style="background:#0b3d5c; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Accéder à mon espace agence</a>
      </p>
      <p style="margin-top: 24px;">L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["ownerGreeting", "agencyName", "loginLink", "year"]'::jsonb
),

(
  'Code de connexion',
  'otp_login',
  $subj$Votre code de connexion Bossiz+$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 480px; margin: 0 auto; padding: 20px; text-align: center;">
    <div style="background: #0b3d5c; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 18px;">Votre code de connexion</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Utilisez ce code pour vous connecter à votre compte Bossiz+ :</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; background: #fff; border:1px solid #e5e7eb; padding: 20px; border-radius: 10px; margin: 20px 0; color:#0b3d5c;">{{code}}</div>
      <p>Ce code expire dans 10 minutes. Ne le partagez avec personne.</p>
      <p style="color:#666; font-size: 12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      <p style="margin-top: 16px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["code", "year"]'::jsonb
),

(
  'Bienvenue newsletter',
  'newsletter_welcome',
  $subj$Bienvenue à la newsletter Bossiz+$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Bienvenue chez Bossiz+ !</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Merci de vous être inscrit à notre newsletter.</p>
      <p>Vous recevrez nos meilleures offres de voyage, recommandations de destinations et promotions exclusives.</p>
      <p style="margin-top: 24px;">À bientôt,<br>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["year"]'::jsonb
),

(
  'Réservation confirmée',
  'booking_confirmation',
  $subj$Confirmation de réservation - {{bookingId}}$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Réservation confirmée</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour {{customerName}},</p>
      <p>Votre réservation a été confirmée. Voici le récapitulatif :</p>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:4px 0;"><strong>Référence :</strong> {{bookingId}}</p>
        <p style="margin:4px 0;"><strong>Service :</strong> {{serviceName}}</p>
        <p style="margin:4px 0;"><strong>Lieu :</strong> {{location}}</p>
        <p style="margin:4px 0;"><strong>Date de début :</strong> {{startDate}}</p>
        {{endDateBlockHtml}}
        <p style="margin:4px 0;"><strong>Voyageurs :</strong> {{guests}}</p>
        <p style="margin:4px 0;"><strong>Prix total :</strong> {{totalPrice}} {{currency}}</p>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:0 0 8px; font-weight:bold;">Passagers</p>
        <ul style="margin:0; padding-left:20px;">{{passengersHtml}}</ul>
      </div>
      <p>Conservez cet email pour vos dossiers. Vous pouvez aussi retrouver votre réservation depuis votre compte.</p>
      <p>Pour toute question, notre équipe support reste à votre disposition.</p>
      <p style="margin-top: 24px;">Cordialement,<br>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["customerName", "bookingId", "serviceName", "location", "startDate", "endDateBlockHtml", "guests", "totalPrice", "currency", "passengersHtml", "year"]'::jsonb
),

(
  'Vol confirmé',
  'flight_confirmation',
  $subj$Confirmation de vol - {{pnr}}$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">✈️ Vol confirmé</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour {{customerName}},</p>
      <p>Votre vol a été confirmé. Voici les détails :</p>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:4px 0;"><strong>PNR / Référence :</strong> {{pnr}}</p>
        <p style="margin:4px 0;"><strong>Trajet :</strong> {{route}}</p>
        <p style="margin:4px 0;"><strong>Date de départ :</strong> {{departureDate}}</p>
        {{returnDateBlockHtml}}
        <p style="margin:4px 0;"><strong>Prix total :</strong> {{totalPrice}} {{currency}}</p>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:0 0 8px; font-weight:bold;">Passagers</p>
        <ul style="margin:0; padding-left:20px;">{{passengersHtml}}</ul>
      </div>
      <p><strong>Informations importantes :</strong></p>
      <ul>
        <li>Présentez-vous à l'aéroport au moins 2 heures avant le départ</li>
        <li>Munissez-vous d'une pièce d'identité valide pour chaque passager</li>
        <li>Vérifiez la franchise bagages auprès de la compagnie</li>
      </ul>
      <p>Bon voyage !</p>
      <p style="margin-top: 24px;">Cordialement,<br>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["customerName", "pnr", "route", "departureDate", "returnDateBlockHtml", "totalPrice", "currency", "passengersHtml", "year"]'::jsonb
),

(
  'Billet d''avion',
  'flight_ticket',
  $subj$Votre billet d'avion - {{pnr}}$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">✈️ Votre billet d'avion</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour {{customerName}},</p>
      <p>Vous trouverez votre billet d'avion en pièce jointe. Pensez à le conserver et à l'apporter à l'aéroport.</p>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:4px 0;"><strong>PNR / Référence :</strong> {{pnr}}</p>
        <p style="margin:4px 0;"><strong>Trajet :</strong> {{route}}</p>
        <p style="margin:4px 0;"><strong>Prix total :</strong> {{totalPrice}} {{currency}}</p>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:0 0 8px; font-weight:bold;">Passagers</p>
        <ul style="margin:0; padding-left:20px;">{{passengersHtml}}</ul>
      </div>
      <p><strong>Informations importantes :</strong></p>
      <ul>
        <li>Imprimez votre billet ou gardez-le sur votre téléphone</li>
        <li>Présentez-vous à l'aéroport au moins 2 heures avant le départ</li>
        <li>Munissez-vous d'une pièce d'identité valide pour chaque passager</li>
        <li>Conservez votre PNR pour l'enregistrement</li>
      </ul>
      <p>Bon voyage !</p>
      <p style="margin-top: 24px;">Cordialement,<br>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["customerName", "pnr", "route", "totalPrice", "currency", "passengersHtml", "year"]'::jsonb
),

(
  'PNR confirmé',
  'pnr_confirmation',
  $subj$Confirmation PNR - {{pnr}}$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">✅ PNR confirmé</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour {{customerName}},</p>
      <p>Votre réservation a été confirmée par la compagnie aérienne. Votre PNR (Passenger Name Record) est :</p>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:20px; margin:16px 0; text-align:center;">
        <div style="font-size: 30px; font-weight: bold; color: #0b3d5c; letter-spacing:2px;">{{pnr}}</div>
        <p style="margin:8px 0 0; font-size:13px; color:#666;">Conservez ce PNR, il vous sera demandé pour toute démarche</p>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:4px 0;"><strong>Service :</strong> {{serviceName}}</p>
        <p style="margin:4px 0;"><strong>Trajet :</strong> {{route}}</p>
        <p style="margin:4px 0;"><strong>Date de départ :</strong> {{departureDate}}</p>
        {{returnDateBlockHtml}}
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:0 0 8px; font-weight:bold;">Passagers</p>
        <ul style="margin:0; padding-left:20px;">{{passengersHtml}}</ul>
      </div>
      <p><strong>Important :</strong></p>
      <ul>
        <li>Utilisez votre PNR pour l'enregistrement en ligne ou à l'aéroport</li>
        <li>Présentez-vous à l'aéroport au moins 2 heures avant le départ</li>
        <li>Munissez-vous d'une pièce d'identité valide pour chaque passager</li>
      </ul>
      <p>Bon voyage !</p>
      <p style="margin-top: 24px;">Cordialement,<br>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["customerName", "pnr", "serviceName", "route", "departureDate", "returnDateBlockHtml", "passengersHtml", "year"]'::jsonb
),

(
  'PDF de réservation',
  'booking_pdf',
  $subj$Votre PDF de réservation - {{bookingId}}$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">📄 Votre PDF de réservation</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour {{customerName}},</p>
      <p>Vous trouverez ci-joint votre confirmation de réservation au format PDF.</p>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:4px 0;"><strong>Référence :</strong> {{bookingId}}</p>
        <p style="margin:4px 0;"><strong>Service :</strong> {{serviceName}}</p>
        <p style="margin:4px 0;"><strong>Lieu :</strong> {{location}}</p>
        <p style="margin:4px 0;"><strong>Date de début :</strong> {{startDate}}</p>
        {{endDateBlockHtml}}
        <p style="margin:4px 0;"><strong>Prix total :</strong> {{totalPrice}} {{currency}}</p>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:0 0 8px; font-weight:bold;">Passagers</p>
        <ul style="margin:0; padding-left:20px;">{{passengersHtml}}</ul>
      </div>
      <p><strong>Important :</strong></p>
      <ul>
        <li>Conservez le PDF pour vos dossiers</li>
        <li>Apportez une copie imprimée ou numérique lors de votre déplacement</li>
        <li>Gardez votre référence de réservation à portée de main</li>
      </ul>
      <p style="margin-top: 24px;">Cordialement,<br>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["customerName", "bookingId", "serviceName", "location", "startDate", "endDateBlockHtml", "totalPrice", "currency", "passengersHtml", "year"]'::jsonb
),

(
  'Facture',
  'invoice',
  $subj$Facture {{invoiceNumber}}$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Facture</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:4px 0;"><strong>Numéro de facture :</strong> {{invoiceNumber}}</p>
        <p style="margin:4px 0;"><strong>Date :</strong> {{invoiceDate}}</p>
        <p style="margin:4px 0;"><strong>Client :</strong> {{customerName}}</p>
        <p style="margin:4px 0;"><strong>Moyen de paiement :</strong> {{paymentMethod}}</p>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="background:#f3f4f6; padding:10px; text-align:left;">Description</th>
              <th style="background:#f3f4f6; padding:10px; text-align:center;">Qté</th>
              <th style="background:#f3f4f6; padding:10px; text-align:right;">Prix unitaire</th>
              <th style="background:#f3f4f6; padding:10px; text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>{{itemsHtml}}</tbody>
        </table>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="text-align:right; margin:4px 0;"><strong>Sous-total :</strong> {{subtotal}} {{currency}}</p>
        <p style="text-align:right; margin:4px 0;"><strong>Taxes :</strong> {{tax}} {{currency}}</p>
        <p style="text-align:right; margin:4px 0; font-weight:bold; font-size:18px;"><strong>Total :</strong> {{total}} {{currency}}</p>
      </div>
      <p>Merci de votre confiance !</p>
      <p style="margin-top: 24px;">Cordialement,<br>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["invoiceNumber", "invoiceDate", "customerName", "paymentMethod", "itemsHtml", "subtotal", "tax", "total", "currency", "year"]'::jsonb
),

(
  'Abonnement confirmé',
  'subscription_confirmation',
  $subj$Confirmation d'abonnement - {{planName}}$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">🎉 Abonnement confirmé</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour {{customerName}},</p>
      <p>Votre abonnement a été activé avec succès. Voici le récapitulatif :</p>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px 18px; margin:16px 0;">
        <p style="margin:4px 0; font-size:20px; font-weight:bold; color:#0b3d5c;">{{planName}}</p>
        <p style="margin:4px 0;"><strong>Prix :</strong> {{planPrice}}</p>
        <p style="margin:4px 0;"><strong>Transaction :</strong> {{transactionId}}</p>
        <p style="margin:4px 0;"><strong>Moyen de paiement :</strong> {{paymentMethod}}</p>
      </div>
      <p><strong>Ce qui change pour vous :</strong></p>
      <ul>
        <li>Accès à toutes les fonctionnalités premium</li>
        <li>Offres de voyage et réductions exclusives</li>
        <li>Support client prioritaire</li>
      </ul>
      <p>Vous pouvez gérer votre abonnement à tout moment depuis votre compte.</p>
      <p>Merci de votre confiance !</p>
      <p style="margin-top: 24px;">Cordialement,<br>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["customerName", "planName", "planPrice", "transactionId", "paymentMethod", "year"]'::jsonb
),

(
  'Message de contact (interne)',
  'contact_message_internal',
  $subj$Formulaire de contact : {{subject}}$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #334155; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <p style="margin:0 0 6px; font-size: 11px; letter-spacing:.06em; text-transform:uppercase; opacity:.75;">Usage interne</p>
      <h1 style="margin:0; font-size: 18px;">Nouveau message de contact</h1>
    </div>
    <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; margin:12px 0;">
        <p style="margin:4px 0;"><strong>Nom :</strong> {{name}}</p>
        <p style="margin:4px 0;"><strong>Email :</strong> {{email}}</p>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; margin:12px 0;">
        <p style="margin:0 0 6px; font-weight:bold;">Sujet</p>
        <p style="margin:0;">{{subject}}</p>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; margin:12px 0;">
        <p style="margin:0 0 6px; font-weight:bold;">Message</p>
        <p style="margin:0;">{{messageHtml}}</p>
      </div>
      <p>Merci de répondre à ce message rapidement.</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz - Contact</p>
    </div>
  </div>
</body>
</html>$html$,
  '["name", "email", "subject", "messageHtml", "year"]'::jsonb
),

(
  'Demande support (interne)',
  'support_request_internal',
  $subj$Demande de support : {{subject}}$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #334155; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <p style="margin:0 0 6px; font-size: 11px; letter-spacing:.06em; text-transform:uppercase; opacity:.75;">Usage interne</p>
      <h1 style="margin:0; font-size: 18px;">Nouvelle demande de support</h1>
    </div>
    <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; margin:12px 0;">
        <p style="margin:4px 0;"><strong>Nom :</strong> {{name}}</p>
        <p style="margin:4px 0;"><strong>Email :</strong> {{email}}</p>
        {{bookingReferenceBlockHtml}}
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; margin:12px 0;">
        <p style="margin:0 0 6px; font-weight:bold;">Sujet</p>
        <p style="margin:0;">{{subject}}</p>
      </div>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; margin:12px 0;">
        <p style="margin:0 0 6px; font-weight:bold;">Message</p>
        <p style="margin:0;">{{messageHtml}}</p>
      </div>
      <p>Merci de répondre à cette demande rapidement.</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz - Support</p>
    </div>
  </div>
</body>
</html>$html$,
  '["name", "email", "bookingReferenceBlockHtml", "subject", "messageHtml", "year"]'::jsonb
)

ON CONFLICT (name) DO NOTHING;
