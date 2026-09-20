import { describe, it, expect } from 'vitest';
import {
  AGENT_DEFINITIONS,
  SPECIALIST_DEFINITIONS,
  normalizeAgentType,
  operativesForTier,
  agentCapabilities,
} from '@/lib/agentCatalog';
import { AGENT_REGISTRY } from '@/lib/agentRegistry';

const LEGACY_NAMES = [
  'receptionist', 'emergency', 'intake', 'faq',
  'booking', 'followup', 'review',
  'route', 'eta', 'checkin',
  'quoting', 'invoice', 'inventory', 'estimate', 'payments',
  'campaign', 'lead', 'marketing',
  'insights', 'revenue', 'forecast', 'performance', 'analytics',
  'creative', 'social_content', 'social_scheduler', 'social_analytics',
];

describe('agent catalog', () => {
  it('ships 10 operatives and 14 specialists', () => {
    expect(AGENT_DEFINITIONS.filter((d) => !d.isSpecialist)).toHaveLength(10);
    expect(SPECIALIST_DEFINITIONS).toHaveLength(14);
  });

  it('resolves every legacy agent name to a real operative', () => {
    for (const name of LEGACY_NAMES) {
      const canonical = normalizeAgentType(name);
      expect(canonical, `${name} should resolve`).not.toBe(name);
      expect(AGENT_DEFINITIONS.some((d) => d.type === canonical)).toBe(true);
    }
  });

  it('has no duplicate ids or aliases', () => {
    const seen = new Set<string>();
    for (const def of AGENT_DEFINITIONS) {
      for (const key of [def.type, ...def.aliases]) {
        expect(seen.has(key), `duplicate agent key: ${key}`).toBe(false);
        seen.add(key);
      }
    }
  });

  it('gates operatives by plan tier', () => {
    const starter = operativesForTier('starter').map((d) => d.type);
    expect(starter).toContain('triage');
    expect(starter).not.toContain('dispatch');

    const connect = operativesForTier('connect').map((d) => d.type);
    expect(connect).toContain('dispatch');
    expect(connect).not.toContain('business_finance');

    const command = operativesForTier('command');
    expect(command).toHaveLength(10);

    expect(operativesForTier('free')).toHaveLength(0);
  });

  it('accepts legacy tier names', () => {
    expect(operativesForTier('aura_boost').map((d) => d.type)).toContain('dispatch');
  });

  it('exposes capabilities for discovery', () => {
    expect(agentCapabilities('booking').length).toBeGreaterThan(0);
    expect(agentCapabilities('nope-not-real')).toEqual([]);
  });

  it('stays in sync with the presentation registry', () => {
    for (const def of AGENT_DEFINITIONS) {
      expect(AGENT_REGISTRY[def.type], `${def.type} missing from AGENT_REGISTRY`).toBeTruthy();
      expect(AGENT_REGISTRY[def.type].isSpecialist).toBe(def.isSpecialist);
    }
  });
});
