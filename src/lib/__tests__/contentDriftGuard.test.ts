import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Content drift guard: prevents forbidden strings from re-appearing in
 * customer-facing source files (pages, docs, PDFs, guides, help, locales,
 * edge-function shared strings).
 *
 * If this test fails, either fix the copy or update the allowlist below with
 * a written justification.
 */

const ROOTS = [
  'src/pages',
  'src/components/documentation',
  'src/components/audit',
  'src/components/marketing',
  'src/components/onboarding',
  'src/components/integrations',
  'src/lib',
  'src/locales',
  'supabase/functions/_shared',
];

// Files intentionally exempt (registries, sales-prompt meta-instructions,
// HIPAA gate lists, back-compat aliases, tests themselves).
const ALLOWLIST = new Set<string>([
  'src/lib/industryVisibility.ts',
  'src/lib/industryIdAliases.ts',
  'src/lib/mainIndustryCategories.ts',
  'src/lib/businessTypeRegistry.ts',
  'src/lib/businessTypeProfileMap.ts',
  'src/lib/auraInterceptSalesPrompt.ts',
  'src/lib/helpSystemPrompt.ts',
  'src/lib/jobStatusLabels.ts',
  'src/lib/marketingPlatformMatrix.ts',
  'src/lib/__tests__/contentDriftGuard.test.ts',
  'supabase/functions/_shared/industry-aliases.ts',
]);

interface Rule {
  name: string;
  pattern: RegExp;
}

const RULES: Rule[] = [
  { name: 'phone porting offer', pattern: /\bport\s+(?:my|your)\s+(?:existing\s+)?(?:business\s+)?number\b/i },
  { name: 'Google Workspace as paid vendor', pattern: /(?<!no\s)(?<!not\s)(?:requires?|need|paid)\s+(?:a\s+)?Google\s+Workspace\s+(?:plan|subscription|account)/i },
  { name: 'onboarding@ outbound alias', pattern: /onboarding@auraintercept/i },
  { name: 'legacy Marketing (Pro+) label', pattern: /\bMarketing\s+\(Pro\+\)/ },
  { name: 'legacy Billing (Elite) label', pattern: /\bBilling\s+\(Elite\)/ },
  { name: 'bundled 3rd-party phrasing (our platform)', pattern: /\bwe\s+bundle\b|\bwe\s+absorb\b|\bwe\s+cover\s+overage/i },
  { name: '24 hour demo', pattern: /24[- ]hour\s+demo/i },
  { name: '14 day trial', pattern: /14[- ]day\s+trial/i },
  { name: '48hrs timeline', pattern: /\b48\s?hrs?\b/i },
  { name: 'minutes not months', pattern: /minutes,\s+not\s+months/i },
];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|json|md)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r)).filter((f) => !ALLOWLIST.has(f));

describe('content drift guard', () => {
  for (const rule of RULES) {
    it(`no source file contains: ${rule.name}`, () => {
      const hits: string[] = [];
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (rule.pattern.test(line)) hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 160)}`);
        });
      }
      expect(hits, `Forbidden pattern (${rule.name}) found:\n${hits.join('\n')}`).toEqual([]);
    });
  }

  it('canonical Beta pricing values are present in launchPricing.ts', () => {
    const src = fs.readFileSync('src/lib/launchPricing.ts', 'utf-8');
    for (const val of ['497', '994', '1988', '3979', '249', '1990']) {
      expect(src, `Missing canonical pricing value ${val}`).toMatch(new RegExp(`\\b${val}\\b`));
    }
  });

  it('60-day trial phrasing is used (not 14-day / 30-day)', () => {
    const marketingCopy = fs.readFileSync('src/locales/en/marketing.json', 'utf-8');
    expect(marketingCopy).toMatch(/60-Day Live Trial/i);
  });
});