import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''
const thb = (satang: number) =>
  `฿${(satang / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// DEF-01 (Issue #81) regression — F-04 contract v0.4, AC-F04-08
test('TEST-F04-08 after Save the Receiving account select shows the updated balance without a reload', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  // A fresh CASH account keeps this spec independent of the exact totals other specs assert (bob in TEST-F06-07).
  const name = `Wallet DEF01 ${Date.now()}`
  const wallet = (await (await page.request.post('/api/accounts', { data: { name, type: 'CASH' } })).json()) as { id: number; balance: number }

  await page.goto('/receive')
  await expect(page.getByRole('heading', { name: 'Receive money' })).toBeVisible()
  const select = page.locator('#primaryAccountSelect')
  await select.selectOption(String(wallet.id))

  await page.locator('#totalInput').fill('1.00')
  await page.locator('input[placeholder="0.00"]').nth(1).fill('1.00')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('alert')).toContainText('Saved')

  const updated = `${name} (${thb(wallet.balance + 100)})`
  await expect(select.locator('option', { hasText: updated })).toHaveCount(1)

  await page.getByRole('button', { name: 'Receive another payment' }).click()
  await expect(select.locator('option', { hasText: updated })).toHaveCount(1)
})
