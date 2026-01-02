import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// CalDAV requires specific headers
const caldavHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, PROPFIND, GET, PUT, DELETE, REPORT',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, depth, if-match, if-none-match',
  'DAV': '1, 2, calendar-access',
  'Allow': 'OPTIONS, PROPFIND, GET, PUT, DELETE, REPORT',
};

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const url = new URL(req.url);
  const method = req.method;

  console.log('CalDAV Request:', method, url.pathname);

  // Handle CORS/OPTIONS
  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: caldavHeaders });
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

    // Handle different CalDAV methods
    switch (method) {
      case 'PROPFIND':
        return handlePropfind(req, companyId, employeeId);
      
      case 'GET':
        return handleGet(supabase, companyId, employeeId, relevantPath);
      
      case 'PUT':
        return handlePut(supabase, req, companyId, employeeId, relevantPath);
      
      case 'DELETE':
        return handleDelete(supabase, companyId, relevantPath);
      
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
  
  // Return calendar properties
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
        <D:displayname>Appointments</D:displayname>
        <C:supported-calendar-component-set>
          <C:comp name="VEVENT"/>
        </C:supported-calendar-component-set>
        <CS:getctag>${Date.now()}</CS:getctag>
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

async function handlePut(
  supabase: any, 
  req: Request, 
  companyId: string, 
  employeeId: string | null,
  pathParts: string[]
): Promise<Response> {
  try {
    const icsData = await req.text();
    const event = parseICS(icsData);

    if (!event) {
      return new Response('Invalid ICS data', { status: 400, headers: caldavHeaders });
    }

    // Check if event exists (update) or is new (create)
    const eventUid = pathParts[1]?.replace('.ics', '') || event.uid;

    // Check for existing mapping
    const { data: existingMapping } = await supabase
      .from('calendar_event_mappings')
      .select('appointment_id')
      .eq('caldav_uid', eventUid)
      .eq('company_id', companyId)
      .single();

    if (existingMapping) {
      // Update existing appointment
      const { error } = await supabase
        .from('appointments')
        .update({
          datetime: event.startDate,
          duration_minutes: event.durationMinutes || 60,
          customer_name: event.summary || 'Appointment',
          notes: event.description,
          customer_address: event.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMapping.appointment_id);

      if (error) {
        console.error('Error updating appointment:', error);
        return new Response('Error updating event', { status: 500, headers: caldavHeaders });
      }

      // Update mapping
      await supabase
        .from('calendar_event_mappings')
        .update({
          caldav_etag: Date.now().toString(),
          sync_source: 'caldav',
          last_synced_at: new Date().toISOString(),
        })
        .eq('caldav_uid', eventUid);

      console.log('Updated appointment from CalDAV:', existingMapping.appointment_id);
    } else {
      // Create new appointment from CalDAV event
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert({
          company_id: companyId,
          employee_id: employeeId,
          datetime: event.startDate,
          duration_minutes: event.durationMinutes || 60,
          customer_name: event.summary || 'New Appointment',
          customer_address: event.location,
          notes: event.description,
          service_type: 'General',
          status: 'scheduled',
        })
        .select()
        .single();

      if (error || !newAppointment) {
        console.error('Error creating appointment:', error);
        return new Response('Error creating event', { status: 500, headers: caldavHeaders });
      }

      // Create mapping
      await supabase
        .from('calendar_event_mappings')
        .insert({
          appointment_id: newAppointment.id,
          company_id: companyId,
          google_event_id: '',
          caldav_uid: eventUid,
          caldav_etag: Date.now().toString(),
          sync_source: 'caldav',
        });

      console.log('Created appointment from CalDAV:', newAppointment.id);
    }

    return new Response('', { 
      status: 201, 
      headers: { ...caldavHeaders, 'ETag': `"${Date.now()}"` } 
    });

  } catch (error) {
    console.error('PUT error:', error);
    return new Response('Error processing event', { status: 500, headers: caldavHeaders });
  }
}

async function handleDelete(supabase: any, companyId: string, pathParts: string[]): Promise<Response> {
  const eventUid = pathParts[1]?.replace('.ics', '');

  if (!eventUid) {
    return new Response('Event UID required', { status: 400, headers: caldavHeaders });
  }

  // Find the appointment by CalDAV UID
  const { data: mapping } = await supabase
    .from('calendar_event_mappings')
    .select('appointment_id')
    .eq('caldav_uid', eventUid)
    .eq('company_id', companyId)
    .single();

  if (mapping) {
    // Cancel the appointment (don't actually delete)
    await supabase
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', mapping.appointment_id);

    console.log('Cancelled appointment from CalDAV:', mapping.appointment_id);
  }

  return new Response('', { status: 204, headers: caldavHeaders });
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
X-WR-CALNAME:${companyName} Appointments
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

function parseICS(icsData: string): any | null {
  try {
    const lines = icsData.split(/\r?\n/);
    const event: any = {};

    for (const line of lines) {
      if (line.startsWith('UID:')) {
        event.uid = line.substring(4);
      } else if (line.startsWith('DTSTART')) {
        const value = line.split(':')[1];
        event.startDate = parseICSDate(value);
      } else if (line.startsWith('DTEND')) {
        const value = line.split(':')[1];
        event.endDate = parseICSDate(value);
      } else if (line.startsWith('SUMMARY:')) {
        event.summary = unescapeICS(line.substring(8));
      } else if (line.startsWith('DESCRIPTION:')) {
        event.description = unescapeICS(line.substring(12));
      } else if (line.startsWith('LOCATION:')) {
        event.location = unescapeICS(line.substring(9));
      }
    }

    if (event.startDate && event.endDate) {
      event.durationMinutes = Math.round(
        (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / 60000
      );
    }

    return event.startDate ? event : null;
  } catch (error) {
    console.error('Error parsing ICS:', error);
    return null;
  }
}

function parseICSDate(value: string): string {
  // Handle both YYYYMMDDTHHMMSSZ and YYYYMMDDTHHMMSS formats
  const cleaned = value.replace('Z', '');
  if (cleaned.length >= 15) {
    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6);
    const day = cleaned.substring(6, 8);
    const hour = cleaned.substring(9, 11);
    const minute = cleaned.substring(11, 13);
    const second = cleaned.substring(13, 15);
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  }
  return new Date().toISOString();
}

function unescapeICS(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}