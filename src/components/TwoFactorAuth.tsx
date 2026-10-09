import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Smartphone, 
  QrCode, 
  Check, 
  X, 
  Loader2, 
  Copy, 
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
  Trash2
} from "lucide-react";
import { useMFA } from "@/hooks/useMFA";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { currentLocaleTag } from "@/lib/dateLocale";

export function TwoFactorAuth() {
  const { t } = useTranslation();
  const {
    factors,
    loading,
    enrolling,
    verifying,
    enrollmentData,
    error,
    enrollTOTP,
    verifyAndActivate,
    cancelEnrollment,
    unenrollFactor,
    hasMFAEnabled,
  } = useMFA();

  const [verificationCode, setVerificationCode] = useState("");
  const [showEnrollment, setShowEnrollment] = useState(false);

  const handleStartEnrollment = async () => {
    try {
      await enrollTOTP(t("ux.twoFactor.app"));
      setShowEnrollment(true);
    } catch (err) {
      toast.error(t("ux.twoFactor.startError"));
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error(t("ux.twoFactor.codeLength"));
      return;
    }

    const success = await verifyAndActivate(verificationCode);
    if (success) {
      toast.success(t("ux.twoFactor.enabled"));
      setShowEnrollment(false);
      setVerificationCode("");
    }
  };

  const handleCancel = () => {
    cancelEnrollment();
    setShowEnrollment(false);
    setVerificationCode("");
  };

  const handleUnenroll = async (factorId: string) => {
    const success = await unenrollFactor(factorId);
    if (success) {
      toast.success(t("ux.twoFactor.disabled"));
    } else {
      toast.error(t("ux.twoFactor.disableError"));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("ux.twoFactor.copied"));
  };

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-primary/10 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-primary/10 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t("ux.twoFactor.title")}
        </CardTitle>
        <CardDescription>
          {t("ux.twoFactor.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-4 ${
            hasMFAEnabled 
              ? "bg-success/10 border border-success/30" 
              : "bg-warning border border-warning-foreground/20"
          }`}
        >
          {hasMFAEnabled ? (
            <>
              <ShieldCheck className="h-8 w-8 text-success" />
              <div>
                <h3 className="font-semibold text-success">{t("ux.twoFactor.on")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("ux.twoFactor.onDesc")}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto border-success text-success">
                <Check className="h-3 w-3 mr-1" />
                {t("ux.twoFactor.active")}
              </Badge>
            </>
          ) : (
            <>
              <ShieldOff className="h-8 w-8 text-gold" />
              <div>
                <h3 className="font-semibold text-warning-foreground">{t("ux.twoFactor.off")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("ux.twoFactor.offDesc")}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto border-gold text-warning-foreground">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {t("ux.twoFactor.inactive")}
              </Badge>
            </>
          )}
        </motion.div>

        {/* Enrolled factors list */}
        {factors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <Label>{t("ux.twoFactor.methods")}</Label>
            {factors.map((factor) => (
              <div
                key={factor.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{factor.friendly_name || t("ux.twoFactor.app")}</p>
                    <p className="text-xs text-muted-foreground">
                      Ajouté le {new Date(factor.created_at).toLocaleDateString(currentLocaleTag())}
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("ux.twoFactor.disableTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action va désactiver l'authentification à deux facteurs sur votre compte.
                        Vous devrez la reconfigurer pour la réactiver.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("ux.twoFactor.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUnenroll(factor.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t("ux.twoFactor.disable")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </motion.div>
        )}

        {/* Enrollment flow */}
        <AnimatePresence mode="wait">
          {showEnrollment && enrollmentData ? (
            <motion.div
              key="enrollment"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              <Alert>
                <QrCode className="h-4 w-4" />
                <AlertDescription>
                  {t("ux.twoFactor.scan")}
                </AlertDescription>
              </Alert>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-4 bg-white rounded-lg shadow-lg"
                >
                  <img
                    src={enrollmentData.qrCode}
                    alt={t("ux.twoFactor.qrAlt")}
                    className="w-48 h-48"
                  />
                </motion.div>

                {/* Manual entry secret */}
                <div className="w-full space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    {t("ux.twoFactor.manualKey")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                      {enrollmentData.secret}
                    </code>
                    <Button
                      aria-label={t("ux.twoFactor.copy")}
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(enrollmentData.secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Verification code input */}
              <div className="space-y-3">
                <Label htmlFor="verification-code">
                  {t("ux.twoFactor.enterCode")}
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={verifying}
                >
                  {t("ux.twoFactor.cancel")}
                </Button>
                <Button
                  onClick={handleVerify}
                  className="flex-1"
                  disabled={verifying || verificationCode.length !== 6}
                >
                  {verifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {t("ux.twoFactor.verify")}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="setup-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!hasMFAEnabled && (
                <Button
                  onClick={handleStartEnrollment}
                  className="w-full"
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="mr-2 h-4 w-4" />
                  )}
                  {t("ux.twoFactor.setup")}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 p-4 bg-muted/30 rounded-lg"
        >
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {t("ux.twoFactor.why")}
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>{t("ux.twoFactor.why1")}</li>
            <li>{t("ux.twoFactor.why2")}</li>
            <li>{t("ux.twoFactor.why3")}</li>
          </ul>
        </motion.div>
      </CardContent>
    </Card>
  );
}
