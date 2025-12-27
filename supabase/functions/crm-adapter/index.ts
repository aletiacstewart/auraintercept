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

// Salesforce Adapter Implementation
class SalesforceAdapter implements CRMAdapter {
  private accessToken: string;
  private instanceUrl: string;
  private apiVersion = 'v59.0';

  constructor(accessToken: string, instanceUrl: string) {
    this.accessToken = accessToken;
    this.instanceUrl = instanceUrl.replace(/\/$/, '');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.instanceUrl}/services/data/${this.apiVersion}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Salesforce API error: ${response.status} - ${error}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request('/sobjects/Contact/describe');
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error };
    }
  }

  async getContacts(limit = 100): Promise<CRMContact[]> {
    const query = encodeURIComponent(`SELECT Id, Email, FirstName, LastName, Phone, Account.Name FROM Contact LIMIT ${limit}`);
    const data = await this.request(`/query?q=${query}`);
    return (data.records || []).map((c: any) => ({
      id: c.Id,
      email: c.Email,
      firstName: c.FirstName,
      lastName: c.LastName,
      phone: c.Phone,
      company: c.Account?.Name,
      properties: c,
    }));
  }

  async getContact(id: string): Promise<CRMContact | null> {
    try {
      const c = await this.request(`/sobjects/Contact/${id}`);
      return {
        id: c.Id,
        email: c.Email,
        firstName: c.FirstName,
        lastName: c.LastName,
        phone: c.Phone,
        company: c.Account?.Name,
        properties: c,
      };
    } catch {
      return null;
    }
  }

  async createContact(contact: CRMContact): Promise<CRMContact> {
    const data = await this.request('/sobjects/Contact', {
      method: 'POST',
      body: JSON.stringify({
        Email: contact.email,
        FirstName: contact.firstName,
        LastName: contact.lastName || contact.firstName || 'Unknown',
        Phone: contact.phone,
      }),
    });
    return {
      id: data.id,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      company: contact.company,
    };
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    const updateData: Record<string, unknown> = {};
    if (contact.email) updateData.Email = contact.email;
    if (contact.firstName) updateData.FirstName = contact.firstName;
    if (contact.lastName) updateData.LastName = contact.lastName;
    if (contact.phone) updateData.Phone = contact.phone;

    await this.request(`/sobjects/Contact/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });

    return { id, ...contact } as CRMContact;
  }

  async getDeals(limit = 100): Promise<CRMDeal[]> {
    const query = encodeURIComponent(`SELECT Id, Name, Amount, StageName FROM Opportunity LIMIT ${limit}`);
    const data = await this.request(`/query?q=${query}`);
    return (data.records || []).map((d: any) => ({
      id: d.Id,
      name: d.Name,
      amount: d.Amount,
      stage: d.StageName,
      properties: d,
    }));
  }

  async createDeal(deal: CRMDeal): Promise<CRMDeal> {
    const data = await this.request('/sobjects/Opportunity', {
      method: 'POST',
      body: JSON.stringify({
        Name: deal.name,
        Amount: deal.amount,
        StageName: deal.stage || 'Prospecting',
        CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }),
    });
    return {
      id: data.id,
      name: deal.name,
      amount: deal.amount,
      stage: deal.stage,
    };
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const updateData: Record<string, unknown> = {};
    if (deal.name) updateData.Name = deal.name;
    if (deal.amount !== undefined) updateData.Amount = deal.amount;
    if (deal.stage) updateData.StageName = deal.stage;

    await this.request(`/sobjects/Opportunity/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });

    return { id, ...deal } as CRMDeal;
  }

  async logActivity(activity: CRMActivity): Promise<CRMActivity> {
    const taskData: Record<string, unknown> = {
      Subject: activity.subject || `${activity.type} Activity`,
      Description: activity.body,
      Status: 'Completed',
      Priority: 'Normal',
      ActivityDate: activity.timestamp ? new Date(activity.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    };

    if (activity.contactId) {
      taskData.WhoId = activity.contactId;
    }

    const data = await this.request('/sobjects/Task', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });

    return {
      id: data.id,
      ...activity,
    };
  }

  async getActivities(contactId: string): Promise<CRMActivity[]> {
    const query = encodeURIComponent(`SELECT Id, Subject, Description, Status, ActivityDate FROM Task WHERE WhoId = '${contactId}' ORDER BY ActivityDate DESC LIMIT 50`);
    const data = await this.request(`/query?q=${query}`);
    return (data.records || []).map((t: any) => ({
      id: t.Id,
      type: 'task' as const,
      subject: t.Subject,
      body: t.Description,
      contactId,
      timestamp: t.ActivityDate,
    }));
  }
}

