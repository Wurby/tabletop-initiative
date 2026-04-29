import { expect } from '@playwright/test'

const SESSION_KEY = 'tbi-session'

/** Clear stored session and navigate to join screen. */
export async function goToJoinScreen(page) {
  await page.goto('/')
  await page.evaluate((k) => localStorage.removeItem(k), SESSION_KEY)
  await page.reload()
  await expect(page.getByText('Tabletop Initiative')).toBeVisible()
}

/**
 * Create a new campaign and land on the DM view.
 * Returns the 6-character join code.
 */
export async function createCampaign(page, name = 'TEST Campaign') {
  await goToJoinScreen(page)
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByPlaceholder('Campaign name').fill(name)
  await page.getByRole('button', { name: 'Create Campaign' }).click()
  await expect(page.getByText('DM', { exact: true })).toBeVisible()
  const code = await page.locator('header p').textContent()
  return code.trim()
}

/**
 * Join an existing campaign on a given page and land on the Table view.
 */
export async function joinAsTable(page, code) {
  await page.goto('/')
  await page.evaluate((k) => localStorage.removeItem(k), SESSION_KEY)
  await page.reload()
  await expect(page.getByText('Tabletop Initiative')).toBeVisible()
  await page.getByPlaceholder('Join code').fill(code)
  await page.getByRole('button', { name: 'Join Campaign' }).click()
  await expect(page.getByText('TABLE')).toBeVisible()
}

/**
 * Fill the Add Unit card and click Add.
 * Waits for the new unit's name input to appear before resolving.
 */
export async function addUnit(page, { name, initiative, hp, ac = 0, type = 'mob' }) {
  if (type === 'ally') {
    // Default type is mob — one click cycles M → A
    await page.getByRole('button', { name: 'M', exact: true }).first().click()
  }
  await page.getByPlaceholder('Name').fill(name)
  await page.getByPlaceholder('—').first().fill(String(initiative))
  await page.getByPlaceholder('—').nth(1).fill(String(hp))
  if (ac) await page.getByPlaceholder('—').nth(2).fill(String(ac))
  await page.getByRole('button', { name: 'Add' }).first().click()
  await expect(page.getByRole('textbox', { name, exact: true })).toBeVisible()
}

/**
 * Kill the first unit with "Kill" button using the first CR on the grid.
 */
export async function killFirstUnit(page) {
  await page.getByRole('button', { name: 'Kill' }).first().click()
  await page.getByRole('button', { name: '1', exact: true }).click()
}
