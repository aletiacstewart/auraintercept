import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, FileText, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type Scope = 'appointments' | 'leads';

interface AppointmentMatch {
  id: string;
  customer_name: string | null;
  service_type: string | null;
  datetime: string | null;
  status: string | null;
  match_field: string;
  match_value: string;
}

interface LeadMatch {
  id: string;
  name: string | null;
  service_interest: string | null;
  created_at: string | null;
  status: string | null;
  match_field: string;
  match_value: string;
}

interface IntakeDataSearchProps {
  scope?: Scope;
  placeholder?: string;
  /**
   * Optional override for what happens when a result is clicked.
   * Defaults: appointments → /dashboard/appointments, leads → /dashboard/leads.
   */
  onSelect?: (id: string, scope: Scope) => void;
  className?: string;
}

/**
 * Compact search-by-intake-field widget. Calls the SECURITY DEFINER RPCs
 * `search_intake_data` (appointments) or `search_lead_intake_data` (leads),
 * which scope results to the caller's company.
 */
export function IntakeDataSearch({
  scope = 'appointments',
  placeholder,
  onSelect,
  className,
}: IntakeDataSearchProps) {
  const navigate = useNavigate();
  const [raw, setRaw] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Debounce 250ms to avoid hammering the DB.
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(raw.trim()), 250);
    return () => window.clearTimeout(id);
  }, [raw]);

  const enabled = debounced.length >= 2;

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['intake-data-search', scope, debounced],
    queryFn: async () => {
      if (!enabled) return [];
      if (scope === 'appointments') {
        const { data, error } = await supabase.rpc('search_intake_data', {
          p_query: debounced,
          p_limit: 20,
        });
        if (error) {
          console.error('search_intake_data failed', error);
          return [];
        }
        return (data ?? []) as AppointmentMatch[];
      }
      const { data, error } = await supabase.rpc('search_lead_intake_data', {
        p_query: debounced,
        p_limit: 20,
      });
      if (error) {
        console.error('search_lead_intake_data failed', error);
        return [];
      }
      return (data ?? []) as LeadMatch[];
    },
    enabled,
  });

  const placeholderText = useMemo(
    () =>
      placeholder ??
      (scope === 'appointments'
        ? 'Search job intake (e.g. MLS#, serial, model)…'
        : 'Search lead intake details…'),
    [placeholder, scope],
  );

  const handleSelect = (id: string) => {
    setOpen(false);
    setRaw('');
    if (onSelect) {
      onSelect(id, scope);
      return;
    }
    if (scope === 'appointments') navigate('/dashboard/appointments');
    else navigate('/dashboard/leads');
  };

  return (
    <div className={className}>
      <Popover open={open && enabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={placeholderText}
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className="pl-9 h-9 text-sm"
            />
            {isFetching && enabled && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(28rem,calc(100vw-2rem))] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {!enabled ? (
            <p className="p-3 text-xs text-muted-foreground">
              Type at least 2 characters to search intake fields.
            </p>
          ) : results.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">No matches found.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border/60">
              {results.map((r) => {
                const id = r.id;
                const isAppt = scope === 'appointments';
                const title = isAppt
                  ? (r as AppointmentMatch).customer_name ?? 'Appointment'
                  : (r as LeadMatch).name ?? 'Lead';
                const subtitle = isAppt
                  ? (r as AppointmentMatch).service_type ?? ''
                  : (r as LeadMatch).service_interest ?? '';
                const ts = isAppt
                  ? (r as AppointmentMatch).datetime
                  : (r as LeadMatch).created_at;
                return (
                  <li key={`${scope}-${id}-${r.match_field}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(id)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted/60"
                    >
                      {isAppt ? (
                        <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      ) : (
                        <UserPlus className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{title}</p>
                          {ts && (
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {format(new Date(ts), 'MMM d')}
                            </span>
                          )}
                        </div>
                        {subtitle && (
                          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {r.match_field}: {r.match_value}
                          </Badge>
                          {r.status && (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {r.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}