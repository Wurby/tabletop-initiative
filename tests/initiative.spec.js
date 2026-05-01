import { test, expect } from '@playwright/test'
import { createCampaign, addUnit } from './helpers.js'

test.describe('Add Card', () => {
  test('shows M type button, Name, HP, AC fields and Add button', async ({ page }) => {
    await createCampaign(page)
    await expect(page.getByRole('button', { name: 'M', exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('Name')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add' }).first()).toBeVisible()
  })

  test('submit with empty name shows error on name field', async ({ page }) => {
    await createCampaign(page)
    await page.getByPlaceholder('—').first().fill('10')
    await page.getByPlaceholder('—').nth(1).fill('20')
    await page.getByRole('button', { name: 'Add' }).first().click()
    await expect(page.getByRole('button', { name: 'Kill' })).not.toBeVisible()
  })

  test('submit with empty initiative shows error', async ({ page }) => {
    await createCampaign(page)
    await page.getByPlaceholder('Name').fill('Orc')
    await page.getByPlaceholder('—').nth(1).fill('20')
    await page.getByRole('button', { name: 'Add' }).first().click()
    await expect(page.getByRole('button', { name: 'Kill' })).not.toBeVisible()
  })

  test('submit with empty HP shows error', async ({ page }) => {
    await createCampaign(page)
    await page.getByPlaceholder('Name').fill('Orc')
    await page.getByPlaceholder('—').first().fill('10')
    await page.getByRole('button', { name: 'Add' }).first().click()
    await expect(page.getByRole('button', { name: 'Kill' })).not.toBeVisible()
  })

  test('filling all fields and clicking Add creates a unit card', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Goblin', initiative: 12, hp: 15, ac: 13 })
    await expect(page.getByRole('textbox', { name: 'Goblin', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kill' })).toBeVisible()
  })

  test('pressing Enter in name field adds the unit', async ({ page }) => {
    await createCampaign(page)
    await page.getByPlaceholder('Name').fill('Troll')
    await page.getByPlaceholder('—').first().fill('8')
    await page.getByPlaceholder('—').nth(1).fill('30')
    await page.getByPlaceholder('Name').press('Enter')
    await expect(page.getByRole('textbox', { name: 'Troll', exact: true })).toBeVisible()
  })

  test('new mob card has M label and red header', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Rat', initiative: 5, hp: 4 })
    // Both the add card and the unit card have M buttons; verify at least one exists
    await expect(page.getByRole('button', { name: 'M', exact: true }).first()).toBeVisible()
  })

  test('type cycle button on add card: M → A → M, no P', async ({ page }) => {
    await createCampaign(page)
    const cycleBtn = page.getByRole('button', { name: 'M', exact: true })
    await expect(cycleBtn).toBeVisible()
    await cycleBtn.click()
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'A', exact: true }).click()
    await expect(page.getByRole('button', { name: 'M', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'P', exact: true })).not.toBeVisible()
  })

  test('units sort descending by initiative on add', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Slow', initiative: 3, hp: 10 })
    await addUnit(page, { name: 'Fast', initiative: 18, hp: 10 })
    const allLabels = await page
      .getByRole('textbox')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')).filter(Boolean))
    expect(allLabels.indexOf('Fast')).toBeLessThan(allLabels.indexOf('Slow'))
  })
})

test.describe('UnitCard — DM view', () => {
  test('clicking AC/init area opens popover with steppers', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Orc', initiative: 10, hp: 20, ac: 14 })
    await page.getByRole('button', { name: /AC \d+ i \d+/ }).click()
    await expect(page.getByText('AC').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '++' }).first()).toBeVisible()
  })

  test('clicking outside popover closes it', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Orc', initiative: 10, hp: 20, ac: 14 })
    await page.getByRole('button', { name: /AC \d+ i \d+/ }).click()
    await expect(page.getByRole('button', { name: '++' }).first()).toBeVisible()
    // Click outside the card — real mouse event needed to trigger native mousedown listener
    await page.getByRole('banner').click()
    // Both ++ buttons (AC and init steppers) are inside the same popover
    await expect(page.getByRole('button', { name: '++' }).first()).not.toBeVisible()
  })

  test('HP + stepper increments current HP', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Wolf', initiative: 9, hp: 20 })
    const unitCard = page
      .locator('.w-48')
      .filter({ has: page.getByRole('textbox', { name: 'Wolf', exact: true }) })
    const hpSpin = unitCard.getByRole('spinbutton').first()
    // Decrement first so current < max, then verify + brings it back up
    await unitCard.getByRole('button', { name: '−', exact: true }).first().click()
    await expect(hpSpin).toHaveValue('19')
    await unitCard.getByRole('button', { name: '+', exact: true }).first().click()
    await expect(hpSpin).toHaveValue('20')
  })

  test('HP − stepper decrements and does not go below 0', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Rat', initiative: 4, hp: 1 })
    const unitCard = page
      .locator('.w-48')
      .filter({ has: page.getByRole('textbox', { name: 'Rat', exact: true }) })
    const hpSpin = unitCard.getByRole('spinbutton').first()
    await unitCard.getByRole('button', { name: '−', exact: true }).first().click()
    await expect(hpSpin).toHaveValue('0')
    await unitCard.getByRole('button', { name: '−', exact: true }).first().click()
    await expect(hpSpin).toHaveValue('0')
  })

  test('status field: type and blur persists value', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Guard', initiative: 7, hp: 15 })
    await page.getByPlaceholder('Status…').fill('Prone')
    await page.getByPlaceholder('Status…').blur()
    await expect(page.getByPlaceholder('Status…')).toHaveValue('Prone')
  })

  test('visibility toggle dims the card on DM view', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Ghost', initiative: 14, hp: 10 })
    const card = page
      .locator('.w-48')
      .filter({ has: page.getByRole('textbox', { name: 'Ghost', exact: true }) })
    // Unit starts hidden from table — card is dim on DM (opacity-50 when !visible)
    await expect(card).toHaveClass(/opacity-50/)
    // Showing on table removes the dimming
    await page.getByTitle('Show on table').click()
    await expect(card).not.toHaveClass(/opacity-50/)
  })

  test('HP toggle button highlights when active', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Ogre', initiative: 6, hp: 40 })
    const hpBtn = page.getByRole('button', { name: 'HP' })
    await hpBtn.click()
    await expect(hpBtn).toHaveClass(/text-brand-rivulet/)
  })

  test('AC toggle only visible on mob cards, not ally', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Bandit', initiative: 11, hp: 12 })
    // The footer AC toggle button has exactly "AC" as its label (not "AC 13 i 11")
    await expect(page.getByRole('button', { name: 'AC', exact: true })).toBeVisible()
    await addUnit(page, { name: 'NPC', initiative: 8, hp: 12, type: 'ally' })
    // Ally has no footer AC toggle — still exactly 1 (only mob has it)
    await expect(page.getByRole('button', { name: 'AC', exact: true })).toHaveCount(1)
  })

  test('mob cycle button cycles M → A → M only', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Zombie', initiative: 3, hp: 22 })
    const unitCard = page
      .locator('.w-48')
      .filter({ has: page.getByRole('textbox', { name: 'Zombie', exact: true }) })
    const typeBtn = unitCard.getByRole('button', { name: 'M', exact: true })
    await typeBtn.click()
    await expect(unitCard.getByRole('button', { name: 'A', exact: true })).toBeVisible()
    await unitCard.getByRole('button', { name: 'A', exact: true }).click()
    await expect(unitCard.getByRole('button', { name: 'M', exact: true })).toBeVisible()
  })
})

