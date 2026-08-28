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
      admin_settings: {
        Row: {
          admin_password_hash: string
          admin_username: string
          id: string
          site_name: string | null
          updated_at: string | null
        }
        Insert: {
          admin_password_hash: string
          admin_username?: string
          id?: string
          site_name?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_password_hash?: string
          admin_username?: string
          id?: string
          site_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agenda_local_events: {
        Row: {
          all_day: boolean
          color: string
          created_at: string
          description: string | null
          ends_at: string
          id: string
          location: string | null
          starts_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          color?: string
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          location?: string | null
          starts_at: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          color?: string
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_local_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_view"
            referencedColumns: ["id"]
          },
        ]
      }
      annual_goals: {
        Row: {
          created_at: string
          description: string | null
          goal_value: number
          id: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal_value?: number
          id?: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          goal_value?: number
          id?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          product_link: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
          product_link?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          product_link?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          age: number | null
          avatar_url: string | null
          client_type: string
          company: string | null
          contract_day: number
          created_at: string
          deactivated_at: string | null
          email: string | null
          end_date: string | null
          entry_date: string
          gender: string | null
          id: string
          monthly_value: number
          name: string
          origin_channel: string | null
          origin_type: string | null
          phone: string | null
          recurrence: string
          referrer_name: string | null
          secondary_phone: string | null
          service_type: string
          status: string
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          client_type?: string
          company?: string | null
          contract_day?: number
          created_at?: string
          deactivated_at?: string | null
          email?: string | null
          end_date?: string | null
          entry_date?: string
          gender?: string | null
          id?: string
          monthly_value?: number
          name: string
          origin_channel?: string | null
          origin_type?: string | null
          phone?: string | null
          recurrence?: string
          referrer_name?: string | null
          secondary_phone?: string | null
          service_type: string
          status?: string
          user_id: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          client_type?: string
          company?: string | null
          contract_day?: number
          created_at?: string
          deactivated_at?: string | null
          email?: string | null
          end_date?: string | null
          entry_date?: string
          gender?: string | null
          id?: string
          monthly_value?: number
          name?: string
          origin_channel?: string | null
          origin_type?: string | null
          phone?: string | null
          recurrence?: string
          referrer_name?: string | null
          secondary_phone?: string | null
          service_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_cards: {
        Row: {
          card_order: number
          city: string | null
          client_name: string
          column_id: string
          comments: Json | null
          company: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          revenue: number | null
          role: string | null
          service_type: string | null
          user_id: string
        }
        Insert: {
          card_order?: number
          city?: string | null
          client_name: string
          column_id: string
          comments?: Json | null
          company?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          revenue?: number | null
          role?: string | null
          service_type?: string | null
          user_id: string
        }
        Update: {
          card_order?: number
          city?: string | null
          client_name?: string
          column_id?: string
          comments?: Json | null
          company?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          revenue?: number | null
          role?: string | null
          service_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_columns: {
        Row: {
          color: string | null
          column_order: number
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          color?: string | null
          column_order?: number
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          color?: string | null
          column_order?: number
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          category: string
          created_at: string
          description: string | null
          entry_date: string
          id: string
          payment_date: string | null
          receipt_url: string | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          payment_date?: string | null
          receipt_url?: string | null
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          payment_date?: string | null
          receipt_url?: string | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      finance_entries: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          description: string | null
          entry_date: string
          entry_type: string
          id: string
          kind: string | null
          product_id: string | null
          quantity: number | null
          service_id: string | null
          user_id: string
          value: number
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          kind?: string | null
          product_id?: string | null
          quantity?: number | null
          service_id?: string | null
          user_id: string
          value?: number
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          kind?: string | null
          product_id?: string | null
          quantity?: number | null
          service_id?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          google_email: string | null
          id: string
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          google_email?: string | null
          id?: string
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          google_email?: string | null
          id?: string
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hidden_report_folders: {
        Row: {
          created_at: string
          folder_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      manual_monthly_revenue: {
        Row: {
          created_at: string
          id: string
          month: number
          updated_at: string
          user_id: string
          value: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          updated_at?: string
          user_id: string
          value?: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          updated_at?: string
          user_id?: string
          value?: number
          year?: number
        }
        Relationships: []
      }
      mind_map_connections: {
        Row: {
          created_at: string
          id: string
          mind_map_id: string
          source_node_id: string
          target_node_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mind_map_id: string
          source_node_id: string
          target_node_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mind_map_id?: string
          source_node_id?: string
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mind_map_connections_mind_map_id_fkey"
            columns: ["mind_map_id"]
            isOneToOne: false
            referencedRelation: "mind_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_map_connections_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "mind_map_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_map_connections_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "mind_map_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_map_nodes: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          height: number | null
          id: string
          image_url: string | null
          mind_map_id: string
          position_x: number
          position_y: number
          width: number | null
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          height?: number | null
          id?: string
          image_url?: string | null
          mind_map_id: string
          position_x?: number
          position_y?: number
          width?: number | null
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          height?: number | null
          id?: string
          image_url?: string | null
          mind_map_id?: string
          position_x?: number
          position_y?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mind_map_nodes_mind_map_id_fkey"
            columns: ["mind_map_id"]
            isOneToOne: false
            referencedRelation: "mind_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_maps: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mind_maps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          created_at: string
          id: string
          is_manual: boolean
          month: number
          updated_at: string
          user_id: string
          value: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_manual?: boolean
          month: number
          updated_at?: string
          user_id: string
          value?: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_manual?: boolean
          month?: number
          updated_at?: string
          user_id?: string
          value?: number
          year?: number
        }
        Relationships: []
      }
      password_reset_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_view"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_history: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      planning_objectives: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          month: number
          name: string
          product_id: string | null
          service_id: string | null
          target_quantity: number | null
          target_value: number
          type: string
          unit_price_snapshot: number | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          month: number
          name: string
          product_id?: string | null
          service_id?: string | null
          target_quantity?: number | null
          target_value?: number
          type: string
          unit_price_snapshot?: number | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          month?: number
          name?: string
          product_id?: string | null
          service_id?: string | null
          target_quantity?: number | null
          target_value?: number
          type?: string
          unit_price_snapshot?: number | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      product_price_history: {
        Row: {
          cost_price: number
          created_at: string
          effective_date: string
          id: string
          note: string | null
          product_id: string
          sale_price: number
          user_id: string
        }
        Insert: {
          cost_price?: number
          created_at?: string
          effective_date: string
          id?: string
          note?: string | null
          product_id: string
          sale_price: number
          user_id: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          effective_date?: string
          id?: string
          note?: string | null
          product_id?: string
          sale_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cost_price: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          product_type: string
          registration_date: string
          sale_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          product_type?: string
          registration_date?: string
          sale_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          product_type?: string
          registration_date?: string
          sale_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      report_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content: string | null
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          project_id: string | null
          report_type: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          project_id?: string | null
          report_type?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          project_id?: string | null
          report_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      script_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          content: string | null
          created_at: string
          folder_id: string | null
          id: string
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "script_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      service_price_history: {
        Row: {
          created_at: string
          currency: string
          effective_date: string
          id: string
          note: string | null
          price: number
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          effective_date: string
          id?: string
          note?: string | null
          price: number
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          effective_date?: string
          id?: string
          note?: string | null
          price?: number
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_price_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_plan_overrides: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_user_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_user_view: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          last_sign_in_at: string | null
          override_expires: string | null
          override_plan: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_get_site_name: {
        Args: never
        Returns: string
      }
      admin_get_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string | null
          override_expires: string | null
          override_plan: string | null
        }[]
      }
      admin_set_user_plan: {
        Args: {
          p_expires_at: string | null
          p_plan_type: string | null
          p_user_id: string
        }
        Returns: undefined
      }
      admin_update_site_name: {
        Args: {
          p_site_name: string
        }
        Returns: undefined
      }
      is_admin: {
        Args: never
        Returns: boolean
      }
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
