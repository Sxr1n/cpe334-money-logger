import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

function formatTHB(satang: number): string {
  return `฿${(satang / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

test('TEST-F10-08 mixed RECEIPT (Salary + Repayment to me) reduces Owed to me total on Overview', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  const kenName = `Loan to Ken ${Date.now()}`
  const kenRes = await page.request.post('/api/accounts', { data: { name: kenName, type: 'LOAN_GIVEN' } })
  expect(kenRes.status()).toBe(201)
  const ken = (await kenRes.json()) as { id: number }
  expect((await page.request.put(`/api/accounts/${ken.id}/opening-balance`, { data: { amount: 50000, date: '2026-11-01' } })).ok()).toBe(true)

  const ovBefore = (await (await page.request.get('/api/overview')).json()) as { loanGiven: { total: number } }
  const accounts = (await (await page.request.get('/api/accounts')).json()).items as { id: number; name: string }[]
  const salaryId = accounts.find((a) => a.name === 'Salary')!.id

  await page.getByRole('link', { name: 'Receive money' }).click()
  await expect(page).toHaveURL(/\/receive$/)

  await page.locator('#totalInput').fill('30500.00')
  await page.locator('tbody select').first().selectOption(String(salaryId))
  await page.locator('tbody input[placeholder="0.00"]').first().fill('30000.00')

  await page.getByRole('button', { name: '+ Add line' }).click()
  const repayGroup = page.locator('optgroup[label="Repayment to me"]').last()
  await expect(repayGroup.locator(`option[value="${ken.id}"]`)).toBeAttached()
  await page.locator('tbody select').nth(1).selectOption(String(ken.id))
  await page.locator('tbody input[placeholder="0.00"]').nth(1).fill('500.00')

  const saveBtn = page.getByRole('button', { name: 'Save receipt' })
  await expect(saveBtn).toBeEnabled()
  await saveBtn.click()
  await expect(page.getByRole('alert')).toContainText('Receipt saved')

  await page.getByRole('link', { name: 'Overview' }).click()
  await expect(page).toHaveURL(/\/overview$/)
  await expect(page.getByTestId('loan-given-total')).toHaveText(formatTHB(ovBefore.loanGiven.total - 50000))
})
