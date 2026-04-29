import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = path.resolve(__dirname, '../playwright/.auth/state.json')

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  // Reuse cached state if it's recent — Firebase ID tokens last 1 hour
  if (fs.existsSync(AUTH_FILE)) {
    const { mtimeMs } = fs.statSync(AUTH_FILE)
    if (Date.now() - mtimeMs < 55 * 60 * 1000) return
  }

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('http://localhost:5174')
  // Wait for Firebase anonymous auth to complete once for the entire test suite
  await page.waitForSelector('text=Tabletop Initiative', { timeout: 60_000 })

  await context.storageState({ path: AUTH_FILE, indexedDB: true })
  await browser.close()
}
