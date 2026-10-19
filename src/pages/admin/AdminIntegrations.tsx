import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Save, Mail, MessageSquare, AlertTriangle, Eye, EyeOff, CreditCard, CheckCircle2 } from "lucide-react";
import { useIntegrationCredentials, type IntegrationCredential } from "@/hooks/useIntegrationCredentials";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

// Champs attendus par prestataire — détermine le formulaire affiché.
const PROVIDER_FIELDS: Record<string, { key: string; label: string; secret?: boolean }[]> = {
  resend: [{ key: "api_key", get label() { return i18n.t("ux.bo.resendApiKey"); }, secret: true }],
  smtp: [
    { key: "host", get label() { return i18n.t("ux.bo.smtpHostEGSmtp"); } },
    { key: "port", get label() { return i18n.t("ux.bo.port465Tls587Starttls"); } },
    { key: "username", get label() { return i18n.t("ux.bo.username"); } },
    { key: "password", get label() { return i18n.t("ux.bo.password"); }, secret: true },
    { key: "from", label: "Adresse d'expédition (ex: Bossiz+ <contact@bossiz.com>)" },
  ],
  twilio: [
    { key: "account_sid", label: "Account SID" },
    { key: "auth_token", label: "Auth Token", secret: true },
    { key: "from_number", get label() { return i18n.t("ux.bo.senderNumberEG14155552671"); } },
  ],
  orange_sms_ci: [
    { key: "client_id", label: "Client ID" },
    { key: "client_secret", label: "Client Secret", secret: true },
    { key: "sender_name", get label() { return i18n.t("ux.bo.senderNameEGBossiz"); } },
  ],
  africastalking: [
    { key: "username", label: "Username" },
    { key: "api_key", get label() { return i18n.t("ux.bo.apiKey"); }, secret: true },
    { key: "sender_id", get label() { return i18n.t("ux.bo.senderIdOptional"); } },
  ],
  sendexa: [
    { key: "api_token", get label() { return i18n.t("ux.bo.dashboardTokenBasicAuth"); }, secret: true },
    { key: "sender_id", get label() { return i18n.t("ux.bo.senderNameOptional"); } },
  ],
  twilio_whatsapp: [
    { key: "account_sid", label: "Account SID" },
    { key: "auth_token", label: "Auth Token", secret: true },
    { key: "from_number", get label() { return i18n.t("ux.bo.whatsappBusinessNumberEG"); } },
  ],
  sendexa_whatsapp: [
    { key: "api_token", get label() { return i18n.t("ux.bo.dashboardTokenBasicAuth"); }, secret: true },
    { key: "sender_id", get label() { return i18n.t("ux.bo.senderNameOptional"); } },
  ],
  jeko: [
    { key: "store_id", label: "Store ID — UUID (Cockpit Jèko > Magasins)" },
    { key: "api_key", get label() { return i18n.t("ux.bo.apiKeyXApiKey"); }, secret: true },
    { key: "api_key_id", get label() { return i18n.t("ux.bo.keyIdentifierXApiKey"); } },
    { key: "webhook_secret", label: "Secret Webhook (Cockpit > API & Webhooks)", secret: true },
  ],
};

// Prestataires ayant un repli légitime sur des secrets d'Edge Function déjà
// configurés (contrairement aux autres, ils restent activables même si les
// champs ci-dessous sont laissés vides).
const ENV_FALLBACK_HINTS: Record<string, string> = {
  get resend() { return i18n.t("ux.bo.leaveFieldEmptyKeepUsing"); },
};

