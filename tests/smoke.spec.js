import { test, expect } from '@playwright/test';

const goto = async (page, url) => {
  await page.goto(url, { waitUntil: 'networkidle' });
};

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => {
    console.error('[pageerror]', error.message, error.stack);
    throw error;
  });
});

test('Home hero and theme toggle work', async ({ page }) => {
  await goto(page, '/');
  await expect(page.locator('h1')).toHaveText(/Bring compliant multi-brand vans/i);
  const toggle = page.getByRole('button', { name: /Switch to dark theme|Switch to light theme|Dark mode|Light mode/i });
  const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await toggle.click();
  const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(after).not.toEqual(before);
});

test('Projects grid lists case studies with responsive imagery', async ({ page }) => {
  await goto(page, '/');
  const cards = page.locator('#projects article.card');
  await expect(cards).toHaveCount(3);
  const firstImg = cards.first().locator('img').first();
  await expect(firstImg).toHaveAttribute('loading', 'lazy');
  const srcset = await firstImg.getAttribute('srcset');
  expect(srcset).toContain('320');
});

test('CV downloads are accessible', async ({ page }) => {
  await goto(page, '/');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: /Download CV/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/Mohamed_Ali_Mabrouki/i);
});

test('Case study page provides engagement summary', async ({ page }) => {
  await goto(page, '/project.html');
  await expect(page.locator('h1')).toHaveText(/K9 Vans WVTA recovery/i);
  await expect(page.locator('.metrics-list')).toHaveCount(2);
});

test('CV web view renders print-friendly layout', async ({ page }) => {
  await goto(page, '/cv.html');
  await expect(page.locator('h1')).toHaveText(/Mohamed Ali Mabrouki/i);
  await expect(page.getByRole('link', { name: /Download DOCX/i })).toHaveAttribute('href', /\.docx$/);
});
