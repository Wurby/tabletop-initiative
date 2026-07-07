import { useState } from 'react'

const ALL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function sortSlots(slots) {
  return [...slots].sort((a, b) => a.level - b.level)
}

// Editable spell-slot pip tracker, shared by UnitCard (expendable, in combat)
// and TemplateModal (config-only — pips always render "available").
export default function SpellSlotsEditor({ slots, onChange, expendable = true }) {
  const [showAddPicker, setShowAddPicker] = useState(false)
  const list = sortSlots(slots ?? [])
  const usedLevels = new Set(list.map((s) => s.level))
  const availableLevels = ALL_LEVELS.filter((l) => !usedLevels.has(l))

  function addLevel(level) {
    const entry = expendable ? { level, max: 1, used: [false] } : { level, max: 1 }
    onChange(sortSlots([...list, entry]))
    setShowAddPicker(false)
  }

  function removeLevel(level) {
    onChange(list.filter((s) => s.level !== level))
  }

  function resize(level, delta) {
    onChange(
      list.map((s) => {
        if (s.level !== level) return s
        const max = Math.max(1, s.max + delta)
        if (!expendable) return { level: s.level, max }
        const used = Array.from({ length: max }, (_, i) => s.used?.[i] ?? false)
        return { level: s.level, max, used }
      })
    )
  }

  function togglePip(level, i) {
    if (!expendable) return
    onChange(
      list.map((s) => {
        if (s.level !== level) return s
        const used = [...(s.used ?? Array(s.max).fill(false))]
        used[i] = !used[i]
        return { ...s, used }
      })
    )
  }

  function resetAll() {
    onChange(list.map((s) => ({ ...s, used: Array(s.max).fill(false) })))
  }

  return (
    <div className="flex flex-col gap-1.5">
      {list.map((s) => {
        const used = s.used ?? Array(s.max).fill(false)
        return (
          <div key={s.level} className="flex items-start gap-1.5">
            <span className="text-brand-forest text-[10px] font-normal w-5 shrink-0 pt-0.5">L{s.level}</span>
            <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
              {Array.from({ length: s.max }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => togglePip(s.level, i)}
                  disabled={!expendable}
                  className={`w-3 h-3 rounded-full border transition-colors ${
                    expendable && used[i] ? 'bg-brand-rivulet border-brand-rivulet' : 'border-brand-ink/30'
                  } ${expendable ? 'cursor-pointer' : 'cursor-default'}`}
                  title={expendable ? (used[i] ? 'Expended — click to restore' : 'Available — click to expend') : undefined}
                />
              ))}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => resize(s.level, -1)}
                className="w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-brand-ink/20 text-brand-ink/70 hover:border-brand-ink/40 hover:text-brand-ink transition-colors"
                title="Fewer slots"
              >
                −
              </button>
              <button
                onClick={() => resize(s.level, 1)}
                className="w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-brand-ink/20 text-brand-ink/70 hover:border-brand-ink/40 hover:text-brand-ink transition-colors"
                title="More slots"
              >
                +
              </button>
              <button
                onClick={() => removeLevel(s.level)}
                className="w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-brand-ink/20 text-brand-ink/70 hover:border-brand-danger hover:text-brand-danger transition-colors"
                title="Remove level"
              >
                ×
              </button>
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-1.5 flex-wrap">
        {showAddPicker ? (
          <>
            {availableLevels.map((l) => (
              <button
                key={l}
                onClick={() => addLevel(l)}
                className="w-4 h-4 flex items-center justify-center text-[9px] font-normal border border-brand-ink/20 text-brand-ink hover:border-brand-ink/40 transition-colors"
              >
                {l}
              </button>
            ))}
            <button
              onClick={() => setShowAddPicker(false)}
              className="text-[9px] text-brand-ink/40 hover:text-brand-ink/60 transition-colors"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowAddPicker(true)}
            disabled={availableLevels.length === 0}
            className="text-[9px] font-normal text-brand-ink/30 hover:text-brand-ink/60 border border-dashed border-brand-ink/15 hover:border-brand-ink/30 px-1.5 py-0.5 transition-colors disabled:opacity-30"
          >
            + Level
          </button>
        )}
        {expendable && list.length > 0 && (
          <button
            onClick={resetAll}
            className="text-[9px] font-normal text-brand-ink/40 hover:text-brand-ink/70 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