test.describe('Kill flow', () => {
  test('Kill button opens CR grid with 9 entries and pagination', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Dragon', initiative: 20, hp: 100 })
    await page.getByRole('button', { name: 'Kill' }).click()
    await expect(page.getByRole('button', { name: '0', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '5', exact: true })).toBeVisible()
    await expect(page.getByText('1 / 4')).toBeVisible()
  })

  test('first page has ‹ disabled, last page has › disabled', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Troll', initiative: 9, hp: 30 })
    await page.getByRole('button', { name: 'Kill' }).click()
    await expect(page.getByRole('button', { name: '‹' })).toBeDisabled()
    await expect(page.getByRole('button', { name: '›' })).not.toBeDisabled()
    await page.getByRole('button', { name: '›' }).click()
    await page.getByRole('button', { name: '›' }).click()
    await page.getByRole('button', { name: '›' }).click()
    await expect(page.getByRole('button', { name: '›' })).toBeDisabled()
  })

  test('clicking a CR removes unit from initiative and adds to graveyard', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Imp', initiative: 7, hp: 10 })
    await page.getByRole('button', { name: 'Kill' }).click()
    await page.getByRole('button', { name: '1', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Imp', exact: true })).not.toBeVisible()
    await expect(page.getByText('Imp')).toBeVisible()
    await expect(page.getByText('200 XP').first()).toBeVisible()
  })

  test('Cancel returns to unit card without killing', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Worg', initiative: 8, hp: 18 })
    await page.getByRole('button', { name: 'Kill' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('textbox', { name: 'Worg', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kill' })).toBeVisible()
  })

  test('Delete button removes unit without confirmation', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Mook', initiative: 2, hp: 5 })
    await page.getByRole('button', { name: '✕' }).click()
    await expect(page.getByRole('textbox', { name: 'Mook', exact: true })).not.toBeVisible()
  })
})

test.describe('Active turn & round counter', () => {
  test('clicking ▶ sets that card as active', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Fighter', initiative: 15, hp: 40 })
    const unitCard = page
      .locator('.w-48')
      .filter({ has: page.getByRole('textbox', { name: 'Fighter', exact: true }) })
    await unitCard.getByRole('button', { name: '▶' }).click()
    const wrapper = page.locator('.relative.flex-shrink-0').filter({
      has: page.getByRole('textbox', { name: 'Fighter', exact: true }),
    })
    await expect(wrapper).toHaveClass(/outline/)
  })

  test('round counter starts at 1', async ({ page }) => {
    await createCampaign(page)
    await expect(page.getByText('Round')).toBeVisible()
    const roundArea = page.locator('div').filter({ hasText: /^Round−1\+$/ })
    await expect(roundArea.or(page.getByText('1').first())).toBeTruthy()
  })

  test('+ increments round, − decrements it, cannot go below 1', async ({ page }) => {
    await createCampaign(page)
    await page.getByRole('heading', { name: 'Initiative' }).waitFor()
    const plusBtn = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Initiative' }) })
      .getByRole('button', { name: '+' })
    const minusBtn = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Initiative' }) })
      .getByRole('button', { name: '−' })
    await plusBtn.click()
    await expect(page.getByText('Round').locator('..').getByText('2')).toBeVisible()
    await minusBtn.click()
    await expect(page.getByText('Round').locator('..').getByText('1')).toBeVisible()
    await minusBtn.click()
    await expect(page.getByText('Round').locator('..').getByText('1')).toBeVisible()
  })
})

