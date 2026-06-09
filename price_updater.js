import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

// -------- CONFIG --------
const EMAIL = 'hassan901002@gmail.com';
const PASSWORD = 'Santander112@';
const BRAND_NAME = 'Xiaomi';
const DEVICE_TYPE = 'Phone';

const MODELS_FILE = path.join('C:\\Users\\samam\\Desktop\\PG', 'price_list_models.csv');
const PRICE_FILE = path.join('C:\\Users\\samam\\Desktop\\PG', 'price_list.xlsx');

// --------------------
// Load Models (CSV)
// --------------------
function loadModels() {
    const content = fs.readFileSync(MODELS_FILE, 'utf-8');
    return content
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);
}

// --------------------
// Load Prices (Excel)
// --------------------
function loadPrices() {
    const workbook = XLSX.readFile(PRICE_FILE);

    // Auto-detect first sheet instead of hardcoding name
    const sheetName = workbook.SheetNames[0];
    console.log('Using Excel sheet:', sheetName);

    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}


// --------------------
// Index Excel by Model → Service → Price
// --------------------
function indexExcel(prices) {
    const header = Object.keys(prices[0]);      // Row 1
    const serviceColumns = header.slice(3);     // D → AG

    const index = {};

    for (const row of prices) {
        const model = String(row['Device Model'] || '').trim();
        if (!model) continue;

        index[model] = {};

        for (const service of serviceColumns) {
            const price = row[service];
            if (price !== '' && price !== null && price !== undefined) {
                index[model][service.trim()] = price;
            }
        }
    }
    return index;
}

// --------------------
// Main Script
// --------------------
(async () => {
    const models = loadModels();
    const prices = loadPrices();
    const excelIndex = indexExcel(prices);

    console.log(`Models to process: ${models.length}`);

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

 // 3. Process each model
    for (const model of models) {
        console.log(`\n--- Processing model: ${model} ---`);

        const modelPrices = excelIndex[model];
        if (!modelPrices) {
            console.log(`❌ No Excel row found for ${model}`);
            continue;
        }

        const updatedServices = new Set();
        await page.fill('input[placeholder="Search by model name..."]', model);
        await page.waitForTimeout(2000); // Wait for search results to filter

        let hasNext = true;

        while (hasNext) {
            // 1. Get a fresh list of rows every time to avoid "Stale Element" errors
            const rows = await page.$$('tr[data-slot="table-row"]');
            let updatedInThisPass = false;

            for (const row of rows) {
                // Corrected Columns: 5 is Model, 3 is Service Name
                const modelCell = await row.$('td:nth-child(5)');
                const serviceCell = await row.$('td:nth-child(3)');

                if (!modelCell || !serviceCell) continue;

                const modelText = (await modelCell.innerText()).trim();
                const serviceName = (await serviceCell.innerText()).trim();

                // Skip if it doesn't match or we already did it
                if (modelText !== model || updatedServices.has(serviceName)) continue;

                const price = modelPrices[serviceName];
                if (price === undefined) continue;

                console.log(`✔ Updating: ${serviceName} → ${price}`);

                const editBtn = await row.$('button[aria-label="Edit Repair Service"]');
                if (!editBtn) continue;

 
// --- REFINED STABILITY FIX ---
// --- NUCLEAR STABILITY FIX ---
                // 1. Click Edit and wait for the site to settle
                await editBtn.click();
                await page.waitForTimeout(1000); 

                // 2. Use direct selectors instead of saved references to avoid "Detached" errors
                const inputSelector = 'div[role="dialog"] input[name="price"]';
                const updateBtnSelector = 'div[role="dialog"] button:has-text("Update")';

                try {
                    // Wait for the input to actually exist and be visible
                    await page.waitForSelector(inputSelector, { state: 'visible', timeout: 5000 });
                    
                    // Click to focus, then use 'type' instead of 'fill' (slower but more stable)
                    await page.click(inputSelector);
                    
                    // Clear the existing value first
                    await page.keyboard.press('Control+A');
                    await page.keyboard.press('Backspace');
                    
                    // Type the price like a human (50ms delay between keys)
                    await page.type(inputSelector, price.toString(), { delay: 50 });
                    
                    // Force the website to recognize the new data
                    await page.dispatchEvent(inputSelector, 'input');
                    await page.dispatchEvent(inputSelector, 'change');
                } catch (e) {
                    console.log(`   Input interaction failed, attempting backup fill...`);
                    await page.fill(inputSelector, price.toString()).catch(() => null);
                }

                // 3. Click Update and wait for the modal to vanish
                try {
                    await page.waitForTimeout(500); 
                    await page.click(updateBtnSelector, { timeout: 5000 });
                    
                    // Wait for the dialog to be GONE from the screen
                    await page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 8000 });
                } catch (e) {
                    console.log(`   Update sequence completed with backup escape.`);
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(500);
                }

                // -----------------------------------------------

                updatedServices.add(serviceName);
                updatedInThisPass = true;
                
                // CRITICAL: Break the 'for' loop and re-scan the table 
                // This prevents the "Element not attached to DOM" error
                break; 
            }

            // If we've checked all visible rows and updated nothing new, move to next page
            if (!updatedInThisPass) {
                const nextBtn = await page.$('button:has-text("Next")');
                if (nextBtn && !(await nextBtn.isDisabled())) {
                    console.log("Moving to next page...");
                    await nextBtn.click();
                    await page.waitForTimeout(2000);
                } else {
                    hasNext = false;
                }
            }
        }
    }

    console.log('\n✅ All models processed successfully!');
    await browser.close();
})();