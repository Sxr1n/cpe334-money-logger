import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

// bob is used because other specs change alice's spending in the same run; amounts are read back, not assumed.
test('TEST-F15-06 Reports shows category spending for the month and an empty range', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('bob')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  const accounts = (await (await page.request.get('/api/accounts')).json()).items as { id: number; name: string }[]
  const id = (name: string) => accounts.find((a) => a.name === name)!.id
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())
  const pay = await page.request.post('/api/transactions', {
    data: { form: 'PAYMENT', primaryAccountId: id('Credit Card'), date: today, total: 3000, lines: [{ accountId: id('Electricity'), amount: 3000 }] },
  })
  expect(pay.status()).toBe(201)
  const expected = (await (await page.request.get('/api/reports/categories')).json()) as { items: { name: string; total: number }[] }
  const electricity = expected.items.find((i) => i.name === 'Electricity')!

  await page.getByRole('link', { name: 'Reports' }).click()
  await expect(page.getByRole('heading', { name: 'Category spending' })).toBeVisible()
  const row = page.getByRole('row', { name: /Electricity/ })
  await expect(row).toContainText(`฿${(electricity.total / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
  await expect(row).toContainText('%')

  await page.getByLabel('From').first().fill('2001-01-01')
  await page.getByLabel('To').first().fill('2001-01-31')
  await page.getByRole('button', { name: 'Show' }).first().click()
  await expect(page.getByText('No spending in this period')).toBeVisible()
})
