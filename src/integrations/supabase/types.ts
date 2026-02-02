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
      candidate_feedback: {
        Row: {
          change_reason: string | null
          created_at: string
          id: string
          likes_reason: string | null
          likes_solution: string
          user_id: string
          would_change: string
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          id?: string
          likes_reason?: string | null
          likes_solution: string
          user_id: string
          would_change: string
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          id?: string
          likes_reason?: string | null
          likes_solution?: string
          user_id?: string
          would_change?: string
        }
        Relationships: []
      }
      candidate_test_results: {
        Row: {
          adaptacja_score: number | null
          additional_completed: boolean | null
          all_tests_completed: boolean | null
          competency_answers: Json | null
          competency_tests_completed: boolean | null
          created_at: string
          culture_answers: Json | null
          culture_autonomia_styl_pracy: number | null
          culture_elastycznosc_innowacyjnosc: number | null
          culture_relacja_wspolpraca: number | null
          culture_stabilnosc_struktura: number | null
          culture_test_completed: boolean | null
          culture_wlb_dobrostan: number | null
          culture_wyniki_cele: number | null
          determinacja_score: number | null
          experience: string | null
          id: string
          industry: string | null
          komunikacja_score: number | null
          myslenie_analityczne_score: number | null
          out_of_the_box_score: number | null
          position_level: string | null
          updated_at: string
          user_id: string
          wants_to_change_industry: string | null
          work_description: string | null
        }
        Insert: {
          adaptacja_score?: number | null
          additional_completed?: boolean | null
          all_tests_completed?: boolean | null
          competency_answers?: Json | null
          competency_tests_completed?: boolean | null
          created_at?: string
          culture_answers?: Json | null
          culture_autonomia_styl_pracy?: number | null
          culture_elastycznosc_innowacyjnosc?: number | null
          culture_relacja_wspolpraca?: number | null
          culture_stabilnosc_struktura?: number | null
          culture_test_completed?: boolean | null
          culture_wlb_dobrostan?: number | null
          culture_wyniki_cele?: number | null
          determinacja_score?: number | null
          experience?: string | null
          id?: string
          industry?: string | null
          komunikacja_score?: number | null
          myslenie_analityczne_score?: number | null
          out_of_the_box_score?: number | null
          position_level?: string | null
          updated_at?: string
          user_id: string
          wants_to_change_industry?: string | null
          work_description?: string | null
        }
        Update: {
          adaptacja_score?: number | null
          additional_completed?: boolean | null
          all_tests_completed?: boolean | null
          competency_answers?: Json | null
          competency_tests_completed?: boolean | null
          created_at?: string
          culture_answers?: Json | null
          culture_autonomia_styl_pracy?: number | null
          culture_elastycznosc_innowacyjnosc?: number | null
          culture_relacja_wspolpraca?: number | null
          culture_stabilnosc_struktura?: number | null
          culture_test_completed?: boolean | null
          culture_wlb_dobrostan?: number | null
          culture_wyniki_cele?: number | null
          determinacja_score?: number | null
          experience?: string | null
          id?: string
          industry?: string | null
          komunikacja_score?: number | null
          myslenie_analityczne_score?: number | null
          out_of_the_box_score?: number | null
          position_level?: string | null
          updated_at?: string
          user_id?: string
          wants_to_change_industry?: string | null
          work_description?: string | null
        }
        Relationships: []
      }
      employer_profiles: {
        Row: {
          accepted_industries: string[] | null
          company_name: string | null
          created_at: string
          culture_answers: Json | null
          culture_autonomia_styl_pracy: number | null
          culture_completed: boolean | null
          culture_elastycznosc_innowacyjnosc: number | null
          culture_relacja_wspolpraca: number | null
          culture_stabilnosc_struktura: number | null
          culture_wlb_dobrostan: number | null
          culture_wyniki_cele: number | null
          id: string
          industry: string | null
          position_level: string | null
          profile_completed: boolean | null
          req_adaptacja: number | null
          req_determinacja: number | null
          req_komunikacja: number | null
          req_myslenie_analityczne: number | null
          req_out_of_the_box: number | null
          required_experience: string | null
          requirements_completed: boolean | null
          role_completed: boolean | null
          role_description: string | null
          role_responsibilities: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_industries?: string[] | null
          company_name?: string | null
          created_at?: string
          culture_answers?: Json | null
          culture_autonomia_styl_pracy?: number | null
          culture_completed?: boolean | null
          culture_elastycznosc_innowacyjnosc?: number | null
          culture_relacja_wspolpraca?: number | null
          culture_stabilnosc_struktura?: number | null
          culture_wlb_dobrostan?: number | null
          culture_wyniki_cele?: number | null
          id?: string
          industry?: string | null
          position_level?: string | null
          profile_completed?: boolean | null
          req_adaptacja?: number | null
          req_determinacja?: number | null
          req_komunikacja?: number | null
          req_myslenie_analityczne?: number | null
          req_out_of_the_box?: number | null
          required_experience?: string | null
          requirements_completed?: boolean | null
          role_completed?: boolean | null
          role_description?: string | null
          role_responsibilities?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_industries?: string[] | null
          company_name?: string | null
          created_at?: string
          culture_answers?: Json | null
          culture_autonomia_styl_pracy?: number | null
          culture_completed?: boolean | null
          culture_elastycznosc_innowacyjnosc?: number | null
          culture_relacja_wspolpraca?: number | null
          culture_stabilnosc_struktura?: number | null
          culture_wlb_dobrostan?: number | null
          culture_wyniki_cele?: number | null
          id?: string
          industry?: string | null
          position_level?: string | null
          profile_completed?: boolean | null
          req_adaptacja?: number | null
          req_determinacja?: number | null
          req_komunikacja?: number | null
          req_myslenie_analityczne?: number | null
          req_out_of_the_box?: number | null
          required_experience?: string | null
          requirements_completed?: boolean | null
          role_completed?: boolean | null
          role_description?: string | null
          role_responsibilities?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      match_results: {
        Row: {
          candidate_user_id: string
          competence_percent: number | null
          created_at: string
          culture_percent: number | null
          employer_user_id: string
          extra_percent: number | null
          id: string
          match_details: Json | null
          overall_percent: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          candidate_user_id: string
          competence_percent?: number | null
          created_at?: string
          culture_percent?: number | null
          employer_user_id: string
          extra_percent?: number | null
          id?: string
          match_details?: Json | null
          overall_percent?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          candidate_user_id?: string
          competence_percent?: number | null
          created_at?: string
          culture_percent?: number | null
          employer_user_id?: string
          extra_percent?: number | null
          id?: string
          match_details?: Json | null
          overall_percent?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_profile_public: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
          user_type: string
        }[]
      }
      get_user_type: { Args: { user_uuid: string }; Returns: string }
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
