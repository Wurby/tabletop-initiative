import ReactMarkdown from 'react-markdown'
import { ITEM_TYPE_LABELS, RARITY_LABELS } from './itemConstants'

function ItemDisplayBody({ display }) {
  return (
    <>
      <div className="flex items-center gap-4 text-sm shrink-0">
        <span className="text-brand-forest font-normal">
          Value <span className="text-brand-ink">{display.value ?? 0}gp</span>
        </span>
        <span className="text-brand-forest font-normal">
          Weight <span className="text-brand-ink">{display.weight ?? 0}lb</span>
        </span>
      </div>
      {display.notes ? (
        <div className="note-prose text-brand-ink text-sm font-normal">
          <ReactMarkdown>{display.notes}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-brand-ink/30 italic text-sm">No description</p>
      )}
    </>
  )
}

export default function ItemDisplayModal({ campaign }) {
  const display = campaign.combat?.display
  if (display?.type !== 'item') return null

  const subtitle = [
    ITEM_TYPE_LABELS[display.itemType] ?? 'Misc',
    display.rarity ? (RARITY_LABELS[display.rarity] ?? display.rarity) : null,
    display.attunement ? 'Requires Attunement' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
      <div className="bg-brand-mint-dark shadow-modal w-full max-w-2xl max-h-[90vh] flex overflow-hidden">
        {display.imageUrl ? (
          <>
            <div className="relative w-72 shrink-0 self-stretch">
              <img
                src={display.imageUrl}
                alt={display.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-0 left-0 right-0 bg-brand-ink/60 px-4 py-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h2 className="text-white font-normal text-lg">{display.name}</h2>
                  {subtitle && <span className="text-white/70 text-xs font-normal">{subtitle}</span>}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              <ItemDisplayBody display={display} />
            </div>
          </>
        ) : (
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="bg-brand-forest px-5 py-3 shrink-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-white font-normal text-lg">{display.name}</h2>
                {subtitle && <span className="text-white/70 text-xs font-normal">{subtitle}</span>}
              </div>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
              <ItemDisplayBody display={display} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
