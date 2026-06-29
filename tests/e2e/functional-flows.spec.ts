import { test, expect } from '@playwright/test';

test.describe('Functional Flows - Dashboard and Analytics', () => {
  test('User can see dashboard and navigate to analytics', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Verify Dashboard renders
    await expect(page.locator('text="Dashboard Overview"')).toBeVisible();

    // Verify Transaksi Terbaru block is present
    await expect(page.locator('text="Transaksi Terbaru"')).toBeVisible();

    // Navigate to Analytics page
    await page.click('text="Analytics"');
    await expect(page).toHaveURL(/.*\/analytics/);

    // Verify Analytics page renders
    await expect(page.locator('text="Insight & Laporan"')).toBeVisible();
    await expect(page.locator('text="Arus Kas"')).toBeVisible();
  });

  test('User can navigate to transactions and see Quick Add', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page.locator('text="Riwayat Transaksi"')).toBeVisible();

    // Quick Add button should be present
    const quickAddButton = page.locator('button', { hasText: 'Quick Add' });
    await expect(quickAddButton.first()).toBeVisible();
  });
});
