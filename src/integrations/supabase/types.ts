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
      accounts: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_estimated: boolean | null
          label: string
          linked_goal_id: string | null
          liquid: boolean | null
          sort_order: number | null
          target_pct: number | null
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_estimated?: boolean | null
          label: string
          linked_goal_id?: string | null
          liquid?: boolean | null
          sort_order?: number | null
          target_pct?: number | null
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_estimated?: boolean | null
          label?: string
          linked_goal_id?: string | null
          liquid?: boolean | null
          sort_order?: number | null
          target_pct?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      b2broker_deals: {
        Row: {
          arr_usd: number
          company_name: string
          created_at: string
          expected_bonus_usd: number
          id: string
          notes: string | null
          product: string | null
          sort_order: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arr_usd?: number
          company_name: string
          created_at?: string
          expected_bonus_usd?: number
          id?: string
          notes?: string | null
          product?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arr_usd?: number
          company_name?: string
          created_at?: string
          expected_bonus_usd?: number
          id?: string
          notes?: string | null
          product?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bonus_allocations: {
        Row: {
          amount: number
          created_at: string | null
          goal_id: string
          id: string
          note: string | null
          pool_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          goal_id: string
          id?: string
          note?: string | null
          pool_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          goal_id?: string
          id?: string
          note?: string | null
          pool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_allocations_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_allocations_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "bonus_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_pools: {
        Row: {
          created_at: string | null
          description: string
          id: string
          month: string
          source_extra_id: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          month: string
          source_extra_id?: string | null
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          month?: string
          source_extra_id?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_pools_source_extra_id_fkey"
            columns: ["source_extra_id"]
            isOneToOne: false
            referencedRelation: "budget_extras"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_categories: {
        Row: {
          budget: number
          color: string | null
          created_at: string | null
          id: string
          label: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          budget?: number
          color?: string | null
          created_at?: string | null
          id?: string
          label: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          budget?: number
          color?: string | null
          created_at?: string | null
          id?: string
          label?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      budget_extras: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          month: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          month: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          month?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_months: {
        Row: {
          created_at: string | null
          id: string
          month: string
          salary: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: string
          salary?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          salary?: number
          user_id?: string
        }
        Relationships: []
      }
      budget_spending: {
        Row: {
          actual: number
          category_id: string
          created_at: string | null
          id: string
          month: string
          user_id: string
        }
        Insert: {
          actual?: number
          category_id: string
          created_at?: string | null
          id?: string
          month: string
          user_id: string
        }
        Update: {
          actual?: number
          category_id?: string
          created_at?: string | null
          id?: string
          month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_spending_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_reviews: {
        Row: {
          answers: Json
          checkin_type: string
          completed: boolean
          created_at: string
          id: string
          period_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          checkin_type: string
          completed?: boolean
          created_at?: string
          id?: string
          period_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          checkin_type?: string
          completed?: boolean
          created_at?: string
          id?: string
          period_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkin_state: {
        Row: {
          id: string
          monthly_last: string | null
          quarterly_last: string | null
          updated_at: string
          user_id: string
          weekly_last: string | null
        }
        Insert: {
          id?: string
          monthly_last?: string | null
          quarterly_last?: string | null
          updated_at?: string
          user_id: string
          weekly_last?: string | null
        }
        Update: {
          id?: string
          monthly_last?: string | null
          quarterly_last?: string | null
          updated_at?: string
          user_id?: string
          weekly_last?: string | null
        }
        Relationships: []
      }
      focus_blocks: {
        Row: {
          completed: boolean
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          goal: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          goal: string
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          goal?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          allocation_pct: number
          color: string | null
          created_at: string | null
          id: string
          linked_account_id: string | null
          manual_current_value: number | null
          name: string
          planned_monthly_contribution: number | null
          priority: number
          target_amount: number
          target_date: string
          user_id: string
          value_source: string
        }
        Insert: {
          allocation_pct?: number
          color?: string | null
          created_at?: string | null
          id?: string
          linked_account_id?: string | null
          manual_current_value?: number | null
          name: string
          planned_monthly_contribution?: number | null
          priority?: number
          target_amount: number
          target_date: string
          user_id: string
          value_source?: string
        }
        Update: {
          allocation_pct?: number
          color?: string | null
          created_at?: string | null
          id?: string
          linked_account_id?: string | null
          manual_current_value?: number | null
          name?: string
          planned_monthly_contribution?: number | null
          priority?: number
          target_amount?: number
          target_date?: string
          user_id?: string
          value_source?: string
        }
        Relationships: []
      }
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
      investment_buckets: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          label: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          label: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      investment_snapshots: {
        Row: {
          bucket_id: string
          contribution: number
          created_at: string | null
          id: string
          month: string
          user_id: string
          value: number
        }
        Insert: {
          bucket_id: string
          contribution?: number
          created_at?: string | null
          id?: string
          month: string
          user_id: string
          value?: number
        }
        Update: {
          bucket_id?: string
          contribution?: number
          created_at?: string | null
          id?: string
          month?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "investment_snapshots_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "investment_buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      job_opportunities: {
        Row: {
          base_salary_monthly_usd: number | null
          company_name: string
          company_stage: string | null
          contact_linkedin: string | null
          contact_name: string | null
          contact_role: string | null
          created_at: string
          direction: string
          entity_type: string | null
          equity_offered: string | null
          id: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          role_title: string | null
          sort_order: number | null
          source: string | null
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_salary_monthly_usd?: number | null
          company_name: string
          company_stage?: string | null
          contact_linkedin?: string | null
          contact_name?: string | null
          contact_role?: string | null
          created_at?: string
          direction?: string
          entity_type?: string | null
          equity_offered?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          role_title?: string | null
          sort_order?: number | null
          source?: string | null
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_salary_monthly_usd?: number | null
          company_name?: string
          company_stage?: string | null
          contact_linkedin?: string | null
          contact_name?: string | null
          contact_role?: string | null
          created_at?: string
          direction?: string
          entity_type?: string | null
          equity_offered?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          role_title?: string | null
          sort_order?: number | null
          source?: string | null
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_search_settings: {
        Row: {
          checkpoint_date: string
          created_at: string
          id: string
          target_offer_date: string
          updated_at: string
          user_id: string
          weekly_target_applications: number
          weekly_target_outreach: number
          weekly_target_posts: number
        }
        Insert: {
          checkpoint_date?: string
          created_at?: string
          id?: string
          target_offer_date?: string
          updated_at?: string
          user_id: string
          weekly_target_applications?: number
          weekly_target_outreach?: number
          weekly_target_posts?: number
        }
        Update: {
          checkpoint_date?: string
          created_at?: string
          id?: string
          target_offer_date?: string
          updated_at?: string
          user_id?: string
          weekly_target_applications?: number
          weekly_target_outreach?: number
          weekly_target_posts?: number
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
      nw_snapshots: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          month: string
          user_id: string
          value: number
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          month: string
          user_id: string
          value?: number
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          month?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "nw_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_tips: {
        Row: {
          content: Json
          created_at: string
          id: string
          order_index: number
          section: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          order_index?: number
          section: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          order_index?: number
          section?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          annual_growth_rate: number | null
          currency: string | null
          display_currency: string | null
          display_name: string | null
          fi_multiplier: number | null
          id: string
          savings_rate_target: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_growth_rate?: number | null
          currency?: string | null
          display_currency?: string | null
          display_name?: string | null
          fi_multiplier?: number | null
          id?: string
          savings_rate_target?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_growth_rate?: number | null
          currency?: string | null
          display_currency?: string | null
          display_name?: string | null
          fi_multiplier?: number | null
          id?: string
          savings_rate_target?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_contacts: {
        Row: {
          circle: string
          closeness: string | null
          created_at: string
          id: string
          instagram: string | null
          interesting_note: string | null
          last_contacted: string | null
          name: string
          next_action: string | null
          notes: string | null
          status: string
          updated_at: string
          user_id: string
          vibe_score: number
          where_met: string | null
        }
        Insert: {
          circle?: string
          closeness?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          interesting_note?: string | null
          last_contacted?: string | null
          name: string
          next_action?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vibe_score?: number
          where_met?: string | null
        }
        Update: {
          circle?: string
          closeness?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          interesting_note?: string | null
          last_contacted?: string | null
          name?: string
          next_action?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vibe_score?: number
          where_met?: string | null
        }
        Relationships: []
      }
      social_event_archive: {
        Row: {
          completed_at: string
          created_at: string
          experience_cost: number | null
          experience_location: string | null
          experience_title: string | null
          guest_count: number | null
          guest_names: string[] | null
          id: string
          notes: string | null
          slot_type: string
          user_id: string
          vibe_rating: number | null
          week_start: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          experience_cost?: number | null
          experience_location?: string | null
          experience_title?: string | null
          guest_count?: number | null
          guest_names?: string[] | null
          id?: string
          notes?: string | null
          slot_type: string
          user_id: string
          vibe_rating?: number | null
          week_start: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          experience_cost?: number | null
          experience_location?: string | null
          experience_title?: string | null
          guest_count?: number | null
          guest_names?: string[] | null
          id?: string
          notes?: string | null
          slot_type?: string
          user_id?: string
          vibe_rating?: number | null
          week_start?: string
        }
        Relationships: []
      }
      social_experiences: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          estimated_cost: number
          id: string
          ideal_group_size: string | null
          is_default: boolean
          location: string | null
          tier: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number
          id?: string
          ideal_group_size?: string | null
          is_default?: boolean
          location?: string | null
          tier?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number
          id?: string
          ideal_group_size?: string | null
          is_default?: boolean
          location?: string | null
          tier?: string
          title?: string
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
      sunday_outreach_tasks: {
        Row: {
          completed: boolean
          contact_id: string | null
          created_at: string
          id: string
          outreach_type: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          completed?: boolean
          contact_id?: string | null
          created_at?: string
          id?: string
          outreach_type: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          completed?: boolean
          contact_id?: string | null
          created_at?: string
          id?: string
          outreach_type?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "sunday_outreach_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "social_contacts"
            referencedColumns: ["id"]
          },
        ]
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
          lived_in_end_year: number | null
          lived_in_notes: string | null
          lived_in_periods: Json | null
          lived_in_start_year: number | null
          user_id: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          lived_in?: boolean
          lived_in_end_year?: number | null
          lived_in_notes?: string | null
          lived_in_periods?: Json | null
          lived_in_start_year?: number | null
          user_id: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          lived_in?: boolean
          lived_in_end_year?: number | null
          lived_in_notes?: string | null
          lived_in_periods?: Json | null
          lived_in_start_year?: number | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_activity: {
        Row: {
          applications_sent: number
          created_at: string
          id: string
          linkedin_posts: number
          outreach_sent: number
          recruiter_contacts: number
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          applications_sent?: number
          created_at?: string
          id?: string
          linkedin_posts?: number
          outreach_sent?: number
          recruiter_contacts?: number
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          applications_sent?: number
          created_at?: string
          id?: string
          linkedin_posts?: number
          outreach_sent?: number
          recruiter_contacts?: number
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      weekly_outreach: {
        Row: {
          confirmed_for: string | null
          contact_id: string | null
          contacted: boolean | null
          created_at: string | null
          id: string
          order_index: number | null
          updated_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          confirmed_for?: string | null
          contact_id?: string | null
          contacted?: boolean | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          updated_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          confirmed_for?: string | null
          contact_id?: string | null
          contacted?: boolean | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          updated_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_outreach_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "social_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_social_plans: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          custom_title: string | null
          day_of_week: number
          experience_id: string | null
          guest_ids: string[] | null
          id: string
          notes: string | null
          slot_type: string | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          custom_title?: string | null
          day_of_week: number
          experience_id?: string | null
          guest_ids?: string[] | null
          id?: string
          notes?: string | null
          slot_type?: string | null
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          custom_title?: string | null
          day_of_week?: number
          experience_id?: string | null
          guest_ids?: string[] | null
          id?: string
          notes?: string | null
          slot_type?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_social_plans_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "social_experiences"
            referencedColumns: ["id"]
          },
        ]
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
