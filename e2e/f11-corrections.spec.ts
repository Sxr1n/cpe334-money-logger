import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

function formatTHB(satang: number): string {
  return `฿${(satang / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

test('TEST-F11-10 edit a payment from detail, verify updated Overview balance, then void and see Void badge in detail and History', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  const accounts = (await (await page.request.get('/api/accounts')).json()).items as {
    id: number
    name: string
    balance: number
    openingBalance: number | null
  }[]
  const bank = accounts.find((a) => a.name === 'Bank')!
  const dining = accounts.find((a) => a.name === 'Dining')!
  if (bank.openingBalance === null) {
    await page.request.put(`/api/accounts/${bank.id}/opening-balance`, { data: { amount: 1000000, date: '2026-11-01' } })
  } else if (bank.balance < 500000) {
    await page.request.patch(`/api/accounts/${bank.id}/opening-balance`, {
      data: { amount: bank.openingBalance + 1000000, date: '2026-11-01' },
    })
  }
  const bankBefore = (
    (await (await page.request.get('/api/accounts')).json()).items as { id: number; balance: number }[]
  ).find((a) => a.id === bank.id)!.balance

  const txnRes = await page.request.post('/api/transactions', {
    data: {
      form: 'PAYMENT',
      primaryAccountId: bank.id,
      date: '2026-11-20',
      total: 100000,
      note: 'F11 initial',
      lines: [{ accountId: dining.id, amount: 100000 }],
    },
  })
  expect(txnRes.status()).toBe(201)
  const txn = (await txnRes.json()) as { id: number }

  // Open detail -> Edit -> change amount to 1500.00 -> Save changes
  await page.goto(`/transactions/${txn.id}`)
  await page.getByRole('link', { name: 'Edit' }).click()
  await expect(page).toHaveURL(new RegExp(`/transactions/${txn.id}/edit$`))
  await expect(page.getByRole('heading', { name: 'Edit payment' })).toBeVisible()

  await page.locator('#total').fill('1500.00')
  await page.locator('input[placeholder="0.00"]').nth(1).fill('1500.00')
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(page).toHaveURL(new RegExp(`/transactions/${txn.id}$`))
  await expect(page.getByText('Transaction updated')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Paid ฿1,500\.00/ })).toBeVisible()

  // Verify Overview Bank balance updated
  await page.getByRole('link', { name: 'Overview' }).click()
  const cashCard = page.locator('.card', { has: page.getByRole('heading', { name: 'Cash', exact: true }) })
  await expect(cashCard.locator('li', { hasText: 'Bank' }).first()).toContainText(formatTHB(bankBefore - 150000))

  // Return to detail -> Void -> Confirm void -> check badge in detail and History
  await page.goto(`/transactions/${txn.id}`)
  await page.getByRole('button', { name: 'Void' }).click()
  await expect(page.getByText('Void this transaction? Balances will be restored.')).toBeVisible()
  await page.getByRole('button', { name: 'Confirm void' }).click()

  await expect(page.getByText('Void', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Void' })).toHaveCount(0)

  await page.getByRole('link', { name: 'History', exact: true }).click()
  const row = page.locator('tbody tr', { hasText: 'F11 initial' }).first()
  await expect(row).toContainText('Void')
})
