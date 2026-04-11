import { expect, test } from '@playwright/test';

test.describe('public entry flow smoke', () => {
  test('landing page renders core product story', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /all the ai/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started free/i }).first()).toBeVisible();
    await expect(page.getByText(/transparent usage/i)).toBeVisible();
  });

  test('landing CTA routes into auth', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /get started free/i }).first().click();
    await expect(page).toHaveURL(/\/auth$/);
  });

  test('auth page renders branding and form controls', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.locator('body')).toContainText('Own AI');
    await expect(page.getByRole('button', { name: 'Log in' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign up' }).first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('signed-out root navigation lands on the public landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: /none of the waste/i })).toBeVisible();
  });
});
