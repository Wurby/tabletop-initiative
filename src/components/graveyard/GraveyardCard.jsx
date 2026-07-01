import { useState } from 'react'
import { useToast } from '../../lib/toast'
import { dmUpdate } from '../../lib/campaign'

function ClearModal({ totalXp, defaultPartySize, graveyard, questXp, onConfirm, onClose }) {
  const [partySize, setPartySize] = useState(String(defaultPartySize))
  const size = Math.max(1, Number(partySize) || 1)
  const perMember = Math.floor(totalXp / size)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40">
      <div className="bg-brand-mint-dark shadow-modal w-80 flex flex-col max-h-[85vh]">
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base">End Session</h2>
          <button onClick={onClose} className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm">✕</button>
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
            <span className="text-brand-ink text-sm font-normal">{totalXp.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-ink/60 text-xs font-normal">Party size</span>
            <input
              type="number"
              className="w-14 text-center text-sm font-normal text-brand-ink bg-white border border-brand-mint-dark px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-rivulet"
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between border-t border-brand-mint pt-3">
            <span className="text-brand-ink/60 text-xs font-normal">Per player</span>
            <span className="text-brand-ink text-lg font-light">{perMember.toLocaleString()} XP</span>
          </div>
        </div>
        <div className="flex border-t border-brand-mint shrink-0">
          <button onClick={() => onConfirm(size, perMember)} className="flex-1 py-2 text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark transition-colors">
            Confirm &amp; Clear
          </button>
          <button onClick={onClose} className="flex-1 py-2 text-xs font-normal text-brand-ink hover:bg-brand-mint transition-colors border-l border-brand-mint">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GraveyardCard({ campaign, campaignCode }) {
  const showError = useToast()
  const graveyard = campaign.graveyard ?? []
  const questXp = campaign.questXp ?? []
  const [questLabel, setQuestLabel] = useState('')
  const [questAmount, setQuestAmount] = useState('')
  const [showClear, setShowClear] = useState(false)

  const killTotal = graveyard.reduce((s, e) => s + (e.xp || 0), 0)
  const questTotal = questXp.reduce((s, e) => s + (e.xp || 0), 0)
  const totalXp = killTotal + questTotal
  const isEmpty = graveyard.length === 0 && questXp.length === 0

  async function handleReturn(entry) {
    const { xp: _xp, killedAt: _kt, ...unit } = entry
    try {
      await dmUpdate(campaignCode, {
        initiative: [...(campaign.initiative ?? []), unit],
        graveyard: graveyard.filter((e) => e.id !== entry.id),
      })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleDelete(id) {
    try {
      await dmUpdate(campaignCode, { graveyard: graveyard.filter((e) => e.id !== id) })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleAddQuest() {
    if (!questLabel.trim() || questAmount === '') return
    const entry = { id: crypto.randomUUID(), label: questLabel.trim(), xp: Number(questAmount), awardedAt: Date.now() }
    try {
      await dmUpdate(campaignCode, { questXp: [...questXp, entry] })
      setQuestLabel('')
      setQuestAmount('')
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleDeleteQuest(id) {
    try {
      await dmUpdate(campaignCode, { questXp: questXp.filter((e) => e.id !== id) })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleClear(partySize, xpPerMember) {
    const log = {
      id: crypto.randomUUID(),
      clearedAt: Date.now(),
      totalXp,
      partySize,
      xpPerMember,
      graveyardEntries: [...graveyard],
      questXpEntries: [...questXp],
    }
    try {
      await dmUpdate(campaignCode, {
        graveyard: [],
        questXp: [],
        sessionLogs: [...(campaign.sessionLogs ?? []), log],
        'combat.lastSplit': {
          xpPerMember,
          totalXp,
          clearedAt: log.clearedAt,
          graveyardEntries: [...graveyard],
          questXpEntries: [...questXp],
          dismissed: false,
        },
      })
      setShowClear(false)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <>
      <div className="flex-shrink-0 w-48 bg-brand-mint-dark shadow-card flex flex-col">
        {/* Header */}
        <div className="bg-brand-ink px-3 py-2 flex items-center justify-between">
          <span className="text-white text-xs font-normal tracking-wide">GRAVEYARD</span>
          <div className="flex items-center gap-2">
            <span className="text-white/70 font-light text-sm">{totalXp.toLocaleString()}</span>
            {!isEmpty && (
              <button
                onClick={() => setShowClear(true)}
                className="text-white/40 hover:text-white text-xs transition-colors"
                title="End session"
              >
                ✦
              </button>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto max-h-40 px-2 py-1.5 flex flex-col">
          {isEmpty && (
            <p className="text-brand-ink/30 text-xs font-light text-center py-3">No kills yet…</p>
          )}
          {graveyard.map((entry) => (
            <div key={entry.id} className="flex items-center gap-1 py-1 border-b border-brand-ink/8 group/row">
              <span className="flex-1 text-xs font-normal text-brand-ink truncate">{entry.name}</span>
              <span className="text-brand-ink/40 text-[10px] shrink-0">{(entry.xp || 0).toLocaleString()}</span>
              <button
                onClick={() => handleReturn(entry)}
                title="Return to initiative"
                className="shrink-0 text-[10px] text-brand-rivulet hover:text-brand-rivulet-dark transition-colors opacity-0 group-hover/row:opacity-100 px-0.5"
              >
                ↩
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                className="shrink-0 text-[10px] text-brand-ink/30 hover:text-brand-danger transition-colors opacity-0 group-hover/row:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
          {questXp.map((entry) => (
            <div key={entry.id} className="flex items-center gap-1 py-1 border-b border-brand-ink/8 group/row">
              <span className="flex-1 text-xs font-normal text-brand-rivulet truncate">{entry.label}</span>
              <span className="text-brand-ink/40 text-[10px] shrink-0">{(entry.xp || 0).toLocaleString()}</span>
              <div className="w-3" />
              <button
                onClick={() => handleDeleteQuest(entry.id)}
                className="shrink-0 text-[10px] text-brand-ink/30 hover:text-brand-danger transition-colors opacity-0 group-hover/row:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Quest XP add form */}
        <div className="border-t border-brand-mint px-2 py-1.5 flex items-center gap-1">
          <input
            className="flex-1 bg-transparent text-brand-ink text-[10px] font-normal focus:outline-none border-b border-transparent focus:border-brand-ink/20 placeholder-brand-ink/25 min-w-0"
            placeholder="Bonus XP…"
            value={questLabel}
            onChange={(e) => setQuestLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddQuest()}
          />
          <input
            className="w-10 text-center text-[10px] font-normal text-brand-ink bg-transparent focus:outline-none border-b border-transparent focus:border-brand-ink/20 placeholder-brand-ink/25 shrink-0"
            type="number"
            placeholder="XP"
            value={questAmount}
            onChange={(e) => setQuestAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddQuest()}
          />
          <button
            onClick={handleAddQuest}
            className="shrink-0 text-[10px] font-normal text-brand-rivulet hover:text-brand-rivulet-dark transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {showClear && (
        <ClearModal
          totalXp={totalXp}
          defaultPartySize={campaign.party?.length ?? 0}
          graveyard={graveyard}
          questXp={questXp}
          onConfirm={handleClear}
          onClose={() => setShowClear(false)}
        />
      )}
    </>
  )
}
