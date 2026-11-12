import { expect, test } from '@playwright/test'

// Uses the seeded dev database (README: migrate + seed); the password comes from server/.env.
const password = process.env.SEED_USER_PASSWORD ?? ''

test('TEST-F01-08 user logs in, sees their name, logs out and protected pages redirect to Login', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()

  await expect(page).toHaveURL(/\/overview$/)
  await expect(page.getByRole('navigation')).toContainText('Alice Example')

  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('/overview')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Money Logger' })).toBeVisible()
})

test('TEST-F01-08 (login error) wrong password shows the generic error and keeps the username', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('alice')
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Log in' }).click()

  await expect(page.getByRole('alert')).toHaveText('Invalid username or password.')
  await expect(page.getByLabel('Username')).toHaveValue('alice')
  await expect(page.getByLabel('Password')).toHaveValue('')
})
