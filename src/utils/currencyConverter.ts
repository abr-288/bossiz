// Utilitaire de conversion de devise multi-devises
// Taux de conversion officiels (mis à jour régulièrement)

export interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  originalCurrency: string;
  targetCurrency: string;
  rate: number;
  formattedOriginal: string;
  formattedConverted: string;
}

export class CurrencyConverter {
  // Taux de conversion (à mettre à jour selon les taux du marché)
  public static readonly EXCHANGE_RATES: Record<string, number> = {
    // Devises européennes vers XOF (marché africain)
    'EUR_TO_XOF': 655.957,
    'GBP_TO_XOF': 785.234,
    'CHF_TO_XOF': 703.891,
    
    // Devises européennes vers USD
    'EUR_TO_USD': 1.089,
    'GBP_TO_USD': 1.274,
    'CHF_TO_USD': 1.112,
    
    // USD vers autres devises
    'USD_TO_XOF': 602.123,
    'USD_TO_CAD': 1.356,
    'USD_TO_GBP': 0.785,
    'USD_TO_EUR': 0.918,
    
    // EUR vers autres devises
    'EUR_TO_GBP': 0.856,
    'EUR_TO_CAD': 1.476,
    'EUR_TO_CHF': 0.945,
    
    // GBP vers autres devises
    'GBP_TO_CAD': 1.724,
    'GBP_TO_EUR': 1.169,
    'GBP_TO_CHF': 1.104,
    
    // CAD vers autres devises
    'CAD_TO_USD': 0.737,
    'CAD_TO_EUR': 0.678,
    'CAD_TO_GBP': 0.580,
    'CAD_TO_CHF': 0.659,
    
    // XOF vers devises européennes
    'XOF_TO_EUR': 0.001525,
    'XOF_TO_GBP': 0.001274,
    'XOF_TO_CHF': 0.001420,
    
    // XOF vers USD
    'XOF_TO_USD': 0.001661,
    'XOF_TO_CAD': 0.002254,
  };
  
  /**
   * Convertit un montant EUR en XOF (FCFA)
   */
  static convertEURToXOF(amountEUR: number): ConversionResult {
    const amountXOF = Math.round(amountEUR * this.EXCHANGE_RATES.EUR_TO_XOF);
    
    return {
      originalAmount: amountEUR,
      convertedAmount: amountXOF,
      originalCurrency: 'EUR',
      targetCurrency: 'XOF',
      rate: this.EXCHANGE_RATES.EUR_TO_XOF,
      formattedOriginal: this.formatCurrency(amountEUR, 'EUR'),
      formattedConverted: this.formatCurrency(amountXOF, 'XOF')
    };
  }
  
  /**
   * Convertit un montant XOF en EUR
   */
  static convertXOFToEUR(amountXOF: number): ConversionResult {
    const amountEUR = Math.round(amountXOF / this.EXCHANGE_RATES.EUR_TO_XOF * 100) / 100;
    
    return {
      originalAmount: amountXOF,
      convertedAmount: amountEUR,
      originalCurrency: 'XOF',
      targetCurrency: 'EUR',
      rate: this.EXCHANGE_RATES.EUR_TO_XOF,
      formattedOriginal: this.formatCurrency(amountXOF, 'XOF'),
      formattedConverted: this.formatCurrency(amountEUR, 'EUR')
    };
  }

  /**
   * Convertit un montant EUR en USD
   */
  static convertEURToUSD(amountEUR: number): ConversionResult {
    const amountUSD = Math.round(amountEUR * this.EXCHANGE_RATES.EUR_TO_USD);
    
    return {
      originalAmount: amountEUR,
      convertedAmount: amountUSD,
      originalCurrency: 'EUR',
      targetCurrency: 'USD',
      rate: this.EXCHANGE_RATES.EUR_TO_USD,
      formattedOriginal: this.formatCurrency(amountEUR, 'EUR'),
      formattedConverted: this.formatCurrency(amountUSD, 'USD')
    };
  }

