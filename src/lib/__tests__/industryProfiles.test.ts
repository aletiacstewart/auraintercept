import { describe, it, expect } from 'vitest';
import {
  PROFILE_SPECS,
  ALL_PROFILE_KEYS,
  getProfileSpec,
  profileHasConsole,
  profileShowsAgent,
} from '../industryProfiles';
import {
  BUSINESS_TYPE_TO_PROFILE,
  CANONICAL_INDUSTRY_TO_PROFILE,
  getProfileForBusinessType,
  normalizeBusinessType,
} from '../businessTypeProfileMap';

describe('industry profiles registry', () => {
  it('defines all 10 profiles', () => {
    expect(ALL_PROFILE_KEYS).toHaveLength(10);
    for (const key of ALL_PROFILE_KEYS) {
      expect(PROFILE_SPECS[key]).toBeDefined();
      expect(PROFILE_SPECS[key].consoles.length).toBeGreaterThan(0);
      expect(PROFILE_SPECS[key].receptionistScriptId).toMatch(/^[a-z_]+$/);
    }
  });

  it('matches spec console visibility per profile', () => {
    // Per AuraIntercept_Lovable_ConsoleBuildPrompt section 3
    expect(PROFILE_SPECS.PROFILE_A.consoles).toEqual(['C1','C2','C3','C4','C5','C6']);
    expect(PROFILE_SPECS.PROFILE_B.consoles).toEqual(['C1','C2','C3','C4','C5','C6']);
    expect(PROFILE_SPECS.PROFILE_C.consoles).toEqual(['C1','C2','C3','C4','C5','C6']);
    expect(PROFILE_SPECS.PROFILE_D.consoles).toEqual(['C1','C3','C4','C5','C6']); // no C2
    expect(PROFILE_SPECS.PROFILE_E.consoles).toEqual(['C1','C3','C4','C5','C6']); // no C2
    expect(PROFILE_SPECS.PROFILE_F.consoles).toEqual(['C1','C2','C3','C4','C5','C6']);
    expect(PROFILE_SPECS.PROFILE_G.consoles).toEqual(['C1','C2','C3','C4','C5','C6']);
    expect(PROFILE_SPECS.PROFILE_H.consoles).toEqual(['C1','C2','C3','C4','C5','C6']);
    expect(PROFILE_SPECS.PROFILE_I.consoles).toEqual(['C1','C3','C4','C5','C6']); // no C2
    expect(PROFILE_SPECS.PROFILE_J.consoles).toEqual(['C1','C2','C3','C4','C5','C6']);
  });

  it('hides dispatch/inventory per spec where required', () => {
    expect(PROFILE_SPECS.PROFILE_D.agentsHidden).toContain('dispatch_gps');
    expect(PROFILE_SPECS.PROFILE_E.agentsHidden).toContain('quoting_agent');
    expect(PROFILE_SPECS.PROFILE_B.agentsHidden).toContain('inventory_agent');
    expect(PROFILE_SPECS.PROFILE_I.agentsHidden).toContain('route_agent');
  });

  it('helpers fall back to PROFILE_D when key is missing', () => {
    expect(getProfileSpec(undefined).key).toBe('PROFILE_D');
    expect(getProfileSpec(null).key).toBe('PROFILE_D');
    expect(profileHasConsole(null, 'C2')).toBe(false);
    expect(profileHasConsole('PROFILE_A', 'C2')).toBe(true);
    expect(profileShowsAgent('PROFILE_D', 'dispatch_gps')).toBe(false);
    expect(profileShowsAgent('PROFILE_A', 'dispatch_gps')).toBe(true);
  });
});

describe('business type -> profile map', () => {
  it('covers the full business-type table from the spec', () => {
    // Doc references "185 business types" but the literal table in Section 4
    // enumerates 180 unique rows; assert that floor.
    expect(Object.keys(BUSINESS_TYPE_TO_PROFILE).length).toBeGreaterThanOrEqual(180);
  });

  it('every value is a valid ProfileKey', () => {
    for (const [bt, key] of Object.entries(BUSINESS_TYPE_TO_PROFILE)) {
      expect(PROFILE_SPECS[key], `business type "${bt}" -> invalid profile ${key}`).toBeDefined();
    }
    for (const [id, key] of Object.entries(CANONICAL_INDUSTRY_TO_PROFILE)) {
      expect(PROFILE_SPECS[key], `canonical id "${id}" -> invalid profile ${key}`).toBeDefined();
    }
  });

  it('every map key is already normalized', () => {
    for (const k of Object.keys(BUSINESS_TYPE_TO_PROFILE)) {
      expect(normalizeBusinessType(k)).toBe(k);
    }
  });

  it('spot-checks key business-type assignments from the spec', () => {
    expect(getProfileForBusinessType('hvac contractor')).toBe('PROFILE_A');
    expect(getProfileForBusinessType('plumber')).toBe('PROFILE_A');
    expect(getProfileForBusinessType('lawn care service')).toBe('PROFILE_B');
    expect(getProfileForBusinessType('house cleaning service')).toBe('PROFILE_B');
    expect(getProfileForBusinessType('roofing contractor')).toBe('PROFILE_C');
    expect(getProfileForBusinessType('personal trainer')).toBe('PROFILE_D');
    expect(getProfileForBusinessType('real estate agent')).toBe('PROFILE_E');
    expect(getProfileForBusinessType('mover')).toBe('PROFILE_F');
    expect(getProfileForBusinessType('car detailing service')).toBe('PROFILE_G');
    expect(getProfileForBusinessType('dog walker')).toBe('PROFILE_B');
    expect(getProfileForBusinessType('mobile pet groomer')).toBe('PROFILE_H');
    expect(getProfileForBusinessType('DJ / mobile entertainment service')).toBe('PROFILE_I');
    expect(getProfileForBusinessType('junk removal service')).toBe('PROFILE_J');
  });

  it('is case- and punctuation-tolerant', () => {
    expect(getProfileForBusinessType('  HVAC Contractor  ')).toBe('PROFILE_A');
    expect(getProfileForBusinessType('Real_Estate_Agent')).toBe('PROFILE_E');
    expect(getProfileForBusinessType('DJ / Mobile Entertainment Service')).toBe('PROFILE_I');
  });

  it('falls back through canonical short ids stored in industry_vertical', () => {
    expect(getProfileForBusinessType('hvac')).toBe('PROFILE_A');
    expect(getProfileForBusinessType('real_estate')).toBe('PROFILE_E');
    expect(getProfileForBusinessType('auto_care')).toBe('PROFILE_G');
    expect(getProfileForBusinessType('landscape')).toBe('PROFILE_B');
  });

  it('defaults unknown business types to PROFILE_D', () => {
    expect(getProfileForBusinessType('completely made up biz')).toBe('PROFILE_D');
    expect(getProfileForBusinessType('')).toBe('PROFILE_D');
    expect(getProfileForBusinessType(null)).toBe('PROFILE_D');
  });
});