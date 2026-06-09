import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

// --------------------
// Fix __dirname (ESM)
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------
// Config
// --------------------
const EMAIL = 'hassan901002@gmail.com';
const PASSWORD = 'Santander112@';
const CSV_PATH = path.join(__dirname, 'general.csv');


function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --------------------
// Models to process
// --------------------
const MODELS = [
  'Galaxy Tab S T700/T705 8.4',
  'Galaxy Tab S11 5G X736',
  'Galaxy Tab S11 Wi-Fi X730',
  'Galaxy Tab S11 Ultra Wi-Fi X930',
  'Galaxy Tab S11 Ultra 5G X936',
  'Galaxy Tab S10 Ultra Wi-Fi X920',
  'Galaxy Tab S10 Ultra 5G X926',
  'Galaxy Tab S10 Plus Wi-Fi X820',
  'Galaxy Tab S10 Plus 5G X826',
  'Galaxy Tab S10 Lite Wi-Fi X400',
  'Galaxy Tab S10 Lite 5G X406',
  'Galaxy Tab S10 FE Wi-Fi X520',
  'Galaxy Tab S10 FE Plus Wi-Fi X620',
  'Galaxy Tab S10 FE Plus 5G X626',
  'Galaxy Tab S10 FE 5G X526',
  'Galaxy Tab S9 5G X716',
  'Galaxy Tab S9 Wi-Fi X710',
  'Galaxy Tab S9 Ultra Wi-Fi X910',
  'Galaxy Tab S9 Ultra 5G X916',
  'Galaxy Tab S9 Plus Wi-Fi X810',
  'Galaxy Tab S9 Plus 5G X816',
  'Galaxy Tab S9 FE Wi-Fi X510',
  'Galaxy Tab S9 FE Plus Wi-Fi X610',
  'Galaxy Tab S9 FE Plus 5G X616',
  'Galaxy Tab S9 FE 5G X516',
  'Galaxy Tab S8 5G X706',
  'Galaxy Tab S8 Wi-Fi X700',
  'Galaxy Tab S8 Ultra Wi-Fi X900',
  'Galaxy Tab S8 Ultra 5G X906',
  'Galaxy Tab S8 Plus Wi-Fi X800',
  'Galaxy Tab S8 Plus 5G X806',
  'Galaxy Tab S7 4G T875',
  'Galaxy Tab S7 Wi-Fi T870',
  'Galaxy Tab S7 Plus Wi-Fi T970',
  'Galaxy Tab S7 Plus 5G T976',
  'Galaxy Tab S7 Plus 4G T975',
  'Galaxy Tab S7 FE 5G T736',
  'Galaxy Tab S6 4G T865',
  'Galaxy Tab S6 Wi-Fi T860',
  'Galaxy Tab S6 Lite Wi-Fi P610',
  'Galaxy Tab S6 Lite 2024 4G P625',
  'Galaxy Tab S6 Lite 2024 Wi-Fi P620',
  'Galaxy Tab S6 Lite 2022 4G P619',
  'Galaxy Tab S6 Lite 2022 Wi-Fi P613',
  'Galaxy Tab S6 Lite 4G P615',
  'Galaxy Tab S5e Wi-Fi T720',
  'Galaxy Tab S5e 4G T725',
  'Galaxy Tab S4 SM-T830/T835',
  'Galaxy Tab S2 9.7" T819',
  'Galaxy Tab S2 9.7" T810/T815',
  'Galaxy Tab E T560/T561',
  'Galaxy Tab A 2018 10.5 T590',
  'Galaxy Tab A 10.1 2019 WI-FI T510',
  'Galaxy Tab A 10.1 2016 Wi-Fi T580',
  'Galaxy Tab A 10.1 2016 T585',
  'Galaxy Tab A 9.7 T550/T555',
  'Galaxy Tab A 8.0 4G T295',
  'Galaxy Tab A 8.0 T290',
  'Galaxy Tab A 7.0 2016 Wi-Fi T280',
  'Galaxy Tab A11 4G X135',
  'Galaxy Tab A11 Wi-Fi X130',
  'Galaxy Tab A11 Plus Wi-Fi X230',
  'Galaxy Tab A11 Plus 5G X236',
  'Galaxy Tab A9 Plus Wi-Fi X210',
  'Galaxy Tab A9 Plus 5G X216',
  'Galaxy Tab A9 LTE X115',
  'Galaxy Tab A8 4G X205',
  'Galaxy Tab A8 WI-FI X200',
  'Galaxy Tab A7 4G T505',
  'Galaxy Tab A7 Wi-Fi T500',
  'Galaxy Tab A7 Lite Wi-Fi T220',
  'Galaxy Tab A7 Lite 4G T225',
  'Galaxy Tab Active Pro 4G Entreprise Edition T545',
  'Galaxy Tab Active 5 5G X306',
  'Galaxy Tab Active5 Pro 5G X356',
  'Galaxy Tab Active4 Pro Wi-Fi T630',
  'Galaxy Tab Active4 Pro 5G T636',
  'Galaxy Tab 10.1 P7500',
  'Galaxy Tab 8.9',
  'Galaxy Tab 4 10.1 T535',
  'Galaxy Tab 4 T530',
  'Galaxy Tab 3 10.1 P5220',
  'Galaxy Tab 3 10.1 P5210',
  'Galaxy Tab 3 10.1 P5200',
  'Galaxy Tab 3 10.1 P5120',
  'Galaxy Tab 3 8.0 T311',
  'Galaxy Tab 3 8.0 T310',
  'Galaxy Tab 3 7.0 T230',
  'Galaxy Tab 3 7.0 P3200',
  'Galaxy Tab 3 7 T211',
  'Galaxy Tab 3 7 T210',
  'Galaxy Tab 3 Lite T110',
  'Galaxy Tab 2 10.1 P5110',
  'Galaxy Tab 2 10.1 P5100',
  'Galaxy Tab 2 7.0 P3110',
  'Galaxy Tab 2 7.0 P3100',
  'Galaxy Tab Pro 10.1 T520/T525'
];


