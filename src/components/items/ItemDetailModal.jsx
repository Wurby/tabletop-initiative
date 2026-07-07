import { useState } from 'react'
import { generateEntityImage } from '../../lib/imageGen'
import { Sparkles } from '../icons'
import { ITEM_TYPES, ITEM_TYPE_LABELS, RARITIES, RARITY_LABELS } from './itemConstants'
import ImagePreviewModal from '../images/ImagePreviewModal'
import ImagePickerModal from '../images/ImagePickerModal'

export default function ItemDetailModal({
  item,
  defaultFolderId,
  folders,
  party,
  campaign,
  campaignCode,
  onSave,
  onClose,
}) {
  const [editName, setEditName] = useState(item?.name ?? '')
  const [editType, setEditType] = useState(item?.type ?? 'misc')
  const [editRarity, setEditRarity] = useState(item?.rarity ?? null)
  const [editQuantity, setEditQuantity] = useState(item?.quantity ?? 1)
  const [editValue, setEditValue] = useState(item?.value ?? 0)
  const [editWeight, setEditWeight] = useState(item?.weight ?? 0)
  const [editAttunement, setEditAttunement] = useState(item?.attunement ?? false)
  const [editFolderId, setEditFolderId] = useState(item?.folderId ?? defaultFolderId ?? null)
  const [editOwnerIds, setEditOwnerIds] = useState(item?.ownerIds ?? [])
  const [editImageUrl, setEditImageUrl] = useState(item?.imageUrl ?? null)
  const [editNotes, setEditNotes] = useState(item?.notes ?? '')

  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const ownerCap = Math.max(0, Number(editQuantity) || 0)

  function toggleOwner(id) {
    setEditOwnerIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= ownerCap) return prev
      return [...prev, id]
    })
  }

  async function handleGenerateImage() {
    setGeneratingImage(true)
    setImageError(null)
    try {
      const imageFolderName = folders.find((f) => f.id === editFolderId)?.name ?? 'Items'
      const url = await generateEntityImage({
        campaignCode,
        campaign,
        name: editName.trim() || 'item',
        descriptionText: editNotes,
        entityType: 'item',
        imageFolderName,
      })
      setEditImageUrl(url)
    } catch (err) {
      setImageError(err.message || 'Image generation failed.')
    } finally {
      setGeneratingImage(false)
    }
  }

  function handleSave() {
    if (!editName.trim()) return
    onSave({
      name: editName.trim(),
      type: editType,
      rarity: editRarity,
      quantity: Number(editQuantity) || 0,
      value: Number(editValue) || 0,
      weight: Number(editWeight) || 0,
      attunement: editAttunement,
      folderId: editFolderId,
      ownerIds: editOwnerIds.slice(0, ownerCap),
      imageUrl: editImageUrl,
      notes: editNotes,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/40">
      <div className="bg-brand-mint-dark shadow-modal flex max-h-[85vh] w-[760px] max-w-[95vw]">
        {/* Left pane — core stats */}
        <div className="flex flex-col w-72 shrink-0 border-r border-brand-mint">
          <div className="bg-brand-forest px-4 py-3 shrink-0">
            <h2 className="text-white font-normal text-base">{item ? 'Edit Item' : 'New Item'}</h2>
          </div>
          <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto">
            <input
              autoFocus
              className="bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet w-full"
              placeholder="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <span className="text-brand-forest text-xs">Type</span>
              <div className="flex gap-1 flex-wrap">
                {ITEM_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setEditType(t)}
                    className={`px-2 py-1 text-xs font-normal border transition-colors ${
                      editType === t
                        ? 'bg-brand-forest text-white border-brand-forest'
                        : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                    }`}
                  >
                    {ITEM_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-brand-forest text-xs">Rarity</span>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setEditRarity(null)}
                  className={`px-2 py-1 text-xs font-normal border transition-colors ${
                    editRarity === null
                      ? 'bg-brand-forest text-white border-brand-forest'
                      : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                  }`}
                >
                  Mundane
                </button>
                {RARITIES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setEditRarity(r)}
                    className={`px-2 py-1 text-xs font-normal border transition-colors ${
                      editRarity === r
                        ? 'bg-brand-forest text-white border-brand-forest'
                        : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                    }`}
                  >
                    {RARITY_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-forest text-xs w-14 shrink-0">Qty</span>
              <input
                type="number"
                min="0"
                className="w-16 bg-white border border-brand-mint-dark px-1 py-0.5 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-1 focus:ring-brand-rivulet"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-forest text-xs w-14 shrink-0">Value gp</span>
              <input
                type="number"
                min="0"
                className="w-16 bg-white border border-brand-mint-dark px-1 py-0.5 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-1 focus:ring-brand-rivulet"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-forest text-xs w-14 shrink-0">Weight lb</span>
              <input
                type="number"
                min="0"
                className="w-16 bg-white border border-brand-mint-dark px-1 py-0.5 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-1 focus:ring-brand-rivulet"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-forest text-xs">Attunement</span>
              <button
                onClick={() => setEditAttunement((v) => !v)}
                className={`px-2 py-1 text-xs font-normal border transition-colors ${
                  editAttunement
                    ? 'bg-brand-forest text-white border-brand-forest'
                    : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                }`}
              >
                {editAttunement ? 'Yes' : 'No'}
              </button>
            </div>
          </div>
          <div className="flex border-t border-brand-mint shrink-0">
            <button
              onClick={handleSave}
              className="flex-1 py-2 text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark transition-colors"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 text-xs font-normal text-brand-ink hover:bg-brand-mint transition-colors border-l border-brand-mint"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Right pane — folder, owners, image, notes */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-4 flex flex-col gap-4">
            {folders.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-brand-forest text-xs">Folder</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setEditFolderId(null)}
                    className={`px-2 py-0.5 text-xs font-normal border transition-colors ${
                      editFolderId === null
                        ? 'bg-brand-forest text-white border-brand-forest'
                        : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                    }`}
                  >
                    None
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setEditFolderId(f.id)}
                      className={`px-2 py-0.5 text-xs font-normal border transition-colors ${
                        editFolderId === f.id
                          ? 'bg-brand-forest text-white border-brand-forest'
                          : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-brand-forest text-xs">
                Owners {ownerCap > 0 && `(up to ${ownerCap})`}
              </span>
              {party.length === 0 && (
                <p className="text-brand-ink/40 text-xs font-light">No party members yet</p>
              )}
              <div className="flex flex-wrap gap-1">
                {party.map((m) => {
                  const selected = editOwnerIds.includes(m.id)
                  const disabled = !selected && editOwnerIds.length >= ownerCap
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleOwner(m.id)}
                      disabled={disabled}
                      className={`px-2 py-0.5 text-xs font-normal border transition-colors ${
                        selected
                          ? 'bg-brand-rivulet text-white border-brand-rivulet'
                          : disabled
                            ? 'border-brand-ink/10 text-brand-ink/25 cursor-not-allowed'
                            : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                      }`}
                    >
                      {m.name}
                    </button>
                  )
                })}
              </div>
              {editOwnerIds.length === 0 && (
                <p className="text-brand-ink/40 text-xs font-light">Unattached</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-brand-forest text-xs">Image</span>
              <div className="flex items-start gap-3">
                {editImageUrl ? (
                  <button onClick={() => setShowPreview(true)} className="shrink-0">
                    <img
                      src={editImageUrl}
                      alt={editName}
                      className="w-32 h-32 object-cover border border-brand-ink/10"
                    />
                  </button>
                ) : (
                  <div className="w-32 h-32 shrink-0 bg-brand-mint flex items-center justify-center">
                    <Sparkles size={28} className="text-brand-ink/15" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={handleGenerateImage}
                    disabled={generatingImage}
                    className="text-xs font-normal text-brand-ink/60 hover:text-brand-ink border border-brand-ink/20 hover:border-brand-ink/40 px-2 py-1 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <Sparkles size={11} />
                    {generatingImage ? 'Generating…' : editImageUrl ? 'Regenerate' : 'Generate'}
                  </button>
                  <button
                    onClick={() => setShowPicker(true)}
                    className="text-xs font-normal text-brand-ink/60 hover:text-brand-ink border border-brand-ink/20 hover:border-brand-ink/40 px-2 py-1 transition-colors"
                  >
                    Choose existing
                  </button>
                  {editImageUrl && (
                    <button
                      onClick={() => setEditImageUrl(null)}
                      className="text-xs font-normal text-brand-ink/40 hover:text-brand-danger transition-colors text-left"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {imageError && <p className="text-brand-danger text-xs">{imageError}</p>}
            </div>
            {showPicker && (
              <ImagePickerModal
                campaign={campaign}
                onSelect={(url) => { setEditImageUrl(url); setShowPicker(false) }}
                onClose={() => setShowPicker(false)}
              />
            )}
            {showPreview && editImageUrl && (
              <ImagePreviewModal
                url={editImageUrl}
                label={editName}
                campaign={campaign}
                campaignCode={campaignCode}
                onClose={() => setShowPreview(false)}
              />
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-brand-forest text-xs">Notes</span>
              <textarea
                rows={6}
                className="bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-rivulet w-full resize-none font-mono"
                placeholder="Description, magic properties, DM reminders… (Markdown supported)"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
