import { test, expect } from '@playwright/test';

test.describe('StockSense ERP Navigation & Application Shell', () => {
  test('should render the dashboard as default landing with exact ERP layout', async ({ page }) => {
    await page.goto('/');

    // Verify Title & Brand
    await expect(page).toHaveTitle(/StockSense/i);
    await expect(page.locator('text=StockSense').first()).toBeVisible();

    // Verify Dashboard Landing
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('text=Inventory overview').first()).toBeVisible();

    // Verify Receipt & Delivery Cards
    await expect(page.locator('h2:has-text("Receipt")')).toBeVisible();
    await expect(page.locator('h2:has-text("Delivery")')).toBeVisible();
    await expect(page.locator('text=0 to receive').first()).toBeVisible();
    await expect(page.locator('text=1 to deliver').first()).toBeVisible();

    // Verify 4 Metric KPI Cards
    await expect(page.locator('text=Stock value').first()).toBeVisible();
    await expect(page.locator('text=₹3,39,600').first()).toBeVisible();
    await expect(page.locator('text=Out of stock').first()).toBeVisible();
    await expect(page.locator('text=Moves recorded').first()).toBeVisible();

    // Verify Recent Operations
    await expect(page.locator('h2:has-text("Recent operations")')).toBeVisible();
    await expect(page.locator('text=View move history').first()).toBeVisible();
  });

  test('should navigate across ERP product routes via top navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Inbound Receipts
    await page.goto('/operations/receipts');
    await expect(page.locator('h1:has-text("Receipts")')).toBeVisible();

    // Outbound Deliveries
    await page.goto('/operations/deliveries');
    await expect(page.locator('h1:has-text("Deliveries")')).toBeVisible();

    // Products Catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // Stock Levels
    await page.goto('/stock');
    await expect(page.locator('h1:has-text("Stock")')).toBeVisible();

    // Move History Ledger
    await page.goto('/move-history');
    await expect(page.locator('h1:has-text("Move History")')).toBeVisible();

    // Settings (Warehouses & Locations)
    await page.goto('/settings');
    await expect(page.locator('h1:has-text("Warehouses")')).toBeVisible();
  });

  test('should keep developer diagnostics isolated under /internal/foundation', async ({
    page,
  }) => {
    await page.goto('/internal/foundation');

    // Verify Developer Diagnostics header
    await expect(page.locator('h1:has-text("Developer Diagnostics")')).toBeVisible();

    // Verify Infrastructure cards
    await expect(page.locator('text=API Runtime (Fastify)')).toBeVisible();
    await expect(page.locator('text=PostgreSQL Database')).toBeVisible();
    await expect(page.locator('text=Redis Infrastructure')).toBeVisible();
  });
});
