/**
 * Carrier call-forwarding reference dataset.
 *
 * Used by the public onboarding intake (PublicOnboardingIntake.tsx) and the
 * downloadable workbook PDF (CompanyOnboardingPDF.tsx) so the live form and
 * the printable reference never drift apart.
 *
 * Replace tokens in instructions when displaying:
 *   {num}    -> Aura business number assigned during setup
 *   {rings}  -> ring count before CFNA fires (use 30 for ~6 rings, 25 for ~5)
 */

export type CarrierType = 'Postpaid' | 'Prepaid / MVNO' | 'VoIP';

export interface CarrierForwarding {
  /** Display name */
  name: string;
  type: CarrierType;
  /** Unconditional / immediate forward */
  immediate_on: string;
  immediate_off: string;
  /** Conditional Forward No Answer (CFNA) — fires after rings */
  no_answer_on: string;
  no_answer_off: string;
  /** Conditional Forward Busy (CFB) */
  busy_on: string;
  busy_off: string;
  /** Conditional Forward Not Reachable (CFNR) — phone off / no signal */
  unreachable_on: string;
  unreachable_off: string;
  /** Cancel ALL active forwarding */
  cancel_all: string;
  /** Check current forwarding status */
  verify: string;
  /** Carrier-specific gotchas */
  notes: string;
}

/**
 * Standard GSM star-code set. Used by AT&T, T-Mobile, and most MVNOs riding
 * those networks. We export it so the entries below can share it cleanly.
 */
const GSM: Omit<CarrierForwarding, 'name' | 'type' | 'notes'> = {
  immediate_on: '**21*{num}#  (dial, then press Call)',
  immediate_off: '##21#',
  no_answer_on: '**61*{num}**{rings}#   (replace {rings} with 30 for ~6 rings)',
  no_answer_off: '##61#',
  busy_on: '**67*{num}#',
  busy_off: '##67#',
  unreachable_on: '**62*{num}#',
  unreachable_off: '##62#',
  cancel_all: '##002#   (clears immediate + all conditional forwards at once)',
  verify: '*#21#  /  *#61#  /  *#67#  /  *#62#   (each shows status of one rule)',
};

