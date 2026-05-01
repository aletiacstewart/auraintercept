import { format, subDays, subMonths, subQuarters } from 'date-fns';

export interface DigestEmailPreviewProps {
  type: 'weekly' | 'monthly' | 'quarterly';
  companyName: string;
  includeAppointments?: boolean;
  includeReminders?: boolean;
  includeEmails?: boolean;
  includeSms?: boolean;
}

// Sample data for previews
const SAMPLE_DATA = {
  weekly: {
    current: {
      appointments: { scheduled: 24, completed: 18, cancelled: 2 },
      reminders: { smsSent: 40, emailSent: 25 },
      emails: { sent: 150, bounced: 3, subscribed: 5, unsubscribed: 2 },
      sms: { sent: 85, bounced: 1, subscribed: 3, unsubscribed: 1 }
    },
    previous: {
      appointments: { scheduled: 20, completed: 15 },
      reminders: { smsSent: 35, emailSent: 22 },
      emails: { sent: 140, bounced: 4 },
      sms: { sent: 80, bounced: 2 }
    }
  },
  monthly: {
    current: {
      appointments: { scheduled: 96, completed: 78, cancelled: 10 },
      reminders: { smsSent: 160, emailSent: 100 },
      emails: { sent: 600, bounced: 12, subscribed: 20, unsubscribed: 8 },
      sms: { sent: 340, bounced: 4, subscribed: 12, unsubscribed: 5 }
    },
    previous: {
      appointments: { scheduled: 85, completed: 68 },
      reminders: { smsSent: 145, emailSent: 90 },
      emails: { sent: 550, bounced: 15 },
      sms: { sent: 310, bounced: 6 }
    }
  },
  quarterly: {
    current: {
      appointments: { scheduled: 312, completed: 256, cancelled: 32 },
      reminders: { smsSent: 520, emailSent: 325 },
      emails: { sent: 1800, bounced: 36, subscribed: 60, unsubscribed: 25 },
      sms: { sent: 1020, bounced: 12, subscribed: 35, unsubscribed: 15 }
    },
    previous: {
      appointments: { scheduled: 280, completed: 224 },
      reminders: { smsSent: 470, emailSent: 290 },
      emails: { sent: 1650, bounced: 40 },
      sms: { sent: 940, bounced: 15 }
    }
  }
};

const calcChange = (current: number, previous: number) => {
  if (previous === 0) return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'same' };
  const change = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(change), direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same' };
};

const ChangeIndicator = ({ 
  change, 
  positiveIsGood = true 
}: { 
  change: { value: number; direction: string }; 
  positiveIsGood?: boolean;
}) => {
  if (change.direction === 'same' || change.value === 0) return null;
  const isGood = (change.direction === 'up') === positiveIsGood;
  return (
    <span className={`text-xs ml-1 ${isGood ? 'text-green-600' : 'text-red-600'}`}>
      {change.direction === 'up' ? '↑' : '↓'}{change.value}%
    </span>
  );
};

export function DigestEmailPreview({ 
  type, 
  companyName,
  includeAppointments = true,
  includeReminders = true,
  includeEmails = true,
  includeSms = true
}: DigestEmailPreviewProps) {
  const now = new Date();
  const data = SAMPLE_DATA[type];
  const { current, previous } = data;

  const getPeriodLabel = () => {
    switch (type) {
      case 'weekly':
        const weekStart = subDays(now, 7);
        return `${format(weekStart, 'MMM d')} - ${format(now, 'MMM d, yyyy')}`;
      case 'monthly':
        const lastMonth = subMonths(now, 1);
        return format(lastMonth, 'MMMM yyyy');
      case 'quarterly':
        const lastQuarter = subQuarters(now, 1);
        return `Q${Math.floor(lastQuarter.getMonth() / 3) + 1} ${lastQuarter.getFullYear()}`;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'weekly': return 'from-blue-500 to-purple-500';
      case 'monthly': return 'from-blue-500 to-green-500';
      case 'quarterly': return 'from-cyan-500 to-purple-600';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'weekly': return '📊 Weekly Digest';
      case 'monthly': return '📈 Monthly Report';
      case 'quarterly': return '📊 Quarterly Business Review';
    }
  };

  const hasAnyMetrics = includeAppointments || includeReminders || includeEmails || includeSms;

  if (!hasAnyMetrics) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <p>No metrics selected for this digest.</p>
        <p className="text-sm mt-2">Enable at least one metric to see the preview.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className={`bg-gradient-to-r ${getGradient()} p-6 text-center text-white`}>
        <h2 className="text-xl font-bold mb-1">{getTitle()}</h2>
        <p className="text-sm opacity-90">{companyName}</p>
        <p className="text-xs opacity-70">{getPeriodLabel()}</p>
      </div>

      <div className="bg-muted/30 p-6 space-y-4">
        {includeAppointments && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3">📅 Appointments</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-primary">
                  {current.appointments.scheduled}
                  <ChangeIndicator change={calcChange(current.appointments.scheduled, previous.appointments.scheduled)} />
                </div>
                <div className="text-xs text-muted-foreground">Scheduled</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">
                  {current.appointments.completed}
                  <ChangeIndicator change={calcChange(current.appointments.completed, previous.appointments.completed)} />
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">{current.appointments.cancelled}</div>
                <div className="text-xs text-muted-foreground">Cancelled</div>
              </div>
            </div>
          </div>
        )}

        {includeReminders && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3">🔔 Reminders Sent</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-primary">
                  {current.reminders.smsSent}
                  <ChangeIndicator change={calcChange(current.reminders.smsSent, previous.reminders.smsSent)} />
                </div>
                <div className="text-xs text-muted-foreground">SMS Reminders</div>
              </div>
              <div>
                <div className="text-xl font-bold text-primary">
                  {current.reminders.emailSent}
                  <ChangeIndicator change={calcChange(current.reminders.emailSent, previous.reminders.emailSent)} />
                </div>
                <div className="text-xs text-muted-foreground">Email Reminders</div>
              </div>
            </div>
          </div>
        )}

        {includeEmails && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3">✉️ Emails</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-primary">{current.emails.sent}</div>
                <div className="text-xs text-muted-foreground">Sent</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">{current.emails.bounced}</div>
                <div className="text-xs text-muted-foreground">Bounced</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{current.emails.subscribed}</div>
                <div className="text-xs text-muted-foreground">Subscribed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-amber-600">{current.emails.unsubscribed}</div>
                <div className="text-xs text-muted-foreground">Unsubscribed</div>
              </div>
            </div>
          </div>
        )}

        {includeSms && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3">📱 SMS</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-primary">{current.sms.sent}</div>
                <div className="text-xs text-muted-foreground">Sent</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">{current.sms.bounced}</div>
                <div className="text-xs text-muted-foreground">Bounced</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{current.sms.subscribed}</div>
                <div className="text-xs text-muted-foreground">Subscribed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-amber-600">{current.sms.unsubscribed}</div>
                <div className="text-xs text-muted-foreground">Unsubscribed</div>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground pt-2">
          This is an automated {type} report from {companyName}.
        </p>
      </div>
    </div>
  );
}
