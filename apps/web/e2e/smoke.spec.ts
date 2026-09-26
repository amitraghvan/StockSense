import { test, expect } from '@playwright/test';

test.describe('StockSense Authentication & Protected Application Shell', () => {
  const timestamp = Date.now();
  const testUser = {
    name: 'ERP Admin User',
    email: `playwright_${timestamp}@example.com`,
    password: 'SecurePassword123!@#',
    tenantName: 'Playwright Global Corp',
  };

  test('should enforce route protection and redirect unauthenticated visitor to /login', async ({
    page,
  }) => {
    // Attempt to access protected dashboard directly
    await page.goto('/dashboard');

    // Should be redirected to /login with redirect parameter
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1:has-text("Sign in to your account")')).toBeVisible();
    await expect(page.locator('text=StockSense').first()).toBeVisible();
  });

  test('should complete full signup -> authenticated dashboard -> profile -> logout flow', async ({
    page,
  }) => {
    // 1. Visit signup page

    await page.goto('/signup');
    await expect(page.locator('h1:has-text("Create your workspace")')).toBeVisible();

    // 2. Fill registration form
    await page.locator('#name').fill(testUser.name);
    await page.locator('#email').fill(testUser.email);
    await page.locator('#tenantName').fill(testUser.tenantName);
    await page.locator('#password').fill(testUser.password);

    // 3. Submit
    await page.locator('button:has-text("Create Workspace")').click();

    // 4. Verify successful redirection to Dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Verify User avatar initial exists in top navigation
    const avatarButton = page.locator('button[aria-label="Account menu"]');
    await expect(avatarButton).toBeVisible();
    await expect(avatarButton).toHaveText('E'); // First letter of 'ERP Admin User'

    // 5. Navigate across ERP product routes as authenticated user
    await page.goto('/operations/receipts');
    await expect(page.locator('h1:has-text("Receipts")')).toBeVisible();

    await page.goto('/operations/deliveries');
    await expect(page.locator('h1:has-text("Deliveries")')).toBeVisible();

    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    await page.goto('/stock');
    await expect(page.locator('h1:has-text("Stock")')).toBeVisible();

    await page.goto('/move-history');
    await expect(page.locator('h1:has-text("Move History")')).toBeVisible();

    await page.goto('/settings');
    await expect(page.locator('h1:has-text("Warehouse")').first()).toBeVisible();

    // 6. Navigate to User Profile page
    await page.goto('/profile');
    await expect(page.locator('h1:has-text("Account Profile")')).toBeVisible();
    await expect(page.locator(`text=${testUser.name}`).first()).toBeVisible();
    await expect(page.locator(`text=${testUser.tenantName}`).first()).toBeVisible();
    await expect(page.locator('text=ACTIVE WORKSPACE').first()).toBeVisible();

    // 7. Perform Logout
    await avatarButton.click();
    const signOutBtn = page.locator('button:has-text("Sign Out")');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    // 8. Confirm redirected to Login page
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Sign in to your account")')).toBeVisible();
  });

  test('should handle forgot password and OTP reset navigation', async ({ page }) => {
    // 1. Visit forgot password
    await page.goto('/forgot-password');
    await expect(page.locator('h1:has-text("Reset your password")')).toBeVisible();

    // 2. Submit email
    await page.locator('#email').fill(testUser.email);
    await page.locator('button:has-text("Send Verification Code")').click();

    // 3. Confirm confirmation message appears
    await expect(page.locator('text=verification code has been dispatched').first()).toBeVisible();

    // 4. Automatically or manually navigate to reset password page
    await page.goto(`/reset-password?email=${encodeURIComponent(testUser.email)}`);
    await expect(page.locator('h1:has-text("Set new password")')).toBeVisible();
    await expect(page.locator('#email')).toHaveValue(testUser.email);
  });
});
