import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Clock, Shield, Star, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { autoConvertAndFormat } from '@/utils/currencyConverter';
import { useTranslation } from 'react-i18next';

interface OrderItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  trialDays: number;
  features: string[];
  discount?: number;
}

interface OrderSummary {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  paymentMethod: string;
  orderDate: string;
  orderId: string;
}

const OrderSummary = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [orderData, setOrderData] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');
  const planId = searchParams.get('planId');
  const billingCycle = searchParams.get('billingCycle') as 'monthly' | 'yearly' || 'monthly';

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        if (orderId) {
          // Récupérer les données depuis localStorage ou depuis une API
          const storedOrder = localStorage.getItem(`order_${orderId}`);
          if (storedOrder) {
            const order = JSON.parse(storedOrder);
            setOrderData(order);
          } else {
            // Générer des données de démonstration
            generateDemoOrder();
          }
        } else if (planId) {
          // Générer des données basées sur le planId
          generateDemoOrder();
        } else {
          throw new Error('Aucune commande trouvée');
        }
      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les détails de la commande',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, planId, navigate, toast]);

  const generateDemoOrder = () => {
    const plans: Record<string, OrderItem> = {
      'basic': {
        id: 'basic',
        name: 'Basic',
        description: 'Accès essentiel aux services Bossiz',
        price: 15000,
        currency: 'XOF',
        billingCycle,
        trialDays: billingCycle === 'yearly' ? 7 : 0,
        features: [
          'Assistance voyage 24/7',
          'Réservations vols/hôtels',
          'Support client dédié'
        ],
        discount: billingCycle === 'yearly' ? 17 : 0
      },
      'premium': {
        id: 'premium',
        name: 'Premium VIP',
        description: 'Services avancés et priorité',
        price: 25000,
        currency: 'XOF',
        billingCycle,
        trialDays: billingCycle === 'yearly' ? 14 : 0,
        features: [
          'Tout Basic +',
          'Accès lounges VIP',
          'Transferts premium',
          'Assurance voyage'
        ],
        discount: billingCycle === 'yearly' ? 17 : 0
      },
      'business': {
        id: 'business',
        name: 'Business',
        description: 'Solutions complètes pour voyageurs d\'affaires',
        price: 50000,
        currency: 'XOF',
        billingCycle,
        trialDays: billingCycle === 'yearly' ? 30 : 0,
        features: [
          'Tout Premium +',
          'Réservations espaces meeting',
          'Gestion dépenses',
          'Support business 24/7'
        ],
        discount: billingCycle === 'yearly' ? 17 : 0
      },
      'corporate': {
        id: 'corporate',
        name: 'Corporate',
        description: 'Solutions sur mesure pour entreprises',
        price: 100000,
        currency: 'XOF',
        billingCycle,
        trialDays: billingCycle === 'yearly' ? 60 : 0,
        features: [
          'Tout Business +',
          'Gestion multi-utilisateurs',
          'Reporting avancé',
          'Support dédié'
        ],
        discount: billingCycle === 'yearly' ? 17 : 0
      },
    };

    const selectedPlan = plans[planId || 'premium'] || plans['premium'];
    
    const monthlyPrice = selectedPlan.price;
    const yearlyPrice = monthlyPrice * 12 * 0.83; // 17% de réduction annuelle
    const price = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;
    const discount = selectedPlan.discount || 0;

    const order: OrderSummary = {
      items: [selectedPlan],
      subtotal: price,
      discount: discount > 0 ? (price / (1 - discount/100)) - price : 0,
      total: price,
      currency: 'XOF',
      customerInfo: {
        name: 'Client Bossiz',
        email: 'client@bossiz.com',
        phone: '+225000000000'
      },
      paymentMethod: 'CinetPay',
      orderDate: new Date().toISOString(),
      orderId: orderId || `BOSSIZ_${Date.now()}`
    };

    setOrderData(order);
  };

  const handlePrint = () => {
    if (!orderData) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Récapitulatif de Commande - Bossiz Conciergerie</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .order-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .item { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
              .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Récapitulatif de Commande</h1>
              <h2>Bossiz Conciergerie</h2>
            </div>
            <div class="order-info">
              <p><strong>Numéro de commande:</strong> ${orderData.orderId}</p>
              <p><strong>Date:</strong> ${new Date(orderData.orderDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Client:</strong> ${orderData.customerInfo.name}</p>
              <p><strong>Email:</strong> ${orderData.customerInfo.email}</p>
            </div>
            ${orderData.items.map(item => `
              <div class="item">
                <h3>${item.name} - ${item.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}</h3>
                <p>${item.description}</p>
                <p><strong>Prix:</strong> ${autoConvertAndFormat(item.price, item.currency)}</p>
                ${item.trialDays > 0 ? `<p><strong>Jours d'essai:</strong> ${item.trialDays} jours</p>` : ''}
                <ul>
                  ${item.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
            <div class="total">
              <p>Total: ${autoConvertAndFormat(orderData.total, orderData.currency)}</p>
            </div>
            <div class="footer">
              <p>Merci de votre confiance dans Bossiz Conciergerie</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadPDF = () => {
    if (!orderData) return;
    
    // Créer un contenu PDF simplifié
    const pdfContent = `
RÉCAPITULATIF DE COMMANDE
========================

BOSSIZ CONCIERGERIE
${new Date().toLocaleDateString('fr-FR')}

NUMÉRO DE COMMANDE: ${orderData.orderId}

INFORMATIONS CLIENT
-----------------
Nom: ${orderData.customerInfo.name}
Email: ${orderData.customerInfo.email}
Téléphone: ${orderData.customerInfo.phone}

DÉTAIL DE LA COMMANDE
---------------------

${orderData.items.map(item => `
${item.name.toUpperCase()} - ${item.billingCycle === 'monthly' ? 'MENSUEL' : 'ANNUEL'}
${'='.repeat(50)}
${item.description}

Prix: ${autoConvertAndFormat(item.price, item.currency)}
${item.trialDays > 0 ? `Période d'essai: ${item.trialDays} jours` : ''}
${item.discount > 0 ? `Réduction: ${item.discount}%` : ''}

FONCTIONNALITÉS:
${item.features.map(feature => `• ${feature}`).join('\n')}

`).join('')}

RÉCAPITULATIF FINANCIER
----------------------
Sous-total: ${autoConvertAndFormat(orderData.subtotal, orderData.currency)}
${orderData.discount > 0 ? `Réduction: ${autoConvertAndFormat(orderData.discount, orderData.currency)}` : ''}
Total: ${autoConvertAndFormat(orderData.total, orderData.currency)}

MÉTHODE DE PAIEMENT: ${orderData.paymentMethod}

MÉTHODE DE PAIEMENT: ${orderData.paymentMethod}

Merci de votre confiance dans Bossiz Conciergerie
    `;

    // Télécharger comme fichier texte
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recapitulatif-commande-${orderData.orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Téléchargement',
      description: 'Le récapitulatif a été téléchargé',
    });
  };

  const handleBackToSubscriptions = () => {
    navigate('/');
  };

  const handleProceedToPayment = () => {
    if (planId) {
      navigate(`/subscription-payment?planId=${planId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Commande non trouvée</h2>
          <Button onClick={handleBackToSubscriptions} className="bg-blue-600 hover:bg-blue-700">
            Retour aux abonnements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBackToSubscriptions}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Imprimer
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                {t('pages.orderSummary.downloadPdf')}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="mb-8 border-2 border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Shield className="w-8 h-8" />
                {t('pages.orderSummary.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Informations de la commande</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Numéro:</span> {orderData.orderId}</p>
                    <p><span className="font-medium">Date:</span> {new Date(orderData.orderDate).toLocaleDateString('fr-FR')}</p>
                    <p><span className="font-medium">Statut:</span> 
                      <Badge className="ml-2 bg-green-100 text-green-800">En attente de paiement</Badge>
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Méthode de paiement</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Prestataire:</span> {orderData.paymentMethod}</p>
                    <p><span className="font-medium">Devise:</span> {orderData.currency}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Customer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Informations du client
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nom complet</label>
                  <p className="mt-1 text-lg font-semibold">{orderData.customerInfo.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-lg">{orderData.customerInfo.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Téléphone</label>
                  <p className="mt-1 text-lg">{orderData.customerInfo.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Détails de la commande</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {orderData.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-6 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                        <p className="text-gray-600 mt-1">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {autoConvertAndFormat(item.price, item.currency)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                        </p>
                      </div>
                    </div>
                    
                    {item.trialDays > 0 && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {item.trialDays} jours d'essai gratuits
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Fonctionnalités incluses:</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {item.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {item.discount > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 font-medium">
                          Réduction spéciale de {item.discount}% pour l'abonnement annuel
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="mb-8 border-2 border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                {t('pages.orderSummary.financialSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span>Sous-total:</span>
                  <span className="font-medium">
                    {autoConvertAndFormat(orderData.subtotal, orderData.currency)}
                  </span>
                </div>
                
                {orderData.discount > 0 && (
                  <div className="flex justify-between text-lg text-green-600">
                    <span>Réduction:</span>
                    <span className="font-medium">
                      -{autoConvertAndFormat(orderData.discount, orderData.currency)}
                    </span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-2xl font-bold text-gray-900">
                  <span>Total à payer:</span>
                  <span className="text-blue-600">
                    {autoConvertAndFormat(orderData.total, orderData.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center gap-4"
        >
          <Button
            variant="outline"
            onClick={handleBackToSubscriptions}
            className="px-8 py-3 text-lg"
          >
            Modifier l'abonnement
          </Button>
          <Button
            onClick={handleProceedToPayment}
            className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center gap-2"
          >
            {t('booking.summary.proceedToPayment')}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderSummary;
