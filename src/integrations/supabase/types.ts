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
      admin_asset_packs: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
      agent_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          plan: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          plan?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          plan?: Json | null
          role?: string
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
      agent_user_memory: {
        Row: {
          memory: string
          updated_at: string
          user_id: string
        }
        Insert: {
          memory?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          memory?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_balance_alerts: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string | null
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
      app_settings: {
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
      aurora_templates: {
        Row: {
          aura_cost: number
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          payload: Json | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          aura_cost?: number
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          payload?: Json | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          aura_cost?: number
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          payload?: Json | null
          slug?: string
          title?: string
          updated_at?: string
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
      cli_device_codes: {
        Row: {
          api_key_plain: string | null
          created_at: string
          device_code: string
          expires_at: string
          id: string
          status: string
          user_code: string
          user_id: string | null
        }
        Insert: {
          api_key_plain?: string | null
          created_at?: string
          device_code: string
          expires_at?: string
          id?: string
          status?: string
          user_code: string
          user_id?: string | null
        }
        Update: {
          api_key_plain?: string | null
          created_at?: string
          device_code?: string
          expires_at?: string
          id?: string
          status?: string
          user_code?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cm_batch_items: {
        Row: {
          batch_id: string
          created_at: string
          credits_reserved: number
          generation_id: string | null
          id: string
          job_id: string | null
          seq: number
          template_id: string | null
          template_name: string | null
          user_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          credits_reserved?: number
          generation_id?: string | null
          id?: string
          job_id?: string | null
          seq?: number
          template_id?: string | null
          template_name?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          credits_reserved?: number
          generation_id?: string | null
          id?: string
          job_id?: string | null
          seq?: number
          template_id?: string | null
          template_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cm_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "cm_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cm_batch_items_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cm_batch_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cm_batch_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "cm_templates"
            referencedColumns: ["id"]
          },
        ]
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
      comfy_workflows: {
        Row: {
          created_at: string
          created_by_admin: boolean
          declared_inputs: Json
          default_inputs: Json
          description: string | null
          id: string
          is_public: boolean
          kind: string
          name: string
          owner_user_id: string | null
          updated_at: string
          workflow_json: Json
        }
        Insert: {
          created_at?: string
          created_by_admin?: boolean
          declared_inputs?: Json
          default_inputs?: Json
          description?: string | null
          id?: string
          is_public?: boolean
          kind?: string
          name: string
          owner_user_id?: string | null
          updated_at?: string
          workflow_json?: Json
        }
        Update: {
          created_at?: string
          created_by_admin?: boolean
          declared_inputs?: Json
          default_inputs?: Json
          description?: string | null
          id?: string
          is_public?: boolean
          kind?: string
          name?: string
          owner_user_id?: string | null
          updated_at?: string
          workflow_json?: Json
        }
        Relationships: []
      }
      consent_logs: {
        Row: {
          consented_at: string
          id: string
          policy_version: string
          tool: string
          user_id: string
        }
        Insert: {
          consented_at?: string
          id?: string
          policy_version: string
          tool: string
          user_id: string
        }
        Update: {
          consented_at?: string
          id?: string
          policy_version?: string
          tool?: string
          user_id?: string
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
      email_log: {
        Row: {
          error: string | null
          id: string
          sent_at: string
          status: string
          template: string
          to_email: string
          user_id: string | null
        }
        Insert: {
          error?: string | null
          id?: string
          sent_at?: string
          status?: string
          template: string
          to_email: string
          user_id?: string | null
        }
        Update: {
          error?: string | null
          id?: string
          sent_at?: string
          status?: string
          template?: string
          to_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          id: string
          name: string
          path: string | null
          payload: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          path?: string | null
          payload?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          path?: string | null
          payload?: Json | null
          session_id?: string | null
          user_id?: string | null
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
      gpu_workers: {
        Row: {
          auth_token: string | null
          capabilities: string[]
          created_at: string
          endpoint_url: string
          id: string
          in_flight: number
          last_heartbeat: string | null
          max_concurrency: number
          models: string[]
          name: string
          priority: number
          region: string | null
          status: string
        }
        Insert: {
          auth_token?: string | null
          capabilities?: string[]
          created_at?: string
          endpoint_url: string
          id?: string
          in_flight?: number
          last_heartbeat?: string | null
          max_concurrency?: number
          models?: string[]
          name: string
          priority?: number
          region?: string | null
          status?: string
        }
        Update: {
          auth_token?: string | null
          capabilities?: string[]
          created_at?: string
          endpoint_url?: string
          id?: string
          in_flight?: number
          last_heartbeat?: string | null
          max_concurrency?: number
          models?: string[]
          name?: string
          priority?: number
          region?: string | null
          status?: string
        }
        Relationships: []
      }
      growth_tool_runs: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          result: Json | null
          tool: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json | null
          result?: Json | null
          tool: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          result?: Json | null
          tool?: string
          user_id?: string
        }
        Relationships: []
      }
      guided_workflows: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          name: string
          steps: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          name: string
          steps: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          name?: string
          steps?: Json
          updated_at?: string
          user_id?: string
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
      kids_stories: {
        Row: {
          brief: Json
          created_at: string
          error: string | null
          final_video_url: string | null
          generation_id: string | null
          id: string
          job_id: string | null
          poster_url: string | null
          scenes: Json
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brief?: Json
          created_at?: string
          error?: string | null
          final_video_url?: string | null
          generation_id?: string | null
          id?: string
          job_id?: string | null
          poster_url?: string | null
          scenes?: Json
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brief?: Json
          created_at?: string
          error?: string | null
          final_video_url?: string | null
          generation_id?: string | null
          id?: string
          job_id?: string | null
          poster_url?: string | null
          scenes?: Json
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_stories_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_stories_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
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
      legal_acceptances: {
        Row: {
          accepted_at: string
          document: string
          id: string
          ip: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          document: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          document?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      lipsync_jobs: {
        Row: {
          audio_url: string
          created_at: string
          engine: string
          error: string | null
          id: string
          result_url: string | null
          status: string
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          engine?: string
          error?: string | null
          id?: string
          result_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          engine?: string
          error?: string | null
          id?: string
          result_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      marketplace_template_runs: {
        Row: {
          aura_charged: number
          created_at: string
          creator_cut_aura: number
          creator_user_id: string
          id: string
          platform_cut_aura: number
          runner_user_id: string
          template_id: string
        }
        Insert: {
          aura_charged: number
          created_at?: string
          creator_cut_aura: number
          creator_user_id: string
          id?: string
          platform_cut_aura: number
          runner_user_id: string
          template_id: string
        }
        Update: {
          aura_charged?: number
          created_at?: string
          creator_cut_aura?: number
          creator_user_id?: string
          id?: string
          platform_cut_aura?: number
          runner_user_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_template_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketplace_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_templates: {
        Row: {
          cover_url: string | null
          created_at: string
          creator_user_id: string
          description: string | null
          id: string
          payload: Json | null
          price_aura: number
          runs_count: number
          status: string
          title: string
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          creator_user_id: string
          description?: string | null
          id?: string
          payload?: Json | null
          price_aura?: number
          runs_count?: number
          status?: string
          title: string
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          creator_user_id?: string
          description?: string | null
          id?: string
          payload?: Json | null
          price_aura?: number
          runs_count?: number
          status?: string
          title?: string
          updated_at?: string
          workflow_id?: string | null
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
      promo_code_redemptions: {
        Row: {
          aura_granted: number
          code_id: string | null
          code_text: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          aura_granted?: number
          code_id?: string | null
          code_text?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          aura_granted?: number
          code_id?: string | null
          code_text?: string | null
          created_at?: string
          id?: string
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
      provider_logs: {
        Row: {
          cost_usd: number | null
          created_at: string
          endpoint: string
          error: string | null
          id: string
          kind: string
          latency_ms: number | null
          provider: string
          ref_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          endpoint: string
          error?: string | null
          id?: string
          kind: string
          latency_ms?: number | null
          provider: string
          ref_id?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          endpoint?: string
          error?: string | null
          id?: string
          kind?: string
          latency_ms?: number | null
          provider?: string
          ref_id?: string | null
          status?: string
          user_id?: string | null
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
      site_images: {
        Row: {
          alt: string | null
          id: string
          slug: string
          updated_at: string
          url: string
        }
        Insert: {
          alt?: string | null
          id?: string
          slug: string
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string | null
          id?: string
          slug?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      smoke_checks: {
        Row: {
          cost_usd: number | null
          created_at: string
          error: string | null
          id: string
          latency_ms: number | null
          name: string
          output_url: string | null
          raw: Json | null
          run_id: string
          status: string
          step: number
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          name: string
          output_url?: string | null
          raw?: Json | null
          run_id: string
          status?: string
          step: number
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          name?: string
          output_url?: string | null
          raw?: Json | null
          run_id?: string
          status?: string
          step?: number
        }
        Relationships: [
          {
            foreignKeyName: "smoke_checks_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "smoke_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      smoke_runs: {
        Row: {
          finished_at: string | null
          id: string
          started_at: string
          summary: Json | null
          total_cost_usd: number | null
          triggered_by: string
        }
        Insert: {
          finished_at?: string | null
          id?: string
          started_at?: string
          summary?: Json | null
          total_cost_usd?: number | null
          triggered_by: string
        }
        Update: {
          finished_at?: string | null
          id?: string
          started_at?: string
          summary?: Json | null
          total_cost_usd?: number | null
          triggered_by?: string
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
      spin_variants: {
        Row: {
          created_at: string
          error: string | null
          id: string
          idx: number
          job_id: string
          label: string
          status: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          idx: number
          job_id: string
          label: string
          status?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          idx?: number
          job_id?: string
          label?: string
          status?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spin_variants_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "spin_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      studio: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string | null
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
      tiktok_accounts: {
        Row: {
          access_token: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          oauth_state: string | null
          oauth_state_at: string | null
          open_id: string
          refresh_expires_at: string
          refresh_token: string
          scope: string | null
          token_expires_at: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          access_token: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          oauth_state?: string | null
          oauth_state_at?: string | null
          open_id: string
          refresh_expires_at: string
          refresh_token: string
          scope?: string | null
          token_expires_at: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          access_token?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          oauth_state?: string | null
          oauth_state_at?: string | null
          open_id?: string
          refresh_expires_at?: string
          refresh_token?: string
          scope?: string | null
          token_expires_at?: string
          updated_at?: string
          user_id?: string
          username?: string | null
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
      tiktok_posts: {
        Row: {
          created_at: string
          error_msg: string | null
          generation_id: string | null
          id: string
          posted_at: string | null
          publish_id: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          error_msg?: string | null
          generation_id?: string | null
          id?: string
          posted_at?: string | null
          publish_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          error_msg?: string | null
          generation_id?: string | null
          id?: string
          posted_at?: string | null
          publish_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      tiktok_remixes: {
        Row: {
          child_generation_ids: Json
          child_job_ids: Json
          created_at: string
          error: string | null
          highlights: Json
          id: string
          prompt: string | null
          source_generation_id: string | null
          source_video_url: string
          status: string
          target_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          child_generation_ids?: Json
          child_job_ids?: Json
          created_at?: string
          error?: string | null
          highlights?: Json
          id?: string
          prompt?: string | null
          source_generation_id?: string | null
          source_video_url: string
          status?: string
          target_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          child_generation_ids?: Json
          child_job_ids?: Json
          created_at?: string
          error?: string | null
          highlights?: Json
          id?: string
          prompt?: string | null
          source_generation_id?: string | null
          source_video_url?: string
          status?: string
          target_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_assets: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_photo_avatars: {
        Row: {
          created_at: string
          face_meta: Json | null
          id: string
          name: string | null
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          face_meta?: Json | null
          id?: string
          name?: string | null
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          face_meta?: Json | null
          id?: string
          name?: string | null
          photo_url?: string
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
      worker_jobs: {
        Row: {
          cost_usd: number | null
          created_at: string
          error: string | null
          id: string
          kind: string
          latency_ms: number | null
          ref_id: string | null
          status: string
          user_id: string | null
          worker_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          latency_ms?: number | null
          ref_id?: string | null
          status?: string
          user_id?: string | null
          worker_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          latency_ms?: number | null
          ref_id?: string | null
          status?: string
          user_id?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_jobs_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "gpu_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_register_attempts: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          ok: boolean
          reason: string | null
          user_agent: string | null
          worker_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string | null
          ok?: boolean
          reason?: string | null
          user_agent?: string | null
          worker_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          ok?: boolean
          reason?: string | null
          user_agent?: string | null
          worker_name?: string | null
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