const ICON_MAP = {
  'Back Camera Glass': 'Back Camera Glass',
  'Battery': 'Battery',
  'Bluetooth': 'Bluetooth',
  'Call Speaker': 'Call Speaker',
  'Camera': 'Camera',
  'Front Camera': 'Front Camera',
  'Software': 'Software',
  'Connector': 'Connector',
  'Water Damage': 'Water Damage',
  'Back Glass': 'Back Glass',
  'Power Button': 'Power Button',
  'Screen': 'Screen',
  'SIM Card Reader': 'SIM Card Reader',
  'Speaker': 'Speaker',
  'Vibrator': 'Vibrator',
  'Volume Buttons': 'Volume Buttons',
  'WiFi': 'WiFi',
  'General Repair': 'General Repair',
  'Charging Port' : 'Charging Port',
  'NFC Tag' : 'NFC Tag',
  'Microphone' : 'Microphone'
};




(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // --------------------
  // 1. Login
  // --------------------
  await page.goto('https://admin.phonegallery.repair/');
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button:has-text("Sign In")');

  await page.waitForSelector('a:has-text("Repair Services")', { timeout: 60000 });
  console.log('Login successful!');

  // --------------------
  // 2. Go to Repair Services
  // --------------------
  await page.goto('https://admin.phonegallery.repair/repair-services');
  await page.waitForSelector('button:has-text("Add Repair Service")', { timeout: 60000 });
  console.log('Repair Services page loaded!');

  // --------------------
  // 3. Load CSV
  // --------------------
  const csvText = fs.readFileSync(CSV_PATH, 'utf8');
  const services = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  // --------------------
  // 4. Main loop
  // --------------------
  for (const model of MODELS) {
    console.log(`\nProcessing model: ${model}`);

    for (const service of services) {

      // Open dialog
      await page.locator('button:has-text("Add Repair Service")').click();

      const dialog = page.locator('div[role="dialog"][data-state="open"]');
      await dialog.waitFor({ state: 'visible' });

      // -------- Brand --------
      const brandDropdown = dialog.locator('button[role="combobox"]').first();
      await brandDropdown.click();
      await page.locator('div[role="option"]:has-text("Samsung")').click();

      // -------- Device Type --------
      const typeDropdown = dialog.locator('button[role="combobox"]').nth(1);
      await typeDropdown.click();
      await page.locator('div[role="option"]:has-text("Tab")').click();

      // -------- Device Model --------
      // Open Device Model dropdown (3rd combobox)
      const modelDropdown = dialog.locator('button[role="combobox"]').nth(2);
      await modelDropdown.click();

      const safeModel = escapeRegExp(model);

      // Select model by EXACT literal text
      await page
        .locator('div[role="option"]')
        .filter({ hasText: new RegExp(`^${safeModel}$`) })
        .click();


      // -------- Service Name --------
      await dialog.locator('input[name="name"]').fill(service.service_name);

      // -------- Price (required field) --------
      await dialog.locator('input[name="price"]').fill('1');

      // -------- Icon --------
      const iconName = ICON_MAP[service.icon_key];

      if (!iconName) {
        console.warn(`⚠ Unknown icon key: ${service.icon_key}`);
        await dialog.locator('button:has-text("Cancel")').click();
        await dialog.waitFor({ state: 'detached' });
        continue;
      }

      // Icon dropdown is the 4th combobox:
      // 0 = Brand
      // 1 = Device Type
      // 2 = Device Model
      // 3 = Icon
      const iconDropdown = dialog.locator('button[role="combobox"]').nth(3);
      await iconDropdown.click();

      // Select icon by exact visible text
      await page
        .locator('div[role="option"]')
        .filter({ hasText: new RegExp(`^${iconName}$`) })
        .click();



      // -------- Submit --------
      await dialog.locator('button:has-text("Create Service")').click();

      // Wait for dialog to close
      await dialog.waitFor({ state: 'detached', timeout: 30000 });

      console.log(`  ✔ ${service.service_name}`);
    }
  }

  console.log('\nAll services processed successfully.');
})();
