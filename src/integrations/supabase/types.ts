export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          agency_id: string | null
          available: boolean | null
          category: string
          created_at: string
          currency: string
          description: string | null
          duration: string
          featured: boolean | null
          highlights: string[] | null
          id: string
          image_url: string | null
          included: string[] | null
          location: string
          name: string
          price_per_unit: number
          rating: number | null
          reviews: number | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          available?: boolean | null
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          duration: string
          featured?: boolean | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          included?: string[] | null
          location: string
          name: string
          price_per_unit: number
          rating?: number | null
          reviews?: number | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          available?: boolean | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration?: string
          featured?: boolean | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          included?: string[] | null
          location?: string
          name?: string
          price_per_unit?: number
          rating?: number | null
          reviews?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisements: {
        Row: {
          background_color: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          position: string | null
          sort_order: number | null
          starts_at: string | null
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          position?: string | null
          sort_order?: number | null
          starts_at?: string | null
          text_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          position?: string | null
          sort_order?: number | null
          starts_at?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      agencies: {
        Row: {
          commission_rate: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_visible: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      assistance_logs: {
        Row: {
          assistance_type: string
          created_at: string | null
          follow_up_required: boolean | null
          id: string
          issue_description: string | null
          request_time: string | null
          resolution: string | null
          resolution_time: string | null
          response_time: string | null
          satisfaction_rating: number | null
          staff_id: string | null
          user_id: string
        }
        Insert: {
          assistance_type: string
          created_at?: string | null
          follow_up_required?: boolean | null
          id?: string
          issue_description?: string | null
          request_time?: string | null
          resolution?: string | null
          resolution_time?: string | null
          response_time?: string | null
          satisfaction_rating?: number | null
          staff_id?: string | null
          user_id: string
        }
        Update: {
          assistance_type?: string
          created_at?: string | null
          follow_up_required?: boolean | null
          id?: string
          issue_description?: string | null
          request_time?: string | null
          resolution?: string | null
          resolution_time?: string | null
          response_time?: string | null
          satisfaction_rating?: number | null
          staff_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistance_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "concierge_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_periods: {
        Row: {
          amount: number
          billing_cycle: string
          created_at: string | null
          currency: string
          due_date: string
          end_date: string
          id: string
          invoice_id: string | null
          paid_date: string | null
          payment_intent_id: string | null
          payment_method_id: string | null
          retry_count: number | null
          start_date: string
          status: string
          updated_at: string | null
          user_subscription_id: string
        }
        Insert: {
          amount: number
          billing_cycle: string
          created_at?: string | null
          currency?: string
          due_date: string
          end_date: string
          id?: string
          invoice_id?: string | null
          paid_date?: string | null
          payment_intent_id?: string | null
          payment_method_id?: string | null
          retry_count?: number | null
          start_date: string
          status?: string
          updated_at?: string | null
          user_subscription_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          created_at?: string | null
          currency?: string
          due_date?: string
          end_date?: string
          id?: string
          invoice_id?: string | null
          paid_date?: string | null
          payment_intent_id?: string | null
          payment_method_id?: string | null
          retry_count?: number | null
          start_date?: string
          status?: string
          updated_at?: string | null
          user_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_periods_user_subscription_id_fkey"
            columns: ["user_subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_periods_user_subscription_id_fkey"
            columns: ["user_subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_details: Json | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string
          end_date: string | null
          external_ref: string | null
          flight_status: string | null
          guests: number
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pnr: string | null
          prebooking_id: string | null
          service_id: string
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          supplier_cost: number | null
          supplier_cost_currency: string | null
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_details?: Json | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          end_date?: string | null
          external_ref?: string | null
          flight_status?: string | null
          guests?: number
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pnr?: string | null
          prebooking_id?: string | null
          service_id: string
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          supplier_cost?: number | null
          supplier_cost_currency?: string | null
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_details?: Json | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          end_date?: string | null
          external_ref?: string | null
          flight_status?: string | null
          guests?: number
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pnr?: string | null
          prebooking_id?: string | null
          service_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          supplier_cost?: number | null
          supplier_cost_currency?: string | null
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bossiz_global_config: {
        Row: {
          config: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      bossiz_sites_config: {
        Row: {
          bg_color: string
          border_color: string
          color: string
          contact: Json
          created_at: string
          description: string
          features: string[] | null
          highlights: string[] | null
          id: string
          image: string
          location: string
          route: string
          stats: Json
          subtitle: string
          tagline: string
          title: string
          updated_at: string
        }
        Insert: {
          bg_color: string
          border_color: string
          color: string
          contact?: Json
          created_at?: string
          description: string
          features?: string[] | null
          highlights?: string[] | null
          id: string
          image: string
          location: string
          route: string
          stats?: Json
          subtitle: string
          tagline: string
          title: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          border_color?: string
          color?: string
          contact?: Json
          created_at?: string
          description?: string
          features?: string[] | null
          highlights?: string[] | null
          id?: string
          image?: string
          location?: string
          route?: string
          stats?: Json
          subtitle?: string
          tagline?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          agency_id: string
          booking_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          booking_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          booking_amount?: number
          booking_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_requests: {
        Row: {
          assigned_concierge: string | null
          completion_time: string | null
          created_at: string | null
          description: string
          id: string
          notes: string | null
          priority: string
          request_type: string
          response_time: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_concierge?: string | null
          completion_time?: string | null
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          priority?: string
          request_type: string
          response_time?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_concierge?: string | null
          completion_time?: string | null
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          priority?: string
          request_type?: string
          response_time?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      concierge_services: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_available: boolean | null
          name: string
          price_range: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          price_range?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          price_range?: string | null
        }
        Relationships: []
      }
      concierge_staff: {
        Row: {
          created_at: string | null
          current_requests: number | null
          email: string
          id: string
          is_available: boolean | null
          languages: string[] | null
          max_requests: number | null
          name: string
          phone: string | null
          rating: number | null
          specialization: string[] | null
          timezone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_requests?: number | null
          email: string
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          max_requests?: number | null
          name: string
          phone?: string | null
          rating?: number | null
          specialization?: string[] | null
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_requests?: number | null
          email?: string
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          max_requests?: number | null
          name?: string
          phone?: string | null
          rating?: number | null
          specialization?: string[] | null
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customizable_plans: {
        Row: {
          color_scheme: string | null
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string
          is_popular: boolean | null
          is_visible: boolean | null
          name: string
          plan_id: string
          price: string
          price_note: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color_scheme?: string | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_popular?: boolean | null
          is_visible?: boolean | null
          name: string
          plan_id: string
          price: string
          price_note?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color_scheme?: string | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_popular?: boolean | null
          is_visible?: boolean | null
          name?: string
          plan_id?: string
          price?: string
          price_note?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          layout_name: string
          updated_at: string | null
          user_id: string
          widgets_config: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          layout_name?: string
          updated_at?: string | null
          user_id: string
          widgets_config?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          layout_name?: string
          updated_at?: string | null
          user_id?: string
          widgets_config?: Json
        }
        Relationships: []
      }
      destinations_cache: {
        Row: {
          cache_key: string
          created_at: string
          destinations: Json
          expires_at: string
          id: string
          source: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          destinations: Json
          expires_at: string
          id?: string
          source?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          destinations?: Json
          expires_at?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      exclusive_services: {
        Row: {
          availability: boolean | null
          booking_lead_time: number | null
          booking_required: boolean | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          pricing_model: string | null
          requirements: string[] | null
          service_type: string
          updated_at: string | null
        }
        Insert: {
          availability?: boolean | null
          booking_lead_time?: number | null
          booking_required?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          pricing_model?: string | null
          requirements?: string[] | null
          service_type: string
          updated_at?: string | null
        }
        Update: {
          availability?: boolean | null
          booking_lead_time?: number | null
          booking_required?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          pricing_model?: string | null
          requirements?: string[] | null
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      flight_prebookings: {
        Row: {
          adults_count: number
          base_fare: number
          booking_id: string | null
          booking_reference: string
          children_count: number
          created_at: string
          currency: string
          expires_at: string
          flight_data: Json
          id: string
          passengers: Json
          price_signature: string | null
          provider: string
          service_fee: number
          status: string
          taxes: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          adults_count?: number
          base_fare: number
          booking_id?: string | null
          booking_reference: string
          children_count?: number
          created_at?: string
          currency?: string
          expires_at: string
          flight_data: Json
          id?: string
          passengers?: Json
          price_signature?: string | null
          provider?: string
          service_fee?: number
          status?: string
          taxes?: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          adults_count?: number
          base_fare?: number
          booking_id?: string | null
          booking_reference?: string
          children_count?: number
          created_at?: string
          currency?: string
          expires_at?: string
          flight_data?: Json
          id?: string
          passengers?: Json
          price_signature?: string | null
          provider?: string
          service_fee?: number
          status?: string
          taxes?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_type: string | null
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      homepage_features: {
        Row: {
          color: string | null
          created_at: string
          description: string
          feature_id: string
          icon: string
          id: string
          order_num: number | null
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description: string
          feature_id: string
          icon: string
          id?: string
          order_num?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string
          feature_id?: string
          icon?: string
          id?: string
          order_num?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          created_at: string
          id: string
          order_num: number | null
          subtitle: string | null
          title: string
          updated_at: string
          visible: boolean | null
        }
        Insert: {
          created_at?: string
          id: string
          order_num?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string
          visible?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          order_num?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          billing_period_id: string | null
          created_at: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          items: Json | null
          metadata: Json | null
          paid_date: string | null
          status: string
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          billing_period_id?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          items?: Json | null
          metadata?: Json | null
          paid_date?: string | null
          status?: string
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          billing_period_id?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          items?: Json | null
          metadata?: Json | null
          paid_date?: string | null
          status?: string
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_billing_period_id_fkey"
            columns: ["billing_period_id"]
            isOneToOne: false
            referencedRelation: "billing_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      luxe_properties: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          location: string
          name: string
          price_info: string | null
          specifications: Json | null
          updated_at: string | null
          virtual_tour_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location: string
          name: string
          price_info?: string | null
          specifications?: Json | null
          updated_at?: string | null
          virtual_tour_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location?: string
          name?: string
          price_info?: string | null
          specifications?: Json | null
          updated_at?: string | null
          virtual_tour_url?: string | null
        }
        Relationships: []
      }
      luxe_stay_details: {
        Row: {
          booking_id: string
          created_at: string | null
          documents: Json | null
          id: string
          smart_lock_code: string | null
          timeline: Json | null
          updated_at: string | null
          welcome_guide_url: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          documents?: Json | null
          id?: string
          smart_lock_code?: string | null
          timeline?: Json | null
          updated_at?: string | null
          welcome_guide_url?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          documents?: Json | null
          id?: string
          smart_lock_code?: string | null
          timeline?: Json | null
          updated_at?: string | null
          welcome_guide_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "luxe_stay_details_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      majestic_bookings: {
        Row: {
          booking_type: string
          created_at: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          metadata: Json | null
          start_date: string
          status: string
          title: string
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_type: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          start_date: string
          status?: string
          title: string
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_type?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          start_date?: string
          status?: string
          title?: string
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      majestic_documents: {
        Row: {
          access_code: string | null
          booking_id: string | null
          created_at: string | null
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          is_encrypted: boolean | null
          metadata: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_code?: string | null
          booking_id?: string | null
          created_at?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          is_encrypted?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_code?: string | null
          booking_id?: string | null
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_encrypted?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "majestic_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "majestic_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      majestic_itineraries: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          end_date: string
          id: string
          metadata: Json | null
          start_date: string
          status: string | null
          title: string
          total_cost: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date: string
          id?: string
          metadata?: Json | null
          start_date: string
          status?: string | null
          title: string
          total_cost?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string
          id?: string
          metadata?: Json | null
          start_date?: string
          status?: string | null
          title?: string
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      majestic_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_from_user: boolean | null
          is_read: boolean | null
          message_type: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_from_user?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_from_user?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      majestic_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      majestic_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          payment_type: string
          reference_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_type: string
          reference_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_type?: string
          reference_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      majestic_properties: {
        Row: {
          access_level: string | null
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          images: string[] | null
          is_available: boolean | null
          is_featured: boolean | null
          location: string
          metadata: Json | null
          price: number | null
          property_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_available?: boolean | null
          is_featured?: boolean | null
          location: string
          metadata?: Json | null
          price?: number | null
          property_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_available?: boolean | null
          is_featured?: boolean | null
          location?: string
          metadata?: Json | null
          price?: number | null
          property_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      majestic_service_requests: {
        Row: {
          completed_date: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          notes: string | null
          priority: string | null
          requested_date: string
          service_id: string | null
          status: string
          title: string
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          priority?: string | null
          requested_date: string
          service_id?: string | null
          status?: string
          title: string
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          priority?: string | null
          requested_date?: string
          service_id?: string | null
          status?: string
          title?: string
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "majestic_service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "majestic_services"
            referencedColumns: ["id"]
          },
        ]
      }
      majestic_services: {
        Row: {
          base_price: number | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      majestic_subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          plan: string
          start_date: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          plan: string
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          plan?: string
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      majestic_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "majestic_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "majestic_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          subscribed_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          subscribed_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          background_color: string | null
          button_color: string | null
          button_hover_color: string | null
          button_text: string | null
          created_at: string | null
          description: string | null
          id: string
          is_visible: boolean | null
          page_key: string
          section_key: string
          sort_order: number | null
          subtitle: string | null
          text_color: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          button_color?: string | null
          button_hover_color?: string | null
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_visible?: boolean | null
          page_key: string
          section_key: string
          sort_order?: number | null
          subtitle?: string | null
          text_color?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          button_color?: string | null
          button_hover_color?: string | null
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_visible?: boolean | null
          page_key?: string
          section_key?: string
          sort_order?: number | null
          subtitle?: string | null
          text_color?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      passengers: {
        Row: {
          booking_id: string
          created_at: string | null
          date_of_birth: string | null
          document_number: string | null
          document_type: string | null
          first_name: string
          id: string
          last_name: string
          nationality: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          date_of_birth?: string | null
          document_number?: string | null
          document_type?: string | null
          first_name: string
          id?: string
          last_name: string
          nationality?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          date_of_birth?: string | null
          document_number?: string | null
          document_type?: string | null
          first_name?: string
          id?: string
          last_name?: string
          nationality?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          metadata: Json | null
          method_identifier: string
          provider: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          method_identifier: string
          provider: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          method_identifier?: string
          provider?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          payment_method: string | null
          payment_provider: string | null
          status: string
          subscription_id: string | null
          transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_provider?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_provider?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          currency: string
          id: string
          ip_address: string | null
          payment_data: Json | null
          payment_method: string
          payment_provider: string
          prebooking_id: string | null
          status: string
          subscription_id: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string
          verification_signature: string | null
          verified_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          ip_address?: string | null
          payment_data?: Json | null
          payment_method: string
          payment_provider?: string
          prebooking_id?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
          verification_signature?: string | null
          verified_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          ip_address?: string | null
          payment_data?: Json | null
          payment_method?: string
          payment_provider?: string
          prebooking_id?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
          verification_signature?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          alert_threshold: number | null
          created_at: string
          currency: string
          current_price: number | null
          departure_date: string | null
          destination: string
          id: string
          is_active: boolean
          last_checked_at: string | null
          origin: string | null
          passengers: number | null
          return_date: string | null
          rooms: number | null
          service_type: string
          target_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_threshold?: number | null
          created_at?: string
          currency?: string
          current_price?: number | null
          departure_date?: string | null
          destination: string
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          origin?: string | null
          passengers?: number | null
          return_date?: string | null
          rooms?: number | null
          service_type: string
          target_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_threshold?: number | null
          created_at?: string
          currency?: string
          current_price?: number | null
          departure_date?: string | null
          destination?: string
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          origin?: string | null
          passengers?: number | null
          return_date?: string | null
          rooms?: number | null
          service_type?: string
          target_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          agency_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          discount: number
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string
          name: string
          original_price: number
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount: number
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location: string
          name: string
          original_price: number
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount?: number
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string
          name?: string
          original_price?: number
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          service_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          service_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          service_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          assigned_staff: string | null
          booking_date: string
          created_at: string | null
          currency: string | null
          end_time: string | null
          id: string
          location: string | null
          service_id: string
          special_requests: string | null
          start_time: string | null
          status: string | null
          total_cost: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_staff?: string | null
          booking_date: string
          created_at?: string | null
          currency?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          service_id: string
          special_requests?: string | null
          start_time?: string | null
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_staff?: string | null
          booking_date?: string
          created_at?: string | null
          currency?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          service_id?: string
          special_requests?: string | null
          start_time?: string | null
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "exclusive_services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          agency_id: string | null
          amenities: Json | null
          available: boolean | null
          created_at: string
          currency: string
          description: string | null
          destination: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          images: string[] | null
          location: string
          name: string
          price_per_unit: number
          rating: number | null
          specifications: Json | null
          total_reviews: number | null
          type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          amenities?: Json | null
          available?: boolean | null
          created_at?: string
          currency?: string
          description?: string | null
          destination?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          location: string
          name: string
          price_per_unit: number
          rating?: number | null
          specifications?: Json | null
          total_reviews?: number | null
          type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          amenities?: Json | null
          available?: boolean | null
          created_at?: string
          currency?: string
          description?: string | null
          destination?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          location?: string
          name?: string
          price_per_unit?: number
          rating?: number | null
          specifications?: Json | null
          total_reviews?: number | null
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      site_config: {
        Row: {
          category: string
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          config_key: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stays: {
        Row: {
          agency_id: string | null
          available: boolean | null
          created_at: string
          currency: string
          description: string | null
          duration: string
          featured: boolean | null
          highlights: string[] | null
          id: string
          image_url: string | null
          location: string
          name: string
          price_per_unit: number
          rating: number | null
          reviews: number | null
          type: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          available?: boolean | null
          created_at?: string
          currency?: string
          description?: string | null
          duration: string
          featured?: boolean | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          location: string
          name: string
          price_per_unit: number
          rating?: number | null
          reviews?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          available?: boolean | null
          created_at?: string
          currency?: string
          description?: string | null
          duration?: string
          featured?: boolean | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          location?: string
          name?: string
          price_per_unit?: number
          rating?: number | null
          reviews?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stays_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          assigned_role: string | null
          assistance_level: string | null
          billing_cycles: Json | null
          color: string | null
          created_at: string | null
          currency: string | null
          default_billing_cycle: string | null
          description: string | null
          features: Json | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          plan_id: string
          popular: boolean | null
          price: string | null
          price_note: string | null
          setup_fee: number | null
          sort_order: number | null
          subscription_type: string
          subtitle: string | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_role?: string | null
          assistance_level?: string | null
          billing_cycles?: Json | null
          color?: string | null
          created_at?: string | null
          currency?: string | null
          default_billing_cycle?: string | null
          description?: string | null
          features?: Json | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          plan_id: string
          popular?: boolean | null
          price?: string | null
          price_note?: string | null
          setup_fee?: number | null
          sort_order?: number | null
          subscription_type?: string
          subtitle?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_role?: string | null
          assistance_level?: string | null
          billing_cycles?: Json | null
          color?: string | null
          created_at?: string | null
          currency?: string | null
          default_billing_cycle?: string | null
          description?: string | null
          features?: Json | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          plan_id?: string
          popular?: boolean | null
          price?: string | null
          price_note?: string | null
          setup_fee?: number | null
          sort_order?: number | null
          subscription_type?: string
          subtitle?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_pricing: {
        Row: {
          billing_cycle: string
          created_at: string | null
          currency: string
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          plan_id: string
          price: number
          setup_fee: number | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle: string
          created_at?: string | null
          currency?: string
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          plan_id: string
          price: number
          setup_fee?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          currency?: string
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          plan_id?: string
          price?: number
          setup_fee?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_pricing_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string
          plan_id: string
          plan_name: string
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone: string
          plan_id: string
          plan_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string
          plan_id?: string
          plan_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_visible: boolean | null
          name: string
          rating: number | null
          role: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          name: string
          rating?: number | null
          role?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          name?: string
          rating?: number | null
          role?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount_paid: number | null
          auto_renew: boolean | null
          billing_cycle: string
          cancel_at_period_end: boolean | null
          created_at: string | null
          currency: string | null
          end_date: string | null
          features: Json | null
          id: string
          last_payment_date: string | null
          next_billing_date: string | null
          next_payment_date: string | null
          payment_id: string | null
          payment_method: string | null
          payment_method_id: string | null
          payment_provider: string | null
          plan_id: string
          plan_name: string
          price: number
          start_date: string
          status: string
          subscription_type: string | null
          transaction_id: string | null
          trial_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          auto_renew?: boolean | null
          billing_cycle: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          features?: Json | null
          id?: string
          last_payment_date?: string | null
          next_billing_date?: string | null
          next_payment_date?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_provider?: string | null
          plan_id: string
          plan_name: string
          price: number
          start_date?: string
          status?: string
          subscription_type?: string | null
          transaction_id?: string | null
          trial_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          auto_renew?: boolean | null
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          features?: Json | null
          id?: string
          last_payment_date?: string | null
          next_billing_date?: string | null
          next_payment_date?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_provider?: string | null
          plan_id?: string
          plan_name?: string
          price?: number
          start_date?: string
          status?: string
          subscription_type?: string | null
          transaction_id?: string | null
          trial_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      value_propositions: {
        Row: {
          color_scheme: string | null
          created_at: string | null
          description: string
          icon_name: string
          id: string
          is_visible: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color_scheme?: string | null
          created_at?: string | null
          description: string
          icon_name: string
          id?: string
          is_visible?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color_scheme?: string | null
          created_at?: string | null
          description?: string
          icon_name?: string
          id?: string
          is_visible?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vip_event_registrations: {
        Row: {
          event_id: string
          id: string
          notes: string | null
          registration_date: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          notes?: string | null
          registration_date?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          notes?: string | null
          registration_date?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vip_events"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_events: {
        Row: {
          created_at: string | null
          current_participants: number | null
          date: string
          description: string | null
          exclusive: boolean | null
          id: string
          image_url: string | null
          location: string
          max_participants: number | null
          requirements: string[] | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_participants?: number | null
          date: string
          description?: string | null
          exclusive?: boolean | null
          id?: string
          image_url?: string | null
          location: string
          max_participants?: number | null
          requirements?: string[] | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_participants?: number | null
          date?: string
          description?: string | null
          exclusive?: boolean | null
          id?: string
          image_url?: string | null
          location?: string
          max_participants?: number | null
          requirements?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_subscriptions: {
        Row: {
          assigned_role: string | null
          assistance_level: string | null
          billing_cycle: string | null
          created_at: string | null
          email: string | null
          end_date: string | null
          features: Json | null
          id: string | null
          payment_id: string | null
          payment_provider: string | null
          plan_current_price: string | null
          plan_display_name: string | null
          plan_id: string | null
          plan_name: string | null
          price: number | null
          raw_user_meta_data: Json | null
          start_date: string | null
          status: string | null
          subscription_type: string | null
          trial_days: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_next_billing_date: {
        Args: { billing_cycle: string; p_current_date: string }
        Returns: string
      }
      clean_expired_destinations_cache: { Args: never; Returns: undefined }
      create_billing_period: {
        Args: { p_start_date?: string; p_user_subscription_id: string }
        Returns: string
      }
      expire_old_prebookings: { Args: never; Returns: undefined }
      get_default_pricing: {
        Args: { p_billing_cycle: string; p_plan_id: string }
        Returns: {
          currency: string
          discount_percentage: number
          price: number
          setup_fee: number
          trial_days: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agency_owner: {
        Args: { _agency_id: string; _user_id: string }
        Returns: boolean
      }
      renew_subscription: {
        Args: { p_user_subscription_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "sub_agency"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      flight_booking_status:
        | "SEARCHED"
        | "PREBOOKED"
        | "PENDING_PAYMENT"
        | "PAYMENT_CONFIRMED"
        | "TICKET_ISSUED"
        | "FAILED"
        | "REFUNDED"
        | "EXPIRED"
      payment_status: "pending" | "paid" | "refunded" | "failed" | "processing"
      service_type:
        | "hotel"
        | "flight"
        | "car"
        | "tour"
        | "event"
        | "flight_hotel"
        | "stay"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

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
      payment_status: ["pending", "paid", "refunded", "failed", "processing"],
      service_type: [
        "hotel",
        "flight",
        "car",
        "tour",
        "event",
        "flight_hotel",
        "stay",
      ],
    },
  },
} as const
