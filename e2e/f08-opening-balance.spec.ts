import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

// Builds its own account through the API (same browser session), so other specs' data does not matter.
test('TEST-F08-06 edit an opening balance: pre-filled form, server rejection keeps the value, valid edit saves', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  const savings = await (await page.request.post('/api/accounts', { data: { name: 'Savings F08', type: 'CASH' } })).json()
  expect((await page.request.put(`/api/accounts/${savings.id}/opening-balance`, { data: { amount: 100000, date: '2026-11-01' } })).ok()).toBe(true)
  const accounts = (await (await page.request.get('/api/accounts')).json()).items as { id: number; name: string }[]
  const dining = accounts.find((a) => a.name === 'Dining')!
  const pay = await page.request.post('/api/transactions', {
    data: { form: 'PAYMENT', primaryAccountId: savings.id, date: '2026-11-20', total: 80000, lines: [{ accountId: dining.id, amount: 80000 }] },
  })
  expect(pay.status()).toBe(201)

  await page.getByRole('link', { name: 'Accounts' }).click()
  const row = page.getByRole('row', { name: /Savings F08/ })
  await expect(row).toContainText('฿200.00')
  await row.getByRole('button', { name: 'Edit opening balance' }).click()
  await expect(page.locator('#openingAmount')).toHaveValue('1000.00')
  await expect(page.locator('#openingDate')).toHaveValue('2026-11-01')

  await page.locator('#openingAmount').fill('500.00')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Too low: the balance would be −฿300.00 because of later transactions')).toBeVisible()
  await expect(page.locator('#openingAmount')).toHaveValue('500.00')

  await page.locator('#openingAmount').fill('900.00')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(row).toContainText('฿100.00')
  await expect(row).toContainText('Opening ฿900.00')
})
