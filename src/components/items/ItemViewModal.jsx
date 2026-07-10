import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useToast } from '../../lib/toast'
import { ITEM_TYPE_LABELS, RARITY_LABELS } from './itemConstants'
import { Sparkles } from '../icons'
import { generateEntityImage } from '../../lib/imageGen'
import ImagePreviewModal from '../images/ImagePreviewModal'
import ImagePickerModal from '../images/ImagePickerModal'
import { dmUpdate, pushItemToTable, clearTableDisplay } from '../../lib/campaign'

const PILL = 'inline-block px-2 py-1 text-xs font-normal border bg-brand-forest text-white border-brand-forest'
const PILL_NEUTRAL = 'inline-block px-2 py-1 text-xs font-normal border border-brand-ink/20 text-brand-ink'
const PILL_OWNER = 'inline-block px-2 py-0.5 text-xs font-normal border bg-brand-rivulet text-white border-brand-rivulet'

export default function ItemViewModal({ item, folders, party, campaign, campaignCode, onEdit, onClose }) {
  const showError = useToast()
  const [showPreview, setShowPreview] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState(null)
  const folderName = item.folderId ? folders.find((f) => f.id === item.folderId)?.name : null
  const owners = (item.ownerIds ?? [])
    .map((id) => party.find((m) => m.id === id))
    .filter(Boolean)
  const display = campaign.combat?.display
  const isLive = display?.type === 'item' && display?.itemId === item.id

  async function persistImageUrl(url) {
    const items = campaign.items ?? []
    const next = items.map((i) => (i.id === item.id ? { ...i, imageUrl: url } : i))
    try {
      await dmUpdate(campaignCode, { items: next })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleGenerateImage() {
    setGeneratingImage(true)
    setImageError(null)
    try {
      const imageFolderName = folders.find((f) => f.id === item.folderId)?.name ?? 'Items'
      const url = await generateEntityImage({
        campaignCode,
        campaign,
        name: item.name,
        descriptionText: item.notes,
        entityType: 'item',
        imageFolderName,
      })
      await persistImageUrl(url)
    } catch (err) {
      setImageError(err.message || 'Image generation failed.')
    } finally {
      setGeneratingImage(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/40" onClick={onClose}>
      <div
        className="bg-brand-mint-dark shadow-modal flex max-h-[85vh] w-[760px] max-w-[95vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left pane — core stats */}
        <div className="flex flex-col w-72 shrink-0 border-r border-brand-mint">
          <div className="bg-brand-forest px-4 py-3 shrink-0">
            <h2 className="text-white font-normal text-base">View Item</h2>
          </div>
          <div className="px-4 py-2 border-b border-brand-mint shrink-0 flex items-center gap-2">
            <button
              onClick={() => pushItemToTable(campaignCode, item)}
              disabled={isLive}
              className="flex-1 text-xs font-normal text-white bg-brand-rivulet hover:bg-brand-rivulet-dark px-2 py-1.5 transition-colors disabled:opacity-60 disabled:hover:bg-brand-rivulet"
            >
              {isLive ? 'Shown on table ✓' : 'Show to Table'}
            </button>
            {isLive && (
              <button
                onClick={() => clearTableDisplay(campaignCode)}
                className="text-xs font-normal text-brand-ink/50 hover:text-brand-ink transition-colors shrink-0"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto">
            <p className="text-brand-ink text-sm font-normal">{item.name}</p>
            <div className="flex flex-col gap-1">
              <span className="text-brand-forest text-xs">Type</span>
              <span className={PILL}>{ITEM_TYPE_LABELS[item.type] ?? 'Misc'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-brand-forest text-xs">Rarity</span>
              <span className={PILL}>{item.rarity ? (RARITY_LABELS[item.rarity] ?? item.rarity) : 'Mundane'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-forest text-xs w-14 shrink-0">Qty</span>
              <span className="w-16 bg-white border border-brand-mint-dark px-1 py-0.5 text-brand-ink text-sm font-normal text-center">
                {item.quantity ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-forest text-xs w-14 shrink-0">Value gp</span>
              <span className="w-16 bg-white border border-brand-mint-dark px-1 py-0.5 text-brand-ink text-sm font-normal text-center">
                {item.value ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-forest text-xs w-14 shrink-0">Weight lb</span>
              <span className="w-16 bg-white border border-brand-mint-dark px-1 py-0.5 text-brand-ink text-sm font-normal text-center">
                {item.weight ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-forest text-xs">Attunement</span>
              <span className={item.attunement ? PILL : PILL_NEUTRAL}>{item.attunement ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div className="flex border-t border-brand-mint shrink-0">
            <button
              onClick={onEdit}
              className="flex-1 py-2 text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 text-xs font-normal text-brand-ink hover:bg-brand-mint transition-colors border-l border-brand-mint"
            >
              Close
            </button>
          </div>
        </div>

        {/* Right pane — folder, owners, image, notes */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-4 flex flex-col gap-4">
            {folders.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-brand-forest text-xs">Folder</span>
                <span className={PILL_NEUTRAL}>{folderName ?? 'None'}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-brand-forest text-xs">Owners</span>
              <div className="flex flex-wrap gap-1">
                {owners.length > 0 ? (
                  owners.map((o) => (
                    <span key={o.id} className={PILL_OWNER}>
                      {o.name}
                    </span>
                  ))
                ) : (
                  <p className="text-brand-ink/40 text-xs font-light">Unattached</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-brand-forest text-xs">Image</span>
              <div className="flex items-start gap-3">
                {item.imageUrl ? (
                  <button onClick={() => setShowPreview(true)} className="shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
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
                    {generatingImage ? 'Generating…' : item.imageUrl ? 'Regenerate' : 'Generate'}
                  </button>
                  <button
                    onClick={() => setShowPicker(true)}
                    className="text-xs font-normal text-brand-ink/60 hover:text-brand-ink border border-brand-ink/20 hover:border-brand-ink/40 px-2 py-1 transition-colors"
                  >
                    Choose existing
                  </button>
                  {item.imageUrl && (
                    <button
                      onClick={() => persistImageUrl(null)}
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
                onSelect={(url) => { persistImageUrl(url); setShowPicker(false) }}
                onClose={() => setShowPicker(false)}
              />
            )}
            {showPreview && item.imageUrl && (
              <ImagePreviewModal
                url={item.imageUrl}
                label={item.name}
                campaign={campaign}
                campaignCode={campaignCode}
                onClose={() => setShowPreview(false)}
              />
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-brand-forest text-xs">Notes</span>
              <div className="note-prose bg-white border border-brand-mint-dark px-2 py-1.5 text-brand-ink text-xs font-normal w-full min-h-36">
                {item.notes ? (
                  <ReactMarkdown>{item.notes}</ReactMarkdown>
                ) : (
                  <p className="text-brand-ink/30 italic">No notes</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
