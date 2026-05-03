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
      agent_performance_metrics: {
        Row: {
          agent_type: string
          avg_response_time_ms: number | null
          company_id: string
          created_at: string
          date: string
          handoff_count: number | null
          id: string
          requests_handled: number | null
          success_rate: number | null
        }
        Insert: {
          agent_type: string
          avg_response_time_ms?: number | null
          company_id: string
          created_at?: string
          date: string
          handoff_count?: number | null
          id?: string
          requests_handled?: number | null
          success_rate?: number | null
        }
        Update: {
          agent_type?: string
          avg_response_time_ms?: number | null
          company_id?: string
          created_at?: string
          date?: string
          handoff_count?: number | null
          id?: string
          requests_handled?: number | null
          success_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_performance_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
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
          action_description: string | null
          company_id: string
          confidence_score: number | null
          created_at: string | null
          decision_mode: string | null
          error_message: string | null
          event_type: string
          id: string
          override_reason: string | null
          payload: Json
          processed_at: string | null
          requires_human_review: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_agent: string
          status: string | null
          target_agent: string | null
        }
        Insert: {
          action_description?: string | null
          company_id: string
          confidence_score?: number | null
          created_at?: string | null
          decision_mode?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          override_reason?: string | null
          payload?: Json
          processed_at?: string | null
          requires_human_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_agent: string
          status?: string | null
          target_agent?: string | null
        }
        Update: {
          action_description?: string | null
          company_id?: string
          confidence_score?: number | null
          created_at?: string | null
          decision_mode?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          override_reason?: string | null
          payload?: Json
          processed_at?: string | null
          requires_human_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          {
            foreignKeyName: "ai_agent_events_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          customer_token_expires_at: string | null
          customer_user_id: string | null
          datetime: string
          deal_stage: string | null
          deal_value: number | null
          delivery_type: string
          duration_minutes: number
          email_opt_out: boolean
          employee_id: string | null
          id: string
          intake_data: Json
          last_synced_at: string | null
          meeting_link: string | null
          notes: string | null
          pet_id: string | null
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
          customer_token_expires_at?: string | null
          customer_user_id?: string | null
          datetime: string
          deal_stage?: string | null
          deal_value?: number | null
          delivery_type?: string
          duration_minutes?: number
          email_opt_out?: boolean
          employee_id?: string | null
          id?: string
          intake_data?: Json
          last_synced_at?: string | null
          meeting_link?: string | null
          notes?: string | null
          pet_id?: string | null
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
          customer_token_expires_at?: string | null
          customer_user_id?: string | null
          datetime?: string
          deal_stage?: string | null
          deal_value?: number | null
          delivery_type?: string
          duration_minutes?: number
          email_opt_out?: boolean
          employee_id?: string | null
          id?: string
          intake_data?: Json
          last_synced_at?: string | null
          meeting_link?: string | null
          notes?: string | null
          pet_id?: string | null
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
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published: boolean | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          address: string | null
          ai_agent_prompt: string | null
          ai_voice_greeting: string | null
          assignment_distance_weight: number | null
          assignment_history_weight: number | null
          assignment_max_distance_miles: number | null
          assignment_use_customer_history: boolean | null
          assignment_use_distance_routing: boolean | null
          assignment_use_load_balancing: boolean | null
          assignment_workload_weight: number | null
          aura_sms_consent_at: string | null
          aura_sms_consent_ip: string | null
          aura_sms_opt_in: boolean
          bounce_alert_email: string | null
          bounce_alert_enabled: boolean | null
          bounce_alert_threshold: number | null
          brand_tone: string | null
          business_phone: string | null
          calendar_feed_token: string | null
          call_routing_mode: string
          callback_delay_seconds: number | null
          callback_retry_count: number | null
          chat_widget_subtitle: string | null
          chat_widget_title: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          cost_alert_email: string | null
          cost_alert_enabled: boolean | null
          cost_alert_threshold: number | null
          created_at: string
          customer_prefs_enabled: boolean | null
          de_escalation_auto_ticket: boolean | null
          de_escalation_manager_contact: string | null
          default_call_enabled: boolean
          default_email_enabled: boolean
          default_outbound_script: string | null
          default_sms_enabled: boolean
          demo_email_opt_in: boolean
          demo_sms_opt_in: boolean
          dispatch_phone: string | null
          elevenlabs_voice_id_es: string | null
          email: string | null
          emergency_keywords: string[] | null
          emergency_notification_emails: string[] | null
          emergency_phone: string | null
          emergency_sms_enabled: boolean | null
          emergency_surcharge: number | null
          followup_call_script: string | null
          healthcare_compliance: boolean
          id: string
          industry_config: Json
          industry_vertical: string | null
          is_demo: boolean
          last_bounce_alert_at: string | null
          last_cost_alert_at: string | null
          last_monthly_digest_at: string | null
          last_quarterly_digest_at: string | null
          last_sms_optout_alert_at: string | null
          last_unsubscribe_alert_at: string | null
          last_weekly_digest_at: string | null
          logo_url: string | null
          manager_name: string | null
          missed_call_action: string | null
          missed_call_callback_script: string | null
          missed_call_sms_template: string | null
          monthly_digest_day: number | null
          monthly_digest_email: string | null
          monthly_digest_enabled: boolean | null
          monthly_digest_include_appointments: boolean | null
          monthly_digest_include_emails: boolean | null
          monthly_digest_include_reminders: boolean | null
          monthly_digest_include_sms: boolean | null
          monthly_digest_include_subscriptions: boolean | null
          monthly_digest_time: string | null
          monthly_digest_timezone: string | null
          name: string
          operating_model: string | null
          phone: string | null
          phone_number_setup_type: string | null
          primary_color: string | null
          public_app_url: string | null
          quarterly_digest_day: number | null
          quarterly_digest_email: string | null
          quarterly_digest_enabled: boolean | null
          quarterly_digest_include_appointments: boolean | null
          quarterly_digest_include_emails: boolean | null
          quarterly_digest_include_reminders: boolean | null
          quarterly_digest_include_sms: boolean | null
          quarterly_digest_include_subscriptions: boolean | null
          quarterly_digest_month: number | null
          quarterly_digest_time: string | null
          quarterly_digest_timezone: string | null
          registration_code: string | null
          reminder_call_script: string | null
          review_email_subject: string | null
          review_email_template: string | null
          review_facebook_url: string | null
          review_google_url: string | null
          review_request_delay_hours: number | null
          review_request_enabled: boolean | null
          review_sms_template: string | null
          review_yelp_url: string | null
          ring_timeout_seconds: number
          secondary_color: string | null
          secondary_industries: string[]
          service_area_cities: string[] | null
          service_area_zip_codes: string[] | null
          service_categories: string[] | null
          slug: string
          sms_optout_alert_email: string | null
          sms_optout_alert_enabled: boolean | null
          sms_optout_alert_threshold: number | null
          stripe_customer_id: string | null
          subscription_tier: string | null
          supported_modules: Json
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
          weekly_digest_include_emails: boolean | null
          weekly_digest_include_reminders: boolean | null
          weekly_digest_include_sms: boolean | null
          weekly_digest_include_subscriptions: boolean | null
          weekly_digest_time: string | null
          weekly_digest_timezone: string | null
        }
        Insert: {
          address?: string | null
          ai_agent_prompt?: string | null
          ai_voice_greeting?: string | null
          assignment_distance_weight?: number | null
          assignment_history_weight?: number | null
          assignment_max_distance_miles?: number | null
          assignment_use_customer_history?: boolean | null
          assignment_use_distance_routing?: boolean | null
          assignment_use_load_balancing?: boolean | null
          assignment_workload_weight?: number | null
          aura_sms_consent_at?: string | null
          aura_sms_consent_ip?: string | null
          aura_sms_opt_in?: boolean
          bounce_alert_email?: string | null
          bounce_alert_enabled?: boolean | null
          bounce_alert_threshold?: number | null
          brand_tone?: string | null
          business_phone?: string | null
          calendar_feed_token?: string | null
          call_routing_mode?: string
          callback_delay_seconds?: number | null
          callback_retry_count?: number | null
          chat_widget_subtitle?: string | null
          chat_widget_title?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cost_alert_email?: string | null
          cost_alert_enabled?: boolean | null
          cost_alert_threshold?: number | null
          created_at?: string
          customer_prefs_enabled?: boolean | null
          de_escalation_auto_ticket?: boolean | null
          de_escalation_manager_contact?: string | null
          default_call_enabled?: boolean
          default_email_enabled?: boolean
          default_outbound_script?: string | null
          default_sms_enabled?: boolean
          demo_email_opt_in?: boolean
          demo_sms_opt_in?: boolean
          dispatch_phone?: string | null
          elevenlabs_voice_id_es?: string | null
          email?: string | null
          emergency_keywords?: string[] | null
          emergency_notification_emails?: string[] | null
          emergency_phone?: string | null
          emergency_sms_enabled?: boolean | null
          emergency_surcharge?: number | null
          followup_call_script?: string | null
          healthcare_compliance?: boolean
          id?: string
          industry_config?: Json
          industry_vertical?: string | null
          is_demo?: boolean
          last_bounce_alert_at?: string | null
          last_cost_alert_at?: string | null
          last_monthly_digest_at?: string | null
          last_quarterly_digest_at?: string | null
          last_sms_optout_alert_at?: string | null
          last_unsubscribe_alert_at?: string | null
          last_weekly_digest_at?: string | null
          logo_url?: string | null
          manager_name?: string | null
          missed_call_action?: string | null
          missed_call_callback_script?: string | null
          missed_call_sms_template?: string | null
          monthly_digest_day?: number | null
          monthly_digest_email?: string | null
          monthly_digest_enabled?: boolean | null
          monthly_digest_include_appointments?: boolean | null
          monthly_digest_include_emails?: boolean | null
          monthly_digest_include_reminders?: boolean | null
          monthly_digest_include_sms?: boolean | null
          monthly_digest_include_subscriptions?: boolean | null
          monthly_digest_time?: string | null
          monthly_digest_timezone?: string | null
          name: string
          operating_model?: string | null
          phone?: string | null
          phone_number_setup_type?: string | null
          primary_color?: string | null
          public_app_url?: string | null
          quarterly_digest_day?: number | null
          quarterly_digest_email?: string | null
          quarterly_digest_enabled?: boolean | null
          quarterly_digest_include_appointments?: boolean | null
          quarterly_digest_include_emails?: boolean | null
          quarterly_digest_include_reminders?: boolean | null
          quarterly_digest_include_sms?: boolean | null
          quarterly_digest_include_subscriptions?: boolean | null
          quarterly_digest_month?: number | null
          quarterly_digest_time?: string | null
          quarterly_digest_timezone?: string | null
          registration_code?: string | null
          reminder_call_script?: string | null
          review_email_subject?: string | null
          review_email_template?: string | null
          review_facebook_url?: string | null
          review_google_url?: string | null
          review_request_delay_hours?: number | null
          review_request_enabled?: boolean | null
          review_sms_template?: string | null
          review_yelp_url?: string | null
          ring_timeout_seconds?: number
          secondary_color?: string | null
          secondary_industries?: string[]
          service_area_cities?: string[] | null
          service_area_zip_codes?: string[] | null
          service_categories?: string[] | null
          slug: string
          sms_optout_alert_email?: string | null
          sms_optout_alert_enabled?: boolean | null
          sms_optout_alert_threshold?: number | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          supported_modules?: Json
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
          weekly_digest_include_emails?: boolean | null
          weekly_digest_include_reminders?: boolean | null
          weekly_digest_include_sms?: boolean | null
          weekly_digest_include_subscriptions?: boolean | null
          weekly_digest_time?: string | null
          weekly_digest_timezone?: string | null
        }
        Update: {
          address?: string | null
          ai_agent_prompt?: string | null
          ai_voice_greeting?: string | null
          assignment_distance_weight?: number | null
          assignment_history_weight?: number | null
          assignment_max_distance_miles?: number | null
          assignment_use_customer_history?: boolean | null
          assignment_use_distance_routing?: boolean | null
          assignment_use_load_balancing?: boolean | null
          assignment_workload_weight?: number | null
          aura_sms_consent_at?: string | null
          aura_sms_consent_ip?: string | null
          aura_sms_opt_in?: boolean
          bounce_alert_email?: string | null
          bounce_alert_enabled?: boolean | null
          bounce_alert_threshold?: number | null
          brand_tone?: string | null
          business_phone?: string | null
          calendar_feed_token?: string | null
          call_routing_mode?: string
          callback_delay_seconds?: number | null
          callback_retry_count?: number | null
          chat_widget_subtitle?: string | null
          chat_widget_title?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cost_alert_email?: string | null
          cost_alert_enabled?: boolean | null
          cost_alert_threshold?: number | null
          created_at?: string
          customer_prefs_enabled?: boolean | null
          de_escalation_auto_ticket?: boolean | null
          de_escalation_manager_contact?: string | null
          default_call_enabled?: boolean
          default_email_enabled?: boolean
          default_outbound_script?: string | null
          default_sms_enabled?: boolean
          demo_email_opt_in?: boolean
          demo_sms_opt_in?: boolean
          dispatch_phone?: string | null
          elevenlabs_voice_id_es?: string | null
          email?: string | null
          emergency_keywords?: string[] | null
          emergency_notification_emails?: string[] | null
          emergency_phone?: string | null
          emergency_sms_enabled?: boolean | null
          emergency_surcharge?: number | null
          followup_call_script?: string | null
          healthcare_compliance?: boolean
          id?: string
          industry_config?: Json
          industry_vertical?: string | null
          is_demo?: boolean
          last_bounce_alert_at?: string | null
          last_cost_alert_at?: string | null
          last_monthly_digest_at?: string | null
          last_quarterly_digest_at?: string | null
          last_sms_optout_alert_at?: string | null
          last_unsubscribe_alert_at?: string | null
          last_weekly_digest_at?: string | null
          logo_url?: string | null
          manager_name?: string | null
          missed_call_action?: string | null
          missed_call_callback_script?: string | null
          missed_call_sms_template?: string | null
          monthly_digest_day?: number | null
          monthly_digest_email?: string | null
          monthly_digest_enabled?: boolean | null
          monthly_digest_include_appointments?: boolean | null
          monthly_digest_include_emails?: boolean | null
          monthly_digest_include_reminders?: boolean | null
          monthly_digest_include_sms?: boolean | null
          monthly_digest_include_subscriptions?: boolean | null
          monthly_digest_time?: string | null
          monthly_digest_timezone?: string | null
          name?: string
          operating_model?: string | null
          phone?: string | null
          phone_number_setup_type?: string | null
          primary_color?: string | null
          public_app_url?: string | null
          quarterly_digest_day?: number | null
          quarterly_digest_email?: string | null
          quarterly_digest_enabled?: boolean | null
          quarterly_digest_include_appointments?: boolean | null
          quarterly_digest_include_emails?: boolean | null
          quarterly_digest_include_reminders?: boolean | null
          quarterly_digest_include_sms?: boolean | null
          quarterly_digest_include_subscriptions?: boolean | null
          quarterly_digest_month?: number | null
          quarterly_digest_time?: string | null
          quarterly_digest_timezone?: string | null
          registration_code?: string | null
          reminder_call_script?: string | null
          review_email_subject?: string | null
          review_email_template?: string | null
          review_facebook_url?: string | null
          review_google_url?: string | null
          review_request_delay_hours?: number | null
          review_request_enabled?: boolean | null
          review_sms_template?: string | null
          review_yelp_url?: string | null
          ring_timeout_seconds?: number
          secondary_color?: string | null
          secondary_industries?: string[]
          service_area_cities?: string[] | null
          service_area_zip_codes?: string[] | null
          service_categories?: string[] | null
          slug?: string
          sms_optout_alert_email?: string | null
          sms_optout_alert_enabled?: boolean | null
          sms_optout_alert_threshold?: number | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          supported_modules?: Json
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
          weekly_digest_include_emails?: boolean | null
          weekly_digest_include_reminders?: boolean | null
          weekly_digest_include_sms?: boolean | null
          weekly_digest_include_subscriptions?: boolean | null
          weekly_digest_time?: string | null
          weekly_digest_timezone?: string | null
        }
        Relationships: []
      }
      company_ai_content_profiles: {
        Row: {
          avoid_keywords: string[] | null
          avoid_topics: string[] | null
          brand_voice: string | null
          business_description: string | null
          company_id: string
          content_topics: string[] | null
          created_at: string
          id: string
          keywords: string[] | null
          primary_industry: string | null
          secondary_industries: string[] | null
          target_audience: string | null
          tone: string | null
          unique_selling_points: string[] | null
          updated_at: string
        }
        Insert: {
          avoid_keywords?: string[] | null
          avoid_topics?: string[] | null
          brand_voice?: string | null
          business_description?: string | null
          company_id: string
          content_topics?: string[] | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          primary_industry?: string | null
          secondary_industries?: string[] | null
          target_audience?: string | null
          tone?: string | null
          unique_selling_points?: string[] | null
          updated_at?: string
        }
        Update: {
          avoid_keywords?: string[] | null
          avoid_topics?: string[] | null
          brand_voice?: string | null
          business_description?: string | null
          company_id?: string
          content_topics?: string[] | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          primary_industry?: string | null
          secondary_industries?: string[] | null
          target_audience?: string | null
          tone?: string | null
          unique_selling_points?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ai_content_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ai_content_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_compliance_documents: {
        Row: {
          company_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["compliance_doc_type"]
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          notes: string | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["compliance_doc_status"]
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["compliance_doc_type"]
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["compliance_doc_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["compliance_doc_type"]
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["compliance_doc_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_compliance_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_compliance_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_integrations: {
        Row: {
          company_id: string
          config: Json
          connected_at: string | null
          created_at: string
          id: string
          last_error: string | null
          last_synced_at: string | null
          provider_key: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          config?: Json
          connected_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          provider_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json
          connected_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          provider_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_role_agent_access: {
        Row: {
          agent_type: string
          company_id: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          job_type: Database["public"]["Enums"]["employee_job_type"]
        }
        Insert: {
          agent_type: string
          company_id: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          job_type: Database["public"]["Enums"]["employee_job_type"]
        }
        Update: {
          agent_type?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          job_type?: Database["public"]["Enums"]["employee_job_type"]
        }
        Relationships: [
          {
            foreignKeyName: "company_role_agent_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_role_agent_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_role_permissions: {
        Row: {
          can_access_analytics: boolean | null
          can_access_appointments: boolean | null
          can_access_campaigns: boolean | null
          can_access_customers: boolean | null
          can_access_field_ops: boolean | null
          can_access_inventory: boolean | null
          can_access_invoices: boolean | null
          can_access_leads: boolean | null
          can_access_quotes: boolean | null
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          company_id: string
          created_at: string | null
          id: string
          job_type: Database["public"]["Enums"]["employee_job_type"]
          updated_at: string | null
        }
        Insert: {
          can_access_analytics?: boolean | null
          can_access_appointments?: boolean | null
          can_access_campaigns?: boolean | null
          can_access_customers?: boolean | null
          can_access_field_ops?: boolean | null
          can_access_inventory?: boolean | null
          can_access_invoices?: boolean | null
          can_access_leads?: boolean | null
          can_access_quotes?: boolean | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          company_id: string
          created_at?: string | null
          id?: string
          job_type: Database["public"]["Enums"]["employee_job_type"]
          updated_at?: string | null
        }
        Update: {
          can_access_analytics?: boolean | null
          can_access_appointments?: boolean | null
          can_access_campaigns?: boolean | null
          can_access_customers?: boolean | null
          can_access_field_ops?: boolean | null
          can_access_inventory?: boolean | null
          can_access_invoices?: boolean | null
          can_access_leads?: boolean | null
          can_access_quotes?: boolean | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          company_id?: string
          created_at?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["employee_job_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_role_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_role_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      content_engine_history: {
        Row: {
          channel: string
          company_id: string
          content: Json
          created_at: string
          created_by: string | null
          id: string
          saved_id: string | null
          saved_to: string | null
          topic: string
        }
        Insert: {
          channel: string
          company_id: string
          content: Json
          created_at?: string
          created_by?: string | null
          id?: string
          saved_id?: string | null
          saved_to?: string | null
          topic: string
        }
        Update: {
          channel?: string
          company_id?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          saved_id?: string | null
          saved_to?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_engine_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_engine_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_engine_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      cross_company_access_logs: {
        Row: {
          access_type: string
          attempted_company_id: string | null
          authorized_company_id: string | null
          created_at: string
          customer_user_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          was_authorized: boolean
        }
        Insert: {
          access_type?: string
          attempted_company_id?: string | null
          authorized_company_id?: string | null
          created_at?: string
          customer_user_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          was_authorized?: boolean
        }
        Update: {
          access_type?: string
          attempted_company_id?: string | null
          authorized_company_id?: string | null
          created_at?: string
          customer_user_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          was_authorized?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cross_company_access_logs_attempted_company_id_fkey"
            columns: ["attempted_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_company_access_logs_attempted_company_id_fkey"
            columns: ["attempted_company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_company_access_logs_authorized_company_id_fkey"
            columns: ["authorized_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_company_access_logs_authorized_company_id_fkey"
            columns: ["authorized_company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
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
          intake_data: Json | null
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string | null
          portal_token: string | null
          preferred_language: string
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
          intake_data?: Json | null
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          portal_token?: string | null
          preferred_language?: string
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
          intake_data?: Json | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          portal_token?: string | null
          preferred_language?: string
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
          pets: Json
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
          pets?: Json
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
          pets?: Json
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
      demo_trials: {
        Row: {
          admin_email: string | null
          admin_user_id: string | null
          company_id: string | null
          created_at: string
          created_ip: string | null
          customer_email: string | null
          customer_user_id: string | null
          email_opt_in: boolean
          employee_email: string | null
          employee_user_id: string | null
          expires_at: string
          id: string
          industry: string
          prospect_email: string
          prospect_name: string
          prospect_phone: string | null
          sms_opt_in: boolean
          status: string
        }
        Insert: {
          admin_email?: string | null
          admin_user_id?: string | null
          company_id?: string | null
          created_at?: string
          created_ip?: string | null
          customer_email?: string | null
          customer_user_id?: string | null
          email_opt_in?: boolean
          employee_email?: string | null
          employee_user_id?: string | null
          expires_at?: string
          id?: string
          industry: string
          prospect_email: string
          prospect_name: string
          prospect_phone?: string | null
          sms_opt_in?: boolean
          status?: string
        }
        Update: {
          admin_email?: string | null
          admin_user_id?: string | null
          company_id?: string | null
          created_at?: string
          created_ip?: string | null
          customer_email?: string | null
          customer_user_id?: string | null
          email_opt_in?: boolean
          employee_email?: string | null
          employee_user_id?: string | null
          expires_at?: string
          id?: string
          industry?: string
          prospect_email?: string
          prospect_name?: string
          prospect_phone?: string | null
          sms_opt_in?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_trials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_trials_company_id_fkey"
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
      industry_blueprints: {
        Row: {
          agent_actions: Json
          created_at: string
          default_agents: Json
          default_consoles: Json
          default_kpis: Json
          id: string
          is_active: boolean
          name: string
          operating_model: string
          primary_records: Json
          prompt_overrides: Json
          restrictions: Json
          slug: string
          updated_at: string
        }
        Insert: {
          agent_actions?: Json
          created_at?: string
          default_agents?: Json
          default_consoles?: Json
          default_kpis?: Json
          id?: string
          is_active?: boolean
          name: string
          operating_model: string
          primary_records?: Json
          prompt_overrides?: Json
          restrictions?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          agent_actions?: Json
          created_at?: string
          default_agents?: Json
          default_consoles?: Json
          default_kpis?: Json
          id?: string
          is_active?: boolean
          name?: string
          operating_model?: string
          primary_records?: Json
          prompt_overrides?: Json
          restrictions?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      industry_template_packs: {
        Row: {
          agent_prompt_deltas: Json
          appointment_rules: Json
          checklist_library: Json
          cluster: string
          console_visibility: Json
          created_at: string
          customer_intake_schema: Json
          dashboard_widgets: Json
          description: string | null
          extra_operatives: Json
          form_schemas: Json
          icon: string | null
          id: string
          industry_id: string
          inventory_taxonomy: Json
          invoice_template: Json
          is_active: boolean
          job_templates: Json
          kb_seed_documents: Json
          label: string
          min_tier_per_extra: Json
          quote_template: Json
          service_catalog: Json
          service_type_options: Json
          terminology: Json
          updated_at: string
        }
        Insert: {
          agent_prompt_deltas?: Json
          appointment_rules?: Json
          checklist_library?: Json
          cluster: string
          console_visibility?: Json
          created_at?: string
          customer_intake_schema?: Json
          dashboard_widgets?: Json
          description?: string | null
          extra_operatives?: Json
          form_schemas?: Json
          icon?: string | null
          id?: string
          industry_id: string
          inventory_taxonomy?: Json
          invoice_template?: Json
          is_active?: boolean
          job_templates?: Json
          kb_seed_documents?: Json
          label: string
          min_tier_per_extra?: Json
          quote_template?: Json
          service_catalog?: Json
          service_type_options?: Json
          terminology?: Json
          updated_at?: string
        }
        Update: {
          agent_prompt_deltas?: Json
          appointment_rules?: Json
          checklist_library?: Json
          cluster?: string
          console_visibility?: Json
          created_at?: string
          customer_intake_schema?: Json
          dashboard_widgets?: Json
          description?: string | null
          extra_operatives?: Json
          form_schemas?: Json
          icon?: string | null
          id?: string
          industry_id?: string
          inventory_taxonomy?: Json
          invoice_template?: Json
          is_active?: boolean
          job_templates?: Json
          kb_seed_documents?: Json
          label?: string
          min_tier_per_extra?: Json
          quote_template?: Json
          service_catalog?: Json
          service_type_options?: Json
          terminology?: Json
          updated_at?: string
        }
        Relationships: []
      }
      insurance_verification_requests: {
        Row: {
          carrier: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          customer_id: string | null
          group_number: string | null
          id: string
          member_id: string | null
          notes: string | null
          photo_url: string | null
          policyholder_dob: string | null
          policyholder_name: string | null
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          group_number?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          photo_url?: string | null
          policyholder_dob?: string | null
          policyholder_name?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          group_number?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          photo_url?: string | null
          policyholder_dob?: string | null
          policyholder_name?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_verification_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_verification_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_verification_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
      launch_milestones: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          milestone_key: string
          notes: string | null
          target_day: number | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_key: string
          notes?: string | null
          target_day?: number | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_key?: string
          notes?: string | null
          target_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "launch_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_progress: {
        Row: {
          company_id: string
          created_at: string | null
          current_phase: string | null
          id: string
          kickoff_completed_at: string | null
          kickoff_scheduled_at: string | null
          launch_type: string
          started_at: string | null
          target_go_live_date: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          current_phase?: string | null
          id?: string
          kickoff_completed_at?: string | null
          kickoff_scheduled_at?: string | null
          launch_type: string
          started_at?: string | null
          target_go_live_date?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          current_phase?: string | null
          id?: string
          kickoff_completed_at?: string | null
          kickoff_scheduled_at?: string | null
          launch_type?: string
          started_at?: string | null
          target_go_live_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "launch_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
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
          intake_data: Json
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
          intake_data?: Json
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
          intake_data?: Json
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
          scheduled_send_date: string | null
          series_id: string | null
          series_order: number | null
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
          scheduled_send_date?: string | null
          series_id?: string | null
          series_order?: number | null
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
          scheduled_send_date?: string | null
          series_id?: string | null
          series_order?: number | null
          start_date?: string | null
          status?: string
          target_segment?: string | null
          total_clicked?: number | null
          total_converted?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
      onboarding_step_events: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          id: string
          metadata: Json
          step: string
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          step: string
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          step?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_step_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_step_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_issues: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          error_stack: string | null
          id: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          metadata: Json | null
          page_url: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          error_stack?: string | null
          id?: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          metadata?: Json | null
          page_url?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          error_stack?: string | null
          id?: string
          issue_type?: Database["public"]["Enums"]["issue_type"]
          metadata?: Json | null
          page_url?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_issues_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_issues_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          aura_sms_consent_at: string | null
          aura_sms_consent_ip: string | null
          aura_sms_opt_in: boolean
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
          onboarding_completed_at: string | null
          phone: string | null
          phone_number: string | null
          preferred_language: string
          sms_notifications_enabled: boolean | null
          tours_completed: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          aura_sms_consent_at?: string | null
          aura_sms_consent_ip?: string | null
          aura_sms_opt_in?: boolean
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
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_number?: string | null
          preferred_language?: string
          sms_notifications_enabled?: boolean | null
          tours_completed?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          aura_sms_consent_at?: string | null
          aura_sms_consent_ip?: string | null
          aura_sms_opt_in?: boolean
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
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_number?: string | null
          preferred_language?: string
          sms_notifications_enabled?: boolean | null
          tours_completed?: Json | null
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
      protocol_switch_events: {
        Row: {
          channel: string
          company_id: string
          confidence_score: number | null
          conversation_id: string | null
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          id: string
          metadata: Json | null
          new_mode: string
          previous_mode: string | null
          trigger_type: string
          trigger_value: string | null
        }
        Insert: {
          channel: string
          company_id: string
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          metadata?: Json | null
          new_mode: string
          previous_mode?: string | null
          trigger_type: string
          trigger_value?: string | null
        }
        Update: {
          channel?: string
          company_id?: string
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          metadata?: Json | null
          new_mode?: string
          previous_mode?: string | null
          trigger_type?: string
          trigger_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocol_switch_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_switch_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          company_id: string
          created_at: string
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          company_id: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          company_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_company_id_fkey"
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
          email_enabled: boolean
          email_template: string | null
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
          email_enabled?: boolean
          email_template?: string | null
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
          email_enabled?: boolean
          email_template?: string | null
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
      role_mappings: {
        Row: {
          auto_activated: boolean | null
          company_id: string
          created_at: string | null
          currently_handled_by: string
          id: string
          mapped_agent_type: string | null
          pain_level: number | null
          role: string
        }
        Insert: {
          auto_activated?: boolean | null
          company_id: string
          created_at?: string | null
          currently_handled_by: string
          id?: string
          mapped_agent_type?: string | null
          pain_level?: number | null
          role: string
        }
        Update: {
          auto_activated?: boolean | null
          company_id?: string
          created_at?: string | null
          currently_handled_by?: string
          id?: string
          mapped_agent_type?: string | null
          pain_level?: number | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_blog_posts: {
        Row: {
          ai_research_used: boolean | null
          approved_at: string | null
          approved_by: string | null
          batch_id: string | null
          company_id: string
          content: string
          created_at: string
          created_by: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          keywords: string[] | null
          publish_error: string | null
          published_at: string | null
          scheduled_for: string
          slug: string
          status: string
          timezone: string
          title: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          ai_research_used?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          company_id: string
          content: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          keywords?: string[] | null
          publish_error?: string | null
          published_at?: string | null
          scheduled_for: string
          slug: string
          status?: string
          timezone?: string
          title: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          ai_research_used?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          keywords?: string[] | null
          publish_error?: string | null
          published_at?: string | null
          scheduled_for?: string
          slug?: string
          status?: string
          timezone?: string
          title?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_blog_posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_blog_posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          company_id: string
          content_json: Json
          created_at: string | null
          created_by: string | null
          draft_id: string | null
          id: string
          last_error: string | null
          max_retries: number | null
          platforms: string[]
          publish_results: Json | null
          published_at: string | null
          retry_count: number | null
          scheduled_for: string
          status: Database["public"]["Enums"]["scheduled_post_status"] | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content_json: Json
          created_at?: string | null
          created_by?: string | null
          draft_id?: string | null
          id?: string
          last_error?: string | null
          max_retries?: number | null
          platforms: string[]
          publish_results?: Json | null
          published_at?: string | null
          retry_count?: number | null
          scheduled_for: string
          status?: Database["public"]["Enums"]["scheduled_post_status"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content_json?: Json
          created_at?: string | null
          created_by?: string | null
          draft_id?: string | null
          id?: string
          last_error?: string | null
          max_retries?: number | null
          platforms?: string[]
          publish_results?: Json | null
          published_at?: string | null
          retry_count?: number | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["scheduled_post_status"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "social_content_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_social_posts: {
        Row: {
          ai_research_used: boolean | null
          approved_at: string | null
          approved_by: string | null
          batch_id: string | null
          company_id: string
          content_json: Json
          created_at: string | null
          id: string
          image_url: string | null
          keywords: string[] | null
          platforms: string[]
          publish_error: string | null
          published_at: string | null
          scheduled_for: string
          status: string
          timezone: string | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          ai_research_used?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          company_id: string
          content_json?: Json
          created_at?: string | null
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          platforms?: string[]
          publish_error?: string | null
          published_at?: string | null
          scheduled_for: string
          status?: string
          timezone?: string | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          ai_research_used?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          company_id?: string
          content_json?: Json
          created_at?: string | null
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          platforms?: string[]
          publish_error?: string | null
          published_at?: string | null
          scheduled_for?: string
          status?: string
          timezone?: string | null
          topic?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_social_posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_social_posts_company_id_fkey"
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
          delivery_type: string | null
          description: string | null
          duration_minutes: number | null
          flat_fee: number | null
          hourly_rate: number | null
          id: string
          intake_schema_overrides: Json | null
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
          website_show_description: boolean
          website_show_duration: boolean
          website_show_price: boolean
          website_show_service: boolean
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          delivery_type?: string | null
          description?: string | null
          duration_minutes?: number | null
          flat_fee?: number | null
          hourly_rate?: number | null
          id?: string
          intake_schema_overrides?: Json | null
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
          website_show_description?: boolean
          website_show_duration?: boolean
          website_show_price?: boolean
          website_show_service?: boolean
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          delivery_type?: string | null
          description?: string | null
          duration_minutes?: number | null
          flat_fee?: number | null
          hourly_rate?: number | null
          id?: string
          intake_schema_overrides?: Json | null
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
          website_show_description?: boolean
          website_show_duration?: boolean
          website_show_price?: boolean
          website_show_service?: boolean
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
      site_chat_logs: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          interaction_type: string
          message_preview: string | null
          message_role: string | null
          visitor_fingerprint: string | null
          website_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          interaction_type: string
          message_preview?: string | null
          message_role?: string | null
          visitor_fingerprint?: string | null
          website_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          interaction_type?: string
          message_preview?: string | null
          message_role?: string | null
          visitor_fingerprint?: string | null
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_chat_logs_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "smart_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_metrics: {
        Row: {
          booking_clicks: number
          chat_interactions: number
          company_id: string
          created_at: string
          id: string
          month_year: string
          page_views: number
          unique_visitors: number
          updated_at: string
          website_id: string
        }
        Insert: {
          booking_clicks?: number
          chat_interactions?: number
          company_id: string
          created_at?: string
          id?: string
          month_year: string
          page_views?: number
          unique_visitors?: number
          updated_at?: string
          website_id: string
        }
        Update: {
          booking_clicks?: number
          chat_interactions?: number
          company_id?: string
          created_at?: string
          id?: string
          month_year?: string
          page_views?: number
          unique_visitors?: number
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_metrics_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "smart_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visitor_logs: {
        Row: {
          id: string
          page_path: string
          referrer: string | null
          user_agent: string | null
          visited_at: string
          visitor_fingerprint: string | null
          website_id: string
        }
        Insert: {
          id?: string
          page_path?: string
          referrer?: string | null
          user_agent?: string | null
          visited_at?: string
          visitor_fingerprint?: string | null
          website_id: string
        }
        Update: {
          id?: string
          page_path?: string
          referrer?: string | null
          user_agent?: string | null
          visited_at?: string
          visitor_fingerprint?: string | null
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visitor_logs_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "smart_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_links: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          intent_triggers: string[] | null
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          intent_triggers?: string[] | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          intent_triggers?: string[] | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_website_holidays: {
        Row: {
          company_id: string
          created_at: string
          custom_cta_text: string | null
          custom_cta_url: string | null
          custom_headline: string
          custom_subheadline: string | null
          holiday_date: string
          holiday_name: string
          id: string
          is_active: boolean
          updated_at: string
          website_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          custom_cta_text?: string | null
          custom_cta_url?: string | null
          custom_headline: string
          custom_subheadline?: string | null
          holiday_date: string
          holiday_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
          website_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          custom_cta_text?: string | null
          custom_cta_url?: string | null
          custom_headline?: string
          custom_subheadline?: string | null
          holiday_date?: string
          holiday_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_website_holidays_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_website_holidays_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_website_holidays_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "smart_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_websites: {
        Row: {
          about_header: string | null
          about_image_url: string | null
          about_paragraph: string | null
          about_subheader: string | null
          background_image_url: string | null
          background_style: string
          booking_widget_mode: string
          company_id: string
          contact_address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_title: string | null
          contact2_email: string | null
          contact2_name: string | null
          contact2_phone: string | null
          contact2_title: string | null
          contact3_email: string | null
          contact3_name: string | null
          contact3_phone: string | null
          contact3_title: string | null
          created_at: string
          cta_button_text: string
          cta_button_url: string | null
          custom_domain: string | null
          dns_verification_code: string
          domain_verified: boolean
          emergency_cta_text: string | null
          emergency_cta_url: string | null
          enable_night_mode: boolean | null
          gallery_images: string[] | null
          hero_headline: string | null
          hero_subheadline: string | null
          id: string
          is_published: boolean
          logo_transparency_mode: string | null
          monthly_visitor_limit: number
          night_end_hour: number | null
          night_header: string | null
          night_start_hour: number | null
          night_subheadline: string | null
          show_about_section: boolean
          show_blog: boolean | null
          show_booking_widget: boolean
          show_chat_widget: boolean
          show_console_appointments: boolean | null
          show_console_billing: boolean | null
          show_console_emergency: boolean | null
          show_console_feedback: boolean | null
          show_console_quotes: boolean | null
          show_console_tracking: boolean | null
          show_contact: boolean
          show_emergency_hours: boolean
          show_field_hours: boolean
          show_gallery: boolean | null
          show_holidays: boolean
          show_hours: boolean
          show_services: boolean
          show_voice_widget: boolean
          subdomain: string | null
          updated_at: string
        }
        Insert: {
          about_header?: string | null
          about_image_url?: string | null
          about_paragraph?: string | null
          about_subheader?: string | null
          background_image_url?: string | null
          background_style?: string
          booking_widget_mode?: string
          company_id: string
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_title?: string | null
          contact2_email?: string | null
          contact2_name?: string | null
          contact2_phone?: string | null
          contact2_title?: string | null
          contact3_email?: string | null
          contact3_name?: string | null
          contact3_phone?: string | null
          contact3_title?: string | null
          created_at?: string
          cta_button_text?: string
          cta_button_url?: string | null
          custom_domain?: string | null
          dns_verification_code?: string
          domain_verified?: boolean
          emergency_cta_text?: string | null
          emergency_cta_url?: string | null
          enable_night_mode?: boolean | null
          gallery_images?: string[] | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: string
          is_published?: boolean
          logo_transparency_mode?: string | null
          monthly_visitor_limit?: number
          night_end_hour?: number | null
          night_header?: string | null
          night_start_hour?: number | null
          night_subheadline?: string | null
          show_about_section?: boolean
          show_blog?: boolean | null
          show_booking_widget?: boolean
          show_chat_widget?: boolean
          show_console_appointments?: boolean | null
          show_console_billing?: boolean | null
          show_console_emergency?: boolean | null
          show_console_feedback?: boolean | null
          show_console_quotes?: boolean | null
          show_console_tracking?: boolean | null
          show_contact?: boolean
          show_emergency_hours?: boolean
          show_field_hours?: boolean
          show_gallery?: boolean | null
          show_holidays?: boolean
          show_hours?: boolean
          show_services?: boolean
          show_voice_widget?: boolean
          subdomain?: string | null
          updated_at?: string
        }
        Update: {
          about_header?: string | null
          about_image_url?: string | null
          about_paragraph?: string | null
          about_subheader?: string | null
          background_image_url?: string | null
          background_style?: string
          booking_widget_mode?: string
          company_id?: string
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_title?: string | null
          contact2_email?: string | null
          contact2_name?: string | null
          contact2_phone?: string | null
          contact2_title?: string | null
          contact3_email?: string | null
          contact3_name?: string | null
          contact3_phone?: string | null
          contact3_title?: string | null
          created_at?: string
          cta_button_text?: string
          cta_button_url?: string | null
          custom_domain?: string | null
          dns_verification_code?: string
          domain_verified?: boolean
          emergency_cta_text?: string | null
          emergency_cta_url?: string | null
          enable_night_mode?: boolean | null
          gallery_images?: string[] | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: string
          is_published?: boolean
          logo_transparency_mode?: string | null
          monthly_visitor_limit?: number
          night_end_hour?: number | null
          night_header?: string | null
          night_start_hour?: number | null
          night_subheadline?: string | null
          show_about_section?: boolean
          show_blog?: boolean | null
          show_booking_widget?: boolean
          show_chat_widget?: boolean
          show_console_appointments?: boolean | null
          show_console_billing?: boolean | null
          show_console_emergency?: boolean | null
          show_console_feedback?: boolean | null
          show_console_quotes?: boolean | null
          show_console_tracking?: boolean | null
          show_contact?: boolean
          show_emergency_hours?: boolean
          show_field_hours?: boolean
          show_gallery?: boolean | null
          show_holidays?: boolean
          show_hours?: boolean
          show_services?: boolean
          show_voice_widget?: boolean
          subdomain?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_websites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_websites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_keywords: {
        Row: {
          company_id: string
          created_at: string
          hit_count: number
          id: string
          is_enabled: boolean
          keyword: string
          response_message: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          hit_count?: number
          id?: string
          is_enabled?: boolean
          keyword: string
          response_message: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          hit_count?: number
          id?: string
          is_enabled?: boolean
          keyword?: string
          response_message?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_keywords_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_keywords_company_id_fkey"
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
          include_portal_link: boolean
          message: string
          template_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          include_portal_link?: boolean
          message: string
          template_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          include_portal_link?: boolean
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
      social_accounts: {
        Row: {
          access_token: string
          company_id: string
          connected_at: string | null
          connected_by: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_used_at: string | null
          permissions_granted: string[] | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_account_id: string
          platform_account_name: string | null
          platform_page_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          company_id: string
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_used_at?: string | null
          permissions_granted?: string[] | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_account_id: string
          platform_account_name?: string | null
          platform_page_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          company_id?: string
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_used_at?: string | null
          permissions_granted?: string[] | null
          platform?: Database["public"]["Enums"]["social_platform"]
          platform_account_id?: string
          platform_account_name?: string | null
          platform_page_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_content_drafts: {
        Row: {
          api_metadata: Json | null
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          edited_content: string | null
          external_post_id: string | null
          external_post_url: string | null
          generated_content: string
          hashtags: string[] | null
          id: string
          image_url: string | null
          job_assignment_id: string | null
          media_instructions: string | null
          platform: string
          published_at: string | null
          scheduled_post_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          api_metadata?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          edited_content?: string | null
          external_post_id?: string | null
          external_post_url?: string | null
          generated_content: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          job_assignment_id?: string | null
          media_instructions?: string | null
          platform: string
          published_at?: string | null
          scheduled_post_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          api_metadata?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          edited_content?: string | null
          external_post_id?: string | null
          external_post_url?: string | null
          generated_content?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          job_assignment_id?: string | null
          media_instructions?: string | null
          platform?: string
          published_at?: string | null
          scheduled_post_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_content_drafts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_content_drafts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_content_drafts_job_assignment_id_fkey"
            columns: ["job_assignment_id"]
            isOneToOne: false
            referencedRelation: "job_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_content_drafts_scheduled_post_id_fkey"
            columns: ["scheduled_post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_notification_preferences: {
        Row: {
          browser_push_enabled: boolean | null
          company_id: string
          created_at: string
          email_alerts_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          notify_job_updates: boolean | null
          notify_missed_calls: boolean | null
          notify_new_bookings: boolean | null
          notify_new_email: boolean | null
          notify_new_sms: boolean | null
          sms_alerts_enabled: boolean | null
          sms_phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          browser_push_enabled?: boolean | null
          company_id: string
          created_at?: string
          email_alerts_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notify_job_updates?: boolean | null
          notify_missed_calls?: boolean | null
          notify_new_bookings?: boolean | null
          notify_new_email?: boolean | null
          notify_new_sms?: boolean | null
          sms_alerts_enabled?: boolean | null
          sms_phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          browser_push_enabled?: boolean | null
          company_id?: string
          created_at?: string
          email_alerts_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notify_job_updates?: boolean | null
          notify_missed_calls?: boolean | null
          notify_new_bookings?: boolean | null
          notify_new_email?: boolean | null
          notify_new_sms?: boolean | null
          sms_alerts_enabled?: boolean | null
          sms_phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notification_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_notification_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_notifications: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          read_at: string | null
          recipient_id: string | null
          recipient_role: string | null
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_notifications_company_id_fkey"
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
      subscription_usage_tracking: {
        Row: {
          ai_requests: number | null
          company_id: string
          created_at: string
          emails_sent: number | null
          id: string
          month_year: string
          sms_sent: number | null
          updated_at: string
          voice_minutes: number | null
        }
        Insert: {
          ai_requests?: number | null
          company_id: string
          created_at?: string
          emails_sent?: number | null
          id?: string
          month_year: string
          sms_sent?: number | null
          updated_at?: string
          voice_minutes?: number | null
        }
        Update: {
          ai_requests?: number | null
          company_id?: string
          created_at?: string
          emails_sent?: number | null
          id?: string
          month_year?: string
          sms_sent?: number | null
          updated_at?: string
          voice_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_tracking_company_id_fkey"
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
          google_business_access_token: string | null
          google_business_account_id: string | null
          google_business_client_id: string | null
          google_business_client_secret: string | null
          google_business_location_id: string | null
          google_business_refresh_token: string | null
          google_calendar_enabled: boolean | null
          google_calendar_id: string | null
          google_refresh_token: string | null
          google_tts_api_key: string | null
          google_tts_model: string | null
          google_tts_voice: string | null
          id: string
          linkedin_access_token: string | null
          linkedin_client_id: string | null
          linkedin_client_secret: string | null
          linkedin_organization_id: string | null
          linkedin_token_expires_at: string | null
          meta_app_id: string | null
          meta_app_secret: string | null
          meta_instagram_account_id: string | null
          meta_page_access_token: string | null
          meta_page_id: string | null
          meta_token_expires_at: string | null
          openai_api_key: string | null
          openai_tts_model: string | null
          openai_tts_voice: string | null
          resend_api_key: string | null
          signalwire_api_token: string | null
          signalwire_phone_number: string | null
          signalwire_project_id: string | null
          signalwire_space_url: string | null
          stripe_publishable_key: string | null
          stripe_secret_key: string | null
          stripe_webhook_secret: string | null
          tavily_api_key: string | null
          tiktok_access_token: string | null
          tiktok_client_key: string | null
          tiktok_client_secret: string | null
          tiktok_open_id: string | null
          tiktok_token_expires_at: string | null
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
          google_business_access_token?: string | null
          google_business_account_id?: string | null
          google_business_client_id?: string | null
          google_business_client_secret?: string | null
          google_business_location_id?: string | null
          google_business_refresh_token?: string | null
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_tts_api_key?: string | null
          google_tts_model?: string | null
          google_tts_voice?: string | null
          id?: string
          linkedin_access_token?: string | null
          linkedin_client_id?: string | null
          linkedin_client_secret?: string | null
          linkedin_organization_id?: string | null
          linkedin_token_expires_at?: string | null
          meta_app_id?: string | null
          meta_app_secret?: string | null
          meta_instagram_account_id?: string | null
          meta_page_access_token?: string | null
          meta_page_id?: string | null
          meta_token_expires_at?: string | null
          openai_api_key?: string | null
          openai_tts_model?: string | null
          openai_tts_voice?: string | null
          resend_api_key?: string | null
          signalwire_api_token?: string | null
          signalwire_phone_number?: string | null
          signalwire_project_id?: string | null
          signalwire_space_url?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          tavily_api_key?: string | null
          tiktok_access_token?: string | null
          tiktok_client_key?: string | null
          tiktok_client_secret?: string | null
          tiktok_open_id?: string | null
          tiktok_token_expires_at?: string | null
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
          google_business_access_token?: string | null
          google_business_account_id?: string | null
          google_business_client_id?: string | null
          google_business_client_secret?: string | null
          google_business_location_id?: string | null
          google_business_refresh_token?: string | null
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_tts_api_key?: string | null
          google_tts_model?: string | null
          google_tts_voice?: string | null
          id?: string
          linkedin_access_token?: string | null
          linkedin_client_id?: string | null
          linkedin_client_secret?: string | null
          linkedin_organization_id?: string | null
          linkedin_token_expires_at?: string | null
          meta_app_id?: string | null
          meta_app_secret?: string | null
          meta_instagram_account_id?: string | null
          meta_page_access_token?: string | null
          meta_page_id?: string | null
          meta_token_expires_at?: string | null
          openai_api_key?: string | null
          openai_tts_model?: string | null
          openai_tts_voice?: string | null
          resend_api_key?: string | null
          signalwire_api_token?: string | null
          signalwire_phone_number?: string | null
          signalwire_project_id?: string | null
          signalwire_space_url?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          tavily_api_key?: string | null
          tiktok_access_token?: string | null
          tiktok_client_key?: string | null
          tiktok_client_secret?: string | null
          tiktok_open_id?: string | null
          tiktok_token_expires_at?: string | null
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
      tenant_integrations_safe: {
        Row: {
          company_id: string | null
          created_at: string | null
          elevenlabs_agent_id: string | null
          elevenlabs_voice_id: string | null
          elevenlabs_voice_similarity: number | null
          elevenlabs_voice_speed: number | null
          elevenlabs_voice_stability: number | null
          elevenlabs_voice_style: number | null
          google_calendar_enabled: boolean | null
          google_calendar_id: string | null
          google_tts_model: string | null
          google_tts_voice: string | null
          has_elevenlabs: boolean | null
          has_google: boolean | null
          has_openai: boolean | null
          has_resend: boolean | null
          has_signalwire: boolean | null
          has_stripe: boolean | null
          has_tavily: boolean | null
          has_twilio: boolean | null
          id: string | null
          openai_tts_model: string | null
          openai_tts_voice: string | null
          signalwire_phone_number: string | null
          signalwire_project_id: string | null
          signalwire_space_url: string | null
          stripe_publishable_key: string | null
          tts_monthly_limit: number | null
          tts_provider: string | null
          twilio_phone_number: string | null
          updated_at: string | null
          use_platform_tts: boolean | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          elevenlabs_agent_id?: string | null
          elevenlabs_voice_id?: string | null
          elevenlabs_voice_similarity?: number | null
          elevenlabs_voice_speed?: number | null
          elevenlabs_voice_stability?: number | null
          elevenlabs_voice_style?: number | null
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          google_tts_model?: string | null
          google_tts_voice?: string | null
          has_elevenlabs?: never
          has_google?: never
          has_openai?: never
          has_resend?: never
          has_signalwire?: never
          has_stripe?: never
          has_tavily?: never
          has_twilio?: never
          id?: string | null
          openai_tts_model?: string | null
          openai_tts_voice?: string | null
          signalwire_phone_number?: string | null
          signalwire_project_id?: string | null
          signalwire_space_url?: string | null
          stripe_publishable_key?: string | null
          tts_monthly_limit?: number | null
          tts_provider?: string | null
          twilio_phone_number?: string | null
          updated_at?: string | null
          use_platform_tts?: boolean | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          elevenlabs_agent_id?: string | null
          elevenlabs_voice_id?: string | null
          elevenlabs_voice_similarity?: number | null
          elevenlabs_voice_speed?: number | null
          elevenlabs_voice_stability?: number | null
          elevenlabs_voice_style?: number | null
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          google_tts_model?: string | null
          google_tts_voice?: string | null
          has_elevenlabs?: never
          has_google?: never
          has_openai?: never
          has_resend?: never
          has_signalwire?: never
          has_stripe?: never
          has_tavily?: never
          has_twilio?: never
          id?: string | null
          openai_tts_model?: string | null
          openai_tts_voice?: string | null
          signalwire_phone_number?: string | null
          signalwire_project_id?: string | null
          signalwire_space_url?: string | null
          stripe_publishable_key?: string | null
          tts_monthly_limit?: number | null
          tts_provider?: string | null
          twilio_phone_number?: string | null
          updated_at?: string | null
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
    }
    Functions: {
      backfill_service_catalog_defaults: { Args: never; Returns: number }
      can_view_company: { Args: { _company_id: string }; Returns: boolean }
      check_integration_configured: {
        Args: { p_company_id: string; p_integration_type: string }
        Returns: boolean
      }
      check_visitor_limit: {
        Args: { p_website_id: string }
        Returns: {
          allowed: boolean
          current_views: number
          monthly_limit: number
          usage_percentage: number
        }[]
      }
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
      get_autonomy_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          jobname: string
          last_run_at: string
          last_status: string
          schedule: string
        }[]
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
      get_company_feature_flags: {
        Args: { p_company_id: string }
        Returns: {
          has_phone: boolean
          has_sms: boolean
          has_voice_chat: boolean
          twilio_phone_number: string
        }[]
      }
      get_company_industry_pack: {
        Args: { p_company_id: string }
        Returns: {
          agent_prompt_deltas: Json
          appointment_rules: Json
          checklist_library: Json
          cluster: string
          console_visibility: Json
          created_at: string
          customer_intake_schema: Json
          dashboard_widgets: Json
          description: string | null
          extra_operatives: Json
          form_schemas: Json
          icon: string | null
          id: string
          industry_id: string
          inventory_taxonomy: Json
          invoice_template: Json
          is_active: boolean
          job_templates: Json
          kb_seed_documents: Json
          label: string
          min_tier_per_extra: Json
          quote_template: Json
          service_catalog: Json
          service_type_options: Json
          terminology: Json
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "industry_template_packs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_company_public_info: {
        Args: { p_slug: string }
        Returns: {
          business_phone: string
          contact_phone: string
          id: string
          logo_url: string
          name: string
          phone: string
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
          address: string
          business_phone: string
          contact_address: string
          contact_email: string
          contact_phone: string
          dispatch_phone: string
          email: string
          id: string
          logo_url: string
          name: string
          phone: string
          primary_color: string
          public_app_url: string
          review_facebook_url: string
          review_google_url: string
          review_yelp_url: string
          secondary_color: string
          service_area_cities: string[]
          service_area_zip_codes: string[]
          service_categories: string[]
          slug: string
          subscription_tier: string
          trial_ends_at: string
        }[]
      }
      get_demo_trial_access: {
        Args: { p_trial_id: string }
        Returns: {
          admin_email: string
          company_id: string
          customer_email: string
          employee_email: string
          expires_at: string
          industry: string
          status: string
          trial_id: string
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
      get_public_industry_pack: {
        Args: { p_company_id: string }
        Returns: {
          appointment_rules: Json
          customer_intake_schema: Json
          form_schemas: Json
          industry_id: string
          inventory_taxonomy: Json
          job_templates: Json
          label: string
          service_catalog: Json
          service_type_options: Json
          terminology: Json
        }[]
      }
      get_smart_website_public_config: {
        Args: { p_subdomain: string }
        Returns: {
          about_header: string
          about_image_url: string
          about_paragraph: string
          about_subheader: string
          background_image_url: string
          background_style: string
          booking_widget_mode: string
          company_id: string
          contact_address: string
          contact_email: string
          contact_name: string
          contact_phone: string
          contact_title: string
          cta_button_text: string
          cta_button_url: string
          emergency_cta_text: string
          emergency_cta_url: string
          enable_night_mode: boolean
          gallery_images: string[]
          hero_headline: string
          hero_subheadline: string
          id: string
          is_published: boolean
          logo_transparency_mode: string
          night_end_hour: number
          night_header: string
          night_start_hour: number
          night_subheadline: string
          show_about_section: boolean
          show_blog: boolean
          show_booking_widget: boolean
          show_chat_widget: boolean
          show_console_appointments: boolean
          show_console_billing: boolean
          show_console_emergency: boolean
          show_console_feedback: boolean
          show_console_quotes: boolean
          show_console_tracking: boolean
          show_contact: boolean
          show_emergency_hours: boolean
          show_field_hours: boolean
          show_gallery: boolean
          show_holidays: boolean
          show_hours: boolean
          show_services: boolean
          show_voice_widget: boolean
          subdomain: string
        }[]
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_website_active_holiday: {
        Args: { p_check_date?: string; p_website_id: string }
        Returns: {
          custom_cta_text: string
          custom_cta_url: string
          custom_headline: string
          custom_subheadline: string
          holiday_name: string
        }[]
      }
      get_website_by_custom_domain: {
        Args: { p_domain: string }
        Returns: {
          company_id: string
          subdomain: string
          website_id: string
        }[]
      }
      get_website_public_data: {
        Args: { website_subdomain: string }
        Returns: {
          about_header: string
          about_image_url: string
          about_paragraph: string
          about_subheader: string
          background_image_url: string
          background_style: string
          booking_widget_mode: string
          company_id: string
          company_logo_url: string
          company_name: string
          company_slug: string
          cta_text: string
          cta_url: string
          gallery_images: string[]
          hero_headline: string
          hero_subheadline: string
          id: string
          is_published: boolean
          logo_transparency_mode: string
          night_cta_text: string
          night_cta_url: string
          night_end_hour: number
          night_header: string
          night_mode_enabled: boolean
          night_start_hour: number
          night_subheadline: string
          primary_color: string
          show_about_section: boolean
          show_blog: boolean
          show_booking_widget: boolean
          show_chat_widget: boolean
          show_contact: boolean
          show_gallery: boolean
          show_hours: boolean
          show_services: boolean
          show_voice_widget: boolean
          subscription_tier: string
          trial_ends_at: string
        }[]
      }
      get_website_public_hours: {
        Args: { p_subdomain: string }
        Returns: {
          close_time: string
          day_of_week: number
          is_closed: boolean
          open_time: string
        }[]
      }
      has_agent_access: {
        Args: { _agent_type: string; _user_id: string }
        Returns: boolean
      }
      has_billing_access: { Args: { _user_id: string }; Returns: boolean }
      has_company_full_access: { Args: { _user_id: string }; Returns: boolean }
      has_dispatch_access: { Args: { _user_id: string }; Returns: boolean }
      has_feature_access: {
        Args: { _feature: string; _user_id: string }
        Returns: boolean
      }
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
      increment_keyword_hit: {
        Args: { keyword_id: string }
        Returns: undefined
      }
      increment_site_metric: {
        Args: { p_metric: string; p_website_id: string }
        Returns: undefined
      }
      intake_field_completeness: {
        Args: { p_source: string }
        Returns: {
          field: string
          filled: number
          pct: number
          total: number
        }[]
      }
      intake_field_distribution: {
        Args: { p_field: string; p_since?: string; p_source: string }
        Returns: {
          bucket: string
          count: number
        }[]
      }
      intake_field_timeseries: {
        Args: { p_field: string; p_months?: number; p_source: string }
        Returns: {
          count: number
          distinct_values: number
          period: string
        }[]
      }
      is_assigned_to_job: {
        Args: { _appointment_id: string; _user_id: string }
        Returns: boolean
      }
      is_customer: { Args: { _user_id: string }; Returns: boolean }
      list_companies_admin: {
        Args: never
        Returns: {
          id: string
          is_demo: boolean
          logo_url: string
          name: string
          primary_color: string
          slug: string
        }[]
      }
      list_companies_for_customer: {
        Args: { p_industry?: string; p_search?: string; p_zip?: string }
        Returns: {
          business_phone: string
          contact_phone: string
          id: string
          industry_vertical: string
          logo_url: string
          name: string
          phone: string
          primary_color: string
          secondary_color: string
          service_area_cities: string[]
          service_area_zip_codes: string[]
          service_categories: string[]
          slug: string
          subscription_tier: string
        }[]
      }
      list_companies_public: {
        Args: never
        Returns: {
          business_phone: string
          contact_phone: string
          id: string
          industry_vertical: string
          logo_url: string
          name: string
          phone: string
          primary_color: string
          secondary_color: string
          service_area_cities: string[]
          service_area_zip_codes: string[]
          service_categories: string[]
          slug: string
          subscription_tier: string
        }[]
      }
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
      regenerate_customer_token: {
        Args: { p_appointment_id: string }
        Returns: string
      }
      search_intake_data: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          customer_name: string
          datetime: string
          id: string
          intake_data: Json
          match_field: string
          match_value: string
          service_type: string
          status: string
        }[]
      }
      search_lead_intake_data: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          created_at: string
          id: string
          intake_data: Json
          match_field: string
          match_value: string
          name: string
          service_interest: string
          status: string
        }[]
      }
      seed_company_starter_data: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      seed_industry_pack_kb_for_company: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      submit_public_booking: {
        Args: {
          p_address?: string
          p_company_id: string
          p_email?: string
          p_intake_data?: Json
          p_name: string
          p_notes?: string
          p_phone: string
          p_preferred_datetime?: string
          p_service_interest?: string
        }
        Returns: string
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
      compliance_doc_status: "pending" | "approved" | "rejected"
      compliance_doc_type: "dba" | "ein" | "formation" | "other"
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
        | "manager"
      issue_severity: "critical" | "high" | "medium" | "low"
      issue_status:
        | "new"
        | "acknowledged"
        | "in_progress"
        | "resolved"
        | "wont_fix"
      issue_type:
        | "frontend_error"
        | "ai_agent_error"
        | "api_error"
        | "user_reported"
        | "feature_request"
      scheduled_post_status:
        | "draft"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
      social_platform:
        | "facebook"
        | "instagram"
        | "linkedin"
        | "tiktok"
        | "google_business"
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
      compliance_doc_status: ["pending", "approved", "rejected"],
      compliance_doc_type: ["dba", "ein", "formation", "other"],
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
        "manager",
      ],
      issue_severity: ["critical", "high", "medium", "low"],
      issue_status: [
        "new",
        "acknowledged",
        "in_progress",
        "resolved",
        "wont_fix",
      ],
      issue_type: [
        "frontend_error",
        "ai_agent_error",
        "api_error",
        "user_reported",
        "feature_request",
      ],
      scheduled_post_status: [
        "draft",
        "scheduled",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
      social_platform: [
        "facebook",
        "instagram",
        "linkedin",
        "tiktok",
        "google_business",
      ],
    },
  },
} as const
