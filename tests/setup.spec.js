import { test, expect } from '@playwright/test'
import { goToJoinScreen, createCampaign, joinAsTable } from './helpers.js'

const AUTH_FILE = 'playwright/.auth/state.json'

test.describe('Join Screen', () => {
  test('renders join screen on fresh load', async ({ page }) => {
    await goToJoinScreen(page)
    await expect(page.getByRole('heading', { name: 'Tabletop Initiative' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Join', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('Join code')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Join Campaign' })).toBeVisible()
  })

  test('Create tab shows campaign name field', async ({ page }) => {
    await goToJoinScreen(page)
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByPlaceholder('Campaign name')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Campaign' })).toBeVisible()
    await expect(page.getByPlaceholder('Join code')).not.toBeVisible()
  })

  test('empty campaign name shows error', async ({ page }) => {
    await goToJoinScreen(page)
    await page.getByRole('button', { name: 'Create' }).click()
    await page.getByRole('button', { name: 'Create Campaign' }).click()
    await expect(page.getByText('Campaign name is required')).toBeVisible()
  })

  test('empty join code shows error', async ({ page }) => {
    await goToJoinScreen(page)
    await page.getByRole('button', { name: 'Join Campaign' }).click()
    await expect(page.getByText('Enter a join code')).toBeVisible()
  })

  test('invalid join code shows error', async ({ page }) => {
    await goToJoinScreen(page)
    await page.getByPlaceholder('Join code').fill('XXXXXX')
    await page.getByRole('button', { name: 'Join Campaign' }).click()
    await expect(page.getByText('Campaign not found')).toBeVisible()
  })

  test('creating campaign lands on DM view with campaign name and code', async ({ page }) => {
    const code = await createCampaign(page, 'My Adventure')
    await expect(page.getByRole('heading', { name: 'My Adventure' })).toBeVisible()
    await expect(page.getByText('DM', { exact: true })).toBeVisible()
    await expect(page.getByText(code, { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Party' })).toBeVisible()
  })

  test('DM view persists after page refresh', async ({ page }) => {
    await createCampaign(page, 'Persist Test')
    await page.reload()
    await expect(page.getByText('DM', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Persist Test' })).toBeVisible()
  })

  test('joining with code lands on Table view', async ({ page, browser }) => {
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    const code = await createCampaign(page)
    await joinAsTable(tablePage, code)
    await expect(tablePage.getByText('TABLE')).toBeVisible()
    await expect(tablePage.getByRole('button', { name: 'Log' })).not.toBeVisible()
    await expect(tablePage.getByRole('button', { name: 'Party' })).not.toBeVisible()
    await ctx2.close()
  })

  test('Table view persists after page refresh', async ({ page, browser }) => {
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    const code = await createCampaign(page)
    await joinAsTable(tablePage, code)
    await tablePage.reload()
    await expect(tablePage.getByText('TABLE')).toBeVisible()
    await ctx2.close()
  })

  test('Leave button returns to join screen', async ({ page }) => {
    await createCampaign(page)
    await page.getByRole('button', { name: 'Leave' }).click()
    await expect(page.getByRole('heading', { name: 'Tabletop Initiative' })).toBeVisible()
  })

  test('Leave clears localStorage so refresh stays on join screen', async ({ page }) => {
    await createCampaign(page)
    await page.getByRole('button', { name: 'Leave' }).click()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Tabletop Initiative' })).toBeVisible()
  })
})
