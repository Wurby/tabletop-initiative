import { test, expect } from '@playwright/test'
import { createCampaign, addUnit, killFirstUnit } from './helpers.js'

test.describe('DM Graveyard', () => {
  test('killed unit appears in graveyard with XP', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Goblin', initiative: 10, hp: 7 })
    await killFirstUnit(page)
    const graveyardSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Graveyard' }) })
    await expect(graveyardSection).toBeVisible()
    await expect(graveyardSection.getByText('Goblin')).toBeVisible()
    await expect(graveyardSection.getByText('200 XP').first()).toBeVisible()
  })

  test('total XP shown in graveyard header', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Orc', initiative: 8, hp: 15 })
    await killFirstUnit(page) // CR 1 = 200 XP
    const header = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Graveyard' }) })
    await expect(header.getByText('200 XP').first()).toBeVisible()
  })

  test('quest XP: fill label and amount, click Add — entry appears', async ({ page }) => {
    await createCampaign(page)
    const graveyardSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Graveyard' }) })
    await graveyardSection.getByPlaceholder('Bonus XP label…').fill('Rescued prisoners')
    await graveyardSection.getByPlaceholder('XP', { exact: true }).fill('300')
    await graveyardSection.getByRole('button', { name: 'Add' }).click()
    await expect(graveyardSection.getByText('Rescued prisoners')).toBeVisible()
    await expect(graveyardSection.getByText('300 XP')).toBeVisible()
  })

  test('quest XP total adds to running total', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Warg', initiative: 6, hp: 18 })
    await killFirstUnit(page) // CR 1 = 200 XP
    await page.getByPlaceholder('Bonus XP label…').fill('Quest bonus')
    await page.getByPlaceholder('XP', { exact: true }).fill('100')
    await page.getByRole('button', { name: 'Add' }).last().click()
    // Total should be 300 XP
    const graveSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Graveyard' }) })
    await expect(graveSection.getByText('300 XP')).toBeVisible()
  })

  test('return button moves unit back to initiative', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Skeleton', initiative: 11, hp: 13 })
    await killFirstUnit(page)
    await expect(page.getByText('Skeleton')).toBeVisible()
    await page.getByRole('button', { name: '↩' }).click()
    // Unit should be back in initiative (name input visible)
    await expect(page.getByRole('textbox', { name: 'Skeleton', exact: true })).toBeVisible()
    // And gone from graveyard list
    await expect(page.getByRole('button', { name: '↩' })).not.toBeVisible()
  })

  test('delete kill entry removes it from graveyard', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Bandit', initiative: 9, hp: 8 })
    await killFirstUnit(page)
    await expect(page.getByText('Bandit')).toBeVisible()
    // ✕ delete button is next to the ↩ return button
    const graveyardSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Graveyard' }) })
    // The delete ✕ for the kill entry (not modals)
    await graveyardSection.getByRole('button', { name: '✕' }).first().click()
    await expect(page.getByText('Bandit')).not.toBeVisible()
  })

  test('delete quest XP entry removes it', async ({ page }) => {
    await createCampaign(page)
    await page.getByPlaceholder('Bonus XP label…').fill('Side quest')
    await page.getByPlaceholder('XP', { exact: true }).fill('150')
    await page.getByRole('button', { name: 'Add' }).last().click()
    await expect(page.getByText('Side quest')).toBeVisible()
    const graveyardSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Graveyard' }) })
    await graveyardSection.getByRole('button', { name: '✕' }).first().click()
    await expect(page.getByText('Side quest')).not.toBeVisible()
  })

  test('Clear button appears only when graveyard has entries', async ({ page }) => {
    await createCampaign(page)
    await expect(page.getByRole('button', { name: 'Clear' })).not.toBeVisible()
    await addUnit(page, { name: 'Imp', initiative: 4, hp: 5 })
    await killFirstUnit(page)
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible()
  })
})

test.describe('End Session modal', () => {
  test('Clear opens End Session modal with total XP and party size', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Troll', initiative: 7, hp: 30 })
    await killFirstUnit(page)
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByRole('heading', { name: 'End Session' })).toBeVisible()
    await expect(page.getByText('Total XP')).toBeVisible()
    await expect(page.getByText('Party size')).toBeVisible()
    await expect(page.getByText('Per player')).toBeVisible()
  })

  test('changing party size updates per player split', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Dragon', initiative: 20, hp: 100 })
    await killFirstUnit(page) // CR 1 = 200 XP
    await page.getByRole('button', { name: 'Clear' }).click()
    const modal = page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'End Session' }) })
    await modal.getByRole('spinbutton').fill('4')
    await modal.getByRole('spinbutton').blur()
    await expect(modal.getByText('50 XP')).toBeVisible()
  })

  test('Cancel closes modal, graveyard unchanged', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Wolf', initiative: 6, hp: 11 })
    await killFirstUnit(page)
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('heading', { name: 'End Session' })).not.toBeVisible()
    await expect(page.getByText('Wolf')).toBeVisible()
  })

  test('Confirm & Clear empties graveyard and shows Session Summary', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Ogre', initiative: 5, hp: 50 })
    await killFirstUnit(page)
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Confirm & Clear' }).click()
    await expect(page.getByText('No kills yet')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Session Summary' })).toBeVisible()
  })

  test('Session Summary shows XP breakdown', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Ghoul', initiative: 9, hp: 22 })
    await killFirstUnit(page)
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Confirm & Clear' }).click()
    await expect(page.getByRole('heading', { name: 'Session Summary' })).toBeVisible()
    await expect(page.getByText('Total XP')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dismiss' })).toBeVisible()
  })

  test('DM can dismiss Session Summary', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Lich', initiative: 22, hp: 135 })
    await killFirstUnit(page)
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Confirm & Clear' }).click()
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await expect(page.getByRole('heading', { name: 'Session Summary' })).not.toBeVisible()
  })
})

test.describe('Session Log', () => {
  test('Log button opens SessionLogModal', async ({ page }) => {
    await createCampaign(page)
    await page.getByRole('button', { name: 'Log' }).click()
    await expect(page.getByRole('heading', { name: 'Session Log' })).toBeVisible()
  })

  test('empty log shows "No sessions logged yet"', async ({ page }) => {
    await createCampaign(page)
    await page.getByRole('button', { name: 'Log' }).click()
    await expect(page.getByText('No sessions logged yet')).toBeVisible()
  })

  test('after clearing graveyard, session entry appears in log', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Kobold', initiative: 4, hp: 5 })
    await killFirstUnit(page)
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Confirm & Clear' }).click()
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await page.getByRole('button', { name: 'Log' }).click()
    await expect(page.getByText('200 XP')).toBeVisible()
    await expect(page.getByText('each')).toBeVisible()
  })

  test('Clear all removes all log entries', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Goblin', initiative: 8, hp: 7 })
    await killFirstUnit(page)
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Confirm & Clear' }).click()
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await page.getByRole('button', { name: 'Log' }).click()
    await page.getByRole('button', { name: 'Clear all' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await expect(page.getByText('No sessions logged yet')).toBeVisible()
  })

  test('Clear all No keeps log entries', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Rat', initiative: 2, hp: 2 })
    await killFirstUnit(page)
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Confirm & Clear' }).click()
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await page.getByRole('button', { name: 'Log' }).click()
    await page.getByRole('button', { name: 'Clear all' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    await expect(page.getByText('No sessions logged yet')).not.toBeVisible()
  })
})
