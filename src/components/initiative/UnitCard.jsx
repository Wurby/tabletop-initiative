import { useState, useEffect, useRef } from 'react'
import { EyeOpen, EyeClosed } from '../icons'
import ActiveTurnWrapper from './ActiveTurnWrapper'
import { CR_XP, CR_PAGE_SIZE } from '../../lib/xp'

const TYPE_HEADER = {
  party: 'bg-brand-forest',
  follower: 'bg-[linear-gradient(to_right,var(--color-brand-rivulet),var(--color-brand-forest))]',
  ally: 'bg-brand-rivulet',
  mob: 'bg-brand-danger',
}
const TYPE_CYCLE = { ally: 'mob', mob: 'ally' }
const TYPE_LABEL = { party: 'P', follower: 'F', ally: 'A', mob: 'M' }

// onChange: keystroke (local only), onCommit: button click or blur (writes to Firestore)
function Stepper({ label, labelColor = 'text-brand-forest', value, onChange, onCommit }) {
  const val = Number(value) || 0
  const btn =
    'shrink-0 w-6 h-6 text-xs font-normal border border-brand-mint text-brand-ink hover:bg-brand-mint active:bg-brand-mint-dark transition-colors'
  const btnSm =
    'shrink-0 w-5 h-6 text-xs font-normal border border-brand-mint text-brand-ink hover:bg-brand-mint active:bg-brand-mint-dark transition-colors'
  return (
    <div className="flex items-center gap-0.5">
      {label && <span className={`${labelColor} text-xs font-normal w-7 shrink-0`}>{label}</span>}
      <button className={btn} onClick={() => onCommit(val - 5)}>
        −−
      </button>
      <button className={btnSm} onClick={() => onCommit(val - 1)}>
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit(Number(e.target.value))}
        className="w-9 text-center text-sm font-normal text-brand-ink bg-transparent focus:outline-none focus:bg-white shrink-0"
      />
      <button className={btnSm} onClick={() => onCommit(val + 1)}>
        +
      </button>
      <button className={btn} onClick={() => onCommit(val + 5)}>
        ++
      </button>
    </div>
  )
}

function HpBar({ current, max, temp = 0 }) {
  const pct = max > 0 ? current / max : 0
  const hpW = Math.min(100, Math.round(pct * 100))
  const tempW = temp > 0 ? Math.round((temp / (max || 1)) * 100) : 0
  const totalFilled = Math.min(100, hpW + tempW)
  const dispTemp = tempW > 0 ? Math.min(totalFilled, tempW) : 0
  const dispHp = totalFilled - dispTemp
  const color =
    pct > 0.75
      ? 'bg-brand-forest'
      : pct > 0.5
        ? 'bg-yellow-400'
        : pct > 0.25
          ? 'bg-orange-400'
          : 'bg-brand-danger'
  return (
    <div className="h-2 w-full bg-brand-mint flex">
      <div className={`h-2 ${color} transition-all duration-500`} style={{ width: `${dispHp}%` }} />
      {dispTemp > 0 && (
        <div
          className="h-2 bg-brand-rivulet/40 transition-all duration-500"
          style={{ width: `${dispTemp}%` }}
        />
      )}
    </div>
  )
}

