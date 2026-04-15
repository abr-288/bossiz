import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { 
  Rocket, 
  TestTube, 
  Wallet, 
  Smartphone, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Globe,
  Shield,
  Zap,
  Cpu,
  Cloud,
  Database,
  Wifi,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Activity,
  Server,
  Lock,
  Clock
} from "lucide-react";
import CinetPayService from "@/services/cinetpay";
import { motion, AnimatePresence } from "framer-motion";

interface TestResult {
  status: string;
  message: string;
  url: string;
  transaction_id: string;
  payment_status?: {
    status: string;
    amount: number;
    currency: string;
    payment_method: string;
    operator: string;
    payment_date: string;
  };
}

export default function ModernCinetPayTest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [testAmount, setTestAmount] = useState('327000');
  const [testCurrency, setTestCurrency] = useState('XOF');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CM_OM');
  const [phoneNumber, setPhoneNumber] = useState<string>('+22507');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');

  const cinetPayService = new CinetPayService();

  // Définition des méthodes de paiement disponibles
  const paymentMethods = [
    { 
      id: 'CM_OM', 
      name: 'Orange Money', 
      icon: Smartphone, 
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/30',
      description: 'Paiement mobile rapide'
    },
    { 
      id: 'CM_TMO', 
      name: 'MTN Money', 
      icon: Smartphone, 
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      description: 'Solution mobile MTN'
    },
    { 
      id: 'CM_MOOV', 
      name: 'Moov Money', 
      icon: Smartphone, 
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      description: 'Paiement Moov Africa'
    },
    { 
      id: 'CARD', 
      name: 'Carte bancaire', 
      icon: CreditCard, 
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      description: 'Visa/Mastercard'
    }
  ];

  const testPaymentInitiation = async () => {
    setLoading(true);
    try {
      const testData = {
        amount: parseFloat(testAmount) || 1000,
        currency: testCurrency,
        transaction_id: CinetPayService.generateTransactionId(),
        description: `Test de paiement CinetPay - ${paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}`,
        customer_name: 'Tech User',
        customer_email: 'tech@example.com',
        customer_phone: phoneNumber || '+225000000000',
        return_url: `${window.location.origin}/payment-success`,
        notify_url: `${window.location.origin}/api/cinetpay/notify`,
        channels: [selectedPaymentMethod] // Utiliser uniquement le canal sélectionné
      };

      // Validation des données
      const validationErrors = CinetPayService.validatePaymentData(testData);
      if (validationErrors.length > 0) {
        toast({
          title: 'Erreur de validation',
          description: validationErrors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      const response = await cinetPayService.initiatePayment(testData);
      
      setTransactionId(response.transaction_id);
      setPaymentUrl(response.payment_url);
      setTestResults({
        status: response.status,
        message: response.message,
        url: response.payment_url,
        transaction_id: response.transaction_id
      });

      toast({
        title: 'Test réussi !',
        description: 'URL de paiement générée avec succès',
      });

    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: 'Erreur de test',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testStatusCheck = async () => {
    if (!transactionId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez d\'abord tester l\'initiation de paiement',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const status = await cinetPayService.checkPaymentStatus(transactionId);
      
      setTestResults(prev => prev ? {
        ...prev,
        payment_status: {
          status: status.status,
          amount: status.amount,
          currency: status.currency,
          payment_method: status.payment_method,
          operator: status.operator,
          payment_date: status.payment_date || new Date().toISOString()
        }
      } : null);

      toast({
        title: 'Statut vérifié',
        description: `Statut: ${status.status}`,
      });

    } catch (error: any) {
      console.error('Status check error:', error);
      toast({
        title: 'Erreur de vérification',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openPaymentPage = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  const copyPaymentUrl = () => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl);
      toast({
        title: 'URL copiée',
        description: 'L\'URL de paiement a été copiée dans le presse-papiers',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-20 left-20 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rocket className="w-8 h-8 text-orange-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
              Laboratoire CinetPay
            </h1>
            <TestTube className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-xl text-gray-300">
            Plateforme de test avancée pour les paiements technologiques
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Configuration */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-xl"></div>
              
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500"
                  >
                    <TestTube className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Configuration Test</h2>
                    <p className="text-gray-400">Paramètres avancés de test</p>
                  </div>
                </div>

                <Badge className="mb-6 bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 text-sm font-bold">
                  <Activity className="w-4 h-4 mr-2" />
                  Mode Sandbox Activé
                </Badge>

                {/* Test Parameters */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-white">Montant de test</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Input
                          type="number"
                          value={testAmount}
                          onChange={(e) => setTestAmount(e.target.value)}
                          className="bg-slate-900/50 border-gray-600 text-white"
                          placeholder="1000"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                          XOF
                        </div>
                      </div>
                      <div className="flex items-center justify-center p-3 bg-slate-900/50 rounded-lg border border-gray-600">
                        <span className="text-cyan-400 font-medium">
                          {parseFloat(testAmount) / 655.957} EUR
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-white">Devise</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {['XOF', 'EUR'].map((currency) => (
                        <motion.div
                          key={currency}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setTestCurrency(currency)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            testCurrency === currency 
                              ? 'border-orange-500 bg-orange-500/10' 
                              : 'border-gray-600 bg-slate-900/50'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-medium text-white">{currency}</div>
                            <div className="text-xs text-gray-400">
                              {currency === 'XOF' ? 'FCFA' : 'Euro'}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-white flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Moyen de Paiement
                    </Label>
                    <RadioGroup 
                      value={selectedPaymentMethod} 
                      onValueChange={setSelectedPaymentMethod}
                      className="space-y-3"
                    >
                      {paymentMethods.map((method) => (
                        <motion.div
                          key={method.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            selectedPaymentMethod === method.id 
                              ? `${method.border} ${method.bg}` 
                              : 'border-gray-600 bg-slate-900/50'
                          }`}>
                            <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                            <Label htmlFor={method.id} className="flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-3">
                                <motion.div
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.bg}`}
                                >
                                  <method.icon className={`w-5 h-5 ${method.color}`} />
                                </motion.div>
                                <div>
                                  <div className="font-medium text-white">{method.name}</div>
                                  <div className="text-sm text-gray-400">{method.description}</div>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 ${
                                selectedPaymentMethod === method.id 
                                  ? `border-${method.color.split('-')[1]}-400 bg-${method.color.split('-')[1]}-400/20` 
                                  : 'border-gray-500'
                              }`}>
                                {selectedPaymentMethod === method.id && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`w-2 h-2 rounded-full bg-${method.color.split('-')[1]}-400 mx-auto mt-1.5`}
                                  />
                                )}
                              </div>
                            </Label>
                          </div>
                        </motion.div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Phone Number Input for Mobile Payments */}
                  {selectedPaymentMethod !== 'CARD' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-3"
                    >
                      <Label className="text-sm font-medium text-white flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Numéro de Téléphone
                      </Label>
                      <div className="relative">
                        <Input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="bg-slate-900/50 border-gray-600 text-white pl-12"
                          placeholder="+22507XXXXXXXX"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Smartphone className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Format: +22507XXXXXXXX pour les numéros CI
                      </div>
                    </motion.div>
                  )}

                  {/* Credit Card Input Fields */}
                  {selectedPaymentMethod === 'CARD' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-4"
                    >
                      <Label className="text-sm font-medium text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Informations de Carte Bancaire
                      </Label>
                      
                      {/* Card Number */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Numéro de carte</Label>
                        <div className="relative">
                          <Input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="bg-slate-900/50 border-gray-600 text-white pl-12"
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <CreditCard className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Card Name and Expiry */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-400">Nom du titulaire</Label>
                          <Input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="bg-slate-900/50 border-gray-600 text-white"
                            placeholder="JOHN DOE"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-400">MM/AA</Label>
                          <Input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="bg-slate-900/50 border-gray-600 text-white"
                            placeholder="12/25"
                            maxLength={5}
                          />
                        </div>
                      </div>

                      {/* CVV */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">CVV</Label>
                        <div className="relative">
                          <Input
                            type="text"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="bg-slate-900/50 border-gray-600 text-white pr-12"
                            placeholder="123"
                            maxLength={4}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <Shield className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400">
                        <div className="flex items-center gap-2 mb-1">
                          <Lock className="w-3 h-3" />
                          <span>Paiement 100% sécurisé</span>
                        </div>
                        <div>VISA, Mastercard, American Express acceptées</div>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl"
                  >
                    <div className="flex items-center gap-3 text-cyan-400 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Méthode sélectionnée</span>
                    </div>
                    <div className="text-white">
                      {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Canal: {selectedPaymentMethod}
                    </div>
                    {selectedPaymentMethod !== 'CARD' ? (
                      <div className="text-sm text-gray-400 mt-1">
                        Téléphone: {phoneNumber || 'Non spécifié'}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 mt-1">
                        Carte: **** **** **** {cardNumber?.slice(-4) || '****'}
                      </div>
                    )}
                  </motion.div>

                  {/* Tech Features */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Server className="w-5 h-5" />
                      <span className="text-sm">API Sandbox</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-400">
                      <Cloud className="w-5 h-5" />
                      <span className="text-sm">Cloud Sync</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-400">
                      <Wifi className="w-5 h-5" />
                      <span className="text-sm">Real-time</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-400">
                      <Database className="w-5 h-5" />
                      <span className="text-sm">Secure Storage</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        onClick={testPaymentInitiation}
                        disabled={loading}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-lg"
                      >
                        {loading ? (
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                            <span>Test en cours...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <AnimatePresence mode="wait">
                              {isHovered ? (
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                >
                                  <Rocket className="w-5 h-5" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                >
                                  <TestTube className="w-5 h-5" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <span>Lancer le Test</span>
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        )}
                      </Button>
                    </motion.div>

                    <Button 
                      onClick={testStatusCheck}
                      disabled={loading || !transactionId}
                      variant="outline"
                      className="w-full h-12 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Vérifier le Statut
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Test Results */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
              
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-400 to-purple-500"
                  >
                    <Activity className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Résultats du Test</h2>
                    <p className="text-gray-400">Analyse en temps réel</p>
                  </div>
                </div>

                {testResults ? (
                  <div className="space-y-6">
                    {/* Success Status */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl"
                    >
                      <div className="flex items-center gap-3 text-green-400 mb-4">
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="font-bold text-lg">Test Réussi</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Statut:</span>
                          <span className="text-white font-medium">{testResults.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Transaction ID:</span>
                          <span className="text-cyan-400 font-mono text-sm">{testResults.transaction_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Message:</span>
                          <span className="text-white font-medium">{testResults.message}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Payment URL */}
                    {paymentUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                      >
                        <Label className="text-sm font-medium text-white">URL de Paiement</Label>
                        <div className="p-4 bg-slate-900/50 border border-gray-600 rounded-xl">
                          <code className="text-xs text-cyan-400 break-all">{paymentUrl}</code>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              onClick={openPaymentPage}
                              variant="outline"
                              size="sm"
                              className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/10"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ouvrir
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              onClick={copyPaymentUrl}
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-500 text-gray-400 hover:bg-gray-500/10"
                            >
                              Copier l'URL
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {/* Payment Status */}
                    {testResults.payment_status && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl"
                      >
                        <div className="flex items-center gap-3 text-blue-400 mb-4">
                          <Activity className="w-6 h-6" />
                          <span className="font-bold text-lg">Statut du Paiement</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Statut:</span>
                            <span className="text-white font-medium">{testResults.payment_status.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Montant:</span>
                            <span className="text-cyan-400 font-medium">
                              {testResults.payment_status.amount} {testResults.payment_status.currency}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Méthode:</span>
                            <span className="text-white font-medium">{testResults.payment_status.payment_method}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Opérateur:</span>
                            <span className="text-white font-medium">{testResults.payment_status.operator}</span>
                          </div>
                          {testResults.payment_status.payment_date && (
                            <div className="flex justify-between">
                              <span className="text-gray-300">Date:</span>
                              <span className="text-white font-medium">{testResults.payment_status.payment_date}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 mx-auto mb-4"
                    >
                      <TestTube className="w-full h-full text-gray-500" />
                    </motion.div>
                    <p className="text-gray-400 mb-4">Prêt pour le test</p>
                    <p className="text-sm text-gray-500">Configurez les paramètres et lancez le test</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Payment Methods Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-cyan-500/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-slate-800/30 backdrop-blur-xl border border-gray-700 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
                <Wallet className="w-6 h-6 text-orange-400" />
                Méthodes de Paiement Supportées
                <Globe className="w-6 h-6 text-cyan-400" />
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Orange Money', icon: Smartphone, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
                  { name: 'MTN Money', icon: Smartphone, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
                  { name: 'Moov Money', icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
                  { name: 'Carte bancaire', icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' }
                ].map((method, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`p-4 ${method.bg} ${method.border} border rounded-2xl text-center`}
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="w-12 h-12 mx-auto mb-3 flex items-center justify-center"
                    >
                      <method.icon className={`w-6 h-6 ${method.color}`} />
                    </motion.div>
                    <div className={`font-medium text-white text-sm`}>{method.name}</div>
                    <div className="text-xs text-gray-400 mt-1">Instantané</div>
                  </motion.div>
                ))}
              </div>

              {/* Tech Stats */}
              <div className="mt-8 flex items-center justify-center gap-8 text-gray-400">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm">Ultra-rapide</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm">100% Sécurisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">Temps réel</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">Optimisé</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => navigate('/subscriptions')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Abonnements
            </Button>
            <Button 
              onClick={() => navigate('/plans-debug')}
              variant="outline"
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/10"
            >
              <Database className="w-4 h-4 mr-2" />
              Debug Plans
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:from-orange-600 hover:to-cyan-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
