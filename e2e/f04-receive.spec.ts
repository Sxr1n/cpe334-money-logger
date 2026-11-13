import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

test('TEST-F04-07 receive money form enforces line sum, handles 422 keeping values, and saves successfully', async ({
  page,
}) => {
  // Login as alice
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  // Navigate to /receive
  await page.getByRole('link', { name: 'Receive money' }).click()
  await expect(page).toHaveURL(/\/receive$/)
  await expect(page.getByRole('heading', { name: 'Receive money' })).toBeVisible()

  // 1. Fill total 1000.00 and line 900.00 (mismatch)
  await page.locator('#totalInput').fill('1000.00')
  await page.locator('input[placeholder="0.00"]').nth(1).fill('900.00')
  await page.locator('#noteInput').fill('Freelance design')

  // Check footer message and disabled Save button
  await expect(page.getByText('Lines must add up to the total')).toBeVisible()
  const saveButton = page.getByRole('button', { name: 'Save' })
  await expect(saveButton).toBeDisabled()

  // 2. Fix line to 1000.00 -> Save becomes enabled
  await page.locator('input[placeholder="0.00"]').nth(1).fill('1000.00')
  await expect(page.getByText('Lines must add up to the total')).not.toBeVisible()
  await expect(saveButton).toBeEnabled()

  // 3. Intercept POST /api/transactions to simulate 422 future date error from server
  await page.route('**/api/transactions', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Validation failed.',
            details: { date: 'Date cannot be in the future' },
          },
        }),
      })
    } else {
      await route.continue()
    }
  })

  await saveButton.click()

  // Verify server field error is shown under Date
  await expect(page.getByText('Date cannot be in the future')).toBeVisible()

  // Verify all entered values remain intact
  await expect(page.locator('#totalInput')).toHaveValue('1000.00')
  await expect(page.locator('input[placeholder="0.00"]').nth(1)).toHaveValue('1000.00')
  await expect(page.locator('#noteInput')).toHaveValue('Freelance design')

  // 4. Unroute intercept and submit successfully
  await page.unroute('**/api/transactions')
  await saveButton.click()

  // Verify success alert "Saved"
  await expect(page.getByRole('alert')).toContainText('Saved')
  await expect(page.getByRole('alert')).toContainText('Bank')
})
