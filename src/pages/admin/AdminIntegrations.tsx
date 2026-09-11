import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Save, Mail, MessageSquare, AlertTriangle, Eye, EyeOff, CreditCard, CheckCircle2 } from "lucide-react";
import { useIntegrationCredentials, type IntegrationCredential } from "@/hooks/useIntegrationCredentials";

// Champs attendus par prestataire — détermine le formulaire affiché.
const PROVIDER_FIELDS: Record<string, { key: string; label: string; secret?: boolean }[]> = {
  resend: [{ key: "api_key", label: "Clé API Resend", secret: true }],
  smtp: [
    { key: "host", label: "Hôte SMTP (ex: smtp.hebergeur.com)" },
    { key: "port", label: "Port (465 = TLS, 587 = STARTTLS)" },
    { key: "username", label: "Nom d'utilisateur" },
    { key: "password", label: "Mot de passe", secret: true },
    { key: "from", label: "Adresse d'expédition (ex: B-Reserve <contact@bossiz.com>)" },
  ],
  twilio: [
    { key: "account_sid", label: "Account SID" },
    { key: "auth_token", label: "Auth Token", secret: true },
    { key: "from_number", label: "Numéro d'envoi (ex: +14155552671)" },
  ],
  orange_sms_ci: [
    { key: "client_id", label: "Client ID" },
    { key: "client_secret", label: "Client Secret", secret: true },
    { key: "sender_name", label: "Nom de l'expéditeur (ex: BOSSIZ)" },
  ],
  africastalking: [
    { key: "username", label: "Username" },
    { key: "api_key", label: "Clé API", secret: true },
    { key: "sender_id", label: "Sender ID (optionnel)" },
  ],
  sendexa: [
    { key: "api_token", label: "Token du dashboard (Basic Auth)", secret: true },
    { key: "sender_id", label: "Nom de l'expéditeur (optionnel)" },
  ],
  twilio_whatsapp: [
    { key: "account_sid", label: "Account SID" },
    { key: "auth_token", label: "Auth Token", secret: true },
    { key: "from_number", label: "Numéro WhatsApp Business (ex: +14155238886)" },
  ],
  sendexa_whatsapp: [
    { key: "api_token", label: "Token du dashboard (Basic Auth)", secret: true },
    { key: "sender_id", label: "Nom de l'expéditeur (optionnel)" },
  ],
  cinetpay: [
    { key: "api_key", label: "Clé API CinetPay", secret: true },
    { key: "site_id", label: "Site ID CinetPay" },
  ],
  jeko: [
    { key: "store_id", label: "Store ID (Cockpit Jèko > Magasins)" },
    { key: "api_key", label: "Clé API (X-API-KEY)", secret: true },
    { key: "api_key_id", label: "Identifiant de clé (X-API-KEY-ID)" },
    { key: "webhook_secret", label: "Secret Webhook (Cockpit > API & Webhooks)", secret: true },
  ],
};

// Prestataires ayant un repli légitime sur des secrets d'Edge Function déjà
// configurés (contrairement aux autres, ils restent activables même si les
// champs ci-dessous sont laissés vides).
const ENV_FALLBACK_HINTS: Record<string, string> = {
  cinetpay: "Laissez ces champs vides pour continuer à utiliser les secrets d'Edge Function déjà configurés (CINETPAY_API_KEY, CINETPAY_SITE_ID) — ou renseignez-les ici pour les remplacer sans passer par la CLI Supabase.",
  resend: "Laissez ce champ vide pour continuer à utiliser le secret d'Edge Function déjà configuré (RESEND_API_KEY) — ou renseignez-le ici pour le remplacer sans passer par la CLI Supabase.",
};

const ACTIVE_DESCRIPTIONS: Record<string, string> = {
  email: "Prestataire actif — utilisé pour tous les emails envoyés par le site",
  sms: "Prestataire actif — utilisé pour tous les SMS envoyés par le site",
  whatsapp: "Prestataire actif — utilisé pour les notifications WhatsApp (ex: approbation de voyage d'affaires)",
  payment: "Prestataire actif — utilisé pour tous les nouveaux paiements",
};

