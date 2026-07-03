import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAIAgentOrchestrator, AgentInfo } from '@/hooks/useAIAgentOrchestrator';
import { AgentSettingsPanel } from '@/components/ai/agents/AgentSettingsPanel';
import { AgentTestConsole } from '@/components/ai/agents/AgentTestConsole';
import { AgentEventLog } from '@/components/ai/agents/AgentEventLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Settings,
  Play,
  Activity,
  Bot,
} from 'lucide-react';
import { AGENT_REGISTRY } from '@/lib/agentRegistry';
  triage: {
    name: 'AI Receptionist',
    description: 'First point of contact that classifies customer intent and routes to appropriate specialized agents.',
    category: 'customer_engagement',
    phase: 1,
    icon: Users,
    color: 'text-cyan-400',
    capabilities: [
      'Intent classification',
      'Urgency assessment',
      'Initial data collection',
      'Smart routing to specialized agents'
    ],
    configFields: [
      { key: 'greeting_message', label: 'Greeting Message', type: 'textarea', placeholder: 'Hello! How can I help you today?', description: 'Initial greeting shown to customers' },
      { key: 'urgency_keywords', label: 'Urgency Keywords', type: 'textarea', placeholder: 'emergency, urgent, asap, broken', description: 'Keywords that trigger high-priority routing (comma-separated)' },
      { key: 'max_classification_attempts', label: 'Max Classification Attempts', type: 'number', min: 1, max: 5, defaultValue: 3 },
      { key: 'auto_escalate_unknown', label: 'Auto-escalate Unknown Intents', type: 'switch', defaultValue: true }
    ]
  },
  customer_journey: {
    name: 'Customer Journey Agent',
    description: 'Manages the full post-booking relationship: scheduling, post-service follow-up, and review collection.',
    category: 'customer_engagement',
    phase: 2,
    icon: Users,
    color: 'text-cyan-400',
    capabilities: [
      'Schedule, reschedule, and cancel appointments',
      'Post-service check-ins and satisfaction surveys',
      'Issue resolution and re-engagement',
      'Review request timing and multi-platform posting',
      'Response generation and sentiment analysis'
    ],
    configFields: [
      { key: 'booking_window_days', label: 'Booking Window (days)', type: 'number', min: 1, max: 90, defaultValue: 30, description: 'How far in advance customers can book' },
      { key: 'min_notice_hours', label: 'Minimum Notice (hours)', type: 'number', min: 0, max: 72, defaultValue: 2, description: 'Minimum hours before appointment for booking' },
      { key: 'allow_same_day', label: 'Allow Same-Day Booking', type: 'switch', defaultValue: true },
      { key: 'auto_confirm', label: 'Auto-Confirm Bookings', type: 'switch', defaultValue: false },
      { key: 'confirmation_message', label: 'Confirmation Message', type: 'textarea', placeholder: 'Your appointment has been confirmed for {date} at {time}.' },
      { key: 'followup_delay_hours', label: 'Follow-up Delay (hours)', type: 'number', min: 1, max: 168, defaultValue: 24, description: 'Hours after service to send follow-up' },
      { key: 'followup_message', label: 'Follow-up Message', type: 'textarea', placeholder: 'Hi {name}, how was your recent service with us?' },
      { key: 'satisfaction_threshold', label: 'Satisfaction Alert Threshold', type: 'slider', min: 1, max: 5, step: 1, defaultValue: 3, description: 'Rating below this triggers alert' },
      { key: 'auto_escalate_issues', label: 'Auto-Escalate Issues', type: 'switch', defaultValue: true },
      { key: 'google_review_url', label: 'Google Business Profile Review URL', type: 'text', placeholder: 'https://g.page/r/YOUR-BUSINESS/review' },
      { key: 'facebook_review_url', label: 'Facebook Review URL', type: 'text', placeholder: 'https://facebook.com/yourpage/reviews' },
      { key: 'yelp_review_url', label: 'Yelp Review URL', type: 'text', placeholder: 'https://yelp.com/biz/your-business' },
      { key: 'review_platforms', label: 'Primary Review Platform', type: 'select', options: [
        { value: 'google', label: 'Google' },
        { value: 'yelp', label: 'Yelp' },
        { value: 'facebook', label: 'Facebook' }
      ]},
      { key: 'review_request_delay', label: 'Review Request Delay (days)', type: 'number', min: 0, max: 14, defaultValue: 1 },
      { key: 'min_rating_for_request', label: 'Min Rating to Request Review', type: 'slider', min: 1, max: 5, step: 1, defaultValue: 4 },
      { key: 'auto_respond_reviews', label: 'Auto-Respond to Reviews', type: 'switch', defaultValue: false }
    ]
  },
  dispatch: {
    name: 'Dispatch/GPS Console',
    description: 'Assigns jobs to field workers based on skills, location, and availability.',
    category: 'field_operations',
    phase: 1,
    icon: Truck,
    color: 'text-green-500',
    capabilities: [
      'Smart job assignment',
      'Skill matching',
      'Load balancing',
      'Conflict detection'
    ],
    configFields: [
      { key: 'dispatch_mode', label: 'Dispatch Mode', type: 'select', options: [
        { value: 'auto', label: 'Automatic' },
        { value: 'manual', label: 'Manual Approval' },
        { value: 'hybrid', label: 'Hybrid (Suggest + Approve)' }
      ]},
      { key: 'skill_weight', label: 'Skill Match Weight', type: 'slider', min: 0, max: 100, step: 10, defaultValue: 50 },
      { key: 'proximity_weight', label: 'Proximity Weight', type: 'slider', min: 0, max: 100, step: 10, defaultValue: 30 },
      { key: 'workload_weight', label: 'Workload Balance Weight', type: 'slider', min: 0, max: 100, step: 10, defaultValue: 20 }
    ]
  },
  field_navigation: {
    name: 'Field Navigation Agent',
    description: 'Optimizes routes, tracks technician location and ETA, and manages job-site check-in/check-out.',
    category: 'field_operations',
    phase: 2,
    icon: Truck,
    color: 'text-green-500',
    capabilities: [
      'Multi-stop route optimization with traffic consideration',
      'Real-time location tracking and ETA calculation',
      'Customer arrival notifications and delay alerts',
      'Arrival verification with photo documentation',
      'Job completion tracking and customer sign-off'
    ],
    configFields: [
      { key: 'optimization_priority', label: 'Optimization Priority', type: 'select', options: [
        { value: 'time', label: 'Minimize Time' },
        { value: 'distance', label: 'Minimize Distance' },
        { value: 'balanced', label: 'Balanced' }
      ]},
      { key: 'consider_traffic', label: 'Consider Traffic', type: 'switch', defaultValue: true },
      { key: 'buffer_time_minutes', label: 'Buffer Time (minutes)', type: 'number', min: 0, max: 60, defaultValue: 15 },
      { key: 'max_stops_per_route', label: 'Max Stops Per Route', type: 'number', min: 1, max: 20, defaultValue: 8 },
      { key: 'update_frequency_minutes', label: 'Location Update Frequency (minutes)', type: 'number', min: 1, max: 30, defaultValue: 5 },
      { key: 'notify_customer_minutes', label: 'Notify Customer When (minutes away)', type: 'number', min: 5, max: 60, defaultValue: 15 },
      { key: 'delay_threshold_minutes', label: 'Delay Alert Threshold (minutes)', type: 'number', min: 5, max: 30, defaultValue: 10 },
      { key: 'auto_notify_delays', label: 'Auto-Notify on Delays', type: 'switch', defaultValue: true },
      { key: 'require_photos', label: 'Require Check-in Photos', type: 'switch', defaultValue: true },
      { key: 'min_photos', label: 'Minimum Photos Required', type: 'number', min: 0, max: 10, defaultValue: 2 },
      { key: 'geo_fence_meters', label: 'Geo-fence Radius (meters)', type: 'number', min: 10, max: 500, defaultValue: 100 },
      { key: 'require_signature', label: 'Require Customer Signature', type: 'switch', defaultValue: false }
    ]
  },
  business_finance: {
    name: 'Business Finance Agent',
    description: 'Generates quotes, handles invoicing and payment collection, and tracks parts/supply inventory.',
    category: 'business_operations',
    phase: 4,
    icon: Briefcase,
    color: 'text-feature-quotes',
    capabilities: [
      'Dynamic quote generation with parts and labor estimation',
      'Invoice generation, payment links, and collection reminders',
      'Stock tracking with low-stock alerts and auto-reorder',
      'Usage forecasting by technician'
    ],
    configFields: [
      { key: 'pricing_model', label: 'Pricing Model', type: 'select', options: [
        { value: 'fixed', label: 'Fixed Price' },
        { value: 'hourly', label: 'Hourly Rate' },
        { value: 'hybrid', label: 'Hybrid (Base + Hourly)' }
      ]},
      { key: 'tax_rate', label: 'Tax Rate (%)', type: 'number', min: 0, max: 25, step: 0.1, defaultValue: 0 },
      { key: 'quote_validity_days', label: 'Quote Valid For (days)', type: 'number', min: 1, max: 90, defaultValue: 30 },
      { key: 'include_breakdown', label: 'Include Price Breakdown', type: 'switch', defaultValue: true },
      { key: 'payment_terms_days', label: 'Payment Terms (days)', type: 'number', min: 0, max: 90, defaultValue: 30 },
      { key: 'reminder_schedule', label: 'Reminder Schedule', type: 'select', options: [
        { value: 'none', label: 'No Reminders' },
        { value: 'gentle', label: 'Gentle (7, 14 days)' },
        { value: 'standard', label: 'Standard (3, 7, 14 days)' },
        { value: 'aggressive', label: 'Aggressive (1, 3, 7, 14 days)' }
      ]},
      { key: 'auto_late_fee', label: 'Auto Apply Late Fee', type: 'switch', defaultValue: false },
      { key: 'late_fee_percent', label: 'Late Fee (%)', type: 'number', min: 0, max: 10, step: 0.5, defaultValue: 1.5 },
      { key: 'low_stock_threshold', label: 'Low Stock Alert Threshold', type: 'number', min: 1, max: 100, defaultValue: 10 },
      { key: 'auto_reorder', label: 'Enable Auto-Reorder', type: 'switch', defaultValue: false },
      { key: 'reorder_quantity_multiplier', label: 'Reorder Quantity Multiplier', type: 'slider', min: 1, max: 5, step: 0.5, defaultValue: 2 },
      { key: 'track_by_technician', label: 'Track Inventory by Technician', type: 'switch', defaultValue: true }
    ]
  },
  admin: {
    name: 'Admin Agent',
    description: 'Handles administrative tasks, user management, and company configuration.',
    category: 'business_operations',
    phase: 1,
    icon: Briefcase,
    color: 'text-feature-config',
    capabilities: [
      'User management',
      'Company settings',
      'Access control',
      'System configuration'
    ],
    configFields: [
      { key: 'auto_user_approval', label: 'Auto-Approve New Users', type: 'switch', defaultValue: false, description: 'Automatically approve new user registrations' },
      { key: 'session_timeout_hours', label: 'Session Timeout (hours)', type: 'number', min: 1, max: 744, defaultValue: 744 },
      { key: 'require_2fa', label: 'Require 2FA for Admins', type: 'switch', defaultValue: false },
      { key: 'notification_email', label: 'Admin Notification Email', type: 'text', placeholder: 'admin@company.com', description: 'Email for admin notifications' }
    ]
  },
  outreach: {
    name: 'Outreach Agent',
    description: 'Unified marketing and lead agent: promotions, referrals, win-back campaigns, seasonal outreach, and inbound lead capture/qualification.',
    category: 'marketing_sales',
    phase: 1,
    icon: Megaphone,
    color: 'text-feature-marketing',
    capabilities: [
      'Promotional campaigns, referral program management, win-back & seasonal outreach',
      'Audience segmentation and A/B testing',
      'Lead capture, scoring, and qualification',
      'Automated follow-up assignment for new leads'
    ],
    configFields: [
      { key: 'max_campaigns_per_month', label: 'Max Campaigns / Month', type: 'number', min: 1, max: 50, defaultValue: 4 },
      { key: 'require_approval', label: 'Require Admin Approval', type: 'switch', defaultValue: true },
      { key: 'primary_channels', label: 'Primary Channels', type: 'textarea', placeholder: 'Email\nSMS\nSocial' },
      { key: 'brand_voice', label: 'Brand Voice', type: 'textarea', placeholder: 'Friendly, professional, concise' },
      { key: 'target_segments', label: 'Target Segments', type: 'select', options: [
        { value: 'all', label: 'All Customers' },
        { value: 'inactive', label: 'Inactive Customers' },
        { value: 'high_value', label: 'High-Value Customers' },
        { value: 'new', label: 'New Customers' }
      ]},
      { key: 'default_discount_percent', label: 'Default Discount (%)', type: 'number', min: 5, max: 50, defaultValue: 10 },
      { key: 'referrer_reward', label: 'Referrer Reward ($)', type: 'number', min: 0, max: 100, defaultValue: 25 },
      { key: 'referee_discount', label: 'New Customer Discount (%)', type: 'number', min: 0, max: 50, defaultValue: 10 },
      { key: 'min_spend_for_reward', label: 'Min Spend for Reward ($)', type: 'number', min: 0, max: 500, defaultValue: 50 },
      { key: 'reward_type', label: 'Reward Type', type: 'select', options: [
        { value: 'credit', label: 'Account Credit' },
        { value: 'discount', label: 'Future Discount' },
        { value: 'cash', label: 'Cash/Gift Card' }
      ]},
      { key: 'inactive_threshold_days', label: 'Win-back Inactive Threshold (days)', type: 'number', min: 30, max: 365, defaultValue: 90 },
      { key: 'winback_offer_percent', label: 'Win-back Discount (%)', type: 'number', min: 5, max: 50, defaultValue: 15 },
      { key: 'max_attempts', label: 'Max Outreach Attempts', type: 'number', min: 1, max: 5, defaultValue: 3 },
      { key: 'outreach_interval_days', label: 'Days Between Attempts', type: 'number', min: 7, max: 30, defaultValue: 14 },
      { key: 'seasonal_services', label: 'Seasonal Services', type: 'textarea', placeholder: 'Spring HVAC tune-up, Fall furnace check, etc.' },
      { key: 'advance_notice_days', label: 'Seasonal Advance Notice (days)', type: 'number', min: 7, max: 60, defaultValue: 30 },
      { key: 'weather_triggers', label: 'Enable Weather Triggers', type: 'switch', defaultValue: false },
      { key: 'repeat_annually', label: 'Repeat Annually', type: 'switch', defaultValue: true },
      { key: 'auto_qualify', label: 'Auto-Qualify New Leads', type: 'switch', defaultValue: true },
      { key: 'qualification_threshold', label: 'Qualification Score Threshold', type: 'slider', min: 1, max: 100, step: 5, defaultValue: 50 },
      { key: 'response_time_hours', label: 'Target Response Time (hours)', type: 'number', min: 1, max: 48, defaultValue: 2 },
      { key: 'auto_assign', label: 'Auto-Assign Leads to Sales Rep', type: 'switch', defaultValue: false },
      { key: 'notify_on_high_value', label: 'Alert on High-Value Leads', type: 'switch', defaultValue: true }
    ]
  },
  creative_content: {
    name: 'Creative Content Agent',
    description: 'Unified AI content generation and social publishing. Creates on-brand copy, images, and posts for web, social media, campaigns, and blogs; schedules across platforms and tracks performance.',
    category: 'content_engine',
    phase: 1,
    icon: Sparkles,
    color: 'text-pink-400',
    capabilities: [
      'Multi-channel content generation (web, social, campaigns, blogs, SMS)',
      'Brand-voice-consistent copy and hashtag optimization',
      'Content calendar and cross-platform scheduling',
      'Manual Bridge one-click posting and own-API auto-publish',
      'Engagement, reach, and content performance analytics'
    ],
    configFields: [
      { key: 'brand_voice', label: 'Brand Voice', type: 'select', options: [
        { value: 'professional', label: 'Professional' },
        { value: 'friendly', label: 'Friendly' },
        { value: 'casual', label: 'Casual' },
        { value: 'authoritative', label: 'Authoritative' }
      ], defaultValue: 'professional' },
      { key: 'tone', label: 'Tone', type: 'select', options: [
        { value: 'informative', label: 'Informative' },
        { value: 'persuasive', label: 'Persuasive' },
        { value: 'conversational', label: 'Conversational' },
        { value: 'inspirational', label: 'Inspirational' }
      ], defaultValue: 'informative' },
      { key: 'target_audience', label: 'Target Audience', type: 'textarea', placeholder: 'Homeowners, businesses, property managers...' },
      { key: 'content_length', label: 'Default Content Length', type: 'select', options: [
        { value: 'short', label: 'Short (50-100 words)' },
        { value: 'medium', label: 'Medium (100-250 words)' },
        { value: 'long', label: 'Long (250-500 words)' }
      ], defaultValue: 'medium' },
      { key: 'use_research', label: 'Use Real-time Research', type: 'switch', defaultValue: true, description: 'Enhance content with Tavily research' },
      { key: 'default_platforms', label: 'Default Social Platforms', type: 'textarea', placeholder: 'instagram\nfacebook\nlinkedin' },
      { key: 'hashtag_count', label: 'Default Hashtag Count', type: 'number', min: 0, max: 30, defaultValue: 10 },
      { key: 'require_approval', label: 'Require Approval Before Publishing', type: 'switch', defaultValue: true },
      { key: 'auto_schedule', label: 'Auto-Schedule for Optimal Times', type: 'switch', defaultValue: true },
      { key: 'timezone', label: 'Timezone', type: 'select', options: [
        { value: 'America/New_York', label: 'Eastern Time' },
        { value: 'America/Chicago', label: 'Central Time' },
        { value: 'America/Denver', label: 'Mountain Time' },
        { value: 'America/Los_Angeles', label: 'Pacific Time' }
      ]},
      { key: 'posts_per_day', label: 'Max Posts Per Day', type: 'number', min: 1, max: 10, defaultValue: 3 },
      { key: 'weekend_posting', label: 'Enable Weekend Posting', type: 'switch', defaultValue: true },
      { key: 'report_frequency', label: 'Analytics Report Frequency', type: 'select', options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
      ]},
      { key: 'alert_viral_content', label: 'Alert on Viral Content', type: 'switch', defaultValue: true },
      { key: 'engagement_goal', label: 'Engagement Rate Goal (%)', type: 'slider', min: 1, max: 10, step: 0.5, defaultValue: 3 }
    ]
  },
  analytics_intelligence: {
    name: 'Analytics Intelligence Agent',
    description: 'Unified insights, performance, revenue, and forecasting analytics with anomaly detection and recommendations.',
    category: 'business_operations',
    phase: 3,
    icon: BarChart3,
    color: 'text-feature-analytics',
    capabilities: [
      'Trend analysis and anomaly detection',
      'Team and individual performance tracking',
      'Revenue tracking and profitability analysis',
      'Demand and revenue forecasting',
      'Actionable recommendations and alerts'
    ],
    configFields: [
      { key: 'report_frequency', label: 'Report Frequency', type: 'select', options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
      ], defaultValue: 'weekly' },
      { key: 'metrics_tracked', label: 'Key Metrics', type: 'textarea', placeholder: 'Revenue\nBookings\nCustomer Satisfaction\nResponse Time\nCompletion Rate', description: 'Metrics to track (one per line)', defaultValue: 'Revenue\nBookings\nCustomer Satisfaction\nResponse Time\nCompletion Rate\nTechnician Utilization\nAverage Job Duration\nRepeat Customer Rate\nCancellation Rate' },
      { key: 'anomaly_sensitivity', label: 'Anomaly Detection Sensitivity', type: 'slider', min: 1, max: 10, step: 1, defaultValue: 5 },
      { key: 'send_alerts', label: 'Send Alert Notifications', type: 'switch', defaultValue: true },
      { key: 'tracking_period', label: 'Performance Tracking Period', type: 'select', options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
      ], defaultValue: 'weekly' },
      { key: 'show_individual_metrics', label: 'Show Individual Metrics', type: 'switch', defaultValue: true },
      { key: 'show_team_metrics', label: 'Show Team Metrics', type: 'switch', defaultValue: true },
      { key: 'performance_goal_completion', label: 'Goal Completion Target (%)', type: 'slider', min: 50, max: 100, step: 5, defaultValue: 85 },
      { key: 'alert_low_performers', label: 'Alert on Low Performance', type: 'switch', defaultValue: false },
      { key: 'revenue_goal_monthly', label: 'Monthly Revenue Goal ($)', type: 'number', min: 0, max: 1000000, defaultValue: 10000 },
      { key: 'alert_threshold_percent', label: 'Alert When Revenue Below Goal (%)', type: 'slider', min: 50, max: 100, step: 5, defaultValue: 80 },
      { key: 'track_by_service', label: 'Track by Service Type', type: 'switch', defaultValue: true },
      { key: 'track_by_technician', label: 'Track by Technician', type: 'switch', defaultValue: true },
      { key: 'include_projections', label: 'Include Revenue Projections', type: 'switch', defaultValue: true },
      { key: 'forecast_horizon_days', label: 'Forecast Horizon (days)', type: 'number', min: 7, max: 365, defaultValue: 30 },
      { key: 'confidence_threshold', label: 'Forecast Confidence Threshold (%)', type: 'slider', min: 50, max: 95, step: 5, defaultValue: 80 },
      { key: 'include_seasonality', label: 'Include Seasonality in Forecasts', type: 'switch', defaultValue: true }
    ]
  },
  web_presence: {
    name: 'Web Presence Agent',
    description: 'AI website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts from the Content Engine.',
    category: 'content_engine',
    phase: 2,
    icon: Globe,
    color: 'text-purple-400',
    capabilities: [
      'SEO optimization suggestions',
      'Site performance monitoring',
      'Content freshness alerts',
      'Auto-publish blog posts',
      'Meta tag optimization',
      'Broken link detection'
    ],
    configFields: [
      { key: 'auto_publish_blog', label: 'Auto-Publish Blog Posts', type: 'switch', defaultValue: false, description: 'Automatically publish approved blog content' },
      { key: 'seo_scan_frequency', label: 'SEO Scan Frequency', type: 'select', options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
      ], defaultValue: 'weekly' },
      { key: 'performance_alert_threshold', label: 'Performance Alert Threshold (ms)', type: 'number', min: 500, max: 5000, defaultValue: 2000, description: 'Alert when page load exceeds this time' },
      { key: 'check_broken_links', label: 'Check for Broken Links', type: 'switch', defaultValue: true },
      { key: 'content_freshness_days', label: 'Content Freshness Alert (days)', type: 'number', min: 30, max: 365, defaultValue: 90, description: 'Alert when content is older than this' },
      { key: 'auto_meta_suggestions', label: 'Auto-Generate Meta Suggestions', type: 'switch', defaultValue: true }
    ]
  },
  // === INDUSTRY SPECIALISTS ===
  diagnostic: {
    name: 'Diagnostic Specialist',
    description: 'Photo + symptom analysis with likely-fix suggestions and parts recommendations.',
    category: 'industry_specialist',
    phase: 3,
    icon: Wrench,
    color: 'text-amber-400',
    capabilities: ['Photo + symptom analysis', 'Likely-fix suggestions', 'Parts recommendations'],
    configFields: [
      { key: 'confidence_threshold', label: 'Suggestion Confidence Threshold (%)', type: 'slider', min: 50, max: 95, step: 5, defaultValue: 75 },
      { key: 'require_photo', label: 'Require Photo for Diagnosis', type: 'switch', defaultValue: true },
      { key: 'suggest_parts', label: 'Suggest Replacement Parts', type: 'switch', defaultValue: true }
    ]
  },
  permit_code: {
    name: 'Permit & Code Specialist',
    description: 'Local code lookups, permit determinations, and pull-process guidance.',
    category: 'industry_specialist',
    phase: 3,
    icon: FileCheck,
    color: 'text-amber-400',
    capabilities: ['Local code lookups', 'Permit determinations', 'Pull-process guidance'],
    configFields: [
      { key: 'jurisdiction', label: 'Primary Jurisdiction', type: 'text', placeholder: 'City, State' },
      { key: 'auto_flag_required_permits', label: 'Auto-Flag Jobs Needing Permits', type: 'switch', defaultValue: true },
      { key: 'include_fee_estimates', label: 'Include Permit Fee Estimates', type: 'switch', defaultValue: true }
    ]
  },
  site_survey: {
    name: 'Site Survey & Quote Specialist',
    description: 'Pre-install survey workflow, measurements, and takeoff math.',
    category: 'industry_specialist',
    phase: 3,
    icon: Ruler,
    color: 'text-amber-400',
    capabilities: ['Pre-install survey workflow', 'Measurements capture', 'Takeoff math'],
    configFields: [
      { key: 'measurement_unit', label: 'Measurement Unit', type: 'select', options: [
        { value: 'imperial', label: 'Imperial (ft/in)' },
        { value: 'metric', label: 'Metric (m/cm)' }
      ], defaultValue: 'imperial' },
      { key: 'require_survey_photos', label: 'Require Survey Photos', type: 'switch', defaultValue: true },
      { key: 'auto_generate_quote', label: 'Auto-Generate Quote from Survey', type: 'switch', defaultValue: true }
    ]
  },
  insurance_claim: {
    name: 'Insurance Claim Specialist',
    description: 'Damage documentation and claim-ready reports for carriers.',
    category: 'industry_specialist',
    phase: 3,
    icon: ShieldCheck,
    color: 'text-amber-400',
    capabilities: ['Damage documentation', 'Claim-ready report generation', 'Carrier-format exports'],
    configFields: [
      { key: 'default_carrier_format', label: 'Default Carrier Format', type: 'select', options: [
        { value: 'xactimate', label: 'Xactimate' },
        { value: 'symbility', label: 'Symbility' },
        { value: 'generic', label: 'Generic PDF' }
      ], defaultValue: 'generic' },
      { key: 'require_before_after_photos', label: 'Require Before/After Photos', type: 'switch', defaultValue: true },
      { key: 'auto_attach_estimate', label: 'Auto-Attach Line-Item Estimate', type: 'switch', defaultValue: true }
    ]
  },
  listing_writer: {
    name: 'Listing Writer',
    description: 'Drafts listing descriptions, headlines, and feature highlights from property data.',
    category: 'industry_specialist',
    phase: 3,
    icon: FileText,
    color: 'text-amber-400',
    capabilities: ['Listing description drafts', 'Headline generation', 'Feature highlights'],
    configFields: [
      { key: 'tone', label: 'Copy Tone', type: 'select', options: [
        { value: 'luxury', label: 'Luxury' },
        { value: 'family', label: 'Family-Friendly' },
        { value: 'investor', label: 'Investor-Focused' }
      ], defaultValue: 'family' },
      { key: 'target_length_words', label: 'Target Description Length (words)', type: 'number', min: 50, max: 500, defaultValue: 180 },
      { key: 'require_approval', label: 'Require Approval Before Publish', type: 'switch', defaultValue: true }
    ]
  },
  offer_drafter: {
    name: 'Offer Drafter',
    description: 'Composes offer letters, counter-offers, and contingency language for review.',
    category: 'industry_specialist',
    phase: 3,
    icon: PenTool,
    color: 'text-amber-400',
    capabilities: ['Offer letter drafts', 'Counter-offer composition', 'Contingency language'],
    configFields: [
      { key: 'default_contingencies', label: 'Default Contingencies', type: 'textarea', placeholder: 'Inspection\nAppraisal\nFinancing' },
      { key: 'earnest_money_percent', label: 'Default Earnest Money (%)', type: 'number', min: 0, max: 10, step: 0.5, defaultValue: 1 },
      { key: 'require_attorney_review', label: 'Flag for Attorney Review', type: 'switch', defaultValue: true }
    ]
  },
  comp_analyst: {
    name: 'Comp Analyst',
    description: 'Pulls comparable sales and rentals, summarizes pricing position.',
    category: 'industry_specialist',
    phase: 3,
    icon: TrendingUp,
    color: 'text-amber-400',
    capabilities: ['Comparable sales lookup', 'Rental comps', 'Pricing position summary'],
    configFields: [
      { key: 'comp_radius_miles', label: 'Comp Radius (miles)', type: 'number', min: 0.25, max: 10, step: 0.25, defaultValue: 1 },
      { key: 'lookback_months', label: 'Lookback Window (months)', type: 'number', min: 1, max: 24, defaultValue: 6 },
      { key: 'include_pending', label: 'Include Pending Sales', type: 'switch', defaultValue: true }
    ]
  },
  style_consultant: {
    name: 'Style Consultant',
    description: 'Suggests cuts, colors, and treatments based on client photo + history.',
    category: 'industry_specialist',
    phase: 3,
    icon: Scissors,
    color: 'text-amber-400',
    capabilities: ['Cut and color suggestions', 'Treatment recommendations', 'Client history awareness'],
    configFields: [
      { key: 'require_photo', label: 'Require Client Photo', type: 'switch', defaultValue: true },
      { key: 'reference_history', label: 'Reference Past Visits', type: 'switch', defaultValue: true },
      { key: 'suggest_addons', label: 'Suggest Add-On Services', type: 'switch', defaultValue: true }
    ]
  },
  loyalty_coach: {
    name: 'Loyalty Coach',
    description: 'Identifies repeat-visit risk and drafts personalized rebook outreach.',
    category: 'industry_specialist',
    phase: 3,
    icon: Heart,
    color: 'text-amber-400',
    capabilities: ['Repeat-visit risk scoring', 'Personalized rebook outreach', 'Loyalty milestone tracking'],
    configFields: [
      { key: 'rebook_reminder_days', label: 'Rebook Reminder (days after visit)', type: 'number', min: 7, max: 180, defaultValue: 30 },
      { key: 'risk_threshold', label: 'At-Risk Score Threshold', type: 'slider', min: 1, max: 100, step: 5, defaultValue: 60 },
      { key: 'auto_send_outreach', label: 'Auto-Send Rebook Outreach', type: 'switch', defaultValue: false }
    ]
  },
  menu_writer: {
    name: 'Menu Writer',
    description: 'Drafts menu copy, daily specials, and dietary callouts in your brand voice.',
    category: 'industry_specialist',
    phase: 3,
    icon: UtensilsCrossed,
    color: 'text-amber-400',
    capabilities: ['Menu copy drafting', 'Daily specials', 'Dietary callouts'],
    configFields: [
      { key: 'brand_voice', label: 'Brand Voice', type: 'textarea', placeholder: 'Rustic, warm, ingredient-forward' },
      { key: 'include_allergens', label: 'Include Allergen Callouts', type: 'switch', defaultValue: true },
      { key: 'include_dietary_tags', label: 'Include Dietary Tags (V, GF, DF)', type: 'switch', defaultValue: true }
    ]
  },
  reservation_optimizer: {
    name: 'Reservation Optimizer',
    description: 'Reshuffles bookings to maximize covers and minimize gaps.',
    category: 'industry_specialist',
    phase: 3,
    icon: CalendarClock,
    color: 'text-amber-400',
    capabilities: ['Booking reshuffle', 'Cover maximization', 'Gap minimization'],
    configFields: [
      { key: 'turn_time_minutes', label: 'Standard Turn Time (minutes)', type: 'number', min: 30, max: 240, defaultValue: 90 },
      { key: 'buffer_minutes', label: 'Buffer Between Seatings (minutes)', type: 'number', min: 0, max: 30, defaultValue: 10 },
      { key: 'suggest_walk_in_slots', label: 'Suggest Walk-In Slots', type: 'switch', defaultValue: true }
    ]
  },
  task_triager: {
    name: 'Task Triager',
    description: 'Sorts inbound client tasks by urgency, owner, and due date.',
    category: 'industry_specialist',
    phase: 3,
    icon: ListChecks,
    color: 'text-amber-400',
    capabilities: ['Urgency sorting', 'Owner assignment', 'Due-date extraction'],
    configFields: [
      { key: 'urgency_keywords', label: 'Urgency Keywords', type: 'textarea', placeholder: 'urgent, asap, today, EOD' },
      { key: 'default_owner', label: 'Default Owner (if unassigned)', type: 'text', placeholder: 'name@example.com' },
      { key: 'auto_notify_owner', label: 'Auto-Notify Assigned Owner', type: 'switch', defaultValue: true }
    ]
  },
  calendar_optimizer: {
    name: 'Calendar Optimizer',
    description: 'Suggests slot consolidation and travel-time-aware scheduling fixes.',
    category: 'industry_specialist',
    phase: 3,
    icon: CalendarDays,
    color: 'text-amber-400',
    capabilities: ['Slot consolidation suggestions', 'Travel-time-aware scheduling', 'Conflict resolution'],
    configFields: [
      { key: 'travel_buffer_minutes', label: 'Travel Buffer (minutes)', type: 'number', min: 0, max: 60, defaultValue: 15 },
      { key: 'prefer_back_to_back', label: 'Prefer Back-to-Back Bookings', type: 'switch', defaultValue: true },
      { key: 'suggest_consolidation', label: 'Suggest Slot Consolidation', type: 'switch', defaultValue: true }
    ]
  },
  review_responder: {
    name: 'Review Responder',
    description: 'Drafts on-brand responses to new reviews across Google, Yelp, and Facebook.',
    category: 'industry_specialist',
    phase: 3,
    icon: MessageCircleHeart,
    color: 'text-amber-400',
    capabilities: ['Multi-platform review monitoring', 'On-brand response drafting', 'Sentiment-aware tone matching'],
    configFields: [
      { key: 'auto_draft_response', label: 'Auto-Draft Responses', type: 'switch', defaultValue: true },
      { key: 'require_approval_before_post', label: 'Require Approval Before Posting', type: 'switch', defaultValue: true },
      { key: 'respond_to_negative_only', label: 'Only Auto-Draft for Negative Reviews', type: 'switch', defaultValue: false }
    ]
  }
};

