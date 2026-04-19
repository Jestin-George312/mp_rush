const { chromium } = require('@playwright/test');

(async () => {
    try {
        console.log('Launching browser for demonstration...');
        const browser = await chromium.launch({ headless: false, slowMo: 50 });

        // Helper function for login
        async function loginAndNavigate(email, password, contextName, targetUrl) {
            console.log(`Setting up context for ${contextName}...`);
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto('http://localhost:5173/login');
            
            await page.fill('#login-email', email);
            await page.fill('#login-password', password);
            await page.click('button[type="submit"]');
            
            // Wait for navigation after login
            await page.waitForTimeout(1500); // Wait for the toast and redirects
            if (targetUrl) {
                await page.goto(targetUrl);
                await page.waitForLoadState('networkidle');
            }
            return { context, page };
        }

        // --- 1. Student 1: Individual Topic Submission ---
        console.log('Logging in as Student 1...');
        const { page: student1Page } = await loginAndNavigate(
            'student1@test.com', 'Student123!', 'Student 1', 'http://localhost:5173/student/submit-topic'
        );
        
        console.log('Student 1 submitting topic...');
        // The components might not have standard name attributes, but we can look for labels or wait for inputs
        // Labels might be connected via IDs or we can just use placeholders or XPath based on surrounding text.
        // Input component structure: has label text.
        await student1Page.getByRole('textbox').nth(0).fill('AI Image Recognizer'); // Title
        await student1Page.getByRole('textbox').nth(1).fill('A deep learning model for image classification.'); // Description
        await student1Page.getByRole('textbox').nth(2).fill('Test Student 1'); // Team Members
        await student1Page.getByRole('button', { name: 'Submit Proposal' }).click();
        await student1Page.waitForTimeout(1000); // wait for toast

        // --- 2. Student 2: Group Topic Submission ---
        console.log('Logging in as Student 2 (Group)...');
        const { page: student2Page } = await loginAndNavigate(
            'student2@test.com', 'Student123!', 'Student 2', 'http://localhost:5173/student/submit-topic'
        );
        
        console.log('Student 2 submitting group topic...');
        await student2Page.getByRole('textbox').nth(0).fill('Decentralized Voting');
        await student2Page.getByRole('textbox').nth(1).fill('A blockchain-based secure voting mechanism.');
        await student2Page.getByRole('textbox').nth(2).fill('Test Student 2, Test Student 3, Test Student 4');
        await student2Page.getByRole('button', { name: 'Submit Proposal' }).click();
        await student2Page.waitForTimeout(1000); // wait for toast

        // --- 3. Guide Dashboard ---
        console.log('Logging in as Guide...');
        const { page: guidePage } = await loginAndNavigate(
            'guide1@test.com', 'Guide123!', 'Guide', 'http://localhost:5173/guide/dashboard'
        );
        
        // --- 4. Coordinator Dashboard ---
        console.log('Logging in as Coordinator...');
        const { page: coordinatorPage } = await loginAndNavigate(
            'coordinator@test.com', 'Coord123!', 'Coordinator', 'http://localhost:5173/coordinator/dashboard'
        );

        console.log('Demonstration setup complete. The browser windows will stay open for testing.');
    } catch (e) {
        console.error('Error during testing setup:', e);
    }
})();
