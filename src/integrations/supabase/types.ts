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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bot_states: {
        Row: {
          bot_role: Database["public"]["Enums"]["bot_role"]
          context: Json
          id: string
          state: string
          telegram_id: number
          updated_at: string
        }
        Insert: {
          bot_role: Database["public"]["Enums"]["bot_role"]
          context?: Json
          id?: string
          state?: string
          telegram_id: number
          updated_at?: string
        }
        Update: {
          bot_role?: Database["public"]["Enums"]["bot_role"]
          context?: Json
          id?: string
          state?: string
          telegram_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          audience: string
          city_id: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          message: string
          sent_count: number
        }
        Insert: {
          audience: string
          city_id?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          message: string
          sent_count?: number
        }
        Update: {
          audience?: string
          city_id?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          message?: string
          sent_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "sa_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          city_id: string | null
          driver_id: string
          heading: number | null
          latitude: number
          longitude: number
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          driver_id: string
          heading?: number | null
          latitude: number
          longitude: number
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          driver_id?: string
          heading?: number | null
          latitude?: number
          longitude?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "sa_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          car_color: string | null
          car_model: string | null
          car_plate: string | null
          car_type: string | null
          created_at: string
          flagged: boolean
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          kyc_reject_reason: string | null
          kyc_reviewed_at: string | null
          kyc_reviewed_by: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          last_peak_alert_at: string | null
          name: string | null
          national_id: string | null
          national_id_photo_url: string | null
          nationality: string | null
          phone: string | null
          phone_verified: boolean
          preferred_language: string
          rating_avg: number
          registration_complete: boolean
          selfie_photo_url: string | null
          share_name: boolean
          share_phone: boolean
          status: Database["public"]["Enums"]["driver_status"]
          subscription_end: string | null
          subscription_plan: string | null
          subscription_start: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          suspended: boolean
          telegram_id: number
          total_cancellations: number
          total_rides: number
          updated_at: string
        }
        Insert: {
          car_color?: string | null
          car_model?: string | null
          car_plate?: string | null
          car_type?: string | null
          created_at?: string
          flagged?: boolean
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          kyc_reject_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_reviewed_by?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_peak_alert_at?: string | null
          name?: string | null
          national_id?: string | null
          national_id_photo_url?: string | null
          nationality?: string | null
          phone?: string | null
          phone_verified?: boolean
          preferred_language?: string
          rating_avg?: number
          registration_complete?: boolean
          selfie_photo_url?: string | null
          share_name?: boolean
          share_phone?: boolean
          status?: Database["public"]["Enums"]["driver_status"]
          subscription_end?: string | null
          subscription_plan?: string | null
          subscription_start?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          suspended?: boolean
          telegram_id: number
          total_cancellations?: number
          total_rides?: number
          updated_at?: string
        }
        Update: {
          car_color?: string | null
          car_model?: string | null
          car_plate?: string | null
          car_type?: string | null
          created_at?: string
          flagged?: boolean
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          kyc_reject_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_reviewed_by?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_peak_alert_at?: string | null
          name?: string | null
          national_id?: string | null
          national_id_photo_url?: string | null
          nationality?: string | null
          phone?: string | null
          phone_verified?: boolean
          preferred_language?: string
          rating_avg?: number
          registration_complete?: boolean
          selfie_photo_url?: string | null
          share_name?: boolean
          share_phone?: boolean
          status?: Database["public"]["Enums"]["driver_status"]
          subscription_end?: string | null
          subscription_plan?: string | null
          subscription_start?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          suspended?: boolean
          telegram_id?: number
          total_cancellations?: number
          total_rides?: number
          updated_at?: string
        }
        Relationships: []
      }
      emergency_logs: {
        Row: {
          created_at: string
          driver_id: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          resolved: boolean
          resolved_at: string | null
          ride_id: string | null
          rider_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          ride_id?: string | null
          rider_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          ride_id?: string | null
          rider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_logs_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_logs_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          message_type: string
          original_lang: string | null
          payload: Json | null
          ride_id: string
          sender_role: Database["public"]["Enums"]["bot_role"]
          translated_lang: string | null
          translated_text: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          message_type: string
          original_lang?: string | null
          payload?: Json | null
          ride_id: string
          sender_role: Database["public"]["Enums"]["bot_role"]
          translated_lang?: string | null
          translated_text?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          message_type?: string
          original_lang?: string | null
          payload?: Json | null
          ride_id?: string
          sender_role?: Database["public"]["Enums"]["bot_role"]
          translated_lang?: string | null
          translated_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      peak_predictions: {
        Row: {
          city_id: string | null
          created_at: string
          expected_rides: number | null
          id: string
          notified: boolean | null
          peak_score: number | null
          predicted_at: string
          window_end: string
          window_start: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          expected_rides?: number | null
          id?: string
          notified?: boolean | null
          peak_score?: number | null
          predicted_at: string
          window_end: string
          window_start: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          expected_rides?: number | null
          id?: string
          notified?: boolean | null
          peak_score?: number | null
          predicted_at?: string
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "peak_predictions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "sa_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      peak_zones: {
        Row: {
          avg_wait_sec: number | null
          city_id: string | null
          day_of_week: number
          hour_of_day: number
          id: string
          last_updated: string
          ride_count: number
        }
        Insert: {
          avg_wait_sec?: number | null
          city_id?: string | null
          day_of_week: number
          hour_of_day: number
          id?: string
          last_updated?: string
          ride_count?: number
        }
        Update: {
          avg_wait_sec?: number | null
          city_id?: string | null
          day_of_week?: number
          hour_of_day?: number
          id?: string
          last_updated?: string
          ride_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "peak_zones_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "sa_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          role: string
          telegram_id: number
          verified: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          role: string
          telegram_id: number
          verified?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          role?: string
          telegram_id?: number
          verified?: boolean
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          base_fare: number
          holiday_surge_factor: number
          id: number
          max_surge: number
          min_fare: number
          peak_surge_factor: number
          per_km: number
          per_min: number
          updated_at: string
          weather_surge_factor: number
        }
        Insert: {
          base_fare?: number
          holiday_surge_factor?: number
          id?: number
          max_surge?: number
          min_fare?: number
          peak_surge_factor?: number
          per_km?: number
          per_min?: number
          updated_at?: string
          weather_surge_factor?: number
        }
        Update: {
          base_fare?: number
          holiday_surge_factor?: number
          id?: number
          max_surge?: number
          min_fare?: number
          peak_surge_factor?: number
          per_km?: number
          per_min?: number
          updated_at?: string
          weather_surge_factor?: number
        }
        Relationships: []
      }
      ratings: {
        Row: {
          ai_notes: string | null
          ai_rating: number | null
          created_at: string
          driver_comment: string | null
          driver_rating: number | null
          id: string
          ride_id: string
          rider_comment: string | null
          rider_rating: number | null
        }
        Insert: {
          ai_notes?: string | null
          ai_rating?: number | null
          created_at?: string
          driver_comment?: string | null
          driver_rating?: number | null
          id?: string
          ride_id: string
          rider_comment?: string | null
          rider_rating?: number | null
        }
        Update: {
          ai_notes?: string | null
          ai_rating?: number | null
          created_at?: string
          driver_comment?: string | null
          driver_rating?: number | null
          id?: string
          ride_id?: string
          rider_comment?: string | null
          rider_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: true
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_offers: {
        Row: {
          distance_km: number | null
          driver_id: string
          expires_at: string
          id: string
          message_id: number | null
          responded_at: string | null
          ride_id: string
          sent_at: string
          status: Database["public"]["Enums"]["offer_status"]
        }
        Insert: {
          distance_km?: number | null
          driver_id: string
          expires_at: string
          id?: string
          message_id?: number | null
          responded_at?: string | null
          ride_id: string
          sent_at?: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Update: {
          distance_km?: number | null
          driver_id?: string
          expires_at?: string
          id?: string
          message_id?: number | null
          responded_at?: string | null
          ride_id?: string
          sent_at?: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ride_offers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_offers_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          created_at: string
          flagged: boolean
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          language_selected: boolean
          name: string | null
          phone: string | null
          preferred_language: string
          rating_avg: number
          share_name: boolean
          share_phone: boolean
          suspended: boolean
          telegram_id: number
          total_cancellations: number
          total_rides: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          flagged?: boolean
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          language_selected?: boolean
          name?: string | null
          phone?: string | null
          preferred_language?: string
          rating_avg?: number
          share_name?: boolean
          share_phone?: boolean
          suspended?: boolean
          telegram_id: number
          total_cancellations?: number
          total_rides?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          flagged?: boolean
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          language_selected?: boolean
          name?: string | null
          phone?: string | null
          preferred_language?: string
          rating_avg?: number
          share_name?: boolean
          share_phone?: boolean
          suspended?: boolean
          telegram_id?: number
          total_cancellations?: number
          total_rides?: number
          updated_at?: string
        }
        Relationships: []
      }
      rides: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          dispatch_wave: number
          driver_arrived_at: string | null
          driver_confirmed_complete: boolean
          driver_gender_pref: Database["public"]["Enums"]["gender_pref"]
          driver_id: string | null
          drop_address_resolved: string | null
          drop_lat: number
          drop_lng: number
          drop_name: string
          dropoff_city_id: string | null
          id: string
          notes: string | null
          passenger_onboard_at: string | null
          peak_score: number | null
          pickup_address_resolved: string | null
          pickup_city_id: string | null
          pickup_lat: number
          pickup_lng: number
          pickup_name: string
          rider_confirmed_complete: boolean
          rider_id: string
          route_distance_km: number | null
          route_duration_min: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["ride_status"]
          suggested_fare: number | null
          surge_multiplier: number | null
          traffic_duration_min: number | null
          updated_at: string
          weather_condition: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          dispatch_wave?: number
          driver_arrived_at?: string | null
          driver_confirmed_complete?: boolean
          driver_gender_pref?: Database["public"]["Enums"]["gender_pref"]
          driver_id?: string | null
          drop_address_resolved?: string | null
          drop_lat: number
          drop_lng: number
          drop_name: string
          dropoff_city_id?: string | null
          id?: string
          notes?: string | null
          passenger_onboard_at?: string | null
          peak_score?: number | null
          pickup_address_resolved?: string | null
          pickup_city_id?: string | null
          pickup_lat: number
          pickup_lng: number
          pickup_name: string
          rider_confirmed_complete?: boolean
          rider_id: string
          route_distance_km?: number | null
          route_duration_min?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          suggested_fare?: number | null
          surge_multiplier?: number | null
          traffic_duration_min?: number | null
          updated_at?: string
          weather_condition?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          dispatch_wave?: number
          driver_arrived_at?: string | null
          driver_confirmed_complete?: boolean
          driver_gender_pref?: Database["public"]["Enums"]["gender_pref"]
          driver_id?: string | null
          drop_address_resolved?: string | null
          drop_lat?: number
          drop_lng?: number
          drop_name?: string
          dropoff_city_id?: string | null
          id?: string
          notes?: string | null
          passenger_onboard_at?: string | null
          peak_score?: number | null
          pickup_address_resolved?: string | null
          pickup_city_id?: string | null
          pickup_lat?: number
          pickup_lng?: number
          pickup_name?: string
          rider_confirmed_complete?: boolean
          rider_id?: string
          route_distance_km?: number | null
          route_duration_min?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          suggested_fare?: number | null
          surge_multiplier?: number | null
          traffic_duration_min?: number | null
          updated_at?: string
          weather_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_dropoff_city_id_fkey"
            columns: ["dropoff_city_id"]
            isOneToOne: false
            referencedRelation: "sa_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_pickup_city_id_fkey"
            columns: ["pickup_city_id"]
            isOneToOne: false
            referencedRelation: "sa_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      sa_cities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          lat: number
          lng: number
          name_ar: string
          name_en: string | null
          radius_km: number
          region: string
          telegram_group_chat_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          lat: number
          lng: number
          name_ar: string
          name_en?: string | null
          radius_km?: number
          region: string
          telegram_group_chat_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name_ar?: string
          name_en?: string | null
          radius_km?: number
          region?: string
          telegram_group_chat_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          message: string
          reply: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string | null
          updated_at: string
          user_role: Database["public"]["Enums"]["bot_role"]
          user_telegram_id: number
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message: string
          reply?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string | null
          updated_at?: string
          user_role: Database["public"]["Enums"]["bot_role"]
          user_telegram_id: number
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message?: string
          reply?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string | null
          updated_at?: string
          user_role?: Database["public"]["Enums"]["bot_role"]
          user_telegram_id?: number
        }
        Relationships: []
      }
      suspicious_reviews: {
        Row: {
          action: string
          created_at: string
          id: string
          reason: string | null
          reviewed_by: string | null
          source: string
          subject_id: string
          subject_role: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_by?: string | null
          source?: string
          subject_id: string
          subject_role: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_by?: string | null
          source?: string
          subject_id?: string
          subject_role?: string
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
      weather_cache: {
        Row: {
          city_id: string | null
          condition: string | null
          fetched_at: string
          id: string
          is_severe: boolean | null
          raw: Json | null
          temperature_c: number | null
          weather_factor: number | null
        }
        Insert: {
          city_id?: string | null
          condition?: string | null
          fetched_at?: string
          id?: string
          is_severe?: boolean | null
          raw?: Json | null
          temperature_c?: number | null
          weather_factor?: number | null
        }
        Update: {
          city_id?: string | null
          condition?: string | null
          fetched_at?: string
          id?: string
          is_severe?: boolean | null
          raw?: Json | null
          temperature_c?: number | null
          weather_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_cache_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "sa_cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_peak_zones: { Args: never; Returns: undefined }
      city_for_point: { Args: { _lat: number; _lng: number }; Returns: string }
      claim_admin_if_first: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      nearby_drivers: {
        Args: {
          _city_id?: string
          _gender_pref?: Database["public"]["Enums"]["gender_pref"]
          _lat: number
          _limit?: number
          _lng: number
          _radius_km?: number
          _require_subscription?: boolean
        }
        Returns: {
          distance_km: number
          driver_id: string
          rating_avg: number
          telegram_id: number
        }[]
      }
      predict_peak_now: {
        Args: { _city_id: string }
        Returns: {
          expected_rides: number
          peak_score: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "support"
      bot_role: "driver" | "rider"
      driver_status: "offline" | "available" | "busy"
      gender: "male" | "female"
      gender_pref: "male" | "female" | "any"
      kyc_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "suspended"
      offer_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
      ride_status:
        | "searching"
        | "assigned"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "failed"
      subscription_status: "pending" | "active" | "expired" | "suspended"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
  public: {
    Enums: {
      app_role: ["admin", "support"],
      bot_role: ["driver", "rider"],
      driver_status: ["offline", "available", "busy"],
      gender: ["male", "female"],
      gender_pref: ["male", "female", "any"],
      kyc_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "suspended",
      ],
      offer_status: ["pending", "accepted", "rejected", "expired", "cancelled"],
      ride_status: [
        "searching",
        "assigned",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
        "failed",
      ],
      subscription_status: ["pending", "active", "expired", "suspended"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