export default function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { agents, loading, toggleAgent, updateAgentSettings, companyId } = useAIAgentOrchestrator();
  const [activeTab, setActiveTab] = useState('settings');

  const agentDef = agentId ? AGENT_DEFINITIONS[agentId] : null;
  const agentData = agents.find(a => a.type === agentId);

  if (!agentId || !agentDef) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="p-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Agent Not Found</h3>
            <p className="text-muted-foreground mb-4">The requested agent does not exist.</p>
            <Button onClick={() => navigate('/dashboard/ai-agents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48" />
        </div>
      </DashboardLayout>
    );
  }

  const Icon = agentDef.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/ai-agents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-muted`}>
              <Icon className={`h-8 w-8 ${agentDef.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{agentDef.name}</h1>
                <Badge variant={agentData?.is_enabled ? 'default' : 'secondary'}>
                  {agentData?.is_enabled ? 'Active' : 'Disabled'}
                </Badge>
                <Badge variant="outline">Phase {agentDef.phase}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 max-w-2xl">{agentDef.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Enabled</span>
              <Switch
                checked={agentData?.is_enabled || false}
                onCheckedChange={(enabled) => toggleAgent(agentId, enabled)}
              />
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agentDef.capabilities.map((cap) => (
                <Badge key={cap} variant="outline" className="py-1 px-3 text-white border-white/30">
                  {cap}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="test">
              <Play className="h-4 w-4 mr-2" />
              Test Console
            </TabsTrigger>
            <TabsTrigger value="events">
              <Activity className="h-4 w-4 mr-2" />
              Event Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <AgentSettingsPanel
              agentType={agentId}
              configFields={agentDef.configFields}
              currentSettings={agentData?.settings || {}}
              onSave={(settings) => updateAgentSettings(agentId, settings)}
            />
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <AgentTestConsole
              agentType={agentId}
              agentName={agentDef.name}
              isEnabled={agentData?.is_enabled || false}
              companyId={companyId}
            />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <AgentEventLog 
              agentType={agentId}
              companyId={companyId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
