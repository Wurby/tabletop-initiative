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

// Pushes a full item card (name/type/rarity/stats/notes/image) to the table view —
// a richer reveal than pushImageToTable, which only ever shows the raw picture.
export function pushItemToTable(campaignCode, item) {
  return dmUpdate(campaignCode, {
    'combat.display': {
      type: 'item',
      itemId: item.id,
      name: item.name,
      itemType: item.type,
      rarity: item.rarity ?? null,
      attunement: item.attunement ?? false,
      value: item.value ?? 0,
      weight: item.weight ?? 0,
      notes: item.notes ?? '',
      imageUrl: item.imageUrl ?? null,
    },
  })
}

export function clearTableDisplay(campaignCode) {
  return dmUpdate(campaignCode, { 'combat.display': { type: 'none', url: '', label: '' } })
}