export const CARRIERS: CarrierForwarding[] = [
  {
    name: 'Verizon Wireless',
    type: 'Postpaid',
    immediate_on: '*72{num}  (dial, wait for tone/confirmation, then hang up)',
    immediate_off: '*73',
    no_answer_on: 'Not available via star codes. Open the My Verizon app → Account → Manage Device → Call Forwarding → "No Answer / Busy" and enter {num}.',
    no_answer_off: 'My Verizon app → Account → Manage Device → Call Forwarding → turn off "No Answer".',
    busy_on: 'Same flow as No-Answer in My Verizon app — toggle "Busy" and enter {num}.',
    busy_off: 'My Verizon app → Call Forwarding → turn off "Busy".',
    unreachable_on: 'Same flow in My Verizon app — toggle "Not Reachable" and enter {num}.',
    unreachable_off: 'My Verizon app → Call Forwarding → turn off "Not Reachable".',
    cancel_all: '*73  (clears immediate; also disable each conditional rule in My Verizon).',
    verify: 'My Verizon app → Account → Manage Device → Call Forwarding shows current rules.',
    notes: 'Verizon is CDMA-origin and does NOT accept the **21* / **61* GSM codes. Immediate forward works via *72; everything conditional must be set in the My Verizon app or by calling *611. Some legacy plans require the "Call Forwarding Conditional" add-on (free) to be enabled first.',
  },
  {
    name: 'AT&T Mobility',
    type: 'Postpaid',
    ...GSM,
    notes: 'Full GSM star-code support. The number must be dialed exactly as shown including the # at the end — your phone should answer with a short confirmation tone.',
  },
  {
    name: 'T-Mobile (incl. Sprint legacy)',
    type: 'Postpaid',
    ...GSM,
    notes: 'Same GSM codes as AT&T. Legacy Sprint numbers also accept *72{num} for immediate forward and *720 to cancel; new T-Mobile SIMs should use the GSM codes above.',
  },
  {
    name: 'US Cellular',
    type: 'Postpaid',
    immediate_on: '*72{num}',
    immediate_off: '*73',
    no_answer_on: '*92{num}  (supported handsets) — otherwise use the My Account app → Calling Features.',
    no_answer_off: '*93',
    busy_on: 'My Account app → Calling Features → Call Forwarding If Busy.',
    busy_off: 'My Account app → Calling Features → turn off Forward If Busy.',
    unreachable_on: 'My Account app → Calling Features → Forward If Unreachable.',
    unreachable_off: 'My Account app → Calling Features → turn off Forward If Unreachable.',
    cancel_all: '*73 then turn off each conditional rule in the My Account app.',
    verify: 'My Account app → Calling Features lists active forwards.',
    notes: 'CDMA-style codes. The *92 / *93 conditional codes only work on devices certified for US Cellular call-forwarding-no-answer; new phones should use the app.',
  },
  {
    name: 'Google Voice',
    type: 'VoIP',
    immediate_on: 'voice.google.com → Settings → Calls → "Incoming call forwarding" → add {num} and toggle ON.',
    immediate_off: 'voice.google.com → Settings → Calls → toggle "Incoming call forwarding" OFF.',
    no_answer_on: 'Settings → Calls → "Screen calls" OFF + add {num} as a linked number; Google Voice rings linked numbers automatically when the primary does not answer.',
    no_answer_off: 'Remove {num} from Linked numbers in Settings → Calls.',
    busy_on: 'Same as No Answer — linked numbers ring in parallel.',
    busy_off: 'Remove {num} from Linked numbers.',
    unreachable_on: 'Same — Google Voice routes to voicemail or linked numbers when the device is offline.',
    unreachable_off: 'Remove {num} from Linked numbers.',
    cancel_all: 'Settings → Calls → remove all forwarding/linked numbers and toggle "Incoming call forwarding" OFF.',
    verify: 'voice.google.com → Settings → Calls shows every active route.',
    notes: 'No star codes — everything is configured in voice.google.com or the Google Voice mobile app. Use "Linked numbers" instead of "Forwarding" for true conditional behavior.',
  },
  {
    name: 'Cricket Wireless (AT&T MVNO)',
    type: 'Prepaid / MVNO',
    ...GSM,
    notes: 'Rides AT&T — GSM codes work identically.',
  },
  {
    name: 'Metro by T-Mobile',
    type: 'Prepaid / MVNO',
    ...GSM,
    notes: 'Rides T-Mobile — GSM codes work identically.',
  },
  {
    name: 'Visible (Verizon MVNO)',
    type: 'Prepaid / MVNO',
    immediate_on: 'Visible app → Account → Settings → Call Forwarding → enter {num} and enable.',
    immediate_off: 'Visible app → Account → Settings → Call Forwarding → disable.',
    no_answer_on: 'Visible app → Call Forwarding → "Forward when no answer" → {num}.',
    no_answer_off: 'Visible app → Call Forwarding → turn off "Forward when no answer".',
    busy_on: 'Visible app → Call Forwarding → "Forward when busy" → {num}.',
    busy_off: 'Visible app → Call Forwarding → turn off "Forward when busy".',
    unreachable_on: 'Visible app → Call Forwarding → "Forward when unreachable" → {num}.',
    unreachable_off: 'Visible app → Call Forwarding → turn off "Forward when unreachable".',
    cancel_all: 'Visible app → Call Forwarding → "Turn off all forwarding".',
    verify: 'Visible app → Account → Settings → Call Forwarding shows active rules.',
    notes: 'Star codes are NOT supported. Everything is configured in the Visible app (iOS/Android).',
  },
  {
    name: 'Mint Mobile (T-Mobile MVNO)',
    type: 'Prepaid / MVNO',
    ...GSM,
    notes: 'Rides T-Mobile — GSM codes work identically.',
  },
  {
    name: 'Xfinity Mobile / Spectrum Mobile (Verizon MVNO)',
    type: 'Prepaid / MVNO',
    immediate_on: '*72{num}  (some lines also support the carrier app under Devices → Manage → Call Forwarding).',
    immediate_off: '*73',
    no_answer_on: 'Xfinity / Spectrum Mobile app → Devices → Manage → Call Forwarding → "No Answer" → {num}.',
    no_answer_off: 'Xfinity / Spectrum Mobile app → Call Forwarding → turn off "No Answer".',
    busy_on: 'Xfinity / Spectrum Mobile app → Call Forwarding → "Busy" → {num}.',
    busy_off: 'Xfinity / Spectrum Mobile app → Call Forwarding → turn off "Busy".',
    unreachable_on: 'Xfinity / Spectrum Mobile app → Call Forwarding → "Unreachable" → {num}.',
    unreachable_off: 'Xfinity / Spectrum Mobile app → Call Forwarding → turn off "Unreachable".',
    cancel_all: '*73 then disable each conditional rule in the carrier app.',
    verify: 'Carrier app → Devices → Manage → Call Forwarding.',
    notes: 'Rides Verizon — conditional forwarding is app-only. Immediate works via *72/*73.',
  },
  {
    name: 'Generic GSM (any unlocked GSM phone)',
    type: 'Postpaid',
    ...GSM,
    notes: 'If your carrier is not listed but uses a GSM SIM (AT&T, T-Mobile, or any MVNO of either), try these codes. They are part of the 3GPP standard and are accepted by virtually every GSM network worldwide.',
  },
  {
    name: 'iPhone visual path (any GSM carrier)',
    type: 'Postpaid',
    immediate_on: 'Settings → Phone → Call Forwarding → toggle ON, then "Forward To" → enter {num}.',
    immediate_off: 'Settings → Phone → Call Forwarding → toggle OFF.',
    no_answer_on: 'Not exposed in iOS Settings — use the carrier code **61*{num}**{rings}# from the Phone app dialer.',
    no_answer_off: 'Dial ##61# from the Phone app.',
    busy_on: 'Not exposed in iOS Settings — use **67*{num}# from the Phone app.',
    busy_off: 'Dial ##67# from the Phone app.',
    unreachable_on: 'Not exposed in iOS Settings — use **62*{num}# from the Phone app.',
    unreachable_off: 'Dial ##62# from the Phone app.',
    cancel_all: 'Settings → Phone → Call Forwarding OFF, then dial ##002# from the Phone app to clear conditionals.',
    verify: 'Settings → Phone → Call Forwarding shows immediate status; dial *#61# / *#67# / *#62# for conditionals.',
    notes: 'iOS only surfaces immediate forwarding in Settings. Conditional rules (No Answer / Busy / Unreachable) still have to be set via star codes from the Phone app. Verizon iPhones do not show the Call Forwarding option at all — use *72/*73 or the My Verizon app instead.',
  },
];

