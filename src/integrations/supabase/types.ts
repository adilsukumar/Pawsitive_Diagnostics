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
      diagnostic_reports: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          health_score: number | null
          id: string
          pet_id: string | null
          raw_input_url: string | null
          recommendations: string[] | null
          sensor_type: string
          severity: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          health_score?: number | null
          id?: string
          pet_id?: string | null
          raw_input_url?: string | null
          recommendations?: string[] | null
          sensor_type: string
          severity?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          health_score?: number | null
          id?: string
          pet_id?: string | null
          raw_input_url?: string | null
          recommendations?: string[] | null
          sensor_type?: string
          severity?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_reports_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_logs: {
        Row: {
          confidence: number | null
          created_at: string
          emotion: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          emotion: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          emotion?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          age_years: number | null
          breed: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          age_years?: number | null
          breed?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          age_years?: number | null
          breed?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
          ammonia_ppm: number | null
          bark_spike: number | null
          co2_ppm: number | null
          created_at: string
          device_timestamp: number | null
          diagnosis: string | null
          id: string
          methane_ppm: number | null
          scratch_intensity: number | null
          skin_status: string | null
        }
        Insert: {
          ammonia_ppm?: number | null
          bark_spike?: number | null
          co2_ppm?: number | null
          created_at?: string
          device_timestamp?: number | null
          diagnosis?: string | null
          id?: string
          methane_ppm?: number | null
          scratch_intensity?: number | null
          skin_status?: string | null
        }
        Update: {
          ammonia_ppm?: number | null
          bark_spike?: number | null
          co2_ppm?: number | null
          created_at?: string
          device_timestamp?: number | null
          diagnosis?: string | null
          id?: string
          methane_ppm?: number | null
          scratch_intensity?: number | null
          skin_status?: string | null
        }
        Relationships: []
      }
      vet_shares: {
        Row: {
          created_at: string
          dog_age: string | null
          dog_breed: string | null
          dog_name: string | null
          dog_photo: string | null
          dog_weight: string | null
          emotion_logs: Json | null
          expires_at: string
          id: string
          scan_history: Json | null
          sensor_readings: Json | null
        }
        Insert: {
          created_at?: string
          dog_age?: string | null
          dog_breed?: string | null
          dog_name?: string | null
          dog_photo?: string | null
          dog_weight?: string | null
          emotion_logs?: Json | null
          expires_at?: string
          id?: string
          scan_history?: Json | null
          sensor_readings?: Json | null
        }
        Update: {
          created_at?: string
          dog_age?: string | null
          dog_breed?: string | null
          dog_name?: string | null
          dog_photo?: string | null
          dog_weight?: string | null
          emotion_logs?: Json | null
          expires_at?: string
          id?: string
          scan_history?: Json | null
          sensor_readings?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_vet_shares: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
