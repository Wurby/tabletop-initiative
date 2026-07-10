import ReactMarkdown from 'react-markdown'
import { ITEM_TYPE_LABELS, RARITY_LABELS } from './itemConstants'

export default function ItemDisplayModal({ campaign }) {
  const display = campaign.combat?.display
  if (display?.type !== 'item') return null

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
      <div className="bg-brand-mint-dark shadow-modal w-full max-w-md flex flex-col max-h-[90vh]">
        {display.imageUrl && (
          <img
            src={display.imageUrl}
            alt={display.name}
            className="w-full h-64 object-cover shrink-0"
          />
        )}
        <div className="bg-brand-forest px-5 py-3 shrink-0">
          <h2 className="text-white font-normal text-xl">{display.name}</h2>
          <p className="text-white/70 text-xs font-normal mt-0.5">
            {ITEM_TYPE_LABELS[display.itemType] ?? 'Misc'}
            {display.rarity && ` · ${RARITY_LABELS[display.rarity] ?? display.rarity}`}
            {display.attunement && ' · Requires Attunement'}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-brand-forest font-normal">
              Value <span className="text-brand-ink">{display.value ?? 0}gp</span>
            </span>
            <span className="text-brand-forest font-normal">
              Weight <span className="text-brand-ink">{display.weight ?? 0}lb</span>
            </span>
          </div>
          {display.notes && (
            <div className="note-prose text-brand-ink text-sm font-normal">
              <ReactMarkdown>{display.notes}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
