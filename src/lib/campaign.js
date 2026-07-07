import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export function dmUpdate(campaignCode, data) {
  return updateDoc(doc(db, 'campaigns', campaignCode), {
    ...data,
    'meta.lastActiveAt': serverTimestamp(),
  })
}

// Pushes an image to the table view, exactly like clicking a thumbnail in the Images panel.
export function pushImageToTable(campaignCode, url, label) {
  return dmUpdate(campaignCode, { 'combat.display': { type: 'image', url, label: label ?? '' } })
}

export function clearTableDisplay(campaignCode) {
  return dmUpdate(campaignCode, { 'combat.display': { type: 'none', url: '', label: '' } })
}
