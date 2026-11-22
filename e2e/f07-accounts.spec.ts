import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

// Uses accounts created inside the test, so the result does not depend on other specs' data.
test('TEST-F07-08 create, duplicate name, archive rules and hidden archived accounts', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  await page.getByRole('link', { name: 'Accounts' }).click()
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()

  async function create(name: string) {
    await page.getByRole('button', { name: 'New account' }).click()
    await page.getByLabel('Name').fill(name)
    await page.getByLabel('Type').selectOption('CASH')
    await page.getByRole('button', { name: 'Create' }).click()
  }

  // Create Wallet: listed under Cash.
  await create('Wallet')
  const cash = page.locator('.card', { has: page.getByRole('heading', { name: 'Cash & Bank Accounts' }) })
  await expect(cash.getByRole('row', { name: /Wallet/ })).toBeVisible()

  // Duplicate (case-insensitive): field message, typed name kept.
  await create('wallet')
  await expect(page.getByText('You already have a CASH account with this name')).toBeVisible()
  await expect(page.getByLabel('Name')).toHaveValue('wallet')
  await page.getByRole('button', { name: 'Cancel' }).click()

  // Archive with a non-zero balance: balance message.
  const walletRow = cash.getByRole('row', { name: /Wallet/ })
  await walletRow.getByRole('button', { name: 'Set opening balance' }).click()
  await page.locator('#openingAmount').fill('100.00')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(walletRow).toContainText('฿100.00')
  await walletRow.getByRole('button', { name: 'Archive' }).click()
  await expect(page.getByText('Balance must be ฿0.00 to archive (now ฿100.00)')).toBeVisible()

  // Archive a zero-balance account: moves to Archived and disappears from /pay.
  await create('Old Wallet')
  await cash.getByRole('row', { name: /Old Wallet/ }).getByRole('button', { name: 'Archive' }).click()
  const archived = page.locator('details', { hasText: 'Archived' })
  await archived.locator('summary').click()
  await expect(archived.getByRole('row', { name: /Old Wallet/ })).toBeVisible()
  await expect(cash.getByRole('row', { name: /Old Wallet/ })).toHaveCount(0)

  await page.getByRole('link', { name: 'Make a payment' }).click()
  await expect(page.locator('#primaryAccountId option', { hasText: 'Old Wallet' })).toHaveCount(0)
  await expect(page.locator('#primaryAccountId option', { hasText: /^Wallet/ })).toHaveCount(1)
})
