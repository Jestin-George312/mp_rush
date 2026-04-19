const { chromium } = require('@playwright/test');

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: false });
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('https://example.com');
    console.log('Browser launched! Not closing it.');
})();
