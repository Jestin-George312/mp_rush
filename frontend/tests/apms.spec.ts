import { test, expect } from '@playwright/test';

// Centralised mock auth routine injecting JWT into local storage
const performMockLogin = async (page, roleConfig) => {
    await page.goto('http://localhost:5173/login');
    // Using Playwright evaluate to drop a mock valid token directly into localStorage bypassing actual Auth
    await page.evaluate((config) => {
        localStorage.setItem('token', 'mock_jwt_tester_string');
        localStorage.setItem('user', JSON.stringify({
            id: config.id,
            name: config.name,
            email: config.email,
            role: config.role,
            picture: ''
        }));
    }, roleConfig);

    // Reloading constructs the private router effectively dropping the user into the role dashboard
    await page.reload();
};

test.describe('APMS Automated Frontend User Flows (QA)', () => {
    
    test('1. Coordinator Flow: Assign Guide to Project', async ({ page }) => {
        await performMockLogin(page, { id: 1, name: 'Coord QA', email: 'coord@test.com', role: 'coordinator' });
        
        // Assert we are loaded into Coordinator Dashboard
        await expect(page.locator('h1')).toContainText('Coordinator Portal');

        // Navigate to Guide Allocation using sidebar item
        await page.click('button:has-text("Guide Allocation")');
        await expect(page.locator('h2')).toContainText('Pending Projects');

        // Verify that tables render pending projects
        const pendingCard = page.locator('.pending-project-card').first();
        await expect(pendingCard).toBeVisible();

        // Simulate assigning a Guide
        await pendingCard.locator('select').selectOption({ label: 'Dr. Sarah Johnson' });
        await pendingCard.locator('button:has-text("Assign")').click();

        // Verify toast indicating success
        await expect(page.locator('.toast')).toContainText('Guide Assigned successfully');
    });

    test('2. Student Flow: Task Board Manipulation & Documents Upload', async ({ page }) => {
        await performMockLogin(page, { id: 2, name: 'Student QA', email: 'student@test.com', role: 'student' });
        
        // Verify Task Board navigation
        await page.click('button:has-text("Task Board")');
        
        // Ensure Kanban columns render correctly
        await expect(page.locator('h2:has-text("Todo")')).toBeVisible();
        await expect(page.locator('h2:has-text("In Progress")')).toBeVisible();
        await expect(page.locator('h2:has-text("Done")')).toBeVisible();

        // Simulate Drag and Drop logic
        const sourceTask = page.locator('.task-card').first();
        const targetColumn = page.locator('.kanban-column').nth(1); // In Progress
        await sourceTask.hover();
        await page.mouse.down();
        await targetColumn.hover();
        await page.mouse.up();

        // Verify task exists inside new column
        await expect(targetColumn.locator('.task-card').first()).toBeVisible();

        // Navigate to Documents page
        await page.click('button:has-text("Documents")');
        await expect(page.locator('h1')).toContainText('Documents');

        // Click the mock upload button
        await page.click('button:has-text("Upload Document")');
        await expect(page.locator('.modal')).toBeVisible();
    });

    test('3. Guide Flow: Dashboard & Inline Feedback', async ({ page }) => {
        await performMockLogin(page, { id: 3, name: 'Guide QA', email: 'guide@test.com', role: 'guide' });
        
        // Ensure Dashboard resolves assigned groups
        await expect(page.locator('h1')).toContainText('Guide Dashboard');
        
        const groupCard = page.locator('.assigned-group-card').first();
        await expect(groupCard).toBeVisible();

        // Navigate to inside the project to view Document Submissions
        await groupCard.locator('button:has-text("View Documents")').click();
        
        // Mock pressing the actual feedback button (This requires the Feedback module mapped in HTML)
        await page.locator('.doc-list-item').first().locator('button:has-text("Give Feedback")').click();
        
        // Type feedback into modal
        await page.fill('textarea[placeholder="Enter document feedback..."]', 'Systematic integration looks good. Fix missing auth tokens.');
        await page.click('button:has-text("Submit Feedback")');

        await expect(page.locator('.toast')).toContainText('Feedback generated');
    });

});
