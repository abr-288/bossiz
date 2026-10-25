export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      activities: {
        Row: {
          agency_id: string | null;
          available: boolean | null;
          available_dates: string[];
          category: string;
          created_at: string;
          currency: string;
          description: string | null;
          duration: string;
          featured: boolean | null;
          highlights: string[] | null;
          id: string;
          image_url: string | null;
          included: string[] | null;
          latitude: number | null;
          location: string;
          longitude: number | null;
          maps_url: string | null;
          name: string;
          price_per_unit: number;
          rating: number | null;
          reviews: number | null;
          translations: Json;
          updated_at: string;
        };
        Insert: {
          agency_id?: string | null;
          available?: boolean | null;
          available_dates?: string[];
          category: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          duration: string;
          featured?: boolean | null;
          highlights?: string[] | null;
          id?: string;
          image_url?: string | null;
          included?: string[] | null;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          maps_url?: string | null;
          name: string;
          price_per_unit: number;
          rating?: number | null;
          reviews?: number | null;
          translations?: Json;
          updated_at?: string;
        };
        Update: {
          agency_id?: string | null;
          available?: boolean | null;
          available_dates?: string[];
          category?: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          duration?: string;
          featured?: boolean | null;
          highlights?: string[] | null;
          id?: string;
          image_url?: string | null;
          included?: string[] | null;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          maps_url?: string | null;
          name?: string;
          price_per_unit?: number;
          rating?: number | null;
          reviews?: number | null;
          translations?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      advertisements: {
        Row: {
          background_color: string | null;
          created_at: string;
          description: string | null;
          expires_at: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          link_text: string | null;
          link_url: string | null;
          position: string | null;
          sort_order: number | null;
          starts_at: string | null;
          text_color: string | null;
          title: string;
          translations: Json;
          updated_at: string;
        };
        Insert: {
          background_color?: string | null;
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          link_text?: string | null;
          link_url?: string | null;
          position?: string | null;
          sort_order?: number | null;
          starts_at?: string | null;
          text_color?: string | null;
          title: string;
          translations?: Json;
          updated_at?: string;
        };
        Update: {
          background_color?: string | null;
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          link_text?: string | null;
          link_url?: string | null;
          position?: string | null;
          sort_order?: number | null;
          starts_at?: string | null;
          text_color?: string | null;
          title?: string;
          translations?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      agencies: {
        Row: {
          car_plan_id: string | null;
          car_plan_started_at: string | null;
          category: string | null;
          commission_rate: number | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          description: string | null;
          enabled_features: Json;
          id: string;
          is_active: boolean | null;
          is_visible: boolean | null;
          logo_url: string | null;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          car_plan_id?: string | null;
          car_plan_started_at?: string | null;
          category?: string | null;
          commission_rate?: number | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          enabled_features?: Json;
          id?: string;
          is_active?: boolean | null;
          is_visible?: boolean | null;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          car_plan_id?: string | null;
          car_plan_started_at?: string | null;
          category?: string | null;
          commission_rate?: number | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          enabled_features?: Json;
          id?: string;
          is_active?: boolean | null;
          is_visible?: boolean | null;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agencies_car_plan_id_fkey";
            columns: ["car_plan_id"];
            isOneToOne: false;
            referencedRelation: "car_partner_plans";
            referencedColumns: ["plan_id"];
          },
        ];
      };
      agency_branding_subscriptions: {
        Row: {
          agency_id: string;
          amount_due: number;
          created_at: string;
          currency: string;
          ends_at: string | null;
          id: string;
          paid_at: string | null;
          starts_at: string | null;
          status: string;
          transaction_id: string | null;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          amount_due?: number;
          created_at?: string;
          currency?: string;
          ends_at?: string | null;
          id?: string;
          paid_at?: string | null;
          starts_at?: string | null;
          status?: string;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          amount_due?: number;
          created_at?: string;
          currency?: string;
          ends_at?: string | null;
          id?: string;
          paid_at?: string | null;
          starts_at?: string | null;
          status?: string;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agency_branding_subscriptions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_commission_rates: {
        Row: {
          agency_id: string;
          created_at: string;
          effective_from: string;
          id: string;
          platform_rate: number;
          set_by: string | null;
        };
        Insert: {
          agency_id: string;
          created_at?: string;
          effective_from: string;
          id?: string;
          platform_rate: number;
          set_by?: string | null;
        };
        Update: {
          agency_id?: string;
          created_at?: string;
          effective_from?: string;
          id?: string;
          platform_rate?: number;
          set_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agency_commission_rates_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_payout_details: {
        Row: {
          agency_id: string;
          bank_details: Json | null;
          beneficiary_name: string | null;
          mobile_money_number: string | null;
          payment_method: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          bank_details?: Json | null;
          beneficiary_name?: string | null;
          mobile_money_number?: string | null;
          payment_method: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          bank_details?: Json | null;
          beneficiary_name?: string | null;
          mobile_money_number?: string | null;
          payment_method?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agency_payout_details_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: true;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      artisan_orders: {
        Row: {
          artisan_id: string;
          created_at: string;
          currency: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          id: string;
          message: string | null;
          product_name: string;
          quantity: number;
          status: string;
          total_amount: number | null;
          unit_price: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          artisan_id: string;
          created_at?: string;
          currency?: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          id?: string;
          message?: string | null;
          product_name: string;
          quantity?: number;
          status?: string;
          total_amount?: number | null;
          unit_price: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          artisan_id?: string;
          created_at?: string;
          currency?: string;
          customer_email?: string;
          customer_name?: string;
          customer_phone?: string;
          id?: string;
          message?: string | null;
          product_name?: string;
          quantity?: number;
          status?: string;
          total_amount?: number | null;
          unit_price?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "artisan_orders_artisan_id_fkey";
            columns: ["artisan_id"];
            isOneToOne: false;
            referencedRelation: "artisans";
            referencedColumns: ["id"];
          },
        ];
      };
      artisans: {
        Row: {
          address: string | null;
          agency_id: string;
          bio: string | null;
          craft_type: string;
          created_at: string;
          gallery: string[];
          id: string;
          image_url: string | null;
          is_active: boolean;
          latitude: number | null;
          location: string;
          longitude: number | null;
          maps_url: string | null;
          name: string;
          phone: string | null;
          products: Json;
          rating: number;
          total_reviews: number;
          translations: Json;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          address?: string | null;
          agency_id: string;
          bio?: string | null;
          craft_type: string;
          created_at?: string;
          gallery?: string[];
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          maps_url?: string | null;
          name: string;
          phone?: string | null;
          products?: Json;
          rating?: number;
          total_reviews?: number;
          translations?: Json;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          address?: string | null;
          agency_id?: string;
          bio?: string | null;
          craft_type?: string;
          created_at?: string;
          gallery?: string[];
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          maps_url?: string | null;
          name?: string;
          phone?: string | null;
          products?: Json;
          rating?: number;
          total_reviews?: number;
          translations?: Json;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "artisans_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      assistance_logs: {
        Row: {
          assistance_type: string;
          created_at: string | null;
          follow_up_required: boolean | null;
          id: string;
          issue_description: string | null;
          request_time: string | null;
          resolution: string | null;
          resolution_time: string | null;
          response_time: string | null;
          satisfaction_rating: number | null;
          staff_id: string | null;
          user_id: string;
        };
        Insert: {
          assistance_type: string;
          created_at?: string | null;
          follow_up_required?: boolean | null;
          id?: string;
          issue_description?: string | null;
          request_time?: string | null;
          resolution?: string | null;
          resolution_time?: string | null;
          response_time?: string | null;
          satisfaction_rating?: number | null;
          staff_id?: string | null;
          user_id: string;
        };
        Update: {
          assistance_type?: string;
          created_at?: string | null;
          follow_up_required?: boolean | null;
          id?: string;
          issue_description?: string | null;
          request_time?: string | null;
          resolution?: string | null;
          resolution_time?: string | null;
          response_time?: string | null;
          satisfaction_rating?: number | null;
          staff_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assistance_logs_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "concierge_staff";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_periods: {
        Row: {
          amount: number;
          billing_cycle: string;
          created_at: string | null;
          currency: string;
          due_date: string;
          end_date: string;
          id: string;
          invoice_id: string | null;
          paid_date: string | null;
          payment_intent_id: string | null;
          payment_method_id: string | null;
          retry_count: number | null;
          start_date: string;
          status: string;
          updated_at: string | null;
          user_subscription_id: string;
        };
        Insert: {
          amount: number;
          billing_cycle: string;
          created_at?: string | null;
          currency?: string;
          due_date: string;
          end_date: string;
          id?: string;
          invoice_id?: string | null;
          paid_date?: string | null;
          payment_intent_id?: string | null;
          payment_method_id?: string | null;
          retry_count?: number | null;
          start_date: string;
          status?: string;
          updated_at?: string | null;
          user_subscription_id: string;
        };
        Update: {
          amount?: number;
          billing_cycle?: string;
          created_at?: string | null;
          currency?: string;
          due_date?: string;
          end_date?: string;
          id?: string;
          invoice_id?: string | null;
          paid_date?: string | null;
          payment_intent_id?: string | null;
          payment_method_id?: string | null;
          retry_count?: number | null;
          start_date?: string;
          status?: string;
          updated_at?: string | null;
          user_subscription_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_periods_user_subscription_id_fkey";
            columns: ["user_subscription_id"];
            isOneToOne: false;
            referencedRelation: "active_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_periods_user_subscription_id_fkey";
            columns: ["user_subscription_id"];
            isOneToOne: false;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          amount_due_now: number;
          amount_paid: number;
          approval_status: string | null;
          approved_at: string | null;
          approved_by: string | null;
          balance_due: number;
          balance_paid_at: string | null;
          balance_paid_by: string | null;
          balance_paid_on_site: boolean;
          booking_details: Json | null;
          company_id: string | null;
          created_at: string;
          currency: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          deposit_percent: number;
          end_date: string | null;
          external_ref: string | null;
          flight_status: string | null;
          guests: number;
          id: string;
          notes: string | null;
          payment_plan: string;
          payment_status: Database["public"]["Enums"]["payment_status"];
          pnr: string | null;
          prebooking_id: string | null;
          service_id: string;
          start_date: string;
          status: Database["public"]["Enums"]["booking_status"];
          supplier_cost: number | null;
          supplier_cost_currency: string | null;
          total_price: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_due_now?: number;
          amount_paid?: number;
          approval_status?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          balance_due?: number;
          balance_paid_at?: string | null;
          balance_paid_by?: string | null;
          balance_paid_on_site?: boolean;
          booking_details?: Json | null;
          company_id?: string | null;
          created_at?: string;
          currency?: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          deposit_percent?: number;
          end_date?: string | null;
          external_ref?: string | null;
          flight_status?: string | null;
          guests?: number;
          id?: string;
          notes?: string | null;
          payment_plan?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          pnr?: string | null;
          prebooking_id?: string | null;
          service_id: string;
          start_date: string;
          status?: Database["public"]["Enums"]["booking_status"];
          supplier_cost?: number | null;
          supplier_cost_currency?: string | null;
          total_price: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_due_now?: number;
          amount_paid?: number;
          approval_status?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          balance_due?: number;
          balance_paid_at?: string | null;
          balance_paid_by?: string | null;
          balance_paid_on_site?: boolean;
          booking_details?: Json | null;
          company_id?: string | null;
          created_at?: string;
          currency?: string;
          customer_email?: string;
          customer_name?: string;
          customer_phone?: string;
          deposit_percent?: number;
          end_date?: string | null;
          external_ref?: string | null;
          flight_status?: string | null;
          guests?: number;
          id?: string;
          notes?: string | null;
          payment_plan?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          pnr?: string | null;
          prebooking_id?: string | null;
          service_id?: string;
          start_date?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          supplier_cost?: number | null;
          supplier_cost_currency?: string | null;
          total_price?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      bossiz_global_config: {
        Row: {
          config: Json;
          created_at: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bossiz_sites_config: {
        Row: {
          bg_color: string;
          border_color: string;
          color: string;
          contact: Json;
          created_at: string;
          description: string;
          features: string[] | null;
          highlights: string[] | null;
          id: string;
          image: string;
          location: string;
          route: string;
          stats: Json;
          subtitle: string;
          tagline: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          bg_color: string;
          border_color: string;
          color: string;
          contact?: Json;
          created_at?: string;
          description: string;
          features?: string[] | null;
          highlights?: string[] | null;
          id: string;
          image: string;
          location: string;
          route: string;
          stats?: Json;
          subtitle: string;
          tagline: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          bg_color?: string;
          border_color?: string;
          color?: string;
          contact?: Json;
          created_at?: string;
          description?: string;
          features?: string[] | null;
          highlights?: string[] | null;
          id?: string;
          image?: string;
          location?: string;
          route?: string;
          stats?: Json;
          subtitle?: string;
          tagline?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      car_partner_plans: {
        Row: {
          commission_rate: number;
          created_at: string;
          currency: string;
          featured_slots: number;
          features: Json;
          id: string;
          is_active: boolean;
          max_vehicles: number | null;
          monthly_price: number;
          name: string;
          plan_id: string;
          sort_order: number;
          support_level: string;
          tagline: string | null;
          translations: Json;
          updated_at: string;
          yearly_price: number;
        };
        Insert: {
          commission_rate?: number;
          created_at?: string;
          currency?: string;
          featured_slots?: number;
          features?: Json;
          id?: string;
          is_active?: boolean;
          max_vehicles?: number | null;
          monthly_price?: number;
          name: string;
          plan_id: string;
          sort_order?: number;
          support_level?: string;
          tagline?: string | null;
          translations?: Json;
          updated_at?: string;
          yearly_price?: number;
        };
        Update: {
          commission_rate?: number;
          created_at?: string;
          currency?: string;
          featured_slots?: number;
          features?: Json;
          id?: string;
          is_active?: boolean;
          max_vehicles?: number | null;
          monthly_price?: number;
          name?: string;
          plan_id?: string;
          sort_order?: number;
          support_level?: string;
          tagline?: string | null;
          translations?: Json;
          updated_at?: string;
          yearly_price?: number;
        };
        Relationships: [];
      };
      car_partner_subscriptions: {
        Row: {
          agency_id: string;
          amount_due: number;
          billing_cycle: string;
          created_at: string;
          currency: string;
          ends_at: string | null;
          id: string;
          paid_at: string | null;
          plan_id: string;
          starts_at: string | null;
          status: string;
          transaction_id: string | null;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          amount_due: number;
          billing_cycle: string;
          created_at?: string;
          currency?: string;
          ends_at?: string | null;
          id?: string;
          paid_at?: string | null;
          plan_id: string;
          starts_at?: string | null;
          status?: string;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          amount_due?: number;
          billing_cycle?: string;
          created_at?: string;
          currency?: string;
          ends_at?: string | null;
          id?: string;
          paid_at?: string | null;
          plan_id?: string;
          starts_at?: string | null;
          status?: string;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "car_partner_subscriptions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "car_partner_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "car_partner_plans";
            referencedColumns: ["plan_id"];
          },
        ];
      };
      commissions: {
        Row: {
          agency_id: string;
          booking_amount: number;
          booking_id: string | null;
          commission_amount: number;
          commission_rate: number;
          created_at: string;
          id: string;
          paid_at: string | null;
          payout_due_at: string | null;
          payout_error: string | null;
          payout_provider_id: string | null;
          payout_reference: string | null;
          payout_status: string;
          source_id: string | null;
          source_type: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          booking_amount: number;
          booking_id?: string | null;
          commission_amount: number;
          commission_rate: number;
          created_at?: string;
          id?: string;
          paid_at?: string | null;
          payout_due_at?: string | null;
          payout_error?: string | null;
          payout_provider_id?: string | null;
          payout_reference?: string | null;
          payout_status?: string;
          source_id?: string | null;
          source_type?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          booking_amount?: number;
          booking_id?: string | null;
          commission_amount?: number;
          commission_rate?: number;
          created_at?: string;
          id?: string;
          paid_at?: string | null;
          payout_due_at?: string | null;
          payout_error?: string | null;
          payout_provider_id?: string | null;
          payout_reference?: string | null;
          payout_status?: string;
          source_id?: string | null;
          source_type?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commissions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commissions_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          billing_email: string | null;
          billing_phone: string | null;
          created_at: string;
          description: string | null;
          id: string;
          invite_code: string;
          is_active: boolean;
          logo_url: string | null;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          billing_email?: string | null;
          billing_phone?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          invite_code?: string;
          is_active?: boolean;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          billing_email?: string | null;
          billing_phone?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          invite_code?: string;
          is_active?: boolean;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_members: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      concierge_requests: {
        Row: {
          assigned_concierge: string | null;
          completion_time: string | null;
          created_at: string | null;
          description: string;
          id: string;
          notes: string | null;
          priority: string;
          request_type: string;
          response_time: string | null;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          assigned_concierge?: string | null;
          completion_time?: string | null;
          created_at?: string | null;
          description: string;
          id?: string;
          notes?: string | null;
          priority?: string;
          request_type: string;
          response_time?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          assigned_concierge?: string | null;
          completion_time?: string | null;
          created_at?: string | null;
          description?: string;
          id?: string;
          notes?: string | null;
          priority?: string;
          request_type?: string;
          response_time?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      concierge_services: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          icon_name: string | null;
          id: string;
          is_available: boolean | null;
          name: string;
          price_range: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          icon_name?: string | null;
          id?: string;
          is_available?: boolean | null;
          name: string;
          price_range?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          icon_name?: string | null;
          id?: string;
          is_available?: boolean | null;
          name?: string;
          price_range?: string | null;
        };
        Relationships: [];
      };
      concierge_staff: {
        Row: {
          created_at: string | null;
          current_requests: number | null;
          email: string;
          id: string;
          is_available: boolean | null;
          languages: string[] | null;
          max_requests: number | null;
          name: string;
          phone: string | null;
          rating: number | null;
          specialization: string[] | null;
          timezone: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_requests?: number | null;
          email: string;
          id?: string;
          is_available?: boolean | null;
          languages?: string[] | null;
          max_requests?: number | null;
          name: string;
          phone?: string | null;
          rating?: number | null;
          specialization?: string[] | null;
          timezone?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_requests?: number | null;
          email?: string;
          id?: string;
          is_available?: boolean | null;
          languages?: string[] | null;
          max_requests?: number | null;
          name?: string;
          phone?: string | null;
          rating?: number | null;
          specialization?: string[] | null;
          timezone?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      culture_entries: {
        Row: {
          category: string;
          content: string | null;
          created_at: string;
          featured: boolean;
          gallery: Json;
          id: string;
          image_caption: string | null;
          image_credit: string | null;
          image_source_url: string | null;
          image_url: string | null;
          link_url: string | null;
          location: string | null;
          period: string | null;
          published: boolean;
          slug: string | null;
          sort_order: number;
          summary: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          content?: string | null;
          created_at?: string;
          featured?: boolean;
          gallery?: Json;
          id?: string;
          image_caption?: string | null;
          image_credit?: string | null;
          image_source_url?: string | null;
          image_url?: string | null;
          link_url?: string | null;
          location?: string | null;
          period?: string | null;
          published?: boolean;
          slug?: string | null;
          sort_order?: number;
          summary: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          content?: string | null;
          created_at?: string;
          featured?: boolean;
          gallery?: Json;
          id?: string;
          image_caption?: string | null;
          image_credit?: string | null;
          image_source_url?: string | null;
          image_url?: string | null;
          link_url?: string | null;
          location?: string | null;
          period?: string | null;
          published?: boolean;
          slug?: string | null;
          sort_order?: number;
          summary?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customizable_plans: {
        Row: {
          color_scheme: string | null;
          created_at: string | null;
          description: string | null;
          features: string[] | null;
          id: string;
          is_popular: boolean | null;
          is_visible: boolean | null;
          name: string;
          plan_id: string;
          price: string;
          price_note: string | null;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          color_scheme?: string | null;
          created_at?: string | null;
          description?: string | null;
          features?: string[] | null;
          id?: string;
          is_popular?: boolean | null;
          is_visible?: boolean | null;
          name: string;
          plan_id: string;
          price: string;
          price_note?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          color_scheme?: string | null;
          created_at?: string | null;
          description?: string | null;
          features?: string[] | null;
          id?: string;
          is_popular?: boolean | null;
          is_visible?: boolean | null;
          name?: string;
          plan_id?: string;
          price?: string;
          price_note?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      dashboard_preferences: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          layout_name: string;
          updated_at: string | null;
          user_id: string;
          widgets_config: Json;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          layout_name?: string;
          updated_at?: string | null;
          user_id: string;
          widgets_config?: Json;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          layout_name?: string;
          updated_at?: string | null;
          user_id?: string;
          widgets_config?: Json;
        };
        Relationships: [];
      };
      destinations_cache: {
        Row: {
          cache_key: string;
          created_at: string;
          destinations: Json;
          expires_at: string;
          id: string;
          source: string;
        };
        Insert: {
          cache_key: string;
          created_at?: string;
          destinations: Json;
          expires_at: string;
          id?: string;
          source?: string;
        };
        Update: {
          cache_key?: string;
          created_at?: string;
          destinations?: Json;
          expires_at?: string;
          id?: string;
          source?: string;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          created_at: string | null;
          html_content: string;
          id: string;
          is_active: boolean | null;
          name: string;
          subject: string;
          type: string;
          updated_at: string | null;
          variables: Json | null;
        };
        Insert: {
          created_at?: string | null;
          html_content: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          subject: string;
          type: string;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Update: {
          created_at?: string | null;
          html_content?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          subject?: string;
          type?: string;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          ai_tags: string[];
          category: string;
          city: string | null;
          country: string | null;
          country_code: string | null;
          created_at: string;
          curated_at: string | null;
          external_id: string | null;
          genre: string | null;
          highlight_score: number | null;
          id: string;
          image_url: string | null;
          info: string | null;
          is_featured: boolean;
          is_published: boolean;
          latitude: number | null;
          local_date: string;
          local_time: string | null;
          longitude: number | null;
          name: string;
          onsale_start: string | null;
          price_currency: string | null;
          price_max: number | null;
          price_max_xof: number | null;
          price_min: number | null;
          price_min_xof: number | null;
          slug: string;
          source: string;
          starts_at: string | null;
          status: string;
          summary_fr: string | null;
          synced_at: string | null;
          ticket_url: string | null;
          timezone: string | null;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
        };
        Insert: {
          ai_tags?: string[];
          category?: string;
          city?: string | null;
          country?: string | null;
          country_code?: string | null;
          created_at?: string;
          curated_at?: string | null;
          external_id?: string | null;
          genre?: string | null;
          highlight_score?: number | null;
          id?: string;
          image_url?: string | null;
          info?: string | null;
          is_featured?: boolean;
          is_published?: boolean;
          latitude?: number | null;
          local_date: string;
          local_time?: string | null;
          longitude?: number | null;
          name: string;
          onsale_start?: string | null;
          price_currency?: string | null;
          price_max?: number | null;
          price_max_xof?: number | null;
          price_min?: number | null;
          price_min_xof?: number | null;
          slug: string;
          source: string;
          starts_at?: string | null;
          status?: string;
          summary_fr?: string | null;
          synced_at?: string | null;
          ticket_url?: string | null;
          timezone?: string | null;
          updated_at?: string;
          venue_address?: string | null;
          venue_name?: string | null;
        };
        Update: {
          ai_tags?: string[];
          category?: string;
          city?: string | null;
          country?: string | null;
          country_code?: string | null;
          created_at?: string;
          curated_at?: string | null;
          external_id?: string | null;
          genre?: string | null;
          highlight_score?: number | null;
          id?: string;
          image_url?: string | null;
          info?: string | null;
          is_featured?: boolean;
          is_published?: boolean;
          latitude?: number | null;
          local_date?: string;
          local_time?: string | null;
          longitude?: number | null;
          name?: string;
          onsale_start?: string | null;
          price_currency?: string | null;
          price_max?: number | null;
          price_max_xof?: number | null;
          price_min?: number | null;
          price_min_xof?: number | null;
          slug?: string;
          source?: string;
          starts_at?: string | null;
          status?: string;
          summary_fr?: string | null;
          synced_at?: string | null;
          ticket_url?: string | null;
          timezone?: string | null;
          updated_at?: string;
          venue_address?: string | null;
          venue_name?: string | null;
        };
        Relationships: [];
      };
      exclusive_services: {
        Row: {
          availability: boolean | null;
          booking_lead_time: number | null;
          booking_required: boolean | null;
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          pricing_model: string | null;
          requirements: string[] | null;
          service_type: string;
          updated_at: string | null;
        };
        Insert: {
          availability?: boolean | null;
          booking_lead_time?: number | null;
          booking_required?: boolean | null;
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          pricing_model?: string | null;
          requirements?: string[] | null;
          service_type: string;
          updated_at?: string | null;
        };
        Update: {
          availability?: boolean | null;
          booking_lead_time?: number | null;
          booking_required?: boolean | null;
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          pricing_model?: string | null;
          requirements?: string[] | null;
          service_type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      flight_prebookings: {
        Row: {
          adults_count: number;
          base_fare: number;
          booking_id: string | null;
          booking_reference: string;
          children_count: number;
          created_at: string;
          currency: string;
          expires_at: string;
          flight_data: Json;
          id: string;
          passengers: Json;
          price_signature: string | null;
          provider: string;
          service_fee: number;
          status: string;
          taxes: number;
          total_amount: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          adults_count?: number;
          base_fare: number;
          booking_id?: string | null;
          booking_reference: string;
          children_count?: number;
          created_at?: string;
          currency?: string;
          expires_at: string;
          flight_data: Json;
          id?: string;
          passengers?: Json;
          price_signature?: string | null;
          provider?: string;
          service_fee?: number;
          status?: string;
          taxes?: number;
          total_amount: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          adults_count?: number;
          base_fare?: number;
          booking_id?: string | null;
          booking_reference?: string;
          children_count?: number;
          created_at?: string;
          currency?: string;
          expires_at?: string;
          flight_data?: Json;
          id?: string;
          passengers?: Json;
          price_signature?: string | null;
          provider?: string;
          service_fee?: number;
          status?: string;
          taxes?: number;
          total_amount?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      global_settings: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          setting_key: string;
          setting_type: string | null;
          setting_value: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          setting_key: string;
          setting_type?: string | null;
          setting_value?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          setting_key?: string;
          setting_type?: string | null;
          setting_value?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      homepage_features: {
        Row: {
          color: string | null;
          created_at: string;
          description: string;
          feature_id: string;
          icon: string;
          id: string;
          order_num: number | null;
          title: string;
          translations: Json;
          updated_at: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          description: string;
          feature_id: string;
          icon: string;
          id?: string;
          order_num?: number | null;
          title: string;
          translations?: Json;
          updated_at?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          description?: string;
          feature_id?: string;
          icon?: string;
          id?: string;
          order_num?: number | null;
          title?: string;
          translations?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      homepage_sections: {
        Row: {
          created_at: string;
          id: string;
          order_num: number | null;
          subtitle: string | null;
          title: string;
          updated_at: string;
          visible: boolean | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          order_num?: number | null;
          subtitle?: string | null;
          title: string;
          updated_at?: string;
          visible?: boolean | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_num?: number | null;
          subtitle?: string | null;
          title?: string;
          updated_at?: string;
          visible?: boolean | null;
        };
        Relationships: [];
      };
      hotel_booking_rooms: {
        Row: {
          booking_id: string;
          check_in: string;
          check_out: string;
          created_at: string;
          id: string;
          occupancy: number;
          price_per_night: number;
          quantity: number;
          rate_id: string | null;
          rate_snapshot: Json;
          room_type_id: string;
        };
        Insert: {
          booking_id: string;
          check_in: string;
          check_out: string;
          created_at?: string;
          id?: string;
          occupancy: number;
          price_per_night: number;
          quantity: number;
          rate_id?: string | null;
          rate_snapshot?: Json;
          room_type_id: string;
        };
        Update: {
          booking_id?: string;
          check_in?: string;
          check_out?: string;
          created_at?: string;
          id?: string;
          occupancy?: number;
          price_per_night?: number;
          quantity?: number;
          rate_id?: string | null;
          rate_snapshot?: Json;
          room_type_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hotel_booking_rooms_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hotel_booking_rooms_rate_id_fkey";
            columns: ["rate_id"];
            isOneToOne: false;
            referencedRelation: "hotel_rates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hotel_booking_rooms_room_type_id_fkey";
            columns: ["room_type_id"];
            isOneToOne: false;
            referencedRelation: "hotel_room_types";
            referencedColumns: ["id"];
          },
        ];
      };
      hotel_onsite_commission_invoices: {
        Row: {
          agency_id: string;
          booking_ids: string[];
          commission_amount: number;
          commission_rate: number;
          created_at: string;
          currency: string;
          due_at: string;
          id: string;
          issued_at: string;
          issued_by: string | null;
          paid_at: string | null;
          period: string;
          status: string;
          stays_amount: number;
          stays_count: number;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          booking_ids: string[];
          commission_amount: number;
          commission_rate?: number;
          created_at?: string;
          currency?: string;
          due_at: string;
          id?: string;
          issued_at?: string;
          issued_by?: string | null;
          paid_at?: string | null;
          period: string;
          status?: string;
          stays_amount: number;
          stays_count: number;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          booking_ids?: string[];
          commission_amount?: number;
          commission_rate?: number;
          created_at?: string;
          currency?: string;
          due_at?: string;
          id?: string;
          issued_at?: string;
          issued_by?: string | null;
          paid_at?: string | null;
          period?: string;
          status?: string;
          stays_amount?: number;
          stays_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hotel_onsite_commission_invoices_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      hotel_rates: {
        Row: {
          breakfast_included: boolean;
          created_at: string;
          free_cancellation: boolean;
          free_cancellation_days: number;
          id: string;
          is_active: boolean;
          late_cancellation_fee_percent: number;
          occupancy: number;
          pay_at_property: boolean;
          price_per_night: number;
          room_type_id: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          breakfast_included?: boolean;
          created_at?: string;
          free_cancellation?: boolean;
          free_cancellation_days?: number;
          id?: string;
          is_active?: boolean;
          late_cancellation_fee_percent?: number;
          occupancy: number;
          pay_at_property?: boolean;
          price_per_night: number;
          room_type_id: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          breakfast_included?: boolean;
          created_at?: string;
          free_cancellation?: boolean;
          free_cancellation_days?: number;
          id?: string;
          is_active?: boolean;
          late_cancellation_fee_percent?: number;
          occupancy?: number;
          pay_at_property?: boolean;
          price_per_night?: number;
          room_type_id?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hotel_rates_room_type_id_fkey";
            columns: ["room_type_id"];
            isOneToOne: false;
            referencedRelation: "hotel_room_types";
            referencedColumns: ["id"];
          },
        ];
      };
      hotel_room_types: {
        Row: {
          amenities: string[];
          bed_info: string | null;
          created_at: string;
          description: string | null;
          id: string;
          images: string[];
          is_active: boolean;
          max_guests: number;
          name: string;
          service_id: string;
          size_m2: number | null;
          sort_order: number;
          total_units: number;
          updated_at: string;
        };
        Insert: {
          amenities?: string[];
          bed_info?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[];
          is_active?: boolean;
          max_guests?: number;
          name: string;
          service_id: string;
          size_m2?: number | null;
          sort_order?: number;
          total_units?: number;
          updated_at?: string;
        };
        Update: {
          amenities?: string[];
          bed_info?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[];
          is_active?: boolean;
          max_guests?: number;
          name?: string;
          service_id?: string;
          size_m2?: number | null;
          sort_order?: number;
          total_units?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hotel_room_types_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_credentials: {
        Row: {
          category: string;
          created_at: string;
          credentials: Json;
          id: string;
          is_active: boolean;
          label: string;
          provider: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          credentials?: Json;
          id?: string;
          is_active?: boolean;
          label: string;
          provider: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          credentials?: Json;
          id?: string;
          is_active?: boolean;
          label?: string;
          provider?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          amount: number;
          billing_period_id: string | null;
          booking_id: string | null;
          created_at: string | null;
          currency: string;
          due_date: string | null;
          id: string;
          invoice_number: string;
          items: Json | null;
          metadata: Json | null;
          paid_date: string | null;
          status: string;
          tax_amount: number | null;
          total_amount: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          billing_period_id?: string | null;
          booking_id?: string | null;
          created_at?: string | null;
          currency?: string;
          due_date?: string | null;
          id?: string;
          invoice_number: string;
          items?: Json | null;
          metadata?: Json | null;
          paid_date?: string | null;
          status?: string;
          tax_amount?: number | null;
          total_amount: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          billing_period_id?: string | null;
          booking_id?: string | null;
          created_at?: string | null;
          currency?: string;
          due_date?: string | null;
          id?: string;
          invoice_number?: string;
          items?: Json | null;
          metadata?: Json | null;
          paid_date?: string | null;
          status?: string;
          tax_amount?: number | null;
          total_amount?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_billing_period_id_fkey";
            columns: ["billing_period_id"];
            isOneToOne: false;
            referencedRelation: "billing_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      loyalty_accounts: {
        Row: {
          checkin_streak: number;
          created_at: string;
          last_checkin_date: string | null;
          referral_code: string;
          referral_rewarded: boolean;
          referred_by: string | null;
          user_id: string;
        };
        Insert: {
          checkin_streak?: number;
          created_at?: string;
          last_checkin_date?: string | null;
          referral_code: string;
          referral_rewarded?: boolean;
          referred_by?: string | null;
          user_id: string;
        };
        Update: {
          checkin_streak?: number;
          created_at?: string;
          last_checkin_date?: string | null;
          referral_code?: string;
          referral_rewarded?: boolean;
          referred_by?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      loyalty_settings: {
        Row: {
          daily_checkin_points: number;
          id: boolean;
          max_redeem_ratio: number;
          min_redeem_points: number;
          point_value_xof: number;
          points_per_100_xof: number;
          points_validity_months: number;
          referral_referee_points: number;
          referral_referrer_points: number;
          streak_bonus_points: number;
          streak_days: number;
          updated_at: string;
        };
        Insert: {
          daily_checkin_points?: number;
          id?: boolean;
          max_redeem_ratio?: number;
          min_redeem_points?: number;
          point_value_xof?: number;
          points_per_100_xof?: number;
          points_validity_months?: number;
          referral_referee_points?: number;
          referral_referrer_points?: number;
          streak_bonus_points?: number;
          streak_days?: number;
          updated_at?: string;
        };
        Update: {
          daily_checkin_points?: number;
          id?: boolean;
          max_redeem_ratio?: number;
          min_redeem_points?: number;
          point_value_xof?: number;
          points_per_100_xof?: number;
          points_validity_months?: number;
          referral_referee_points?: number;
          referral_referrer_points?: number;
          streak_bonus_points?: number;
          streak_days?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      loyalty_tiers: {
        Row: {
          code: string;
          min_points: number;
          multiplier: number;
          name: string;
        };
        Insert: {
          code: string;
          min_points: number;
          multiplier?: number;
          name: string;
        };
        Update: {
          code?: string;
          min_points?: number;
          multiplier?: number;
          name?: string;
        };
        Relationships: [];
      };
      loyalty_transactions: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          kind: string;
          points: number;
          reference_id: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          kind: string;
          points: number;
          reference_id?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          kind?: string;
          points?: number;
          reference_id?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      luxe_properties: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          images: string[] | null;
          is_active: boolean | null;
          location: string;
          name: string;
          price_info: string | null;
          specifications: Json | null;
          updated_at: string | null;
          virtual_tour_url: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          images?: string[] | null;
          is_active?: boolean | null;
          location: string;
          name: string;
          price_info?: string | null;
          specifications?: Json | null;
          updated_at?: string | null;
          virtual_tour_url?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          images?: string[] | null;
          is_active?: boolean | null;
          location?: string;
          name?: string;
          price_info?: string | null;
          specifications?: Json | null;
          updated_at?: string | null;
          virtual_tour_url?: string | null;
        };
        Relationships: [];
      };
      luxe_stay_details: {
        Row: {
          booking_id: string;
          created_at: string | null;
          documents: Json | null;
          id: string;
          smart_lock_code: string | null;
          timeline: Json | null;
          updated_at: string | null;
          welcome_guide_url: string | null;
        };
        Insert: {
          booking_id: string;
          created_at?: string | null;
          documents?: Json | null;
          id?: string;
          smart_lock_code?: string | null;
          timeline?: Json | null;
          updated_at?: string | null;
          welcome_guide_url?: string | null;
        };
        Update: {
          booking_id?: string;
          created_at?: string | null;
          documents?: Json | null;
          id?: string;
          smart_lock_code?: string | null;
          timeline?: Json | null;
          updated_at?: string | null;
          welcome_guide_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "luxe_stay_details_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      majestic_bookings: {
        Row: {
          booking_type: string;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          end_date: string | null;
          id: string;
          location: string | null;
          metadata: Json | null;
          start_date: string;
          status: string;
          title: string;
          total_amount: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          booking_type: string;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          location?: string | null;
          metadata?: Json | null;
          start_date: string;
          status?: string;
          title: string;
          total_amount?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          booking_type?: string;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          location?: string | null;
          metadata?: Json | null;
          start_date?: string;
          status?: string;
          title?: string;
          total_amount?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      majestic_documents: {
        Row: {
          access_code: string | null;
          booking_id: string | null;
          created_at: string | null;
          file_path: string;
          file_size: number | null;
          file_type: string;
          id: string;
          is_encrypted: boolean | null;
          metadata: Json | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_code?: string | null;
          booking_id?: string | null;
          created_at?: string | null;
          file_path: string;
          file_size?: number | null;
          file_type: string;
          id?: string;
          is_encrypted?: boolean | null;
          metadata?: Json | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_code?: string | null;
          booking_id?: string | null;
          created_at?: string | null;
          file_path?: string;
          file_size?: number | null;
          file_type?: string;
          id?: string;
          is_encrypted?: boolean | null;
          metadata?: Json | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "majestic_documents_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "majestic_bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      majestic_itineraries: {
        Row: {
          created_at: string | null;
          currency: string | null;
          description: string | null;
          end_date: string;
          id: string;
          metadata: Json | null;
          start_date: string;
          status: string | null;
          title: string;
          total_cost: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          end_date: string;
          id?: string;
          metadata?: Json | null;
          start_date: string;
          status?: string | null;
          title: string;
          total_cost?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          end_date?: string;
          id?: string;
          metadata?: Json | null;
          start_date?: string;
          status?: string | null;
          title?: string;
          total_cost?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      majestic_messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          is_from_user: boolean | null;
          is_read: boolean | null;
          message_type: string | null;
          metadata: Json | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          is_from_user?: boolean | null;
          is_read?: boolean | null;
          message_type?: string | null;
          metadata?: Json | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          is_from_user?: boolean | null;
          is_read?: boolean | null;
          message_type?: string | null;
          metadata?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      majestic_notifications: {
        Row: {
          action_url: string | null;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message: string;
          metadata: Json | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          metadata?: Json | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          metadata?: Json | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      majestic_payments: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string | null;
          id: string;
          metadata: Json | null;
          payment_method: string | null;
          payment_type: string;
          reference_id: string | null;
          status: string;
          stripe_payment_intent_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_method?: string | null;
          payment_type: string;
          reference_id?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_method?: string | null;
          payment_type?: string;
          reference_id?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      majestic_properties: {
        Row: {
          access_level: string | null;
          area_sqm: number | null;
          bathrooms: number | null;
          bedrooms: number | null;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          id: string;
          images: string[] | null;
          is_available: boolean | null;
          is_featured: boolean | null;
          location: string;
          metadata: Json | null;
          price: number | null;
          property_type: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          access_level?: string | null;
          area_sqm?: number | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          images?: string[] | null;
          is_available?: boolean | null;
          is_featured?: boolean | null;
          location: string;
          metadata?: Json | null;
          price?: number | null;
          property_type: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          access_level?: string | null;
          area_sqm?: number | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          images?: string[] | null;
          is_available?: boolean | null;
          is_featured?: boolean | null;
          location?: string;
          metadata?: Json | null;
          price?: number | null;
          property_type?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      majestic_service_requests: {
        Row: {
          completed_date: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          notes: string | null;
          priority: string | null;
          requested_date: string;
          service_id: string | null;
          status: string;
          title: string;
          total_amount: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_date?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          priority?: string | null;
          requested_date: string;
          service_id?: string | null;
          status?: string;
          title: string;
          total_amount?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_date?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          priority?: string | null;
          requested_date?: string;
          service_id?: string | null;
          status?: string;
          title?: string;
          total_amount?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "majestic_service_requests_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "majestic_services";
            referencedColumns: ["id"];
          },
        ];
      };
      majestic_services: {
        Row: {
          base_price: number | null;
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          metadata: Json | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          base_price?: number | null;
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          metadata?: Json | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          base_price?: number | null;
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          metadata?: Json | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      majestic_subscriptions: {
        Row: {
          created_at: string | null;
          end_date: string | null;
          id: string;
          metadata: Json | null;
          plan: string;
          start_date: string;
          status: string;
          stripe_subscription_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          metadata?: Json | null;
          plan: string;
          start_date?: string;
          status?: string;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          metadata?: Json | null;
          plan?: string;
          start_date?: string;
          status?: string;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      majestic_transactions: {
        Row: {
          amount: number;
          balance_after: number | null;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          payment_id: string | null;
          transaction_type: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          balance_after?: number | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_id?: string | null;
          transaction_type: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          balance_after?: number | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_id?: string | null;
          transaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "majestic_transactions_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "majestic_payments";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          subscribed_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          subscribed_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          subscribed_at?: string;
        };
        Relationships: [];
      };
      otp_codes: {
        Row: {
          attempts: number;
          channel: string;
          code_hash: string;
          consumed_at: string | null;
          created_at: string;
          destination: string;
          expires_at: string;
          id: string;
          max_attempts: number;
          purpose: string;
        };
        Insert: {
          attempts?: number;
          channel: string;
          code_hash: string;
          consumed_at?: string | null;
          created_at?: string;
          destination: string;
          expires_at: string;
          id?: string;
          max_attempts?: number;
          purpose?: string;
        };
        Update: {
          attempts?: number;
          channel?: string;
          code_hash?: string;
          consumed_at?: string | null;
          created_at?: string;
          destination?: string;
          expires_at?: string;
          id?: string;
          max_attempts?: number;
          purpose?: string;
        };
        Relationships: [];
      };
      page_sections: {
        Row: {
          background_color: string | null;
          button_color: string | null;
          button_hover_color: string | null;
          button_text: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_visible: boolean | null;
          page_key: string;
          section_key: string;
          sort_order: number | null;
          subtitle: string | null;
          text_color: string | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          background_color?: string | null;
          button_color?: string | null;
          button_hover_color?: string | null;
          button_text?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_visible?: boolean | null;
          page_key: string;
          section_key: string;
          sort_order?: number | null;
          subtitle?: string | null;
          text_color?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          background_color?: string | null;
          button_color?: string | null;
          button_hover_color?: string | null;
          button_text?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_visible?: boolean | null;
          page_key?: string;
          section_key?: string;
          sort_order?: number | null;
          subtitle?: string | null;
          text_color?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      partner_applications: {
        Row: {
          auto_approval_attempted_at: string | null;
          auto_approval_error: string | null;
          auto_approved_at: string | null;
          category: string | null;
          contact_email: string;
          contact_phone: string | null;
          created_at: string;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          preferred_payout_method: string | null;
          requested_car_plan_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          auto_approval_attempted_at?: string | null;
          auto_approval_error?: string | null;
          auto_approved_at?: string | null;
          category?: string | null;
          contact_email: string;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          preferred_payout_method?: string | null;
          requested_car_plan_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          auto_approval_attempted_at?: string | null;
          auto_approval_error?: string | null;
          auto_approved_at?: string | null;
          category?: string | null;
          contact_email?: string;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          preferred_payout_method?: string | null;
          requested_car_plan_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_applications_requested_car_plan_id_fkey";
            columns: ["requested_car_plan_id"];
            isOneToOne: false;
            referencedRelation: "car_partner_plans";
            referencedColumns: ["plan_id"];
          },
        ];
      };
      partner_categories: {
        Row: {
          created_at: string;
          description: string | null;
          is_active: boolean;
          key: string;
          label: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          is_active?: boolean;
          key: string;
          label: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          is_active?: boolean;
          key?: string;
          label?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      partner_category_modules: {
        Row: {
          category_key: string;
          module_key: string;
        };
        Insert: {
          category_key: string;
          module_key: string;
        };
        Update: {
          category_key?: string;
          module_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_category_modules_category_key_fkey";
            columns: ["category_key"];
            isOneToOne: false;
            referencedRelation: "partner_categories";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "partner_category_modules_module_key_fkey";
            columns: ["module_key"];
            isOneToOne: false;
            referencedRelation: "partner_modules";
            referencedColumns: ["key"];
          },
        ];
      };
      partner_modules: {
        Row: {
          feature_key: string | null;
          is_core: boolean;
          key: string;
          label: string;
          menu_group: string;
          service_type: string | null;
          sort_order: number;
        };
        Insert: {
          feature_key?: string | null;
          is_core?: boolean;
          key: string;
          label: string;
          menu_group: string;
          service_type?: string | null;
          sort_order?: number;
        };
        Update: {
          feature_key?: string | null;
          is_core?: boolean;
          key?: string;
          label?: string;
          menu_group?: string;
          service_type?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      partner_support_tickets: {
        Row: {
          agency_id: string;
          created_at: string;
          created_by: string;
          id: string;
          message: string;
          status: string;
          subject: string;
          topic: string;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          message: string;
          status?: string;
          subject: string;
          topic?: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          message?: string;
          status?: string;
          subject?: string;
          topic?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_support_tickets_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      passengers: {
        Row: {
          booking_id: string;
          created_at: string | null;
          date_of_birth: string | null;
          document_number: string | null;
          document_type: string | null;
          first_name: string;
          id: string;
          last_name: string;
          nationality: string | null;
          updated_at: string | null;
        };
        Insert: {
          booking_id: string;
          created_at?: string | null;
          date_of_birth?: string | null;
          document_number?: string | null;
          document_type?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          nationality?: string | null;
          updated_at?: string | null;
        };
        Update: {
          booking_id?: string;
          created_at?: string | null;
          date_of_birth?: string | null;
          document_number?: string | null;
          document_type?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          nationality?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "passengers_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_methods: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          metadata: Json | null;
          method_identifier: string;
          provider: string;
          type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          metadata?: Json | null;
          method_identifier: string;
          provider: string;
          type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          metadata?: Json | null;
          method_identifier?: string;
          provider?: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string;
          id: string;
          metadata: Json | null;
          payment_method: string | null;
          payment_provider: string | null;
          status: string;
          subscription_id: string | null;
          transaction_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency?: string;
          id?: string;
          metadata?: Json | null;
          payment_method?: string | null;
          payment_provider?: string | null;
          status?: string;
          subscription_id?: string | null;
          transaction_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string;
          id?: string;
          metadata?: Json | null;
          payment_method?: string | null;
          payment_provider?: string | null;
          status?: string;
          subscription_id?: string | null;
          transaction_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "active_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          agency_branding_subscription_id: string | null;
          amount: number;
          booking_id: string | null;
          car_partner_subscription_id: string | null;
          created_at: string | null;
          currency: string;
          id: string;
          ip_address: string | null;
          loyalty_discount_xof: number;
          loyalty_points_used: number;
          payment_data: Json | null;
          payment_method: string;
          payment_provider: string;
          prebooking_id: string | null;
          status: string;
          subscription_id: string | null;
          transaction_id: string | null;
          updated_at: string | null;
          user_id: string;
          verification_signature: string | null;
          verified_at: string | null;
        };
        Insert: {
          agency_branding_subscription_id?: string | null;
          amount: number;
          booking_id?: string | null;
          car_partner_subscription_id?: string | null;
          created_at?: string | null;
          currency?: string;
          id?: string;
          ip_address?: string | null;
          loyalty_discount_xof?: number;
          loyalty_points_used?: number;
          payment_data?: Json | null;
          payment_method: string;
          payment_provider?: string;
          prebooking_id?: string | null;
          status?: string;
          subscription_id?: string | null;
          transaction_id?: string | null;
          updated_at?: string | null;
          user_id: string;
          verification_signature?: string | null;
          verified_at?: string | null;
        };
        Update: {
          agency_branding_subscription_id?: string | null;
          amount?: number;
          booking_id?: string | null;
          car_partner_subscription_id?: string | null;
          created_at?: string | null;
          currency?: string;
          id?: string;
          ip_address?: string | null;
          loyalty_discount_xof?: number;
          loyalty_points_used?: number;
          payment_data?: Json | null;
          payment_method?: string;
          payment_provider?: string;
          prebooking_id?: string | null;
          status?: string;
          subscription_id?: string | null;
          transaction_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
          verification_signature?: string | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_agency_branding_subscription_id_fkey";
            columns: ["agency_branding_subscription_id"];
            isOneToOne: false;
            referencedRelation: "agency_branding_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_car_partner_subscription_id_fkey";
            columns: ["car_partner_subscription_id"];
            isOneToOne: false;
            referencedRelation: "car_partner_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "active_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      price_alerts: {
        Row: {
          alert_threshold: number | null;
          created_at: string;
          currency: string;
          current_price: number | null;
          departure_date: string | null;
          destination: string;
          id: string;
          is_active: boolean;
          last_checked_at: string | null;
          origin: string | null;
          passengers: number | null;
          return_date: string | null;
          rooms: number | null;
          service_type: string;
          target_price: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          alert_threshold?: number | null;
          created_at?: string;
          currency?: string;
          current_price?: number | null;
          departure_date?: string | null;
          destination: string;
          id?: string;
          is_active?: boolean;
          last_checked_at?: string | null;
          origin?: string | null;
          passengers?: number | null;
          return_date?: string | null;
          rooms?: number | null;
          service_type: string;
          target_price?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          alert_threshold?: number | null;
          created_at?: string;
          currency?: string;
          current_price?: number | null;
          departure_date?: string | null;
          destination?: string;
          id?: string;
          is_active?: boolean;
          last_checked_at?: string | null;
          origin?: string | null;
          passengers?: number | null;
          return_date?: string | null;
          rooms?: number | null;
          service_type?: string;
          target_price?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          member_code: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          member_code?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          member_code?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      promotions: {
        Row: {
          agency_id: string | null;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          discount: number;
          expires_at: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          location: string;
          name: string;
          original_price: number;
          rating: number | null;
          translations: Json;
          updated_at: string | null;
        };
        Insert: {
          agency_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          discount: number;
          expires_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          location: string;
          name: string;
          original_price: number;
          rating?: number | null;
          translations?: Json;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          discount?: number;
          expires_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          location?: string;
          name?: string;
          original_price?: number;
          rating?: number | null;
          translations?: Json;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "promotions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      restaurant_reservations: {
        Row: {
          created_at: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          id: string;
          party_size: number;
          reservation_date: string;
          reservation_time: string;
          restaurant_id: string;
          special_requests: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          id?: string;
          party_size: number;
          reservation_date: string;
          reservation_time: string;
          restaurant_id: string;
          special_requests?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          customer_email?: string;
          customer_name?: string;
          customer_phone?: string;
          id?: string;
          party_size?: number;
          reservation_date?: string;
          reservation_time?: string;
          restaurant_id?: string;
          special_requests?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_reservations_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurants: {
        Row: {
          address: string | null;
          agency_id: string;
          average_ticket_price: number | null;
          created_at: string;
          cuisine_type: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          images: string[] | null;
          is_active: boolean;
          latitude: number | null;
          location: string;
          longitude: number | null;
          maps_url: string | null;
          max_covers_per_slot: number;
          name: string;
          opening_hours: Json;
          phone: string | null;
          price_range: string;
          rating: number;
          slot_interval_minutes: number;
          total_reviews: number;
          translations: Json;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          agency_id: string;
          average_ticket_price?: number | null;
          created_at?: string;
          cuisine_type?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          images?: string[] | null;
          is_active?: boolean;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          maps_url?: string | null;
          max_covers_per_slot?: number;
          name: string;
          opening_hours?: Json;
          phone?: string | null;
          price_range?: string;
          rating?: number;
          slot_interval_minutes?: number;
          total_reviews?: number;
          translations?: Json;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          agency_id?: string;
          average_ticket_price?: number | null;
          created_at?: string;
          cuisine_type?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          images?: string[] | null;
          is_active?: boolean;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          maps_url?: string | null;
          max_covers_per_slot?: number;
          name?: string;
          opening_hours?: Json;
          phone?: string | null;
          price_range?: string;
          rating?: number;
          slot_interval_minutes?: number;
          total_reviews?: number;
          translations?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurants_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          booking_id: string | null;
          comment: string | null;
          created_at: string;
          id: string;
          partner_reply: string | null;
          partner_replied_at: string | null;
          rating: number;
          reviewer_name: string | null;
          service_id: string;
          source: string;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          booking_id?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          partner_reply?: string | null;
          partner_replied_at?: string | null;
          rating: number;
          reviewer_name?: string | null;
          service_id: string;
          source?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          booking_id?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          partner_reply?: string | null;
          partner_replied_at?: string | null;
          rating?: number;
          reviewer_name?: string | null;
          service_id?: string;
          source?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      service_bookings: {
        Row: {
          assigned_staff: string | null;
          booking_date: string;
          created_at: string | null;
          currency: string | null;
          end_time: string | null;
          id: string;
          location: string | null;
          service_id: string;
          special_requests: string | null;
          start_time: string | null;
          status: string | null;
          total_cost: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          assigned_staff?: string | null;
          booking_date: string;
          created_at?: string | null;
          currency?: string | null;
          end_time?: string | null;
          id?: string;
          location?: string | null;
          service_id: string;
          special_requests?: string | null;
          start_time?: string | null;
          status?: string | null;
          total_cost?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          assigned_staff?: string | null;
          booking_date?: string;
          created_at?: string | null;
          currency?: string | null;
          end_time?: string | null;
          id?: string;
          location?: string | null;
          service_id?: string;
          special_requests?: string | null;
          start_time?: string | null;
          status?: string | null;
          total_cost?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "exclusive_services";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          agency_id: string | null;
          amenities: Json | null;
          available: boolean | null;
          available_dates: string[];
          created_at: string;
          currency: string;
          description: string | null;
          destination: string | null;
          featured: boolean | null;
          id: string;
          image_url: string | null;
          images: string[] | null;
          latitude: number | null;
          location: string;
          longitude: number | null;
          maps_url: string | null;
          name: string;
          price_per_unit: number;
          rating: number | null;
          specifications: Json | null;
          total_reviews: number | null;
          translations: Json;
          type: Database["public"]["Enums"]["service_type"];
          updated_at: string;
        };
        Insert: {
          agency_id?: string | null;
          amenities?: Json | null;
          available?: boolean | null;
          available_dates?: string[];
          created_at?: string;
          currency?: string;
          description?: string | null;
          destination?: string | null;
          featured?: boolean | null;
          id?: string;
          image_url?: string | null;
          images?: string[] | null;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          maps_url?: string | null;
          name: string;
          price_per_unit: number;
          rating?: number | null;
          specifications?: Json | null;
          total_reviews?: number | null;
          translations?: Json;
          type: Database["public"]["Enums"]["service_type"];
          updated_at?: string;
        };
        Update: {
          agency_id?: string | null;
          amenities?: Json | null;
          available?: boolean | null;
          available_dates?: string[];
          created_at?: string;
          currency?: string;
          description?: string | null;
          destination?: string | null;
          featured?: boolean | null;
          id?: string;
          image_url?: string | null;
          images?: string[] | null;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          maps_url?: string | null;
          name?: string;
          price_per_unit?: number;
          rating?: number | null;
          specifications?: Json | null;
          total_reviews?: number | null;
          translations?: Json;
          type?: Database["public"]["Enums"]["service_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      site_config: {
        Row: {
          category: string;
          config_key: string;
          config_value: Json;
          created_at: string | null;
          description: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string;
          config_key: string;
          config_value?: Json;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          config_key?: string;
          config_value?: Json;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      stays: {
        Row: {
          agency_id: string | null;
          available: boolean | null;
          available_dates: string[];
          created_at: string;
          currency: string;
          description: string | null;
          duration: string;
          featured: boolean | null;
          highlights: string[] | null;
          id: string;
          image_url: string | null;
          latitude: number | null;
          location: string;
          longitude: number | null;
          maps_url: string | null;
          name: string;
          price_per_unit: number;
          rating: number | null;
          reviews: number | null;
          translations: Json;
          type: string;
          updated_at: string;
        };
        Insert: {
          agency_id?: string | null;
          available?: boolean | null;
          available_dates?: string[];
          created_at?: string;
          currency?: string;
          description?: string | null;
          duration: string;
          featured?: boolean | null;
          highlights?: string[] | null;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          maps_url?: string | null;
          name: string;
          price_per_unit: number;
          rating?: number | null;
          reviews?: number | null;
          translations?: Json;
          type: string;
          updated_at?: string;
        };
        Update: {
          agency_id?: string | null;
          available?: boolean | null;
          available_dates?: string[];
          created_at?: string;
          currency?: string;
          description?: string | null;
          duration?: string;
          featured?: boolean | null;
          highlights?: string[] | null;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          maps_url?: string | null;
          name?: string;
          price_per_unit?: number;
          rating?: number | null;
          reviews?: number | null;
          translations?: Json;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stays_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_plans: {
        Row: {
          assigned_role: string | null;
          assistance_level: string | null;
          billing_cycles: Json | null;
          color: string | null;
          created_at: string | null;
          currency: string | null;
          default_billing_cycle: string | null;
          description: string | null;
          features: Json | null;
          icon: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_public: boolean;
          name: string;
          plan_id: string;
          popular: boolean | null;
          price: string | null;
          price_note: string | null;
          setup_fee: number | null;
          sort_order: number | null;
          subscription_type: string;
          subtitle: string | null;
          translations: Json;
          trial_days: number | null;
          updated_at: string | null;
        };
        Insert: {
          assigned_role?: string | null;
          assistance_level?: string | null;
          billing_cycles?: Json | null;
          color?: string | null;
          created_at?: string | null;
          currency?: string | null;
          default_billing_cycle?: string | null;
          description?: string | null;
          features?: Json | null;
          icon?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_public?: boolean;
          name: string;
          plan_id: string;
          popular?: boolean | null;
          price?: string | null;
          price_note?: string | null;
          setup_fee?: number | null;
          sort_order?: number | null;
          subscription_type?: string;
          subtitle?: string | null;
          translations?: Json;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_role?: string | null;
          assistance_level?: string | null;
          billing_cycles?: Json | null;
          color?: string | null;
          created_at?: string | null;
          currency?: string | null;
          default_billing_cycle?: string | null;
          description?: string | null;
          features?: Json | null;
          icon?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_public?: boolean;
          name?: string;
          plan_id?: string;
          popular?: boolean | null;
          price?: string | null;
          price_note?: string | null;
          setup_fee?: number | null;
          sort_order?: number | null;
          subscription_type?: string;
          subtitle?: string | null;
          translations?: Json;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subscription_pricing: {
        Row: {
          billing_cycle: string;
          created_at: string | null;
          currency: string;
          discount_percentage: number | null;
          id: string;
          is_active: boolean | null;
          plan_id: string;
          price: number;
          setup_fee: number | null;
          trial_days: number | null;
          updated_at: string | null;
        };
        Insert: {
          billing_cycle: string;
          created_at?: string | null;
          currency?: string;
          discount_percentage?: number | null;
          id?: string;
          is_active?: boolean | null;
          plan_id: string;
          price: number;
          setup_fee?: number | null;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Update: {
          billing_cycle?: string;
          created_at?: string | null;
          currency?: string;
          discount_percentage?: number | null;
          id?: string;
          is_active?: boolean | null;
          plan_id?: string;
          price?: number;
          setup_fee?: number | null;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_pricing_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["plan_id"];
          },
        ];
      };
      subscription_requests: {
        Row: {
          company: string | null;
          created_at: string;
          email: string;
          id: string;
          message: string | null;
          name: string;
          notes: string | null;
          phone: string;
          plan_id: string;
          plan_name: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          company?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          message?: string | null;
          name: string;
          notes?: string | null;
          phone: string;
          plan_id: string;
          plan_name: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          company?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string;
          plan_id?: string;
          plan_name?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          is_visible: boolean | null;
          name: string;
          rating: number | null;
          role: string | null;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          is_visible?: boolean | null;
          name: string;
          rating?: number | null;
          role?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          is_visible?: boolean | null;
          name?: string;
          rating?: number | null;
          role?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      travel_policies: {
        Row: {
          company_id: string;
          created_at: string;
          currency: string;
          id: string;
          max_amount: number;
          requires_approval: boolean;
          service_type: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          currency?: string;
          id?: string;
          max_amount: number;
          requires_approval?: boolean;
          service_type: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          max_amount?: number;
          requires_approval?: boolean;
          service_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "travel_policies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          amount_paid: number | null;
          auto_renew: boolean | null;
          billing_cycle: string;
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          currency: string | null;
          end_date: string | null;
          features: Json | null;
          id: string;
          last_payment_date: string | null;
          next_billing_date: string | null;
          next_payment_date: string | null;
          payment_id: string | null;
          payment_method: string | null;
          payment_method_id: string | null;
          payment_provider: string | null;
          plan_id: string;
          plan_name: string;
          price: number;
          renewal_reminder_sent_at: string | null;
          start_date: string;
          status: string;
          subscription_type: string | null;
          transaction_id: string | null;
          trial_days: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount_paid?: number | null;
          auto_renew?: boolean | null;
          billing_cycle: string;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          currency?: string | null;
          end_date?: string | null;
          features?: Json | null;
          id?: string;
          last_payment_date?: string | null;
          next_billing_date?: string | null;
          next_payment_date?: string | null;
          payment_id?: string | null;
          payment_method?: string | null;
          payment_method_id?: string | null;
          payment_provider?: string | null;
          plan_id: string;
          plan_name: string;
          price: number;
          renewal_reminder_sent_at?: string | null;
          start_date?: string;
          status?: string;
          subscription_type?: string | null;
          transaction_id?: string | null;
          trial_days?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount_paid?: number | null;
          auto_renew?: boolean | null;
          billing_cycle?: string;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          currency?: string | null;
          end_date?: string | null;
          features?: Json | null;
          id?: string;
          last_payment_date?: string | null;
          next_billing_date?: string | null;
          next_payment_date?: string | null;
          payment_id?: string | null;
          payment_method?: string | null;
          payment_method_id?: string | null;
          payment_provider?: string | null;
          plan_id?: string;
          plan_name?: string;
          price?: number;
          renewal_reminder_sent_at?: string | null;
          start_date?: string;
          status?: string;
          subscription_type?: string | null;
          transaction_id?: string | null;
          trial_days?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_payment_method_id_fkey";
            columns: ["payment_method_id"];
            isOneToOne: false;
            referencedRelation: "payment_methods";
            referencedColumns: ["id"];
          },
        ];
      };
      value_propositions: {
        Row: {
          color_scheme: string | null;
          created_at: string | null;
          description: string;
          icon_name: string;
          id: string;
          is_visible: boolean | null;
          sort_order: number | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          color_scheme?: string | null;
          created_at?: string | null;
          description: string;
          icon_name: string;
          id?: string;
          is_visible?: boolean | null;
          sort_order?: number | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          color_scheme?: string | null;
          created_at?: string | null;
          description?: string;
          icon_name?: string;
          id?: string;
          is_visible?: boolean | null;
          sort_order?: number | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      vip_event_registrations: {
        Row: {
          event_id: string;
          id: string;
          notes: string | null;
          registration_date: string | null;
          status: string | null;
          user_id: string;
        };
        Insert: {
          event_id: string;
          id?: string;
          notes?: string | null;
          registration_date?: string | null;
          status?: string | null;
          user_id: string;
        };
        Update: {
          event_id?: string;
          id?: string;
          notes?: string | null;
          registration_date?: string | null;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vip_event_registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "vip_events";
            referencedColumns: ["id"];
          },
        ];
      };
      vip_events: {
        Row: {
          created_at: string | null;
          current_participants: number | null;
          date: string;
          description: string | null;
          exclusive: boolean | null;
          id: string;
          image_url: string | null;
          location: string;
          max_participants: number | null;
          requirements: string[] | null;
          title: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_participants?: number | null;
          date: string;
          description?: string | null;
          exclusive?: boolean | null;
          id?: string;
          image_url?: string | null;
          location: string;
          max_participants?: number | null;
          requirements?: string[] | null;
          title: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_participants?: number | null;
          date?: string;
          description?: string | null;
          exclusive?: boolean | null;
          id?: string;
          image_url?: string | null;
          location?: string;
          max_participants?: number | null;
          requirements?: string[] | null;
          title?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      wellness_bookings: {
        Row: {
          booking_date: string;
          booking_time: string;
          created_at: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          id: string;
          party_size: number;
          special_requests: string | null;
          status: string;
          treatment_currency: string | null;
          treatment_name: string;
          treatment_price: number | null;
          updated_at: string;
          user_id: string | null;
          wellness_service_id: string;
        };
        Insert: {
          booking_date: string;
          booking_time: string;
          created_at?: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          id?: string;
          party_size?: number;
          special_requests?: string | null;
          status?: string;
          treatment_currency?: string | null;
          treatment_name: string;
          treatment_price?: number | null;
          updated_at?: string;
          user_id?: string | null;
          wellness_service_id: string;
        };
        Update: {
          booking_date?: string;
          booking_time?: string;
          created_at?: string;
          customer_email?: string;
          customer_name?: string;
          customer_phone?: string;
          id?: string;
          party_size?: number;
          special_requests?: string | null;
          status?: string;
          treatment_currency?: string | null;
          treatment_name?: string;
          treatment_price?: number | null;
          updated_at?: string;
          user_id?: string | null;
          wellness_service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wellness_bookings_wellness_service_id_fkey";
            columns: ["wellness_service_id"];
            isOneToOne: false;
            referencedRelation: "wellness_services";
            referencedColumns: ["id"];
          },
        ];
      };
      wellness_services: {
        Row: {
          address: string | null;
          agency_id: string;
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          images: string[];
          is_active: boolean;
          latitude: number | null;
          location: string;
          longitude: number | null;
          maps_url: string | null;
          max_capacity_per_slot: number;
          name: string;
          opening_hours: Json;
          phone: string | null;
          rating: number;
          slot_interval_minutes: number;
          total_reviews: number;
          translations: Json;
          treatments: Json;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          address?: string | null;
          agency_id: string;
          category: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          images?: string[];
          is_active?: boolean;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          maps_url?: string | null;
          max_capacity_per_slot?: number;
          name: string;
          opening_hours?: Json;
          phone?: string | null;
          rating?: number;
          slot_interval_minutes?: number;
          total_reviews?: number;
          translations?: Json;
          treatments?: Json;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          address?: string | null;
          agency_id?: string;
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          images?: string[];
          is_active?: boolean;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          maps_url?: string | null;
          max_capacity_per_slot?: number;
          name?: string;
          opening_hours?: Json;
          phone?: string | null;
          rating?: number;
          slot_interval_minutes?: number;
          total_reviews?: number;
          translations?: Json;
          treatments?: Json;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wellness_services_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      active_subscriptions: {
        Row: {
          assigned_role: string | null;
          assistance_level: string | null;
          billing_cycle: string | null;
          created_at: string | null;
          email: string | null;
          end_date: string | null;
          features: Json | null;
          id: string | null;
          payment_id: string | null;
          payment_provider: string | null;
          plan_current_price: string | null;
          plan_display_name: string | null;
          plan_id: string | null;
          plan_name: string | null;
          price: number | null;
          raw_user_meta_data: Json | null;
          start_date: string | null;
          status: string | null;
          subscription_type: string | null;
          trial_days: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_hotel_onsite_commissions: {
        Args: { p_period: string };
        Returns: {
          agency_id: string;
          agency_name: string;
          bookings: Json;
          commission_amount: number;
          invoice_due_at: string;
          invoice_id: string;
          invoice_status: string;
          invoiced_amount: number;
          stays_amount: number;
          stays_count: number;
        }[];
      };
      admin_issue_hotel_onsite_invoice: {
        Args: { p_agency_id: string; p_period: string };
        Returns: string;
      };
      admin_mark_booking_balance_paid: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      admin_set_hotel_onsite_invoice_status: {
        Args: { p_invoice_id: string; p_status: string };
        Returns: undefined;
      };
      agency_commission_rate_history: {
        Args: never;
        Returns: {
          effective_from: string;
          platform_rate: number;
        }[];
      };
      agency_customers: {
        Args: never;
        Returns: {
          customer_email: string | null;
          customer_name: string;
          customer_phone: string | null;
          first_order_at: string;
          last_order_at: string;
          next_service_date: string | null;
          orders_count: number;
        }[];
      };
      agency_feature_enabled: {
        Args: { _agency_id: string; _feature: string };
        Returns: boolean;
      };
      agency_finance_summary: {
        Args: { p_from?: string | null; p_to?: string | null };
        Returns: Json;
      };
      agency_finance_transactions: {
        Args: { p_from?: string | null; p_to?: string | null };
        Returns: {
          collection: string;
          commission_amount: number;
          commission_rate: number;
          gross_amount: number;
          label: string;
          net_amount: number;
          paid_at: string | null;
          payout_due_at: string | null;
          payout_reference: string | null;
          payout_status: string | null;
          rate_effective_from: string | null;
          reference: string;
          source_type: string;
          status: string;
          transaction_date: string;
          transaction_id: string;
        }[];
      };
      agency_hotel_bookings: {
        Args: never;
        Returns: {
          booking_id: string;
          cancellation: Json;
          check_in: string;
          check_out: string;
          created_at: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          guests: number;
          hotel_name: string;
          no_show: boolean;
          notes: string;
          pay_at_property: boolean;
          payment_status: string;
          rooms: Json;
          status: string;
          total_price: number;
        }[];
      };
      agency_mark_hotel_no_show: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      agency_module_in_scope: {
        Args: { _agency_id: string; _module: string };
        Returns: boolean;
      };
      agency_orders: {
        Args: never;
        Returns: {
          amount: number | null;
          bucket: string;
          created_at: string;
          customer_email: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          module: string;
          notes: string | null;
          order_id: string;
          order_kind: string;
          quantity: number | null;
          service_date: string | null;
          service_time: string | null;
          status: string;
          title: string;
        }[];
      };
      agency_platform_rate_at: {
        Args: { _agency_id: string; _at: string };
        Returns: number;
      };
      agency_portal_context: {
        Args: { p_module?: string | null };
        Returns: Json;
      };
      agency_reply_review: {
        Args: { p_reply: string; p_review_id: string };
        Returns: undefined;
      };
      agency_reviews: {
        Args: never;
        Returns: {
          comment: string | null;
          created_at: string;
          partner_replied_at: string | null;
          partner_reply: string | null;
          rating: number;
          review_id: string;
          reviewer_name: string;
          service_name: string;
          status: string;
        }[];
      };
      agency_service_type_allowed: {
        Args: { _agency_id: string; _type: string };
        Returns: boolean;
      };
      calculate_next_billing_date: {
        Args: { billing_cycle: string; p_current_date: string };
        Returns: string;
      };
      car_plan_payments_enabled: { Args: never; Returns: boolean };
      claim_agency_payout: {
        Args: { p_commission_id: string };
        Returns: boolean;
      };
      clean_expired_destinations_cache: { Args: never; Returns: undefined };
      create_billing_period: {
        Args: { p_start_date?: string; p_user_subscription_id: string };
        Returns: string;
      };
      create_company: {
        Args: {
          p_billing_email?: string;
          p_billing_phone?: string;
          p_description?: string;
          p_name: string;
        };
        Returns: {
          id: string;
          invite_code: string;
          name: string;
        }[];
      };
      create_partner_hotel_booking: {
        Args: {
          p_check_in: string;
          p_check_out: string;
          p_customer_email: string;
          p_customer_name: string;
          p_customer_phone: string;
          p_guests: number;
          p_items: Json;
          p_notes: string;
          p_service_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      expire_agency_branding_subscriptions: { Args: never; Returns: undefined };
      expire_old_prebookings: { Args: never; Returns: undefined };
      expire_user_subscriptions: { Args: never; Returns: undefined };
      get_default_pricing: {
        Args: { p_billing_cycle: string; p_plan_id: string };
        Returns: {
          currency: string;
          discount_percentage: number;
          price: number;
          setup_fee: number;
          trial_days: number;
        }[];
      };
      get_restaurant_slot_covers: {
        Args: { p_date: string; p_restaurant_id: string };
        Returns: {
          covers_booked: number;
          reservation_time: string;
        }[];
      };
      get_wellness_slot_bookings: {
        Args: { p_date: string; p_wellness_service_id: string };
        Returns: {
          booking_time: string;
          spots_booked: number;
        }[];
      };
      current_partner_agency_id: {
        Args: never;
        Returns: string;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      hotel_onsite_billable_bookings: {
        Args: { p_period: string };
        Returns: {
          agency_id: string;
          booking_id: string;
          check_in: string;
          check_out: string;
          customer_name: string;
          hotel_name: string;
          total_price: number;
        }[];
      };
      hotel_room_availability: {
        Args: { p_check_in: string; p_check_out: string; p_service_id: string };
        Returns: {
          available_units: number;
          room_type_id: string;
        }[];
      };
      is_agency_owner: {
        Args: { _agency_id: string; _user_id: string };
        Returns: boolean;
      };
      is_company_admin: {
        Args: { _company_id: string; _user_id: string };
        Returns: boolean;
      };
      is_company_approver: {
        Args: { _company_id: string; _user_id: string };
        Returns: boolean;
      };
      is_company_member: {
        Args: { _company_id: string; _user_id: string };
        Returns: boolean;
      };
      join_company: {
        Args: { p_invite_code: string };
        Returns: {
          company_id: string;
          company_name: string;
        }[];
      };
      loyalty_admin_adjust: {
        Args: { p_points: number; p_reason: string; p_user: string };
        Returns: Json;
      };
      loyalty_admin_members: {
        Args: { p_limit?: number; p_search?: string };
        Returns: {
          balance: number;
          email: string;
          full_name: string;
          last_activity: string;
          lifetime: number;
          referral_code: string;
          user_id: string;
        }[];
      };
      loyalty_admin_stats: { Args: never; Returns: Json };
      loyalty_apply_referral: { Args: { p_code: string }; Returns: Json };
      loyalty_award_purchase: {
        Args: {
          p_amount_xof: number;
          p_label: string;
          p_reference: string;
          p_user: string;
        };
        Returns: number;
      };
      loyalty_balance: { Args: { p_user: string }; Returns: number };
      loyalty_confirm_redemption: {
        Args: { p_points: number; p_reference: string; p_user: string };
        Returns: undefined;
      };
      loyalty_daily_checkin: { Args: never; Returns: Json };
      loyalty_ensure_account: {
        Args: { p_user: string };
        Returns: {
          checkin_streak: number;
          created_at: string;
          last_checkin_date: string | null;
          referral_code: string;
          referral_rewarded: boolean;
          referred_by: string | null;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "loyalty_accounts";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      loyalty_expirable: {
        Args: { p_cutoff: string; p_user: string };
        Returns: number;
      };
      loyalty_expire_points: { Args: never; Returns: number };
      loyalty_get_summary: { Args: never; Returns: Json };
      loyalty_lifetime: { Args: { p_user: string }; Returns: number };
      loyalty_release_redemption: {
        Args: { p_reference: string; p_user: string };
        Returns: undefined;
      };
      loyalty_release_stale_redemptions: { Args: never; Returns: undefined };
      loyalty_require_admin: { Args: never; Returns: undefined };
      loyalty_reserve_redemption: {
        Args: { p_points: number; p_reference: string; p_user: string };
        Returns: boolean;
      };
      owns_hotel_service: {
        Args: { _require_enabled: boolean; _service_id: string };
        Returns: boolean;
      };
      partner_contact_always_visible: {
        Args: never;
        Returns: boolean;
      };
      refresh_hotel_starting_price: {
        Args: { _service_id: string };
        Returns: undefined;
      };
      renew_subscription: {
        Args: { p_user_subscription_id: string };
        Returns: boolean;
      };
      verify_member_card: {
        Args: { p_code: string };
        Returns: {
          holder_name: string;
          is_valid: boolean;
          plan_id: string;
          plan_name: string;
          valid_until: string;
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "user" | "sub_agency";
      booking_status: "pending" | "confirmed" | "cancelled" | "completed";
      flight_booking_status:
        | "SEARCHED"
        | "PREBOOKED"
        | "PENDING_PAYMENT"
        | "PAYMENT_CONFIRMED"
        | "TICKET_ISSUED"
        | "FAILED"
        | "REFUNDED"
        | "EXPIRED";
      payment_status: "pending" | "paid" | "refunded" | "failed" | "processing" | "partially_paid";
      service_type: "hotel" | "flight" | "car" | "tour" | "event" | "flight_hotel" | "stay" | "activity" | "train";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "user", "sub_agency"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      flight_booking_status: [
        "SEARCHED",
        "PREBOOKED",
        "PENDING_PAYMENT",
        "PAYMENT_CONFIRMED",
        "TICKET_ISSUED",
        "FAILED",
        "REFUNDED",
        "EXPIRED",
      ],
      payment_status: ["pending", "paid", "refunded", "failed", "processing", "partially_paid"],
      service_type: ["hotel", "flight", "car", "tour", "event", "flight_hotel", "stay", "activity", "train"],
    },
  },
} as const;
