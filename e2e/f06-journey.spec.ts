import { expect, test, type Locator, type Page } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

// Selects the option whose text contains `text` (option labels also show balances, so values are looked up).
async function pick(select: Locator, text: string) {
  const value = await select.locator('option', { hasText: text }).first().getAttribute('value')
  await select.selectOption(value!)
}

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Username').fill('bob')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)
}

async function expectOverview(page: Page) {
  await expect(page.getByTestId('cash-total')).toHaveText('฿33,800.00')
  await expect(page.getByTestId('debt-total')).toHaveText('฿0.00')
  await expect(page.getByTestId('month-income')).toHaveText('฿30,000.00')
  await expect(page.getByTestId('month-expense')).toHaveText('฿1,200.00')
  await expect(page.getByTestId('month-net')).toHaveText('฿28,800.00')
}

// Uses bob: the F-04/F-05 E2E specs post transactions for alice earlier in the same run.
test('TEST-F06-07 full Sprint 1 journey in the UI; results survive reload and logout/login', async ({ page }) => {
  await login(page)

  // Opening balance ฿5,000 on Bank
  await page.getByRole('link', { name: 'Accounts' }).click()
  const bankRow = page.getByRole('row', { name: /Bank/ })
  await bankRow.getByRole('button', { name: 'Set opening balance' }).click()
  await page.locator('#openingAmount').fill('5000.00')
  await page.locator('#openingDate').fill('2026-11-01')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(bankRow.getByRole('button', { name: 'Set opening balance' })).toHaveCount(0)

  // Salary ฿30,000 into Bank
  await page.getByRole('link', { name: 'Receive money' }).click()
  await pick(page.locator('#primaryAccountSelect'), 'Bank')
  await page.locator('#totalInput').fill('30000.00')
  await page.locator('input[placeholder="0.00"]').nth(1).fill('30000.00')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible()

  // Card purchase ฿1,200 = Dining ฿700 + Groceries ฿500
  await page.goto('/pay')
  await pick(page.locator('#primaryAccountId'), 'Credit Card')
  await page.locator('#total').fill('1200.00')
  const lineSelects = page.locator('select:not(#primaryAccountId)')
  await pick(lineSelects.nth(0), 'Dining')
  await page.locator('input[placeholder="0.00"]').nth(1).fill('700.00')
  await page.getByRole('button', { name: '+ Add Line' }).click()
  await pick(lineSelects.nth(1), 'Groceries')
  await page.locator('input[placeholder="0.00"]').nth(2).fill('500.00')
  await page.getByRole('button', { name: 'Save Payment' }).click()
  await expect(page.getByRole('heading', { name: 'Payment recorded successfully!' })).toBeVisible()

  // Repay the card ฿1,200 from Bank
  await page.goto('/pay')
  await pick(page.locator('#primaryAccountId'), 'Bank')
  await page.locator('#total').fill('1200.00')
  await pick(page.locator('select:not(#primaryAccountId)').nth(0), 'Credit Card')
  await page.locator('input[placeholder="0.00"]').nth(1).fill('1200.00')
  await page.getByRole('button', { name: 'Save Payment' }).click()
  await expect(page.getByRole('heading', { name: 'Payment recorded successfully!' })).toBeVisible()

  // Overview and history show the persisted result
  await page.getByRole('link', { name: 'Overview' }).click()
  await expectOverview(page)
  await page.reload()
  await expectOverview(page)

  await page.getByRole('button', { name: 'Log out' }).click()
  await login(page)
  await expectOverview(page)

  await page.getByRole('link', { name: 'History' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(3)
})
