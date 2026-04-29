export default function GraveyardView({ campaign }) {
  const graveyard = campaign.graveyard ?? []
  const questXp = campaign.questXp ?? []
  const lastSplit = campaign.combat?.lastSplit
  const totalXp = [...graveyard, ...questXp].reduce((s, e) => s + (e.xp || 0), 0)
  const isEmpty = graveyard.length === 0 && questXp.length === 0

  return (
    <section>
      <div className="bg-brand-forest px-6 py-2 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-normal text-white">Graveyard</h2>
        {lastSplit && (
          <span className="text-white/70 text-xs font-normal">
            Last: {lastSplit.xpPerMember.toLocaleString()} XP ea
          </span>
        )}
      </div>

      <div className="px-6 flex flex-col">
        {!isEmpty && (
          <div className="flex items-center justify-between py-1.5 border-b border-brand-ink/20 mb-1">
            <span className="text-brand-ink/50 text-xs font-normal">Total</span>
            <span className="text-brand-ink text-sm font-normal">
              {totalXp.toLocaleString()} XP
            </span>
          </div>
        )}

        {isEmpty && (
          <p className="text-brand-ink opacity-40 font-light text-sm py-4 text-center">
            No kills yet…
          </p>
        )}

        {graveyard.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-2 py-1.5 border-b border-brand-ink/10"
          >
            <span className="flex-1 text-sm font-normal text-brand-ink truncate">{entry.name}</span>
            <span className="text-brand-ink/50 text-xs font-normal shrink-0">
              {(entry.xp || 0).toLocaleString()} XP
            </span>
          </div>
        ))}

        {questXp.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-2 py-1.5 border-b border-brand-ink/10"
          >
            <span className="flex-1 text-sm font-normal text-brand-rivulet truncate">
              {entry.label}
            </span>
            <span className="text-brand-ink/50 text-xs font-normal shrink-0">
              {(entry.xp || 0).toLocaleString()} XP
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
