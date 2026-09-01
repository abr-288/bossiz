import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Car, Lock, CheckCircle } from "lucide-react";
import { z } from "zod";
import authBg from "@/assets/hero-slide-1.jpg";
import { updatePasswordSchema } from "@/lib/authValidation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have access token in URL (from email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (!accessToken || type !== "recovery") {
      // Check if user is already authenticated via recovery
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          toast.error("Lien de réinitialisation invalide ou expiré");
          navigate("/forgot-password");
        }
      });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = updatePasswordSchema.parse({ password, confirmPassword });
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: validated.password,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Mot de passe réinitialisé avec succès !");
      
      // Sign out and redirect to login after 3 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth");
      }, 3000);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erreur lors de la réinitialisation du mot de passe");
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
          alt="B-Reserve"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/80" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold">B-Reserve</span>
              <span className="text-xs text-white/70 tracking-wider">VOYAGES & RÉSERVATIONS</span>
            </div>
          </Link>
          
          <div className="space-y-8">
            <h2 className="text-4xl font-bold leading-tight">
              Nouveau
              <br />
              <span className="text-amber-300">mot de passe</span>
            </h2>
            <p className="text-white/80 text-lg max-w-md">
              Choisissez un mot de passe sécurisé pour protéger votre compte.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Lock className="h-4 w-4" />
                <span>8 caractères minimum, avec majuscule, minuscule et chiffre</span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-white/50">
            © 2026 B-Reserve. Tous droits réservés.
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
                <span className="text-2xl font-bold text-primary">B-Reserve</span>
                <span className="text-xs text-muted-foreground tracking-wider">VOYAGES & RÉSERVATIONS</span>
              </div>
            </Link>
          </div>

          {!success ? (
            <>
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-3xl font-bold tracking-tight">Nouveau mot de passe</h1>
                <p className="text-muted-foreground">
                  Entrez votre nouveau mot de passe ci-dessous
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
                  {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Mot de passe réinitialisé !</h1>
                <p className="text-muted-foreground">
                  Vous allez être redirigé vers la page de connexion...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
