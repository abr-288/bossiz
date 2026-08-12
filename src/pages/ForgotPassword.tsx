import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Car, Mail, ArrowLeft } from "lucide-react";
import { z } from "zod";
import authBg from "@/assets/hero-slide-1.jpg";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }).max(255),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = emailSchema.parse({ email });
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Email de réinitialisation envoyé !");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erreur lors de l'envoi de l'email");
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
          alt="Luxury vehicles" 
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
              Récupérez votre
              <br />
              <span className="text-amber-300">compte</span>
            </h2>
            <p className="text-white/80 text-lg max-w-md">
              Pas de panique ! Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
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

          {!emailSent ? (
            <>
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-3xl font-bold tracking-tight">Mot de passe oublié</h1>
                <p className="text-muted-foreground">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-xl"
                  />
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
                  {loading ? "Envoi en cours..." : "Envoyer le lien"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Email envoyé !</h1>
                <p className="text-muted-foreground">
                  Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas reçu l'email ?{" "}
                <button 
                  onClick={() => setEmailSent(false)} 
                  className="text-primary hover:underline font-medium"
                >
                  Réessayer
                </button>
              </p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/auth" className="hover:text-primary transition-colors inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
