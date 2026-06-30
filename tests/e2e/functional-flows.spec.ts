import { test, expect } from '@playwright/test';

test.describe('Functional Flows - Dashboard and Analytics', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([{
      name: 'playwright-test',
      value: 'true',
      domain: 'localhost',
      path: '/'
    }]);
  });

  test('User can see dashboard and navigate to analytics', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Verify Transaksi Terbaru block is present
    await expect(page.locator('text="Transaksi Terbaru"')).toBeVisible();

    // Navigate to Analytics page
    await page.click('text="Analytics"');
    await expect(page).toHaveURL(/.*\/analytics/);

    // Verify Analytics page renders (Tab triggers are always visible)
    await expect(page.locator('text="Net Worth"')).toBeVisible();
  });

  test('User can navigate to transactions and see Add Transaction button', async ({ page }) => {
    await page.goto('/ledger');
    await expect(page.locator('text="Transaction Ledger"')).toBeVisible();

    // Tambah Transaksi button should be present
    const addTxButton = page.locator('button', { hasText: 'Tambah Transaksi' });
    await expect(addTxButton.first()).toBeVisible();
  });
});
