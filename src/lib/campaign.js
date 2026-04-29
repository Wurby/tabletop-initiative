import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export function dmUpdate(campaignCode, data) {
  return updateDoc(doc(db, 'campaigns', campaignCode), {
    ...data,
    'meta.lastActiveAt': serverTimestamp(),
  })
}
