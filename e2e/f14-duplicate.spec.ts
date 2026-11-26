import { execSync } from 'node:child_process'
import { expect, test, type Page } from '@playwright/test'

const password = process.env.SEED_USER_PASSWORD ?? ''
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())

async function login(page: Page, username: string) {
  await page.goto('/login')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/overview$/)
}

async function accountIds(page: Page) {
  const accounts = (await (await page.request.get('/api/accounts')).json()).items as { id: number; name: string }[]
  return (name: string) => accounts.find((a) => a.name === name)!.id
}

async function post(page: Page, data: object) {
  const res = await page.request.post('/api/transactions', { data })
  expect(res.status()).toBe(201)
  return res.json()
}

const txnCount = async (page: Page) => (await (await page.request.get('/api/transactions')).json()).total as number

test('TEST-F14-02 duplicate a favourite payment: pre-filled, nothing saved until Save, original unchanged', async ({ page }) => {
  await login(page, 'alice')
  const id = await accountIds(page)
  await post(page, { form: 'RECEIPT', primaryAccountId: id('Bank'), date: '2026-11-01', total: 300000, lines: [{ accountId: id('Salary'), amount: 300000 }], note: 'F14 funds' }) // enough for the source and its duplicate (BR-07)
  const source = await post(page, {
    form: 'PAYMENT', primaryAccountId: id('Bank'), date: '2026-11-01', total: 120000,
    lines: [{ accountId: id('Dining'), amount: 70000 }, { accountId: id('Groceries'), amount: 50000 }], note: 'Weekend F14',
  })
  await page.request.put(`/api/transactions/${source.id}/favorite`, { data: { favorite: true } })

  const before = await txnCount(page)
  await page.goto(`/transactions/${source.id}`)
  await page.getByRole('link', { name: 'Duplicate' }).click()
  await expect(page).toHaveURL(new RegExp(`/pay\\?duplicate=${source.id}$`))
  await expect(page.getByText('Duplicated from the transaction of 01 Nov 2026')).toBeVisible()
  await expect(page.locator('#primaryAccountId')).toHaveValue(String(id('Bank')))
  await expect(page.locator('#date')).toHaveValue(today)
  await expect(page.locator('#total')).toHaveValue('1200.00')
  await expect(page.locator('#note')).toHaveValue('Weekend F14')

  expect(await txnCount(page)).toBe(before) // opening the form stores nothing
  await page.getByRole('button', { name: 'Save Payment' }).click()
  await expect(page.getByText('Payment recorded successfully!')).toBeVisible()
  expect(await txnCount(page)).toBe(before + 1)

  const newest = (await (await page.request.get('/api/transactions')).json()).items[0]
  expect(newest.id).not.toBe(source.id)
  expect(newest.date).toBe(today)
  expect(newest.isFavorite).toBe(false)
  expect(newest.lines.map((l: { account: { id: number }; amount: number }) => [l.account.id, l.amount]))
    .toEqual([[id('Dining'), 70000], [id('Groceries'), 50000]])
  const original = await (await page.request.get(`/api/transactions/${source.id}`)).json()
  expect(original).toMatchObject({ date: '2026-11-01', total: 120000, note: 'Weekend F14', status: 'POSTED', isFavorite: true })
})

test('TEST-F14-03 duplicate a VOID receipt saves a new POSTED receipt', async ({ page }) => {
  await login(page, 'alice')
  const id = await accountIds(page)
  const source = await post(page, { form: 'RECEIPT', primaryAccountId: id('Bank'), date: '2026-11-02', total: 4500, lines: [{ accountId: id('Salary'), amount: 4500 }], note: 'void F14' })
  execSync(`npx tsx prisma/e2e-void.ts ${source.id}`, { cwd: 'server', stdio: 'inherit' })

  await page.goto(`/transactions/${source.id}`)
  await page.getByRole('link', { name: 'Duplicate' }).click()
  await expect(page).toHaveURL(new RegExp(`/receive\\?duplicate=${source.id}$`))
  await expect(page.locator('#totalInput')).toHaveValue('45.00')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible()

  const newest = (await (await page.request.get('/api/transactions')).json()).items[0]
  expect(newest.id).not.toBe(source.id)
  expect(newest).toMatchObject({ form: 'RECEIPT', status: 'POSTED', total: 4500, note: 'void F14' })
})

test('TEST-F14-04 archived account left empty and listed; foreign id shows not found', async ({ page }) => {
  await login(page, 'bob')
  const bobTxn = await post(page, { form: 'RECEIPT', primaryAccountId: (await accountIds(page))('Bank'), date: '2026-11-03', total: 100, lines: [{ accountId: (await accountIds(page))('Salary'), amount: 100 }] })

  await page.request.post('/api/auth/logout')
  await login(page, 'alice')
  const hobby = await (await page.request.post('/api/accounts', { data: { name: 'Hobby F14', type: 'EXPENSE' } })).json()
  const id = await accountIds(page)
  await post(page, { form: 'RECEIPT', primaryAccountId: id('Bank'), date: '2026-11-03', total: 1000, lines: [{ accountId: id('Salary'), amount: 1000 }] })
  const source = await post(page, { form: 'PAYMENT', primaryAccountId: id('Bank'), date: '2026-11-03', total: 1000, lines: [{ accountId: hobby.id, amount: 1000 }], note: 'hobby F14' })
  expect((await page.request.patch(`/api/accounts/${hobby.id}`, { data: { archived: true } })).status()).toBe(200)

  await page.goto(`/pay?duplicate=${source.id}`)
  await expect(page.getByText('Archived accounts were left empty: Hobby F14')).toBeVisible()
  await expect(page.getByLabel('Category / Debt account')).toHaveValue('0')
  await expect(page.locator('#total')).toHaveValue('10.00')

  await page.goto(`/pay?duplicate=${bobTxn.id}`)
  await expect(page.getByText('Transaction to duplicate was not found')).toBeVisible()
  await expect(page.locator('#total')).toHaveValue('')
  await expect(page.locator('#note')).toHaveValue('')
})