const ACTIVE_DESCRIPTIONS: Record<string, string> = {
  get email() { return i18n.t("ux.bo.activeProviderUsedAllEmails"); },
  get sms() { return i18n.t("ux.bo.activeProviderUsedAllSms"); },
  get whatsapp() { return i18n.t("ux.bo.activeProviderUsedWhatsappNotifications"); },
  get payment() { return i18n.t("ux.bo.activeProviderUsedAllNew"); },
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
  const hasValidJekoStoreId = integration.provider !== "jeko" ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(credentials.store_id?.trim() || "");
  const envFallbackHint = ENV_FALLBACK_HINTS[integration.provider];
  const canActivate = (hasAllRequiredKeys || !!envFallbackHint) && hasValidJekoStoreId;

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
            {integration.provider === "jeko" && field.key === "store_id" && (
              <p className="mt-1 text-xs text-muted-foreground">
                {i18n.t("ux.bo.enterStoreUuid84")}
              </p>
            )}
          </div>
        ))}
        {integration.provider === "jeko" && credentials.store_id?.trim() && !hasValidJekoStoreId && (
          <p className="text-sm text-destructive">
            {i18n.t("ux.bo.invalidStoreIdCopyStore")}
          </p>
        )}
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
              {i18n.t("ux.bo.save2")}
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
  const { t } = useTranslation();
  const { integrations, loading, tableMissing, updateIntegration, activateExclusive } = useIntegrationCredentials();

  const emailIntegrations = integrations.filter((i) => i.category === "email");

  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTestEmail = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-send-test-email", {
        body: { to: testEmail.trim() },
      });
      if (error) throw error;
      setTestResult(
        data?.success
          ? { ok: true, message: `E-mail envoyé via ${data.provider}. Vérifiez la boîte de réception et les spams.` }
          : { ok: false, message: `Échec (${data?.provider ?? "?"}) : ${data?.error ?? "erreur inconnue"}` },
      );
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : t("ux.bo.unableReachTestFunction") });
    } finally {
      setTesting(false);
    }
  };
  const smsIntegrations = integrations.filter((i) => i.category === "sms");
  const whatsappIntegrations = integrations.filter((i) => i.category === "whatsapp");
  const paymentIntegrations = integrations.filter((i) => i.category === "payment" && i.provider === "jeko");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("ux.bo.integrationsEmailSmsPayment2")}</h1>
          <p className="text-muted-foreground">
            {t("ux.bo.enterProvidersApiKeysHere")}
            avec des clés valides, elle est utilisée immédiatement par le site (support, newsletter,
            factures, confirmations, alertes de prix).
          </p>
        </div>

        {tableMissing && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("ux.bo.configurationPending")}</AlertTitle>
            <AlertDescription>
              {t("ux.bo.credentialsStorageTableDoesNot")}
              Une migration SQL est prête (<code>supabase/migrations/20260806000000_integration_credentials_and_otp.sql</code>)
              mais n'a pas pu être appliquée automatiquement (blocage de permission côté plateforme Supabase).
              {t("ux.bo.runOnceSupabaseDashboardSql")}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !tableMissing && (
          <Tabs defaultValue="email" className="space-y-6">
            <TabsList className="grid w-full max-w-xl grid-cols-3">
              <TabsTrigger value="email" className="gap-2"><Mail className="w-4 h-4" /> Email</TabsTrigger>
              <TabsTrigger value="messaging" className="gap-2"><MessageSquare className="w-4 h-4" /> {t("ux.bo.smsWhatsapp")}</TabsTrigger>
              <TabsTrigger value="payment" className="gap-2"><CreditCard className="w-4 h-4" /> {t("ux.bo.payment")}</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5" /> Email
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {t("ux.bo.onlyOneEmailProviderActive")}
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
              <div className="mt-4 rounded-md border p-4 space-y-3">
                <p className="text-sm font-medium">{t("ux.bo.testEmailSending")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("ux.bo.sendsTestEmailThroughActive")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    placeholder={t("ux.bo.addressExampleCom")}
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button onClick={handleTestEmail} disabled={testing || !testEmail.trim()}>
                    {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    {t("ux.bo.sendTest")}
                  </Button>
                </div>
                {testResult && (
                  <p className={`text-sm break-words ${testResult.ok ? "text-success" : "text-destructive"}`}>
                    {testResult.message}
                  </p>
                )}
              </div>
            </div>
            </TabsContent>

            <TabsContent value="messaging" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> SMS
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {t("ux.bo.enableOnlyOneSmsProvider")}
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
                {t("ux.bo.usedWhatsappNotificationsEG")}
                {t("ux.bo.smsProviderAboveWhatsappBusiness")}
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
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Paiement
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {t("ux.bo.onlyOnePaymentProviderActive")}
                {t("ux.bo.newBookingSubscriptionPaymentsJ")}
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
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