/** Substitute {num} / {rings} placeholders. */
export function fillTokens(instruction: string, num: string, rings: string = '30'): string {
  return instruction
    .replace(/\{num\}/g, num || '<Aura number>')
    .replace(/\{rings\}/g, rings);
}

/** Ordered list of forwarding rule labels + the field name on CarrierForwarding. */
export const FORWARDING_RULES: Array<{
  label: string;
  short: string;
  on: keyof CarrierForwarding;
  off: keyof CarrierForwarding;
  when: string;
}> = [
  { label: 'Immediate (forward all calls)', short: 'Immediate', on: 'immediate_on', off: 'immediate_off', when: 'Every call goes straight to Aura. Use when you want Aura to answer the line full-time.' },
  { label: 'After hours / No Answer (CFNA)', short: 'No Answer', on: 'no_answer_on', off: 'no_answer_off', when: 'Phone rings ~6 times with no answer, then forwards to Aura. Perfect for after-hours and missed calls.' },
  { label: 'Busy line (CFB)', short: 'Busy', on: 'busy_on', off: 'busy_off', when: 'You are already on a call — the second caller is forwarded to Aura instead of voicemail.' },
  { label: 'Phone off / no signal (CFNR)', short: 'Unreachable', on: 'unreachable_on', off: 'unreachable_off', when: 'Device is powered off, in airplane mode, or out of coverage. Aura picks up so leads still get a live answer.' },
  { label: 'Cancel ALL forwarding', short: 'Cancel All', on: 'cancel_all', off: 'cancel_all', when: 'Removes every active rule at once. Use when you want calls to ring your phone only.' },
];