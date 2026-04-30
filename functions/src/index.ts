import { setGlobalOptions } from 'firebase-functions'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()
const adminAuth = admin.auth()
const adminStorage = admin.storage()

const adminSecret = defineSecret('ADMIN_SECRET')

setGlobalOptions({ maxInstances: 10 })

function verifyAdmin(password: string) {
  if (!adminSecret.value() || password !== adminSecret.value()) {
    throw new HttpsError('permission-denied', 'Unauthorized')
  }
}

async function deleteStale(thresholdDays: number): Promise<{
  deleted: number
  errors: number
  skipped: number
}> {
  const cutoffMs = Date.now() - thresholdDays * 24 * 60 * 60 * 1000

  const snapshot = await db.collection('campaigns').get()

  const toDelete = snapshot.docs.filter((d) => {
    const data = d.data()
    if (data.meta?.locked === true) return false
    const lastActiveAt = data.meta?.lastActiveAt
    if (!lastActiveAt) return true
    return lastActiveAt.toMillis() < cutoffMs
  })
  const skipped = snapshot.docs.length - toDelete.length
  let deleted = 0
  let errors = 0

  // Batch delete all anonymous auth users in one call (up to 1000 per call)
  const uids = toDelete
    .map((d) => d.data().meta?.dmUid as string | undefined)
    .filter((uid): uid is string => !!uid)
  for (let i = 0; i < uids.length; i += 1000) {
    await adminAuth.deleteUsers(uids.slice(i, i + 1000)).catch(() => {})
  }

  // Parallel Storage deletes + Firestore batch deletes in chunks
  const bucket = adminStorage.bucket()
  const CHUNK = 25

  for (let i = 0; i < toDelete.length; i += CHUNK) {
    const chunk = toDelete.slice(i, i + CHUNK)

    await Promise.allSettled(
      chunk.map((d) => bucket.deleteFiles({ prefix: `campaigns/${d.id}/` }).catch(() => {}))
    )

    const batch = db.batch()
    chunk.forEach((d) => batch.delete(d.ref))
    try {
      await batch.commit()
      deleted += chunk.length
    } catch {
      errors += chunk.length
    }
  }

  return { deleted, errors, skipped }
}

export const adminListCampaigns = onCall(
  { secrets: [adminSecret], invoker: 'public' },
  async (req) => {
    verifyAdmin(req.data.password)
    const snapshot = await db.collection('campaigns').get()
    const now = Date.now()
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      const lastActiveAt: number | null = data.meta?.lastActiveAt?.toMillis?.() ?? null
      const staleDays =
        lastActiveAt !== null ? Math.floor((now - lastActiveAt) / 86400000) : null
      return {
        code: docSnap.id,
        name: (data.meta?.name as string) ?? docSnap.id,
        lastActiveAt,
        staleDays,
        locked: (data.meta?.locked as boolean) ?? false,
      }
    })
  }
)

export const adminToggleLock = onCall(
  { secrets: [adminSecret], invoker: 'public' },
  async (req) => {
    verifyAdmin(req.data.password)
    const { campaignCode, locked } = req.data as { campaignCode: string; locked: boolean }
    await db.doc(`campaigns/${campaignCode}`).update({ 'meta.locked': locked })
    return { success: true }
  }
)

export const adminRunCleanup = onCall(
  { secrets: [adminSecret], invoker: 'public' },
  async (req) => {
    verifyAdmin(req.data.password)
    const thresholdDays = Number(req.data.thresholdDays) || 30
    return deleteStale(thresholdDays)
  }
)

export const scheduledCleanup = onSchedule(
  { schedule: '0 0 1 * *', secrets: [adminSecret] },
  async () => {
    await deleteStale(30)
  }
)
