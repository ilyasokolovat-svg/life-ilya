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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      goals_data: {
        Row: {
          actual_result: string | null
          assigned_day: string | null
          assigned_time_slot: string | null
          bullet_point_day_assignments: string | null
          category: string
          created_at: string
          id: string
          order_index: number | null
          period_key: string
          period_type: string
          planned_goal: string | null
          priority: string | null
          subcategory: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_result?: string | null
          assigned_day?: string | null
          assigned_time_slot?: string | null
          bullet_point_day_assignments?: string | null
          category: string
          created_at?: string
          id?: string
          order_index?: number | null
          period_key: string
          period_type: string
          planned_goal?: string | null
          priority?: string | null
          subcategory: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_result?: string | null
          assigned_day?: string | null
          assigned_time_slot?: string | null
          bullet_point_day_assignments?: string | null
          category?: string
          created_at?: string
          id?: string
          order_index?: number | null
          period_key?: string
          period_type?: string
          planned_goal?: string | null
          priority?: string | null
          subcategory?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_days: {
        Row: {
          created_at: string
          date: string
          habit_data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          habit_data?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          habit_data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_goals: {
        Row: {
          created_at: string
          goals_data: Json
          id: string
          month_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goals_data?: Json
          id?: string
          month_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goals_data?: Json
          id?: string
          month_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          date: string
          description: string | null
          emoji: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          date: string
          description?: string | null
          emoji?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          date?: string
          description?: string | null
          emoji?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_reviews: {
        Row: {
          category: string
          created_at: string
          id: string
          month_key: string
          review_text: string | null
          subcategory: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          month_key: string
          review_text?: string | null
          subcategory: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          month_key?: string
          review_text?: string | null
          subcategory?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      standalone_todos: {
        Row: {
          completed: boolean
          created_at: string
          deadline: string | null
          hidden: boolean
          id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          deadline?: string | null
          hidden?: boolean
          id?: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          deadline?: string | null
          hidden?: boolean
          id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      travel_periods: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          emoji: string | null
          end_date: string
          id: string
          location: string
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          end_date: string
          id?: string
          location: string
          start_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          end_date?: string
          id?: string
          location?: string
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          accommodations: Json
          created_at: string
          destinations: Json
          end_date: string
          flights: Json
          id: string
          is_past_trip: boolean
          itinerary: Json
          planned_activities: Json
          start_date: string
          title: string
          total_budget: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accommodations?: Json
          created_at?: string
          destinations?: Json
          end_date: string
          flights?: Json
          id?: string
          is_past_trip?: boolean
          itinerary?: Json
          planned_activities?: Json
          start_date: string
          title: string
          total_budget?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accommodations?: Json
          created_at?: string
          destinations?: Json
          end_date?: string
          flights?: Json
          id?: string
          is_past_trip?: boolean
          itinerary?: Json
          planned_activities?: Json
          start_date?: string
          title?: string
          total_budget?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subcategory_preferences: {
        Row: {
          category: string
          created_at: string
          hidden_subcategories: Json
          id: string
          subcategories: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          hidden_subcategories?: Json
          id?: string
          subcategories?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          hidden_subcategories?: Json
          id?: string
          subcategories?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visited_countries: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          id: string
          lived_in: boolean
          user_id: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          lived_in?: boolean
          user_id: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          lived_in?: boolean
          user_id?: string
        }
        Relationships: []
      }
      weekly_tracking: {
        Row: {
          category: string
          created_at: string
          fact_text: string | null
          id: string
          month_key: string
          plan_text: string | null
          subcategory: string
          updated_at: string
          user_id: string
          week_index: number
        }
        Insert: {
          category: string
          created_at?: string
          fact_text?: string | null
          id?: string
          month_key: string
          plan_text?: string | null
          subcategory: string
          updated_at?: string
          user_id: string
          week_index: number
        }
        Update: {
          category?: string
          created_at?: string
          fact_text?: string | null
          id?: string
          month_key?: string
          plan_text?: string | null
          subcategory?: string
          updated_at?: string
          user_id?: string
          week_index?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_habit_days_table: { Args: never; Returns: undefined }
      create_habit_goals_table: { Args: never; Returns: undefined }
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
