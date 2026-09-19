import { describe, it, expect } from 'vitest';
import { INTEGRATIONS, validateIntegrationField } from '../../src/lib/integrationConfig';

/**
 * Setup-flow safety net: every credential field must reject an obviously wrong
 * value with a readable message, and accept a well-formed one.
 */
const GOOD: Record<string, string> = {
  signalwire_project_id: 'd1c2b3a4-1111-2222-3333-444455556666',
  signalwire_api_token: 'PTabc123def456ghi789',
  signalwire_space_url: 'auraintercept.signalwire.com',
  signalwire_phone_number: '+15551234567',
  resend_api_key: 're_abc123def456ghi789',
  elevenlabs_api_key: 'sk_0123456789abcdef0123456789abcdef',
  elevenlabs_agent_id: 'agent_abc123',
  stripe_publishable_key: 'pk_live_abc123def456',
  stripe_secret_key: 'sk_live_abc123def456',
};

const field = (key: string) => INTEGRATIONS.flatMap((i) => i.fields).find((f) => f.key === key)!;

describe('integration credential validation', () => {
  it('accepts well-formed values', () => {
    Object.entries(GOOD).forEach(([key, value]) => {
      expect(validateIntegrationField(field(key), value), key).toBeNull();
    });
  });

  it('rejects an ElevenLabs key ID pasted instead of the key', () => {
    const problem = validateIntegrationField(field('elevenlabs_api_key'), 'a1b2c3d4e5');
    expect(problem).toMatch(/sk_/);
  });

  it('rejects a phone number without a country code', () => {
    expect(validateIntegrationField(field('signalwire_phone_number'), '5551234567')).toMatch(/country code/i);
  });

  it('rejects a full URL in the space address field', () => {
    expect(validateIntegrationField(field('signalwire_space_url'), 'https://auraintercept.signalwire.com')).toBeTruthy();
  });

  it('flags a missing required value', () => {
    expect(validateIntegrationField(field('resend_api_key'), '')).toMatch(/required/i);
  });

  it('ignores an empty optional value', () => {
    expect(validateIntegrationField(field('elevenlabs_agent_id'), '')).toBeNull();
  });
});
