import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

// Records its own receipts through the API with unique notes, so other specs' data does not matter.
test('TEST-F12-07 filter History by account and text; filters survive reload; Clear shows everything', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  const accounts = (await (await page.request.get('/api/accounts')).json()).items as { id: number; name: string }[]
  const id = (name: string) => accounts.find((a) => a.name === name)!.id
  const receive = (note: string) =>
    page.request.post('/api/transactions', {
      data: { form: 'RECEIPT', primaryAccountId: id('Bank'), date: '2026-11-20', total: 100, lines: [{ accountId: id('Salary'), amount: 100 }], note },
    })
  expect((await receive('zebra lunch F12')).status()).toBe(201)
  expect((await receive('zebra dinner F12')).status()).toBe(201)

  await page.getByRole('link', { name: 'History' }).click()
  await page.getByLabel('Account').selectOption({ label: 'Salary' })
  await page.getByLabel('Text').fill('ZEBRA LUNCH')
  await page.getByRole('button', { name: 'Apply' }).click()

  const rows = page.locator('tbody tr')
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toContainText('zebra lunch F12')
  await expect(page).toHaveURL(/q=ZEBRA\+LUNCH|q=ZEBRA%20LUNCH/)

  await page.reload()
  await expect(page.getByLabel('Text')).toHaveValue('ZEBRA LUNCH')
  await expect(rows).toHaveCount(1)

  await page.getByLabel('Text').fill('no such note F12')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText('No transactions match these filters')).toBeVisible()

  await page.getByRole('button', { name: 'Clear filters' }).first().click()
  await expect(page).toHaveURL(/\/transactions$/)
  await expect(page.getByText('zebra dinner F12')).toBeVisible()
})
