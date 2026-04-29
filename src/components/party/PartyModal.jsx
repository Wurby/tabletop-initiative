import { useState } from 'react'
import { useToast } from '../../lib/toast'
import { dmUpdate } from '../../lib/campaign'

function MemberRow({ member, onUpdate, onDelete }) {
  const [local, setLocal] = useState(member)
  const isFollower = member.type === 'follower'

  function commit(field, value) {
    const updated = { ...local, [field]: value }
    setLocal(updated)
    onUpdate(updated)
  }

  return (
    <div className="flex items-center gap-2 py-2 border-b border-brand-mint last:border-0">
      <span
        className={`text-xs font-bold w-4 shrink-0 ${isFollower ? 'text-brand-rivulet' : 'text-brand-forest'}`}
      >
        {isFollower ? 'F' : 'P'}
      </span>
      <input
        className="flex-1 bg-transparent text-brand-ink text-sm font-normal focus:outline-none border-b border-transparent focus:border-brand-ink/20 min-w-0"
        aria-label={local.name}
        value={local.name}
        onChange={(e) => setLocal({ ...local, name: e.target.value })}
        onBlur={(e) => commit('name', e.target.value)}
        placeholder="Name"
      />
      {isFollower && (
        <>
          <span className="text-brand-ink/50 text-xs shrink-0">HP</span>
          <input
            className="w-10 text-center text-sm font-normal text-brand-ink bg-transparent focus:outline-none border-b border-transparent focus:border-brand-ink/20 shrink-0"
            type="number"
            value={local.hpMax ?? ''}
            onChange={(e) => setLocal({ ...local, hpMax: e.target.value })}
            onBlur={(e) => commit('hpMax', Number(e.target.value) || 0)}
          />
        </>
      )}
      <span className="text-brand-ink/50 text-xs shrink-0">AC</span>
      <input
        className="w-10 text-center text-sm font-normal text-brand-ink bg-transparent focus:outline-none border-b border-transparent focus:border-brand-ink/20 shrink-0"
        type="number"
        value={local.ac}
        onChange={(e) => setLocal({ ...local, ac: e.target.value })}
        onBlur={(e) => commit('ac', Number(e.target.value) || 0)}
      />
      <button
        onClick={() => onDelete(member.id)}
        className="shrink-0 text-xs font-normal text-brand-ink opacity-30 hover:opacity-70 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}

export default function PartyModal({ campaign, campaignCode, onClose }) {
  const showError = useToast()
  const party = campaign.party ?? []
  const [newName, setNewName] = useState('')
  const [newAc, setNewAc] = useState('')
  const [newHpMax, setNewHpMax] = useState('')
  const [newType, setNewType] = useState('party')

  async function handleUpdate(updated) {
    const nextParty = party.map((m) => (m.id === updated.id ? updated : m))
    const nextInit = (campaign.initiative ?? []).map((u) => {
      if (u.id !== updated.id) return u
      const synced = { ...u, name: updated.name, ac: updated.ac }
      if (updated.type === 'follower') synced.hp = { ...u.hp, max: updated.hpMax ?? u.hp?.max ?? 0 }
      return synced
    })
    try {
      await dmUpdate(campaignCode, {
        party: nextParty,
        initiative: nextInit,
      })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleDelete(id) {
    const nextParty = party.filter((m) => m.id !== id)
    const nextInit = (campaign.initiative ?? []).filter((u) => u.id !== id)
    try {
      await dmUpdate(campaignCode, {
        party: nextParty,
        initiative: nextInit,
      })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleAdd() {
    if (!newName.trim()) return
    const isFollower = newType === 'follower'
    const id = crypto.randomUUID()
    const hpMax = isFollower ? Number(newHpMax) || 0 : 0
    const member = {
      id,
      name: newName.trim(),
      ac: Number(newAc) || 0,
      type: newType,
      ...(isFollower ? { hpMax } : {}),
    }
    const unit = {
      id,
      name: member.name,
      initiative: 0,
      hp: { current: hpMax, max: hpMax, temp: 0 },
      ac: member.ac,
      status: '',
      visible: false,
      type: newType,
      showHp: false,
      showAc: false,
      showDeathSaves: false,
      deathSaves: { s: [false, false, false], f: [false, false, false] },
    }
    try {
      await dmUpdate(campaignCode, {
        party: [...party, member],
        initiative: [...(campaign.initiative ?? []), unit],
      })
      setNewName('')
      setNewAc('')
      setNewHpMax('')
      setNewType('party')
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40">
      <div className="bg-brand-mint-dark shadow-modal w-80 flex flex-col max-h-[80vh]">
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-normal text-base">Party</h2>
          <button
            onClick={onClose}
            className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {party.length === 0 && (
            <p className="text-brand-ink opacity-40 text-sm font-light py-4 text-center">
              No members yet
            </p>
          )}
          {party.map((m) => (
            <MemberRow key={m.id} member={m} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>

        <div className="border-t border-brand-mint px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNewType((t) => (t === 'party' ? 'follower' : 'party'))}
            className={`shrink-0 text-xs font-bold w-5 text-center transition-colors ${newType === 'follower' ? 'text-brand-rivulet' : 'text-brand-forest'}`}
          >
            {newType === 'party' ? 'P' : 'F'}
          </button>
          <input
            className="flex-1 bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet min-w-0"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          {newType === 'follower' && (
            <>
              <span className="text-brand-ink/50 text-xs shrink-0">HP</span>
              <input
                className="w-12 bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-2 focus:ring-brand-rivulet shrink-0"
                type="number"
                placeholder="—"
                value={newHpMax}
                onChange={(e) => setNewHpMax(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </>
          )}
          <span className="text-brand-ink/50 text-xs shrink-0">AC</span>
          <input
            className="w-12 bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-2 focus:ring-brand-rivulet shrink-0"
            type="number"
            placeholder="—"
            value={newAc}
            onChange={(e) => setNewAc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="shrink-0 px-3 py-1 text-xs font-normal text-white bg-brand-rivulet hover:bg-brand-rivulet-dark transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
