import { expect, test } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''

// Uses its own receipt with a unique note; other specs' favourites do not exist.
test('TEST-F13-05 add a favourite from the detail page, see it on Favourites, remove it', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)

  const accounts = (await (await page.request.get('/api/accounts')).json()).items as { id: number; name: string }[]
  const id = (name: string) => accounts.find((a) => a.name === name)!.id
  const created = await page.request.post('/api/transactions', {
    data: { form: 'RECEIPT', primaryAccountId: id('Bank'), date: '2026-11-20', total: 100, lines: [{ accountId: id('Salary'), amount: 100 }], note: 'fav F13' },
  })
  const txn = await created.json()

  await page.goto(`/transactions/${txn.id}`)
  await page.getByRole('button', { name: /Add to favourites/ }).click()
  await expect(page.getByRole('button', { name: /Favourite/ })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('link', { name: 'Favourites' }).click()
  await expect(page.getByRole('row', { name: /fav F13/ })).toBeVisible()

  await page.goto(`/transactions/${txn.id}`)
  await page.getByRole('button', { name: /Favourite/ }).click()
  await expect(page.getByRole('button', { name: /Add to favourites/ })).toBeVisible()
  await page.getByRole('link', { name: 'Favourites' }).click()
  await expect(page.getByText('No favourites yet')).toBeVisible()
})
