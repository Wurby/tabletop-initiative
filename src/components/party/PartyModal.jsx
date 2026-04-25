import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

function MemberRow({ member, onUpdate, onDelete, onAddToInitiative }) {
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
        onClick={() => onAddToInitiative(member)}
        className="shrink-0 text-xs font-normal text-brand-rivulet hover:text-brand-rivulet-dark transition-colors px-1"
        title="Add to initiative"
      >
        + init
      </button>
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
  const party = campaign.party ?? []
  const [newName, setNewName] = useState('')
  const [newAc, setNewAc] = useState('')

  async function updateParty(next) {
    await updateDoc(doc(db, 'campaigns', campaignCode), { party: next })
  }

  function handleAdd() {
    if (!newName.trim()) return
    const member = { id: crypto.randomUUID(), name: newName.trim(), ac: Number(newAc) || 0 }
    updateParty([...party, member])
    setNewName('')
    setNewAc('')
  }

  function handleUpdate(updated) {
    updateParty(party.map((m) => (m.id === updated.id ? updated : m)))
  }

  function handleDelete(id) {
    updateParty(party.filter((m) => m.id !== id))
  }

  async function addToInitiative(member) {
    const unit = {
      id: crypto.randomUUID(),
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
    await updateDoc(doc(db, 'campaigns', campaignCode), {
      initiative: [...(campaign.initiative ?? []), unit],
    })
  }

  async function loadAll() {
    const existing = campaign.initiative ?? []
    const existingNames = new Set(existing.map((u) => u.name))
    const toAdd = party
      .filter((m) => !existingNames.has(m.name))
      .map((m) => ({
        id: crypto.randomUUID(),
        name: m.name,
        initiative: 0,
        hp: { current: 0, max: 0, temp: 0 },
        ac: m.ac,
        status: '',
        visible: false,
        type: 'party',
        showHp: false,
        showAc: false,
        showDeathSaves: false,
        deathSaves: { s: [false, false, false], f: [false, false, false] },
      }))
    if (toAdd.length === 0) return
    await updateDoc(doc(db, 'campaigns', campaignCode), {
      initiative: [...existing, ...toAdd],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40">
      <div className="bg-brand-mint-dark shadow-modal w-80 flex flex-col max-h-[80vh]">
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-normal text-base">Party</h2>
          <button onClick={onClose} className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {party.length === 0 && (
            <p className="text-brand-ink opacity-40 text-sm font-light py-4 text-center">No members yet</p>
          )}
          {party.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAddToInitiative={addToInitiative}
            />
          ))}
        </div>

        <div className="border-t border-brand-mint px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
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
          {party.length > 0 && (
            <button
              onClick={loadAll}
              className="w-full py-1.5 text-xs font-normal text-brand-rivulet hover:bg-brand-mint transition-colors border border-brand-rivulet/30"
            >
              Load all into initiative
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
