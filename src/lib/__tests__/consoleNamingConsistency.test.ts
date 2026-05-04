import { describe, it, expect } from 'vitest';
import {
  SERVICE_CONSOLE_INDUSTRY_IDS,
  getIndustryServiceConsoleConfig,
} from '@/lib/industryAgentMap';
import { getNavLabels } from '@/lib/industryNavLabels';
import type { IndustryPack } from '@/hooks/useIndustryPack';

const stripConsole = (s: string) => s.replace(/\s+Console$/i, '').trim();

const mkPack = (industry_id: string): IndustryPack =>
  ({
    industry_id,
    cluster: 'trades',
    terminology: {},
    console_visibility: { field_ops: 'full' },
  }) as IndustryPack;

describe('console + sidebar naming consistency', () => {
  for (const id of SERVICE_CONSOLE_INDUSTRY_IDS) {
    it(`${id}: sidebar labels match console titles`, () => {
      const pack = mkPack(id);
      const cfg = getIndustryServiceConsoleConfig(pack);
      const nav = getNavLabels(pack);
      expect(nav.dispatchView).toBe(stripConsole(cfg.consoleTitle));
      expect(nav.techView).toBe(stripConsole(cfg.workerConsoleTitle));
    });
  }
});