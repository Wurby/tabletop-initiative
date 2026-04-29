/**
 * Cross-tab sync tests.
 * Each test uses two browser contexts: DM (page) and Table (tablePage).
 * Firebase's onSnapshot propagates writes between them in real time.
 */
import { test, expect } from '@playwright/test'
import { createCampaign, joinAsTable, addUnit, killFirstUnit } from './helpers.js'

const AUTH_FILE = 'playwright/.auth/state.json'

test.describe('Cross-tab sync', () => {
  test('unit added on DM appears on Table', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await addUnit(page, { name: 'Goblin', initiative: 12, hp: 10 })

    await expect(tablePage.getByText('Goblin')).toBeVisible()
    await ctx2.close()
  })

  test('HP change on DM reflects on Table', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await addUnit(page, { name: 'Troll', initiative: 9, hp: 30 })
    await expect(tablePage.getByText('Troll')).toBeVisible()

    await page.getByTitle('Show on table').click()
    await page.getByRole('button', { name: '−−' }).first().click()
    await expect(tablePage.getByText('Troll')).toBeVisible()
    await expect(tablePage.locator('text=25').or(tablePage.locator('text=25 / 30'))).toBeVisible()
    await ctx2.close()
  })

  test('visibility toggle on DM shows/hides on Table', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await addUnit(page, { name: 'Ghost', initiative: 14, hp: 20 })

    await expect(tablePage.getByText('Ghost')).not.toBeVisible()

    await page.getByTitle('Show on table').click()
    await expect(tablePage.getByText('Ghost')).toBeVisible()

    await page.getByTitle('Hide from table').click()
    await expect(tablePage.getByText('Ghost')).not.toBeVisible()

    await ctx2.close()
  })

  test('active turn set on DM is highlighted on Table', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await addUnit(page, { name: 'Warrior', initiative: 16, hp: 35 })
    await page.getByTitle('Show on table').click()
    await expect(tablePage.getByText('Warrior')).toBeVisible()

    const unitCard = page
      .locator('.w-48')
      .filter({ has: page.getByRole('textbox', { name: 'Warrior', exact: true }) })
    await unitCard.getByRole('button', { name: '▶' }).click()

    await expect(tablePage.getByText('▶')).toBeVisible()
    await ctx2.close()
  })

  test('killed unit disappears from Table initiative', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await addUnit(page, { name: 'Vampire', initiative: 18, hp: 80 })
    await page.getByTitle('Show on table').click()
    await expect(tablePage.getByText('Vampire')).toBeVisible()

    await killFirstUnit(page)
    await expect(tablePage.getByText('Vampire')).not.toBeVisible()
    await ctx2.close()
  })

  test('clearing graveyard shows Session Summary on both DM and Table', async ({
    page,
    browser,
  }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await addUnit(page, { name: 'Ogre', initiative: 5, hp: 40 })
    await killFirstUnit(page)
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Confirm & Clear' }).click()

    await expect(page.getByRole('heading', { name: 'Session Summary' })).toBeVisible()
    await expect(tablePage.getByRole('heading', { name: 'Session Summary' })).toBeVisible()
    await ctx2.close()
  })

  test('DM dismissing Session Summary closes it on Table too', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await addUnit(page, { name: 'Giant', initiative: 3, hp: 60 })
    await killFirstUnit(page)
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Confirm & Clear' }).click()
    await expect(tablePage.getByRole('heading', { name: 'Session Summary' })).toBeVisible()

    await expect(tablePage.getByRole('button', { name: 'Dismiss' })).not.toBeVisible()

    await page.getByRole('button', { name: 'Dismiss' }).click()
    await expect(tablePage.getByRole('heading', { name: 'Session Summary' })).not.toBeVisible()
    await ctx2.close()
  })

  test('round counter change on DM syncs to Table', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    const plusBtn = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Initiative' }) })
      .getByRole('button', { name: '+' })
    await plusBtn.click()
    await plusBtn.click()

    await expect(tablePage.getByText('3')).toBeVisible()
    await ctx2.close()
  })

  test('party member added on DM appears on Table', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await page.getByRole('button', { name: 'Party' }).click()
    await expect(page.getByRole('heading', { name: 'Party' })).toBeVisible()
    const modal = page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
    await modal.getByPlaceholder('Name').fill('Gandalf')
    await modal.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByRole('textbox', { name: 'Gandalf', exact: true }).first()).toBeVisible()

    await page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
      .getByRole('button', { name: '✕' })
      .first()
      .click()
    await page.getByTitle('Show on table').click()

    await expect(tablePage.getByText('Gandalf')).toBeVisible()
    await ctx2.close()
  })

  test('party member deleted on DM disappears from Table', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await page.getByRole('button', { name: 'Party' }).click()
    const modal = page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
    await modal.getByPlaceholder('Name').fill('Bilbo')
    await modal.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByRole('textbox', { name: 'Bilbo', exact: true }).first()).toBeVisible()
    await page.getByTitle('Show on table').click()
    await expect(tablePage.getByText('Bilbo')).toBeVisible()

    const memberRow = modal.getByRole('textbox', { name: 'Bilbo', exact: true }).locator('..')
    await memberRow.getByRole('button', { name: '✕' }).click()
    await expect(tablePage.getByText('Bilbo')).not.toBeVisible()
    await ctx2.close()
  })
})

test.describe('Table view read-only', () => {
  test('Table has no Log or Party buttons', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await expect(tablePage.getByRole('button', { name: 'Log' })).not.toBeVisible()
    await expect(tablePage.getByRole('button', { name: 'Party' })).not.toBeVisible()
    await ctx2.close()
  })

  test('Table "Waiting for combat" shown when initiative empty', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await expect(tablePage.getByText('Waiting for combat')).toBeVisible()
    await ctx2.close()
  })

  test('hidden unit shows placeholder on Table, not name', async ({ page, browser }) => {
    const code = await createCampaign(page)
    const ctx2 = await browser.newContext({ storageState: AUTH_FILE })
    const tablePage = await ctx2.newPage()
    await joinAsTable(tablePage, code)

    await addUnit(page, { name: 'SecretBoss', initiative: 20, hp: 200 })
    await expect(tablePage.getByText('SecretBoss')).not.toBeVisible()
    await expect(tablePage.getByText('Waiting for combat')).not.toBeVisible()
    await ctx2.close()
  })
})
