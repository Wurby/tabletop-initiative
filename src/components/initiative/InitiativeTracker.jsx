import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useToast } from '../../lib/toast'
import UnitCard from './UnitCard'

const MIN_SLOTS = 5

const TYPE_HEADER = {
  party: 'bg-brand-forest',
  follower: 'bg-brand-forest',
  ally: 'bg-brand-rivulet',
  mob: 'bg-brand-danger',
}
const TYPE_CYCLE = { ally: 'mob', mob: 'ally' }
const TYPE_LABEL = { party: 'P', follower: 'F', ally: 'A', mob: 'M' }

function AddCard({ onAdd }) {
  const [form, setForm] = useState({ name: '', initiative: '', hpMax: '', ac: '', type: 'mob' })
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: false }))
  }

  function handleAdd() {
    const missing = {}
    if (!form.name.trim()) missing.name = true
    if (form.initiative === '') missing.initiative = true
    if (form.hpMax === '') missing.hpMax = true
    if (Object.keys(missing).length > 0) {
      setErrors(missing)
      return
    }
    onAdd(form)
    setForm({ name: '', initiative: '', hpMax: '', ac: '', type: 'mob' })
    setErrors({})
  }

  const err = 'border-b border-brand-danger placeholder-brand-danger/50'
  const ok = 'border-b border-brand-ink/20 placeholder-brand-ink/30'
  const headerBg = errors.initiative
    ? 'bg-brand-danger'
    : (TYPE_HEADER[form.type] ?? TYPE_HEADER.mob)

  return (
    <div className="flex-shrink-0 w-48 bg-brand-mint-dark shadow-card flex flex-col opacity-60 hover:opacity-100 transition-opacity focus-within:opacity-100">
      <div className={`px-3 py-2 flex items-center gap-2 ${headerBg}`}>
        <button
          type="button"
          onClick={() => set('type', TYPE_CYCLE[form.type] ?? 'mob')}
          className="text-white/70 hover:text-white text-xs font-bold transition-colors w-5 text-center"
          title="Cycle type"
        >
          {TYPE_LABEL[form.type] ?? 'M'}
        </button>
        <span className="text-white text-xs font-normal flex-1">INIT</span>
        <input
          className="bg-transparent text-white font-light text-lg text-right focus:outline-none w-14 placeholder-white/40"
          type="number"
          placeholder="—"
          value={form.initiative}
          onChange={(e) => set('initiative', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
      </div>

      <div className="px-3 py-3 flex flex-col gap-3 flex-1">
        <input
          className={`bg-transparent text-brand-ink font-normal text-base focus:outline-none pb-0.5 w-full ${errors.name ? err : ok}`}
          placeholder="Name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <div className="flex items-center gap-1">
          <span
            className={`text-xs font-normal w-6 ${errors.hpMax ? 'text-brand-danger' : 'text-brand-forest'}`}
          >
            HP
          </span>
          <input
            className={`bg-transparent text-brand-ink font-normal text-center focus:outline-none w-14 text-sm ${errors.hpMax ? err : ok}`}
            type="number"
            placeholder="—"
            value={form.hpMax}
            onChange={(e) => set('hpMax', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-brand-forest text-xs font-normal w-6">AC</span>
          <input
            className="bg-transparent text-brand-ink font-normal text-center focus:outline-none border-b border-brand-ink/20 w-14 text-sm placeholder-brand-ink/30"
            type="number"
            placeholder="—"
            value={form.ac}
            onChange={(e) => set('ac', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
      </div>

      <div className="border-t border-brand-mint">
        <button
          onClick={handleAdd}
          className="w-full py-1.5 text-xs font-normal text-brand-rivulet hover:bg-brand-mint transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function EmptyCard() {
  return (
    <div className="flex-shrink-0 w-48 bg-brand-mint-dark shadow-card flex flex-col opacity-20 pointer-events-none">
      <div className="bg-brand-forest px-3 py-2">
        <span className="text-white text-xs font-normal">INIT</span>
      </div>
      <div className="flex-1 min-h-28" />
    </div>
  )
}

export default function InitiativeTracker({ campaign, campaignCode }) {
  const showError = useToast()
  const units = [...(campaign.initiative ?? [])].sort((a, b) => b.initiative - a.initiative)
  const emptyCount = Math.max(0, MIN_SLOTS - units.length - 1)
  const activeIndex = campaign.combat?.activeIndex ?? 0
  const round = campaign.combat?.round ?? 1
  const [confirmEnd, setConfirmEnd] = useState(false)

  async function setActiveIndex(next) {
    const idx = units.length > 0 ? ((next % units.length) + units.length) % units.length : 0
    try {
      await updateDoc(doc(db, 'campaigns', campaignCode), { 'combat.activeIndex': idx })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function setRound(next) {
    try {
      await updateDoc(doc(db, 'campaigns', campaignCode), { 'combat.round': Math.max(1, next) })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function endCombat() {
    const survivors = (campaign.initiative ?? []).filter(
      (u) => u.type === 'party' || u.type === 'follower'
    )
    try {
      await updateDoc(doc(db, 'campaigns', campaignCode), {
        initiative: survivors,
        'combat.activeIndex': 0,
        'combat.round': 1,
      })
      setConfirmEnd(false)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleAdd(form) {
    const unit = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      initiative: Number(form.initiative),
      hp: { current: Number(form.hpMax), max: Number(form.hpMax), temp: 0 },
      ac: Number(form.ac) || 0,
      status: '',
      visible: false,
      type: form.type ?? 'mob',
      showHp: false,
      showAc: false,
      showDeathSaves: false,
      deathSaves: { s: [false, false, false], f: [false, false, false] },
    }
    try {
      await updateDoc(doc(db, 'campaigns', campaignCode), {
        initiative: [...(campaign.initiative ?? []), unit],
      })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleUpdate(updated) {
    const next = (campaign.initiative ?? []).map((u) => (u.id === updated.id ? updated : u))
    try {
      await updateDoc(doc(db, 'campaigns', campaignCode), { initiative: next })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleDelete(id) {
    const next = (campaign.initiative ?? []).filter((u) => u.id !== id)
    try {
      await updateDoc(doc(db, 'campaigns', campaignCode), { initiative: next })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleKill(unit, xp) {
    const entry = { ...unit, xp, killedAt: Date.now() }
    try {
      await updateDoc(doc(db, 'campaigns', campaignCode), {
        initiative: (campaign.initiative ?? []).filter((u) => u.id !== unit.id),
        graveyard: [...(campaign.graveyard ?? []), entry],
      })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <section>
      <div className="bg-brand-forest px-6 py-2 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-normal text-white">Initiative</h2>
        <div className="flex items-center gap-4">
          {/* Round counter */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/60 text-xs font-normal">Round</span>
            <button
              onClick={() => setRound(round - 1)}
              className="text-white/60 hover:text-white text-sm transition-colors w-4 text-center"
            >
              −
            </button>
            <span className="text-white font-light text-lg w-6 text-center">{round}</span>
            <button
              onClick={() => setRound(round + 1)}
              className="text-white/60 hover:text-white text-sm transition-colors w-4 text-center"
            >
              +
            </button>
          </div>
          {/* End combat */}
          {confirmEnd ? (
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-xs font-normal">End combat?</span>
              <button
                onClick={endCombat}
                className="text-xs font-normal text-white bg-brand-danger px-2 py-0.5 hover:bg-brand-danger-dark transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmEnd(false)}
                className="text-xs font-normal text-white/60 hover:text-white transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmEnd(true)}
              className="text-xs font-normal text-white opacity-50 hover:opacity-100 transition-opacity"
            >
              End
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-row flex-wrap justify-center gap-x-3 gap-y-4 pb-4 px-6">
        {units.map((unit, i) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            isActive={i === activeIndex}
            onSetActive={() => setActiveIndex(i)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onKill={handleKill}
          />
        ))}
        <AddCard onAdd={handleAdd} />
        {Array.from({ length: emptyCount }).map((_, i) => (
          <EmptyCard key={i} />
        ))}
      </div>
    </section>
  )
}
