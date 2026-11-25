import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

// bob; expected figures are read back through the API because other specs also post for bob.
test('TEST-F16-06 monthly report: default 6 months, 13-month range rejected with inputs kept', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('bob')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  const accounts = (await (await page.request.get('/api/accounts')).json()).items as { id: number; name: string }[]
  const id = (name: string) => accounts.find((a) => a.name === name)!.id
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())
  const receipt = await page.request.post('/api/transactions', {
    data: { form: 'RECEIPT', primaryAccountId: id('Bank'), date: today, total: 4200, lines: [{ accountId: id('Salary'), amount: 4200 }] },
  })
  expect(receipt.status()).toBe(201)
  const report = (await (await page.request.get('/api/reports/monthly')).json()) as { items: { income: number }[] }
  const thisMonth = report.items[report.items.length - 1]

  await page.getByRole('link', { name: 'Reports' }).click()
  const section = page.locator('section', { has: page.getByRole('heading', { name: 'Monthly report' }) })
  await expect(section.locator('tbody tr')).toHaveCount(6)
  await expect(section.locator('tbody tr').last()).toContainText(`฿${(thisMonth.income / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`)

  await section.getByLabel('From month').fill('2025-11')
  await section.getByLabel('To month').fill('2026-11')
  await section.getByRole('button', { name: 'Show' }).click()
  await expect(section.getByText('At most 12 months')).toBeVisible()
  await expect(section.getByLabel('From month')).toHaveValue('2025-11')
})