  /**
   * Convertit un montant EUR en GBP
   */
  static convertEURToGBP(amountEUR: number): ConversionResult {
    const amountGBP = Math.round(amountEUR * this.EXCHANGE_RATES.EUR_TO_GBP);
    
    return {
      originalAmount: amountEUR,
      convertedAmount: amountGBP,
      originalCurrency: 'EUR',
      targetCurrency: 'GBP',
      rate: this.EXCHANGE_RATES.EUR_TO_GBP,
      formattedOriginal: this.formatCurrency(amountEUR, 'EUR'),
      formattedConverted: this.formatCurrency(amountGBP, 'GBP')
    };
  }

  /**
   * Convertit un montant EUR en CAD
   */
  static convertEURToCAD(amountEUR: number): ConversionResult {
    const amountCAD = Math.round(amountEUR * this.EXCHANGE_RATES.EUR_TO_CAD);
    
    return {
      originalAmount: amountEUR,
      convertedAmount: amountCAD,
      originalCurrency: 'EUR',
      targetCurrency: 'CAD',
      rate: this.EXCHANGE_RATES.EUR_TO_CAD,
      formattedOriginal: this.formatCurrency(amountEUR, 'EUR'),
      formattedConverted: this.formatCurrency(amountCAD, 'CAD')
    };
  }

  /**
   * Convertit un montant USD en XOF
   */
  static convertUSDToXOF(amountUSD: number): ConversionResult {
    const amountXOF = Math.round(amountUSD * this.EXCHANGE_RATES.USD_TO_XOF);
    
    return {
      originalAmount: amountUSD,
      convertedAmount: amountXOF,
      originalCurrency: 'USD',
      targetCurrency: 'XOF',
      rate: this.EXCHANGE_RATES.USD_TO_XOF,
      formattedOriginal: this.formatCurrency(amountUSD, 'USD'),
      formattedConverted: this.formatCurrency(amountXOF, 'XOF')
    };
  }

  /**
   * Convertit un montant GBP en XOF
   */
  static convertGBPToXOF(amountGBP: number): ConversionResult {
    const amountXOF = Math.round(amountGBP * this.EXCHANGE_RATES.GBP_TO_XOF);
    
    return {
      originalAmount: amountGBP,
      convertedAmount: amountXOF,
      originalCurrency: 'GBP',
      targetCurrency: 'XOF',
      rate: this.EXCHANGE_RATES.GBP_TO_XOF,
      formattedOriginal: this.formatCurrency(amountGBP, 'GBP'),
      formattedConverted: this.formatCurrency(amountXOF, 'XOF')
    };
  }

  /**
   * Convertit un montant CAD en XOF
   */
  static convertCADToXOF(amountCAD: number): ConversionResult {
    const amountXOF = Math.round(amountCAD * this.EXCHANGE_RATES.CAD_TO_XOF);
    
    return {
      originalAmount: amountCAD,
      convertedAmount: amountXOF,
      originalCurrency: 'CAD',
      targetCurrency: 'XOF',
      rate: this.EXCHANGE_RATES.CAD_TO_XOF,
      formattedOriginal: this.formatCurrency(amountCAD, 'CAD'),
      formattedConverted: this.formatCurrency(amountXOF, 'XOF')
    };
  }

  /**
   * Convertit un montant CHF en XOF
   */
  static convertCHFToXOF(amountCHF: number): ConversionResult {
    const amountXOF = Math.round(amountCHF * this.EXCHANGE_RATES.CHF_TO_XOF);
    
    return {
      originalAmount: amountCHF,
      convertedAmount: amountXOF,
      originalCurrency: 'CHF',
      targetCurrency: 'XOF',
      rate: this.EXCHANGE_RATES.CHF_TO_XOF,
      formattedOriginal: this.formatCurrency(amountCHF, 'CHF'),
      formattedConverted: this.formatCurrency(amountXOF, 'XOF')
    };
  }
  
