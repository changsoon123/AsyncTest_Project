# Test info

- Name: has title
- Location: C:\Cline\First_Project\AsyncFlow_Commerce\e2e\example.spec.ts:3:5

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\sool0\AppData\Local\ms-playwright\webkit-2158\Playwright.exe
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
>  3 | test('has title', async ({ page }) => {
     |     ^ Error: browserType.launch: Executable doesn't exist at C:\Users\sool0\AppData\Local\ms-playwright\webkit-2158\Playwright.exe
   4 |   await page.goto('/');
   5 |
   6 |   // Expect a title "to contain" a substring.
   7 |   await expect(page).toHaveTitle(/AsyncFlow Commerce/);
   8 | });
   9 |
  10 | test('get started link', async ({ page }) => {
  11 |   await page.goto('/');
  12 |
  13 |   // Expects page to have a heading with the name of the current URL.
  14 |   await expect(page.locator('h1')).toContainText('Welcome to AsyncFlow Commerce!');
  15 | });
  16 |
```