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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      balance_adjustments: {
        Row: {
          adjustment_amount: number
          admin_id: string
          created_at: string
          id: string
          new_balance: number
          previous_balance: number
          reason: string | null
          user_id: string
        }
        Insert: {
          adjustment_amount?: number
          admin_id: string
          created_at?: string
          id?: string
          new_balance?: number
          previous_balance?: number
          reason?: string | null
          user_id: string
        }
        Update: {
          adjustment_amount?: number
          admin_id?: string
          created_at?: string
          id?: string
          new_balance?: number
          previous_balance?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      completed_offers: {
        Row: {
          coin: number
          country: string | null
          created_at: string
          id: string
          ip: string | null
          offer_name: string
          offerwall: string
          transaction_id: string | null
          user_id: string
          username: string
        }
        Insert: {
          coin: number
          country?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          offer_name: string
          offerwall: string
          transaction_id?: string | null
          user_id: string
          username: string
        }
        Update: {
          coin?: number
          country?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          offer_name?: string
          offerwall?: string
          transaction_id?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number | null
          created_at: string | null
          device_info: string | null
          email: string | null
          id: string
          last_login_ip: string | null
          status: string
          updated_at: string | null
          username: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          device_info?: string | null
          email?: string | null
          id: string
          last_login_ip?: string | null
          status?: string
          updated_at?: string | null
          username: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          device_info?: string | null
          email?: string | null
          id?: string
          last_login_ip?: string | null
          status?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          background_settings: Json | null
          coin_icon_url: string | null
          id: string
          logo_image_url: string | null
          logo_text: string | null
          logo_type: string
          offerwall_settings: Json | null
          postback_secret: string | null
          social_links_settings: Json | null
          sound_settings: Json | null
          updated_at: string
        }
        Insert: {
          background_settings?: Json | null
          coin_icon_url?: string | null
          id?: string
          logo_image_url?: string | null
          logo_text?: string | null
          logo_type?: string
          offerwall_settings?: Json | null
          postback_secret?: string | null
          social_links_settings?: Json | null
          sound_settings?: Json | null
          updated_at?: string
        }
        Update: {
          background_settings?: Json | null
          coin_icon_url?: string | null
          id?: string
          logo_image_url?: string | null
          logo_text?: string | null
          logo_type?: string
          offerwall_settings?: Json | null
          postback_secret?: string | null
          social_links_settings?: Json | null
          sound_settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account: string
          amount: number
          approved_at: string | null
          created_at: string
          id: string
          method: string
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          account: string
          amount: number
          approved_at?: string | null
          created_at?: string
          id?: string
          method: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          account?: string
          amount?: number
          approved_at?: string | null
          created_at?: string
          id?: string
          method?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_balance: {
        Args: { _new_balance: number; _reason?: string; _user_id: string }
        Returns: Json
      }
      approve_withdrawal: { Args: { _request_id: string }; Returns: Json }
      get_public_site_settings: {
        Args: never
        Returns: {
          background_settings: Json
          coin_icon_url: string
          id: string
          logo_image_url: string
          logo_text: string
          logo_type: string
          offerwall_settings: Json
          social_links_settings: Json
          sound_settings: Json
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_balance: {
        Args: { amount_input: number; user_id_input: string }
        Returns: undefined
      }
      reject_withdrawal: {
        Args: { _reason?: string; _request_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
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
      app_role: ["admin", "user", "moderator"],
    },
  },
} as const
