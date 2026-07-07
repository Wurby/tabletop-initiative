import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'
import { imagenModel, geminiModel } from './ai'
import { dmUpdate } from './campaign'

// Generates an AI image for a named campaign entity, saves it to the shared
// image library — in a folder named `imageFolderName` (created if missing,
// defaults to `name`) — and returns the public URL.
export async function generateEntityImage({
  campaignCode,
  campaign,
  name,
  descriptionText,
  entityType,
  imageFolderName,
}) {
  const promptResult = await geminiModel.generateContent(
    `Write a concise image generation prompt (under 80 words) for a fantasy RPG ${entityType} called "${name}".
Use this description as context: ${descriptionText || `a mysterious ${entityType}`}
Reply with only the image prompt — no explanation, no quotes.`
  )
  const imagePrompt = promptResult.response.text().trim()

  const result = await imagenModel.generateContent(imagePrompt)
  const parts = result.response.inlineDataParts()
  if (!parts?.[0]) throw new Error('No image returned — try again.')
  const { data, mimeType } = parts[0].inlineData

  const byteChars = atob(data)
  const bytes = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
  const blob = new Blob([bytes], { type: mimeType })
  const ext = mimeType.split('/')[1] || 'png'
  const filename = `${crypto.randomUUID()}.${ext}`
  const storagePath = `campaigns/${campaignCode}/images/${filename}`
  await uploadBytes(ref(storage, storagePath), blob)
  const url = await getDownloadURL(ref(storage, storagePath))

  const folders = campaign.folders ?? []
  const folderName = imageFolderName ?? name
  let folder = folders.find((f) => f.name === folderName)
  let nextFolders = folders
  if (!folder) {
    folder = { id: crypto.randomUUID(), name: folderName }
    nextFolders = [...folders, folder]
  }

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
