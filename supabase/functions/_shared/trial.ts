// Single source of truth for the Aura Intercept trial period.
// Any edge function or email template that references trial length or
// the "60-Day Live Trial" phrase should import from here so future
// changes propagate consistently.

export const TRIAL_DAYS = 60;
export const TRIAL_ONBOARDING_DAYS = 30;
export const TRIAL_LIVE_USE_DAYS = 30;
export const TRIAL_LABEL = `${TRIAL_DAYS}-Day Live Trial`;