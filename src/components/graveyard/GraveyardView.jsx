export default function GraveyardView({ campaign }) {
  const graveyard  = campaign.graveyard ?? []
  const questXp    = campaign.questXp   ?? []
  const lastSplit  = campaign.combat?.lastSplit
  const totalXp    = [...graveyard, ...questXp].reduce((s, e) => s + (e.xp || 0), 0)
  const isEmpty    = graveyard.length === 0 && questXp.length === 0

  return (
    <section>
      <div className="bg-brand-forest px-6 py-2 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-normal text-white">Graveyard</h2>
        <span className="text-white font-light text-lg">{totalXp.toLocaleString()} XP</span>
      </div>

      {lastSplit && (
        <div className="mx-6 mb-4 px-4 py-2.5 bg-brand-forest/10 border border-brand-forest/20 flex items-center justify-between">
          <span className="text-brand-forest text-xs font-normal">Last session</span>
          <span className="text-brand-ink font-light">{lastSplit.xpPerMember.toLocaleString()} XP each</span>
        </div>
      )}

      <div className="px-6 flex flex-col">
        {isEmpty && (
          <p className="text-brand-ink opacity-40 font-light text-sm py-4 text-center">No kills yet…</p>
        )}

        {graveyard.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2 py-1.5 border-b border-brand-ink/10">
            <span className="flex-1 text-sm font-normal text-brand-ink truncate">{entry.name}</span>
            <span className="text-brand-ink/50 text-xs font-normal shrink-0">{(entry.xp || 0).toLocaleString()} XP</span>
          </div>
        ))}

        {questXp.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2 py-1.5 border-b border-brand-ink/10">
            <span className="flex-1 text-sm font-normal text-brand-rivulet truncate">{entry.label}</span>
            <span className="text-brand-ink/50 text-xs font-normal shrink-0">{(entry.xp || 0).toLocaleString()} XP</span>
          </div>
        ))}
      </div>
    </section>
  )
}
