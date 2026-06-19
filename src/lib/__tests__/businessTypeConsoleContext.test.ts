import { describe, it, expect } from 'vitest';
import { getConsoleContext } from '../businessTypeConsoleContext';
import { BUSINESS_TYPE_TO_PROFILE } from '../businessTypeProfileMap';
import { ALL_PROFILE_KEYS } from '../industryProfiles';

describe('getConsoleContext', () => {
  it('resolves a profile for every business type in the 185-row map', () => {
    for (const bt of Object.keys(BUSINESS_TYPE_TO_PROFILE)) {
      const ctx = getConsoleContext(bt);
      expect(ALL_PROFILE_KEYS).toContain(ctx.profileKey);
      expect(ctx.profileSpec).toBeDefined();
      expect(ctx.displayLabel.length).toBeGreaterThan(0);
    }
  });

  it('returns matrix row + top channels for known types', () => {
    const ctx = getConsoleContext('plumber');
    expect(ctx.matrixRow).not.toBeNull();
    expect(ctx.topChannels.length).toBeGreaterThan(0);
  });

  it('falls back gracefully for unknown input', () => {
    const ctx = getConsoleContext(null, null);
    expect(ctx.profileKey).toBe('PROFILE_D');
    expect(ctx.displayLabel.length).toBeGreaterThan(0);
  });
});