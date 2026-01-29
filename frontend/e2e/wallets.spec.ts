import { test, expect } from '@playwright/test';

test.describe('Wallets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /войти в демо-режим/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navigate to wallets and see list', async ({ page }) => {
    await page.goto('/wallets');
    await expect(page.getByText(/кошельки/i).first()).toBeVisible({ timeout: 10000 });
  });
});
