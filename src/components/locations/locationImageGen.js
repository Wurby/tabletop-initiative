import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../lib/firebase'
import { imagenModel, geminiModel } from '../../lib/ai'
import { dmUpdate } from '../../lib/campaign'

// Generates an image for a cluster or POI, saves it to the image library,
// and returns the public URL.
export async function generateLocationImage({ campaignCode, campaign, name, descriptionText, type }) {
  // Build a vivid image prompt from the location's own content
  const promptResult = await geminiModel.generateContent(
    `Write a concise image generation prompt (under 80 words) for a fantasy RPG ${type} called "${name}".
Use this description as context: ${descriptionText || 'a mysterious location'}
Reply with only the image prompt — no explanation, no quotes.`
  )
  const imagePrompt = promptResult.response.text().trim()

  // Generate image
  const result = await imagenModel.generateContent(imagePrompt)
  const parts = result.response.inlineDataParts()
  if (!parts?.[0]) throw new Error('No image returned — try again.')
  const { data, mimeType } = parts[0].inlineData

  // Upload to Firebase Storage
  const byteChars = atob(data)
  const bytes = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
  const blob = new Blob([bytes], { type: mimeType })
  const ext = mimeType.split('/')[1] || 'png'
  const filename = `${crypto.randomUUID()}.${ext}`
  const storagePath = `campaigns/${campaignCode}/images/${filename}`
  await uploadBytes(ref(storage, storagePath), blob)
  const url = await getDownloadURL(ref(storage, storagePath))

  // Find or create a "Locations" folder in the image library
  const folders = campaign.folders ?? []
  const folderName = 'Locations'
  let folder = folders.find(f => f.name === folderName)
  let nextFolders = folders
  if (!folder) {
    folder = { id: crypto.randomUUID(), name: folderName }
    nextFolders = [...folders, folder]
  }

  // Save image entry to library
  const images = campaign.images ?? []
  const entry = {
    id: crypto.randomUUID(),
    url,
    storagePath,
    label: name,
    folderId: folder.id,
    uploadedAt: Date.now(),
  }
  await dmUpdate(campaignCode, { images: [...images, entry], folders: nextFolders })

  return url
}
