import { expect, test } from '@playwright/test';
import { expectShellNavigation, loginAsTestUser } from './helpers/auth';

test.describe('authenticated workspace smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('chat workspace loads after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByText(/Own AI/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/Message Own AI|Search the web|Uploading/i)).toBeVisible();
  });

  test('analytics page renders inside the shared shell', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Analytics Overview' })).toBeVisible();
    await expectShellNavigation(page);
    await expect(page.getByText('Date Range')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
  });

  test('settings page renders profile, instructions, memory, and voice sections', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expectShellNavigation(page);
    await expect(page.getByText('Custom Instructions')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Memory' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Voice' })).toBeVisible();
    await expect(page.getByText('Email').first()).toBeVisible();
  });

  test('knowledge buckets page renders creation and list states', async ({ page }) => {
    await page.goto('/buckets');
    await expect(page.getByRole('heading', { name: 'Knowledge Buckets' })).toBeVisible();
    await expectShellNavigation(page);
    await expect(page.getByPlaceholder('Bucket name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('admin route has a predictable outcome for the logged-in user', async ({ page }) => {
    await page.goto('/admin');

    const heading = page.getByRole('heading', { name: 'Admin Dashboard' });
    if (await heading.isVisible().catch(() => false)) {
      await expectShellNavigation(page);
      await expect(page.getByText('Users & Usage')).toBeVisible();
      return;
    }

    await expect(page).toHaveURL(/\/chat$/);
  });
});
