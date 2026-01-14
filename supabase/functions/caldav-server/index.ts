import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// CalDAV requires specific headers - READ-ONLY mode
const caldavHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, PROPFIND, GET, REPORT',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, depth, if-match, if-none-match',
  'DAV': '1, 2, calendar-access',
  'Allow': 'OPTIONS, PROPFIND, GET, REPORT',
};

// Rate limiting configuration
const RATE_LIMIT = {
  requests: 60,
  windowSeconds: 3600,
};

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(token: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(token);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(token, { count: 1, resetAt: now + RATE_LIMIT.windowSeconds * 1000 });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT.requests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  record.count++;
  return { allowed: true };
}

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const url = new URL(req.url);
  const method = req.method;

  console.log('CalDAV Request:', method, url.pathname);

  // Handle CORS/OPTIONS
  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: caldavHeaders });
  }

  // SECURITY: Reject write operations (PUT, DELETE) - CalDAV is read-only
  // Write operations must be performed through authenticated admin APIs
  if (method === 'PUT' || method === 'DELETE') {
    console.log(`Rejected ${method} request - CalDAV is read-only`);
    return new Response(
      'Write operations are not permitted via CalDAV. Please use the admin interface to modify appointments.', 
      { 
        status: 403, 
        headers: { 
          ...caldavHeaders, 
          'Content-Type': 'text/plain' 
        } 
      }
    );
  }

  try {
    // Extract token from path or auth header
    // Path format: /caldav/{token}/calendar.ics or /caldav/{token}/events/{eventId}
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Remove 'caldav-server' from path if present (edge function routing)
    const startIndex = pathParts.findIndex(p => p === 'caldav-server') + 1;
    const relevantPath = pathParts.slice(startIndex);
    
    const token = relevantPath[0];
    
    if (!token) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: { ...caldavHeaders, 'WWW-Authenticate': 'Basic realm="CalDAV"' } 
      });
    }

    // Validate token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return new Response('Invalid token format', { status: 400, headers: caldavHeaders });
    }

    // Rate limiting check
    const rateCheck = checkRateLimit(token);
    if (!rateCheck.allowed) {
      console.log(`Rate limit exceeded for CalDAV token`);
      return new Response('Too many requests', { 
        status: 429, 
        headers: { 
          ...caldavHeaders, 
          'Retry-After': String(rateCheck.retryAfter || 3600)
        } 
      });
    }

    // Find company or employee by calendar feed token
    let companyId: string | null = null;
    let employeeId: string | null = null;

    // Check if it's a company token
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('calendar_feed_token', token)
      .single();

    if (company) {
      companyId = company.id;
    } else {
      // Check if it's an employee token
      const { data: employee } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('calendar_feed_token', token)
        .single();

      if (employee) {
        employeeId = employee.id;
        companyId = employee.company_id;
      }
    }

    if (!companyId) {
      return new Response('Invalid token', { status: 401, headers: caldavHeaders });
    }

    // Handle read-only CalDAV methods
    switch (method) {
      case 'PROPFIND':
        return handlePropfind(req, companyId, employeeId);
      
      case 'GET':
        return handleGet(supabase, companyId, employeeId, relevantPath);
      
      case 'REPORT':
        return handleReport(supabase, req, companyId, employeeId);
      
      default:
        return new Response('Method not allowed', { status: 405, headers: caldavHeaders });
    }

  } catch (error) {
    console.error('CalDAV error:', error);
    return new Response('Internal Server Error', { status: 500, headers: caldavHeaders });
  }
});

