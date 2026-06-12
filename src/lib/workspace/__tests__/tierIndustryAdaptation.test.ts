import { describe, it, expect } from 'vitest';
import { resolveCompanyWorkspace } from '../resolveCompanyWorkspace';
import type { CompanyForResolver, IndustryBlueprint } from '../types';

/**
 * Audit guarantee: industry adaptation (operating model, active consoles,
 * KPIs, agent actions, terminology) is driven entirely by the company's
 * industry blueprint — NOT by the subscription tier. Switching tier must
 * change `industryCapacity` only; every other workspace field stays
 * identical for the same industry.
 */

const RESTAURANT_BP: IndustryBlueprint = {
  slug: 'restaurants',
  name: 'Restaurant',
  operating_model: 'receptionist_only',
  primary_records: ['reservations'],
  default_consoles: ['receptionist', 'analytics'],
  default_kpis: ['covers_today', 'revenue_mtd'],
  agent_actions: { voice: ['send_smart_link'] },
  prompt_overrides: { terminology: { customer: 'guest' } },
  restrictions: { booking: false, dispatch: false },
};

const HVAC_BP: IndustryBlueprint = {
  slug: 'hvac',
  name: 'HVAC',
  operating_model: 'field_dispatch',
  primary_records: ['jobs'],
  default_consoles: ['field_ops', 'business_mgmt', 'analytics'],
  default_kpis: ['jobs_today', 'revenue_mtd'],
  agent_actions: { dispatch: ['assign_tech'] },
  prompt_overrides: { terminology: { customer: 'customer' } },
  restrictions: {},
};

const TIERS = ['starter', 'connect', 'performance', 'command'];

describe('industry adaptation is tier-independent', () => {
  for (const blueprint of [RESTAURANT_BP, HVAC_BP]) {
    it(`${blueprint.slug}: every tier resolves to the same operating model + consoles + kpis`, () => {
      const results = TIERS.map((tier) => {
        const company: CompanyForResolver = {
          id: 'c1',
          industry_vertical: blueprint.slug,
          subscription_tier: tier,
        };
        return resolveCompanyWorkspace(company, blueprint);
      });
      const baseline = results[0];
      for (const r of results) {
        expect(r.operatingModel).toBe(baseline.operatingModel);
        expect(r.activeConsoles).toEqual(baseline.activeConsoles);
        expect(r.kpis).toEqual(baseline.kpis);
        expect(r.agentActions).toEqual(baseline.agentActions);
        expect(r.promptOverrides).toEqual(baseline.promptOverrides);
        expect(r.restrictions).toEqual(baseline.restrictions);
      }
    });
  }

  it('tier only affects industryCapacity, not adaptation', () => {
    const core = resolveCompanyWorkspace(
      { id: 'c1', industry_vertical: 'restaurants', subscription_tier: 'starter' },
      RESTAURANT_BP,
    );
    const elite = resolveCompanyWorkspace(
      { id: 'c1', industry_vertical: 'restaurants', subscription_tier: 'elite' },
      RESTAURANT_BP,
    );
    expect(core.industryCapacity).toBeLessThan(elite.industryCapacity);
    expect(core.operatingModel).toBe(elite.operatingModel);
    expect(core.activeConsoles).toEqual(elite.activeConsoles);
  });

  it('missing blueprint still resolves with a safe fallback for any tier', () => {
    for (const tier of TIERS) {
      const w = resolveCompanyWorkspace(
        { id: 'c1', industry_vertical: null, subscription_tier: tier },
        null,
      );
      expect(w.operatingModel).toBe('custom');
      expect(w.activeConsoles).toContain('business_mgmt');
    }
  });
});