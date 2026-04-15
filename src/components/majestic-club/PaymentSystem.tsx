import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download,
  Eye,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MajesticProtectedRoute } from './MajesticProtectedRoute';

interface Payment {
  id: string;
  user_id: string;
  payment_type: 'subscription' | 'service' | 'booking' | 'property';
  reference_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  stripe_payment_intent_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  payment_id?: string;
  transaction_type: 'payment' | 'refund' | 'credit';
  amount: number;
  currency: string;
  description: string;
  balance_after: number;
  metadata: Record<string, any>;
  created_at: string;
}

const PaymentSystem = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    date_range: 'all'
  });
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, [filters]);

  const loadPaymentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load payments with filters
      let paymentsQuery = supabase
        .from('majestic_payments' as any)
        .select('*')
        .eq('user_id', user.id);

      if (filters.status !== 'all') {
        paymentsQuery = paymentsQuery.eq('status', filters.status);
      }
      
      if (filters.type !== 'all') {
        paymentsQuery = paymentsQuery.eq('payment_type', filters.type);
      }

      if (filters.date_range !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.date_range) {
          case 'recent':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        paymentsQuery = paymentsQuery.gte('created_at', startDate.toISOString());
      }

      const { data: paymentsData, error: paymentsError } = await paymentsQuery
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('majestic_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;

      setPayments(paymentsData || []);
      setTransactions(transactionsData || []);

      // Calculate current balance
      const completedPayments = (paymentsData || []).filter(p => p.status === 'completed');
      const refunds = (transactionsData || []).filter(t => t.transaction_type === 'refund');
      const totalSpent = completedPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);
      setCurrentBalance(totalSpent - totalRefunded);

    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de paiement',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un montant valide',
        variant: 'destructive'
      });
      return;
    }

    setProcessingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const amount = parseFloat(addFundsAmount);
      
      // Create payment record
      const { data, error } = await supabase
        .from('majestic_payments')
        .insert({
          user_id: user.id,
          payment_type: 'subscription',
          amount: amount,
          currency: 'XOF',
          status: 'pending',
          payment_method: 'stripe',
          metadata: {
            type: 'wallet_topup',
            description: 'Ajout de fonds au portefeuille'
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Create Stripe payment intent
      const { data: paymentIntent, error: stripeError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'XOF',
          payment_method_types: ['card'],
          metadata: {
            user_id: user.id,
            payment_id: data.id
          }
        }
      });

      if (stripeError) throw stripeError;

      toast({
        title: 'Paiement initié',
        description: 'Redirection vers la page de paiement sécurisée...',
      });

      // Redirect to Stripe Checkout (in real implementation)
      // window.location.href = paymentIntent.checkout_url;
      
      setShowAddFundsModal(false);
      setAddFundsAmount('');
      loadPaymentData();
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de traiter le paiement',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'subscription': return <CreditCard className="w-4 h-4" />;
      case 'service': return <Zap className="w-4 h-4" />;
      case 'booking': return <Calendar className="w-4 h-4" />;
      case 'property': return <Home className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString('fr-FR')} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <MajesticProtectedRoute>
      <div className="min-h-screen bg-[#0A192F] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-serif text-[#F5F5F5] mb-2">Système de Paiement</h1>
                  <p className="text-[#F5F5F5]/80">
                    Gérez vos paiements et transactions en toute sécurité
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#D4AF37] font-medium mb-1">Solde du portefeuille</div>
                  <div className="text-3xl font-bold text-[#D4AF37]">
                    {formatAmount(currentBalance, 'XOF')}
                  </div>
                  <Button
                    onClick={() => setShowAddFundsModal(true)}
                    className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0 mt-2"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Ajouter des fonds
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-[#1E3A5F] bg-[#0A192F]/50">
              <CardHeader>
                <h3 className="text-lg font-serif text-[#F5F5F5]">Filtres</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-[#F5F5F5]/60 mb-2 block">Statut</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A192F] border-[#1E3A5F]">
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="processing">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="failed">Échoué</SelectItem>
                        <SelectItem value="refunded">Remboursé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-[#F5F5F5]/60 mb-2 block">Type</Label>
                    <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A192F] border-[#1E3A5F]">
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="subscription">Abonnement</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="booking">Réservation</SelectItem>
                        <SelectItem value="property">Propriété</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-[#F5F5F5]/60 mb-2 block">Période</Label>
                    <Select value={filters.date_range} onValueChange={(value) => setFilters(prev => ({ ...prev, date_range: value }))}>
                      <SelectTrigger className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A192F] border-[#1E3A5F]">
                        <SelectItem value="all">Toutes les périodes</SelectItem>
                        <SelectItem value="recent">7 derniers jours</SelectItem>
                        <SelectItem value="month">30 derniers jours</SelectItem>
                        <SelectItem value="year">Dernière année</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#0A192F]/50 border border-[#1E3A5F]">
                <TabsTrigger value="payments" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A192F]">
                  Paiements
                </TabsTrigger>
                <TabsTrigger value="transactions" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A192F]">
                  Transactions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="payments" className="mt-6">
                <Card className="border-[#1E3A5F] bg-[#0A192F]/50">
                  <CardHeader>
                    <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Historique des Paiements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {payments.length === 0 ? (
                      <div className="text-center py-12">
                        <CreditCard className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
                        <p className="text-[#F5F5F5]/60">Aucun paiement trouvé</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 border border-[#1E3A5F] rounded-lg hover:border-[#D4AF37]/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
                                {getPaymentTypeIcon(payment.payment_type)}
                              </div>
                              <div>
                                <h4 className="font-medium text-[#F5F5F5]">
                                  {payment.payment_type === 'subscription' ? 'Abonnement' :
                                   payment.payment_type === 'service' ? 'Service' :
                                   payment.payment_type === 'booking' ? 'Réservation' : 'Propriété'}
                                </h4>
                                <p className="text-sm text-[#F5F5F5]/60">
                                  {payment.metadata?.description || 'Paiement Majestic Club'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getStatusColor(payment.status)}>
                                    {payment.status === 'pending' ? 'En attente' :
                                     payment.status === 'processing' ? 'En cours' :
                                     payment.status === 'completed' ? 'Terminé' :
                                     payment.status === 'failed' ? 'Échoué' : 'Remboursé'}
                                  </Badge>
                                  <span className="text-xs text-[#F5F5F5]/40">
                                    {formatDate(payment.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-[#D4AF37]">
                                {formatAmount(payment.amount, payment.currency)}
                              </div>
                              <div className="text-xs text-[#F5F5F5]/40">
                                {payment.payment_method}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="mt-6">
                <Card className="border-[#1E3A5F] bg-[#0A192F]/50">
                  <CardHeader>
                    <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Historique des Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactions.length === 0 ? (
                      <div className="text-center py-12">
                        <TrendingUp className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
                        <p className="text-[#F5F5F5]/60">Aucune transaction trouvée</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {transactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-4 border border-[#1E3A5F] rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                transaction.transaction_type === 'payment' ? 'bg-red-100 text-red-600' :
                                transaction.transaction_type === 'refund' ? 'bg-green-100 text-green-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                {transaction.transaction_type === 'payment' ? <ArrowRight className="w-4 h-4" /> :
                                 transaction.transaction_type === 'refund' ? <ArrowRight className="w-4 h-4 rotate-180" /> :
                                 <TrendingUp className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className="font-medium text-[#F5F5F5]">{transaction.description}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-[#F5F5F5]/40">
                                    {formatDate(transaction.created_at)}
                                  </span>
                                  <span className="text-xs text-[#F5F5F5]/40">
                                    Solde après: {formatAmount(transaction.balance_after, 'XOF')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className={`text-xl font-bold ${
                              transaction.transaction_type === 'payment' ? 'text-red-400' :
                              transaction.transaction_type === 'refund' ? 'text-green-400' :
                              'text-blue-400'
                            }`}>
                              {transaction.transaction_type === 'payment' ? '-' : '+'}
                              {formatAmount(transaction.amount, transaction.currency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* Add Funds Modal */}
        <AnimatePresence>
          {showAddFundsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0A192F] border border-[#1E3A5F] rounded-2xl p-8 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-serif text-[#F5F5F5]">
                    Ajouter des Fonds
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddFundsModal(false)}
                    className="text-[#F5F5F5]/60 hover:text-[#F5F5F5]"
                  >
                    ×
                  </Button>
                </div>

                <form onSubmit={handleAddFunds} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-[#F5F5F5]">Montant (XOF)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1000"
                      step="1000"
                      placeholder="Entrez le montant à ajouter"
                      value={addFundsAmount}
                      onChange={(e) => setAddFundsAmount(e.target.value)}
                      className="bg-[#0A192F] border-[#1E3A5F] text-[#F5F5F5]"
                      required
                    />
                  </div>

                  <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-[#D4AF37]" />
                      <div>
                        <p className="text-sm text-[#D4AF37] font-medium">Paiement sécurisé</p>
                        <p className="text-xs text-[#F5F5F5]/60">
                          Vos informations de paiement sont protégées par un chiffrement de bout en bout
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddFundsModal(false)}
                      className="border-[#1E3A5F] text-[#F5F5F5] hover:bg-[#1E3A5F]"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={processingPayment}
                      className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F] border-0 flex-1"
                    >
                      {processingPayment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0A192F] border-t-transparent rounded-full animate-spin mr-2" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Ajouter {addFundsAmount ? formatAmount(parseFloat(addFundsAmount), 'XOF') : ''}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MajesticProtectedRoute>
  );
};

export default PaymentSystem;
