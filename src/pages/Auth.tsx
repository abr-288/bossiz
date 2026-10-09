import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Lock, Mail, User, ArrowLeft } from "lucide-react";
import { MFAVerification } from "@/components/MFAVerification";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import bannerHotels from "@/assets/ordinateur.jpg";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import AnimatedFormField from "@/components/forms/AnimatedFormField";
import {
  signUpSchema,
  signInSchema,
  updatePasswordSchema,
  validateForm,
  getPasswordStrength,
} from "@/lib/authValidation";
import { passwordErrorMessage } from "@/lib/passwordErrors";

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Form states
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({ fullName: "", email: "", password: "" });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [updateForm, setUpdateForm] = useState({ password: "", confirmPassword: "" });
  
  // Error states
  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
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

    if (error && !error.message.includes("already registered")) {
      toast({
        title: t('auth.errors.signupError'),
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Same success message whether the signup just happened or the email was
    // already registered — revealing the difference would let anyone probe
    // which emails have an account (user enumeration).
    toast({
      title: t('auth.success.signup'),
      description: t('auth.success.signupDesc'),
    });
    setSignUpForm({ fullName: "", email: "", password: "" });
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
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
        description: passwordErrorMessage(t, error),
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
  const strengthColors = ["bg-destructive", "bg-gold", "bg-gold", "bg-lime-500", "bg-success"];
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 pt-24 lg:pt-32 relative overflow-x-hidden">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row">
        {/* Left side - Form */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <Card className="bg-card border border-border shadow-sm rounded-3xl w-full max-w-lg">
            <CardHeader className="text-center pb-6 pt-4 px-6">
              <CardDescription className="text-muted-foreground">
                {t('auth.yourAgency')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-6 pb-8">
            <AnimatePresence mode="wait">
              {showUpdatePassword ? (
                <div key="update-password">
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t("ux.auth.newPassword")}
                      </label>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={updateForm.password}
                        onChange={(e) => setUpdateForm({ ...updateForm, password: e.target.value })}
                        className="h-11 border-input rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t("ux.auth.confirmPassword")}
                      </label>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={updateForm.confirmPassword}
                        onChange={(e) => setUpdateForm({ ...updateForm, confirmPassword: e.target.value })}
                        className="h-11 border-input rounded-md"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-colors" 
                      disabled={loading}
                    >
                      {loading ? t('common.loading') : t('auth.updateBtn')}
                    </Button>
                  </form>
                </div>
              ) : (
                <div key="main-form">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 h-11 bg-muted p-1 rounded-xl">
                      <TabsTrigger 
                        value="signin"
                        className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg text-sm font-medium text-foreground data-[state=active]:text-foreground"
                      >
                        {t("ux.auth.signIn")}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup"
                        className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg text-sm font-medium text-foreground data-[state=active]:text-foreground"
                      >
                        {t("ux.auth.signUp")}
                      </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                      <TabsContent value="signin" className="mt-0">
                        <form onSubmit={handleSignIn} className="space-y-5">
                          <AnimatedFormField
                            label={t('auth.email')}
                            name="signin-email"
                            type="email"
                            autoComplete="email"
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
                            autoComplete="current-password"
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
                              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('auth.rememberMe')}</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => navigate("/forgot-password")}
                              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                            >
                              {t("ux.auth.forgot")}
                            </button>
                          </div>
                          
                          <Button 
                            type="submit" 
                            className="w-full h-12 gradient-primary hover:shadow-primary hover:scale-[1.02] text-white font-medium rounded-xl transition-all duration-slow ease-standard shadow-lg mt-2" 
                            disabled={loading}
                          >
                            {loading ? t('common.loading') : t('auth.loginNow')}
                          </Button>
                          
                          <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-4 bg-card text-muted-foreground">{t("ux.auth.orContinue")}</span>
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 border-input hover:border-foreground/40 hover:bg-muted transition-colors rounded-xl flex items-center justify-center gap-2"
                            disabled={loading}
                            onClick={handleGoogleSignIn}
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>Google</span>
                          </Button>
                        </form>
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
                            autoComplete="email"
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
                            autoComplete="new-password"
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
                                  <span className="text-muted-foreground">{t('auth.passwordStrengthLabel')}</span>
                                  <span className={`font-medium ${passwordStrength > 2 ? 'text-success' : 'text-warning-foreground'}`}>
                                    {strengthLabels[passwordStrength]}
                                  </span>
                                </div>
                                <div className="flex gap-1 h-1.5">
                                  {[...Array(5)].map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`flex-1 rounded-full transition-all duration-slow ease-standard ${
                                        i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-muted'
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
                            <label htmlFor="accept-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                              {t("ux.auth.iAccept")}{" "}
                              <a href="/terms" target="_blank" className="text-primary font-medium hover:underline">
                                {t("ux.auth.terms")}
                              </a>{" "}
                              {t("ux.auth.andThe")}{" "}
                              <a href="/privacy" target="_blank" className="text-primary font-medium hover:underline">
                                {t("ux.auth.privacy")}
                              </a>
                            </label>
                          </div>
                          {signUpErrors.terms && (
                            <p className="text-sm text-destructive font-medium">{signUpErrors.terms}</p>
                          )}
                          
                          <Button 
                            type="submit" 
                            className="w-full h-12 gradient-primary hover:shadow-primary hover:scale-[1.02] text-white font-medium rounded-xl transition-all duration-slow ease-standard shadow-lg mt-2" 
                            disabled={loading}
                          >
                            {loading ? t('common.loading') : t('auth.createAccount')}
                          </Button>
                          
                          <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-4 bg-card text-muted-foreground">{t("ux.auth.orSignUp")}</span>
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 border-input hover:border-foreground/40 hover:bg-muted transition-colors rounded-xl flex items-center justify-center gap-2"
                            disabled={loading}
                            onClick={handleGoogleSignIn}
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>Google</span>
                          </Button>

                          <p className="text-xs text-center text-muted-foreground leading-relaxed px-2">
                            {t("ux.auth.byRegistering")}{" "}
                            <a href="/terms" className="text-foreground hover:text-foreground font-medium underline-offset-2 hover:underline">{t("ux.auth.termsOfUse")}</a>
                            {" "}{t("ux.auth.andOur")}{" "}
                            <a href="/privacy" className="text-foreground hover:text-foreground font-medium underline-offset-2 hover:underline">{t("ux.auth.privacyLower")}</a>
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
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
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
                  ? t("ux.auth.heroSignIn")
                  : t("ux.auth.heroSignUp")
                }
              </p>
              
              <div className="mt-8 grid grid-cols-3 gap-6 text-center">
                <div className="glass p-4 rounded-xl slide-up-fade" style={{ animationDelay: '0.1s' }}>
                  <div className="text-2xl font-bold">Multi</div>
                  <div className="text-sm text-white/80">{t("ux.auth.statDestinations")}</div>
                </div>
                <div className="glass p-4 rounded-xl slide-up-fade" style={{ animationDelay: '0.2s' }}>
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-sm text-white/80">{t("ux.auth.statSecure")}</div>
                </div>
                <div className="glass p-4 rounded-xl slide-up-fade" style={{ animationDelay: '0.3s' }}>
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-white/80">{t("ux.auth.statSupport")}</div>
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
