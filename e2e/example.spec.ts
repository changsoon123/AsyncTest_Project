import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/AsyncFlow Commerce/);
});

test('get started link', async ({ page }) => {
  await page.goto('/');

  // Expects page to have a heading with the name of the current URL.
  await expect(page.locator('h1')).toContainText('Welcome to AsyncFlow Commerce!');
});
