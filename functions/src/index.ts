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
  const cutoff = admin.firestore.Timestamp.fromMillis(
    Date.now() - thresholdDays * 24 * 60 * 60 * 1000
  )

  const snapshot = await db
    .collection('campaigns')
    .where('meta.lastActiveAt', '<', cutoff)
    .get()

  const toDelete = snapshot.docs.filter((d) => d.data().meta?.locked !== true)
  const skipped = snapshot.docs.length - toDelete.length
  let deleted = 0
  let errors = 0

  for (const docSnap of toDelete) {
    const data = docSnap.data()
    const code = docSnap.id
    try {
      const bucket = adminStorage.bucket()
      await bucket.deleteFiles({ prefix: `campaigns/${code}/` }).catch(() => {})

      const dmUid: string | undefined = data.meta?.dmUid
      if (dmUid) await adminAuth.deleteUser(dmUid).catch(() => {})

      await docSnap.ref.delete()
      deleted++
    } catch {
      errors++
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