// Zoho CRM Adapter Implementation
class ZohoAdapter implements CRMAdapter {
  private accessToken: string;
  private baseUrl: string;

  constructor(accessToken: string, datacenter: string = 'com') {
    this.accessToken = accessToken;
    this.baseUrl = `https://www.zohoapis.${datacenter}/crm/v3`;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Zoho CRM API error: ${response.status} - ${error}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request('/Contacts?per_page=1');
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error };
    }
  }

  async getContacts(limit = 100): Promise<CRMContact[]> {
    const data = await this.request(`/Contacts?per_page=${limit}`);
    return (data?.data || []).map((c: any) => ({
      id: c.id,
      email: c.Email,
      firstName: c.First_Name,
      lastName: c.Last_Name,
      phone: c.Phone,
      company: c.Account_Name?.name,
      properties: c,
    }));
  }

  async getContact(id: string): Promise<CRMContact | null> {
    try {
      const data = await this.request(`/Contacts/${id}`);
      const c = data?.data?.[0];
      if (!c) return null;
      return {
        id: c.id,
        email: c.Email,
        firstName: c.First_Name,
        lastName: c.Last_Name,
        phone: c.Phone,
        company: c.Account_Name?.name,
        properties: c,
      };
    } catch {
      return null;
    }
  }

  async createContact(contact: CRMContact): Promise<CRMContact> {
    const data = await this.request('/Contacts', {
      method: 'POST',
      body: JSON.stringify({
        data: [{
          Email: contact.email,
          First_Name: contact.firstName,
          Last_Name: contact.lastName || contact.firstName || 'Unknown',
          Phone: contact.phone,
        }],
      }),
    });
    return {
      id: data?.data?.[0]?.details?.id,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      company: contact.company,
    };
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    const updateData: Record<string, unknown> = {};
    if (contact.email) updateData.Email = contact.email;
    if (contact.firstName) updateData.First_Name = contact.firstName;
    if (contact.lastName) updateData.Last_Name = contact.lastName;
    if (contact.phone) updateData.Phone = contact.phone;

    await this.request(`/Contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: [updateData] }),
    });

    return { id, ...contact } as CRMContact;
  }

  async getDeals(limit = 100): Promise<CRMDeal[]> {
    const data = await this.request(`/Deals?per_page=${limit}`);
    return (data?.data || []).map((d: any) => ({
      id: d.id,
      name: d.Deal_Name,
      amount: d.Amount,
      stage: d.Stage,
      properties: d,
    }));
  }

  async createDeal(deal: CRMDeal): Promise<CRMDeal> {
    const data = await this.request('/Deals', {
      method: 'POST',
      body: JSON.stringify({
        data: [{
          Deal_Name: deal.name,
          Amount: deal.amount,
          Stage: deal.stage || 'Qualification',
          Closing_Date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }],
      }),
    });
    return {
      id: data?.data?.[0]?.details?.id,
      name: deal.name,
      amount: deal.amount,
      stage: deal.stage,
    };
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const updateData: Record<string, unknown> = {};
    if (deal.name) updateData.Deal_Name = deal.name;
    if (deal.amount !== undefined) updateData.Amount = deal.amount;
    if (deal.stage) updateData.Stage = deal.stage;

    await this.request(`/Deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: [updateData] }),
    });

    return { id, ...deal } as CRMDeal;
  }

  async logActivity(activity: CRMActivity): Promise<CRMActivity> {
    const noteData: Record<string, unknown> = {
      Note_Title: activity.subject || `${activity.type} Activity`,
      Note_Content: activity.body,
    };

    if (activity.contactId) {
      noteData.Parent_Id = activity.contactId;
      noteData.se_module = 'Contacts';
    }

    const data = await this.request('/Notes', {
      method: 'POST',
      body: JSON.stringify({ data: [noteData] }),
    });

    return {
      id: data?.data?.[0]?.details?.id,
      ...activity,
    };
  }

  async getActivities(contactId: string): Promise<CRMActivity[]> {
    const data = await this.request(`/Contacts/${contactId}/Notes`);
    return (data?.data || []).map((n: any) => ({
      id: n.id,
      type: 'note' as const,
      subject: n.Note_Title,
      body: n.Note_Content,
      contactId,
      timestamp: n.Created_Time,
    }));
  }
}

