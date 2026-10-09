import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Car, Lock, CheckCircle, Loader2, LinkIcon } from "lucide-react";
import { z } from "zod";
import authBg from "@/assets/hero-slide-1.jpg";
import { updatePasswordSchema } from "@/lib/authValidation";
import { classifyPasswordError, passwordErrorMessage } from "@/lib/passwordErrors";

type Status = "checking" | "ready" | "invalid" | "success";

/**
 * Lit le lien de l'e-mail.
 * - Nouveau format : /reset-password?token_hash=…&type=recovery. Le jeton n'est
 *   vérifié qu'à la validation du formulaire, pour qu'un robot qui ouvre le lien
 *   avant le client (analyse des liens par Gmail, antivirus) ne le consomme pas.
 * - Ancien format (liens déjà envoyés) : Supabase a déjà vérifié le jeton et
 *   renvoie #access_token=… ou #error=…&error_code=otp_expired.
 */
const readLink = () => {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    tokenHash: search.get("token_hash"),
    hashError: hash.get("error_code") || hash.get("error") || search.get("error_code") || search.get("error"),
    hasHashSession: hash.has("access_token"),
  };
};

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("checking");
  const [invalidReason, setInvalidReason] = useState<"expired" | "missing">("expired");
  const [errorMessage, setErrorMessage] = useState("");
  const tokenHash = useRef<string | null>(null);

  useEffect(() => {
    const link = readLink();

    if (link.tokenHash) {
      tokenHash.current = link.tokenHash;
      // Le jeton ne doit pas rester dans l'URL (historique, partage de capture).
      window.history.replaceState(null, "", window.location.pathname);
      setStatus("ready");
      return;
    }
    if (link.hashError) {
      setInvalidReason("expired");
      setStatus("invalid");
      return;
    }

    // Ancien format : attendre que supabase-js ait ouvert la session de récupération.
    let done = false;
    const markReady = () => {
      if (done) return;
      done = true;
      setStatus("ready");
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) markReady();
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady();
    });
    const timeout = setTimeout(async () => {
      if (done) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return markReady();
      done = true;
      setInvalidReason(link.hasHashSession ? "expired" : "missing");
      setStatus("invalid");
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    let validated: z.infer<typeof updatePasswordSchema>;
    try {
      validated = updatePasswordSchema.parse({ password, confirmPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0].path[0] === "confirmPassword" ? t("ux.reset.mismatch") : t("ux.reset.rule");
        setErrorMessage(message);
      }
      return;
    }

    setLoading(true);
    try {
      // Nouveau format : ouvrir la session de récupération seulement maintenant.
      if (tokenHash.current) {
        const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash.current, type: "recovery" });
        if (otpError) {
          setInvalidReason("expired");
          setStatus("invalid");
          return;
        }
        tokenHash.current = null; // usage unique
      }

      const { error } = await supabase.auth.updateUser({ password: validated.password });
      if (error) {
        const kind = classifyPasswordError(error);
        if (kind === "session") {
          setInvalidReason("expired");
          setStatus("invalid");
        } else {
          setErrorMessage(passwordErrorMessage(t, error));
        }
        return;
      }

      setStatus("success");
      toast.success(t("ux.reset.successToast"));
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth");
      }, 3000);
    } catch {
      setErrorMessage(t("ux.reset.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Image (grand écran) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-brand/80" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold">Bossiz+</span>
              <span className="text-xs text-white/70 tracking-wider">{t("ux.reset.brandTagline")}</span>
            </div>
          </Link>

          <div className="space-y-8">
            <h2 className="text-4xl font-bold leading-tight">
              {t("ux.reset.sideTitleA")}
              <br />
              <span className="text-gold">{t("ux.reset.sideTitleB")}</span>
            </h2>
            <p className="text-white/80 text-lg max-w-md">{t("ux.reset.sideText")}</p>
            <div className="flex items-center gap-3 text-sm">
              <Lock className="h-4 w-4" />
              <span>{t("ux.reset.rule")}</span>
            </div>
          </div>

          <p className="text-sm text-white/50">{t("ux.reset.copyright")}</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Car className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-2xl font-bold text-primary">Bossiz+</span>
                <span className="text-xs text-muted-foreground tracking-wider">{t("ux.reset.brandTagline")}</span>
              </div>
            </Link>
          </div>

          {status === "checking" && (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground" role="status">
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
              <p>{t("ux.reset.checking")}</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <LinkIcon className="h-8 w-8 text-destructive" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">{t("ux.reset.invalidTitle")}</h1>
                <p className="text-muted-foreground">
                  {invalidReason === "missing" ? t("ux.reset.invalidMissing") : t("ux.reset.invalidExpired")}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="w-full">
                  <Link to="/forgot-password">{t("ux.reset.newLink")}</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/auth">{t("ux.reset.backToLogin")}</Link>
                </Button>
              </div>
            </div>
          )}

          {status === "ready" && (
            <>
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-3xl font-bold tracking-tight">{t("ux.reset.title")}</h1>
                <p className="text-muted-foreground">{t("ux.reset.intro")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("ux.reset.newPassword")}</Label>
                    {/* new-password : empêche Chrome de pré-remplir l'ancien mot de passe enregistré */}
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      aria-describedby="password-rule"
                      className="h-12"
                    />
                    <p id="password-rule" className="text-sm text-muted-foreground">{t("ux.reset.rule")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("ux.reset.confirmPassword")}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12"
                    />
                  </div>
                  {errorMessage && (
                    <p role="alert" className="text-sm text-destructive">{errorMessage}</p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? t("ux.reset.submitting") : t("ux.reset.submit")}
                </Button>
              </form>
            </>
          )}

          {status === "success" && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{t("ux.reset.successTitle")}</h1>
                <p className="text-muted-foreground">{t("ux.reset.successText")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
