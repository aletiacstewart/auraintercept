import type { ProfileKey } from './industryProfiles';

/**
 * Profile-aware default review-request templates.
 *
 * Two tones:
 * - "warm"  — friendly + star emoji, fits trades/repair/outdoor/home_health/
 *              restaurants/salon/beauty/fitness.
 * - "formal" — plain, no emoji, fits real_estate/professional/personal_assistant/
 *              SaaS/medical/veterinary.
 *
 * Companies can still edit templates manually — this only supplies the
 * *default* when no custom template has been saved.
 */
export type ReviewTone = 'warm' | 'formal';

export interface ReviewTemplateSet {
  sms: string;
  emailSubject: string;
  email: string;
}

const WARM: ReviewTemplateSet = {
  sms:
    'Hi {customer_name}! Thank you for choosing {company_name}. We hope {technician_name} provided excellent {service_type} service. Would you take a moment to leave us a 5-star review? It helps our small business grow! ⭐⭐⭐⭐⭐',
  emailSubject: 'How was your experience? - {company_name}',
  email: `Hi {customer_name},

We hope {technician_name} provided you with excellent {service_type} service today!

Your feedback means the world to us. If you were happy with our service, we'd really appreciate it if you could take a moment to leave us a review.

⭐⭐⭐⭐⭐

Your 5-star review helps our small business grow and allows us to continue providing great service to customers like you.

Thank you again for your business!

Best regards,
The {company_name} Team`,
};

const FORMAL: ReviewTemplateSet = {
  sms:
    'Hello {customer_name}, thank you for choosing {company_name}. If you were satisfied with your recent {service_type}, we would appreciate a brief review at your convenience. Your feedback helps us maintain our standard of service.',
  emailSubject: 'A quick request for your feedback — {company_name}',
  email: `Dear {customer_name},

Thank you for entrusting {company_name} with your recent {service_type}.

If you were satisfied with the service provided, we would be grateful if you could take a moment to share a short review. Your feedback helps us maintain the standard of care our clients expect.

If anything fell short of expectations, please reply to this message directly — we would welcome the opportunity to make it right.

With appreciation,
The {company_name} Team`,
};

// Profile A/B (trades + outdoor) and F (booking/hospitality) → warm.
// Profile C (custom trades), G/H (home health, medical) → formal by default.
// Profile D (professional/SaaS), E (real estate), I (personal assistant),
// J (retail supplier) → formal.
const PROFILE_TONES: Record<ProfileKey, ReviewTone> = {
  PROFILE_A: 'warm',
  PROFILE_B: 'warm',
  PROFILE_C: 'warm',
  PROFILE_D: 'formal',
  PROFILE_E: 'formal',
  PROFILE_F: 'warm',
  PROFILE_G: 'formal',
  PROFILE_H: 'formal',
  PROFILE_I: 'formal',
  PROFILE_J: 'formal',
};

export function getReviewToneForProfile(
  profileKey: ProfileKey | null | undefined,
): ReviewTone {
  if (!profileKey) return 'warm';
  return PROFILE_TONES[profileKey] ?? 'warm';
}

export function getReviewTemplatesForProfile(
  profileKey: ProfileKey | null | undefined,
): ReviewTemplateSet {
  return getReviewToneForProfile(profileKey) === 'formal' ? FORMAL : WARM;
}

export const WARM_REVIEW_TEMPLATES = WARM;
export const FORMAL_REVIEW_TEMPLATES = FORMAL;