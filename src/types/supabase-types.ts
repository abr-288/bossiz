// Temporary type definitions for Majestic Club tables
// This resolves TypeScript errors until database schema is properly migrated

export type MajesticSubscription = {
  id: string;
  user_id: string;
  plan_type: 'access' | 'access_prive' | 'access_black';
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
};

export type MajesticBooking = {
  id: string;
  user_id: string;
  booking_type: 'flight' | 'hotel' | 'villa' | 'chauffeur' | 'service';
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_amount?: number;
  currency?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type MajesticService = {
  id: string;
  name: string;
  category: 'concierge' | 'chauffeur' | 'chef' | 'security' | 'custom';
  description: string;
  base_price?: number;
  image_url?: string;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MajesticServiceRequest = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  requested_date?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type MajesticProperty = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string;
  price?: number;
  currency?: string;
  property_type: 'villa' | 'apartment' | 'mansion' | 'penthouse';
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  images?: string[];
  is_available: boolean;
  is_featured: boolean;
  access_level: 'vip' | 'black';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type MajesticMessage = {
  id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  is_from_user: boolean;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type MajesticPayment = {
  id: string;
  user_id: string;
  payment_type: 'subscription' | 'service' | 'booking' | 'property';
  reference_id?: string;
  amount?: number;
  currency?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  stripe_payment_intent_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type MajesticTransaction = {
  id: string;
  user_id: string;
  payment_id?: string;
  transaction_type: 'payment' | 'refund' | 'credit';
  amount?: number;
  currency?: string;
  description: string;
  balance_after?: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type MajesticDocument = {
  id: string;
  user_id: string;
  booking_id?: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  is_encrypted: boolean;
  access_code?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type MajesticNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking' | 'chauffeur' | 'checkout' | 'service' | 'payment' | 'system';
  is_read: boolean;
  action_url?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

// Extended Supabase client type
declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Tables: {
        majestic_subscriptions: MajesticSubscription;
        majestic_bookings: MajesticBooking;
        majestic_services: MajesticService;
        majestic_service_requests: MajesticServiceRequest;
        majestic_properties: MajesticProperty;
        majestic_messages: MajesticMessage;
        majestic_payments: MajesticPayment;
        majestic_transactions: MajesticTransaction;
        majestic_documents: MajesticDocument;
        majestic_notifications: MajesticNotification;
      };
    };
  }
}
