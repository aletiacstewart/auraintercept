import { format, subDays, subMonths, subQuarters, subYears } from 'date-fns';

interface DigestEmailPreviewProps {
  type: 'weekly' | 'monthly' | 'quarterly';
  companyName: string;
  includeAppointments?: boolean;
  includeReminders?: boolean;
  includeSubscriptions?: boolean;
}

// Sample data for previews
const SAMPLE_DATA = {
  weekly: {
    current: {
      appointments: { total: 24, completed: 18, cancelled: 2, noShow: 4 },
      reminders: { total: 72, sent: 69, sms: 40, email: 25, call: 7 },
      subscriptions: { unsubscribes: 3, resubscribes: 1 }
    },
    previous: {
      appointments: { total: 20, completed: 15 },
      reminders: { total: 65, sent: 61 },
      subscriptions: { unsubscribes: 5, resubscribes: 0 }
    }
  },
  monthly: {
    current: {
      appointments: { total: 96, completed: 78, cancelled: 10, noShow: 8 },
      reminders: { total: 288, sent: 276, sms: 160, email: 100, call: 28 },
      subscriptions: { unsubscribes: 12, resubscribes: 4 }
    },
    previous: {
      appointments: { total: 85, completed: 68 },
      reminders: { total: 255, sent: 240 },
      subscriptions: { unsubscribes: 15, resubscribes: 2 }
    }
  },
  quarterly: {
    current: {
      appointments: { total: 312, completed: 256, cancelled: 32, noShow: 24 },
      reminders: { total: 936, sent: 899, sms: 520, email: 325, call: 91 },
      subscriptions: { unsubscribes: 38, resubscribes: 12 }
    },
    previous: {
      appointments: { total: 280, completed: 224 },
      reminders: { total: 840, sent: 798 },
      subscriptions: { unsubscribes: 45, resubscribes: 8 }
    },
    yearAgo: {
      appointments: { total: 245, completed: 192 },
      reminders: { total: 735, sent: 691 },
      subscriptions: { unsubscribes: 52, resubscribes: 5 }
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
  positiveIsGood = true,
  label 
}: { 
  change: { value: number; direction: string }; 
  positiveIsGood?: boolean;
  label?: string;
}) => {
  if (change.direction === 'same' || change.value === 0) return label ? <span className="text-xs text-muted-foreground">-</span> : null;
  const isGood = (change.direction === 'up') === positiveIsGood;
  return (
    <span className={`text-xs ml-1 ${isGood ? 'text-green-600' : 'text-red-600'}`}>
      {change.direction === 'up' ? '↑' : '↓'}{change.value}%{label ? ` ${label}` : ''}
    </span>
  );
};

export function DigestEmailPreview({ 
  type, 
  companyName,
  includeAppointments = true,
  includeReminders = true,
  includeSubscriptions = true
}: DigestEmailPreviewProps) {
  const now = new Date();
  const data = SAMPLE_DATA[type];
  const { current, previous } = data;
  const yearAgo = type === 'quarterly' ? SAMPLE_DATA.quarterly.yearAgo : null;

  const successRate = Math.round((current.reminders.sent / current.reminders.total) * 100);
  const prevSuccessRate = Math.round((previous.reminders.sent / previous.reminders.total) * 100);
  const completionRate = Math.round((current.appointments.completed / current.appointments.total) * 100);
  const netChange = current.subscriptions.resubscribes - current.subscriptions.unsubscribes;

  const changes = {
    appointments: calcChange(current.appointments.total, previous.appointments.total),
    completed: calcChange(current.appointments.completed, previous.appointments.completed),
    reminders: calcChange(current.reminders.total, previous.reminders.total),
    successRate: calcChange(successRate, prevSuccessRate),
    unsubscribes: calcChange(current.subscriptions.unsubscribes, previous.subscriptions.unsubscribes)
  };

  const yoyChanges = yearAgo ? {
    appointments: calcChange(current.appointments.total, yearAgo.appointments.total),
    completed: calcChange(current.appointments.completed, yearAgo.appointments.completed),
    reminders: calcChange(current.reminders.total, yearAgo.reminders.total)
  } : null;

  // Get period labels
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

  const getComparisonLabel = () => {
    switch (type) {
      case 'weekly': return 'vs previous week';
      case 'monthly': return 'vs previous month';
      case 'quarterly': return 'vs previous quarter';
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'weekly': return 'from-blue-500 to-purple-500';
      case 'monthly': return 'from-blue-500 to-green-500';
      case 'quarterly': return 'from-indigo-500 to-purple-600';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'weekly': return '📊 Weekly Digest';
      case 'monthly': return '📈 Monthly Report';
      case 'quarterly': return '📊 Quarterly Business Review';
    }
  };

  const hasAnyMetrics = includeAppointments || includeReminders || includeSubscriptions;

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
      {/* Email Header */}
      <div className={`bg-gradient-to-r ${getGradient()} p-6 text-center text-white`}>
        <h2 className="text-xl font-bold mb-1">{getTitle()}</h2>
        <p className="text-sm opacity-90">{companyName}</p>
        <p className="text-xs opacity-70">{getPeriodLabel()}</p>
      </div>

      <div className="bg-muted/30 p-6 space-y-4">
        {/* Summary Section */}
        {(includeAppointments || includeReminders) && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3">
              {type === 'quarterly' ? '📈 Executive Summary' : '📊 Summary'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {includeAppointments && (
                <>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {current.appointments.total}
                      <ChangeIndicator change={changes.appointments} />
                    </div>
                    <div className="text-xs text-muted-foreground">Appointments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {current.appointments.completed}
                      <ChangeIndicator change={changes.completed} />
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </>
              )}
              {includeReminders && (
                <>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {current.reminders.total}
                      <ChangeIndicator change={changes.reminders} />
                    </div>
                    <div className="text-xs text-muted-foreground">Reminders</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {successRate}%
                      <ChangeIndicator change={changes.successRate} />
                    </div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* YoY Comparison for Quarterly */}
        {type === 'quarterly' && yoyChanges && (includeAppointments || includeReminders) && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3">📅 Year-over-Year Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Metric</th>
                    <th className="text-center py-2">Last Year</th>
                    <th className="text-center py-2">This Year</th>
                    <th className="text-center py-2">YoY</th>
                  </tr>
                </thead>
                <tbody>
                  {includeAppointments && (
                    <>
                      <tr className="border-b">
                        <td className="py-2">Appointments</td>
                        <td className="text-center">{yearAgo?.appointments.total}</td>
                        <td className="text-center font-semibold">{current.appointments.total}</td>
                        <td className="text-center"><ChangeIndicator change={yoyChanges.appointments} /></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Completed</td>
                        <td className="text-center">{yearAgo?.appointments.completed}</td>
                        <td className="text-center font-semibold">{current.appointments.completed}</td>
                        <td className="text-center"><ChangeIndicator change={yoyChanges.completed} /></td>
                      </tr>
                    </>
                  )}
                  {includeReminders && (
                    <tr>
                      <td className="py-2">Reminders</td>
                      <td className="text-center">{yearAgo?.reminders.total}</td>
                      <td className="text-center font-semibold">{current.reminders.total}</td>
                      <td className="text-center"><ChangeIndicator change={yoyChanges.reminders} /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Appointments Section */}
        {includeAppointments && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3">📅 Appointment Breakdown</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-green-600">{current.appointments.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">{current.appointments.cancelled}</div>
                <div className="text-xs text-muted-foreground">Cancelled</div>
              </div>
              <div>
                <div className="text-xl font-bold text-amber-600">{current.appointments.noShow}</div>
                <div className="text-xs text-muted-foreground">No-Show</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t text-sm">
              <strong>Completion Rate:</strong> {completionRate}%
            </div>
            {type !== 'quarterly' && (
              <div className="mt-2 text-xs text-muted-foreground">
                {getComparisonLabel()}: {previous.appointments.total} total, {previous.appointments.completed} completed
              </div>
            )}
          </div>
        )}

        {/* Reminders Section */}
        {includeReminders && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3">🔔 Reminder Performance</h3>
            <div className="space-y-1 text-sm">
              <p>📱 SMS Reminders: <strong>{current.reminders.sms}</strong></p>
              <p>✉️ Email Reminders: <strong>{current.reminders.email}</strong></p>
              <p>📞 Voice Reminders: <strong>{current.reminders.call}</strong></p>
            </div>
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              {getComparisonLabel()}: {previous.reminders.total} reminders, {prevSuccessRate}% success rate
            </div>
          </div>
        )}

        {/* Subscriptions Section */}
        {includeSubscriptions && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3">📈 Subscription Health</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-red-600">
                  {current.subscriptions.unsubscribes}
                  <ChangeIndicator change={changes.unsubscribes} positiveIsGood={false} />
                </div>
                <div className="text-xs text-muted-foreground">Unsubscribes</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{current.subscriptions.resubscribes}</div>
                <div className="text-xs text-muted-foreground">Re-subscribes</div>
              </div>
              <div>
                <div className={`text-xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netChange >= 0 ? '+' : ''}{netChange}
                </div>
                <div className="text-xs text-muted-foreground">Net Change</div>
              </div>
            </div>
          </div>
        )}

        {/* Positive Insight Example */}
        {includeAppointments && changes.appointments.direction === 'up' && changes.appointments.value >= 10 && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-500/30 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-400">
              🎉 <strong>Great {type === 'weekly' ? 'week' : type === 'monthly' ? 'month' : 'quarter'}!</strong> Appointments increased by {changes.appointments.value}% compared to the previous period!
            </p>
          </div>
        )}

        {/* Warning Example */}
        {includeSubscriptions && current.subscriptions.unsubscribes > (type === 'weekly' ? 5 : type === 'monthly' ? 10 : 20) && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 rounded-lg p-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              ⚠️ <strong>Attention:</strong> You had {current.subscriptions.unsubscribes} unsubscribes this {type === 'weekly' ? 'week' : type === 'monthly' ? 'month' : 'quarter'}. Consider reviewing your communication frequency.
            </p>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground pt-2">
          This is an automated {type} report from {companyName}.
        </p>
      </div>
    </div>
  );
}
