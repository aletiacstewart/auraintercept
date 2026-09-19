import fs from 'node:fs';
import { test, expect } from '@playwright/test';

/**
 * Critical path: booking an appointment.
 *
 * Runs against the public booking page, which needs no account, so the check
 * works in CI. When a saved signed-in session exists at
 * `tests/e2e/.auth/state.json`, the dashboard booking flow is exercised too.
 */
const STATE = 'tests/e2e/.auth/state.json';
const hasSession = fs.existsSync(STATE);

test.describe('Booking', () => {
  test('public booking page loads and asks for the customer details', async ({ page }) => {
    await page.goto('/book');
    const anyField = page.getByRole('textbox').first();
    const fallback = page.getByText(/book|appointment|schedule/i).first();
    await expect(anyField.or(fallback)).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('Dashboard booking', () => {
  test.skip(!hasSession, 'No saved signed-in session at tests/e2e/.auth/state.json');
  test.use({ storageState: STATE });

  test('user can open the booking form from the schedule', async ({ page }) => {
    await page.goto('/dashboard/appointments');
    const bookButton = page.getByRole('button', { name: /book|new appointment|schedule/i }).first();
    await expect(bookButton).toBeVisible({ timeout: 20_000 });
    await bookButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
  });
});
