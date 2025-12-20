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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_agent_configs: {
        Row: {
          agent_type: string
          company_id: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_type: string
          company_id: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_type?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_context: {
        Row: {
          active_agent: string | null
          appointment_id: string | null
          company_id: string
          context_data: Json | null
          conversation_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          handoff_history: Json | null
          id: string
          updated_at: string | null
        }
        Insert: {
          active_agent?: string | null
          appointment_id?: string | null
          company_id: string
          context_data?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          handoff_history?: Json | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          active_agent?: string | null
          appointment_id?: string | null
          company_id?: string
          context_data?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          handoff_history?: Json | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_context_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_context_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_events: {
        Row: {
          company_id: string
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          source_agent: string
          status: string | null
          target_agent: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          source_agent: string
          status?: string | null
          target_agent?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          source_agent?: string
          status?: string | null
          target_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_logs: {
        Row: {
          action: string
          agent_type: string
          company_id: string
          context_id: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          success: boolean | null
        }
        Insert: {
          action: string
          agent_type: string
          company_id: string
          context_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          success?: boolean | null
        }
        Update: {
          action?: string
          agent_type?: string
          company_id?: string
          context_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_logs_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_context"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          call_opt_out: boolean
          company_id: string
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          customer_token: string | null
          datetime: string
          duration_minutes: number
          email_opt_out: boolean
          employee_id: string | null
          id: string
          notes: string | null
          reminder_1h_sent: boolean | null
          reminder_1h_sent_at: string | null
          reminder_24h_sent: boolean | null
          reminder_24h_sent_at: string | null
          service_type: string
          sms_opt_out: boolean
          status: string
          updated_at: string
        }
        Insert: {
          call_opt_out?: boolean
          company_id: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_token?: string | null
          datetime: string
          duration_minutes?: number
          email_opt_out?: boolean
          employee_id?: string | null
          id?: string
          notes?: string | null
          reminder_1h_sent?: boolean | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent?: boolean | null
          reminder_24h_sent_at?: string | null
          service_type: string
          sms_opt_out?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          call_opt_out?: boolean
          company_id?: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_token?: string | null
          datetime?: string
          duration_minutes?: number
          email_opt_out?: boolean
          employee_id?: string | null
          id?: string
          notes?: string | null
          reminder_1h_sent?: boolean | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent?: boolean | null
          reminder_24h_sent_at?: string | null
          service_type?: string
          sms_opt_out?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          close_time: string | null
          company_id: string
          created_at: string
          day_of_week: number
          hour_type: string
          id: string
          is_closed: boolean
          open_time: string | null
          updated_at: string
        }
        Insert: {
          close_time?: string | null
          company_id: string
          created_at?: string
          day_of_week: number
          hour_type?: string
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          close_time?: string | null
          company_id?: string
          created_at?: string
          day_of_week?: number
          hour_type?: string
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_mappings: {
        Row: {
          appointment_id: string
          company_id: string
          created_at: string | null
          google_event_id: string
          id: string
          last_synced_at: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          company_id: string
          created_at?: string | null
          google_event_id: string
          id?: string
          last_synced_at?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          company_id?: string
          created_at?: string | null
          google_event_id?: string
          id?: string
          last_synced_at?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_mappings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          answered_at: string | null
          appointment_id: string | null
          call_sid: string | null
          company_id: string
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          direction: string
          duration_seconds: number | null
          employee_id: string | null
          ended_at: string | null
          from_number: string | null
          id: string
          metadata: Json | null
          purpose: string | null
          recording_duration_seconds: number | null
          recording_url: string | null
          started_at: string
          status: string
          summary: string | null
          to_number: string | null
          transcript: Json | null
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          appointment_id?: string | null
          call_sid?: string | null
          company_id: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          direction: string
          duration_seconds?: number | null
          employee_id?: string | null
          ended_at?: string | null
          from_number?: string | null
          id?: string
          metadata?: Json | null
          purpose?: string | null
          recording_duration_seconds?: number | null
          recording_url?: string | null
          started_at?: string
          status?: string
          summary?: string | null
          to_number?: string | null
          transcript?: Json | null
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          appointment_id?: string | null
          call_sid?: string | null
          company_id?: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          direction?: string
          duration_seconds?: number | null
          employee_id?: string | null
          ended_at?: string | null
          from_number?: string | null
          id?: string
          metadata?: Json | null
          purpose?: string | null
          recording_duration_seconds?: number | null
          recording_url?: string | null
          started_at?: string
          status?: string
          summary?: string | null
          to_number?: string | null
          transcript?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          channel: string
          clicked_at: string | null
          company_id: string
          converted_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          channel: string
          clicked_at?: string | null
          company_id: string
          converted_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          channel?: string
          clicked_at?: string | null
          company_id?: string
          converted_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ai_agent_prompt: string | null
          ai_voice_greeting: string | null
          bounce_alert_email: string | null
          bounce_alert_enabled: boolean | null
          bounce_alert_threshold: number | null
          cost_alert_email: string | null
          cost_alert_enabled: boolean | null
          cost_alert_threshold: number | null
          created_at: string
          default_call_enabled: boolean
          default_email_enabled: boolean
          default_sms_enabled: boolean
          dispatch_phone: string | null
          id: string
          last_bounce_alert_at: string | null
          last_cost_alert_at: string | null
          last_monthly_digest_at: string | null
          last_quarterly_digest_at: string | null
          last_unsubscribe_alert_at: string | null
          last_weekly_digest_at: string | null
          logo_url: string | null
          monthly_digest_day: number | null
          monthly_digest_email: string | null
          monthly_digest_enabled: boolean | null
          monthly_digest_include_appointments: boolean | null
          monthly_digest_include_reminders: boolean | null
          monthly_digest_include_subscriptions: boolean | null
          monthly_digest_time: string | null
          monthly_digest_timezone: string | null
          name: string
          primary_color: string | null
          quarterly_digest_day: number | null
          quarterly_digest_email: string | null
          quarterly_digest_enabled: boolean | null
          quarterly_digest_include_appointments: boolean | null
          quarterly_digest_include_reminders: boolean | null
          quarterly_digest_include_subscriptions: boolean | null
          quarterly_digest_month: number | null
          quarterly_digest_time: string | null
          quarterly_digest_timezone: string | null
          review_email_subject: string | null
          review_email_template: string | null
          review_facebook_url: string | null
          review_google_url: string | null
          review_request_delay_hours: number | null
          review_request_enabled: boolean | null
          review_sms_template: string | null
          review_yelp_url: string | null
          secondary_color: string | null
          slug: string
          stripe_customer_id: string | null
          trial_ends_at: string | null
          trial_expired_sent: boolean | null
          trial_reminder_1d_sent: boolean | null
          trial_reminder_3d_sent: boolean | null
          trial_reminder_7d_sent: boolean | null
          unsubscribe_alert_email: string | null
          unsubscribe_alert_enabled: boolean | null
          unsubscribe_alert_threshold: number | null
          updated_at: string
          weekly_digest_day: number | null
          weekly_digest_email: string | null
          weekly_digest_enabled: boolean | null
          weekly_digest_include_appointments: boolean | null
          weekly_digest_include_reminders: boolean | null
          weekly_digest_include_subscriptions: boolean | null
          weekly_digest_time: string | null
          weekly_digest_timezone: string | null
        }
        Insert: {
          ai_agent_prompt?: string | null
          ai_voice_greeting?: string | null
          bounce_alert_email?: string | null
          bounce_alert_enabled?: boolean | null
          bounce_alert_threshold?: number | null
          cost_alert_email?: string | null
          cost_alert_enabled?: boolean | null
          cost_alert_threshold?: number | null
          created_at?: string
          default_call_enabled?: boolean
          default_email_enabled?: boolean
          default_sms_enabled?: boolean
          dispatch_phone?: string | null
          id?: string
          last_bounce_alert_at?: string | null
          last_cost_alert_at?: string | null
          last_monthly_digest_at?: string | null
          last_quarterly_digest_at?: string | null
          last_unsubscribe_alert_at?: string | null
          last_weekly_digest_at?: string | null
          logo_url?: string | null
          monthly_digest_day?: number | null
          monthly_digest_email?: string | null
          monthly_digest_enabled?: boolean | null
          monthly_digest_include_appointments?: boolean | null
          monthly_digest_include_reminders?: boolean | null
          monthly_digest_include_subscriptions?: boolean | null
          monthly_digest_time?: string | null
          monthly_digest_timezone?: string | null
          name: string
          primary_color?: string | null
          quarterly_digest_day?: number | null
          quarterly_digest_email?: string | null
          quarterly_digest_enabled?: boolean | null
          quarterly_digest_include_appointments?: boolean | null
          quarterly_digest_include_reminders?: boolean | null
          quarterly_digest_include_subscriptions?: boolean | null
          quarterly_digest_month?: number | null
          quarterly_digest_time?: string | null
          quarterly_digest_timezone?: string | null
          review_email_subject?: string | null
          review_email_template?: string | null
          review_facebook_url?: string | null
          review_google_url?: string | null
          review_request_delay_hours?: number | null
          review_request_enabled?: boolean | null
          review_sms_template?: string | null
          review_yelp_url?: string | null
          secondary_color?: string | null
          slug: string
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
          trial_expired_sent?: boolean | null
          trial_reminder_1d_sent?: boolean | null
          trial_reminder_3d_sent?: boolean | null
          trial_reminder_7d_sent?: boolean | null
          unsubscribe_alert_email?: string | null
          unsubscribe_alert_enabled?: boolean | null
          unsubscribe_alert_threshold?: number | null
          updated_at?: string
          weekly_digest_day?: number | null
          weekly_digest_email?: string | null
          weekly_digest_enabled?: boolean | null
          weekly_digest_include_appointments?: boolean | null
          weekly_digest_include_reminders?: boolean | null
          weekly_digest_include_subscriptions?: boolean | null
          weekly_digest_time?: string | null
          weekly_digest_timezone?: string | null
        }
        Update: {
          ai_agent_prompt?: string | null
          ai_voice_greeting?: string | null
          bounce_alert_email?: string | null
          bounce_alert_enabled?: boolean | null
          bounce_alert_threshold?: number | null
          cost_alert_email?: string | null
          cost_alert_enabled?: boolean | null
          cost_alert_threshold?: number | null
          created_at?: string
          default_call_enabled?: boolean
          default_email_enabled?: boolean
          default_sms_enabled?: boolean
          dispatch_phone?: string | null
          id?: string
          last_bounce_alert_at?: string | null
          last_cost_alert_at?: string | null
          last_monthly_digest_at?: string | null
          last_quarterly_digest_at?: string | null
          last_unsubscribe_alert_at?: string | null
          last_weekly_digest_at?: string | null
          logo_url?: string | null
          monthly_digest_day?: number | null
          monthly_digest_email?: string | null
          monthly_digest_enabled?: boolean | null
          monthly_digest_include_appointments?: boolean | null
          monthly_digest_include_reminders?: boolean | null
          monthly_digest_include_subscriptions?: boolean | null
          monthly_digest_time?: string | null
          monthly_digest_timezone?: string | null
          name?: string
          primary_color?: string | null
          quarterly_digest_day?: number | null
          quarterly_digest_email?: string | null
          quarterly_digest_enabled?: boolean | null
          quarterly_digest_include_appointments?: boolean | null
          quarterly_digest_include_reminders?: boolean | null
          quarterly_digest_include_subscriptions?: boolean | null
          quarterly_digest_month?: number | null
          quarterly_digest_time?: string | null
          quarterly_digest_timezone?: string | null
          review_email_subject?: string | null
          review_email_template?: string | null
          review_facebook_url?: string | null
          review_google_url?: string | null
          review_request_delay_hours?: number | null
          review_request_enabled?: boolean | null
          review_sms_template?: string | null
          review_yelp_url?: string | null
          secondary_color?: string | null
          slug?: string
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
          trial_expired_sent?: boolean | null
          trial_reminder_1d_sent?: boolean | null
          trial_reminder_3d_sent?: boolean | null
          trial_reminder_7d_sent?: boolean | null
          unsubscribe_alert_email?: string | null
          unsubscribe_alert_enabled?: boolean | null
          unsubscribe_alert_threshold?: number | null
          updated_at?: string
          weekly_digest_day?: number | null
          weekly_digest_email?: string | null
          weekly_digest_enabled?: boolean | null
          weekly_digest_include_appointments?: boolean | null
          weekly_digest_include_reminders?: boolean | null
          weekly_digest_include_subscriptions?: boolean | null
          weekly_digest_time?: string | null
          weekly_digest_timezone?: string | null
        }
        Relationships: []
      }
      cost_estimates: {
        Row: {
          appointments_count: number
          avg_transaction_value: number
          channels_email: boolean
          channels_sms: boolean
          channels_voice: boolean
          company_id: string
          created_at: string
          estimated_email_cost: number
          estimated_sms_cost: number
          estimated_stripe_cost: number
          estimated_total_cost: number
          estimated_voice_cost: number
          id: string
          month_year: string
          name: string
          reminders_per_appointment: number
          updated_at: string
        }
        Insert: {
          appointments_count: number
          avg_transaction_value?: number
          channels_email?: boolean
          channels_sms?: boolean
          channels_voice?: boolean
          company_id: string
          created_at?: string
          estimated_email_cost?: number
          estimated_sms_cost?: number
          estimated_stripe_cost?: number
          estimated_total_cost?: number
          estimated_voice_cost?: number
          id?: string
          month_year: string
          name?: string
          reminders_per_appointment?: number
          updated_at?: string
        }
        Update: {
          appointments_count?: number
          avg_transaction_value?: number
          channels_email?: boolean
          channels_sms?: boolean
          channels_voice?: boolean
          company_id?: string
          created_at?: string
          estimated_email_cost?: number
          estimated_sms_cost?: number
          estimated_stripe_cost?: number
          estimated_total_cost?: number
          estimated_voice_cost?: number
          id?: string
          month_year?: string
          name?: string
          reminders_per_appointment?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_estimates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_feedback: {
        Row: {
          appointment_id: string | null
          company_id: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          employee_id: string | null
          feedback_note: string | null
          id: string
          rating: number | null
          review_link_clicked: string | null
          sentiment: string | null
          service_type: string | null
          source: string | null
        }
        Insert: {
          appointment_id?: string | null
          company_id: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          employee_id?: string | null
          feedback_note?: string | null
          id?: string
          rating?: number | null
          review_link_clicked?: string | null
          sentiment?: string | null
          service_type?: string | null
          source?: string | null
        }
        Update: {
          appointment_id?: string | null
          company_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          employee_id?: string | null
          feedback_note?: string | null
          id?: string
          rating?: number | null
          review_link_clicked?: string | null
          sentiment?: string | null
          service_type?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_feedback_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          address: string | null
          call_opt_out: boolean | null
          company_id: string
          created_at: string | null
          email: string
          email_opt_out: boolean | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          portal_token: string | null
          sms_opt_out: boolean | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          call_opt_out?: boolean | null
          company_id: string
          created_at?: string | null
          email: string
          email_opt_out?: boolean | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          portal_token?: string | null
          sms_opt_out?: boolean | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          call_opt_out?: boolean | null
          company_id?: string
          created_at?: string | null
          email?: string
          email_opt_out?: boolean | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          portal_token?: string | null
          sms_opt_out?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_referrals: {
        Row: {
          appointment_id: string | null
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          referral_code: string
          referred_email: string | null
          referred_name: string | null
          referred_phone: string | null
          referrer_email: string | null
          referrer_name: string
          referrer_phone: string | null
          reward_issued_at: string | null
          reward_type: string | null
          reward_value: number | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_code: string
          referred_email?: string | null
          referred_name?: string | null
          referred_phone?: string | null
          referrer_email?: string | null
          referrer_name: string
          referrer_phone?: string | null
          reward_issued_at?: string | null
          reward_type?: string | null
          reward_value?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_code?: string
          referred_email?: string | null
          referred_name?: string | null
          referred_phone?: string | null
          referrer_email?: string | null
          referrer_name?: string
          referrer_phone?: string | null
          reward_issued_at?: string | null
          reward_type?: string | null
          reward_value?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_referrals_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      digest_delivery_logs: {
        Row: {
          company_id: string
          created_at: string
          digest_type: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          digest_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          digest_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "digest_delivery_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          company_id: string
          created_at: string
          heading: string
          id: string
          message: string
          show_portal_link: boolean | null
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          heading: string
          id?: string
          message: string
          show_portal_link?: boolean | null
          subject: string
          template_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          heading?: string
          id?: string
          message?: string
          show_portal_link?: boolean | null
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_availability: {
        Row: {
          close_time: string | null
          company_id: string
          created_at: string
          day_of_week: number
          employee_id: string
          hour_type: string
          id: string
          is_closed: boolean
          open_time: string | null
          updated_at: string
        }
        Insert: {
          close_time?: string | null
          company_id: string
          created_at?: string
          day_of_week: number
          employee_id: string
          hour_type?: string
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          close_time?: string | null
          company_id?: string
          created_at?: string
          day_of_week?: number
          employee_id?: string
          hour_type?: string
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_availability_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_job_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          company_id: string
          employee_id: string
          id: string
          job_type: Database["public"]["Enums"]["employee_job_type"]
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          company_id: string
          employee_id: string
          id?: string
          job_type: Database["public"]["Enums"]["employee_job_type"]
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          company_id?: string
          employee_id?: string
          id?: string
          job_type?: Database["public"]["Enums"]["employee_job_type"]
        }
        Relationships: [
          {
            foreignKeyName: "employee_job_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_job_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_job_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_registration_codes: {
        Row: {
          code: string
          company_id: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          used: boolean | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          used?: boolean | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_registration_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_time_off: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          id: string
          name: string | null
          time_off_date: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          name?: string | null
          time_off_date: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          name?: string | null
          time_off_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_time_off_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_time_off_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faqs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_closures: {
        Row: {
          closure_date: string
          company_id: string
          created_at: string
          id: string
          name: string | null
        }
        Insert: {
          closure_date: string
          company_id: string
          created_at?: string
          id?: string
          name?: string | null
        }
        Update: {
          closure_date?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holiday_closures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_quantity: number
          name: string
          quantity: number
          sku: string | null
          supplier: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_quantity?: number
          name: string
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_quantity?: number
          name?: string
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          appointment_id: string | null
          company_id: string
          created_at: string
          employee_id: string | null
          id: string
          item_id: string
          notes: string | null
          quantity: number
          transaction_type: string
        }
        Insert: {
          appointment_id?: string | null
          company_id: string
          created_at?: string
          employee_id?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          transaction_type: string
        }
        Update: {
          appointment_id?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          service_id: string | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          service_id?: string | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          service_id?: string | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          company_id: string
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          quote_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          company_id: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          quote_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          company_id?: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          quote_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assignments: {
        Row: {
          accepted_at: string | null
          actual_arrival_minutes: number | null
          after_photos: string[] | null
          appointment_id: string
          arrived_at: string | null
          assigned_at: string | null
          before_photos: string[] | null
          company_id: string
          completed_at: string | null
          created_at: string | null
          customer_address: string | null
          customer_lat: number | null
          customer_lng: number | null
          customer_notified_arrived: boolean | null
          customer_notified_assigned: boolean | null
          customer_notified_completed: boolean | null
          customer_notified_en_route: boolean | null
          decline_reason: string | null
          declined_at: string | null
          employee_id: string | null
          en_route_at: string | null
          estimated_arrival_minutes: number | null
          id: string
          notes: string | null
          parts_used: string | null
          started_at: string | null
          status: string
          technician_lat: number | null
          technician_lng: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          actual_arrival_minutes?: number | null
          after_photos?: string[] | null
          appointment_id: string
          arrived_at?: string | null
          assigned_at?: string | null
          before_photos?: string[] | null
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_lat?: number | null
          customer_lng?: number | null
          customer_notified_arrived?: boolean | null
          customer_notified_assigned?: boolean | null
          customer_notified_completed?: boolean | null
          customer_notified_en_route?: boolean | null
          decline_reason?: string | null
          declined_at?: string | null
          employee_id?: string | null
          en_route_at?: string | null
          estimated_arrival_minutes?: number | null
          id?: string
          notes?: string | null
          parts_used?: string | null
          started_at?: string | null
          status?: string
          technician_lat?: number | null
          technician_lng?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          actual_arrival_minutes?: number | null
          after_photos?: string[] | null
          appointment_id?: string
          arrived_at?: string | null
          assigned_at?: string | null
          before_photos?: string[] | null
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_lat?: number | null
          customer_lng?: number | null
          customer_notified_arrived?: boolean | null
          customer_notified_assigned?: boolean | null
          customer_notified_completed?: boolean | null
          customer_notified_en_route?: boolean | null
          decline_reason?: string | null
          declined_at?: string | null
          employee_id?: string | null
          en_route_at?: string | null
          estimated_arrival_minutes?: number | null
          id?: string
          notes?: string | null
          parts_used?: string | null
          started_at?: string | null
          status?: string
          technician_lat?: number | null
          technician_lng?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_assignments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          company_id: string
          content_text: string | null
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content_text?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content_text?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          campaign_type: string
          channels: string[] | null
          company_id: string
          created_at: string
          discount_type: string | null
          discount_value: number | null
          email_subject: string | null
          end_date: string | null
          id: string
          message_template: string | null
          name: string
          promo_code: string | null
          start_date: string | null
          status: string
          target_segment: string | null
          total_clicked: number | null
          total_converted: number | null
          total_opened: number | null
          total_sent: number | null
          updated_at: string
        }
        Insert: {
          campaign_type: string
          channels?: string[] | null
          company_id: string
          created_at?: string
          discount_type?: string | null
          discount_value?: number | null
          email_subject?: string | null
          end_date?: string | null
          id?: string
          message_template?: string | null
          name: string
          promo_code?: string | null
          start_date?: string | null
          status?: string
          target_segment?: string | null
          total_clicked?: number | null
          total_converted?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string
        }
        Update: {
          campaign_type?: string
          channels?: string[] | null
          company_id?: string
          created_at?: string
          discount_type?: string | null
          discount_value?: number | null
          email_subject?: string | null
          end_date?: string | null
          id?: string
          message_template?: string | null
          name?: string
          promo_code?: string | null
          start_date?: string | null
          status?: string
          target_segment?: string | null
          total_clicked?: number | null
          total_converted?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability_json: Json | null
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          email_notifications_enabled: boolean | null
          full_name: string | null
          id: string
          phone_number: string | null
          sms_notifications_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          availability_json?: Json | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          availability_json?: Json | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          quote_id: string
          service_id: string | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          quote_id: string
          service_id?: string | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          service_id?: string | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          appointment_id: string | null
          company_id: string
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          appointment_id?: string | null
          company_id: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          appointment_id?: string | null
          company_id?: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_logs: {
        Row: {
          appointment_id: string
          channel: string
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          message_preview: string | null
          recipient: string | null
          reminder_type: string
          status: string
        }
        Insert: {
          appointment_id: string
          channel: string
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_preview?: string | null
          recipient?: string | null
          reminder_type: string
          status?: string
        }
        Update: {
          appointment_id?: string
          channel?: string
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_preview?: string | null
          recipient?: string | null
          reminder_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_settings: {
        Row: {
          call_enabled: boolean
          call_template: string | null
          company_id: string
          created_at: string
          hours_before: number
          id: string
          is_enabled: boolean
          reminder_type: string
          sms_template: string
          updated_at: string
        }
        Insert: {
          call_enabled?: boolean
          call_template?: string | null
          company_id: string
          created_at?: string
          hours_before: number
          id?: string
          is_enabled?: boolean
          reminder_type: string
          sms_template?: string
          updated_at?: string
        }
        Update: {
          call_enabled?: boolean
          call_template?: string | null
          company_id?: string
          created_at?: string
          hours_before?: number
          id?: string
          is_enabled?: boolean
          reminder_type?: string
          sms_template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          flat_fee: number | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          name: string
          parts_cost: number | null
          price: number | null
          service_type: string | null
          service_type_other: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          flat_fee?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          name: string
          parts_cost?: number | null
          price?: number | null
          service_type?: string | null
          service_type_other?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          flat_fee?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          name?: string
          parts_cost?: number | null
          price?: number | null
          service_type?: string | null
          service_type_other?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          company_id: string
          created_at: string
          id: string
          message: string
          template_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          message: string
          template_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          message?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          action: string
          appointment_id: string
          channel: string
          company_id: string
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          id: string
          source: string
        }
        Insert: {
          action: string
          appointment_id: string
          channel: string
          company_id: string
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          source?: string
        }
        Update: {
          action?: string
          appointment_id?: string
          channel?: string
          company_id?: string
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          company_id: string
          email: string
          id: string
          reason: string
          source_event_id: string | null
          suppressed_at: string
        }
        Insert: {
          company_id: string
          email: string
          id?: string
          reason: string
          source_event_id?: string | null
          suppressed_at?: string
        }
        Update: {
          company_id?: string
          email?: string
          id?: string
          reason?: string
          source_event_id?: string | null
          suppressed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppressed_emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_integrations: {
        Row: {
          company_id: string
          created_at: string
          elevenlabs_agent_id: string | null
          elevenlabs_api_key: string | null
          elevenlabs_voice_id: string | null
          elevenlabs_voice_similarity: number | null
          elevenlabs_voice_speed: number | null
          elevenlabs_voice_stability: number | null
          elevenlabs_voice_style: number | null
          google_calendar_enabled: boolean | null
          google_calendar_id: string | null
          google_refresh_token: string | null
          google_tts_api_key: string | null
          google_tts_model: string | null
          google_tts_voice: string | null
          id: string
          openai_api_key: string | null
          openai_tts_model: string | null
          openai_tts_voice: string | null
          resend_api_key: string | null
          tts_provider: string | null
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_phone_number: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          elevenlabs_agent_id?: string | null
          elevenlabs_api_key?: string | null
          elevenlabs_voice_id?: string | null
          elevenlabs_voice_similarity?: number | null
          elevenlabs_voice_speed?: number | null
          elevenlabs_voice_stability?: number | null
          elevenlabs_voice_style?: number | null
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_tts_api_key?: string | null
          google_tts_model?: string | null
          google_tts_voice?: string | null
          id?: string
          openai_api_key?: string | null
          openai_tts_model?: string | null
          openai_tts_voice?: string | null
          resend_api_key?: string | null
          tts_provider?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          elevenlabs_agent_id?: string | null
          elevenlabs_api_key?: string | null
          elevenlabs_voice_id?: string | null
          elevenlabs_voice_similarity?: number | null
          elevenlabs_voice_speed?: number | null
          elevenlabs_voice_stability?: number | null
          elevenlabs_voice_style?: number | null
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_tts_api_key?: string | null
          google_tts_model?: string | null
          google_tts_voice?: string | null
          id?: string
          openai_api_key?: string | null
          openai_tts_model?: string | null
          openai_tts_voice?: string | null
          resend_api_key?: string | null
          tts_provider?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      unsubscribe_alerts: {
        Row: {
          company_id: string
          id: string
          period_end: string
          period_start: string
          sent_at: string
          threshold: number
          unsubscribe_count: number
        }
        Insert: {
          company_id: string
          id?: string
          period_end: string
          period_start: string
          sent_at?: string
          threshold: number
          unsubscribe_count: number
        }
        Update: {
          company_id?: string
          id?: string
          period_end?: string
          period_start?: string
          sent_at?: string
          threshold?: number
          unsubscribe_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "unsubscribe_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      warranty_claims: {
        Row: {
          appointment_id: string | null
          claim_type: string | null
          company_id: string
          created_at: string
          id: string
          issue_description: string
          photos: string[] | null
          resolution_notes: string | null
          resolved_at: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string
          updated_at: string
          warranty_id: string
        }
        Insert: {
          appointment_id?: string | null
          claim_type?: string | null
          company_id: string
          created_at?: string
          id?: string
          issue_description: string
          photos?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          warranty_id: string
        }
        Update: {
          appointment_id?: string | null
          claim_type?: string | null
          company_id?: string
          created_at?: string
          id?: string
          issue_description?: string
          photos?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          warranty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claims_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranty_records"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_records: {
        Row: {
          appointment_id: string | null
          company_id: string
          coverage_details: string | null
          coverage_type: string | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          equipment_model: string | null
          equipment_type: string
          id: string
          installation_date: string | null
          is_active: boolean
          purchase_date: string | null
          serial_number: string | null
          updated_at: string
          warranty_end_date: string
          warranty_start_date: string
        }
        Insert: {
          appointment_id?: string | null
          company_id: string
          coverage_details?: string | null
          coverage_type?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          equipment_model?: string | null
          equipment_type: string
          id?: string
          installation_date?: string | null
          is_active?: boolean
          purchase_date?: string | null
          serial_number?: string | null
          updated_at?: string
          warranty_end_date: string
          warranty_start_date: string
        }
        Update: {
          appointment_id?: string | null
          company_id?: string
          coverage_details?: string | null
          coverage_type?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          equipment_model?: string | null
          equipment_type?: string
          id?: string
          installation_date?: string | null
          is_active?: boolean
          purchase_date?: string | null
          serial_number?: string | null
          updated_at?: string
          warranty_end_date?: string
          warranty_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      winback_offers: {
        Row: {
          appointment_id: string | null
          channel: string | null
          company_id: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          days_inactive: number | null
          expires_at: string | null
          id: string
          last_appointment_date: string | null
          message_sent: string | null
          offer_type: string
          offer_value: number | null
          opened_at: string | null
          promo_code: string | null
          redeemed_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          channel?: string | null
          company_id: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          days_inactive?: number | null
          expires_at?: string | null
          id?: string
          last_appointment_date?: string | null
          message_sent?: string | null
          offer_type: string
          offer_value?: number | null
          opened_at?: string | null
          promo_code?: string | null
          redeemed_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          channel?: string | null
          company_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          days_inactive?: number | null
          expires_at?: string | null
          id?: string
          last_appointment_date?: string | null
          message_sent?: string | null
          offer_type?: string
          offer_value?: number | null
          opened_at?: string | null
          promo_code?: string | null
          redeemed_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "winback_offers_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "platform_admin" | "company_admin" | "employee"
      employee_job_type:
        | "technician"
        | "booking_agent"
        | "dispatch"
        | "customer_service"
        | "billing"
        | "marketing"
        | "inventory"
        | "analytics"
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
      app_role: ["platform_admin", "company_admin", "employee"],
      employee_job_type: [
        "technician",
        "booking_agent",
        "dispatch",
        "customer_service",
        "billing",
        "marketing",
        "inventory",
        "analytics",
      ],
    },
  },
} as const