  /**
   * Formate un montant avec la devise appropriée
   */
  static formatCurrency(amount: number, currency: string): string {
    switch (currency) {
      case 'XOF':
        return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
      case 'EUR':
        return `¥${new Intl.NumberFormat('fr-FR').format(amount)}`;
      case 'USD':
        return `$${new Intl.NumberFormat('en-US').format(amount)}`;
      case 'GBP':
        return `£${new Intl.NumberFormat('en-GB').format(amount)}`;
      case 'CAD':
        return `C$${new Intl.NumberFormat('en-CA').format(amount)}`;
      case 'CHF':
        return `CHF ${new Intl.NumberFormat('fr-CH').format(amount)}`;
      default:
        return new Intl.NumberFormat('fr-FR').format(amount);
    }
  }
  
  /**
   * Formate un montant en XOF avec espaces pour la lisibilité
   */
  static formatXOF(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formate un montant en EUR
   */
  static formatEUR(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formate un montant en USD
   */
  static formatUSD(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formate un montant en GBP
   */
  static formatGBP(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formate un montant en CAD
   */
  static formatCAD(amount: number): string {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formate un montant en CHF
   */
  static formatCHF(amount: number): string {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Convertit automatiquement vers XOF si nécessaire
   */
  static autoConvertToXOF(amount: number | string, originalCurrency: string = 'EUR'): ConversionResult {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (originalCurrency === 'XOF') {
      return {
        originalAmount: numAmount,
        convertedAmount: numAmount,
        originalCurrency: 'XOF',
        targetCurrency: 'XOF',
        rate: 1,
        formattedOriginal: this.formatXOF(numAmount),
        formattedConverted: this.formatXOF(numAmount)
      };
    }
    
    // Conversion selon la devise d'origine
    switch (originalCurrency) {
      case 'EUR':
        return this.convertEURToXOF(numAmount);
      case 'USD':
        return this.convertUSDToXOF(numAmount);
      case 'GBP':
        return this.convertGBPToXOF(numAmount);
      case 'CAD':
        return this.convertCADToXOF(numAmount);
      case 'CHF':
        return this.convertCHFToXOF(numAmount);
      default:
        // Par défaut, convertir depuis EUR
        return this.convertEURToXOF(numAmount);
    }
  }
}

// Fonctions utilitaires exportées pour faciliter l'utilisation
export const convertToXOF = (amountEUR: number): number => {
  return Math.round(amountEUR * CurrencyConverter.EXCHANGE_RATES.EUR_TO_XOF);
};

export const formatXOF = (amount: number): string => {
  return CurrencyConverter.formatXOF(amount);
};

export const formatEUR = (amount: number): string => {
  return CurrencyConverter.formatEUR(amount);
};

export const formatUSD = (amount: number): string => {
  return CurrencyConverter.formatUSD(amount);
};

export const formatGBP = (amount: number): string => {
  return CurrencyConverter.formatGBP(amount);
};

export const formatCAD = (amount: number): string => {
  return CurrencyConverter.formatCAD(amount);
};

export const formatCHF = (amount: number): string => {
  return CurrencyConverter.formatCHF(amount);
};

export const autoConvertAndFormat = (amount: number, originalCurrency: string = 'EUR'): string => {
  const result = CurrencyConverter.autoConvertToXOF(amount, originalCurrency);
  return result.formattedConverted;
};

// Conversion directe entre devises
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): ConversionResult => {
  const fromKey = `${fromCurrency.toUpperCase()}_TO_${toCurrency.toUpperCase()}`;
  const rate = CurrencyConverter.EXCHANGE_RATES[fromKey] || 1;
  
  return {
    originalAmount: amount,
    convertedAmount: Math.round(amount * rate),
    originalCurrency: fromCurrency.toUpperCase(),
    targetCurrency: toCurrency.toUpperCase(),
    rate: rate,
    formattedOriginal: CurrencyConverter.formatCurrency(amount, fromCurrency),
    formattedConverted: CurrencyConverter.formatCurrency(Math.round(amount * rate), toCurrency)
  };
};
