import { useState } from 'react'
import { useToast } from '../../lib/toast'
import { dmUpdate } from '../../lib/campaign'
import { Pen, Trash, Pin, EyeOpen } from '../icons'
import ItemDetailModal from './ItemDetailModal'
import ItemViewModal from './ItemViewModal'
import { ITEM_TYPE_LABELS, RARITY_LABELS } from './itemConstants'
import ImagePreviewModal from '../images/ImagePreviewModal'

function ItemCard({ item, folders, party, campaign, campaignCode }) {
  const showError = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showView, setShowView] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const items = campaign.items ?? []
  const owners = (item.ownerIds ?? [])
    .map((id) => party.find((m) => m.id === id))
    .filter(Boolean)

  async function handleSave(fields) {
    const next = items.map((i) => (i.id === item.id ? { ...i, ...fields } : i))
    try {
      await dmUpdate(campaignCode, { items: next })
      setShowEdit(false)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleDelete() {
    const next = items.filter((i) => i.id !== item.id)
    try {
      await dmUpdate(campaignCode, { items: next })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <>
      <div className="shadow-card flex flex-col bg-white">
        <div className="bg-brand-mint-dark px-3 py-2 flex items-center gap-2">
          {item.imageUrl && (
            <button onClick={() => setShowPreview(true)} className="shrink-0">
              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-brand-ink text-sm font-normal truncate">{item.name}</p>
            <p className="text-brand-ink/50 text-[10px] font-normal">
              {ITEM_TYPE_LABELS[item.type] ?? 'Misc'}
              {item.rarity && ` · ${RARITY_LABELS[item.rarity] ?? item.rarity}`}
              {item.attunement && ' · Attunement'}
            </p>
          </div>
        </div>
        <div className="px-3 py-2 flex items-center gap-3 border-t border-brand-mint">
          <span className="text-brand-forest text-xs font-normal">
            Qty <span className="text-brand-ink">{item.quantity ?? 0}</span>
          </span>
          <span className="text-brand-forest text-xs font-normal">
            Value <span className="text-brand-ink">{item.value ?? 0}gp</span>
          </span>
          <span className="text-brand-forest text-xs font-normal">
            Wt <span className="text-brand-ink">{item.weight ?? 0}lb</span>
          </span>
        </div>
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {owners.length > 0 ? (
            owners.map((o) => (
              <span key={o.id} className="bg-brand-mint text-brand-ink/70 text-[10px] font-normal px-1.5 py-0.5">
                {o.name}
              </span>
            ))
          ) : (
            <span className="text-brand-ink/30 text-[10px] font-normal">Unattached</span>
          )}
        </div>
        <div className="border-t border-brand-mint flex">
          <button
            onClick={() => { setShowView(true); setConfirmDelete(false) }}
            className="py-1.5 px-3 flex items-center justify-center hover:bg-brand-mint transition-colors"
            title="View"
          >
            <EyeOpen size={11} className="text-brand-ink/40" />
          </button>
          <button
            onClick={() => { setShowEdit(true); setConfirmDelete(false) }}
            className="py-1.5 px-3 flex items-center justify-center hover:bg-brand-mint transition-colors border-l border-brand-mint"
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
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex-1 py-1.5 flex items-center justify-center hover:bg-brand-mint transition-colors border-l border-brand-mint"
              title="Delete"
            >
              <Trash size={11} className="text-brand-ink/40" />
            </button>
          )}
        </div>
      </div>
      {showView && (
        <ItemViewModal
          item={item}
          party={party}
          onEdit={() => { setShowView(false); setShowEdit(true) }}
          onClose={() => setShowView(false)}
        />
      )}
      {showEdit && (
        <ItemDetailModal
          item={item}
          defaultFolderId={item.folderId ?? null}
          folders={folders}
          party={party}
          campaign={campaign}
          campaignCode={campaignCode}
          onSave={handleSave}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showPreview && item.imageUrl && (
        <ImagePreviewModal
          url={item.imageUrl}
          label={item.name}
          campaign={campaign}
          campaignCode={campaignCode}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}

export default function ItemsDrawer({ campaign, campaignCode, pinned, onTogglePin, onPin, onClose }) {
  const showError = useToast()
  const items = campaign.items ?? []
  const folders = campaign.itemFolders ?? []
  const party = campaign.party ?? []
  const [activeFolderId, setActiveFolderId] = useState(null)
  const [ownerFilter, setOwnerFilter] = useState(null) // null='All' | 'unattached' | memberId
  const [showAddModal, setShowAddModal] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState(null)

  const displayedItems = items
    .filter((i) => activeFolderId === null || i.folderId === activeFolderId)
    .filter((i) => {
      if (ownerFilter === null) return true
      if (ownerFilter === 'unattached') return (i.ownerIds ?? []).length === 0
      return (i.ownerIds ?? []).includes(ownerFilter)
    })

  async function handleAdd(fields) {
    const item = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...fields,
    }
    try {
      await dmUpdate(campaignCode, { items: [...items, item] })
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
      await dmUpdate(campaignCode, { itemFolders: [...folders, folder] })
      setNewFolderName('')
      setShowNewFolder(false)
      setActiveFolderId(folder.id)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function deleteFolder(folderId) {
    const nextFolders = folders.filter((f) => f.id !== folderId)
    const nextItems = items.map((i) => (i.folderId === folderId ? { ...i, folderId: null } : i))
    try {
      await dmUpdate(campaignCode, { itemFolders: nextFolders, items: nextItems })
      if (activeFolderId === folderId) setActiveFolderId(null)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <>
      {!pinned && <div className="fixed inset-0 z-30" onClick={onClose} />}
      <div className="fixed left-0 top-0 bottom-0 z-40 w-80 bg-brand-mint-dark shadow-modal flex flex-col">
        {/* Header */}
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0 gap-2">
          <h2 className="text-white font-normal text-base shrink-0">Items</h2>
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => { onPin(); setShowAddModal(true) }}
              className="text-xs font-normal text-white opacity-70 hover:opacity-100 border border-white/30 hover:border-white/60 px-2 py-1 transition-all shrink-0"
            >
              + Item
            </button>
            <button
              onClick={onTogglePin}
              className={`shrink-0 transition-opacity ${pinned ? 'text-white opacity-100' : 'text-white opacity-50 hover:opacity-100'}`}
              title={pinned ? 'Unpin drawer' : 'Pin drawer open'}
            >
              <Pin size={14} />
            </button>
            <button
              onClick={onClose}
              className="shrink-0 text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
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
                <>
                  <div className="fixed inset-0 z-[5]" onClick={() => setConfirmDeleteFolderId(null)} />
                  <div className="absolute top-0 right-0 flex items-center gap-0.5 bg-white border border-brand-ink/20 px-1 py-0.5 z-10 shadow-sm">
                    <span className="text-[9px] text-brand-ink/60 mr-0.5">Delete?</span>
                    <button onClick={() => deleteFolder(f.id)} className="text-[9px] text-brand-danger hover:text-brand-danger/70 font-normal transition-colors">Yes</button>
                    <span className="text-[9px] text-brand-ink/30">/</span>
                    <button onClick={() => setConfirmDeleteFolderId(null)} className="text-[9px] text-brand-ink/40 hover:text-brand-ink/60 transition-colors">No</button>
                  </div>
                </>
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

        {/* Owner filter */}
        <div className="px-4 pt-2 pb-2 flex gap-1.5 flex-wrap items-center shrink-0 border-b border-brand-mint">
          <button
            onClick={() => setOwnerFilter(null)}
            className={`shrink-0 px-2 py-0.5 text-[11px] font-normal border transition-colors ${
              ownerFilter === null
                ? 'bg-brand-rivulet text-white border-brand-rivulet'
                : 'border-brand-ink/20 text-brand-ink/70 hover:border-brand-ink/40'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setOwnerFilter('unattached')}
            className={`shrink-0 px-2 py-0.5 text-[11px] font-normal border transition-colors ${
              ownerFilter === 'unattached'
                ? 'bg-brand-rivulet text-white border-brand-rivulet'
                : 'border-brand-ink/20 text-brand-ink/70 hover:border-brand-ink/40'
            }`}
          >
            Unattached
          </button>
          {party.map((m) => (
            <button
              key={m.id}
              onClick={() => setOwnerFilter(m.id)}
              className={`shrink-0 px-2 py-0.5 text-[11px] font-normal border transition-colors ${
                ownerFilter === m.id
                  ? 'bg-brand-rivulet text-white border-brand-rivulet'
                  : 'border-brand-ink/20 text-brand-ink/70 hover:border-brand-ink/40'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {displayedItems.length === 0 && (
            <p className="text-brand-ink opacity-40 text-sm font-light py-6 text-center">
              {items.length === 0 ? 'No items yet' : 'No items match this filter'}
            </p>
          )}
          {displayedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              folders={folders}
              party={party}
              campaign={campaign}
              campaignCode={campaignCode}
            />
          ))}
        </div>
      </div>

      {showAddModal && (
        <ItemDetailModal
          item={null}
          defaultFolderId={activeFolderId}
          folders={folders}
          party={party}
          campaign={campaign}
          campaignCode={campaignCode}
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  )
}
