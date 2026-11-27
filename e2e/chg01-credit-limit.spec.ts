import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

// CHG-01 (Lab 7): credit limit on a LOAN_TAKEN account — F-05 contract v0.6, AC-F05-16
test('TEST-F05-16 set a credit limit on Accounts; Pay rejects a charge over it and saves one equal to it', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  // A fresh card keeps this spec independent of other specs that use alice's Credit Card.
  const card = (await (await page.request.post('/api/accounts', { data: { name: 'Card CHG01', type: 'LOAN_TAKEN' } })).json()).id as number

  await page.goto('/accounts')
  const row = page.getByRole('row', { name: /Card CHG01/ })
  await expect(row).toContainText('No limit')
  await row.getByRole('button', { name: 'Credit limit' }).click()
  await page.getByLabel('Credit limit (฿)').fill('5000.00')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(row).toContainText('Limit ฿5,000.00 · Available ฿5,000.00')

  await page.goto('/pay')
  await expect(page.locator('#primaryAccountId option', { hasText: 'Card CHG01 (debt ฿0.00 · available ฿5,000.00)' })).toHaveCount(1)
  await page.locator('#primaryAccountId').selectOption(String(card))
  await page.locator('#total').fill('5000.01')
  await page.getByLabel('Category / Debt account').first().selectOption({ label: 'Dining (Expense)' })
  await page.locator('input[placeholder="0.00"]').nth(1).fill('5000.01')
  await page.getByRole('button', { name: 'Save Payment' }).click()
  await expect(page.getByText('Over the credit limit of Card CHG01 (available ฿5,000.00)')).toBeVisible()
  await expect(page.locator('#total')).toHaveValue('5000.01')
  await expect(page.locator('input[placeholder="0.00"]').nth(1)).toHaveValue('5000.01')

  await page.locator('#total').fill('5000.00')
  await page.locator('input[placeholder="0.00"]').nth(1).fill('5000.00')
  await page.getByRole('button', { name: 'Save Payment' }).click()
  await expect(page.getByRole('alert')).toContainText('Payment recorded successfully')
  const after = (await (await page.request.get('/api/accounts')).json()).items.find((a: { id: number }) => a.id === card)
  expect(after.balance).toBe(500000)
  expect(after.availableCredit).toBe(0)
})
