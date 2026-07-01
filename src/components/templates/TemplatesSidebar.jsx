import { useState } from 'react'
import { useToast } from '../../lib/toast'
import { dmUpdate } from '../../lib/campaign'
import { NotesEditor } from '../initiative/UnitNotesModal'
import { Pen, Trash, Sparkles } from '../icons'
import TemplateGenModal from './TemplateGenModal'

const TYPE_HEADER = { mob: 'bg-brand-danger', ally: 'bg-brand-rivulet' }
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

function TemplateModal({ template, defaultFolderId, folders, onSave, onClose, initialData }) {
  const src = initialData ?? template ?? null
  const [editName, setEditName] = useState(src?.name ?? '')
  const [editHpMax, setEditHpMax] = useState(src?.hp?.max ?? 0)
  const [editAc, setEditAc] = useState(src?.ac ?? 0)
  const [editType, setEditType] = useState(src?.type ?? 'mob')
  const [editFolderId, setEditFolderId] = useState(defaultFolderId ?? null)
  const [editFolders, setEditFolders] = useState(src?.noteFolders ?? [])
  const [editNotes, setEditNotes] = useState(src?.notes ?? [])

  function handleSave() {
    if (!editName.trim()) return
    onSave({
      name: editName.trim(),
      hp: { max: Number(editHpMax) || 0 },
      ac: Number(editAc) || 0,
      type: editType,
      folderId: editFolderId,
      noteFolders: editFolders,
      notes: editNotes,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40">
      <div className="bg-brand-mint-dark shadow-modal flex max-h-[85vh] w-[720px] max-w-[95vw]">
        {/* Left pane — stats */}
        <div className="flex flex-col w-72 shrink-0 border-r border-brand-mint">
          <div className={`${TYPE_HEADER[editType] ?? TYPE_HEADER.mob} px-4 py-3 shrink-0`}>
            <h2 className="text-white font-normal text-base">
              {template ? 'Edit Template' : initialData ? 'Review Generated' : 'New Template'}
            </h2>
          </div>
          <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto">
            <input
              autoFocus
              className="bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet w-full"
              placeholder="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              type="button"
              onClick={() => setEditType((t) => TYPE_CYCLE[t] ?? 'mob')}
              className={`self-start px-3 py-1 text-xs font-normal border transition-colors ${
                editType === 'mob'
                  ? 'bg-brand-danger text-white border-brand-danger'
                  : 'bg-brand-rivulet text-white border-brand-rivulet'
              }`}
            >
              {editType === 'mob' ? 'Mob' : 'Ally'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-brand-forest text-xs w-14 shrink-0">HP max</span>
              <input
                type="number"
                className="w-16 bg-white border border-brand-mint-dark px-1 py-0.5 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-1 focus:ring-brand-rivulet"
                placeholder="0"
                value={editHpMax}
                onChange={(e) => setEditHpMax(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-forest text-xs w-14 shrink-0">AC</span>
              <input
                type="number"
                className="w-16 bg-white border border-brand-mint-dark px-1 py-0.5 text-brand-ink text-sm font-normal text-center focus:outline-none focus:ring-1 focus:ring-brand-rivulet"
                placeholder="0"
                value={editAc}
                onChange={(e) => setEditAc(e.target.value)}
              />
            </div>
            {folders.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-brand-forest text-xs">Folder</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setEditFolderId(null)}
                    className={`px-2 py-0.5 text-xs font-normal border transition-colors ${
                      editFolderId === null
                        ? 'bg-brand-forest text-white border-brand-forest'
                        : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                    }`}
                  >
                    None
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setEditFolderId(f.id)}
                      className={`px-2 py-0.5 text-xs font-normal border transition-colors ${
                        editFolderId === f.id
                          ? 'bg-brand-forest text-white border-brand-forest'
                          : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex border-t border-brand-mint shrink-0">
            <button
              onClick={handleSave}
              className="flex-1 py-2 text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark transition-colors"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 text-xs font-normal text-brand-ink hover:bg-brand-mint transition-colors border-l border-brand-mint"
            >
              Cancel
            </button>
          </div>
        </div>
        {/* Right pane — notes */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="bg-brand-forest px-4 py-3 shrink-0">
            <h3 className="text-white font-normal text-sm">Notes</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NotesEditor
              folders={editFolders}
              notes={editNotes}
              onFoldersChange={setEditFolders}
              onNotesChange={setEditNotes}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function TemplateCard({ template, folders, campaign, campaignCode }) {
  const showError = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const templates = campaign.templates ?? []
  const noteCount = (template.notes ?? []).length

  async function handleSave(fields) {
    const next = templates.map((t) => (t.id === template.id ? { ...t, ...fields } : t))
    try {
      await dmUpdate(campaignCode, { templates: next })
      setShowEdit(false)
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

  return (
    <>
      <div className="shadow-card flex flex-col">
        <div className={`${TYPE_HEADER[template.type] ?? TYPE_HEADER.mob} px-3 py-2 flex items-center gap-2`}>
          <span className="text-white/60 text-xs font-bold w-4 text-center shrink-0">
            {TYPE_LABEL[template.type] ?? 'M'}
          </span>
          <span className="text-white text-sm font-normal flex-1 truncate">{template.name}</span>
        </div>
        <div className="bg-brand-mint-dark px-3 py-2 flex items-center gap-3">
          <span className="text-brand-forest text-xs font-normal">
            HP <span className="text-brand-ink">{template.hp?.max ?? 0}</span>
          </span>
          <span className="text-brand-forest text-xs font-normal">
            AC <span className="text-brand-ink">{template.ac ?? 0}</span>
          </span>
          {noteCount > 0 && (
            <span className="text-brand-ink/40 text-xs ml-auto">
              {noteCount} note{noteCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="border-t border-brand-mint flex">
          <button
            onClick={() => { setShowEdit(true); setConfirmDelete(false) }}
            className="py-1.5 px-3 flex items-center justify-center hover:bg-brand-mint transition-colors"
            title="Edit"
          >
            <Pen size={11} className="text-brand-ink/40" />
          </button>
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                className="flex-1 py-1.5 text-xs font-normal text-brand-danger hover:bg-brand-mint transition-colors border-l border-brand-mint"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-1.5 text-xs font-normal text-brand-ink/40 hover:bg-brand-mint transition-colors border-l border-brand-mint"
              >
                No
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmDelete(true)}
                className="py-1.5 px-3 flex items-center justify-center hover:bg-brand-mint transition-colors border-l border-brand-mint"
                title="Delete"
              >
                <Trash size={11} className="text-brand-ink/40" />
              </button>
              <button
                onClick={handleAddToInitiative}
                className="flex-1 py-1.5 text-xs font-normal text-brand-rivulet hover:bg-brand-mint transition-colors border-l border-brand-mint"
              >
                + Init
              </button>
            </>
          )}
        </div>
      </div>
      {showEdit && (
        <TemplateModal
          template={template}
          defaultFolderId={template.folderId ?? null}
          folders={folders}
          onSave={handleSave}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}

export default function TemplatesSidebar({ campaign, campaignCode, onClose }) {
  const showError = useToast()
  const templates = campaign.templates ?? []
  const folders = campaign.templateFolders ?? []
  const [activeFolderId, setActiveFolderId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGenModal, setShowGenModal] = useState(false)
  const [genSeed, setGenSeed] = useState(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState(null)

  const displayedTemplates =
    activeFolderId === null ? templates : templates.filter((t) => t.folderId === activeFolderId)

  async function handleAdd(fields) {
    const template = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...fields,
    }
    try {
      await dmUpdate(campaignCode, { templates: [...templates, template] })
      setShowAddModal(false)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function createFolder() {
    const name = newFolderName.trim()
    if (!name) return
    const folder = { id: crypto.randomUUID(), name }
    try {
      await dmUpdate(campaignCode, { templateFolders: [...folders, folder] })
      setNewFolderName('')
      setShowNewFolder(false)
      setActiveFolderId(folder.id)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function deleteFolder(folderId) {
    const nextFolders = folders.filter((f) => f.id !== folderId)
    const nextTemplates = templates.map((t) =>
      t.folderId === folderId ? { ...t, folderId: null } : t
    )
    try {
      await dmUpdate(campaignCode, { templateFolders: nextFolders, templates: nextTemplates })
      if (activeFolderId === folderId) setActiveFolderId(null)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-40 w-80 bg-brand-mint-dark shadow-modal flex flex-col">
        {/* Header */}
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base">Templates</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenModal(true)}
              className="text-white opacity-50 hover:opacity-100 transition-opacity"
              title="AI generate template"
            >
              <Sparkles size={15} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-normal text-white opacity-70 hover:opacity-100 border border-white/30 hover:border-white/60 px-2 py-1 transition-all"
            >
              + Template
            </button>
            <button
              onClick={onClose}
              className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Folder tabs */}
        <div className="px-4 pt-3 pb-2 flex gap-1.5 flex-wrap items-center shrink-0 border-b border-brand-mint">
          {folders.length > 0 && (
            <button
              onClick={() => setActiveFolderId(null)}
              className={`shrink-0 px-3 py-1 text-xs font-normal border transition-colors ${
                activeFolderId === null
                  ? 'bg-brand-forest text-white border-brand-forest'
                  : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
              }`}
            >
              All
            </button>
          )}
          {folders.map((f) => (
            <div key={f.id} className="relative shrink-0 group/tab">
              <button
                onClick={() => { setActiveFolderId(f.id); setConfirmDeleteFolderId(null) }}
                className={`pl-3 pr-6 py-1 text-xs font-normal border transition-colors ${
                  activeFolderId === f.id
                    ? 'bg-brand-forest text-white border-brand-forest'
                    : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                }`}
              >
                {f.name}
              </button>
              {confirmDeleteFolderId === f.id ? (
                <div className="absolute top-0 right-0 flex items-center gap-0.5 bg-white border border-brand-ink/20 px-1 py-0.5 z-10 shadow-sm">
                  <span className="text-[9px] text-brand-ink/60 mr-0.5">Delete?</span>
                  <button onClick={() => deleteFolder(f.id)} className="text-[9px] text-brand-danger hover:text-brand-danger/70 font-normal transition-colors">Yes</button>
                  <span className="text-[9px] text-brand-ink/30">/</span>
                  <button onClick={() => setConfirmDeleteFolderId(null)} className="text-[9px] text-brand-ink/40 hover:text-brand-ink/60 transition-colors">No</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteFolderId(f.id)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 text-white/80 text-[9px] opacity-0 group-hover/tab:opacity-100 transition-opacity flex items-center justify-center leading-none bg-brand-danger/70 hover:bg-brand-danger"
                  title="Delete folder"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {showNewFolder ? (
            <div className="flex items-center gap-1 shrink-0">
              <input
                autoFocus
                className="w-24 bg-white border border-brand-ink/20 px-2 py-0.5 text-xs text-brand-ink focus:outline-none"
                placeholder="Name…"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createFolder()
                  if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName('') }
                }}
              />
              <button onClick={createFolder} className="text-xs text-brand-rivulet hover:text-brand-rivulet/70 transition-colors">Add</button>
              <button onClick={() => { setShowNewFolder(false); setNewFolderName('') }} className="text-xs text-brand-ink/40 hover:text-brand-ink/60 transition-colors">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="shrink-0 px-2 py-1 text-xs font-normal text-brand-ink/30 hover:text-brand-ink/60 border border-dashed border-brand-ink/15 hover:border-brand-ink/30 transition-colors"
            >
              + Folder
            </button>
          )}
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {displayedTemplates.length === 0 && (
            <p className="text-brand-ink opacity-40 text-sm font-light py-6 text-center">
              {templates.length === 0 ? 'No templates yet' : 'No templates in this folder'}
            </p>
          )}
          {displayedTemplates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              folders={folders}
              campaign={campaign}
              campaignCode={campaignCode}
            />
          ))}
        </div>
      </div>

      {showAddModal && (
        <TemplateModal
          template={null}
          defaultFolderId={activeFolderId}
          folders={folders}
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {genSeed && (
        <TemplateModal
          template={null}
          initialData={genSeed}
          defaultFolderId={activeFolderId}
          folders={folders}
          onSave={(fields) => { handleAdd(fields); setGenSeed(null) }}
          onClose={() => setGenSeed(null)}
        />
      )}
      {showGenModal && (
        <TemplateGenModal
          campaign={campaign}
          onClose={() => setShowGenModal(false)}
          onSave={(data) => { setShowGenModal(false); setGenSeed(data) }}
        />
      )}
    </>
  )
}
