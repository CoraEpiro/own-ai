import { expect, test } from '@playwright/test';

test.describe('auth flow smoke', () => {
  test('auth page renders core branding and form controls', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.locator('body')).toContainText('Own AI');
    await expect(page.getByRole('button', { name: 'Sign in' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' }).first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('signed-out root navigation lands on auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth$/);
  });
});
