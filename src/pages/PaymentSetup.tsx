import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  Lock, 
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'bank_transfer';
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
  card_holder_name?: string;
  mobile_operator?: string;
  mobile_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  is_default: boolean;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export default function PaymentSetup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/subscriptions';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'card' | 'mobile_money' | 'bank_transfer'>('card');
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Côte d\'Ivoire'
  });
  
  const [paymentForm, setPaymentForm] = useState({
    card_number: '',
    card_expiry: '',
    card_cvv: '',
    card_holder_name: '',
    mobile_operator: 'mtn',
    mobile_number: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    is_default: false
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/login?redirectTo=/payment-setup');
        return;
      }
      
      setUser(user);
      
      // Charger le profil utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          country: profileData.country || 'Côte d\'Ivoire'
        });
      }
      
      // Charger les méthodes de paiement existantes
      const { data: paymentData, error: paymentError } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (paymentData) {
        setPaymentMethods(paymentData);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos informations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const supabase = createClient();
      
      const profileData = {
        user_id: user.id,
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        country: profileForm.country,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Succès',
        description: 'Votre profil a été mis à jour',
      });
      
      setCurrentStep(2);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder votre profil',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const savePaymentMethod = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const supabase = createClient();
      
      let paymentData: any = {
        user_id: user.id,
        type: selectedPaymentType,
        is_default: paymentForm.is_default || paymentMethods.length === 0,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      if (selectedPaymentType === 'card') {
        paymentData = {
          ...paymentData,
          card_number: paymentForm.card_number.replace(/\s/g, ''),
          card_expiry: paymentForm.card_expiry,
          card_holder_name: paymentForm.card_holder_name,
          // Ne pas stocker le CVV en clair
        };
      } else if (selectedPaymentType === 'mobile_money') {
        paymentData = {
          ...paymentData,
          mobile_operator: paymentForm.mobile_operator,
          mobile_number: paymentForm.mobile_number
        };
      } else if (selectedPaymentType === 'bank_transfer') {
        paymentData = {
          ...paymentData,
          bank_name: paymentForm.bank_name,
          bank_account_number: paymentForm.bank_account_number,
          bank_account_name: paymentForm.bank_account_name
        };
      }
      
      const { error } = await supabase
        .from('user_payment_methods')
        .insert(paymentData);
      
      if (error) throw error;
      
      toast({
        title: 'Succès',
        description: 'Votre méthode de paiement a été ajoutée',
      });
      
      // Recharger les méthodes de paiement
      const { data: newPaymentMethods } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (newPaymentMethods) {
        setPaymentMethods(newPaymentMethods);
      }
      
      // Réinitialiser le formulaire
      setPaymentForm({
        card_number: '',
        card_expiry: '',
        card_cvv: '',
        card_holder_name: '',
        mobile_operator: 'mtn',
        mobile_number: '',
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
        is_default: false
      });
      
      setCurrentStep(3);
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter votre méthode de paiement',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || [];
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatCardNumber(e.target.value);
    setPaymentForm(prev => ({ ...prev, card_number: value }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatExpiry(e.target.value);
    setPaymentForm(prev => ({ ...prev, card_expiry: value }));
  };

  const completeSetup = () => {
    router.push(redirectTo);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Configuration du Paiement
          </h1>
          <p className="text-gray-600">
            Pour accéder aux abonnements, veuillez configurer votre profil et ajouter une méthode de paiement
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                <User className="w-4 h-4" />
              </div>
              <span className="ml-2 font-medium">Profil</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="ml-2 font-medium">Paiement</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="ml-2 font-medium">Terminé</span>
            </div>
          </div>
        </div>

        {/* Step 1: Profile */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informations Personnelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Dupont"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="jean.dupont@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+225 07 00 00 00 00"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Rue Principale, Abidjan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Abidjan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Côte d'Ivoire"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? 'Sauvegarde...' : 'Continuer'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Payment Method */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Méthode de Paiement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant={selectedPaymentType === 'card' ? 'default' : 'outline'}
                    onClick={() => setSelectedPaymentType('card')}
                    className="h-20 flex flex-col space-y-2"
                  >
                    <CreditCard className="w-6 h-6" />
                    <span>Carte Bancaire</span>
                  </Button>
                  <Button
                    variant={selectedPaymentType === 'mobile_money' ? 'default' : 'outline'}
                    onClick={() => setSelectedPaymentType('mobile_money')}
                    className="h-20 flex flex-col space-y-2"
                  >
                    <Smartphone className="w-6 h-6" />
                    <span>Mobile Money</span>
                  </Button>
                  <Button
                    variant={selectedPaymentType === 'bank_transfer' ? 'default' : 'outline'}
                    onClick={() => setSelectedPaymentType('bank_transfer')}
                    className="h-20 flex flex-col space-y-2"
                  >
                    <Shield className="w-6 h-6" />
                    <span>Virement Bancaire</span>
                  </Button>
                </div>

                <Separator />

                {/* Payment Form */}
                {selectedPaymentType === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="card_number">Numéro de carte</Label>
                      <Input
                        id="card_number"
                        value={paymentForm.card_number}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="card_expiry">Date d'expiration</Label>
                        <Input
                          id="card_expiry"
                          value={paymentForm.card_expiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="card_cvv">CVV</Label>
                        <Input
                          id="card_cvv"
                          type="password"
                          value={paymentForm.card_cvv}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, card_cvv: e.target.value }))}
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="card_holder_name">Nom du titulaire</Label>
                      <Input
                        id="card_holder_name"
                        value={paymentForm.card_holder_name}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, card_holder_name: e.target.value }))}
                        placeholder="JEAN DUPONT"
                      />
                    </div>
                  </div>
                )}

                {selectedPaymentType === 'mobile_money' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Opérateur</Label>
                      <Select
                        value={paymentForm.mobile_operator}
                        onValueChange={(value) => setPaymentForm(prev => ({ ...prev, mobile_operator: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mtn">MTN</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                          <SelectItem value="moov">Moov</SelectItem>
                          <SelectItem value="wave">Wave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="mobile_number">Numéro de téléphone</Label>
                      <Input
                        id="mobile_number"
                        value={paymentForm.mobile_number}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, mobile_number: e.target.value }))}
                        placeholder="+225 07 00 00 00 00"
                      />
                    </div>
                  </div>
                )}

                {selectedPaymentType === 'bank_transfer' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bank_name">Nom de la banque</Label>
                      <Input
                        id="bank_name"
                        value={paymentForm.bank_name}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="Ecobank, BIAO, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_account_number">Numéro de compte</Label>
                      <Input
                        id="bank_account_number"
                        value={paymentForm.bank_account_number}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, bank_account_number: e.target.value }))}
                        placeholder="12345678901234567890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_account_name">Nom du compte</Label>
                      <Input
                        id="bank_account_name"
                        value={paymentForm.bank_account_name}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, bank_account_name: e.target.value }))}
                        placeholder="JEAN DUPONT"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={paymentForm.is_default}
                    onCheckedChange={(checked) => setPaymentForm(prev => ({ ...prev, is_default: checked as boolean }))}
                  />
                  <Label htmlFor="is_default">Définir comme méthode de paiement par défaut</Label>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Sécurité garantie</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Vos informations de paiement sont cryptées et sécurisées conformément aux normes PCI-DSS.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Retour
                  </Button>
                  <Button onClick={savePaymentMethod} disabled={saving}>
                    {saving ? 'Sauvegarde...' : 'Continuer'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Configuration terminée !</h2>
                  <p className="text-gray-600">
                    Votre profil et votre méthode de paiement ont été configurés avec succès.
                    Vous pouvez maintenant accéder aux abonnements.
                  </p>
                  
                  {paymentMethods.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                      <h3 className="font-semibold mb-2">Méthodes de paiement configurées :</h3>
                      <div className="space-y-2">
                        {paymentMethods.map((method) => (
                          <div key={method.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              {method.type === 'card' && <CreditCard className="w-4 h-4" />}
                              {method.type === 'mobile_money' && <Smartphone className="w-4 h-4" />}
                              {method.type === 'bank_transfer' && <Shield className="w-4 h-4" />}
                              <span>
                                {method.type === 'card' && `**** **** **** ${method.card_number?.slice(-4)}`}
                                {method.type === 'mobile_money' && `${method.mobile_operator} - ${method.mobile_number}`}
                                {method.type === 'bank_transfer' && `${method.bank_name}`}
                              </span>
                            </div>
                            {method.is_default && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Par défaut</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button onClick={completeSetup} className="w-full md:w-auto">
                    Accéder aux abonnements
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
