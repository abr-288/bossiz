import {
  Plane, Building, Car, Calendar, Users, Briefcase, Heart, Gamepad2,
  Utensils, ShoppingBag, Home, Shield, Star, MapPin, Clock,
  Gift, Compass, Anchor, Crown, LucideIcon,
} from "lucide-react";

export const BOSSIZ_ICON_MAP: Record<string, LucideIcon> = {
  Plane, Building, Car, Calendar, Users, Briefcase, Heart, Gamepad2,
  Utensils, ShoppingBag, Home, Shield, Star, MapPin, Clock,
  Gift, Compass, Anchor, Crown,
};

export const BOSSIZ_ICON_NAMES = Object.keys(BOSSIZ_ICON_MAP);

export const getBossizIcon = (name: string): LucideIcon => BOSSIZ_ICON_MAP[name] || Star;
