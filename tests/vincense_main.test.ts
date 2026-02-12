import { test, expect } from '@playwright/test';

test.describe('VinCense Dashboard Health Checks', () => {

    test.beforeEach(async ({ page }) => {
        // Go to the starting url before each test.
        await page.goto('https://xactai.github.io/VinCense/');
        // Wait for the page to load completely
        await page.waitForLoadState('networkidle');
    });

    test('should load the dashboard successfully', async ({ page }) => {
        // Check if the title is correct
        await expect(page).toHaveTitle(/VinCense/);

        // Check if the "Start Exploring" button is visible (Welcome Screen)
        const welcomeButton = page.getByRole('button', { name: /Start Exploring/i });
        if (await welcomeButton.isVisible()) {
            await welcomeButton.click();
        }

        // Check for main dashboard header
        await expect(page.locator('h1').first()).toBeVisible();
    });

    test('should verify sidebar navigation', async ({ page }) => {
        // Navigate past welcome screen if present
        const welcomeButton = page.getByRole('button', { name: /Start Exploring/i });
        if (await welcomeButton.isVisible()) {
            await welcomeButton.click();
        }

        // Check if sidebar logo exists (VinCense Logo)
        // Sidebar.tsx uses an img with alt="VinCense"
        const sidebarLogo = page.getByAltText('VinCense').first();
        await expect(sidebarLogo).toBeVisible();

        // Check for "Subject Name" label which is in the sidebar
        await expect(page.getByText('Subject Name')).toBeVisible();
    });

    test('should open FAQ panel', async ({ page }) => {
        // Navigate past welcome screen if present
        const welcomeButton = page.getByRole('button', { name: /Start Exploring/i });
        if (await welcomeButton.isVisible()) {
            await welcomeButton.click();
        }

        // Locate the FAQ button by its title attribute
        const faqButton = page.locator('button[title="Help & FAQ"]');
        await expect(faqButton).toBeVisible();

        // Click it
        await faqButton.click();

        // Verify panel opens (Check for "Help & FAQ" text in the panel header)
        await expect(page.getByText('Help & FAQ')).toBeVisible();

        // Close it
        const closeButton = page.locator('button > svg.lucide-x').first();
        if (await closeButton.isVisible()) {
            await closeButton.click();
        }
    });

    // Navigate past welcome screen if present
    const welcomeButton = page.getByRole('button', { name: /Start Exploring/i });
    if (await welcomeButton.isVisible()) {
        await welcomeButton.click();
    }

    // Locate Profile button
    const profileButton = page.locator('button[title="View Health Profile"]');
    await expect(profileButton).toBeVisible();

    // Click it
    await profileButton.click();

    // Verify modal opens (Check for "Health Profile" header)
    await expect(page.getByRole('heading', { name: 'Health Profile' })).toBeVisible();

    // Verify vital cards are present (e.g., Avg Pulse)
    await expect(page.getByText('Avg Pulse')).toBeVisible();
});

});
