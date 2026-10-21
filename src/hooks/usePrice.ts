import { useCurrency } from "@/contexts/CurrencyContext";

// Taux de conversion fixes vers XOF (Franc CFA)
const EXCHANGE_RATES_TO_XOF: Record<string, number> = {
  EUR: 656, // 1 EUR = 656 XOF (taux fixe BCEAO)
  USD: 615, // 1 USD ≈ 615 XOF
  GBP: 780, // 1 GBP ≈ 780 XOF
  XOF: 1, // Déjà en XOF
  FCFA: 1, // Alias pour XOF
  XAF: 1, // Franc CFA CEMAC (parité 1:1)
};

export const usePrice = (amount: number, fromCurrency: string = "XOF") => {
  const { selectedCurrency, formatPrice } = useCurrency();

  // Convertir le montant en XOF si nécessaire
  const normalizedCurrency = fromCurrency?.toUpperCase() || "XOF";
  const rate = EXCHANGE_RATES_TO_XOF[normalizedCurrency] || 1;
  const amountInXOF = Math.round(amount * rate);

  return {
    amount: amountInXOF,
    formattedPrice: formatPrice(amountInXOF),
    isConverting: false,
    currency: selectedCurrency,
  };
};