function DeathSaves({ unit, onUpdate }) {
  const saves = unit.deathSaves ?? { s: [false, false, false], f: [false, false, false] }
  function tap(type, i) {
    const arr = [...(saves[type] ?? [false, false, false])]
    arr[i] = !arr[i]
    onUpdate({ ...unit, deathSaves: { ...saves, [type]: arr } })
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-brand-forest text-xs font-normal w-3">✓</span>
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => tap('s', i)}
            className={`w-4 h-4 border transition-colors ${saves.s[i] ? 'bg-brand-forest border-brand-forest' : 'border-brand-ink/30 hover:border-brand-forest'}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-brand-danger text-xs font-normal w-3">✗</span>
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => tap('f', i)}
            className={`w-4 h-4 border transition-colors ${saves.f[i] ? 'bg-brand-danger border-brand-danger' : 'border-brand-ink/30 hover:border-brand-danger'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function UnitCard({
  unit,
  onUpdate,
  onDelete,
  onKill,
  isActive = false,
  onSetActive,
}) {
  const [local, setLocal] = useState(unit)
  const [killing, setKilling] = useState(false)
  const [killXp, setKillXp] = useState('')
  const [crPage, setCrPage] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const popoverRef = useRef(null)
  const unitRef = useRef(unit)
  unitRef.current = unit

  useEffect(() => {
    setLocal(unitRef.current)
  }, [unit.id, unit.name])

  useEffect(() => {
    if (!showControls) return
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowControls(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showControls])

  function push(updated) {
    setLocal(updated)
    onUpdate(updated)
  }

  function set(path, value) {
    const u =
      path === 'hp.current'
        ? { ...local, hp: { ...local.hp, current: value } }
        : path === 'hp.max'
          ? { ...local, hp: { ...local.hp, max: value } }
          : path === 'hp.temp'
            ? { ...local, hp: { ...local.hp, temp: value } }
            : { ...local, [path]: value }
    setLocal(u)
    return u
  }

  function commit(path, value) {
    onUpdate(set(path, value))
  }

  const isParty = local.type === 'party'
  const isAlly = local.type === 'ally'
  const isFollower = local.type === 'follower'

  if (killing) {
    const totalPages = Math.ceil(CR_XP.length / CR_PAGE_SIZE)
    const pageEntries = CR_XP.slice(crPage * CR_PAGE_SIZE, (crPage + 1) * CR_PAGE_SIZE)
    function confirmKill() {
      onKill(unit, Number(killXp) || 0)
      setKilling(false)
      setKillXp('')
      setCrPage(0)
    }
    return (
      <div className="flex-shrink-0 w-48 h-full bg-brand-mint-dark shadow-card flex flex-col">
        <div className="bg-brand-danger px-3 py-2">
          <p className="text-white text-xs font-normal truncate">Kill {local.name}?</p>
        </div>
        <div className="flex flex-col gap-2.5 p-3 flex-1">
          <div className="grid grid-cols-3 gap-1">
            {pageEntries.map(({ cr, xp }) => (
              <button
                key={cr}
                onClick={() => {
                  onKill(unit, xp)
                  setKilling(false)
                  setKillXp('')
                  setCrPage(0)
                }}
                className="py-1 text-xs font-normal border border-brand-mint text-brand-ink hover:bg-brand-mint active:bg-brand-danger active:text-white active:border-brand-danger transition-colors"
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
            <span className="text-brand-ink/40 text-xs">
              {crPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCrPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={crPage === totalPages - 1}
              className="text-brand-ink/40 hover:text-brand-ink disabled:opacity-20 text-sm px-1 transition-colors"
            >
              ›
            </button>
          </div>
          <input
            className="bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet w-full"
            type="number"
            placeholder="XP"
            value={killXp}
            onChange={(e) => setKillXp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmKill()}
          />
        </div>
        <div className="flex border-t border-brand-mint">
          <button
            onClick={confirmKill}
            className="flex-1 py-2 text-xs font-normal text-white bg-brand-danger hover:bg-brand-danger-dark transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => {
              setKilling(false)
              setKillXp('')
              setCrPage(0)
            }}
            className="flex-1 py-2 text-xs font-normal text-brand-ink hover:bg-brand-mint transition-colors border-l border-brand-mint"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <ActiveTurnWrapper isActive={isActive} type={local.type}>
      <div
        className={`w-48 h-full min-h-28 bg-brand-mint-dark shadow-card flex flex-col transition-all ${!local.visible ? 'opacity-50' : ''}`}
      >
        {/* Header: type | name | AC | initiative */}
        <div
          ref={popoverRef}
          className={`${TYPE_HEADER[local.type] ?? TYPE_HEADER.mob} px-2 py-1.5 flex items-center gap-1.5 relative`}
        >
          {isParty || isFollower ? (
            <span className="text-white/60 text-xs font-bold w-5 text-center shrink-0">
              {TYPE_LABEL[local.type]}
            </span>
          ) : (
            <button
              onClick={() => push({ ...local, type: TYPE_CYCLE[local.type] ?? 'mob' })}
              className="text-white/60 hover:text-white text-xs font-bold transition-colors w-5 text-center shrink-0"
              title="Cycle type"
            >
              {TYPE_LABEL[local.type] ?? 'M'}
            </button>
          )}
          <input
            className="bg-transparent text-white font-normal text-sm focus:outline-none min-w-0 flex-1 truncate placeholder-white/40"
            aria-label={local.name}
            value={local.name}
            onChange={(e) => setLocal({ ...local, name: e.target.value })}
            onBlur={(e) => commit('name', e.target.value)}
          />
          <button
            onClick={() => setShowControls((v) => !v)}
            className={`shrink-0 flex items-center gap-2 transition-colors ${showControls ? 'text-white' : 'text-white/70 hover:text-white'}`}
          >
            <span className="text-xs font-normal flex items-center gap-0.5">
              <span className="text-white/50">AC</span> {local.ac}
            </span>
            <span className="flex items-baseline gap-0.5">
              <span className="text-white/50 text-xs">i</span>
              <span className="font-light text-lg">{local.initiative}</span>
            </span>
          </button>
          <button
            onClick={onSetActive}
            className={`text-sm shrink-0 transition-opacity ml-0.5 ${isActive ? 'text-white opacity-100' : 'text-white opacity-20 hover:opacity-70'}`}
            title="Set active turn"
          >
            ▶
          </button>

          {/* Controls popover */}
          {showControls && (
            <div className="absolute top-full left-0 right-0 z-20 bg-brand-mint-dark border-b border-x border-brand-ink/10 shadow-modal px-3 py-3 flex flex-col gap-2">
              <Stepper
                label="AC"
                value={local.ac}
                onChange={(v) => setLocal({ ...local, ac: v })}
                onCommit={(v) => commit('ac', Number(v))}
              />
              <Stepper
                label="init"
                value={local.initiative}
                onChange={(v) => setLocal({ ...local, initiative: v })}
                onCommit={(v) => commit('initiative', Number(v))}
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-3 py-2 flex flex-col gap-2 flex-1">
          <input
            className="bg-transparent text-brand-ink text-xs font-normal focus:outline-none border-b border-transparent focus:border-brand-ink/20 w-full placeholder-brand-ink/30"
            placeholder="Status…"
            value={local.status ?? ''}
            onChange={(e) => setLocal({ ...local, status: e.target.value })}
            onBlur={(e) => commit('status', e.target.value)}
          />

          {!isParty && (
            <div className="relative border border-brand-ink/20 px-2 pt-3 pb-2">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-mint-dark text-brand-forest text-xs font-normal px-1 leading-none">
                HP
              </span>
              <div className="flex flex-col gap-2 items-center">
                <Stepper
                  value={local.hp?.current ?? 0}
                  onChange={(v) => setLocal({ ...local, hp: { ...local.hp, current: v } })}
                  onCommit={(v) =>
                    commit('hp.current', Math.max(0, Math.min(Number(v), local.hp?.max ?? 0)))
                  }
                />
                <div className="text-center text-brand-ink/40 text-xs">{local.hp?.max ?? 0}</div>
                <div className="flex flex-col gap-1">
                  <span className="text-brand-rivulet text-xs font-normal text-center">TMP</span>
                  <Stepper
                    value={local.hp?.temp ?? 0}
                    onChange={(v) => setLocal({ ...local, hp: { ...local.hp, temp: v } })}
                    onCommit={(v) => commit('hp.temp', Number(v))}
                  />
                </div>
                <HpBar
                  current={Number(local.hp?.current ?? 0)}
                  max={Number(local.hp?.max ?? 1)}
                  temp={Number(local.hp?.temp ?? 0)}
                />
              </div>
            </div>
          )}

          {isParty && local.showDeathSaves && <DeathSaves unit={local} onUpdate={(u) => push(u)} />}
        </div>

        {/* Footer */}
        <div className="border-t border-brand-mint">
          <div className="flex">
            <button
              onClick={() => push({ ...local, visible: !local.visible })}
              className="flex-1 py-1.5 flex items-center justify-center hover:bg-brand-mint transition-colors"
              title={local.visible ? 'Hide from table' : 'Show on table'}
            >
              {local.visible ? (
                <EyeOpen className="text-brand-forest" />
              ) : (
                <EyeClosed className="text-brand-ink opacity-40" />
              )}
            </button>
            {!isParty && (
              <button
                onClick={() => push({ ...local, showHp: !local.showHp })}
                className={`flex-1 py-1.5 text-xs font-bold transition-colors border-l border-brand-mint ${local.showHp ? 'text-brand-rivulet bg-brand-mint' : 'text-brand-ink opacity-30 hover:opacity-60'}`}
              >
                HP
              </button>
            )}
            {!isAlly && !isParty && !isFollower && (
              <button
                onClick={() => push({ ...local, showAc: !local.showAc })}
                className={`flex-1 py-1.5 text-xs font-bold transition-colors border-l border-brand-mint ${local.showAc ? 'text-brand-rivulet bg-brand-mint' : 'text-brand-ink opacity-30 hover:opacity-60'}`}
              >
                AC
              </button>
            )}
          </div>
          {!isFollower && (
            <div className="flex border-t border-brand-mint">
              {isParty ? (
                <button
                  onClick={() => push({ ...local, showDeathSaves: !local.showDeathSaves })}
                  className={`flex-1 py-1.5 text-xs font-bold transition-colors ${local.showDeathSaves ? 'text-brand-rivulet bg-brand-mint' : 'text-brand-danger hover:bg-brand-mint'}`}
                >
                  DS
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setKilling(true)}
                    className="flex-1 py-1.5 text-xs font-normal text-brand-danger hover:bg-brand-mint transition-colors"
                  >
                    Kill
                  </button>
                  <button
                    onClick={() => onDelete(unit.id)}
                    className="py-1.5 px-2.5 text-xs font-normal text-brand-ink opacity-30 hover:opacity-70 transition-opacity border-l border-brand-mint"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </ActiveTurnWrapper>
  )
}