// Pipedrive Adapter Implementation
class PipedriveAdapter implements CRMAdapter {
  private apiToken: string;
  private baseUrl = 'https://api.pipedrive.com/v1';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${endpoint}${separator}api_token=${this.apiToken}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pipedrive API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request('/users/me');
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error };
    }
  }

  async getContacts(limit = 100): Promise<CRMContact[]> {
    const data = await this.request(`/persons?limit=${limit}`);
    return (data?.data || []).map((p: any) => ({
      id: p.id?.toString(),
      email: p.email?.[0]?.value,
      firstName: p.first_name,
      lastName: p.last_name,
      phone: p.phone?.[0]?.value,
      company: p.org_name,
      properties: p,
    }));
  }

  async getContact(id: string): Promise<CRMContact | null> {
    try {
      const data = await this.request(`/persons/${id}`);
      const p = data?.data;
      if (!p) return null;
      return {
        id: p.id?.toString(),
        email: p.email?.[0]?.value,
        firstName: p.first_name,
        lastName: p.last_name,
        phone: p.phone?.[0]?.value,
        company: p.org_name,
        properties: p,
      };
    } catch {
      return null;
    }
  }

  async createContact(contact: CRMContact): Promise<CRMContact> {
    const personData: Record<string, unknown> = {
      name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email,
    };
    if (contact.email) personData.email = [{ value: contact.email, primary: true }];
    if (contact.phone) personData.phone = [{ value: contact.phone, primary: true }];

    const data = await this.request('/persons', {
      method: 'POST',
      body: JSON.stringify(personData),
    });

    return {
      id: data?.data?.id?.toString(),
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      company: contact.company,
    };
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    const updateData: Record<string, unknown> = {};
    if (contact.firstName || contact.lastName) {
      updateData.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    }
    if (contact.email) updateData.email = [{ value: contact.email, primary: true }];
    if (contact.phone) updateData.phone = [{ value: contact.phone, primary: true }];

    await this.request(`/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    return { id, ...contact } as CRMContact;
  }

  async getDeals(limit = 100): Promise<CRMDeal[]> {
    const data = await this.request(`/deals?limit=${limit}`);
    return (data?.data || []).map((d: any) => ({
      id: d.id?.toString(),
      name: d.title,
      amount: d.value,
      stage: d.stage_id?.toString(),
      contactId: d.person_id?.toString(),
      properties: d,
    }));
  }

  async createDeal(deal: CRMDeal): Promise<CRMDeal> {
    const dealData: Record<string, unknown> = {
      title: deal.name,
      value: deal.amount,
    };
    if (deal.contactId) dealData.person_id = parseInt(deal.contactId);

    const data = await this.request('/deals', {
      method: 'POST',
      body: JSON.stringify(dealData),
    });

    return {
      id: data?.data?.id?.toString(),
      name: deal.name,
      amount: deal.amount,
      stage: deal.stage,
    };
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const updateData: Record<string, unknown> = {};
    if (deal.name) updateData.title = deal.name;
    if (deal.amount !== undefined) updateData.value = deal.amount;
    if (deal.stage) updateData.stage_id = parseInt(deal.stage);

    await this.request(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    return { id, ...deal } as CRMDeal;
  }

  async logActivity(activity: CRMActivity): Promise<CRMActivity> {
    const activityType = {
      call: 'call',
      email: 'email',
      meeting: 'meeting',
      note: 'task',
      task: 'task',
    }[activity.type] || 'task';

    const activityData: Record<string, unknown> = {
      subject: activity.subject || `${activity.type} Activity`,
      note: activity.body,
      type: activityType,
      done: 1,
      due_date: activity.timestamp ? new Date(activity.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      due_time: activity.timestamp ? new Date(activity.timestamp).toISOString().split('T')[1].substring(0, 5) : '12:00',
    };

    if (activity.contactId) activityData.person_id = parseInt(activity.contactId);
    if (activity.dealId) activityData.deal_id = parseInt(activity.dealId);

    const data = await this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });

    return {
      id: data?.data?.id?.toString(),
      ...activity,
    };
  }

  async getActivities(contactId: string): Promise<CRMActivity[]> {
    const data = await this.request(`/persons/${contactId}/activities?limit=50`);
    return (data?.data || []).map((a: any) => ({
      id: a.id?.toString(),
      type: a.type === 'call' ? 'call' : a.type === 'email' ? 'email' : a.type === 'meeting' ? 'meeting' : 'task',
      subject: a.subject,
      body: a.note,
      contactId,
      timestamp: a.due_date,
    }));
  }
}

// Generic Webhook Adapter Implementation
class WebhookAdapter implements CRMAdapter {
  private webhookUrl: string;
  private authHeader?: string;

  constructor(webhookUrl: string, authToken?: string) {
    this.webhookUrl = webhookUrl;
    this.authHeader = authToken ? `Bearer ${authToken}` : undefined;
  }

  private async sendWebhook(event: string, data: unknown): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authHeader) headers['Authorization'] = this.authHeader;

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Webhook error: ${response.status} - ${error}`);
    }

    const text = await response.text();
    try {
      return text ? JSON.parse(text) : { success: true };
    } catch {
      return { success: true, raw: text };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.sendWebhook('test_connection', { test: true });
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error };
    }
  }

  async getContacts(): Promise<CRMContact[]> {
    // Webhook adapter is primarily for outbound sync
    console.log('Webhook adapter: getContacts not supported for outbound-only webhooks');
    return [];
  }

  async getContact(): Promise<CRMContact | null> {
    console.log('Webhook adapter: getContact not supported for outbound-only webhooks');
    return null;
  }

  async createContact(contact: CRMContact): Promise<CRMContact> {
    const response = await this.sendWebhook('contact.created', contact);
    return {
      id: response?.id || crypto.randomUUID(),
      ...contact,
    };
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    await this.sendWebhook('contact.updated', { id, ...contact });
    return { id, ...contact } as CRMContact;
  }

  async getDeals(): Promise<CRMDeal[]> {
    console.log('Webhook adapter: getDeals not supported for outbound-only webhooks');
    return [];
  }

  async createDeal(deal: CRMDeal): Promise<CRMDeal> {
    const response = await this.sendWebhook('deal.created', deal);
    return {
      id: response?.id || crypto.randomUUID(),
      ...deal,
    };
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    await this.sendWebhook('deal.updated', { id, ...deal });
    return { id, ...deal } as CRMDeal;
  }

  async logActivity(activity: CRMActivity): Promise<CRMActivity> {
    const response = await this.sendWebhook('activity.logged', activity);
    return {
      id: response?.id || crypto.randomUUID(),
      ...activity,
    };
  }

  async getActivities(): Promise<CRMActivity[]> {
    console.log('Webhook adapter: getActivities not supported for outbound-only webhooks');
    return [];
  }
}

// Factory function to get appropriate adapter
function getCRMAdapter(provider: string, credentials: Record<string, string>, settings?: Record<string, unknown>): CRMAdapter {
  switch (provider) {
    case 'hubspot':
      return new HubSpotAdapter(credentials.access_token);
    case 'salesforce':
      return new SalesforceAdapter(credentials.access_token, credentials.instance_url || settings?.instance_url as string || '');
    case 'zoho':
      return new ZohoAdapter(credentials.access_token, settings?.datacenter as string || 'com');
    case 'pipedrive':
      return new PipedriveAdapter(credentials.access_token || credentials.api_token);
    case 'webhook':
      return new WebhookAdapter(settings?.webhook_url as string || credentials.webhook_url, credentials.auth_token);
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

    // Create adapter with settings
    const adapter = getCRMAdapter(
      connection.provider,
      {
        access_token: connection.access_token || '',
        api_token: connection.access_token || '',
        instance_url: (connection.settings as Record<string, unknown>)?.instance_url as string || '',
        webhook_url: (connection.settings as Record<string, unknown>)?.webhook_url as string || '',
        auth_token: connection.access_token || '',
      },
      connection.settings as Record<string, unknown> || {}
    );

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
