import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

test('TEST-F05-08 payment form enforces line sum, handles 422 keeping values, and saves successfully', async ({
  page,
}) => {
  // Login as alice
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  // Navigate to /pay
  await page.getByRole('link', { name: 'Make a payment' }).click()
  await expect(page).toHaveURL(/\/pay$/)
  await expect(page.getByRole('heading', { name: 'Make a payment' })).toBeVisible()

  // 1. Fill total 1200.00 and line 1000.00 (mismatch)
  await page.locator('#total').fill('1200.00')
  await page.locator('input[placeholder="0.00"]').nth(1).fill('1000.00')
  await page.locator('#note').fill('Team dinner')

  // Check footer message and disabled Save button
  await expect(page.getByText('Lines must add up to the total')).toBeVisible()
  const saveButton = page.getByRole('button', { name: 'Save Payment' })
  await expect(saveButton).toBeDisabled()

  // 2. Fix line to 1200.00 -> Save becomes enabled
  await page.locator('input[placeholder="0.00"]').nth(1).fill('1200.00')
  await expect(page.getByText('Lines must add up to the total')).not.toBeVisible()
  await expect(saveButton).toBeEnabled()

  // 3. Intercept POST /api/transactions to simulate 422 overspend error from server
  await page.route('**/api/transactions', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'RULE_VIOLATION',
            message: 'Business rule violation.',
            details: { total: 'Not enough money in Bank (balance ฿1,000.00)' },
          },
        }),
      })
    } else {
      await route.continue()
    }
  })

  await saveButton.click()

  // Verify server field error is shown under Total
  await expect(page.getByText('Not enough money in Bank (balance ฿1,000.00)')).toBeVisible()

  // Verify all entered values remain intact
  await expect(page.locator('#total')).toHaveValue('1200.00')
  await expect(page.locator('input[placeholder="0.00"]').nth(1)).toHaveValue('1200.00')
  await expect(page.locator('#note')).toHaveValue('Team dinner')

  // 4. Unroute intercept and submit successfully (Credit Card debt is 0, so charge works with 0 balance)
  await page.unroute('**/api/transactions')

  // Switch paying account to Credit Card to avoid balance limitation
  const cardOption = page.locator('#primaryAccountId option', { hasText: 'Credit Card' })
  const cardValue = await cardOption.getAttribute('value')
  if (cardValue) {
    await page.locator('#primaryAccountId').selectOption(cardValue)
  }
  await saveButton.click()

  // Verify success alert
  await expect(page.getByRole('alert')).toContainText('Payment recorded successfully')
})
