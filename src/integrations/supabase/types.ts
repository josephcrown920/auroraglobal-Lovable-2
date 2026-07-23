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
      affiliate_events: {
        Row: {
          amount_usd: number | null
          code: string
          created_at: string
          id: string
          kind: string
          ref_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_usd?: number | null
          code: string
          created_at?: string
          id?: string
          kind: string
          ref_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_usd?: number | null
          code?: string
          created_at?: string
          id?: string
          kind?: string
          ref_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          code: string
          commission_pct: number
          created_at: string
          id: string
          payout_email: string | null
          total_earned_usd: number
          user_id: string
        }
        Insert: {
          code: string
          commission_pct?: number
          created_at?: string
          id?: string
          payout_email?: string | null
          total_earned_usd?: number
          user_id: string
        }
        Update: {
          code?: string
          commission_pct?: number
          created_at?: string
          id?: string
          payout_email?: string | null
          total_earned_usd?: number
          user_id?: string
        }
        Relationships: []
      }
      agent_sessions: {
        Row: {
          brief: string
          created_at: string
          id: string
          iterations: Json
          messages: Json
          plan: Json
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brief?: string
          created_at?: string
          id?: string
          iterations?: Json
          messages?: Json
          plan?: Json
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brief?: string
          created_at?: string
          id?: string
          iterations?: Json
          messages?: Json
          plan?: Json
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          label: string | null
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          label?: string | null
          provider: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          label?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      avatars: {
        Row: {
          created_at: string
          id: string
          image_url: string
          metadata: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          metadata?: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          metadata?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cm_batches: {
        Row: {
          completed_items: number
          created_at: string
          credits_reserved: number
          id: string
          product_id: string | null
          status: string
          total_items: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_items?: number
          created_at?: string
          credits_reserved?: number
          id?: string
          product_id?: string | null
          status?: string
          total_items?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_items?: number
          created_at?: string
          credits_reserved?: number
          id?: string
          product_id?: string | null
          status?: string
          total_items?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cm_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "cm_products"
            referencedColumns: ["id"]
          },
        ]
      }
      cm_products: {
        Row: {
          audience: string | null
          brand_voice: string | null
          created_at: string
          cta: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string | null
          brand_voice?: string | null
          created_at?: string
          cta?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string | null
          brand_voice?: string | null
          created_at?: string
          cta?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cm_templates: {
        Row: {
          aspect: string | null
          created_at: string
          duration: number | null
          id: string
          is_public: boolean
          motion_hint: string | null
          name: string
          scene_hint: string | null
          script_formula: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aspect?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          is_public?: boolean
          motion_hint?: string | null
          name: string
          scene_hint?: string | null
          script_formula?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aspect?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          is_public?: boolean
          motion_hint?: string | null
          name?: string
          scene_hint?: string | null
          script_formula?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cm_videos: {
        Row: {
          batch_id: string | null
          created_at: string
          error: string | null
          id: string
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cm_videos_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "cm_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cm_videos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "cm_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      comfy_runs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          input: Json
          output: Json | null
          status: string
          updated_at: string
          user_id: string | null
          workflow: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          output?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
          workflow: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          output?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
          workflow?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          reason: string
          ref_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          audio_url: string | null
          created_at: string
          credits_cost: number
          error: string | null
          id: string
          input_images: Json
          is_favorite: boolean
          is_hidden: boolean
          is_public: boolean
          kind: string
          mode: string
          model: string | null
          motion_video_url: string | null
          prompt: string
          result_image_url: string | null
          result_video_url: string | null
          share_token: string | null
          status: string
          tags: string[]
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          credits_cost?: number
          error?: string | null
          id?: string
          input_images?: Json
          is_favorite?: boolean
          is_hidden?: boolean
          is_public?: boolean
          kind?: string
          mode?: string
          model?: string | null
          motion_video_url?: string | null
          prompt: string
          result_image_url?: string | null
          result_video_url?: string | null
          share_token?: string | null
          status?: string
          tags?: string[]
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          credits_cost?: number
          error?: string | null
          id?: string
          input_images?: Json
          is_favorite?: boolean
          is_hidden?: boolean
          is_public?: boolean
          kind?: string
          mode?: string
          model?: string | null
          motion_video_url?: string | null
          prompt?: string
          result_image_url?: string | null
          result_video_url?: string | null
          share_token?: string | null
          status?: string
          tags?: string[]
          user_id?: string
        }
        Relationships: []
      }
      gift_cards: {
        Row: {
          amount_usd: number
          code: string
          created_at: string
          created_by: string
          credits: number
          design: string
          id: string
          note: string | null
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          amount_usd?: number
          code: string
          created_at?: string
          created_by: string
          credits: number
          design?: string
          id?: string
          note?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          amount_usd?: number
          code?: string
          created_at?: string
          created_by?: string
          credits?: number
          design?: string
          id?: string
          note?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          attempts: number
          created_at: string
          credits_reserved: number
          error: string | null
          finished_at: string | null
          generation_id: string | null
          id: string
          kind: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          parent_job_id: string | null
          payload: Json
          priority: number
          result: Json | null
          scheduled_at: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          credits_reserved?: number
          error?: string | null
          finished_at?: string | null
          generation_id?: string | null
          id?: string
          kind: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          parent_job_id?: string | null
          payload?: Json
          priority?: number
          result?: Json | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          credits_reserved?: number
          error?: string | null
          finished_at?: string | null
          generation_id?: string | null
          id?: string
          kind?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          parent_job_id?: string | null
          payload?: Json
          priority?: number
          result?: Json | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json
          source?: string | null
        }
        Relationships: []
      }
      owner_withdrawals: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          destination: Json | null
          id: string
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          destination?: Json | null
          id?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          destination?: Json | null
          id?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_kobo: number
          created_at: string
          credits_granted: number
          currency: string
          id: string
          provider: string
          raw: Json | null
          reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kobo: number
          created_at?: string
          credits_granted?: number
          currency?: string
          id?: string
          provider?: string
          raw?: Json | null
          reference: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kobo?: number
          created_at?: string
          credits_granted?: number
          currency?: string
          id?: string
          provider?: string
          raw?: Json | null
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          display_name: string | null
          email: string | null
          id: string
          lifetime_credits_purchased: number
          plan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          email?: string | null
          id?: string
          lifetime_credits_purchased?: number
          plan?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          email?: string | null
          id?: string
          lifetime_credits_purchased?: number
          plan?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          credits: number
          max_redemptions: number | null
          redeemed_count: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          credits?: number
          max_redemptions?: number | null
          redeemed_count?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          credits?: number
          max_redemptions?: number | null
          redeemed_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      scheduler_heartbeats: {
        Row: {
          last_error: string | null
          last_ok_at: string | null
          last_run_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          last_error?: string | null
          last_ok_at?: string | null
          last_run_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          last_error?: string | null
          last_ok_at?: string | null
          last_run_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          kind: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          kind?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          key?: string
          kind?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      spin_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          input: Json
          result: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          external_id: string | null
          id: string
          plan: string
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          external_id?: string | null
          id?: string
          plan: string
          provider?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          external_id?: string | null
          id?: string
          plan?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tiktok_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          input: Json
          result: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_webhooks: {
        Row: {
          active: boolean
          created_at: string
          event: string
          id: string
          secret: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event?: string
          id?: string
          secret?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event?: string
          id?: string
          secret?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string
          definition: Json
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          definition?: Json
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          definition?: Json
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      deduct_credits: {
        Args: { _amount: number; _reason: string; _ref: string; _user: string }
        Returns: boolean
      }
      grant_credits: {
        Args: { _amount: number; _reason: string; _ref: string; _user: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
