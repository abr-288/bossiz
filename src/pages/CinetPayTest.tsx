import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Smartphone, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  TestTube
} from "lucide-react";
import CinetPayService from "@/services/cinetpay";

export default function CinetPayTest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);

  const cinetPayService = new CinetPayService();

  const testPaymentInitiation = async () => {
    setLoading(true);
    try {
      const testData = {
        amount: 1000, // 1000 XOF = ~1.52 EUR
        currency: 'XOF',
        transaction_id: CinetPayService.generateTransactionId(),
        description: 'Test de paiement CinetPay',
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        customer_phone: '+225000000000',
        return_url: `${window.location.origin}/payment-success`,
        notify_url: `${window.location.origin}/api/cinetpay/notify`,
        channels: cinetPayService.getAvailableChannels()
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
      
      setTestResults(prev => ({
        ...prev,
        payment_status: status
      }));

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
    <div className="min-h-screen bg-white pt-16">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TestTube className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-black">Test CinetPay</h1>
            <Badge className="bg-orange-500 text-white">Sandbox</Badge>
          </div>
          <p className="text-gray-700">Test des fonctionnalités de paiement CinetPay en mode développement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Configuration */}
          <Card className="border-2 border-gray-300">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Configuration Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Mode Sandbox Activé</span>
                </div>
                <p className="text-sm text-orange-600">
                  URL API: <code className="bg-orange-100 px-1 rounded">https://sandbox.cinetpay.com/v1</code>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-black">Montant test</Label>
                  <div className="text-lg font-bold text-black">1000 XOF (~1.52 EUR)</div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-black">Canaux disponibles</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {cinetPayService.getAvailableChannels().map((channel, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-black">Client test</Label>
                  <div className="text-sm text-gray-600">
                    <div>Nom: Test User</div>
                    <div>Email: test@example.com</div>
                    <div>Téléphone: +225000000000</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={testPaymentInitiation}
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Test en cours...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <TestTube className="w-4 h-4" />
                      Tester l'initiation
                    </div>
                  )}
                </Button>

                <Button 
                  onClick={testStatusCheck}
                  disabled={loading || !transactionId}
                  variant="outline"
                  className="w-full border-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  Vérifier le statut
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          <Card className="border-2 border-gray-300">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Résultats du Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResults ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Initiation réussie</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div><strong>Statut:</strong> {testResults.status}</div>
                      <div><strong>Transaction ID:</strong> {testResults.transaction_id}</div>
                      <div><strong>Message:</strong> {testResults.message}</div>
                    </div>
                  </div>

                  {paymentUrl && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-black">URL de paiement</Label>
                        <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg break-all">
                          <code className="text-xs text-gray-700">{paymentUrl}</code>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={openPaymentPage}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ouvrir
                        </Button>
                        <Button 
                          onClick={copyPaymentUrl}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          Copier l'URL
                        </Button>
                      </div>
                    </div>
                  )}

                  {testResults.payment_status && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-700 mb-2">Statut du paiement</div>
                      <div className="space-y-1 text-sm">
                        <div><strong>Statut:</strong> {testResults.payment_status.status}</div>
                        <div><strong>Montant:</strong> {testResults.payment_status.amount} {testResults.payment_status.currency}</div>
                        <div><strong>Méthode:</strong> {testResults.payment_status.payment_method}</div>
                        <div><strong>Opérateur:</strong> {testResults.payment_status.operator}</div>
                        {testResults.payment_status.payment_date && (
                          <div><strong>Date:</strong> {testResults.payment_status.payment_date}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Cliquez sur "Tester l'initiation" pour commencer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informations supplémentaires */}
        <Card className="mt-8 border-2 border-gray-300">
          <CardHeader>
            <CardTitle className="text-black">Informations sur le Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Smartphone className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-medium text-black">Mobile Money</div>
                  <div className="text-sm text-gray-600">Orange, MTN, Moov</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium text-black">Carte bancaire</div>
                  <div className="text-sm text-gray-600">Visa, Mastercard</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Wallet className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium text-black">Sécurisé</div>
                  <div className="text-sm text-gray-600">SSL 256 bits</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-black mb-2">Notes importantes:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Le mode sandbox utilise des données de test fictives</li>
                <li>Aucune transaction réelle ne sera effectuée</li>
                <li>L'URL de paiement ouvrira une page de test CinetPay</li>
                <li>Les statuts sont simulés aléatoirement</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button 
            onClick={() => navigate('/subscriptions')}
            variant="outline"
            className="border-2 border-black text-black hover:bg-black hover:text-white"
          >
            Retour aux abonnements
          </Button>
        </div>
      </div>
    </div>
  );
}
