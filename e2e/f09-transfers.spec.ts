import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

test('TEST-F09-07 record a cash transfer on /pay using Transfer to my cash account; Overview updates balances without changing expense', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  // Ensure Bank has sufficient balance and Wallet F09 exists via API
  const accounts = (await (await page.request.get('/api/accounts')).json()).items as { id: number; name: string; balance: number }[]
  const bank = accounts.find((a) => a.name === 'Bank')!
  await page.request.put(`/api/accounts/${bank.id}/opening-balance`, { data: { amount: 1000000, date: '2026-11-01' } })
  // Also record opening balance update if already set
  await page.request.patch(`/api/accounts/${bank.id}/opening-balance`, { data: { amount: 1000000, date: '2026-11-01' } })
  const summaryBefore = (await (await page.request.get('/api/summary')).json()) as { expense: number }

  const walletRes = await page.request.post('/api/accounts', { data: { name: 'Wallet F09', type: 'CASH' } })
  expect(walletRes.status()).toBe(201)
  const wallet = (await walletRes.json()) as { id: number }

  await page.getByRole('link', { name: 'Make a payment' }).click()
  await expect(page).toHaveURL(/\/pay$/)

  await page.locator('#primaryAccountId').selectOption(String(bank.id))
  await page.locator('#total').fill('3000.00')

  // Select Wallet F09 from the Transfer to my cash account optgroup
  const transferGroup = page.locator('optgroup[label="Transfer to my cash account"]')
  await expect(transferGroup).toBeAttached()
  await expect(transferGroup.locator(`option[value="${wallet.id}"]`)).toBeAttached()
  await page.locator('select.form-select').nth(1).selectOption(String(wallet.id))
  await page.locator('input[placeholder="0.00"]').nth(1).fill('3000.00')

  await page.getByRole('button', { name: 'Save Payment' }).click()
  await expect(page.getByRole('alert')).toContainText('Payment recorded successfully')

  await page.getByRole('link', { name: 'Overview' }).click()
  await expect(page).toHaveURL(/\/overview$/)
  await expect(page.getByText('Wallet F09')).toBeVisible()
  await expect(page.getByText('฿3,000.00')).toBeVisible()

  const summaryAfter = (await (await page.request.get('/api/summary')).json()) as { expense: number }
  expect(summaryAfter.expense).toBe(summaryBefore.expense)
})
