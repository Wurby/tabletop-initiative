import { useState, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../../lib/firebase'
import { dmUpdate } from '../../lib/campaign'
import { Trash, Pen, Sparkles } from '../icons'
import ImageGenModal from './ImageGenModal'
import LaserPointerModal from './LaserPointerModal'

export default function ImageLibrary({ campaign, campaignCode }) {
  const images = campaign.images ?? []
  const folders = campaign.folders ?? []
  const display = campaign.combat?.display
  const active = display?.type === 'image'

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [labelInput, setLabelInput] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState(null)
  const [showGenModal, setShowGenModal] = useState(false)
  const [showPointerModal, setShowPointerModal] = useState(false)
  const [activeFolderId, setActiveFolderId] = useState(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [assigningImageId, setAssigningImageId] = useState(null)
  const fileRef = useRef(null)

  const displayedImages =
    activeFolderId === null ? images : images.filter((img) => img.folderId === activeFolderId)

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
          folderId: activeFolderId ?? null,
          uploadedAt: Date.now(),
        }
        await dmUpdate(campaignCode, { images: [...images, entry] })
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
    await dmUpdate(campaignCode, { 'combat.display': { type: 'none', url: '', label: '' } })
  }

  async function handleDelete(image) {
    try { await deleteObject(ref(storage, image.storagePath)) } catch { /* already gone */ }
    const nextImages = images.filter((i) => i.id !== image.id)
    const updates = { images: nextImages }
    if (display?.url === image.url) updates['combat.display'] = { type: 'none', url: '', label: '' }
    await dmUpdate(campaignCode, updates)
  }

  async function createFolder() {
    const name = newFolderName.trim()
    if (!name) return
    const folder = { id: crypto.randomUUID(), name }
    await dmUpdate(campaignCode, { folders: [...folders, folder] })
    setNewFolderName('')
    setShowNewFolder(false)
    setActiveFolderId(folder.id)
  }

  async function deleteFolder(folderId) {
    const nextFolders = folders.filter((f) => f.id !== folderId)
    const nextImages = images.map((img) =>
      img.folderId === folderId ? { ...img, folderId: null } : img
    )
    await dmUpdate(campaignCode, { folders: nextFolders, images: nextImages })
    if (activeFolderId === folderId) setActiveFolderId(null)
  }

  async function assignFolder(image, folderId) {
    const nextImages = images.map((img) =>
      img.id === image.id ? { ...img, folderId: folderId ?? null } : img
    )
    await dmUpdate(campaignCode, { images: nextImages })
    setAssigningImageId(null)
  }

  return (
    <section>
      {showGenModal && (
        <ImageGenModal
          campaign={campaign}
          campaignCode={campaignCode}
          onClose={() => setShowGenModal(false)}
        />
      )}
      {showPointerModal && (
        <LaserPointerModal
          campaign={campaign}
          campaignCode={campaignCode}
          onClose={() => setShowPointerModal(false)}
        />
      )}

      <div className="bg-brand-forest px-6 py-2 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-normal text-white">Images</h2>
        <div className="flex items-center gap-3">
          {active && (
            <button
              onClick={handleClear}
              className="text-xs font-normal text-white opacity-50 hover:opacity-100 transition-opacity"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="px-6 flex flex-col gap-4">
        {/* Folder tabs */}
        <div className="flex gap-1.5 flex-wrap items-center">
          {folders.length > 0 && (
            <button
              onClick={() => setActiveFolderId(null)}
              className={`shrink-0 px-3 py-1 text-xs font-normal border transition-colors ${activeFolderId === null ? 'bg-brand-forest text-white border-brand-forest' : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'}`}
            >
              All
            </button>
          )}
          {folders.map((f) => (
            <div key={f.id} className="relative shrink-0 group/tab">
              <button
                onClick={() => { setActiveFolderId(f.id); setConfirmDeleteFolderId(null) }}
                className={`pl-3 pr-6 py-1 text-xs font-normal border transition-colors ${activeFolderId === f.id ? 'bg-brand-forest text-white border-brand-forest' : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'}`}
              >
                {f.name}
              </button>
              {confirmDeleteFolderId === f.id ? (
                <>
                  <div className="fixed inset-0 z-[5]" onClick={() => setConfirmDeleteFolderId(null)} />
                  <div className="absolute top-0 right-0 flex items-center gap-0.5 bg-white border border-brand-ink/20 px-1 py-0.5 z-10 shadow-sm">
                    <span className="text-[9px] text-brand-ink/60 mr-0.5">Delete?</span>
                    <button onClick={() => deleteFolder(f.id)} className="text-[9px] text-brand-danger hover:text-brand-danger/70 font-normal transition-colors">Yes</button>
                    <span className="text-[9px] text-brand-ink/30">/</span>
                    <button onClick={() => setConfirmDeleteFolderId(null)} className="text-[9px] text-brand-ink/40 hover:text-brand-ink/60 transition-colors">No</button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDeleteFolderId(f.id)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 text-white/80 text-[9px] opacity-0 group-hover/tab:opacity-100 transition-opacity flex items-center justify-center leading-none bg-brand-danger/70 hover:bg-brand-danger"
                  title="Delete folder"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {showNewFolder ? (
            <div className="flex items-center gap-1 shrink-0">
              <input
                autoFocus
                className="w-24 bg-white border border-brand-ink/20 px-2 py-0.5 text-xs text-brand-ink focus:outline-none"
                placeholder="Name…"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createFolder()
                  if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName('') }
                }}
              />
              <button onClick={createFolder} className="text-xs text-brand-rivulet hover:text-brand-rivulet/70 transition-colors">Add</button>
              <button onClick={() => { setShowNewFolder(false); setNewFolderName('') }} className="text-xs text-brand-ink/40 hover:text-brand-ink/60 transition-colors">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="shrink-0 px-2 py-1 text-xs font-normal text-brand-ink/30 hover:text-brand-ink/60 border border-dashed border-brand-ink/15 hover:border-brand-ink/30 transition-colors"
            >
              + Folder
            </button>
          )}
        </div>

        {/* Upload row */}
        <div className="flex items-center gap-2 border-b border-brand-ink/10 pb-3">
          <input
            className="flex-1 bg-transparent text-brand-ink text-sm font-normal focus:outline-none border-b border-transparent focus:border-brand-ink/20 placeholder-brand-ink/30 min-w-0"
            placeholder="Label…"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
          />
          <button
            onClick={() => setShowGenModal(true)}
            className="shrink-0 text-xs font-normal px-2 py-1 border text-brand-rivulet border-brand-rivulet/40 hover:border-brand-rivulet transition-colors"
            title="Generate image with AI"
          >
            <Sparkles size={16} />
          </button>
          <label className={`shrink-0 text-xs font-normal px-2 py-1 border cursor-pointer transition-colors ${uploading ? 'text-brand-ink/30 border-brand-ink/20 pointer-events-none' : 'text-brand-rivulet border-brand-rivulet/40 hover:border-brand-rivulet'}`}>
            {uploading ? `${progress}%` : 'Upload'}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {/* Grid */}
        {displayedImages.length === 0 ? (
          <p className="text-brand-ink opacity-40 font-light text-sm py-4 text-center">
            {images.length === 0 ? 'No images yet…' : 'No images in this folder…'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {displayedImages.map((image) => {
              const isActive = active && display?.url === image.url
              const confirming = confirmDeleteId === image.id
              return (
                <div
                  key={image.id}
                  className={`relative group bg-brand-mint overflow-hidden shadow-card ${isActive ? 'outline outline-4 outline-brand-forest outline-offset-0' : ''}`}
                >
                  <button onClick={() => handleSelect(image)} className="w-full block text-left">
                    <img src={image.url} alt={image.label} className="w-full h-24 object-cover" />
                  </button>

                  <div className="px-2 py-1 flex items-center gap-1">
                    <button onClick={() => handleSelect(image)} className="flex items-center gap-1 flex-1 min-w-0 text-left">
                      {isActive && <span className="text-brand-forest text-xs shrink-0">▶</span>}
                      <span className={`text-xs font-normal truncate ${isActive ? 'text-brand-forest' : 'text-brand-ink/60'}`}>
                        {image.label}
                      </span>
                    </button>
                    {folders.length > 0 && (
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setAssigningImageId(assigningImageId === image.id ? null : image.id)
                            setConfirmDeleteId(null)
                          }}
                          className={`text-[9px] leading-none px-1 py-0.5 border transition-colors max-w-[52px] truncate block ${image.folderId ? 'text-brand-rivulet border-brand-rivulet/30 bg-brand-rivulet/10' : 'text-brand-ink/25 border-brand-ink/15 hover:border-brand-ink/30 hover:text-brand-ink/40'}`}
                          title="Assign to folder"
                        >
                          {image.folderId
                            ? (folders.find((f) => f.id === image.folderId)?.name ?? '?')
                            : '⊕'}
                        </button>
                        {assigningImageId === image.id && (
                          <div className="absolute bottom-full right-0 mb-0.5 bg-brand-mint-dark border border-brand-ink/10 shadow-modal py-1 z-20 w-32">
                            <button
                              onClick={() => assignFolder(image, null)}
                              className={`w-full px-3 py-1 text-xs text-left hover:bg-brand-mint transition-colors ${!image.folderId ? 'text-brand-forest' : 'text-brand-ink/60'}`}
                            >
                              No folder
                            </button>
                            {folders.map((f) => (
                              <button key={f.id} onClick={() => assignFolder(image, f.id)}
                                className={`w-full px-3 py-1 text-xs text-left hover:bg-brand-mint transition-colors ${image.folderId === f.id ? 'text-brand-forest' : 'text-brand-ink'}`}>
                                {f.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <div className="absolute bottom-[-5px] left-[-4px] right-[-4px] h-[2px] bg-brand-forest" />
                  )}

                  <div className={`absolute top-1 right-1 flex gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isActive ? (
                      <>
                        <button
                          onClick={() => setShowPointerModal(true)}
                          className="w-6 h-6 bg-brand-ink/50 text-white flex items-center justify-center"
                          title="Laser pointer"
                        >
                          <Pen size={12} />
                        </button>
                        <button
                          onClick={handleClear}
                          className="w-6 h-6 bg-brand-ink/50 text-white flex items-center justify-center text-xs"
                          title="Clear from display"
                        >✕</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(image.id)}
                        className="w-6 h-6 bg-brand-ink/50 text-white flex items-center justify-center"
                        title="Delete image">
                        <Trash size={12} />
                      </button>
                    )}
                  </div>

                  {confirming && (
                    <div className="absolute inset-0 bg-brand-ink/80 flex flex-col items-center justify-center gap-2">
                      <span className="text-white text-xs font-normal">Delete?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { handleDelete(image); setConfirmDeleteId(null) }}
                          className="px-2 py-0.5 text-xs font-normal text-white bg-brand-danger hover:bg-brand-danger-dark transition-colors">Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 text-xs font-normal text-white/70 hover:text-white transition-colors">No</button>
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
