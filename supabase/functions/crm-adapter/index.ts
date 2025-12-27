import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CRM Provider Adapter Interface
interface CRMContact {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  properties?: Record<string, unknown>;
}

interface CRMDeal {
  id?: string;
  name: string;
  amount?: number;
  stage?: string;
  contactId?: string;
  properties?: Record<string, unknown>;
}

interface CRMActivity {
  id?: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  subject?: string;
  body?: string;
  contactId?: string;
  dealId?: string;
  timestamp?: string;
}

interface CRMAdapter {
  testConnection(): Promise<{ success: boolean; error?: string }>;
  getContacts(limit?: number): Promise<CRMContact[]>;
  getContact(id: string): Promise<CRMContact | null>;
  createContact(contact: CRMContact): Promise<CRMContact>;
  updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact>;
  getDeals(limit?: number): Promise<CRMDeal[]>;
  createDeal(deal: CRMDeal): Promise<CRMDeal>;
  updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal>;
  logActivity(activity: CRMActivity): Promise<CRMActivity>;
  getActivities(contactId: string): Promise<CRMActivity[]>;
}

// HubSpot Adapter Implementation
class HubSpotAdapter implements CRMAdapter {
  private accessToken: string;
  private baseUrl = 'https://api.hubapi.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request('/crm/v3/objects/contacts?limit=1');
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error };
    }
  }

  async getContacts(limit = 100): Promise<CRMContact[]> {
    const data = await this.request(`/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,phone,company`);
    return data.results.map((c: any) => ({
      id: c.id,
      email: c.properties.email,
      firstName: c.properties.firstname,
      lastName: c.properties.lastname,
      phone: c.properties.phone,
      company: c.properties.company,
      properties: c.properties,
    }));
  }

  async getContact(id: string): Promise<CRMContact | null> {
    try {
      const c = await this.request(`/crm/v3/objects/contacts/${id}?properties=email,firstname,lastname,phone,company`);
      return {
        id: c.id,
        email: c.properties.email,
        firstName: c.properties.firstname,
        lastName: c.properties.lastname,
        phone: c.properties.phone,
        company: c.properties.company,
        properties: c.properties,
      };
    } catch {
      return null;
    }
  }

  async createContact(contact: CRMContact): Promise<CRMContact> {
    const data = await this.request('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          email: contact.email,
          firstname: contact.firstName,
          lastname: contact.lastName,
          phone: contact.phone,
          company: contact.company,
          ...contact.properties,
        },
      }),
    });
    return {
      id: data.id,
      email: data.properties.email,
      firstName: data.properties.firstname,
      lastName: data.properties.lastname,
      phone: data.properties.phone,
      company: data.properties.company,
      properties: data.properties,
    };
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    const properties: Record<string, unknown> = {};
    if (contact.email) properties.email = contact.email;
    if (contact.firstName) properties.firstname = contact.firstName;
    if (contact.lastName) properties.lastname = contact.lastName;
    if (contact.phone) properties.phone = contact.phone;
    if (contact.company) properties.company = contact.company;
    if (contact.properties) Object.assign(properties, contact.properties);

    const data = await this.request(`/crm/v3/objects/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });
    return {
      id: data.id,
      email: data.properties.email,
      firstName: data.properties.firstname,
      lastName: data.properties.lastname,
      phone: data.properties.phone,
      company: data.properties.company,
      properties: data.properties,
    };
  }

  async getDeals(limit = 100): Promise<CRMDeal[]> {
    const data = await this.request(`/crm/v3/objects/deals?limit=${limit}&properties=dealname,amount,dealstage`);
    return data.results.map((d: any) => ({
      id: d.id,
      name: d.properties.dealname,
      amount: d.properties.amount ? parseFloat(d.properties.amount) : undefined,
      stage: d.properties.dealstage,
      properties: d.properties,
    }));
  }

  async createDeal(deal: CRMDeal): Promise<CRMDeal> {
    const data = await this.request('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          dealname: deal.name,
          amount: deal.amount?.toString(),
          dealstage: deal.stage || 'appointmentscheduled',
          ...deal.properties,
        },
      }),
    });
    return {
      id: data.id,
      name: data.properties.dealname,
      amount: data.properties.amount ? parseFloat(data.properties.amount) : undefined,
      stage: data.properties.dealstage,
      properties: data.properties,
    };
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const properties: Record<string, unknown> = {};
    if (deal.name) properties.dealname = deal.name;
    if (deal.amount !== undefined) properties.amount = deal.amount.toString();
    if (deal.stage) properties.dealstage = deal.stage;
    if (deal.properties) Object.assign(properties, deal.properties);

    const data = await this.request(`/crm/v3/objects/deals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });
    return {
      id: data.id,
      name: data.properties.dealname,
      amount: data.properties.amount ? parseFloat(data.properties.amount) : undefined,
      stage: data.properties.dealstage,
      properties: data.properties,
    };
  }

  async logActivity(activity: CRMActivity): Promise<CRMActivity> {
    const engagementType = {
      call: 'CALL',
      email: 'EMAIL',
      meeting: 'MEETING',
      note: 'NOTE',
      task: 'TASK',
    }[activity.type] || 'NOTE';

    const data = await this.request('/crm/v3/objects/notes', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          hs_timestamp: activity.timestamp || new Date().toISOString(),
          hs_note_body: activity.body || activity.subject || '',
        },
        associations: activity.contactId ? [{
          to: { id: activity.contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }],
        }] : [],
      }),
    });

    return {
      id: data.id,
      type: activity.type,
      subject: activity.subject,
      body: activity.body,
      contactId: activity.contactId,
      timestamp: activity.timestamp,
    };
  }

  async getActivities(contactId: string): Promise<CRMActivity[]> {
    const data = await this.request(`/crm/v3/objects/contacts/${contactId}/associations/notes`);
    const activities: CRMActivity[] = [];
    
    for (const assoc of data.results || []) {
      try {
        const note = await this.request(`/crm/v3/objects/notes/${assoc.id}?properties=hs_note_body,hs_timestamp`);
        activities.push({
          id: note.id,
          type: 'note',
          body: note.properties.hs_note_body,
          contactId,
          timestamp: note.properties.hs_timestamp,
        });
      } catch {
        // Skip if note fetch fails
      }
    }
    
    return activities;
  }
}

