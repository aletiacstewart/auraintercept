import { expect, test, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.VISUAL_TEST_EMAIL ?? 'corecompany@demo.com';
const ADMIN_PASSWORD = process.env.VISUAL_TEST_PASSWORD ?? 'aidemo*!';
const TECH_EMAIL = process.env.VISUAL_TEST_TECH_EMAIL ?? 'coreemployee@demo.com';
const TECH_PASSWORD = process.env.VISUAL_TEST_TECH_PASSWORD ?? 'aidemo*!';

const dashboardRoutes = [
  '/dashboard',
  '/dashboard/quick-setup',
  '/dashboard/knowledge',
  '/dashboard/3rd-party-overview',
  '/dashboard/ai-consoles/customer-portal',
  '/dashboard/ai-consoles/field-ops',
  '/dashboard/ai-consoles/business-mgt-ops',
  '/dashboard/ai-consoles/marketing-sales',
  '/dashboard/ai-consoles/social-media',
  '/dashboard/ai-consoles/analytics',
  '/dashboard/content-engine',
  '/dashboard/customer-website-app',
  '/dashboard/dispatch-field-ops',
  '/dashboard/calls',
  '/dashboard/email-logs',
  '/dashboard/sms-logs',
  '/dashboard/analytics',
  '/dashboard/subscription',
  '/dashboard/inventory',
  '/dashboard/quotes',
  '/dashboard/invoices',
  '/dashboard/referrals',
  '/dashboard/campaigns',
  '/dashboard/leads',
  '/dashboard/help',
  '/dashboard/notification-settings',
  '/dashboard/video-prompts',
  '/dashboard/platform-guides',
];

const technicianRoutes = [
  '/technician',
  '/technician/ai-console',
  '/technician/jobs',
  '/technician/calendar',
  '/technician/settings',
  '/technician/availability',
  '/technician/history',
  '/technician/profile',
  '/technician/install',
];

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth?mode=company&tab=login');
  await page.getByLabel('Email').first().fill(email);
  await page.getByLabel('Password').first().fill(password);
  await page.getByRole('button', { name: /sign in/i }).first().click();
  await page.waitForURL(/\/(dashboard|technician)/, { timeout: 30_000 });
}

async function assertDarkSurfaceTextContrast(page: Page) {
  const offenders = await page.locator('.dashboard-main').evaluate((root) => {
    const parseRgb = (value: string) => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return null;
      return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: match[4] === undefined ? 1 : Number(match[4]),
      };
    };

    const isDark = (element: Element) => {
      let node: Element | null = element;
      while (node && node !== root.parentElement) {
        const bg = parseRgb(getComputedStyle(node).backgroundColor);
        if (bg && bg.a > 0.2) {
          const luminance = 0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b;
          return luminance < 80;
        }
        node = node.parentElement;
      }
      return true;
    };

    const isGrey = (rgb: { r: number; g: number; b: number; a: number }) => {
      const spread = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
      return rgb.a >= 0.99 && spread <= 18 && Math.max(rgb.r, rgb.g, rgb.b) < 245;
    };

    return Array.from(root.querySelectorAll<HTMLElement>('span,p,li,small,label,div,h1,h2,h3,h4,h5,h6,a,button'))
      .filter((element) => element.offsetParent !== null && (element.innerText || '').trim().length > 0)
      .map((element) => ({ element, color: parseRgb(getComputedStyle(element).color) }))
      .filter(({ element, color }) => color && isDark(element) && isGrey(color))
      .slice(0, 20)
      .map(({ element, color }) => ({
        text: element.innerText.trim().slice(0, 80),
        className: element.className?.toString(),
        color: `rgb(${color!.r}, ${color!.g}, ${color!.b})`,
      }));
  });

  expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
}

test.describe('dashboard and console text contrast', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  for (const route of dashboardRoutes) {
    test(`${route} has no grey text on dark dashboard cards`, async ({ page }) => {
      await page.goto(route);
      await page.locator('.dashboard-main').waitFor({ state: 'visible' });
      await page.waitForLoadState('networkidle');
      await assertDarkSurfaceTextContrast(page);
      await expect(page.locator('.dashboard-main')).toHaveScreenshot(`${route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.png`);
    });
  }
});

test.describe('technician console text contrast', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TECH_EMAIL, TECH_PASSWORD);
  });

  for (const route of technicianRoutes) {
    test(`${route} has no grey text on dark dashboard cards`, async ({ page }) => {
      await page.goto(route);
      await page.locator('.dashboard-main').waitFor({ state: 'visible' });
      await page.waitForLoadState('networkidle');
      await assertDarkSurfaceTextContrast(page);
      await expect(page.locator('.dashboard-main')).toHaveScreenshot(`${route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.png`);
    });
  }
});
