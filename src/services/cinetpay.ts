// CinetPay Payment Service
// Integration with CinetPay API for African payment methods

export interface CinetPayPaymentRequest {
  amount: number;
  currency: string;
  transaction_id: string;
  description: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  return_url: string;
  notify_url: string;
  channels: string[];
}

export interface CinetPayPaymentResponse {
  status: string;
  transaction_id: string;
  payment_url: string;
  message: string;
}

export interface CinetPayPaymentStatus {
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  transaction_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  operator: string;
  payment_date?: string;
  metadata?: any;
}

class CinetPayService {
  private apiKey: string;
  private siteId: string;
  private baseUrl: string;
  private notifyUrl: string;

  constructor() {
    // Configuration CinetPay (à remplacer avec vos vraies clés)
    // Note: process.env n'est pas disponible dans le navigateur, utiliser window.env ou des variables Vite
    this.apiKey = (window as any).env?.REACT_APP_CINETPAY_API_KEY || 'YOUR_API_KEY';
    this.siteId = (window as any).env?.REACT_APP_CINETPAY_SITE_ID || 'YOUR_SITE_ID';
    // Utiliser l'URL sandbox en développement
    this.baseUrl = this.isDevelopment() ? 'https://sandbox.cinetpay.com/v1' : 'https://api.cinetpay.com/v1';
    this.notifyUrl = `${window.location.origin}/api/cinetpay/notify`;
  }

