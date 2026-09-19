import { test, expect } from '@playwright/test';

/**
 * Critical path: a visitor can reach sign-up and a signed-out visitor is never
 * dumped on a blank screen when they try to open the dashboard.
 *
 * These run signed out on purpose: the suite has to be runnable in CI without
 * seeding a real account. Authenticated flows live in `scheduling.spec.ts`
 * behind the same storage-state guard.
 */
test.describe('Onboarding entry points', () => {
  test('home page offers a way to start', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/aura/i);
    const start = page.getByRole('link', { name: /start|sign up|get started|free/i }).first();
    await expect(start).toBeVisible();
  });

  test('sign-up page renders its form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 15_000 });
  });

  test('dashboard redirects a signed-out visitor to sign in', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/(auth|login|signin|signup)/i, { timeout: 20_000 });
    expect(page.url()).toMatch(/auth|login|signin|signup/i);
  });

  test('retired setup links land on the single Connections page', async ({ page }) => {
    for (const legacy of ['/dashboard/tavily-limits', '/dashboard/integrations/tavily', '/dashboard/3rd-party-overview']) {
      await page.goto(legacy);
      await page.waitForURL(/integrations|auth|login/i, { timeout: 20_000 });
      expect(page.url()).toMatch(/integrations|auth|login/i);
    }
  });
});