async function handlePropfind(req: Request, companyId: string, employeeId: string | null): Promise<Response> {
  const depth = req.headers.get('Depth') || '1';
  
  // Return calendar properties - indicate read-only access
  const response = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/">
  <D:response>
    <D:href>/</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>
          <D:collection/>
          <C:calendar/>
        </D:resourcetype>
        <D:displayname>Appointments (Read-Only)</D:displayname>
        <C:supported-calendar-component-set>
          <C:comp name="VEVENT"/>
        </C:supported-calendar-component-set>
        <CS:getctag>${Date.now()}</CS:getctag>
        <D:current-user-privilege-set>
          <D:privilege><D:read/></D:privilege>
        </D:current-user-privilege-set>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;

  return new Response(response, {
    status: 207,
    headers: { ...caldavHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

async function handleGet(
  supabase: any, 
  companyId: string, 
  employeeId: string | null,
  pathParts: string[]
): Promise<Response> {
  // If requesting specific event
  if (pathParts.length > 1 && pathParts[1] !== 'calendar.ics') {
    const eventUid = pathParts[1].replace('.ics', '');
    return getEvent(supabase, companyId, eventUid);
  }

  // Return full calendar
  return getCalendar(supabase, companyId, employeeId);
}

async function getCalendar(supabase: any, companyId: string, employeeId: string | null): Promise<Response> {
  // Build query for appointments
  let query = supabase
    .from('appointments')
    .select('*, companies(name)')
    .eq('company_id', companyId)
    .in('status', ['scheduled', 'confirmed'])
    .gte('datetime', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('datetime', { ascending: true });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data: appointments, error } = await query;

  if (error) {
    console.error('Error fetching appointments:', error);
    return new Response('Error fetching calendar', { status: 500, headers: caldavHeaders });
  }

  const companyName = appointments?.[0]?.companies?.name || 'Appointments';
  const icsContent = generateICS(appointments || [], companyName);

  return new Response(icsContent, {
    status: 200,
    headers: { 
      ...caldavHeaders, 
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="calendar.ics"',
    },
  });
}

async function getEvent(supabase: any, companyId: string, eventUid: string): Promise<Response> {
  // Validate eventUid format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(eventUid)) {
    return new Response('Invalid event ID', { status: 400, headers: caldavHeaders });
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('*, companies(name)')
    .eq('company_id', companyId)
    .eq('id', eventUid)
    .single();

  if (error || !appointment) {
    return new Response('Event not found', { status: 404, headers: caldavHeaders });
  }

  const companyName = appointment.companies?.name || 'Service';
  const icsContent = generateSingleEventICS(appointment, companyName);

  return new Response(icsContent, {
    status: 200,
    headers: { ...caldavHeaders, 'Content-Type': 'text/calendar; charset=utf-8' },
  });
}

async function handleReport(
  supabase: any, 
  req: Request, 
  companyId: string, 
  employeeId: string | null
): Promise<Response> {
  // REPORT is used for calendar-query and calendar-multiget
  // For simplicity, return all events
  return getCalendar(supabase, companyId, employeeId);
}

function generateICS(appointments: any[], companyName: string): string {
  const events = appointments.map(apt => generateVEvent(apt, companyName)).join('\n');
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Platform//CalDAV//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${companyName} Appointments (Read-Only)
${events}
END:VCALENDAR`;
}

function generateSingleEventICS(appointment: any, companyName: string): string {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Platform//CalDAV//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${generateVEvent(appointment, companyName)}
END:VCALENDAR`;
}

function generateVEvent(appointment: any, companyName: string): string {
  const startDate = new Date(appointment.datetime);
  const endDate = new Date(startDate.getTime() + (appointment.duration_minutes || 60) * 60 * 1000);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const escapeICS = (str: string) => {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  };

  const description = [
    `Customer: ${appointment.customer_name}`,
    appointment.customer_phone ? `Phone: ${appointment.customer_phone}` : null,
    appointment.customer_email ? `Email: ${appointment.customer_email}` : null,
    appointment.notes ? `Notes: ${appointment.notes}` : null,
  ].filter(Boolean).join('\\n');

  return `BEGIN:VEVENT
UID:${appointment.id}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${escapeICS(appointment.service_type)} - ${escapeICS(appointment.customer_name)}
DESCRIPTION:${escapeICS(description)}
LOCATION:${escapeICS(appointment.customer_address || '')}
STATUS:${appointment.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}
ORGANIZER:CN=${escapeICS(companyName)}
END:VEVENT`;
}
