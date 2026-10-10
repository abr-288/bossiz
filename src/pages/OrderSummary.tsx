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
import { currentLocaleTag } from "@/lib/dateLocale";
import { MOTION } from "@/lib/motion";

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
  const { t, i18n } = useTranslation();
  const [orderData, setOrderData] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');
  const planId = searchParams.get('planId');

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
            // Aucune commande enregistrée : jamais de commande inventée
            throw new Error(t("ux.order.notFoundToast"));
          }
        } else {
          throw new Error(t("ux.order.notFoundToast"));
        }
      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast({
          title: 'Erreur',
          description: t("ux.order.loadError"),
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, planId, navigate, toast]);

  const handlePrint = () => {
    if (!orderData) return;
    const p = (key: string, options?: Record<string, unknown>) => t(`ux.print.${key}`, options);
    const cycle = (c: string) => (c === 'monthly' ? p('monthly') : p('annual'));

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html lang="${i18n.language}">
          <head>
            <title>${p('title')} - Bossiz Conciergerie</title>
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
              <h1>${p('title')}</h1>
              <h2>Bossiz Conciergerie</h2>
            </div>
            <div class="order-info">
              <p><strong>${p('orderNumber')}:</strong> ${orderData.orderId}</p>
              <p><strong>${p('date')}:</strong> ${new Date(orderData.orderDate).toLocaleDateString(i18n.language)}</p>
              <p><strong>${p('customer')}:</strong> ${orderData.customerInfo.name}</p>
              <p><strong>${p('email')}:</strong> ${orderData.customerInfo.email}</p>
            </div>
            ${orderData.items.map(item => `
              <div class="item">
                <h3>${item.name} - ${cycle(item.billingCycle)}</h3>
                <p>${item.description}</p>
                <p><strong>${p('price')}:</strong> ${autoConvertAndFormat(item.price, item.currency)}</p>
                ${item.trialDays > 0 ? `<p><strong>${p('trialDays')}:</strong> ${p('days', { count: item.trialDays })}</p>` : ''}
                <ul>
                  ${item.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
            <div class="total">
              <p>${p('total')}: ${autoConvertAndFormat(orderData.total, orderData.currency)}</p>
            </div>
            <div class="footer">
              <p>${p('thanks')}</p>
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
    const p = (key: string, options?: Record<string, unknown>) => t(`ux.print.${key}`, options);
    const cycle = (c: string) => (c === 'monthly' ? p('monthly') : p('annual'));
    const title = p('title').toUpperCase();

    // Récapitulatif texte dans la langue de l'utilisateur
    const pdfContent = `
${title}
${'='.repeat(title.length)}

BOSSIZ CONCIERGERIE
${new Date().toLocaleDateString(currentLocaleTag())}

${p('orderNumber').toUpperCase()}: ${orderData.orderId}

${p('customerInfo').toUpperCase()}
-----------------
${p('name')}: ${orderData.customerInfo.name}
${p('email')}: ${orderData.customerInfo.email}
${p('phone')}: ${orderData.customerInfo.phone}

${p('orderDetail').toUpperCase()}
---------------------

${orderData.items.map(item => `
${item.name.toUpperCase()} - ${cycle(item.billingCycle).toUpperCase()}
${'='.repeat(50)}
${item.description}

${p('price')}: ${autoConvertAndFormat(item.price, item.currency)}
${item.trialDays > 0 ? `${p('trialDays')}: ${p('days', { count: item.trialDays })}` : ''}
${item.discount > 0 ? `${p('discount')}: ${item.discount}%` : ''}

${p('features').toUpperCase()}:
${item.features.map(feature => `• ${feature}`).join('\n')}

`).join('')}

${p('financial').toUpperCase()}
----------------------
${p('subtotal')}: ${autoConvertAndFormat(orderData.subtotal, orderData.currency)}
${orderData.discount > 0 ? `${p('discount')}: ${autoConvertAndFormat(orderData.discount, orderData.currency)}` : ''}
${p('total')}: ${autoConvertAndFormat(orderData.total, orderData.currency)}

${p('paymentMethod').toUpperCase()}: ${orderData.paymentMethod}

${p('thanks')}
    `;

    // Télécharger comme fichier texte
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t('ux.print.fileName')}-${orderData.orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: t("ux.order.download"),
      description: t("ux.order.downloaded"),
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
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">{t("ux.order.notFound")}</h2>
          <Button onClick={handleBackToSubscriptions}>
            {t("ux.order.backToPlans")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.slow }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBackToSubscriptions}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("ux.order.back")}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t("ux.order.print")}
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-info hover:bg-info/90"
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
          transition={{ duration: MOTION.slow, delay: 0.1 }}
        >
          <Card className="mb-8 border-2 border-info/30 shadow-lg">
            <CardHeader className="bg-info text-info-foreground">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Shield className="w-8 h-8" />
                {t('pages.orderSummary.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{t("ux.order.orderInfo")}</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">{t("ux.order.number")}</span> {orderData.orderId}</p>
                    <p><span className="font-medium">{t("ux.order.date")}</span> {new Date(orderData.orderDate).toLocaleDateString(i18n.language)}</p>
                    <p><span className="font-medium">{t("ux.order.status")}</span> 
                      <Badge className="ml-2 bg-success/10 text-success">{t("ux.order.awaitingPayment")}</Badge>
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{t("ux.order.paymentMethod")}</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">{t("ux.order.provider")}</span> {orderData.paymentMethod}</p>
                    <p><span className="font-medium">{t("ux.order.currency")}</span> {orderData.currency}</p>
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
          transition={{ duration: MOTION.slow, delay: 0.2 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                {t("ux.order.customerInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-foreground">{t("ux.order.fullName")}</label>
                  <p className="mt-1 text-lg font-semibold">{orderData.customerInfo.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">{t("ux.order.email")}</label>
                  <p className="mt-1 text-lg">{orderData.customerInfo.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">{t("ux.order.phone")}</label>
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
          transition={{ duration: MOTION.slow, delay: 0.3 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("ux.order.orderDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {orderData.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-6 bg-muted">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{item.name}</h3>
                        <p className="text-muted-foreground mt-1">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-info">
                          {autoConvertAndFormat(item.price, item.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.billingCycle === 'monthly' ? t('ux.print.monthly') : t('ux.print.annual')}
                        </p>
                      </div>
                    </div>
                    
                    {item.trialDays > 0 && (
                      <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg">
                        <div className="flex items-center gap-2 text-success">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {item.trialDays} jours d'essai gratuits
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">{t("ux.order.features")}</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {item.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {item.discount > 0 && (
                      <div className="mt-4 p-3 bg-warning border border-warning-foreground/20 rounded-lg">
                        <p className="text-warning-foreground font-medium">
                          {t("ux.order.yearlyDiscount", { percent: item.discount })}
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
          transition={{ duration: MOTION.slow, delay: 0.4 }}
        >
          <Card className="mb-8 border-2 border-success/30">
            <CardHeader className="bg-success text-success-foreground">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                {t('pages.orderSummary.financialSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span>{t("ux.order.subtotal")}</span>
                  <span className="font-medium">
                    {autoConvertAndFormat(orderData.subtotal, orderData.currency)}
                  </span>
                </div>
                
                {orderData.discount > 0 && (
                  <div className="flex justify-between text-lg text-success">
                    <span>{t("ux.order.discount")}</span>
                    <span className="font-medium">
                      -{autoConvertAndFormat(orderData.discount, orderData.currency)}
                    </span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-2xl font-bold text-foreground">
                  <span>{t("ux.order.total")}</span>
                  <span className="text-info">
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
          transition={{ duration: MOTION.slow, delay: 0.5 }}
          className="flex justify-center gap-4"
        >
          <Button
            variant="outline"
            onClick={handleBackToSubscriptions}
            className="px-8 py-3 text-lg"
          >
            {t("ux.order.changePlan")}
          </Button>
          <Button
            onClick={handleProceedToPayment}
            className="px-8 py-3 text-lg bg-info hover:bg-info/90 flex items-center gap-2"
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
