import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, ArrowLeft, Loader2, X, Check } from "lucide-react";
import { getErrorMessage } from "@/lib/errorMessage";

interface MFAVerificationProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function MFAVerification({ onSuccess, onBack }: MFAVerificationProps) {
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    // Get the TOTP factor to use for verification
    const getFactors = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        console.error("Error listing MFA factors:", error);
        return;
      }
      
      const totpFactor = data.totp.find(f => f.status === 'verified');
      if (totpFactor) {
        setFactorId(totpFactor.id);
      }
    };

    getFactors();
  }, []);

  const handleVerify = async () => {
    if (!factorId) {
      setError("Aucun facteur d'authentification trouvé");
      return;
    }

    if (verificationCode.length !== 6) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      toast.success("Vérification réussie !");
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(getErrorMessage(err) || "Code invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && verificationCode.length === 6) {
      handleVerify();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 relative overflow-hidden flex items-center justify-center p-4 md:p-6">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 left-4 z-20"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2 hover:bg-background/80 backdrop-blur-sm rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Retour</span>
        </Button>
      </motion.div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="backdrop-blur-sm bg-card/95 shadow-2xl border-primary/10">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mx-auto mb-4 p-4 bg-primary/10 rounded-full"
            >
              <Shield className="h-10 w-10 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl">Vérification 2FA</CardTitle>
            <CardDescription>
              Entrez le code de votre application d'authentification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Code à 6 chiffres</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={handleKeyDown}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  autoFocus
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1 justify-center"
                >
                  <X className="h-4 w-4" />
                  {error}
                </motion.p>
              )}

              <Button
                onClick={handleVerify}
                className="w-full h-12"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Check className="mr-2 h-5 w-5" />
                )}
                Vérifier
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-sm text-muted-foreground"
            >
              Ouvrez votre application d'authentification (Google Authenticator, Authy, etc.) et entrez le code affiché.
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
