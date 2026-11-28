import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''
const thb = (satang: number) =>
  `฿${(satang / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// DEF-01 (Issue #81) regression — F-04 contract v0.4, AC-F04-08
test('TEST-F04-08 after Save the Receiving account select shows the updated Bank balance without a reload', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('bob')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  await page.goto('/receive')
  await expect(page.getByRole('heading', { name: 'Receive money' })).toBeVisible()
  const bank = (await (await page.request.get('/api/accounts')).json()).items.find((a: { name: string }) => a.name === 'Bank')
  const select = page.locator('#primaryAccountSelect')
  await select.selectOption(String(bank.id))

  await page.locator('#totalInput').fill('1.00')
  await page.locator('input[placeholder="0.00"]').nth(1).fill('1.00')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('alert')).toContainText('Saved')

  const updated = `Bank (${thb(bank.balance + 100)})`
  await expect(select.locator('option', { hasText: updated })).toHaveCount(1)

  await page.getByRole('button', { name: 'Receive another payment' }).click()
  await expect(select.locator('option', { hasText: updated })).toHaveCount(1)
})
