import {
  CalendarCheck, CreditCard, RotateCcw, Baby, FileText, PlaneTakeoff, Luggage, LucideIcon,
} from "lucide-react";

export interface SupportCategoryDef {
  id: string;
  icon: LucideIcon;
}

export const SUPPORT_CATEGORIES: SupportCategoryDef[] = [
  { id: "booking", icon: CalendarCheck },
  { id: "payment", icon: CreditCard },
  { id: "refunds", icon: RotateCcw },
  { id: "baggage", icon: Luggage },
  { id: "children", icon: Baby },
  { id: "documents", icon: FileText },
  { id: "delays", icon: PlaneTakeoff },
];

export const SUPPORT_CATEGORY_IDS = SUPPORT_CATEGORIES.map((c) => c.id);
