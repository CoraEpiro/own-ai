import { expect, type Page } from '@playwright/test';

const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

export async function loginAsTestUser(page: Page) {
  if (!testEmail || !testPassword) {
    throw new Error('Missing PLAYWRIGHT_TEST_EMAIL or PLAYWRIGHT_TEST_PASSWORD for authenticated Playwright tests.');
  }

  await page.goto('/auth');
  await page.locator('input[type="email"]').fill(testEmail);
  await page.locator('input[type="password"]').first().fill(testPassword);
  await page.locator('form').getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/chat$/, { timeout: 30_000 });
}

export async function expectShellNavigation(page: Page) {
  const openNavigation = page.getByRole('button', { name: /Open navigation/i });

  if (await openNavigation.isVisible().catch(() => false)) {
    await openNavigation.click({ force: true });
  }

  await expect(page.getByText('Own AI').last()).toBeVisible();
  await expect(page.getByRole('link', { name: /Chat/i }).last()).toBeVisible();
  await expect(page.getByRole('link', { name: /Analytics/i }).last()).toBeVisible();
  await expect(page.getByRole('link', { name: /AI Studio/i }).last()).toBeVisible();
  await expect(page.getByRole('link', { name: /Settings/i }).last()).toBeVisible();
}
