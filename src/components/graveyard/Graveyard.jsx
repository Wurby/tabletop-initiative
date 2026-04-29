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
          <button
            onClick={onClose}
            className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {graveyard.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between px-4 py-1.5 border-b border-brand-mint"
            >
              <span className="text-brand-ink text-sm font-normal truncate flex-1">{e.name}</span>
              <span className="text-brand-ink/50 text-xs shrink-0 ml-2">
                {(e.xp || 0).toLocaleString()} XP
              </span>
            </div>
          ))}
          {questXp.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between px-4 py-1.5 border-b border-brand-mint"
            >
              <span className="text-brand-rivulet text-sm font-normal truncate flex-1">
                {e.label}
              </span>
              <span className="text-brand-ink/50 text-xs shrink-0 ml-2">
                {(e.xp || 0).toLocaleString()} XP
              </span>
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
            <span className="text-brand-ink text-lg font-light">
              {perMember.toLocaleString()} XP
            </span>
          </div>
        </div>

        <div className="flex border-t border-brand-mint shrink-0">
          <button
            onClick={() => onConfirm(size, perMember)}
            className="flex-1 py-2 text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark transition-colors"
          >
            Confirm &amp; Clear
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-normal text-brand-ink hover:bg-brand-mint transition-colors border-l border-brand-mint"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Graveyard({ campaign, campaignCode }) {
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
      await dmUpdate(campaignCode, {
        graveyard: graveyard.filter((e) => e.id !== id),
      })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleAddQuest() {
    if (!questLabel.trim() || questAmount === '') return
    const entry = {
      id: crypto.randomUUID(),
      label: questLabel.trim(),
      xp: Number(questAmount),
      awardedAt: Date.now(),
    }
    try {
      await dmUpdate(campaignCode, {
        questXp: [...questXp, entry],
      })
      setQuestLabel('')
      setQuestAmount('')
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleDeleteQuest(id) {
    try {
      await dmUpdate(campaignCode, {
        questXp: questXp.filter((e) => e.id !== id),
      })
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
    <section>
      <div className="bg-brand-forest px-6 py-2 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-normal text-white">Graveyard</h2>
        <div className="flex items-center gap-4">
          <span className="text-white font-light text-lg">{totalXp.toLocaleString()} XP</span>
          {!isEmpty && (
            <button
              onClick={() => setShowClear(true)}
              className="text-xs font-normal text-white opacity-50 hover:opacity-100 transition-opacity"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="px-6 flex flex-col">
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
            <button
              onClick={() => handleReturn(entry)}
              title="Return to initiative"
              className="shrink-0 text-xs font-normal text-brand-rivulet hover:text-brand-rivulet-dark transition-colors px-0.5"
            >
              ↩
            </button>
            <button
              onClick={() => handleDelete(entry.id)}
              className="shrink-0 text-xs font-normal text-brand-ink opacity-30 hover:opacity-70 transition-opacity"
            >
              ✕
            </button>
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
            <div className="w-[18px]" />
            <button
              onClick={() => handleDeleteQuest(entry.id)}
              className="shrink-0 text-xs font-normal text-brand-ink opacity-30 hover:opacity-70 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-3 mt-1 border-t border-brand-ink/10">
          <input
            className="flex-1 bg-transparent text-brand-ink text-sm font-normal focus:outline-none border-b border-transparent focus:border-brand-ink/20 placeholder-brand-ink/30 min-w-0"
            placeholder="Bonus XP label…"
            value={questLabel}
            onChange={(e) => setQuestLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddQuest()}
          />
          <input
            className="w-16 text-center text-sm font-normal text-brand-ink bg-transparent focus:outline-none border-b border-transparent focus:border-brand-ink/20 placeholder-brand-ink/30 shrink-0"
            type="number"
            placeholder="XP"
            value={questAmount}
            onChange={(e) => setQuestAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddQuest()}
          />
          <button
            onClick={handleAddQuest}
            className="shrink-0 text-xs font-normal text-brand-rivulet hover:text-brand-rivulet-dark transition-colors"
          >
            Add
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
    </section>
  )
}
