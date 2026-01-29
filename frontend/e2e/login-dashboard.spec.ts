import { test, expect } from '@playwright/test';

test.describe('Login and Dashboard', () => {
  test('demo login and navigate to dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /вход в систему/i })).toBeVisible();

    await page.getByRole('button', { name: /войти в демо-режим/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/добро пожаловать|общий доход/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('login with email and password then dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/введите email/i).first().fill('demo@example.com');
    await page.getByPlaceholder(/введите пароль/i).first().fill('demo123');
    await page.getByRole('button', { name: /^Войти$/ }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/добро пожаловать|общий доход/i).first()).toBeVisible({ timeout: 10000 });
  });
});
