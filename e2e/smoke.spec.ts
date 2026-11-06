import { expect, test } from '@playwright/test'

test('app loads and shows the API version from /api/health', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Money Logger' })).toBeVisible()
  await expect(page.getByText('API version: dev')).toBeVisible()
})
