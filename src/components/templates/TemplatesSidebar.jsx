import { useState } from 'react'
import { useToast } from '../../lib/toast'
import { dmUpdate } from '../../lib/campaign'
import { NotesEditor } from '../initiative/UnitNotesModal'

const TYPE_CYCLE = { mob: 'ally', ally: 'mob' }
const TYPE_LABEL = { mob: 'M', ally: 'A' }

function cloneWithFreshIds(noteFolders, notes) {
  const idMap = {}
  const newFolders = (noteFolders ?? []).map((f) => {
    const newId = crypto.randomUUID()
    idMap[f.id] = newId
    return { ...f, id: newId }
  })
  const newNotes = (notes ?? []).map((n) => ({
    ...n,
    id: crypto.randomUUID(),
    folderId: n.folderId ? (idMap[n.folderId] ?? null) : null,
  }))
  return { noteFolders: newFolders, notes: newNotes }
}

function TemplateEntry({ template, campaign, campaignCode }) {
  const showError = useToast()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editName, setEditName] = useState('')
  const [editHpMax, setEditHpMax] = useState(0)
  const [editAc, setEditAc] = useState(0)
  const [editType, setEditType] = useState('mob')
  const [editFolders, setEditFolders] = useState([])
  const [editNotes, setEditNotes] = useState([])

  const templates = campaign.templates ?? []
  const noteCount = (template.notes ?? []).length

  function openEdit() {
    setEditName(template.name)
    setEditHpMax(template.hp?.max ?? 0)
    setEditAc(template.ac ?? 0)
    setEditType(template.type ?? 'mob')
    setEditFolders(template.noteFolders ?? [])
    setEditNotes(template.notes ?? [])
    setEditing(true)
    setConfirmDelete(false)
  }

  async function handleSave() {
    if (!editName.trim()) return
    const next = templates.map((t) =>
      t.id === template.id
        ? {
            ...t,
            name: editName.trim(),
            hp: { max: Number(editHpMax) || 0 },
            ac: Number(editAc) || 0,
            type: editType,
            noteFolders: editFolders,
            notes: editNotes,
          }
        : t
    )
    try {
      await dmUpdate(campaignCode, { templates: next })
      setEditing(false)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleDelete() {
    const next = templates.filter((t) => t.id !== template.id)
    try {
      await dmUpdate(campaignCode, { templates: next })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleAddToInitiative() {
    const { noteFolders: clonedFolders, notes: clonedNotes } = cloneWithFreshIds(
      template.noteFolders,
      template.notes
    )
    const unit = {
      id: crypto.randomUUID(),
      name: template.name,
      initiative: 0,
      hp: { current: template.hp?.max ?? 0, max: template.hp?.max ?? 0, temp: 0 },
      ac: template.ac ?? 0,
      status: '',
      visible: false,
      type: template.type ?? 'mob',
      showHp: false,
      showAc: false,
      showDeathSaves: false,
      deathSaves: { s: [false, false, false], f: [false, false, false] },
      conditions: [],
      tiebreak: 0,
      noteFolders: clonedFolders,
      notes: clonedNotes,
    }
    try {
      await dmUpdate(campaignCode, {
        initiative: [...(campaign.initiative ?? []), unit],
      })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  if (editing) {
    return (
      <div className="border-b border-brand-mint px-4 py-3 flex flex-col gap-3">
        <input
          autoFocus
          className="bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet w-full"
          placeholder="Name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditType((t) => TYPE_CYCLE[t] ?? 'mob')}
            className="text-xs font-bold w-5 text-center text-brand-ink/50 hover:text-brand-ink transition-colors"
            title="Cycle type"
          >
            {TYPE_LABEL[editType] ?? 'M'}
          </button>
          <span className="text-brand-forest text-xs font-normal">HP</span>
          <input
            type="number"
            className="w-12 bg-white border border-brand-mint-dark px-1 py-0.5 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-1 focus:ring-brand-rivulet"
            placeholder="—"
            value={editHpMax}
            onChange={(e) => setEditHpMax(e.target.value)}
          />
          <span className="text-brand-forest text-xs font-normal">AC</span>
          <input
            type="number"
            className="w-12 bg-white border border-brand-mint-dark px-1 py-0.5 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-1 focus:ring-brand-rivulet"
            placeholder="—"
            value={editAc}
            onChange={(e) => setEditAc(e.target.value)}
          />
        </div>

        <div className="border-t border-brand-mint/80 pt-2">
          <NotesEditor
            folders={editFolders}
            notes={editNotes}
            onFoldersChange={setEditFolders}
            onNotesChange={setEditNotes}
          />
        </div>

        <div className="flex gap-2 border-t border-brand-mint pt-2">
          <button
            onClick={handleSave}
            className="flex-1 py-1 text-xs font-normal text-white bg-brand-rivulet hover:bg-brand-rivulet-dark transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-1 text-xs font-normal text-brand-ink hover:bg-brand-mint transition-colors border border-brand-mint"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-brand-mint px-4 py-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-normal text-brand-ink leading-snug">{template.name}</p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={openEdit}
            className="text-[10px] text-brand-ink/30 hover:text-brand-ink/60 transition-colors px-1"
            title="Edit template"
          >
            ✏
          </button>
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                className="text-[10px] text-brand-danger hover:text-brand-danger-dark transition-colors px-1"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] text-brand-ink/40 hover:text-brand-ink/60 transition-colors"
              >
                No
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[10px] text-brand-ink/30 hover:text-brand-ink/60 transition-colors px-1"
              title="Delete template"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-brand-ink/40 font-normal mb-2">
        HP {template.hp?.max ?? 0} · AC {template.ac ?? 0} · {template.type === 'ally' ? 'Ally' : 'Mob'}
        {noteCount > 0 && ` · ${noteCount} note${noteCount > 1 ? 's' : ''}`}
      </p>
      <button
        onClick={handleAddToInitiative}
        className="text-xs font-normal text-brand-rivulet border border-brand-rivulet/30 hover:border-brand-rivulet px-3 py-1 transition-colors"
      >
        Add to initiative
      </button>
    </div>
  )
}

export default function TemplatesSidebar({ campaign, campaignCode, onClose }) {
  const showError = useToast()
  const templates = campaign.templates ?? []
  const [newName, setNewName] = useState('')
  const [newHpMax, setNewHpMax] = useState('')
  const [newAc, setNewAc] = useState('')
  const [newType, setNewType] = useState('mob')

  async function handleAdd() {
    if (!newName.trim()) return
    const template = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      hp: { max: Number(newHpMax) || 0 },
      ac: Number(newAc) || 0,
      type: newType,
      noteFolders: [],
      notes: [],
      createdAt: Date.now(),
    }
    try {
      await dmUpdate(campaignCode, { templates: [...templates, template] })
      setNewName('')
      setNewHpMax('')
      setNewAc('')
      setNewType('mob')
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-40 w-80 bg-brand-mint-dark shadow-modal flex flex-col">
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base">Templates</h2>
          <button
            onClick={onClose}
            className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {templates.length === 0 && (
            <p className="text-brand-ink opacity-40 text-sm font-light py-6 text-center px-4">
              No templates yet
            </p>
          )}
          {templates.map((t) => (
            <TemplateEntry
              key={t.id}
              template={t}
              campaign={campaign}
              campaignCode={campaignCode}
            />
          ))}
        </div>

        <div className="border-t border-brand-mint px-4 py-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setNewType((t) => TYPE_CYCLE[t] ?? 'mob')}
            className="shrink-0 text-xs font-bold w-5 text-center text-brand-ink/50 hover:text-brand-ink transition-colors"
            title="Cycle type"
          >
            {TYPE_LABEL[newType] ?? 'M'}
          </button>
          <input
            className="flex-1 bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet min-w-0"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <span className="text-brand-ink/50 text-xs shrink-0">HP</span>
          <input
            type="number"
            className="w-10 bg-white border border-brand-mint-dark px-1 py-1 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-2 focus:ring-brand-rivulet shrink-0"
            placeholder="—"
            value={newHpMax}
            onChange={(e) => setNewHpMax(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <span className="text-brand-ink/50 text-xs shrink-0">AC</span>
          <input
            type="number"
            className="w-10 bg-white border border-brand-mint-dark px-1 py-1 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-2 focus:ring-brand-rivulet shrink-0"
            placeholder="—"
            value={newAc}
            onChange={(e) => setNewAc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="shrink-0 px-2 py-1 text-xs font-normal text-white bg-brand-rivulet hover:bg-brand-rivulet-dark transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </>
  )
}
