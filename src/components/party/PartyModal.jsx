import { useState } from 'react'
import { useToast } from '../../lib/toast'
import { dmUpdate } from '../../lib/campaign'
import { Trash } from '../icons'

function MemberRow({ member, onUpdate, onDelete }) {
  const [local, setLocal] = useState(member)

  function commit(field, value) {
    const updated = { ...local, [field]: value }
    setLocal(updated)
    onUpdate(updated)
  }

  return (
    <div className="flex items-center gap-2 py-2 border-b border-brand-mint last:border-0">
      <input
        className="flex-1 bg-transparent text-brand-ink text-sm font-normal focus:outline-none border-b border-transparent focus:border-brand-ink/20 min-w-0"
        aria-label={local.name}
        value={local.name}
        onChange={(e) => setLocal({ ...local, name: e.target.value })}
        onBlur={(e) => commit('name', e.target.value)}
        placeholder="Name"
      />
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
        className="shrink-0 text-brand-ink/30 hover:text-brand-danger transition-colors"
        title="Remove member"
      >
        <Trash size={11} />
      </button>
    </div>
  )
}

export default function PartyModal({ campaign, campaignCode, onClose }) {
  const showError = useToast()
  const party = campaign.party ?? []
  const displayedParty = party.filter((m) => m.type === 'party')
  const [newName, setNewName] = useState('')
  const [newAc, setNewAc] = useState('')

  async function handleUpdate(updated) {
    const nextParty = party.map((m) => (m.id === updated.id ? updated : m))
    const nextInit = (campaign.initiative ?? []).map((u) =>
      u.id === updated.id ? { ...u, name: updated.name, ac: updated.ac } : u
    )
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
    const id = crypto.randomUUID()
    const member = { id, name: newName.trim(), ac: Number(newAc) || 0, type: 'party' }
    const unit = {
      id,
      name: member.name,
      initiative: 0,
      hp: { current: 0, max: 0, temp: 0 },
      ac: member.ac,
      status: '',
      visible: false,
      type: 'party',
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
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40" onClick={onClose}>
      <div
        className="bg-brand-mint-dark shadow-modal w-80 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
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
          {displayedParty.length === 0 && (
            <p className="text-brand-ink opacity-40 text-sm font-light py-4 text-center">
              No members yet
            </p>
          )}
          {displayedParty.map((m) => (
            <MemberRow key={m.id} member={m} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>

        <div className="border-t border-brand-mint px-4 py-3 flex items-center gap-2">
          <input
            className="flex-1 bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet min-w-0"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
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
