import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Lock, Mail, User, ArrowLeft, Facebook, Apple, KeyRound } from "lucide-react";
import { MFAVerification } from "@/components/MFAVerification";
import { useOtpLogin } from "@/hooks/useOtpLogin";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import bannerHotels from "@/assets/ordinateur.jpg";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import AnimatedFormField from "@/components/forms/AnimatedFormField";
import {
  signUpSchema,
  signInSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  validateForm,
  getPasswordStrength,
} from "@/lib/authValidation";

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const { requestOtp, verifyOtp, loading: otpLoading } = useOtpLogin();
  const [showOtpLogin, setShowOtpLogin] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Form states
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({ fullName: "", email: "", password: "" });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [resetForm, setResetForm] = useState({ email: "" });
  const [updateForm, setUpdateForm] = useState({ password: "", confirmPassword: "" });
  
  // Error states
  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowUpdatePassword(true);
      }
      if (event === 'SIGNED_IN' && session) {
        // Check if MFA is required
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
          // User has MFA enabled but hasn't verified yet
          setShowMFAVerification(true);
        } else {
          navigate("/");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validation = validateForm(signUpSchema, signUpForm);
    const errors = { ...validation.errors };
    
    if (!acceptTerms) {
      errors.terms = t('auth.termsRequired');
    }
    
    setSignUpErrors(errors);
    
    if (!validation.valid || !acceptTerms) return;
    
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: signUpForm.email.trim(),
      password: signUpForm.password,
      options: {
        data: { full_name: signUpForm.fullName.trim() },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: t('auth.errors.existingAccount'),
          description: t('auth.errors.existingAccountDesc'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('auth.errors.signupError'),
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: t('auth.success.signup'),
        description: t('auth.success.signupDesc'),
      });
      setSignUpForm({ fullName: "", email: "", password: "" });
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validation = validateForm(signInSchema, signInForm);
    setSignInErrors(validation.errors);
    
    if (!validation.valid) return;
    
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: signInForm.email.trim(),
      password: signInForm.password,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast({
          title: t('auth.errors.invalidCredentials'),
          description: t('auth.errors.invalidCredentialsDesc'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('auth.errors.loginError'),
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: t('auth.success.login'),
        description: t('auth.success.loginDesc'),
      });
      navigate("/");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (error) {
      setLoading(false);
      toast({
        title: t('auth.errors.googleError'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otpEmail.trim()) return;

    const result = await requestOtp(otpEmail.trim(), "email", "login");

    if (!result.success) {
      toast({
        title: t('common.error'),
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setOtpSent(true);
    toast({
      title: "Code envoyé",
      description: `Un code de connexion a été envoyé à ${otpEmail.trim()}`,
    });
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    const result = await verifyOtp(otpEmail.trim(), otpCode.trim(), "login");

    if (!result.success) {
      toast({
        title: t('common.error'),
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t('auth.success.login'),
      description: t('auth.success.loginDesc'),
    });
    navigate("/");
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validation = validateForm(resetPasswordSchema, resetForm);
    setResetErrors(validation.errors);
    
    if (!validation.valid) return;
    
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetForm.email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });

    setLoading(false);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('auth.success.resetSent'),
        description: t('auth.success.resetSentDesc'),
      });
      setShowResetPassword(false);
      setResetForm({ email: "" });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validation = validateForm(updatePasswordSchema, updateForm);
    setUpdateErrors(validation.errors);
    
    if (!validation.valid) return;
    
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: updateForm.password });

    setLoading(false);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('auth.success.passwordUpdated'),
        description: t('auth.success.passwordUpdatedDesc'),
      });
      setShowUpdatePassword(false);
      navigate("/");
    }
  };

  const passwordStrength = getPasswordStrength(signUpForm.password);
  const strengthColors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = [
    t('auth.passwordStrength.veryWeak'),
    t('auth.passwordStrength.weak'),
    t('auth.passwordStrength.medium'),
    t('auth.passwordStrength.strong'),
    t('auth.passwordStrength.veryStrong')
  ];

  // Show MFA verification screen
  if (showMFAVerification) {
    return (
      <MFAVerification 
        onSuccess={() => {
          toast({
            title: t('auth.mfaVerificationSuccess'),
            description: t('auth.success.loginDesc'),
          });
          navigate("/");
        }}
        onBack={() => {
          setShowMFAVerification(false);
          supabase.auth.signOut();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 pt-24 lg:pt-32 relative overflow-x-hidden">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row">
        {/* Left side - Form */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <Card className="bg-white border border-gray-200 shadow-sm rounded-3xl w-full max-w-lg">
            <CardHeader className="text-center pb-6 pt-4 px-6">
              <div className="flex justify-center mb-4">
                <Logo variant="dark" className="h-10 w-auto" />
              </div>
              <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
                B-Reserve
              </CardTitle>
              <CardDescription className="text-gray-600">
                {t('auth.yourAgency')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-6 pb-8">
            <AnimatePresence mode="wait">
              {showUpdatePassword ? (
                <div key="update-password">
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nouveau mot de passe
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={updateForm.password}
                        onChange={(e) => setUpdateForm({ ...updateForm, password: e.target.value })}
                        className="h-11 border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmer le mot de passe
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={updateForm.confirmPassword}
                        onChange={(e) => setUpdateForm({ ...updateForm, confirmPassword: e.target.value })}
                        className="h-11 border-gray-300 rounded-md"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors" 
                      disabled={loading}
                    >
                      {loading ? t('common.loading') : t('auth.updateBtn')}
                    </Button>
                  </form>
                </div>
              ) : showResetPassword ? (
                <div key="reset-password" className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowResetPassword(false)}
                    className="mb-4 text-gray-600 hover:text-gray-900"
                  >
                    ← Retour à la connexion
                  </Button>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={resetForm.email}
                        onChange={(e) => setResetForm({ email: e.target.value })}
                        className="h-11 border-gray-300 rounded-md"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors" 
                      disabled={loading}
                    >
                      {loading ? t('common.loading') : t('auth.resetPasswordBtn')}
                    </Button>
                  </form>
                </div>
              ) : (
                <div key="main-form">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 h-11 bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger 
                        value="signin"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-sm font-medium text-gray-700 data-[state=active]:text-gray-900"
                      >
                        Connexion
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-sm font-medium text-gray-700 data-[state=active]:text-gray-900"
                      >
                        Inscription
                      </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                      <TabsContent value="signin" className="mt-0">
                        <form onSubmit={handleSignIn} className="space-y-5">
                          <AnimatedFormField
                            label={t('auth.email')}
                            name="signin-email"
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            icon={<Mail className="w-4 h-4" />}
                            error={signInErrors.email}
                            value={signInForm.email}
                            onChange={(val) => setSignInForm({ ...signInForm, email: val })}
                          />
                          
                          <AnimatedFormField
                            label={t('auth.password')}
                            name="signin-password"
                            type="password"
                            placeholder="••••••••"
                            icon={<Lock className="w-4 h-4" />}
                            error={signInErrors.password}
                            value={signInForm.password}
                            onChange={(val) => setSignInForm({ ...signInForm, password: val })}
                            showPasswordToggle
                          />
                          
                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center space-x-2 cursor-pointer group">
                              <Checkbox
                                id="remember-me"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked === true)}
                                className="transition-all data-[state=checked]:bg-primary"
                              />
                              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{t('auth.rememberMe')}</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowResetPassword(true)}
                              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                            >
                              Mot de passe oublié ?
                            </button>
                          </div>
                          
                          <Button 
                            type="submit" 
                            className="w-full h-12 gradient-primary hover:shadow-primary hover:scale-[1.02] text-white font-medium rounded-xl transition-all duration-300 shadow-lg mt-2" 
                            disabled={loading}
                          >
                            {loading ? t('common.loading') : t('auth.loginNow')}
                          </Button>
                          
                          <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-4 bg-white text-gray-500">ou continuer avec</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-11 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors rounded-xl"
                              disabled={loading}
                              onClick={handleGoogleSignIn}
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-11 border-gray-300 hover:border-gray-400 hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition-colors rounded-xl"
                              disabled={loading}
                              onClick={() => toast({ title: t('common.info'), description: t('auth.facebookComingSoon') })}
                            >
                              <Facebook className="h-5 w-5 text-[#1877F2]" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-11 border-gray-300 hover:border-gray-400 hover:bg-black/5 hover:text-black transition-colors rounded-xl dark:hover:bg-white/10 dark:hover:text-white"
                              disabled={loading}
                              onClick={() => toast({ title: t('common.info'), description: t('auth.appleComingSoon') })}
                            >
                              <Apple className="h-5 w-5 text-black dark:text-white" />
                            </Button>
                          </div>

                          <div className="text-center pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowOtpLogin(!showOtpLogin);
                                setOtpSent(false);
                                setOtpEmail("");
                                setOtpCode("");
                              }}
                              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1.5"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              {showOtpLogin ? "Revenir à la connexion par mot de passe" : "Se connecter sans mot de passe (code par email)"}
                            </button>
                          </div>
                        </form>

                        <AnimatePresence>
                          {showOtpLogin && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              {!otpSent ? (
                                <form onSubmit={handleSendOtp} className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                                  <AnimatedFormField
                                    label="Adresse email"
                                    name="otp-email"
                                    type="email"
                                    placeholder={t('auth.emailPlaceholder')}
                                    icon={<Mail className="w-4 h-4" />}
                                    value={otpEmail}
                                    onChange={(val) => setOtpEmail(val)}
                                  />
                                  <Button
                                    type="submit"
                                    className="w-full h-11 rounded-xl"
                                    variant="outline"
                                    disabled={otpLoading || !otpEmail.trim()}
                                  >
                                    {otpLoading ? t('common.loading') : "Envoyer le code"}
                                  </Button>
                                </form>
                              ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-sm text-gray-600">
                                    Entrez le code à 6 chiffres envoyé à <strong>{otpEmail}</strong>
                                  </p>
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="123456"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                    className="h-12 text-center text-2xl tracking-[0.5em] rounded-xl"
                                  />
                                  <Button
                                    type="submit"
                                    className="w-full h-11 gradient-primary text-white rounded-xl"
                                    disabled={otpLoading || otpCode.length !== 6}
                                  >
                                    {otpLoading ? t('common.loading') : "Vérifier et se connecter"}
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => setOtpSent(false)}
                                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                                  >
                                    Renvoyer à une autre adresse
                                  </button>
                                </form>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </TabsContent>

                      <TabsContent value="signup" className="mt-0">
                        <form onSubmit={handleSignUp} className="space-y-5">
                          <AnimatedFormField
                            label={t('auth.fullName')}
                            name="signup-name"
                            type="text"
                            placeholder={t('auth.namePlaceholder')}
                            icon={<User className="w-4 h-4" />}
                            error={signUpErrors.fullName}
                            value={signUpForm.fullName}
                            onChange={(val) => setSignUpForm({ ...signUpForm, fullName: val })}
                          />
                          
                          <AnimatedFormField
                            label={t('auth.email')}
                            name="signup-email"
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            icon={<Mail className="w-4 h-4" />}
                            error={signUpErrors.email}
                            value={signUpForm.email}
                            onChange={(val) => setSignUpForm({ ...signUpForm, email: val })}
                          />
                          
                          <AnimatedFormField
                            label={t('auth.password')}
                            name="signup-password"
                            type="password"
                            placeholder="••••••••"
                            icon={<Lock className="w-4 h-4" />}
                            error={signUpErrors.password}
                            value={signUpForm.password}
                            onChange={(val) => setSignUpForm({ ...signUpForm, password: val })}
                            showPasswordToggle
                          />
                          
                          <AnimatePresence>
                            {signUpForm.password && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-1 pb-2 space-y-2 overflow-hidden"
                              >
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500">{t('auth.passwordStrengthLabel')}</span>
                                  <span className={`font-medium ${passwordStrength > 2 ? 'text-green-600' : 'text-orange-500'}`}>
                                    {strengthLabels[passwordStrength]}
                                  </span>
                                </div>
                                <div className="flex gap-1 h-1.5">
                                  {[...Array(5)].map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`flex-1 rounded-full transition-all duration-500 ${
                                        i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          <div className="flex items-start space-x-3 pt-2">
                            <Checkbox
                              id="accept-terms"
                              checked={acceptTerms}
                              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                              className="mt-1 data-[state=checked]:bg-primary"
                            />
                            <label htmlFor="accept-terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                              J'accepte les{" "}
                              <a href="/terms" target="_blank" className="text-primary font-medium hover:underline">
                                Conditions Générales
                              </a>{" "}
                              et la{" "}
                              <a href="/privacy" target="_blank" className="text-primary font-medium hover:underline">
                                Politique de Confidentialité
                              </a>
                            </label>
                          </div>
                          {signUpErrors.terms && (
                            <p className="text-sm text-destructive font-medium">{signUpErrors.terms}</p>
                          )}
                          
                          <Button 
                            type="submit" 
                            className="w-full h-12 gradient-primary hover:shadow-primary hover:scale-[1.02] text-white font-medium rounded-xl transition-all duration-300 shadow-lg mt-2" 
                            disabled={loading}
                          >
                            {loading ? t('common.loading') : t('auth.createAccount')}
                          </Button>
                          
                          <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-4 bg-white text-gray-500">ou s'inscrire avec</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-11 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors rounded-xl"
                              disabled={loading}
                              onClick={handleGoogleSignIn}
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-11 border-gray-300 hover:border-gray-400 hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition-colors rounded-xl"
                              disabled={loading}
                              onClick={() => toast({ title: t('common.info'), description: t('auth.facebookComingSoon') })}
                            >
                              <Facebook className="h-5 w-5 text-[#1877F2]" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-11 border-gray-300 hover:border-gray-400 hover:bg-black/5 hover:text-black transition-colors rounded-xl dark:hover:bg-white/10 dark:hover:text-white"
                              disabled={loading}
                              onClick={() => toast({ title: t('common.info'), description: t('auth.appleComingSoon') })}
                            >
                              <Apple className="h-5 w-5 text-black dark:text-white" />
                            </Button>
                          </div>
                          
                          <p className="text-xs text-center text-gray-500 leading-relaxed px-2">
                            En vous inscrivant, vous acceptez nos{" "}
                            <a href="/terms" className="text-gray-700 hover:text-gray-900 font-medium underline-offset-2 hover:underline">conditions d'utilisation</a>
                            {" "}et notre{" "}
                            <a href="/privacy" className="text-gray-700 hover:text-gray-900 font-medium underline-offset-2 hover:underline">politique de confidentialité</a>
                          </p>
                        </form>
                      </TabsContent>
                    </AnimatePresence>
                  </Tabs>
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        
        {/* Back button at bottom */}
        <div className="mt-8 text-center w-full max-w-lg">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('auth.backToHome')}</span>
          </Button>
        </div>
        </div>

        {/* Right side - Image */}
        <div className="flex-1 hidden lg:flex items-center justify-center">
          <div className="relative w-full h-[550px] lg:h-[650px] rounded-3xl overflow-hidden shadow-xl">
            <img 
              src={bannerHotels}
              alt={t('auth.secureConnection')}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-gray-900/40 to-gray-900/60" />
            
            {/* Content overlay on image */}
            <div className="relative z-10 flex flex-col justify-center items-center h-full text-white p-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
                {activeTab === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}
              </h2>
              <p className="text-lg text-center text-white/90 max-w-md">
                {activeTab === "signin" 
                  ? "Connectez-vous pour accéder à des milliers de destinations et réserver vos prochains voyages."
                  : "Créez votre compte et découvrez un monde de possibilités de voyage à portée de clic."
                }
              </p>
              
              <div className="mt-8 grid grid-cols-3 gap-6 text-center">
                <div className="glass p-4 rounded-xl slide-up-fade" style={{ animationDelay: '0.1s' }}>
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-sm text-white/80">destinations</div>
                </div>
                <div className="glass p-4 rounded-xl slide-up-fade" style={{ animationDelay: '0.2s' }}>
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-sm text-white/80">sécurisé</div>
                </div>
                <div className="glass p-4 rounded-xl slide-up-fade" style={{ animationDelay: '0.3s' }}>
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-white/80">support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    </div>
  );
};

export default Auth;
