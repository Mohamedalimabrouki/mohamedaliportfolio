import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectData = JSON.parse(
  await fs.readFile(path.resolve(__dirname, '../content/projects.json'), 'utf8')
);
const firstProject = projectData[0];

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => {
    console.error('[pageerror]', error.message, error.stack);
    throw error;
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[console:${msg.type()}] ${msg.text()}`);
    }
  });
});

const goto = async (page, url) => {
  await page.goto(url, { waitUntil: 'networkidle' });
};

test('Home renders projects and supports toggles', async ({ page }) => {
  await goto(page, '/');
  await page.waitForSelector('#project-grid .card');
  const cardCount = await page.locator('#project-grid .card').count();
  expect(cardCount).toBeGreaterThan(0);

  const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByRole('button', { name: /Toggle theme/i }).click();
  const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(themeAfter).not.toEqual(themeBefore);

  await page.getByRole('button', { name: /Switch to English|Passer en français/i }).click();
  const navLabel = await page.getByRole('link', { name: /Projets|Projects/i }).first().textContent();
  expect(navLabel?.trim().length).toBeGreaterThan(0);
});

test('Project detail renders gallery, focus, and PDF action', async ({ page }) => {
  await goto(page, `/project.html?p=${encodeURIComponent(firstProject.slug)}`);
  await page.waitForFunction(() => {
    const el = document.getElementById('p-title');
    return el && el.textContent && el.textContent.trim() !== 'Project';
  });
  await expect(page.locator('#p-title')).toHaveText(new RegExp(firstProject.title.split(' — ')[0], 'i'));
  await page.waitForSelector('#p-gallery picture');
  const galleryPictures = page.locator('#p-gallery picture');
  await expect(galleryPictures.first()).toBeVisible();
  const focusAttr = await galleryPictures.first().getAttribute('data-focus');
  expect(focusAttr).toBeTruthy();
  await expect(page.getByRole('button', { name: /Download PDF/i })).toBeVisible();
});

test('CV download link triggers file download', async ({ page }) => {
  await goto(page, '/');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: /Download CV/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename().toLowerCase()).toContain('mohamed');
});

test('Project card navigation works with responsive images', async ({ page }) => {
  await goto(page, '/');
  const firstCard = page.locator('#project-grid .card').first();
  await firstCard.click();
  await page.waitForFunction(() => {
    const el = document.getElementById('p-title');
    return el && el.textContent && el.textContent.trim() !== 'Project';
  });
  const currentUrl = page.url();
  expect(currentUrl).toContain('project.html?p=');
  await page.waitForSelector('#p-gallery picture');
  const picture = page.locator('#p-gallery picture').first();
  await expect(picture).toHaveAttribute('data-optimized', /1/);
});
