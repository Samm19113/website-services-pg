import { chromium } from 'playwright';

// -------- CONFIG --------
const EMAIL = 'name@example.com';
const PASSWORD = '12345678';
const BRAND_NAME = 'brand_name';
const DEVICE_TYPE = 'device_type';
// ------------------------

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // 1. Login
  await page.goto('https://admin.phonegallery.repair/');
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button:has-text("Sign In")');

  await page.waitForSelector('a:has-text("Repair Services")', { timeout: 60000 });
  console.log('Login successful!');

  // 2. Go to Repair Services
  await page.goto('https://admin.phonegallery.repair/repair-services');
  await page.waitForSelector('button:has-text("Add Repair Service")', { timeout: 60000 });
  console.log('Repair Services page loaded!');

  // 3. Open Add Repair Service dialog
  await page.locator('button:has-text("Add Repair Service")').click();
  const dialog = page.locator('div[role="dialog"][data-state="open"]');
  await dialog.waitFor({ state: 'visible' });

  // 4. Select Brand
  const brandDropdown = dialog.locator('button[role="combobox"]').first();
  await brandDropdown.click();
  await page
    .locator('div[role="option"]')
    .filter({ hasText: new RegExp(`^${BRAND_NAME}$`) })
    .click();

  // 5. Select Device Type
  const typeDropdown = dialog.locator('button[role="combobox"]').nth(1);
  await typeDropdown.click();
  await page
    .locator('div[role="option"]')
    .filter({ hasText: new RegExp(`^${DEVICE_TYPE}$`) })
    .click();

  // 6. Open Model dropdown
  const modelDropdown = dialog.locator('button[role="combobox"]').nth(2);
  await modelDropdown.click();

  // 7. Extract all models as a JS array
  const models = await page
    .locator('div[role="option"]')
    .evaluateAll(options => options.map(o => o.textContent.trim()).filter(Boolean));

  // 8. Log the array
  console.log(models);

  // Optionally, keep browser open to inspect
  // await browser.close();
})();
