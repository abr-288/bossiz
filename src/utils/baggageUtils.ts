import type { TFunction } from "i18next";
// Baggage policies by airline and fare type
export interface BaggageAllowance {
  cabin: {
    pieces: number;
    weightKg: number;
    description: string;
  };
  checked: {
    pieces: number;
    weightKg: number;
    included: boolean;
  };
  personalItem: boolean;
  additionalBagPrice?: number; // Price in EUR for additional bag
}

// Default baggage policies by fare type
const defaultPolicies: Record<string, Record<string, BaggageAllowance>> = {
  basic: {
    ECONOMY: {
      cabin: { pieces: 1, weightKg: 8, description: "Sac cabine" },
      checked: { pieces: 0, weightKg: 0, included: false },
      personalItem: true,
      additionalBagPrice: 25,
    },
    PREMIUM_ECONOMY: {
      cabin: { pieces: 1, weightKg: 10, description: "Sac cabine" },
      checked: { pieces: 1, weightKg: 23, included: true },
      personalItem: true,
      additionalBagPrice: 30,
    },
    BUSINESS: {
      cabin: { pieces: 2, weightKg: 12, description: "Sacs cabine" },
      checked: { pieces: 2, weightKg: 32, included: true },
      personalItem: true,
      additionalBagPrice: 50,
    },
    FIRST: {
      cabin: { pieces: 2, weightKg: 14, description: "Sacs cabine" },
      checked: { pieces: 3, weightKg: 32, included: true },
      personalItem: true,
      additionalBagPrice: 75,
    },
  },
  benefits: {
    ECONOMY: {
      cabin: { pieces: 1, weightKg: 10, description: "Sac cabine" },
      checked: { pieces: 1, weightKg: 23, included: true },
      personalItem: true,
      additionalBagPrice: 20,
    },
    PREMIUM_ECONOMY: {
      cabin: { pieces: 1, weightKg: 12, description: "Sac cabine" },
      checked: { pieces: 2, weightKg: 23, included: true },
      personalItem: true,
      additionalBagPrice: 25,
    },
    BUSINESS: {
      cabin: { pieces: 2, weightKg: 14, description: "Sacs cabine" },
      checked: { pieces: 2, weightKg: 32, included: true },
      personalItem: true,
      additionalBagPrice: 40,
    },
    FIRST: {
      cabin: { pieces: 2, weightKg: 18, description: "Sacs cabine" },
      checked: { pieces: 3, weightKg: 32, included: true },
      personalItem: true,
      additionalBagPrice: 60,
    },
  },
};

// Airline-specific overrides (some airlines have different policies)
const airlineOverrides: Record<string, Partial<Record<string, Record<string, Partial<BaggageAllowance>>>>> = {
  // Low-cost carriers - stricter baggage policies
  "Fly540": {
    basic: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 7, description: "Sac cabine" },
        checked: { pieces: 0, weightKg: 0, included: false },
        personalItem: false,
        additionalBagPrice: 20,
      },
    },
  },
  "Ryanair": {
    basic: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 10, description: "Petit sac" },
        checked: { pieces: 0, weightKg: 0, included: false },
        personalItem: false,
        additionalBagPrice: 15,
      },
    },
  },
  "EasyJet": {
    basic: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 15, description: "Sac cabine" },
        checked: { pieces: 0, weightKg: 0, included: false },
        personalItem: false,
        additionalBagPrice: 18,
      },
    },
  },
  // Premium carriers - generous baggage
  "Air France": {
    basic: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 12, description: "Sac cabine" },
        checked: { pieces: 1, weightKg: 23, included: true },
        personalItem: true,
        additionalBagPrice: 70,
      },
    },
    benefits: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 12, description: "Sac cabine" },
        checked: { pieces: 2, weightKg: 23, included: true },
        personalItem: true,
        additionalBagPrice: 60,
      },
    },
  },
  "Emirates": {
    basic: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 7, description: "Sac cabine" },
        checked: { pieces: 1, weightKg: 30, included: true },
        personalItem: true,
        additionalBagPrice: 100,
      },
      BUSINESS: {
        cabin: { pieces: 2, weightKg: 14, description: "Sacs cabine" },
        checked: { pieces: 2, weightKg: 40, included: true },
        personalItem: true,
        additionalBagPrice: 150,
      },
    },
  },
  "Ethiopian Airlines": {
    basic: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 7, description: "Sac cabine" },
        checked: { pieces: 2, weightKg: 23, included: true },
        personalItem: true,
        additionalBagPrice: 50,
      },
    },
  },
  "Turkish Airlines": {
    basic: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 8, description: "Sac cabine" },
        checked: { pieces: 1, weightKg: 23, included: true },
        personalItem: true,
        additionalBagPrice: 60,
      },
    },
  },
  "Kenya Airways": {
    basic: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 12, description: "Sac cabine" },
        checked: { pieces: 1, weightKg: 23, included: true },
        personalItem: true,
        additionalBagPrice: 45,
      },
    },
  },
  "Royal Air Maroc": {
    basic: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 10, description: "Sac cabine" },
        checked: { pieces: 1, weightKg: 23, included: true },
        personalItem: true,
        additionalBagPrice: 55,
      },
    },
  },
  "Brussels Airlines": {
    basic: {
      ECONOMY: {
        cabin: { pieces: 1, weightKg: 8, description: "Sac cabine" },
        checked: { pieces: 1, weightKg: 23, included: true },
        personalItem: true,
        additionalBagPrice: 65,
      },
    },
  },
};

