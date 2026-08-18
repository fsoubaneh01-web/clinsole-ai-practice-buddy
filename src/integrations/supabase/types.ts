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
      ai_usage_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          duration_min: number
          expected_fee: number
          id: string
          location: string | null
          notes: string | null
          nurse_id: string
          patient_id: string
          recurring: string | null
          reminder_sent: boolean
          scheduled_at: string
          updated_at: string
          visit_type: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          expected_fee?: number
          id?: string
          location?: string | null
          notes?: string | null
          nurse_id: string
          patient_id: string
          recurring?: string | null
          reminder_sent?: boolean
          scheduled_at: string
          updated_at?: string
          visit_type?: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          expected_fee?: number
          id?: string
          location?: string | null
          notes?: string | null
          nurse_id?: string
          patient_id?: string
          recurring?: string | null
          reminder_sent?: boolean
          scheduled_at?: string
          updated_at?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dictation_usage: {
        Row: {
          created_at: string
          duration_seconds: number
          estimated_cost: number
          id: string
          user_id: string
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          estimated_cost?: number
          id?: string
          user_id: string
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          estimated_cost?: number
          id?: string
          user_id?: string
          visit_id?: string | null
        }
        Relationships: []
      }
      foot_assessments: {
        Row: {
          assessed_at: string
          callus_level: string | null
          capillary_refill: string | null
          created_at: string
          edema: string | null
          follow_up_at: string | null
          foot_view: string | null
          id: string
          left_foot: boolean
          monofilament_findings: string | null
          nails_debrided: boolean
          nails_fungal: boolean
          nails_ingrown: boolean
          nails_thickened: boolean
          nails_trimmed: boolean
          neuropathy_risk: string | null
          notes: string | null
          nurse_id: string
          pain_level: string | null
          patient_id: string
          photo_urls: string[]
          protective_sensation: string | null
          pulses_present: string | null
          region: string | null
          region_group: string | null
          region_label: string | null
          right_foot: boolean
          risk_level: string
          side: string | null
          skin_callus: boolean
          skin_conditions: string[]
          skin_corns: boolean
          skin_dry: boolean
          skin_fissures: boolean
          skin_infection: boolean
          skin_temperature: string | null
          skin_ulcer: boolean
          trend: string | null
          updated_at: string
          wound_depth_mm: number | null
          wound_length_mm: number | null
          wound_width_mm: number | null
        }
        Insert: {
          assessed_at?: string
          callus_level?: string | null
          capillary_refill?: string | null
          created_at?: string
          edema?: string | null
          follow_up_at?: string | null
          foot_view?: string | null
          id?: string
          left_foot?: boolean
          monofilament_findings?: string | null
          nails_debrided?: boolean
          nails_fungal?: boolean
          nails_ingrown?: boolean
          nails_thickened?: boolean
          nails_trimmed?: boolean
          neuropathy_risk?: string | null
          notes?: string | null
          nurse_id: string
          pain_level?: string | null
          patient_id: string
          photo_urls?: string[]
          protective_sensation?: string | null
          pulses_present?: string | null
          region?: string | null
          region_group?: string | null
          region_label?: string | null
          right_foot?: boolean
          risk_level?: string
          side?: string | null
          skin_callus?: boolean
          skin_conditions?: string[]
          skin_corns?: boolean
          skin_dry?: boolean
          skin_fissures?: boolean
          skin_infection?: boolean
          skin_temperature?: string | null
          skin_ulcer?: boolean
          trend?: string | null
          updated_at?: string
          wound_depth_mm?: number | null
          wound_length_mm?: number | null
          wound_width_mm?: number | null
        }
        Update: {
          assessed_at?: string
          callus_level?: string | null
          capillary_refill?: string | null
          created_at?: string
          edema?: string | null
          follow_up_at?: string | null
          foot_view?: string | null
          id?: string
          left_foot?: boolean
          monofilament_findings?: string | null
          nails_debrided?: boolean
          nails_fungal?: boolean
          nails_ingrown?: boolean
          nails_thickened?: boolean
          nails_trimmed?: boolean
          neuropathy_risk?: string | null
          notes?: string | null
          nurse_id?: string
          pain_level?: string | null
          patient_id?: string
          photo_urls?: string[]
          protective_sensation?: string | null
          pulses_present?: string | null
          region?: string | null
          region_group?: string | null
          region_label?: string | null
          right_foot?: boolean
          risk_level?: string
          side?: string | null
          skin_callus?: boolean
          skin_conditions?: string[]
          skin_corns?: boolean
          skin_dry?: boolean
          skin_fissures?: boolean
          skin_infection?: boolean
          skin_temperature?: string | null
          skin_ulcer?: boolean
          trend?: string | null
          updated_at?: string
          wound_depth_mm?: number | null
          wound_length_mm?: number | null
          wound_width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "foot_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      nurse_profiles: {
        Row: {
          bio: string
          created_at: string
          credentials: string
          email: string
          id: string
          name: string
          onboarded: boolean
          plan: string
          service_area: string
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
          bio?: string
          created_at?: string
          credentials?: string
          email?: string
          id?: string
          name?: string
          onboarded?: boolean
          plan?: string
          service_area?: string
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
          bio?: string
          created_at?: string
          credentials?: string
          email?: string
          id?: string
          name?: string
          onboarded?: boolean
          plan?: string
          service_area?: string
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          conditions: string[]
          created_at: string
          diabetes_status: Database["public"]["Enums"]["diabetes_status"]
          dob: string | null
          email: string | null
          id: string
          name: string
          next_follow_up: string | null
          notes: string | null
          nurse_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          conditions?: string[]
          created_at?: string
          diabetes_status?: Database["public"]["Enums"]["diabetes_status"]
          dob?: string | null
          email?: string | null
          id?: string
          name: string
          next_follow_up?: string | null
          notes?: string | null
          nurse_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          conditions?: string[]
          created_at?: string
          diabetes_status?: Database["public"]["Enums"]["diabetes_status"]
          dob?: string | null
          email?: string | null
          id?: string
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          nurse_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          note: string | null
          nurse_id: string
          occurred_at: string
          patient_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          note?: string | null
          nurse_id: string
          occurred_at?: string
          patient_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          note?: string | null
          nurse_id?: string
          occurred_at?: string
          patient_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          created_at: string
          fee: number
          id: string
          nurse_id: string
          patient_id: string
          soap_assessment: string
          soap_objective: string
          soap_plan: string
          soap_subjective: string
          updated_at: string
          visit_date: string
        }
        Insert: {
          created_at?: string
          fee?: number
          id?: string
          nurse_id: string
          patient_id: string
          soap_assessment?: string
          soap_objective?: string
          soap_plan?: string
          soap_subjective?: string
          updated_at?: string
          visit_date?: string
        }
        Update: {
          created_at?: string
          fee?: number
          id?: string
          nurse_id?: string
          patient_id?: string
          soap_assessment?: string
          soap_objective?: string
          soap_plan?: string
          soap_subjective?: string
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
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
      visit_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          nurse_id: string
          patient_id: string
          step_index: number | null
          storage_path: string
          treatment_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          nurse_id: string
          patient_id: string
          step_index?: number | null
          storage_path: string
          treatment_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          nurse_id?: string
          patient_id?: string
          step_index?: number | null
          storage_path?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_photos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_photos_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "nurse"
      diabetes_status: "none" | "prediabetes" | "type1" | "type2"
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
      app_role: ["admin", "nurse"],
      diabetes_status: ["none", "prediabetes", "type1", "type2"],
    },
  },
} as const