// Salesforce Adapter Implementation (placeholder)
class SalesforceAdapter implements CRMAdapter {
  private accessToken: string;
  private instanceUrl: string;

  constructor(accessToken: string, instanceUrl: string) {
    this.accessToken = accessToken;
    this.instanceUrl = instanceUrl;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Salesforce adapter not yet implemented' };
  }

  async getContacts(): Promise<CRMContact[]> { return []; }
  async getContact(): Promise<CRMContact | null> { return null; }
  async createContact(contact: CRMContact): Promise<CRMContact> { return contact; }
  async updateContact(_id: string, contact: Partial<CRMContact>): Promise<CRMContact> { return contact as CRMContact; }
  async getDeals(): Promise<CRMDeal[]> { return []; }
  async createDeal(deal: CRMDeal): Promise<CRMDeal> { return deal; }
  async updateDeal(_id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> { return deal as CRMDeal; }
  async logActivity(activity: CRMActivity): Promise<CRMActivity> { return activity; }
  async getActivities(): Promise<CRMActivity[]> { return []; }
}

// Factory function to get appropriate adapter
function getCRMAdapter(provider: string, credentials: Record<string, string>): CRMAdapter {
  switch (provider) {
    case 'hubspot':
      return new HubSpotAdapter(credentials.access_token);
    case 'salesforce':
      return new SalesforceAdapter(credentials.access_token, credentials.instance_url);
    default:
      throw new Error(`Unsupported CRM provider: ${provider}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: 'No company found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const companyId = profile.company_id;
    const { action, ...params } = await req.json();

    console.log(`CRM Adapter action: ${action} for company: ${companyId}`);

    // Handle connection status check (doesn't require active connection)
    if (action === 'check_connection') {
      const { data: connection } = await supabase
        .from('crm_connections')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'connected')
        .maybeSingle();

      return new Response(JSON.stringify({
        connected: !!connection,
        provider: connection?.provider || null,
        lastSyncAt: connection?.last_sync_at || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get active CRM connection
    const { data: connection, error: connError } = await supabase
      .from('crm_connections')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'connected')
      .maybeSingle();

    if (connError) {
      console.error('Error fetching CRM connection:', connError);
      return new Response(JSON.stringify({ error: 'Failed to fetch CRM connection' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no connection, return graceful response
    if (!connection) {
      return new Response(JSON.stringify({
        connected: false,
        message: 'No CRM connected',
        data: null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create adapter
    const adapter = getCRMAdapter(connection.provider, {
      access_token: connection.access_token || '',
      instance_url: connection.settings?.instance_url || '',
    });

    let result: unknown;

    switch (action) {
      case 'test_connection':
        result = await adapter.testConnection();
        break;

      case 'get_contacts':
        result = await adapter.getContacts(params.limit);
        break;

      case 'get_contact':
        result = await adapter.getContact(params.id);
        break;

      case 'create_contact':
        result = await adapter.createContact(params.contact);
        // Log sync
        await supabase.from('crm_sync_logs').insert({
          company_id: companyId,
          connection_id: connection.id,
          entity_type: 'contact',
          direction: 'outbound',
          status: 'completed',
          records_created: 1,
          records_processed: 1,
        });
        break;

      case 'update_contact':
        result = await adapter.updateContact(params.id, params.contact);
        await supabase.from('crm_sync_logs').insert({
          company_id: companyId,
          connection_id: connection.id,
          entity_type: 'contact',
          direction: 'outbound',
          status: 'completed',
          records_updated: 1,
          records_processed: 1,
        });
        break;

      case 'get_deals':
        result = await adapter.getDeals(params.limit);
        break;

      case 'create_deal':
        result = await adapter.createDeal(params.deal);
        await supabase.from('crm_sync_logs').insert({
          company_id: companyId,
          connection_id: connection.id,
          entity_type: 'deal',
          direction: 'outbound',
          status: 'completed',
          records_created: 1,
          records_processed: 1,
        });
        break;

      case 'update_deal':
        result = await adapter.updateDeal(params.id, params.deal);
        await supabase.from('crm_sync_logs').insert({
          company_id: companyId,
          connection_id: connection.id,
          entity_type: 'deal',
          direction: 'outbound',
          status: 'completed',
          records_updated: 1,
          records_processed: 1,
        });
        break;

      case 'log_activity':
        result = await adapter.logActivity(params.activity);
        await supabase.from('crm_sync_logs').insert({
          company_id: companyId,
          connection_id: connection.id,
          entity_type: 'activity',
          direction: 'outbound',
          status: 'completed',
          records_created: 1,
          records_processed: 1,
        });
        break;

      case 'get_activities':
        result = await adapter.getActivities(params.contactId);
        break;

      case 'sync_customer':
        // Sync a local customer to CRM
        const { customerEmail, customerName, customerPhone } = params;
        const nameParts = (customerName || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        result = await adapter.createContact({
          email: customerEmail,
          firstName,
          lastName,
          phone: customerPhone,
        });
        
        // Store mapping
        if (result && (result as CRMContact).id) {
          await supabase.from('crm_entity_mappings').insert({
            company_id: companyId,
            connection_id: connection.id,
            entity_type: 'contact',
            local_entity_id: params.localCustomerId || crypto.randomUUID(),
            crm_entity_id: (result as CRMContact).id,
            crm_entity_type: 'contact',
          });
        }
        break;

      case 'sync_appointment':
        // Log appointment as activity in CRM
        const { appointmentData, crmContactId } = params;
        result = await adapter.logActivity({
          type: 'meeting',
          subject: `Appointment: ${appointmentData.service_type}`,
          body: `Scheduled for ${appointmentData.datetime}. Notes: ${appointmentData.notes || 'None'}`,
          contactId: crmContactId,
          timestamp: appointmentData.datetime,
        });
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Update last sync time
    await supabase
      .from('crm_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id);

    return new Response(JSON.stringify({
      connected: true,
      provider: connection.provider,
      data: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('CRM Adapter error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: errorMessage,
      connected: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
