# E-mails d'authentification Supabase en français

Constat du 07/11/2026 : l'e-mail de confirmation d'inscription part en anglais (« Confirm Your Signup », modèle par défaut de Supabase). Ces modèles ne sont pas dans le code. On les change dans le Dashboard Supabase > **Authentication > Emails > Templates**.

Coller pour chaque modèle le sujet et le corps ci-dessous. Garder `{{ .ConfirmationURL }}` tel quel.

## Confirm signup

**Sujet** : `Confirmez votre inscription sur Bossiz+`

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
  <h2 style="color:#0b3d5c">Bienvenue sur Bossiz+</h2>
  <p>Bonjour,</p>
  <p>Merci pour votre inscription. Pour activer votre compte, confirmez votre adresse e-mail :</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{ .ConfirmationURL }}" style="background:#0f7b5f;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">Confirmer mon adresse</a>
  </p>
  <p style="font-size:13px;color:#6b7280">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.</p>
  <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px">Conciergerie Bossiz · contact@bossiz.com</p>
</div>
```

## Reset password

**Sujet** : `Réinitialisez votre mot de passe Bossiz+`

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
  <h2 style="color:#0b3d5c">Nouveau mot de passe</h2>
  <p>Vous avez demandé à changer votre mot de passe. Ce lien est valable une heure :</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{ .ConfirmationURL }}" style="background:#0f7b5f;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">Choisir un nouveau mot de passe</a>
  </p>
  <p style="font-size:13px;color:#6b7280">Si vous n'avez rien demandé, ignorez cet e-mail : votre mot de passe reste inchangé.</p>
  <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px">Conciergerie Bossiz · contact@bossiz.com</p>
</div>
```

## Magic link

**Sujet** : `Votre lien de connexion Bossiz+`

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
  <h2 style="color:#0b3d5c">Connexion à Bossiz+</h2>
  <p>Cliquez sur le bouton pour vous connecter :</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{ .ConfirmationURL }}" style="background:#0f7b5f;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">Me connecter</a>
  </p>
  <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px">Conciergerie Bossiz · contact@bossiz.com</p>
</div>
```

## Change email address

**Sujet** : `Confirmez votre nouvelle adresse e-mail`

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
  <h2 style="color:#0b3d5c">Changement d'adresse e-mail</h2>
  <p>Confirmez le passage de {{ .Email }} à {{ .NewEmail }} :</p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{ .ConfirmationURL }}" style="background:#0f7b5f;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">Confirmer</a>
  </p>
  <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px">Conciergerie Bossiz · contact@bossiz.com</p>
</div>
```

## Adresses de redirection autorisées

Dans Authentication > URL Configuration > **Redirect URLs**, il faut :

- `https://app.bossiz.com/**`
- `com.bossizplus.app://**` (retour dans l'application mobile après la connexion Google, ajouté le 07/11/2026)
