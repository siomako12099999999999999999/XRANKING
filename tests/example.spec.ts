import { test, expect } from '@playwright/test';

test('hello world test', async ({ page }) => {
	await page.goto('https://example.com');
	expect(await page.title()).toBe('Example Domain');
});