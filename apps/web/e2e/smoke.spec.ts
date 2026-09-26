import { test, expect } from '@playwright/test';

test.describe('StockSense Product Navigation & Application Shell', () => {
  test('should render the product dashboard as default landing', async ({ page }) => {
    await page.goto('/');

    // Verify Title & Brand
    await expect(page).toHaveTitle(/StockSense/i);
    await expect(page.locator('text=StockSense').first()).toBeVisible();

    // Verify Dashboard Landing
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h2:has-text("Inventory Dashboard")')).toBeVisible();

    // Verify Operational Overview Cards
    await expect(page.locator('text=Receipts').first()).toBeVisible();
    await expect(page.locator('text=Delivery Orders').first()).toBeVisible();
    await expect(page.locator('text=Internal Transfers').first()).toBeVisible();
    await expect(page.locator('text=Adjustments').first()).toBeVisible();
  });

  test('should navigate across primary product routes without phase badges', async ({ page }) => {
    await page.goto('/dashboard');

    // Operations Hub
    await page.goto('/operations');
    await expect(page.locator('h2:has-text("Operations Hub")')).toBeVisible();

    // Inbound Receipts
    await page.goto('/operations/receipts');
    await expect(page.locator('h2:has-text("Incoming Receipts")')).toBeVisible();

    // Outbound Deliveries
    await page.goto('/operations/deliveries');
    await expect(page.locator('h2:has-text("Delivery Orders")')).toBeVisible();

    // Products Catalog
    await page.goto('/products');
    await expect(page.locator('h2:has-text("Products & Items")')).toBeVisible();

    // Move History Ledger
    await page.goto('/move-history');
    await expect(page.locator('h2:has-text("Stock Move History")')).toBeVisible();

    // Settings (Warehouse & Locations)
    await page.goto('/settings');
    await expect(page.locator('h2:has-text("Settings & Configuration")')).toBeVisible();
    await expect(page.locator('text=Warehouses & Locations').first()).toBeVisible();
  });

  test('should keep developer diagnostics isolated under /internal/foundation', async ({
    page,
  }) => {
    await page.goto('/internal/foundation');

    // Verify Developer Diagnostics header
    await expect(page.locator('text=Developer Diagnostics & Foundation')).toBeVisible();

    // Verify Infrastructure cards
    await expect(page.locator('text=API Runtime (Fastify)')).toBeVisible();
    await expect(page.locator('text=PostgreSQL Database')).toBeVisible();
    await expect(page.locator('text=Redis Infrastructure')).toBeVisible();
  });
});
