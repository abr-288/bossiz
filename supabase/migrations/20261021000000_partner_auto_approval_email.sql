-- E-mail d'information envoyé au candidat partenaire quand la validation
-- automatique est active (site_config 'partner_applications'.autoApprove) :
-- il annonce la création du compte d'ici quelques minutes et l'e-mail de
-- confirmation qui suivra (au lieu de l'étude manuelle du modèle
-- 'partner_application_received', toujours utilisé sinon).
--
-- Sans cette migration, send-partner-application-confirmation utilise déjà
-- le même texte par défaut ; elle rend seulement le modèle modifiable
-- depuis /admin/email-templates.
--
-- À exécuter dans le SQL Editor.

ALTER TABLE public.email_templates DROP CONSTRAINT IF EXISTS email_templates_type_check;

ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_type_check CHECK (type IN (
  'password_reset',
  'partner_account_ready',
  'partner_application_received',
  'partner_application_received_auto',
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
  'Demande partenaire reçue (validation automatique)',
  'partner_application_received_auto',
  $subj$Votre compte partenaire Bossiz+ est en cours de création$subj$,
  $html$<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0b3d5c; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin:0; font-size: 20px;">Demande bien reçue</h1>
    </div>
    <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
      <p>Bonjour,</p>
      <p>Nous avons bien reçu la demande de compte partenaire de <strong>{{applicationName}}</strong> sur Bossiz+.</p>
      <p>La validation est automatique : votre espace partenaire sera prêt d'ici {{delayText}} environ.</p>
      <p>Vous recevrez alors un second e-mail de confirmation à cette adresse, avec le lien pour accéder à votre espace (et choisir votre mot de passe si vous n'avez pas encore de compte Bossiz+).</p>
      <p style="margin-top: 24px;">Merci pour votre confiance,<br/>L'équipe Bossiz+</p>
      <p style="margin-top: 24px; font-size: 12px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:16px;">© {{year}} Conciergerie Bossiz. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>$html$,
  '["applicationName", "delayText", "year"]'::jsonb
)
ON CONFLICT (name) DO NOTHING;
