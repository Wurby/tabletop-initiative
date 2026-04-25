export default function SplitModal({ split, onClose, canDismiss = false }) {
  const graveyard = split.graveyardEntries ?? []
  const questXp   = split.questXpEntries   ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40">
      <div className="bg-brand-mint-dark shadow-modal w-80 flex flex-col max-h-[85vh]">
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base">Session Summary</h2>
          {canDismiss && (
            <button onClick={onClose} className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm">✕</button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {graveyard.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-1.5 border-b border-brand-mint">
              <span className="text-brand-ink text-sm font-normal truncate flex-1">{e.name}</span>
              <span className="text-brand-ink/50 text-xs shrink-0 ml-2">{(e.xp || 0).toLocaleString()} XP</span>
            </div>
          ))}
          {questXp.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-1.5 border-b border-brand-mint">
              <span className="text-brand-rivulet text-sm font-normal truncate flex-1">{e.label}</span>
              <span className="text-brand-ink/50 text-xs shrink-0 ml-2">{(e.xp || 0).toLocaleString()} XP</span>
            </div>
          ))}
        </div>

        <div className="px-4 py-4 flex flex-col gap-3 border-t border-brand-mint shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-brand-ink/60 text-xs font-normal">Total XP</span>
            <span className="text-brand-ink text-sm font-normal">{split.totalXp.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between border-t border-brand-mint pt-3">
            <span className="text-brand-ink/60 text-xs font-normal">Per player</span>
            <span className="text-brand-ink text-lg font-light">{split.xpPerMember.toLocaleString()} XP</span>
          </div>
        </div>

        {canDismiss && (
          <div className="border-t border-brand-mint shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-normal text-brand-ink hover:bg-brand-mint transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
