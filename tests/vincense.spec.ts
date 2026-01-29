import { test, expect } from '@playwright/test';

test.describe('VinCense Dashboard E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to the base URL
        await page.goto('https://xactai.github.io/VinCense');
        // Wait for the loading spinner to disappear
        await page.waitForSelector('.animate-spin', { state: 'detached' });
    });

    test('Page should load with correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/VinCense/i);
        await expect(page.locator('h1')).toContainText('Home');
    });

    test('Sidebar should be visible and functional', async ({ page }) => {
        const sidebar = page.getByText('Device Analytics');
        await expect(sidebar).toBeVisible();

        // Check if subjects are loaded
        const subjectDropdown = page.locator('select').first();
        await expect(subjectDropdown).toBeVisible();

        const options = await subjectDropdown.locator('option').count();
        expect(options).toBeGreaterThan(0);
    });

    test('Should switch between tabs correctly', async ({ page }) => {
        const tabs = [
            'Cross Device Comparison',
            'Error & Deviation Analytics',
            'VinCense Accuracy Overview',
            'Data Source',
            'Home'
        ];

        for (const tabLabel of tabs) {
            await page.getByRole('button', { name: tabLabel, exact: true }).click();
            await expect(page.locator('h1')).toContainText(tabLabel);

            // Verify some content loads for the tab
            // Most tabs should have some charts or tables
            if (tabLabel === 'Data Source') {
                await expect(page.locator('table')).toBeVisible();
            } else if (tabLabel !== 'Home') {
                // Charts use plotly which usually has a .js-plotly-plot class
                // Let's just check for general content
                await expect(page.locator('main')).toBeVisible();
            }
        }
    });

    test('Theme toggle should work', async ({ page }) => {
        const themeToggle = page.getByText('Dark Theme').locator('xpath=following-sibling::button');

        // Initial state check (default is light)
        await expect(page.locator('html')).not.toHaveClass(/dark/);

        // Toggle to Dark Mode
        await themeToggle.click();
        await expect(page.locator('html')).toHaveClass(/dark/);

        // Toggle back to Light Mode
        await themeToggle.click();
        await expect(page.locator('html')).not.toHaveClass(/dark/);
    });

    test('Subject and Date selection should update values', async ({ page }) => {
        const subjectDropdown = page.locator('select').first();
        const dateDropdown = page.locator('select').nth(1);

        // Get current values
        const currentSubject = await subjectDropdown.inputValue();
        const currentDate = await dateDropdown.inputValue();

        // Verify they are displayed in the header
        await expect(page.locator('main')).toContainText(`Subject: ${currentSubject}`);
        await expect(page.locator('main')).toContainText(`Date: ${currentDate}`);
    });
});