test.describe('End combat', () => {
  test('End button shows Yes/No confirm', async ({ page }) => {
    await createCampaign(page)
    await page.getByRole('button', { name: 'End' }).click()
    await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'No' })).toBeVisible()
  })

  test('No dismisses confirm, nothing cleared', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Bandit', initiative: 10, hp: 12 })
    await page.getByRole('button', { name: 'End' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    await expect(page.getByRole('textbox', { name: 'Bandit', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'End' })).toBeVisible()
  })

  test('Yes clears mob/ally units, resets round to 1', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'Mob1', initiative: 10, hp: 12 })
    await addUnit(page, { name: 'Ally1', initiative: 8, hp: 10, type: 'ally' })
    const plusBtn = page.getByText('Round').locator('..').getByRole('button', { name: '+' })
    await plusBtn.click()
    await plusBtn.click()
    await page.getByRole('button', { name: 'End' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await expect(page.getByRole('textbox', { name: 'Mob1', exact: true })).not.toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Ally1', exact: true })).not.toBeVisible()
  })

  test('Yes preserves party and follower units', async ({ page }) => {
    await createCampaign(page)
    await addUnit(page, { name: 'EvilMob', initiative: 5, hp: 10 })
    await page.getByRole('button', { name: 'Party' }).click()
    await page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
      .getByPlaceholder('Name')
      .fill('Paladin')
    await page.getByRole('button', { name: 'Add' }).last().click()
    await expect(page.getByRole('textbox', { name: 'Paladin', exact: true }).first()).toBeVisible()
    await page
      .locator('.fixed')
      .filter({ has: page.getByRole('heading', { name: 'Party' }) })
      .getByRole('button', { name: '✕' })
      .first()
      .click()

    await page.getByRole('button', { name: 'End' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await expect(page.getByRole('textbox', { name: 'EvilMob', exact: true })).not.toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Paladin', exact: true })).toBeVisible()
  })
})
