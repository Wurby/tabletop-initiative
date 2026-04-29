import { useState, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../../lib/firebase'
import { dmUpdate } from '../../lib/campaign'
import { Trash } from '../icons'

export default function ImageLibrary({ campaign, campaignCode }) {
  const images = campaign.images ?? []
  const display = campaign.combat?.display
  const active = display?.type === 'image'

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [labelInput, setLabelInput] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const fileRef = useRef(null)

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const filename = `${crypto.randomUUID()}-${file.name}`
    const storagePath = `campaigns/${campaignCode}/images/${filename}`
    const storageRef = ref(storage, storagePath)

    setUploading(true)
    setProgress(0)

    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => setUploading(false),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        const entry = {
          id: crypto.randomUUID(),
          url,
          storagePath,
          label: labelInput.trim() || file.name,
          uploadedAt: Date.now(),
        }
        await dmUpdate(campaignCode, {
          images: [...images, entry],
        })
        setUploading(false)
        setProgress(0)
        setLabelInput('')
        if (fileRef.current) fileRef.current.value = ''
      }
    )
  }

  async function handleSelect(image) {
    await dmUpdate(campaignCode, {
      'combat.display': { type: 'image', url: image.url, label: image.label },
    })
  }

  async function handleClear() {
    await dmUpdate(campaignCode, {
      'combat.display': { type: 'none', url: '', label: '' },
    })
  }

  async function handleDelete(image) {
    try {
      await deleteObject(ref(storage, image.storagePath))
    } catch {
      /* file may already be gone */
    }
    const nextImages = images.filter((i) => i.id !== image.id)
    const updates = { images: nextImages }
    if (display?.url === image.url) {
      updates['combat.display'] = { type: 'none', url: '', label: '' }
    }
    await dmUpdate(campaignCode, updates)
  }

  return (
    <section>
      <div className="bg-brand-forest px-6 py-2 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-normal text-white">Images</h2>
        {active && (
          <button
            onClick={handleClear}
            className="text-xs font-normal text-white opacity-50 hover:opacity-100 transition-opacity"
          >
            Clear
          </button>
        )}
      </div>

      <div className="px-6 flex flex-col gap-4">
        {/* Upload row */}
        <div className="flex items-center gap-2 border-b border-brand-ink/10 pb-3">
          <input
            className="flex-1 bg-transparent text-brand-ink text-sm font-normal focus:outline-none border-b border-transparent focus:border-brand-ink/20 placeholder-brand-ink/30 min-w-0"
            placeholder="Label…"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
          />
          <label
            className={`shrink-0 text-xs font-normal px-2 py-1 border cursor-pointer transition-colors ${uploading ? 'text-brand-ink/30 border-brand-ink/20 pointer-events-none' : 'text-brand-rivulet border-brand-rivulet/40 hover:border-brand-rivulet'}`}
          >
            {uploading ? `${progress}%` : 'Upload'}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Grid */}
        {images.length === 0 ? (
          <p className="text-brand-ink opacity-40 font-light text-sm py-4 text-center">
            No images yet…
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.map((image) => {
              const isActive = active && display?.url === image.url
              const confirming = confirmDeleteId === image.id
              return (
                <div
                  key={image.id}
                  className={`relative group bg-brand-mint overflow-hidden shadow-card ${isActive ? 'outline outline-4 outline-brand-forest outline-offset-0' : ''}`}
                >
                  <button onClick={() => handleSelect(image)} className="w-full block text-left">
                    <img src={image.url} alt={image.label} className="w-full h-24 object-cover" />
                    <div className="px-2 py-1 flex items-center gap-1">
                      {isActive && <span className="text-brand-forest text-xs shrink-0">▶</span>}
                      <span
                        className={`text-xs font-normal truncate ${isActive ? 'text-brand-forest' : 'text-brand-ink/60'}`}
                      >
                        {image.label}
                      </span>
                    </div>
                  </button>
                  {isActive && (
                    <div className="absolute bottom-[-5px] left-[-4px] right-[-4px] h-[2px] bg-brand-forest" />
                  )}

                  {/* Hover control — X when active, trash when not */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isActive ? (
                      <button
                        onClick={handleClear}
                        className="w-6 h-6 bg-brand-ink/50 text-white flex items-center justify-center text-xs"
                        title="Clear from display"
                      >
                        ✕
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(image.id)}
                        className="w-6 h-6 bg-brand-ink/50 text-white flex items-center justify-center"
                        title="Delete image"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>

                  {/* Delete confirmation overlay */}
                  {confirming && (
                    <div className="absolute inset-0 bg-brand-ink/80 flex flex-col items-center justify-center gap-2">
                      <span className="text-white text-xs font-normal">Delete?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleDelete(image)
                            setConfirmDeleteId(null)
                          }}
                          className="px-2 py-0.5 text-xs font-normal text-white bg-brand-danger hover:bg-brand-danger-dark transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 text-xs font-normal text-white/70 hover:text-white transition-colors"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
