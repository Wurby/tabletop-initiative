import { useState } from 'react'

export default function ImagePickerModal({ campaign, onSelect, onClose }) {
  const images = campaign.images ?? []
  const folders = campaign.folders ?? []
  const [activeFolderId, setActiveFolderId] = useState(null)

  const displayed =
    activeFolderId === null ? images : images.filter((img) => img.folderId === activeFolderId)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-ink/50" onClick={onClose}>
      <div
        className="bg-white shadow-modal w-[540px] max-w-[95vw] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base">Choose Image</h2>
          <button
            onClick={onClose}
            className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>

        {folders.length > 0 && (
          <div className="px-4 pt-3 pb-2 flex gap-1.5 flex-wrap items-center shrink-0 border-b border-brand-mint">
            <button
              onClick={() => setActiveFolderId(null)}
              className={`shrink-0 px-3 py-1 text-xs font-normal border transition-colors ${
                activeFolderId === null
                  ? 'bg-brand-forest text-white border-brand-forest'
                  : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
              }`}
            >
              All
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFolderId(f.id)}
                className={`shrink-0 px-3 py-1 text-xs font-normal border transition-colors ${
                  activeFolderId === f.id
                    ? 'bg-brand-forest text-white border-brand-forest'
                    : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {displayed.length === 0 ? (
            <p className="text-brand-ink/40 text-sm font-light py-8 text-center">
              {images.length === 0 ? 'No images yet' : 'No images in this folder'}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {displayed.map((img) => (
                <button
                  key={img.id}
                  onClick={() => onSelect(img.url)}
                  className="bg-brand-mint overflow-hidden shadow-card hover:outline hover:outline-2 hover:outline-brand-rivulet transition-all text-left"
                >
                  <img src={img.url} alt={img.label} className="w-full h-20 object-cover" />
                  <p className="text-[10px] text-brand-ink/60 px-1.5 py-1 truncate">{img.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
