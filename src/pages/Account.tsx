import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, Phone, Lock, Bell, CreditCard, Heart, MapPin, Calendar, Eye, EyeOff, Check, X, Loader2, Shield, Save, Trash2, ChevronRight, TrendingDown } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { TwoFactorAuth } from "@/components/TwoFactorAuth";
import { PhoneNumberInput } from "@/components/PhoneNumberInput";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { getProfilePhotoUrl, getUserPhotoFromMetadata, notifyProfileUpdated } from "@/lib/profilePhoto";
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
import { z } from "zod";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { MOTION } from "@/lib/motion";
import { passwordErrorMessage } from "@/lib/passwordErrors";

// Validation schemas (messages traduits : construits avec la fonction t courante)
const createProfileSchema = (t: TFunction) => z.object({
  full_name: z.string()
    .min(2, t("ux.account.errNameMin"))
    .max(100, t("ux.account.errNameMax"))
    .regex(/^[a-zA-ZÀ-ÿ\s'-]*$/, t("ux.account.errNameChars"))
    .or(z.literal("")),
  phone: z.string()
    .refine((val) => val === "" || /^(\+?\d{1,3}[\s-]?)?\d{8,15}$/.test(val.replace(/\s/g, "")), {
      message: t("ux.account.errPhone")
    }),
});

const createPasswordSchema = (t: TFunction) => z.object({
  currentPassword: z.string().min(1, t("ux.account.errCurrentPwd")),
  newPassword: z.string()
    .min(8, t("ux.account.errPwdMin"))
    .regex(/[A-Z]/, t("ux.account.errPwdUpper"))
    .regex(/[a-z]/, t("ux.account.errPwdLower"))
    .regex(/[0-9]/, t("ux.account.errPwdDigit")),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: t("ux.account.errPwdMatch"),
  path: ["confirmPassword"],
});

const Account = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newsletter: true,
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("profile");

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile({
        full_name: profileData.full_name || "",
        phone: profileData.phone || "",
        avatar_url: profileData.avatar_url || getUserPhotoFromMetadata(session.user) || "",
      });
    }

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const validateProfile = () => {
    try {
      createProfileSchema(t).parse(profile);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !validateProfile()) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        avatar_url: profile.avatar_url || null,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error(t("ux.account.profileError"));
    } else {
      toast.success(t("ux.account.profileSaved"));
      notifyProfileUpdated();
    }
  };

  const validatePasswords = () => {
    try {
      createPasswordSchema(t).parse(passwords);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) return;

    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: passwords.newPassword,
    });

    setSaving(false);

    if (error) {
      toast.error(passwordErrorMessage(t, error));
    } else {
      toast.success(t("ux.account.pwdSaved"));
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || t("ux.account.deleteFailed"));

      toast.success(t("ux.account.deleted"));
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("ux.account.deleteError"));
    } finally {
      setDeletingAccount(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(passwords.newPassword);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="bg-primary/5 py-6 md:py-12 relative overflow-hidden rounded-lg">
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

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Header with Avatar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row items-center gap-6 mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-xl">
                  <AvatarImage src={getProfilePhotoUrl(profile.avatar_url)} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {getInitials(profile.full_name || user?.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  className="absolute -bottom-1 -right-1 bg-success w-6 h-6 rounded-full border-4 border-background"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div className="text-center md:text-left">
                <motion.h1 
                  className="text-3xl md:text-4xl font-bold bg-primary bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {profile.full_name || "MyBossiz"}
                </motion.h1>
                <motion.p 
                  className="text-muted-foreground mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {user?.email}
                </motion.p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-background/50 backdrop-blur-sm p-1">
                  {[
                    { value: "profile", icon: User, label: t("ux.account.tabProfile") },
                    { value: "security", icon: Lock, label: t("ux.account.tabSecurity") },
                    { value: "preferences", icon: Bell, label: t("ux.account.tabPreferences") },
                    { value: "payment", icon: CreditCard, label: t("ux.account.tabPayment") },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                    >
                      <tab.icon className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="profile">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: MOTION.slow }}
                    >
                      <Card className="backdrop-blur-sm bg-card/80 border-primary/10 shadow-xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            {t("ux.account.personalInfo")}
                          </CardTitle>
                          <CardDescription>
                            {t("ux.account.personalInfoDesc")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <ImageUpload
                            label={t("ux.account.photo")}
                            folder={`profile-avatars/${user?.id || ""}`}
                            value={profile.avatar_url}
                            onChange={(avatar_url) => setProfile((current) => ({ ...current, avatar_url }))}
                            accept="image/jpeg,image/png,image/webp"
                          />
                          <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <Label htmlFor="email">Email</Label>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={user?.email || ""}
                                disabled
                                className="flex-1 bg-muted/50"
                              />
                              <Shield className="h-4 w-4 text-success" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t("ux.account.emailLocked")}
                            </p>
                          </motion.div>

                          <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Label htmlFor="full_name">{t("ux.account.fullName")}</Label>
                            <Input
                              id="full_name"
                              value={profile.full_name}
                              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                              placeholder={t("ux.account.fullNamePlaceholder")}
                              className={errors.full_name ? "border-destructive" : ""}
                            />
                            {errors.full_name && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-destructive flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                {errors.full_name}
                              </motion.p>
                            )}
                          </motion.div>

                          <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Label htmlFor="phone">{t("ux.account.phone")}</Label>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <PhoneNumberInput
                                id="phone"
                                value={profile.phone}
                                onValueChange={(phone) => setProfile({ ...profile, phone })}
                                placeholder="XX XX XX XX XX"
                                className={`flex-1 ${errors.phone ? "border-destructive" : ""}`}
                              />
                            </div>
                            {errors.phone && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-destructive flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                {errors.phone}
                              </motion.p>
                            )}
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <Button 
                              onClick={handleUpdateProfile} 
                              className="w-full"
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              {t("ux.account.save")}
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                <TabsContent value="security">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: MOTION.slow }}
                      className="space-y-6"
                    >
                      {/* Two-Factor Authentication Section */}
                      <TwoFactorAuth />
                      
                      {/* Password Change Section */}
                      <Card className="backdrop-blur-sm bg-card/80 border-primary/10 shadow-xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" />
                            {t("ux.account.changePwdTitle")}
                          </CardTitle>
                          <CardDescription>
                            {t("ux.account.changePwdDesc")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <Label htmlFor="current_password">{t("ux.account.currentPwd")}</Label>
                            <div className="relative">
                              <Input
                                id="current_password"
                                type={showCurrentPassword ? "text" : "password"}
                                autoComplete="current-password"
                                value={passwords.currentPassword}
                                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                placeholder="••••••••"
                                className={errors.currentPassword ? "border-destructive pr-10" : "pr-10"}
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {errors.currentPassword && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-destructive flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                {errors.currentPassword}
                              </motion.p>
                            )}
                          </motion.div>

                          <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Label htmlFor="new_password">{t("ux.account.newPwd")}</Label>
                            <div className="relative">
                              <Input
                                id="new_password"
                                type={showNewPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                placeholder="••••••••"
                                className={errors.newPassword ? "border-destructive pr-10" : "pr-10"}
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {passwords.newPassword && (
                              <div className="space-y-2">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((level) => (
                                    <motion.div
                                      key={level}
                                      className={`h-1 flex-1 rounded-full ${
                                        passwordStrength >= level
                                          ? level <= 2
                                            ? "bg-destructive"
                                            : level <= 3
                                            ? "bg-gold"
                                            : "bg-success"
                                          : "bg-muted"
                                      }`}
                                      initial={{ scaleX: 0 }}
                                      animate={{ scaleX: passwordStrength >= level ? 1 : 0 }}
                                    />
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Force: {passwordStrength <= 2 ? "Faible" : passwordStrength <= 3 ? "Moyen" : "Fort"}
                                </p>
                              </div>
                            )}
                            {errors.newPassword && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-destructive flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                {errors.newPassword}
                              </motion.p>
                            )}
                          </motion.div>

                          <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Label htmlFor="confirm_password">{t("ux.account.confirmPwd")}</Label>
                            <div className="relative">
                              <Input
                                id="confirm_password"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={passwords.confirmPassword}
                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                                className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {passwords.confirmPassword && passwords.newPassword === passwords.confirmPassword && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-success flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" />
                                {t("ux.account.pwdMatch")}
                              </motion.p>
                            )}
                            {errors.confirmPassword && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-destructive flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                {errors.confirmPassword}
                              </motion.p>
                            )}
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <Button
                              onClick={handleChangePassword}
                              className="w-full"
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Lock className="mr-2 h-4 w-4" />
                              )}
                              {t("ux.account.changePwd")}
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>

                      {/* Danger Zone - RGPD account deletion */}
                      <Card className="backdrop-blur-sm bg-card/80 border-destructive/30 shadow-xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            {t("ux.account.deleteAccount")}
                          </CardTitle>
                          <CardDescription>
                            {t("ux.account.deleteDesc")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" disabled={deletingAccount}>
                                {deletingAccount ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                {t("ux.account.deleteAccount")}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("ux.account.areYouSure")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("ux.account.deleteConfirmDesc")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  {t("ux.account.confirmDelete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                <TabsContent value="preferences">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: MOTION.slow }}
                    >
                      <Card className="backdrop-blur-sm bg-card/80 border-primary/10 shadow-xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            {t("ux.account.commTitle")}
                          </CardTitle>
                          <CardDescription>
                            {t("ux.account.commDesc")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {[
                            {
                              key: "emailNotifications",
                              label: t("ux.account.emailNotif"),
                              description: t("ux.account.emailNotifDesc"),
                            },
                            {
                              key: "smsNotifications",
                              label: t("ux.account.smsNotif"),
                              description: t("ux.account.smsNotifDesc"),
                            },
                            {
                              key: "newsletter",
                              label: t("ux.account.newsletter"),
                              description: t("ux.account.newsletterDesc"),
                            },
                          ].map((pref, index) => (
                            <motion.div
                              key={pref.key}
                              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="space-y-1">
                                <Label>{pref.label}</Label>
                                <p className="text-sm text-muted-foreground">
                                  {pref.description}
                                </p>
                              </div>
                              <Switch
                                checked={preferences[pref.key as keyof typeof preferences]}
                                onCheckedChange={(checked) =>
                                  setPreferences({ ...preferences, [pref.key]: checked })
                                }
                              />
                            </motion.div>
                          ))}

                          <motion.div
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            onClick={() => navigate("/price-alerts")}
                          >
                            <div className="flex items-center gap-3">
                              <TrendingDown className="h-5 w-5 text-primary" />
                              <div className="space-y-1">
                                <Label className="cursor-pointer">{t("ux.account.priceAlerts")}</Label>
                                <p className="text-sm text-muted-foreground">
                                  {t("ux.account.priceAlertsDesc")}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <Button className="w-full" onClick={() => toast.success(t("ux.account.prefsSaved"))}>
                              <Save className="mr-2 h-4 w-4" />
                              {t("ux.account.savePrefs")}
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                <TabsContent value="payment">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: MOTION.slow }}
                    >
                      <Card className="backdrop-blur-sm bg-card/80 border-primary/10 shadow-xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            {t("ux.account.paymentTitle")}
                          </CardTitle>
                          <CardDescription>
                            {t("ux.account.paymentDesc")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <motion.div 
                            className="text-center py-8"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            <motion.div
                              animate={{ 
                                y: [0, -10, 0],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                            >
                              <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            </motion.div>
                            <p className="text-lg font-medium mb-2">{t("ux.account.noCard")}</p>
                            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                              {t("ux.account.noCardDesc")}
                            </p>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
              </Tabs>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {[
                { icon: Calendar, title: t("ux.account.myBookings"), subtitle: t("ux.account.seeHistory"), href: "/booking-history", comingSoon: false },
                { icon: Heart, title: t("ux.account.myFavorites"), subtitle: t("ux.account.comingSoon"), href: "#", comingSoon: true },
                { icon: MapPin, title: t("ux.account.myDestinations"), subtitle: t("ux.account.comingSoon"), href: "#", comingSoon: true },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  whileHover={item.comingSoon ? undefined : { scale: 1.02, y: -5 }}
                  whileTap={item.comingSoon ? undefined : { scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Card
                    className={`transition-all backdrop-blur-sm bg-card/80 border-primary/10 ${
                      item.comingSoon ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-xl"
                    }`}
                    onClick={() => !item.comingSoon && navigate(item.href)}
                  >
                    <CardContent className="pt-6 text-center">
                      <motion.div
                        whileHover={item.comingSoon ? undefined : { rotate: [0, -10, 10, 0] }}
                        transition={{ duration: MOTION.slow }}
                      >
                        <item.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      </motion.div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default Account;
