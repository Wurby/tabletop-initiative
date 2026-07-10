import { useState } from 'react'
import { CR_XP, CR_PAGE_SIZE } from '../../lib/xp'
import { TYPE_LABEL } from '../../lib/unitType'

function KillPicker({ onConfirm, onCancel }) {
  const [crPage, setCrPage] = useState(0)
  const [xp, setXp] = useState('')
  const totalPages = Math.ceil(CR_XP.length / CR_PAGE_SIZE)
  const pageEntries = CR_XP.slice(crPage * CR_PAGE_SIZE, (crPage + 1) * CR_PAGE_SIZE)

  return (
    <div className="mt-2 flex flex-col gap-2 bg-brand-mint p-2 border border-brand-ink/10">
      <div className="grid grid-cols-3 gap-1">
        {pageEntries.map(({ cr, xp: crXp }) => (
          <button
            key={cr}
            onClick={() => onConfirm(crXp)}
            className="py-1 text-xs font-normal border border-brand-mint-dark text-brand-ink hover:bg-brand-mint-dark active:bg-brand-danger active:text-white active:border-brand-danger transition-colors"
          >
            {cr}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCrPage((p) => Math.max(0, p - 1))}
          disabled={crPage === 0}
          className="text-brand-ink/40 hover:text-brand-ink disabled:opacity-20 text-sm px-1 transition-colors"
        >
          ‹
        </button>
        <span className="text-brand-ink/40 text-xs">{crPage + 1} / {totalPages}</span>
        <button
          onClick={() => setCrPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={crPage === totalPages - 1}
          className="text-brand-ink/40 hover:text-brand-ink disabled:opacity-20 text-sm px-1 transition-colors"
        >
          ›
        </button>
      </div>
      <div className="flex items-center gap-1">
        <input
          className="flex-1 bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-1 focus:ring-brand-rivulet min-w-0"
          type="number"
          placeholder="XP"
          value={xp}
          onChange={(e) => setXp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && xp !== '' && onConfirm(Number(xp) || 0)}
        />
        <button
          onClick={() => xp !== '' && onConfirm(Number(xp) || 0)}
          className="shrink-0 px-2 py-1 text-xs font-normal text-white bg-brand-danger hover:bg-brand-danger-dark transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="shrink-0 text-xs font-normal text-brand-ink/40 hover:text-brand-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function EndCombatModal({ units, onConfirm, onClose }) {
  const [resolutions, setResolutions] = useState(() => {
    const init = {}
    units.forEach((u) => {
      if (u.type !== 'mob') init[u.id] = { action: 'leave' }
    })
    return init
  })
  const [killPickerId, setKillPickerId] = useState(null)

  function setAction(id, action) {
    setResolutions((prev) => ({ ...prev, [id]: { action } }))
    setKillPickerId(null)
  }

  function confirmKill(id, xp) {
    setResolutions((prev) => ({ ...prev, [id]: { action: 'kill', xp } }))
    setKillPickerId(null)
  }

  const allResolved = units.every((u) => resolutions[u.id]?.action)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40" onClick={onClose}>
      <div
        className="bg-brand-mint-dark shadow-modal w-96 max-w-[95vw] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base">End Combat</h2>
          <button
            onClick={onClose}
            className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {units.length === 0 ? (
            <p className="text-brand-ink opacity-40 text-sm font-light py-4 text-center">
              No allies or mobs to resolve.
            </p>
          ) : (
            units.map((u) => {
              const resolution = resolutions[u.id]
              return (
                <div key={u.id} className="border border-brand-ink/10 p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-brand-ink/40 text-xs font-bold w-4 shrink-0">
                      {TYPE_LABEL[u.type] ?? 'M'}
                    </span>
                    <span className="text-brand-ink text-sm font-normal flex-1 truncate">{u.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setKillPickerId(killPickerId === u.id ? null : u.id)}
                        className={`px-2 py-0.5 text-xs font-normal border transition-colors ${
                          resolution?.action === 'kill'
                            ? 'bg-brand-danger text-white border-brand-danger'
                            : 'border-brand-ink/20 text-brand-danger hover:border-brand-danger/40'
                        }`}
                      >
                        Kill
                      </button>
                      <button
                        onClick={() => setAction(u.id, 'remove')}
                        className={`px-2 py-0.5 text-xs font-normal border transition-colors ${
                          resolution?.action === 'remove'
                            ? 'bg-brand-ink text-white border-brand-ink'
                            : 'border-brand-ink/20 text-brand-ink/60 hover:border-brand-ink/40'
                        }`}
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setAction(u.id, 'leave')}
                        className={`px-2 py-0.5 text-xs font-normal border transition-colors ${
                          resolution?.action === 'leave'
                            ? 'bg-brand-forest text-white border-brand-forest'
                            : 'border-brand-ink/20 text-brand-forest hover:border-brand-forest/40'
                        }`}
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                  {resolution?.action === 'kill' && resolution.xp != null && (
                    <p className="text-brand-ink/40 text-[10px] mt-1">{resolution.xp} XP</p>
                  )}
                  {killPickerId === u.id && (
                    <KillPicker
                      onConfirm={(xp) => confirmKill(u.id, xp)}
                      onCancel={() => setKillPickerId(null)}
                    />
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="border-t border-brand-mint shrink-0 p-3">
          <button
            onClick={() => onConfirm(resolutions)}
            disabled={!allResolved}
            className="w-full py-2 text-xs font-normal text-white bg-brand-danger hover:bg-brand-danger-dark transition-colors disabled:opacity-30 disabled:hover:bg-brand-danger"
          >
            End Combat
          </button>
        </div>
      </div>
    </div>
  )
}
