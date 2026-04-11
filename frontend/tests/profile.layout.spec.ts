import { expect, test } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('profile layout regression', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('desktop shell keeps the sidebar docked and the hero aligned', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop-only shell layout check');

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Profile overview')).toBeVisible();

    const shellMetrics = await page.locator('.shell-sidebar').first().evaluate((sidebar) => {
      const styles = window.getComputedStyle(sidebar);
      const rect = sidebar.getBoundingClientRect();
      return {
        position: styles.position,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    });

    const heroMetrics = await page.getByText('Profile overview').evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    });

    expect(shellMetrics.position).toBe('fixed');
    expect(shellMetrics.top).toBeLessThanOrEqual(1);
    expect(shellMetrics.left).toBeLessThanOrEqual(1);
    expect(shellMetrics.width).toBeGreaterThan(250);
    expect(shellMetrics.height).toBeGreaterThan(700);
    expect(heroMetrics.x).toBeGreaterThan(shellMetrics.width - 12);
    expect(heroMetrics.y).toBeLessThan(520);
  });

  test('desktop light theme keeps readable sidebar contrast', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop-only contrast check');

    await page.goto('/profile');

    const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
    const isDark = await page.locator('html').evaluate((node) => node.classList.contains('dark'));
    if (isDark) {
      await themeToggle.click();
    }

    await expect(page.locator('html')).not.toHaveClass(/dark/);

    const ratio = await page.locator('.shell-sidebar').first().evaluate((sidebar) => {
      const metaLine = sidebar.querySelector('.shell-sidebar-meta') as HTMLElement | null;
      if (!metaLine) return 0;

      const match = window.getComputedStyle(metaLine).color.match(/\d+/g);
      if (!match) return 0;

      const textColor = match.slice(0, 3).map(Number);
      const sidebarBackground = [255, 255, 255];

      const toLinear = (value: number) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      };

      const luminance = (rgb: number[]) => {
        const [r, g, b] = rgb.map(toLinear);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };

      const foreground = luminance(textColor);
      const background = luminance(sidebarBackground);
      const lighter = Math.max(foreground, background);
      const darker = Math.min(foreground, background);

      return (lighter + 0.05) / (darker + 0.05);
    });

    expect(ratio).toBeGreaterThan(4.5);
  });
});