  /**
   * Initier un paiement via CinetPay
   */
  async initiatePayment(paymentData: CinetPayPaymentRequest): Promise<CinetPayPaymentResponse> {
    try {
      const payload = {
        apikey: this.apiKey,
        site_id: this.siteId,
        transaction_id: paymentData.transaction_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
        customer_name: paymentData.customer_name,
        customer_email: paymentData.customer_email,
        customer_phone: paymentData.customer_phone,
        channels: paymentData.channels.join(','),
        return_url: paymentData.return_url,
        notify_url: this.notifyUrl,
        lang: 'fr',
        metadata: JSON.stringify({
          source: 'bossiz_conciergerie',
          timestamp: new Date().toISOString()
        })
      };

      // Pour le développement, simuler la réponse
      if (this.isDevelopment()) {
        return this.simulatePaymentInitiation(paymentData);
      }

      const response = await fetch(`${this.baseUrl}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`CinetPay API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'ACCEPTED') {
        throw new Error(data.message || 'Payment initiation failed');
      }

      return {
        status: data.status,
        transaction_id: data.transaction_id,
        payment_url: data.payment_url,
        message: data.message
      };

    } catch (error) {
      console.error('CinetPay payment initiation error:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(transactionId: string): Promise<CinetPayPaymentStatus> {
    try {
      // Pour le développement, simuler la réponse
      if (this.isDevelopment()) {
        return this.simulatePaymentStatus(transactionId);
      }

      const response = await fetch(`${this.baseUrl}/payment/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: transactionId
        })
      });

      if (!response.ok) {
        throw new Error(`CinetPay API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        status: this.mapCinetPayStatus(data.status),
        transaction_id: data.transaction_id,
        amount: parseFloat(data.amount),
        currency: data.currency,
        payment_method: data.payment_method || 'unknown',
        operator: data.operator || 'unknown',
        payment_date: data.payment_date,
        metadata: data.metadata ? JSON.parse(data.metadata) : null
      };

    } catch (error) {
      console.error('CinetPay status check error:', error);
      throw error;
    }
  }

  /**
   * Rediriger vers la page de paiement CinetPay
   */
  redirectToPayment(paymentUrl: string): void {
    window.location.href = paymentUrl;
  }

  /**
   * Ouvrir le paiement dans une popup
   */
  openPaymentPopup(paymentUrl: string, onCallback?: (status: string) => void): void {
    const popup = window.open(
      paymentUrl,
      'cinetpay-payment',
      'width=800,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      // Fallback si la popup est bloquée
      this.redirectToPayment(paymentUrl);
      return;
    }

    // Écouter les messages de la popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'CINETPAY_PAYMENT') {
        popup.close();
        window.removeEventListener('message', messageListener);
        
        if (onCallback) {
          onCallback(event.data.status);
        }
      }
    };

    window.addEventListener('message', messageListener);

    // Vérifier périodiquement si la popup est fermée
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        
        if (onCallback) {
          onCallback('cancelled');
        }
      }
    }, 1000);
  }

  /**
   * Obtenir les canaux de paiement disponibles
   */
  getAvailableChannels(): string[] {
    return [
      'CM_OM', // Orange Money
      'CM_TMO', // MTN Mobile Money
      'CM_MOOV', // Moov Money
      'CARD',   // Carte bancaire
      'WAVE',   // Wave
      'BANK',   // Virement bancaire
    ];
  }

  /**
   * Mapper le statut CinetPay vers notre format
   */
  private mapCinetPayStatus(status: string): 'pending' | 'success' | 'failed' | 'cancelled' {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'SUCCESS':
      case 'COMPLETE':
        return 'success';
      case 'FAILED':
      case 'ERROR':
        return 'failed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Simuler l'initiation de paiement (développement)
   */
  private simulatePaymentInitiation(paymentData: CinetPayPaymentRequest): CinetPayPaymentResponse {
    // URL sandbox correcte pour CinetPay
    const paymentUrl = `https://sandbox.cinetpay.com/checkout/${paymentData.transaction_id}`;
    
    return {
      status: 'ACCEPTED',
      transaction_id: paymentData.transaction_id,
      payment_url: paymentUrl,
      message: 'Payment initiated successfully (sandbox mode)'
    };
  }

  /**
   * Simuler le statut de paiement (développement)
   */
  private simulatePaymentStatus(transactionId: string): CinetPayPaymentStatus {
    // Simuler différents statuts pour les tests
    const random = Math.random();
    let status: 'pending' | 'success' | 'failed' | 'cancelled';
    
    if (random < 0.7) {
      status = 'success';
    } else if (random < 0.85) {
      status = 'pending';
    } else if (random < 0.95) {
      status = 'failed';
    } else {
      status = 'cancelled';
    }

    return {
      status,
      transaction_id: transactionId,
      amount: 100, // Simulé
      currency: 'XOF',
      payment_method: 'mobile_money',
      operator: 'orange_money',
      payment_date: status === 'success' ? new Date().toISOString() : undefined,
      metadata: {
        sandbox: true,
        test_mode: true
      }
    };
  }

  /**
   * Vérifier si nous sommes en mode développement
   */
  private isDevelopment(): boolean {
    return import.meta.env?.MODE === 'development' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  /**
   * Formater le montant pour CinetPay
   */
  static formatAmount(amount: number, currency: string = 'XOF'): number {
    // CinetPay travaille avec les montants en unités entières
    // Pour EUR/XOF, convertir si nécessaire
    if (currency === 'EUR') {
      // Taux de conversion approximatif (à ajuster selon le taux réel)
      return Math.round(amount * 655.957);
    }
    return Math.round(amount);
  }

  /**
   * Générer un ID de transaction unique
   */
  static generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `BOSSIZ_${timestamp}_${random}`;
  }

  /**
   * Valider les données de paiement
   */
  static validatePaymentData(data: Partial<CinetPayPaymentRequest>): string[] {
    const errors: string[] = [];

    if (!data.amount || data.amount <= 0) {
      errors.push('Le montant est requis et doit être positif');
    }

    if (!data.currency || !['XOF', 'EUR', 'USD'].includes(data.currency)) {
      errors.push('La devise est invalide');
    }

    if (!data.customer_name || data.customer_name.trim().length < 2) {
      errors.push('Le nom du client est requis');
    }

    if (!data.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
      errors.push('L\'email du client est invalide');
    }

    if (!data.customer_phone || data.customer_phone.length < 8) {
      errors.push('Le numéro de téléphone est requis');
    }

    if (!data.channels || data.channels.length === 0) {
      errors.push('Au moins un canal de paiement est requis');
    }

    return errors;
  }
}

export default CinetPayService;
