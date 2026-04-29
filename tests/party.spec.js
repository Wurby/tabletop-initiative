import { test, expect } from '@playwright/test'
import { createCampaign, addUnit } from './helpers.js'

/** Open the Party modal (closes any prior modal first). */
async function openParty(page) {
  await page.getByRole('button', { name: 'Party' }).click()
  await expect(page.getByRole('heading', { name: 'Party' })).toBeVisible()
}

/** Add a party member via the Party modal (modal must already be open). */
async function addPartyMember(page, name, ac = 14) {
  const modal = page.locator('.fixed').filter({ has: page.getByRole('heading', { name: 'Party' }) })
  await modal.getByPlaceholder('Name').fill(name)
  await modal.getByPlaceholder('—').last().fill(String(ac))
  await modal.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByRole('textbox', { name, exact: true }).first()).toBeVisible()
}

/** Add a follower via the Party modal (modal must already be open). */
async function addFollower(page, name, hp = 20, ac = 12) {
  const modal = page.locator('.fixed').filter({ has: page.getByRole('heading', { name: 'Party' }) })
  await modal.getByRole('button', { name: 'P', exact: true }).click()
  await expect(modal.getByRole('button', { name: 'F', exact: true })).toBeVisible()
  await modal.getByPlaceholder('Name').fill(name)
  await modal.getByPlaceholder('—').first().fill(String(hp))
  await modal.getByPlaceholder('—').last().fill(String(ac))
  await modal.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByRole('textbox', { name, exact: true }).first()).toBeVisible()
}

test.describe('Party modal', () => {
  test('opens and shows empty state', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    await expect(page.getByText('No members yet')).toBeVisible()
  })

  test('P/F toggle defaults to P, switches to F and shows HP field', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    const modal = page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
    await expect(modal.getByRole('button', { name: 'P', exact: true })).toBeVisible()
    await modal.getByRole('button', { name: 'P', exact: true }).click()
    await expect(modal.getByRole('button', { name: 'F', exact: true })).toBeVisible()
    await expect(modal.getByText('HP')).toBeVisible()
  })

  test('P add form has no HP field', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    const modal = page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
    await expect(modal.getByText('HP')).not.toBeVisible()
  })

  test('adding a party member creates card in initiative', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    await addPartyMember(page, 'Aragorn')
    await expect(page.getByRole('textbox', { name: 'Aragorn', exact: true }).first()).toBeVisible()
  })

  test('party card shows P label, no HP box, no Kill/delete', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    await addPartyMember(page, 'Legolas')
    await page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
      .getByRole('button', { name: '✕' })
      .first()
      .click()
    const unitCard = page
      .locator('.w-48')
      .filter({ has: page.getByRole('textbox', { name: 'Legolas', exact: true }) })
    await expect(unitCard.getByText('P')).toBeVisible()
    await expect(unitCard.getByText('HP').first()).not.toBeVisible()
    await expect(unitCard.getByRole('button', { name: 'Kill' })).not.toBeVisible()
    await expect(unitCard.getByRole('button', { name: 'DS' })).toBeVisible()
  })

  test('party member shows P label in party list', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    await addPartyMember(page, 'Gimli')
    const modal = page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
    const memberRow = modal.getByRole('textbox', { name: 'Gimli', exact: true }).locator('..')
    await expect(memberRow.getByText('P')).toBeVisible()
  })

  test('adding a follower creates HP-tracked card in initiative', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    await addFollower(page, 'Shadowfax', 30, 13)
    await page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
      .getByRole('button', { name: '✕' })
      .first()
      .click()
    const unitCard = page
      .locator('.w-48')
      .filter({ has: page.getByRole('textbox', { name: 'Shadowfax', exact: true }) })
    await expect(unitCard.getByText('F')).toBeVisible()
    await expect(unitCard.getByText('HP').first()).toBeVisible()
    await expect(unitCard.getByRole('button', { name: 'Kill' })).not.toBeVisible()
    await expect(
      unitCard.locator('div.border-t').last().getByRole('button', { name: '✕' })
    ).not.toBeVisible()
  })

  test('follower shows F label in party list', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    await addFollower(page, 'Buckbeak', 25, 11)
    const modal = page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
    const memberRow = modal.getByRole('textbox', { name: 'Buckbeak', exact: true }).locator('..')
    await expect(memberRow.getByText('F')).toBeVisible()
  })

  test('editing party member name syncs to initiative card', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    await addPartyMember(page, 'Boromir')
    const modal = page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
    const nameInput = modal.getByRole('textbox', { name: 'Boromir', exact: true })
    await nameInput.fill('Faramir')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('textbox', { name: 'Faramir', exact: true }).first()).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Boromir', exact: true })).not.toBeVisible()
  })

  test('deleting a party member removes from list and from initiative', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    await addPartyMember(page, 'Merry')
    await expect(page.getByRole('textbox', { name: 'Merry', exact: true }).first()).toBeVisible()
    const modal = page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
    const memberRow = modal.getByRole('textbox', { name: 'Merry', exact: true }).locator('..')
    await memberRow.getByRole('button', { name: '✕' }).click()
    await expect(modal.getByRole('textbox', { name: 'Merry', exact: true })).not.toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Merry', exact: true })).not.toBeVisible()
  })

  test('deleting a follower removes from list and from initiative', async ({ page }) => {
    await createCampaign(page)
    await openParty(page)
    await addFollower(page, 'Treebeard', 40, 18)
    await expect(
      page.getByRole('textbox', { name: 'Treebeard', exact: true }).first()
    ).toBeVisible()
    const modal = page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
    const memberRow = modal.getByRole('textbox', { name: 'Treebeard', exact: true }).locator('..')
    await memberRow.getByRole('button', { name: '✕' }).click()
    await expect(page.getByRole('textbox', { name: 'Treebeard', exact: true })).toHaveCount(0)
  })
})

test.describe('End combat preserves party and follower', () => {
  test('mob removed, party member survives end combat', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'EnemyMob', initiative: 5, hp: 10 })
    await openParty(page)
    await addPartyMember(page, 'Frodo')
    await page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
      .getByRole('button', { name: '✕' })
      .first()
      .click()
    await page.getByRole('button', { name: 'End' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await expect(page.getByRole('textbox', { name: 'EnemyMob', exact: true })).not.toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Frodo', exact: true })).toBeVisible()
  })

  test('follower survives end combat', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Orc', initiative: 7, hp: 15 })
    await openParty(page)
    await addFollower(page, 'Strider', 35, 16)
    await page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
      .getByRole('button', { name: '✕' })
      .first()
      .click()
    await page.getByRole('button', { name: 'End' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await expect(page.getByRole('textbox', { name: 'Orc', exact: true })).not.toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Strider', exact: true })).toBeVisible()
  })
})
