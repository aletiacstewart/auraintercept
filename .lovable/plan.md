
# Fix Missing Agent Definitions in AgentDetailPage

## Problem
When clicking "Configure" on the Web Presence Agent, the page shows "Agent Not Found" because the `AGENT_DEFINITIONS` object in `AgentDetailPage.tsx` doesn't include definitions for `web_presence` and `lead` agents.

---

## Solution
Add the missing agent definitions to the `AGENT_DEFINITIONS` object in `AgentDetailPage.tsx`.

---

## Changes

**File:** `src/pages/AgentDetailPage.tsx`

### 1. Add Import for Globe icon (line 27)
Add `Globe` to the existing lucide-react imports for the web_presence agent icon.

### 2. Add `lead` Agent Definition (after creative agent ~line 578)
```typescript
lead: {
  name: 'Lead Agent',
  description: 'Captures and qualifies incoming leads, manages lead scoring, and routes prospects to appropriate follow-up workflows.',
  category: 'marketing_sales',
  phase: 2,
  icon: Users,
  color: 'text-feature-marketing',
  capabilities: [
    'Lead capture & intake',
    'Lead qualification scoring',
    'Source tracking',
    'Automated follow-up assignment',
    'CRM integration'
  ],
  configFields: [
    { key: 'auto_qualify', label: 'Auto-Qualify Leads', type: 'switch', defaultValue: true, description: 'Automatically score and qualify incoming leads' },
    { key: 'qualification_threshold', label: 'Qualification Score Threshold', type: 'slider', min: 1, max: 100, step: 5, defaultValue: 50, description: 'Minimum score to be considered qualified' },
    { key: 'response_time_hours', label: 'Target Response Time (hours)', type: 'number', min: 1, max: 48, defaultValue: 2 },
    { key: 'auto_assign', label: 'Auto-Assign to Sales Rep', type: 'switch', defaultValue: false },
    { key: 'notify_on_high_value', label: 'Alert on High-Value Leads', type: 'switch', defaultValue: true }
  ]
}
```

### 3. Add `web_presence` Agent Definition (after lead agent)
```typescript
web_presence: {
  name: 'Web Presence Agent',
  description: 'AI-powered website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts from the Content Engine.',
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
}
```

---

## Technical Details

The `AGENT_DEFINITIONS` object (starting at line 29) is used by `AgentDetailPage` to:
1. Validate that an agent exists (line 591)
2. Display the agent's name, description, and capabilities
3. Render the configuration form fields

Without an entry in this object, the page returns "Agent Not Found" on line 598-619.

Both new agents follow the existing pattern:
- `lead` is categorized under `marketing_sales` (alongside `campaign`)
- `web_presence` is categorized under `content_engine` (alongside `creative`)