// List of known low-cost carriers
const lowCostCarriers = [
  "Ryanair", "EasyJet", "Vueling", "Transavia", "Fly540", 
  "Spirit", "Frontier", "Wizz Air", "Norwegian", "Pegasus"
];

export function isLowCostCarrier(airline: string): boolean {
  return lowCostCarriers.some(lcc => 
    airline.toLowerCase().includes(lcc.toLowerCase())
  );
}

export function getBaggageAllowance(
  airline: string,
  fareType: string = "basic",
  cabinClass: string = "ECONOMY"
): BaggageAllowance {
  const normalizedFare = fareType.toLowerCase();
  const normalizedClass = cabinClass.toUpperCase();
  
  // Check for airline-specific override first
  const airlinePolicy = airlineOverrides[airline];
  if (airlinePolicy?.[normalizedFare]?.[normalizedClass]) {
    const override = airlinePolicy[normalizedFare]![normalizedClass]!;
    const defaultPolicy = defaultPolicies[normalizedFare]?.[normalizedClass] || 
                          defaultPolicies.basic.ECONOMY;
    return { ...defaultPolicy, ...override } as BaggageAllowance;
  }
  
  // Fall back to default policy
  const farePolicy = defaultPolicies[normalizedFare] || defaultPolicies.basic;
  return farePolicy[normalizedClass] || farePolicy.ECONOMY || defaultPolicies.basic.ECONOMY;
}

// Les descriptions de franchise sont stockées en français dans les politiques ci-dessus ;
// on les traduit à l'affichage.
const CABIN_DESCRIPTION_KEYS: Record<string, string> = {
  "Sac cabine": "cabinBag",
  "Sacs cabine": "cabinBags",
  "Petit sac": "smallBag",
};

export function formatBaggageInfo(allowance: BaggageAllowance, t: TFunction): {
  cabinText: string;
  checkedText: string;
  personalItemText: string | null;
} {
  const descKey = CABIN_DESCRIPTION_KEYS[allowance.cabin.description];
  const cabinLabel = descKey ? t(`ux.baggage.${descKey}`) : allowance.cabin.description;
  const cabinText = allowance.cabin.pieces > 0
    ? t("ux.baggage.cabin", { count: allowance.cabin.pieces, label: cabinLabel, kg: allowance.cabin.weightKg })
    : t("ux.baggage.notIncluded");

  const checkedText = allowance.checked.included && allowance.checked.pieces > 0
    ? t("ux.baggage.checked", { count: allowance.checked.pieces, kg: allowance.checked.weightKg })
    : t("ux.baggage.notIncluded");

  const personalItemText = allowance.personalItem
    ? t("ux.baggage.personalItem")
    : null;

  return { cabinText, checkedText, personalItemText };
}
