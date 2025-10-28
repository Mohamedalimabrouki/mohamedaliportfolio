import { test, expect } from '@playwright/test';

const goto = async (page, path) => {
  await page.goto(path, { waitUntil: 'networkidle' });
};

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    console.error('[pageerror]', error.message, error.stack);
    throw error;
  });
});

test('Home hero renders and theme switcher toggles preference', async ({ page }) => {
  await goto(page, '/');
  await expect(page.locator('#hero h1')).toHaveText(/Bring compliant multi-brand vans/i);
  const currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
  const targetButton =
    currentTheme === 'dark'
      ? page.locator('[data-theme-set="light"]')
      : page.locator('[data-theme-set="dark"]');
  await targetButton.click();
  await expect(targetButton).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => page.evaluate(() => document.documentElement.getAttribute('data-theme'))).not.toBe(
    currentTheme
  );
});

test('Home projects grid exposes responsive imagery', async ({ page }) => {
  await goto(page, '/');
  const cards = page.locator('#projects .project-card');
  await expect(cards).toHaveCount(6);
  const firstCard = cards.first();
  await expect(firstCard.locator('picture source').first()).toHaveAttribute('srcset', /avif/);
  const heroImg = firstCard.locator('img').first();
  await expect(heroImg).toHaveAttribute('srcset', /320w/);
  await expect(heroImg).toHaveAttribute('data-placeholder', /data:image\/jpeg;base64/);
});

test('Projects index hydrates filters and status messaging', async ({ page }) => {
  await goto(page, '/projects/index.html');
  const cards = page.locator('[data-project-list] article');
  await expect(cards).toHaveCount(8);
  await expect(page.locator('[data-status]')).toHaveText(/Showing 8 of 8 projects\./i);
  const stackSelect = page.locator('select[data-filter="stack"]');
  const optionCount = await stackSelect.locator('option').count();
  expect(optionCount).toBeGreaterThan(3);
  await stackSelect.selectOption('euro-7');
  await expect(page.locator('[data-project-list] article:visible')).toHaveCount(1);
  await expect(page.locator('[data-status]')).toHaveText(/Showing 1 of 8 projects\./i);
});

test('Project detail hero uses responsive sources and metrics', async ({ page }) => {
  await goto(page, '/projects/ec-homologation-toyota-proace-city.html');
  await page.waitForSelector('[data-project-hero] picture img', { state: 'attached' });
  const heroPicture = page.locator('[data-project-hero] picture').first();
  const heroImg = heroPicture.locator('img');
  await expect(heroImg).toHaveAttribute('srcset', /320w/);
  await expect(heroImg).toHaveAttribute('data-placeholder', /data:image\/jpeg;base64/);
  await expect(page.locator('[data-project-metrics] li')).toHaveCount(3);
});

test('CV page provides downloadable résumé assets', async ({ page }) => {
  await goto(page, '/cv.html');
  await expect(page.locator('h1')).toHaveText(/Mohamed Ali Mabrouki/i);
  const downloadLink = page.getByRole('link', { name: /Download CV/i });
  await expect(downloadLink).toHaveAttribute('href', /\.docx$/);
  const downloadPromise = page.waitForEvent('download');
  await downloadLink.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.docx$/i);
});
