/**
 * Onboarding analytics.
 *
 * Records how new companies progress through First Steps and reach their first
 * real action. Every write is fire-and-forget: a tracking failure is logged and
 * swallowed so it can never break the flow the user is in.
 */
import { supabase } from '@/integrations/supabase/client';

export type OnboardingEventType =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_step_skipped'
  | 'onboarding_finished'
  | 'first_booking_created'
  | 'first_quote_created'
  | 'first_agent_enabled'
  | 'integration_connected';

export interface OnboardingEvent {
  userId: string;
  companyId: string;
  eventType: OnboardingEventType;
  metadata?: Record<string, unknown>;
}

/** Inserts a single onboarding event. Never throws. */
export async function trackOnboardingEvent(event: OnboardingEvent): Promise<void> {
  if (!event.userId || !event.companyId) return;
  try {
    const { error } = await supabase.from('onboarding_analytics').insert({
      user_id: event.userId,
      company_id: event.companyId,
      event_type: event.eventType,
      metadata: (event.metadata ?? {}) as never,
    });
    if (error) console.warn('[analytics] onboarding event failed:', error.message);
  } catch (e) {
    console.warn('[analytics] onboarding event failed:', e);
  }
}

type Ids = { userId?: string | null; companyId?: string | null };

const emit = (
  ids: Ids,
  eventType: OnboardingEventType,
  metadata?: Record<string, unknown>,
): Promise<void> => {
  if (!ids.userId || !ids.companyId) return Promise.resolve();
  return trackOnboardingEvent({
    userId: ids.userId,
    companyId: ids.companyId,
    eventType,
    metadata,
  });
};

/** Convenience wrappers used across the app. */
export const onboarding = {
  started: (ids: Ids) => emit(ids, 'onboarding_started'),
  stepCompleted: (ids: Ids, step: string) => emit(ids, 'onboarding_step_completed', { step }),
  stepSkipped: (ids: Ids, step: string) => emit(ids, 'onboarding_step_skipped', { step }),
  finished: (ids: Ids, durationMinutes?: number) =>
    emit(ids, 'onboarding_finished', { durationMinutes }),
  firstBooking: (ids: Ids) => emit(ids, 'first_booking_created'),
  firstQuote: (ids: Ids) => emit(ids, 'first_quote_created'),
  agentEnabled: (ids: Ids, agentType: string) => emit(ids, 'first_agent_enabled', { agentType }),
  integrationConnected: (ids: Ids, integration: string) =>
    emit(ids, 'integration_connected', { integration }),
};
