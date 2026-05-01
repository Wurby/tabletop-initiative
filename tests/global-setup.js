import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = path.resolve(__dirname, '../playwright/.auth/state.json')
const AUTH_FILE2 = path.resolve(__dirname, '../playwright/.auth/state2.json')

function isRecent(filePath) {
  if (!fs.existsSync(filePath)) return false
  const { mtimeMs } = fs.statSync(filePath)
  return Date.now() - mtimeMs < 55 * 60 * 1000
}

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  if (isRecent(AUTH_FILE) && isRecent(AUTH_FILE2)) return

  const browser = await chromium.launch()

  // First anonymous user — used as DM in all tests
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('http://localhost:5174')
  await page.waitForSelector('text=Tabletop Initiative', { timeout: 60_000 })
  await context.storageState({ path: AUTH_FILE, indexedDB: true })
  await context.close()

  // Second anonymous user — used as TABLE viewer in sync tests
  const context2 = await browser.newContext()
  const page2 = await context2.newPage()
  await page2.goto('http://localhost:5174')
  await page2.waitForSelector('text=Tabletop Initiative', { timeout: 60_000 })
  await context2.storageState({ path: AUTH_FILE2, indexedDB: true })
  await context2.close()

  await browser.close()
}
