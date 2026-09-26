import { test, expect } from '@playwright/test';

test.describe('StockSense Web Application Shell (Smoke)', () => {
  test('should render the foundation dashboard and application shell', async ({ page }) => {
    await page.goto('/');

    // Verify Title & Brand
    await expect(page).toHaveTitle(/StockSense/i);
    await expect(page.locator('text=StockSense').first()).toBeVisible();

    // Verify Phase 01 Badge
    await expect(page.locator('text=Phase 01: Foundation').first()).toBeVisible();

    // Verify Architecture Blueprint
    await expect(page.locator('text=Architecture: Modular Monolith')).toBeVisible();

    // Verify Infrastructure cards
    await expect(page.locator('text=API Runtime (Fastify)')).toBeVisible();
    await expect(page.locator('text=PostgreSQL Database')).toBeVisible();
    await expect(page.locator('text=Redis Infrastructure')).toBeVisible();
  });
});
