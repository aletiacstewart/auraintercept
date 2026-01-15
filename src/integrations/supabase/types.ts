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
          {
            foreignKeyName: "ai_agent_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "ai_agent_context_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "ai_agent_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
            foreignKeyName: "ai_agent_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
      appointment_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          appointment_id: string | null
          client_ip: string | null
          customer_token: string | null
          id: string
          metadata: Json | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          appointment_id?: string | null
          client_ip?: string | null
          customer_token?: string | null
          id?: string
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          appointment_id?: string | null
          client_ip?: string | null
          customer_token?: string | null
          id?: string
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_access_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          call_opt_out: boolean
          company_id: string
          created_at: string
          crm_activity_id: string | null
          crm_deal_id: string | null
          crm_provider: string | null
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          customer_token: string | null
          customer_user_id: string | null
          datetime: string
          deal_stage: string | null
          deal_value: number | null
          duration_minutes: number
          email_opt_out: boolean
          employee_id: string | null
          id: string
          last_synced_at: string | null
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
          crm_activity_id?: string | null
          crm_deal_id?: string | null
          crm_provider?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_token?: string | null
          customer_user_id?: string | null
          datetime: string
          deal_stage?: string | null
          deal_value?: number | null
          duration_minutes?: number
          email_opt_out?: boolean
          employee_id?: string | null
          id?: string
          last_synced_at?: string | null
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
          crm_activity_id?: string | null
          crm_deal_id?: string | null
          crm_provider?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_token?: string | null
          customer_user_id?: string | null
          datetime?: string
          deal_stage?: string | null
          deal_value?: number | null
          duration_minutes?: number
          email_opt_out?: boolean
          employee_id?: string | null
          id?: string
          last_synced_at?: string | null
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
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "business_hours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_mappings: {
        Row: {
          appointment_id: string
          caldav_etag: string | null
          caldav_uid: string | null
          company_id: string
          created_at: string | null
          google_event_id: string
          id: string
          last_synced_at: string | null
          sync_direction: string | null
          sync_source: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          caldav_etag?: string | null
          caldav_uid?: string | null
          company_id: string
          created_at?: string | null
          google_event_id: string
          id?: string
          last_synced_at?: string | null
          sync_direction?: string | null
          sync_source?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          caldav_etag?: string | null
          caldav_uid?: string | null
          company_id?: string
          created_at?: string | null
          google_event_id?: string
          id?: string
          last_synced_at?: string | null
          sync_direction?: string | null
          sync_source?: string | null
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
          {
            foreignKeyName: "calendar_event_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_jobs: {
        Row: {
          appointment_id: string | null
          company_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          operation: string
          payload: Json | null
          retry_count: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          sync_type: string
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          operation: string
          payload?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          sync_type: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          operation?: string
          payload?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          sync_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_jobs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "call_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          assignment_distance_weight: number | null
          assignment_history_weight: number | null
          assignment_max_distance_miles: number | null
          assignment_use_customer_history: boolean | null
          assignment_use_distance_routing: boolean | null
          assignment_use_load_balancing: boolean | null
          assignment_workload_weight: number | null
          bounce_alert_email: string | null
          bounce_alert_enabled: boolean | null
          bounce_alert_threshold: number | null
          calendar_feed_token: string | null
          callback_delay_seconds: number | null
          callback_retry_count: number | null
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
          missed_call_action: string | null
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
          public_app_url: string | null
          quarterly_digest_day: number | null
          quarterly_digest_email: string | null
          quarterly_digest_enabled: boolean | null
          quarterly_digest_include_appointments: boolean | null
          quarterly_digest_include_reminders: boolean | null
          quarterly_digest_include_subscriptions: boolean | null
          quarterly_digest_month: number | null
          quarterly_digest_time: string | null
          quarterly_digest_timezone: string | null
          registration_code: string | null
          review_email_subject: string | null
          review_email_template: string | null
          review_facebook_url: string | null
          review_google_url: string | null
          review_request_delay_hours: number | null
          review_request_enabled: boolean | null
          review_sms_template: string | null
          review_yelp_url: string | null
          secondary_color: string | null
          service_area_cities: string[] | null
          service_area_zip_codes: string[] | null
          service_categories: string[] | null
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
          assignment_distance_weight?: number | null
          assignment_history_weight?: number | null
          assignment_max_distance_miles?: number | null
          assignment_use_customer_history?: boolean | null
          assignment_use_distance_routing?: boolean | null
          assignment_use_load_balancing?: boolean | null
          assignment_workload_weight?: number | null
          bounce_alert_email?: string | null
          bounce_alert_enabled?: boolean | null
          bounce_alert_threshold?: number | null
          calendar_feed_token?: string | null
          callback_delay_seconds?: number | null
          callback_retry_count?: number | null
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
          missed_call_action?: string | null
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
          public_app_url?: string | null
          quarterly_digest_day?: number | null
          quarterly_digest_email?: string | null
          quarterly_digest_enabled?: boolean | null
          quarterly_digest_include_appointments?: boolean | null
          quarterly_digest_include_reminders?: boolean | null
          quarterly_digest_include_subscriptions?: boolean | null
          quarterly_digest_month?: number | null
          quarterly_digest_time?: string | null
          quarterly_digest_timezone?: string | null
          registration_code?: string | null
          review_email_subject?: string | null
          review_email_template?: string | null
          review_facebook_url?: string | null
          review_google_url?: string | null
          review_request_delay_hours?: number | null
          review_request_enabled?: boolean | null
          review_sms_template?: string | null
          review_yelp_url?: string | null
          secondary_color?: string | null
          service_area_cities?: string[] | null
          service_area_zip_codes?: string[] | null
          service_categories?: string[] | null
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
          assignment_distance_weight?: number | null
          assignment_history_weight?: number | null
          assignment_max_distance_miles?: number | null
          assignment_use_customer_history?: boolean | null
          assignment_use_distance_routing?: boolean | null
          assignment_use_load_balancing?: boolean | null
          assignment_workload_weight?: number | null
          bounce_alert_email?: string | null
          bounce_alert_enabled?: boolean | null
          bounce_alert_threshold?: number | null
          calendar_feed_token?: string | null
          callback_delay_seconds?: number | null
          callback_retry_count?: number | null
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
          missed_call_action?: string | null
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
          public_app_url?: string | null
          quarterly_digest_day?: number | null
          quarterly_digest_email?: string | null
          quarterly_digest_enabled?: boolean | null
          quarterly_digest_include_appointments?: boolean | null
          quarterly_digest_include_reminders?: boolean | null
          quarterly_digest_include_subscriptions?: boolean | null
          quarterly_digest_month?: number | null
          quarterly_digest_time?: string | null
          quarterly_digest_timezone?: string | null
          registration_code?: string | null
          review_email_subject?: string | null
          review_email_template?: string | null
          review_facebook_url?: string | null
          review_google_url?: string | null
          review_request_delay_hours?: number | null
          review_request_enabled?: boolean | null
          review_sms_template?: string | null
          review_yelp_url?: string | null
          secondary_color?: string | null
          service_area_cities?: string[] | null
          service_area_zip_codes?: string[] | null
          service_categories?: string[] | null
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
          {
            foreignKeyName: "cost_estimates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_connections: {
        Row: {
          access_token: string | null
          company_id: string
          connected_at: string | null
          connected_by: string | null
          created_at: string | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          provider: Database["public"]["Enums"]["crm_provider"]
          refresh_token: string | null
          settings: Json | null
          status: Database["public"]["Enums"]["crm_connection_status"]
          sync_activities: boolean | null
          sync_contacts: boolean | null
          sync_deals: boolean | null
          sync_direction:
            | Database["public"]["Enums"]["crm_sync_direction"]
            | null
          sync_leads: boolean | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          company_id: string
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider: Database["public"]["Enums"]["crm_provider"]
          refresh_token?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["crm_connection_status"]
          sync_activities?: boolean | null
          sync_contacts?: boolean | null
          sync_deals?: boolean | null
          sync_direction?:
            | Database["public"]["Enums"]["crm_sync_direction"]
            | null
          sync_leads?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          company_id?: string
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider?: Database["public"]["Enums"]["crm_provider"]
          refresh_token?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["crm_connection_status"]
          sync_activities?: boolean | null
          sync_contacts?: boolean | null
          sync_deals?: boolean | null
          sync_direction?:
            | Database["public"]["Enums"]["crm_sync_direction"]
            | null
          sync_leads?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_entity_mappings: {
        Row: {
          company_id: string
          connection_id: string
          created_at: string | null
          crm_entity_id: string
          crm_entity_type: string | null
          entity_type: Database["public"]["Enums"]["crm_entity_type"]
          id: string
          last_synced_at: string | null
          local_entity_id: string
          sync_hash: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          connection_id: string
          created_at?: string | null
          crm_entity_id: string
          crm_entity_type?: string | null
          entity_type: Database["public"]["Enums"]["crm_entity_type"]
          id?: string
          last_synced_at?: string | null
          local_entity_id: string
          sync_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          connection_id?: string
          created_at?: string | null
          crm_entity_id?: string
          crm_entity_type?: string | null
          entity_type?: Database["public"]["Enums"]["crm_entity_type"]
          id?: string
          last_synced_at?: string | null
          local_entity_id?: string
          sync_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_entity_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_entity_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_entity_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_field_mappings: {
        Row: {
          company_id: string
          connection_id: string | null
          created_at: string | null
          crm_field: string
          direction: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          local_field: string
          transform_function: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          connection_id?: string | null
          created_at?: string | null
          crm_field: string
          direction?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          local_field: string
          transform_function?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          connection_id?: string | null
          created_at?: string | null
          crm_field?: string
          direction?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          local_field?: string
          transform_function?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_field_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_field_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_field_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sync_logs: {
        Row: {
          company_id: string
          completed_at: string | null
          connection_id: string
          created_at: string | null
          direction: Database["public"]["Enums"]["crm_sync_direction"]
          entity_type: Database["public"]["Enums"]["crm_entity_type"]
          error_details: Json | null
          error_message: string | null
          id: string
          records_created: number | null
          records_failed: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          connection_id: string
          created_at?: string | null
          direction: Database["public"]["Enums"]["crm_sync_direction"]
          entity_type: Database["public"]["Enums"]["crm_entity_type"]
          error_details?: Json | null
          error_message?: string | null
          id?: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          connection_id?: string
          created_at?: string | null
          direction?: Database["public"]["Enums"]["crm_sync_direction"]
          entity_type?: Database["public"]["Enums"]["crm_entity_type"]
          error_details?: Json | null
          error_message?: string | null
          id?: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_sync_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sync_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "crm_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_company_associations: {
        Row: {
          company_id: string
          created_at: string | null
          customer_profile_id: string | null
          customer_user_id: string
          id: string
          is_favorite: boolean | null
          last_interaction_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          customer_profile_id?: string | null
          customer_user_id: string
          id?: string
          is_favorite?: boolean | null
          last_interaction_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          customer_profile_id?: string | null
          customer_user_id?: string
          id?: string
          is_favorite?: boolean | null
          last_interaction_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_company_associations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_company_associations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_company_associations_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
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
            foreignKeyName: "customer_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          latitude: number | null
          longitude: number | null
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
          latitude?: number | null
          longitude?: number | null
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
          latitude?: number | null
          longitude?: number | null
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
          {
            foreignKeyName: "customer_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
      customer_technician_history: {
        Row: {
          company_id: string
          created_at: string | null
          customer_email: string | null
          customer_phone: string | null
          customer_rating: number | null
          id: string
          last_service_at: string | null
          service_count: number | null
          technician_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          customer_rating?: number | null
          id?: string
          last_service_at?: string | null
          service_count?: number | null
          technician_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          customer_rating?: number | null
          id?: string
          last_service_at?: string | null
          service_count?: number | null
          technician_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_technician_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_technician_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_technician_history_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          call_opt_in: boolean | null
          city: string | null
          company_id: string
          country: string | null
          created_at: string | null
          crm_account_id: string | null
          crm_contact_id: string | null
          crm_provider: string | null
          custom_fields: Json | null
          customer_since: string | null
          email: string | null
          email_opt_in: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          last_synced_at: string | null
          lead_source: string | null
          lifecycle_stage: string | null
          mobile_phone: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          preferred_contact_method: string | null
          sms_opt_in: boolean | null
          state: string | null
          sync_status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          call_opt_in?: boolean | null
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string | null
          crm_account_id?: string | null
          crm_contact_id?: string | null
          crm_provider?: string | null
          custom_fields?: Json | null
          customer_since?: string | null
          email?: string | null
          email_opt_in?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_synced_at?: string | null
          lead_source?: string | null
          lifecycle_stage?: string | null
          mobile_phone?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          sms_opt_in?: boolean | null
          state?: string | null
          sync_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          call_opt_in?: boolean | null
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string | null
          crm_account_id?: string | null
          crm_contact_id?: string | null
          crm_provider?: string | null
          custom_fields?: Json | null
          customer_since?: string | null
          email?: string | null
          email_opt_in?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_synced_at?: string | null
          lead_source?: string | null
          lifecycle_stage?: string | null
          mobile_phone?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          sms_opt_in?: boolean | null
          state?: string | null
          sync_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "digest_delivery_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "email_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
            foreignKeyName: "employee_availability_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
            foreignKeyName: "employee_job_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "employee_registration_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
            foreignKeyName: "employee_time_off_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "faqs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_connections: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          company_id: string
          created_at: string | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
          webhook_channel_id: string | null
          webhook_expiration: string | null
          webhook_resource_id: string | null
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
          webhook_channel_id?: string | null
          webhook_expiration?: string | null
          webhook_resource_id?: string | null
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_channel_id?: string | null
          webhook_expiration?: string | null
          webhook_resource_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "holiday_closures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          barcode: string | null
          category: string | null
          company_id: string
          created_at: string
          crm_product_id: string | null
          description: string | null
          external_sku: string | null
          id: string
          is_active: boolean
          last_synced_at: string | null
          manufacturer_part_number: string | null
          min_quantity: number
          name: string
          quantity: number
          sku: string | null
          supplier: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          crm_product_id?: string | null
          description?: string | null
          external_sku?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          manufacturer_part_number?: string | null
          min_quantity?: number
          name: string
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          crm_product_id?: string | null
          description?: string | null
          external_sku?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          manufacturer_part_number?: string | null
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
          customer_user_id: string | null
          due_date: string | null
          id: string
          include_payment_link: boolean | null
          invoice_number: string | null
          notes: string | null
          paid_at: string | null
          payment_link_id: string | null
          payment_link_url: string | null
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
          customer_user_id?: string | null
          due_date?: string | null
          id?: string
          include_payment_link?: boolean | null
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_link_id?: string | null
          payment_link_url?: string | null
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
          customer_user_id?: string | null
          due_date?: string | null
          id?: string
          include_payment_link?: boolean | null
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_link_id?: string | null
          payment_link_url?: string | null
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
            foreignKeyName: "job_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "knowledge_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_ups: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string | null
          follow_up_type: string
          id: string
          lead_id: string
          message_template: string | null
          scheduled_at: string
          status: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          follow_up_type: string
          id?: string
          lead_id: string
          message_template?: string | null
          scheduled_at: string
          status?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          follow_up_type?: string
          id?: string
          lead_id?: string
          message_template?: string | null
          scheduled_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_ups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_ups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          auto_follow_up_enabled: boolean | null
          campaign_source: string | null
          channel: string | null
          company_id: string
          conversation_id: string | null
          converted_to_appointment_id: string | null
          converted_to_customer_id: string | null
          created_at: string | null
          crm_contact_id: string | null
          crm_lead_id: string | null
          crm_provider: string | null
          email: string | null
          follow_up_at: string | null
          id: string
          intent: string | null
          last_activity_at: string | null
          last_synced_at: string | null
          name: string | null
          notes: string | null
          phone: string | null
          priority: string | null
          score: number | null
          score_factors: Json | null
          service_interest: string | null
          source: string
          status: string | null
          sync_status: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          address?: string | null
          auto_follow_up_enabled?: boolean | null
          campaign_source?: string | null
          channel?: string | null
          company_id: string
          conversation_id?: string | null
          converted_to_appointment_id?: string | null
          converted_to_customer_id?: string | null
          created_at?: string | null
          crm_contact_id?: string | null
          crm_lead_id?: string | null
          crm_provider?: string | null
          email?: string | null
          follow_up_at?: string | null
          id?: string
          intent?: string | null
          last_activity_at?: string | null
          last_synced_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string | null
          score?: number | null
          score_factors?: Json | null
          service_interest?: string | null
          source: string
          status?: string | null
          sync_status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          address?: string | null
          auto_follow_up_enabled?: boolean | null
          campaign_source?: string | null
          channel?: string | null
          company_id?: string
          conversation_id?: string | null
          converted_to_appointment_id?: string | null
          converted_to_customer_id?: string | null
          created_at?: string | null
          crm_contact_id?: string | null
          crm_lead_id?: string | null
          crm_provider?: string | null
          email?: string | null
          follow_up_at?: string | null
          id?: string
          intent?: string | null
          last_activity_at?: string | null
          last_synced_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string | null
          score?: number | null
          score_factors?: Json | null
          service_interest?: string | null
          source?: string
          status?: string | null
          sync_status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_to_appointment_id_fkey"
            columns: ["converted_to_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_to_customer_id_fkey"
            columns: ["converted_to_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
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
      missed_call_callbacks: {
        Row: {
          attempt_number: number | null
          callback_call_sid: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string
          error_message: string | null
          id: string
          initiated_at: string | null
          original_call_sid: string | null
          scheduled_at: string
          sms_fallback_sent: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_number?: number | null
          callback_call_sid?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          error_message?: string | null
          id?: string
          initiated_at?: string | null
          original_call_sid?: string | null
          scheduled_at?: string
          sms_fallback_sent?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_number?: number | null
          callback_call_sid?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          error_message?: string | null
          id?: string
          initiated_at?: string | null
          original_call_sid?: string | null
          scheduled_at?: string
          sms_fallback_sent?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missed_call_callbacks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missed_call_callbacks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          availability_json: Json | null
          avatar_url: string | null
          calendar_feed_token: string | null
          company_id: string | null
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          email: string | null
          email_notifications_enabled: boolean | null
          full_name: string | null
          home_address: string | null
          home_latitude: number | null
          home_longitude: number | null
          id: string
          location_updated_at: string | null
          must_change_password: boolean | null
          phone: string | null
          phone_number: string | null
          sms_notifications_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          availability_json?: Json | null
          avatar_url?: string | null
          calendar_feed_token?: string | null
          company_id?: string | null
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          home_address?: string | null
          home_latitude?: number | null
          home_longitude?: number | null
          id: string
          location_updated_at?: string | null
          must_change_password?: boolean | null
          phone?: string | null
          phone_number?: string | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          availability_json?: Json | null
          avatar_url?: string | null
          calendar_feed_token?: string | null
          company_id?: string | null
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          home_address?: string | null
          home_latitude?: number | null
          home_longitude?: number | null
          id?: string
          location_updated_at?: string | null
          must_change_password?: boolean | null
          phone?: string | null
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
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          customer_user_id: string | null
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
          customer_user_id?: string | null
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
          customer_user_id?: string | null
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
          {
            foreignKeyName: "reminder_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "reminder_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          crm_product_id: string | null
          description: string | null
          duration_minutes: number | null
          flat_fee: number | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          last_synced_at: string | null
          name: string
          parts_cost: number | null
          price: number | null
          price_display: string | null
          service_type: string | null
          service_type_other: string | null
          sort_order: number | null
          sync_to_crm: boolean | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          crm_product_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          flat_fee?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          name: string
          parts_cost?: number | null
          price?: number | null
          price_display?: string | null
          service_type?: string | null
          service_type_other?: string | null
          sort_order?: number | null
          sync_to_crm?: boolean | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          crm_product_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          flat_fee?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          name?: string
          parts_cost?: number | null
          price?: number | null
          price_display?: string | null
          service_type?: string | null
          service_type_other?: string | null
          sort_order?: number | null
          sync_to_crm?: boolean | null
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
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "sms_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "subscription_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "suppressed_emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_service_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          company_id: string
          id: string
          service_id: string
          technician_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          company_id: string
          id?: string
          service_id: string
          technician_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          company_id?: string
          id?: string
          service_id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_service_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_service_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_service_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_service_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_service_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          tts_monthly_limit: number | null
          tts_provider: string | null
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_phone_number: string | null
          updated_at: string
          use_platform_tts: boolean | null
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
          tts_monthly_limit?: number | null
          tts_provider?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
          use_platform_tts?: boolean | null
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
          tts_monthly_limit?: number | null
          tts_provider?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
          use_platform_tts?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tts_usage: {
        Row: {
          characters_used: number
          company_id: string
          created_at: string | null
          id: string
          month_year: string
          updated_at: string | null
        }
        Insert: {
          characters_used?: number
          company_id: string
          created_at?: string | null
          id?: string
          month_year: string
          updated_at?: string | null
        }
        Update: {
          characters_used?: number
          company_id?: string
          created_at?: string | null
          id?: string
          month_year?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tts_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tts_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          {
            foreignKeyName: "unsubscribe_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
      warranty_policies: {
        Row: {
          company_id: string
          coverage_details: string | null
          coverage_type: string
          created_at: string
          description: string | null
          duration_months: number
          duration_text: string | null
          exclusions: string | null
          id: string
          is_active: boolean | null
          labor_covered: boolean | null
          name: string
          parts_covered: boolean | null
          sort_order: number | null
          terms_conditions: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          coverage_details?: string | null
          coverage_type?: string
          created_at?: string
          description?: string | null
          duration_months?: number
          duration_text?: string | null
          exclusions?: string | null
          id?: string
          is_active?: boolean | null
          labor_covered?: boolean | null
          name: string
          parts_covered?: boolean | null
          sort_order?: number | null
          terms_conditions?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          coverage_details?: string | null
          coverage_type?: string
          created_at?: string
          description?: string | null
          duration_months?: number
          duration_text?: string | null
          exclusions?: string | null
          id?: string
          is_active?: boolean | null
          labor_covered?: boolean | null
          name?: string
          parts_covered?: boolean | null
          sort_order?: number | null
          terms_conditions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          crm_asset_id: string | null
          crm_case_id: string | null
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          equipment_model: string | null
          equipment_type: string
          id: string
          installation_date: string | null
          is_active: boolean
          last_synced_at: string | null
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
          crm_asset_id?: string | null
          crm_case_id?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          equipment_model?: string | null
          equipment_type: string
          id?: string
          installation_date?: string | null
          is_active?: boolean
          last_synced_at?: string | null
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
          crm_asset_id?: string | null
          crm_case_id?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          equipment_model?: string | null
          equipment_type?: string
          id?: string
          installation_date?: string | null
          is_active?: boolean
          last_synced_at?: string | null
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
      companies_public: {
        Row: {
          id: string | null
          logo_url: string | null
          name: string | null
          primary_color: string | null
          public_app_url: string | null
          secondary_color: string | null
          service_area_cities: string[] | null
          service_area_zip_codes: string[] | null
          service_categories: string[] | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          logo_url?: string | null
          name?: string | null
          primary_color?: string | null
          public_app_url?: string | null
          secondary_color?: string | null
          service_area_cities?: string[] | null
          service_area_zip_codes?: string[] | null
          service_categories?: string[] | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          logo_url?: string | null
          name?: string | null
          primary_color?: string | null
          public_app_url?: string | null
          secondary_color?: string | null
          service_area_cities?: string[] | null
          service_area_zip_codes?: string[] | null
          service_categories?: string[] | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_company: { Args: { _company_id: string }; Returns: boolean }
      customer_has_company_access: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      get_appointment_by_customer_token: {
        Args: { p_token: string }
        Returns: {
          company_id: string
          company_logo_url: string
          company_name: string
          company_primary_color: string
          created_at: string
          customer_address: string
          customer_name: string
          datetime: string
          duration_minutes: number
          id: string
          notes: string
          service_type: string
          status: string
          updated_at: string
        }[]
      }
      get_appointment_by_token:
        | {
            Args: { p_token: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.get_appointment_by_token(p_token => text), public.get_appointment_by_token(p_token => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"[]
          }
        | {
            Args: { p_token: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.get_appointment_by_token(p_token => text), public.get_appointment_by_token(p_token => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"[]
            SetofOptions: {
              from: "*"
              to: "appointments"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      get_company_calendar_appointments: {
        Args: { p_feed_token: string }
        Returns: {
          company_name: string
          created_at: string
          customer_address: string
          customer_email: string
          customer_name: string
          customer_phone: string
          datetime: string
          duration_minutes: number
          id: string
          notes: string
          service_type: string
          status: string
          updated_at: string
        }[]
      }
      get_company_public_info: {
        Args: { p_slug: string }
        Returns: {
          id: string
          logo_url: string
          name: string
          primary_color: string
          public_app_url: string
          secondary_color: string
          service_area_cities: string[]
          service_area_zip_codes: string[]
          service_categories: string[]
          slug: string
        }[]
      }
      get_company_public_info_by_id: {
        Args: { p_id: string }
        Returns: {
          id: string
          logo_url: string
          name: string
          primary_color: string
          public_app_url: string
          secondary_color: string
          service_area_cities: string[]
          service_area_zip_codes: string[]
          service_categories: string[]
          slug: string
        }[]
      }
      get_company_warranty_policies: {
        Args: { p_company_id: string }
        Returns: {
          coverage_details: string
          coverage_type: string
          description: string
          duration_months: number
          duration_text: string
          exclusions: string
          id: string
          labor_covered: boolean
          name: string
          parts_covered: boolean
          terms_conditions: string
        }[]
      }
      get_employee_calendar_appointments: {
        Args: { p_feed_token: string }
        Returns: {
          created_at: string
          customer_address: string
          customer_email: string
          customer_name: string
          customer_phone: string
          datetime: string
          duration_minutes: number
          id: string
          notes: string
          service_type: string
          status: string
          updated_at: string
        }[]
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_billing_access: { Args: { _user_id: string }; Returns: boolean }
      has_dispatch_access: { Args: { _user_id: string }; Returns: boolean }
      has_full_access: { Args: { _user_id: string }; Returns: boolean }
      has_inventory_access: { Args: { _user_id: string }; Returns: boolean }
      has_job_type: {
        Args: { _job_type: string; _user_id: string }
        Returns: boolean
      }
      has_marketing_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assigned_to_job: {
        Args: { _appointment_id: string; _user_id: string }
        Returns: boolean
      }
      is_customer: { Args: { _user_id: string }; Returns: boolean }
      log_appointment_access: {
        Args: {
          p_access_type: string
          p_appointment_id: string
          p_client_ip?: string
          p_customer_token: string
          p_metadata?: Json
          p_success?: boolean
          p_user_agent?: string
        }
        Returns: undefined
      }
      validate_registration_code: {
        Args: { p_code: string; p_company_id?: string }
        Returns: {
          company_id: string
          company_name: string
          is_valid: boolean
          job_role: string
        }[]
      }
    }
    Enums: {
      app_role: "platform_admin" | "company_admin" | "employee" | "customer"
      crm_connection_status:
        | "disconnected"
        | "pending"
        | "connected"
        | "error"
        | "expired"
      crm_entity_type:
        | "contact"
        | "lead"
        | "deal"
        | "activity"
        | "appointment"
        | "invoice"
        | "quote"
      crm_provider:
        | "hubspot"
        | "salesforce"
        | "zoho"
        | "pipedrive"
        | "custom_webhook"
        | "webhook"
      crm_sync_direction: "push" | "pull" | "bidirectional"
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
      app_role: ["platform_admin", "company_admin", "employee", "customer"],
      crm_connection_status: [
        "disconnected",
        "pending",
        "connected",
        "error",
        "expired",
      ],
      crm_entity_type: [
        "contact",
        "lead",
        "deal",
        "activity",
        "appointment",
        "invoice",
        "quote",
      ],
      crm_provider: [
        "hubspot",
        "salesforce",
        "zoho",
        "pipedrive",
        "custom_webhook",
        "webhook",
      ],
      crm_sync_direction: ["push", "pull", "bidirectional"],
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
