import ReactMarkdown from 'react-markdown'
import { ITEM_TYPE_LABELS, RARITY_LABELS } from './itemConstants'

export default function ItemViewModal({ item, party, onEdit, onClose }) {
  const owners = (item.ownerIds ?? [])
    .map((id) => party.find((m) => m.id === id))
    .filter(Boolean)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/50">
      <div className="bg-white shadow-modal w-[560px] max-w-[95vw] max-h-[85vh] flex flex-col">
        <div className="bg-brand-forest px-5 py-3 flex items-center justify-between shrink-0 gap-4">
          <h2 className="text-white font-normal text-base truncate flex-1">{item.name}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="text-xs font-normal text-white/70 hover:text-white border border-white/30 hover:border-white/60 px-3 py-1 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-24 h-24 object-cover border border-brand-ink/10 shrink-0"
              />
            )}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <p className="text-brand-ink/60 text-xs font-normal">
                {ITEM_TYPE_LABELS[item.type] ?? 'Misc'}
                {item.rarity && ` · ${RARITY_LABELS[item.rarity] ?? item.rarity}`}
                {item.attunement && ' · Requires Attunement'}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-brand-forest font-normal">
                  Qty <span className="text-brand-ink">{item.quantity ?? 0}</span>
                </span>
                <span className="text-brand-forest font-normal">
                  Value <span className="text-brand-ink">{item.value ?? 0}gp</span>
                </span>
                <span className="text-brand-forest font-normal">
                  Weight <span className="text-brand-ink">{item.weight ?? 0}lb</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {owners.length > 0 ? (
                  owners.map((o) => (
                    <span
                      key={o.id}
                      className="bg-brand-mint text-brand-ink/70 text-[10px] font-normal px-1.5 py-0.5"
                    >
                      {o.name}
                    </span>
                  ))
                ) : (
                  <span className="text-brand-ink/30 text-[10px] font-normal">Unattached</span>
                )}
              </div>
            </div>
          </div>

          <div className="note-prose text-brand-ink text-sm font-normal border-t border-brand-ink/10 pt-4">
            {item.notes ? (
              <ReactMarkdown>{item.notes}</ReactMarkdown>
            ) : (
              <p className="text-brand-ink/30 italic">No notes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
