import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/requestPasswordReset";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";
import { toast } from "sonner";
import { Car, Mail, ArrowLeft } from "lucide-react";
import { z } from "zod";
import authBg from "@/assets/hero-slide-1.jpg";
import { useTranslation } from "react-i18next";

const emailSchema = z.object({
  email: z.string().trim().email().max(255),
});

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = emailSchema.parse({ email });
      setLoading(true);

      await requestPasswordReset(validated.email, "/reset-password");

      setEmailSent(true);
      toast.success(t("ux.forgot.sentToast"));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        toast.error(t("ux.forgot.invalidEmail"));
      } else {
        toast.error(error instanceof Error
          ? await getEdgeFunctionErrorMessage(error, t("ux.forgot.sendError"))
          : t("ux.forgot.sendError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src={authBg} 
          alt="Bossiz+"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand/80" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold">Bossiz+</span>
              <span className="text-xs text-white/70 tracking-wider">{t("ux.forgot.eyebrow")}</span>
            </div>
          </Link>
          
          <div className="space-y-8">
            <h2 className="text-4xl font-bold leading-tight">
              {t("ux.forgot.heroTitle")}
              <br />
              <span className="text-gold">{t("ux.forgot.heroAccent")}</span>
            </h2>
            <p className="text-white/80 text-lg max-w-md">
              {t("ux.forgot.heroDesc")}
            </p>
          </div>
          
          <p className="text-sm text-white/50">
            {t("ux.forgot.copyright")}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Car className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-2xl font-bold text-primary">Bossiz+</span>
                <span className="text-xs text-muted-foreground tracking-wider">{t("ux.forgot.eyebrow")}</span>
              </div>
            </Link>
          </div>

          {!emailSent ? (
            <>
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-3xl font-bold tracking-tight">{t("ux.forgot.title")}</h1>
                <p className="text-muted-foreground">
                  {t("ux.forgot.subtitle")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("ux.forgot.googleNote")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("ux.forgot.emailLabel")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder={t("ux.forgot.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-xl"
                  />
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
                  {loading ? t("ux.forgot.sending") : t("ux.forgot.send")}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-success" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{t("ux.forgot.sent")}</h1>
                <p className="text-muted-foreground">
                  {t("ux.forgot.checkInbox")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("ux.forgot.googleNote2")}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("ux.forgot.notReceived")}{" "}
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="text-primary hover:underline font-medium"
                >
                  {t("ux.forgot.retry")}
                </button>
              </p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/auth" className="hover:text-primary transition-colors inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("ux.forgot.backToSignIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