function ExclusiveProviderCard({
  integration,
  onSave,
  onActivate,
}: {
  integration: IntegrationCredential;
  onSave: (updates: Partial<IntegrationCredential>) => Promise<void>;
  onActivate: (updates: Partial<IntegrationCredential>) => Promise<void>;
}) {
  const [credentials, setCredentials] = useState<Record<string, string>>(integration.credentials || {});
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const fields = PROVIDER_FIELDS[integration.provider] || [];
  const hasAllRequiredKeys = fields.every((f) => credentials[f.key]?.trim());
  const envFallbackHint = ENV_FALLBACK_HINTS[integration.provider];
  const canActivate = hasAllRequiredKeys || !!envFallbackHint;

  const handleSave = async () => {
    setSaving(true);
    await onSave({ credentials });
    setSaving(false);
  };

  const handleActivate = async () => {
    setActivating(true);
    await onActivate({ credentials });
    setActivating(false);
  };

  return (
    <Card className={integration.is_active ? "border-primary" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {integration.label}
              {integration.is_active && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </CardTitle>
            <CardDescription>
              {integration.is_active ? ACTIVE_DESCRIPTIONS[integration.category] || "Actif" : "Inactif"}
              {!canActivate && " — clés manquantes"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {envFallbackHint && (
          <p className="text-xs text-muted-foreground">{envFallbackHint}</p>
        )}
        {fields.map((field) => (
          <div key={field.key}>
            <Label>{field.label}</Label>
            <Input
              type={field.secret && !showSecrets ? "password" : "text"}
              value={credentials[field.key] || ""}
              onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
              placeholder={field.secret ? "••••••••" : ""}
            />
          </div>
        ))}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            onClick={() => setShowSecrets((s) => !s)}
          >
            {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showSecrets ? "Masquer" : "Afficher"} les clés
          </button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
              Enregistrer
            </Button>
            <Button
              size="sm"
              onClick={handleActivate}
              disabled={activating || integration.is_active || !canActivate}
            >
              {activating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              {integration.is_active ? "Actif" : "Activer ce prestataire"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminIntegrations() {
  const { integrations, loading, tableMissing, updateIntegration, activateExclusive } = useIntegrationCredentials();

  const emailIntegrations = integrations.filter((i) => i.category === "email");
  const smsIntegrations = integrations.filter((i) => i.category === "sms");
  const whatsappIntegrations = integrations.filter((i) => i.category === "whatsapp");
  const paymentIntegrations = integrations.filter((i) => i.category === "payment");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Intégrations (Email, SMS, Paiement)</h1>
          <p className="text-muted-foreground">
            Renseignez ici les clés API de vos prestataires — dès qu'une intégration est activée
            avec des clés valides, elle est utilisée immédiatement par le site (support, newsletter,
            factures, confirmations, alertes de prix).
          </p>
        </div>

        {tableMissing && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuration en attente</AlertTitle>
            <AlertDescription>
              La table de stockage des identifiants n'existe pas encore sur la base de production.
              Une migration SQL est prête (<code>supabase/migrations/20260806000000_integration_credentials_and_otp.sql</code>)
              mais n'a pas pu être appliquée automatiquement (blocage de permission côté plateforme Supabase).
              Exécutez-la une fois dans le SQL Editor du dashboard Supabase pour activer cette page.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !tableMissing && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5" /> Email
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Un seul prestataire email est actif à la fois — c'est celui-là qui sera utilisé pour
                tous les envois (support, newsletter, factures, confirmations, alertes de prix).
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {emailIntegrations.map((integration) => (
                  <ExclusiveProviderCard
                    key={integration.id}
                    integration={integration}
                    onSave={(updates) => updateIntegration(integration.id, updates)}
                    onActivate={(updates) => activateExclusive(integration.id, "email", updates)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> SMS
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Activez un seul prestataire SMS à la fois — c'est celui-là qui sera utilisé pour l'envoi.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {smsIntegrations.map((integration) => (
                  <ExclusiveProviderCard
                    key={integration.id}
                    integration={integration}
                    onSave={(updates) => updateIntegration(integration.id, updates)}
                    onActivate={(updates) => activateExclusive(integration.id, "sms", updates)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> WhatsApp
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Utilisé pour les notifications WhatsApp (ex: approbation de voyage d'affaires). Distinct du
                prestataire SMS ci-dessus : un numéro WhatsApp Business n'est pas interchangeable avec un numéro SMS classique.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {whatsappIntegrations.map((integration) => (
                  <ExclusiveProviderCard
                    key={integration.id}
                    integration={integration}
                    onSave={(updates) => updateIntegration(integration.id, updates)}
                    onActivate={(updates) => activateExclusive(integration.id, "whatsapp", updates)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Paiement
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Un seul prestataire de paiement est actif à la fois — c'est celui-là qui traite tous
                les nouveaux paiements de réservations et d'abonnements. Pour Jèko, pensez à configurer
                l'URL de webhook dans le Cockpit Jèko (Paramètres &gt; API &amp; Webhooks) :
                <code className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs">https://gpwlzhegvjsbgbaepfjz.supabase.co/functions/v1/jeko-webhook</code>
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {paymentIntegrations.map((integration) => (
                  <ExclusiveProviderCard
                    key={integration.id}
                    integration={integration}
                    onSave={(updates) => updateIntegration(integration.id, updates)}
                    onActivate={(updates) => activateExclusive(integration.id, "payment", updates)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
