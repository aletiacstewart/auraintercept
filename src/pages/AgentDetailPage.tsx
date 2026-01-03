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
  Users,
  Truck,
  Briefcase,
  Megaphone,
  BarChart3
} from 'lucide-react';

const AGENT_DEFINITIONS: Record<string, {
  name: string;
  description: string;
  category: string;
  phase: number;
  icon: React.ElementType;
  color: string;
  capabilities: string[];
  configFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'slider';
    options?: { value: string; label: string }[];
    placeholder?: string;
    description?: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: any;
  }>;
}> = {
  triage: {
    name: 'AI Receptionist',
    description: 'First point of contact that classifies customer intent and routes to appropriate specialized agents.',
    category: 'customer_engagement',
    phase: 1,
    icon: Users,
    color: 'text-blue-500',
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
  booking: {
    name: 'Scheduling Agent',
    description: 'Handles appointment scheduling, rescheduling, and cancellations with intelligent slot management.',
    category: 'customer_engagement',
    phase: 1,
    icon: Users,
    color: 'text-blue-500',
    capabilities: [
      'Schedule new appointments',
      'Reschedule existing bookings',
      'Cancel appointments',
      'Check availability',
      'Send confirmations'
    ],
    configFields: [
      { key: 'booking_window_days', label: 'Booking Window (days)', type: 'number', min: 1, max: 90, defaultValue: 30, description: 'How far in advance customers can book' },
      { key: 'min_notice_hours', label: 'Minimum Notice (hours)', type: 'number', min: 0, max: 72, defaultValue: 2, description: 'Minimum hours before appointment for booking' },
      { key: 'allow_same_day', label: 'Allow Same-Day Booking', type: 'switch', defaultValue: true },
      { key: 'auto_confirm', label: 'Auto-Confirm Bookings', type: 'switch', defaultValue: false },
      { key: 'confirmation_message', label: 'Confirmation Message', type: 'textarea', placeholder: 'Your appointment has been confirmed for {date} at {time}.' }
    ]
  },
  followup: {
    name: 'Follow-up Agent',
    description: 'Manages post-service follow-ups, satisfaction checks, and feedback collection.',
    category: 'customer_engagement',
    phase: 1,
    icon: Users,
    color: 'text-blue-500',
    capabilities: [
      'Post-service check-ins',
      'Satisfaction surveys',
      'Issue resolution',
      'Re-engagement campaigns'
    ],
    configFields: [
      { key: 'followup_delay_hours', label: 'Follow-up Delay (hours)', type: 'number', min: 1, max: 168, defaultValue: 24, description: 'Hours after service to send follow-up' },
      { key: 'followup_message', label: 'Follow-up Message', type: 'textarea', placeholder: 'Hi {name}, how was your recent service with us?' },
      { key: 'satisfaction_threshold', label: 'Satisfaction Alert Threshold', type: 'slider', min: 1, max: 5, step: 1, defaultValue: 3, description: 'Rating below this triggers alert' },
      { key: 'auto_escalate_issues', label: 'Auto-Escalate Issues', type: 'switch', defaultValue: true }
    ]
  },
  review: {
    name: 'Social Media Review Agent',
    description: 'Collects and manages customer reviews, handles responses, and monitors reputation.',
    category: 'customer_engagement',
    phase: 1,
    icon: Users,
    color: 'text-blue-500',
    capabilities: [
      'Review request timing',
      'Multi-platform posting',
      'Response generation',
      'Sentiment analysis'
    ],
    configFields: [
      { key: 'google_review_url', label: 'Google Business Profile Review URL', type: 'text', placeholder: 'https://g.page/r/YOUR-BUSINESS/review', description: 'Direct link to your Google Business Profile review page' },
      { key: 'facebook_review_url', label: 'Facebook Review URL', type: 'text', placeholder: 'https://facebook.com/yourpage/reviews', description: 'Direct link to your Facebook page reviews' },
      { key: 'yelp_review_url', label: 'Yelp Review URL', type: 'text', placeholder: 'https://yelp.com/biz/your-business', description: 'Direct link to your Yelp business page' },
      { key: 'review_platforms', label: 'Primary Review Platform', type: 'select', options: [
        { value: 'google', label: 'Google' },
        { value: 'yelp', label: 'Yelp' },
        { value: 'facebook', label: 'Facebook' }
      ], description: 'Default platform to request reviews on' },
      { key: 'review_request_delay', label: 'Request Delay (days)', type: 'number', min: 0, max: 14, defaultValue: 1, description: 'Days after service to send review request' },
      { key: 'min_rating_for_request', label: 'Min Rating to Request Review', type: 'slider', min: 1, max: 5, step: 1, defaultValue: 4, description: 'Only request reviews from customers rating this or higher' },
      { key: 'auto_respond_reviews', label: 'Auto-Respond to Reviews', type: 'switch', defaultValue: false, description: 'Automatically generate responses to customer reviews' }
    ]
  },
  dispatch: {
    name: 'Dispatch Agent',
    description: 'Assigns jobs to field workers based on skills, location, and availability.',
    category: 'field_operations',
    phase: 2,
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
  route: {
    name: 'Route Agent',
    description: 'Optimizes travel routes for field workers to minimize time and fuel costs.',
    category: 'field_operations',
    phase: 2,
    icon: Truck,
    color: 'text-green-500',
    capabilities: [
      'Multi-stop optimization',
      'Traffic consideration',
      'Time window constraints',
      'Real-time re-routing'
    ],
    configFields: [
      { key: 'optimization_priority', label: 'Optimization Priority', type: 'select', options: [
        { value: 'time', label: 'Minimize Time' },
        { value: 'distance', label: 'Minimize Distance' },
        { value: 'balanced', label: 'Balanced' }
      ]},
      { key: 'consider_traffic', label: 'Consider Traffic', type: 'switch', defaultValue: true },
      { key: 'buffer_time_minutes', label: 'Buffer Time (minutes)', type: 'number', min: 0, max: 60, defaultValue: 15 },
      { key: 'max_stops_per_route', label: 'Max Stops Per Route', type: 'number', min: 1, max: 20, defaultValue: 8 }
    ]
  },
  eta: {
    name: 'ETA Agent',
    description: 'Tracks technician location and provides accurate arrival time predictions.',
    category: 'field_operations',
    phase: 2,
    icon: Truck,
    color: 'text-green-500',
    capabilities: [
      'Real-time tracking',
      'ETA calculations',
      'Customer notifications',
      'Delay alerts'
    ],
    configFields: [
      { key: 'update_frequency_minutes', label: 'Update Frequency (minutes)', type: 'number', min: 1, max: 30, defaultValue: 5 },
      { key: 'notify_customer_minutes', label: 'Notify Customer When (minutes away)', type: 'number', min: 5, max: 60, defaultValue: 15 },
      { key: 'delay_threshold_minutes', label: 'Delay Alert Threshold (minutes)', type: 'number', min: 5, max: 30, defaultValue: 10 },
      { key: 'auto_notify_delays', label: 'Auto-Notify on Delays', type: 'switch', defaultValue: true }
    ]
  },
  checkin: {
    name: 'Check-in Agent',
    description: 'Manages job site arrivals, departures, and work verification.',
    category: 'field_operations',
    phase: 2,
    icon: Truck,
    color: 'text-green-500',
    capabilities: [
      'Arrival verification',
      'Photo documentation',
      'Job completion tracking',
      'Customer sign-off'
    ],
    configFields: [
      { key: 'require_photos', label: 'Require Photos', type: 'switch', defaultValue: true },
      { key: 'min_photos', label: 'Minimum Photos Required', type: 'number', min: 0, max: 10, defaultValue: 2 },
      { key: 'geo_fence_meters', label: 'Geo-fence Radius (meters)', type: 'number', min: 10, max: 500, defaultValue: 100 },
      { key: 'require_signature', label: 'Require Customer Signature', type: 'switch', defaultValue: false }
    ]
  },
  quoting: {
    name: 'Quoting Agent',
    description: 'Generates accurate service quotes based on job requirements and pricing rules.',
    category: 'business_operations',
    phase: 3,
    icon: Briefcase,
    color: 'text-purple-500',
    capabilities: [
      'Dynamic pricing',
      'Parts estimation',
      'Labor calculation',
      'Quote delivery'
    ],
    configFields: [
      { key: 'pricing_model', label: 'Pricing Model', type: 'select', options: [
        { value: 'fixed', label: 'Fixed Price' },
        { value: 'hourly', label: 'Hourly Rate' },
        { value: 'hybrid', label: 'Hybrid (Base + Hourly)' }
      ]},
      { key: 'tax_rate', label: 'Tax Rate (%)', type: 'number', min: 0, max: 25, step: 0.1, defaultValue: 0 },
      { key: 'quote_validity_days', label: 'Quote Valid For (days)', type: 'number', min: 1, max: 90, defaultValue: 30 },
      { key: 'include_breakdown', label: 'Include Price Breakdown', type: 'switch', defaultValue: true }
    ]
  },
  invoice: {
    name: 'Invoice Agent',
    description: 'Handles invoicing, payment processing, and collection follow-ups.',
    category: 'business_operations',
    phase: 3,
    icon: Briefcase,
    color: 'text-purple-500',
    capabilities: [
      'Invoice generation',
      'Payment links',
      'Payment reminders',
      'Collection automation'
    ],
    configFields: [
      { key: 'payment_terms_days', label: 'Payment Terms (days)', type: 'number', min: 0, max: 90, defaultValue: 30 },
      { key: 'reminder_schedule', label: 'Reminder Schedule', type: 'select', options: [
        { value: 'none', label: 'No Reminders' },
        { value: 'gentle', label: 'Gentle (7, 14 days)' },
        { value: 'standard', label: 'Standard (3, 7, 14 days)' },
        { value: 'aggressive', label: 'Aggressive (1, 3, 7, 14 days)' }
      ]},
      { key: 'auto_late_fee', label: 'Auto Apply Late Fee', type: 'switch', defaultValue: false },
      { key: 'late_fee_percent', label: 'Late Fee (%)', type: 'number', min: 0, max: 10, step: 0.5, defaultValue: 1.5 }
    ]
  },
  inventory: {
    name: 'Inventory Agent',
    description: 'Tracks parts and supplies, manages stock levels, and handles reordering.',
    category: 'business_operations',
    phase: 3,
    icon: Briefcase,
    color: 'text-purple-500',
    capabilities: [
      'Stock tracking',
      'Low stock alerts',
      'Usage forecasting',
      'Auto-reorder'
    ],
    configFields: [
      { key: 'low_stock_threshold', label: 'Low Stock Alert Threshold', type: 'number', min: 1, max: 100, defaultValue: 10 },
      { key: 'auto_reorder', label: 'Enable Auto-Reorder', type: 'switch', defaultValue: false },
      { key: 'reorder_quantity_multiplier', label: 'Reorder Quantity Multiplier', type: 'slider', min: 1, max: 5, step: 0.5, defaultValue: 2 },
      { key: 'track_by_technician', label: 'Track by Technician', type: 'switch', defaultValue: true }
    ]
  },
  warranty: {
    name: 'Warranty Agent',
    description: 'Manages warranty claims, tracks coverage, and handles claim processing.',
    category: 'business_operations',
    phase: 3,
    icon: Briefcase,
    color: 'text-purple-500',
    capabilities: [
      'Coverage verification',
      'Claim submission',
      'Status tracking',
      'Expiration alerts'
    ],
    configFields: [
      { key: 'default_warranty_days', label: 'Default Warranty (days)', type: 'number', min: 0, max: 730, defaultValue: 90 },
      { key: 'expiration_alert_days', label: 'Expiration Alert (days before)', type: 'number', min: 7, max: 90, defaultValue: 30 },
      { key: 'auto_extend_offers', label: 'Auto-Offer Extended Warranty', type: 'switch', defaultValue: true },
      { key: 'require_photos_for_claims', label: 'Require Photos for Claims', type: 'switch', defaultValue: true }
    ]
  },
  promo: {
    name: 'Promo Agent',
    description: 'Creates and delivers targeted promotional campaigns and special offers.',
    category: 'marketing_sales',
    phase: 4,
    icon: Megaphone,
    color: 'text-orange-500',
    capabilities: [
      'Campaign creation',
      'Audience targeting',
      'Offer personalization',
      'A/B testing'
    ],
    configFields: [
      { key: 'target_segments', label: 'Target Segments', type: 'select', options: [
        { value: 'all', label: 'All Customers' },
        { value: 'inactive', label: 'Inactive Customers' },
        { value: 'high_value', label: 'High-Value Customers' },
        { value: 'new', label: 'New Customers' }
      ]},
      { key: 'max_promos_per_month', label: 'Max Promos Per Month', type: 'number', min: 1, max: 10, defaultValue: 2 },
      { key: 'default_discount_percent', label: 'Default Discount (%)', type: 'number', min: 5, max: 50, defaultValue: 10 },
      { key: 'require_approval', label: 'Require Admin Approval', type: 'switch', defaultValue: true }
    ]
  },
  referral: {
    name: 'Referral Agent',
    description: 'Manages customer referral programs and tracks referral rewards.',
    category: 'marketing_sales',
    phase: 4,
    icon: Megaphone,
    color: 'text-orange-500',
    capabilities: [
      'Referral tracking',
      'Reward calculation',
      'Link generation',
      'Success notifications'
    ],
    configFields: [
      { key: 'referrer_reward', label: 'Referrer Reward ($)', type: 'number', min: 0, max: 100, defaultValue: 25 },
      { key: 'referee_discount', label: 'New Customer Discount (%)', type: 'number', min: 0, max: 50, defaultValue: 10 },
      { key: 'min_spend_for_reward', label: 'Min Spend for Reward ($)', type: 'number', min: 0, max: 500, defaultValue: 50 },
      { key: 'reward_type', label: 'Reward Type', type: 'select', options: [
        { value: 'credit', label: 'Account Credit' },
        { value: 'discount', label: 'Future Discount' },
        { value: 'cash', label: 'Cash/Gift Card' }
      ]}
    ]
  },
  winback: {
    name: 'Win-back Agent',
    description: 'Re-engages churned or inactive customers with personalized outreach.',
    category: 'marketing_sales',
    phase: 4,
    icon: Megaphone,
    color: 'text-orange-500',
    capabilities: [
      'Churn detection',
      'Re-engagement campaigns',
      'Personalized offers',
      'Success tracking'
    ],
    configFields: [
      { key: 'inactive_threshold_days', label: 'Inactive Threshold (days)', type: 'number', min: 30, max: 365, defaultValue: 90 },
      { key: 'winback_offer_percent', label: 'Win-back Offer Discount (%)', type: 'number', min: 5, max: 50, defaultValue: 15 },
      { key: 'max_attempts', label: 'Max Outreach Attempts', type: 'number', min: 1, max: 5, defaultValue: 3 },
      { key: 'outreach_interval_days', label: 'Days Between Attempts', type: 'number', min: 7, max: 30, defaultValue: 14 }
    ]
  },
  seasonal: {
    name: 'Seasonal Agent',
    description: 'Manages seasonal service reminders and maintenance schedules.',
    category: 'marketing_sales',
    phase: 4,
    icon: Megaphone,
    color: 'text-orange-500',
    capabilities: [
      'Seasonal campaigns',
      'Maintenance reminders',
      'Weather-based triggers',
      'Annual scheduling'
    ],
    configFields: [
      { key: 'services', label: 'Seasonal Services', type: 'textarea', placeholder: 'Spring HVAC tune-up, Fall furnace check, etc.', description: 'Seasonal services to promote (one per line)' },
      { key: 'advance_notice_days', label: 'Advance Notice (days)', type: 'number', min: 7, max: 60, defaultValue: 30 },
      { key: 'weather_triggers', label: 'Enable Weather Triggers', type: 'switch', defaultValue: false },
      { key: 'repeat_annually', label: 'Repeat Annually', type: 'switch', defaultValue: true }
    ]
  },
  insights: {
    name: 'Insights Agent',
    description: 'Analyzes business data and provides actionable recommendations.',
    category: 'analytics',
    phase: 5,
    icon: BarChart3,
    color: 'text-cyan-500',
    capabilities: [
      'Trend analysis',
      'Anomaly detection',
      'Performance metrics',
      'Recommendations'
    ],
    configFields: [
      { key: 'report_frequency', label: 'Report Frequency', type: 'select', options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
      ]},
      { key: 'metrics_tracked', label: 'Key Metrics', type: 'textarea', placeholder: 'Revenue, Bookings, Customer Satisfaction, etc.', description: 'Metrics to track (one per line)' },
      { key: 'anomaly_sensitivity', label: 'Anomaly Detection Sensitivity', type: 'slider', min: 1, max: 10, step: 1, defaultValue: 5 },
      { key: 'send_alerts', label: 'Send Alert Notifications', type: 'switch', defaultValue: true }
    ]
  },
  forecast: {
    name: 'Forecast Agent',
    description: 'Predicts demand, revenue, and resource needs based on historical data.',
    category: 'analytics',
    phase: 5,
    icon: BarChart3,
    color: 'text-cyan-500',
    capabilities: [
      'Demand forecasting',
      'Revenue prediction',
      'Capacity planning',
      'Trend projection'
    ],
    configFields: [
      { key: 'forecast_horizon_days', label: 'Forecast Horizon (days)', type: 'number', min: 7, max: 365, defaultValue: 30 },
      { key: 'confidence_threshold', label: 'Confidence Threshold (%)', type: 'slider', min: 50, max: 95, step: 5, defaultValue: 80 },
      { key: 'include_seasonality', label: 'Include Seasonality', type: 'switch', defaultValue: true },
      { key: 'update_frequency', label: 'Update Frequency', type: 'select', options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' }
      ]}
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
                <Badge key={cap} variant="outline" className="py-1 px-3">
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
