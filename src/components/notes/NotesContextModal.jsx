import { useState } from 'react'

export default function NotesContextModal({ campaign, selectedIds, onToggle, onDone }) {
  const folders = campaign.dmNoteFolders ?? []
  const notes = campaign.dmNotes ?? []
  const [activeFolderId, setActiveFolderId] = useState(null)
  const [expandedIds, setExpandedIds] = useState(new Set())

  const visibleNotes =
    activeFolderId === null ? notes : notes.filter((n) => n.folderId === activeFolderId)

  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function folderSelectedCount(folderId) {
    return notes.filter((n) => n.folderId === folderId && selectedIds.has(n.id)).length
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/40">
      <div className="bg-brand-mint-dark shadow-modal w-[480px] max-w-[95vw] max-h-[80vh] flex flex-col">
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base">
            Notes as Context
            {selectedIds.size > 0 && (
              <span className="ml-2 text-white/60 text-sm">({selectedIds.size} selected)</span>
            )}
          </h2>
          <button
            onClick={onDone}
            className="text-xs font-normal text-white opacity-70 hover:opacity-100 border border-white/30 hover:border-white/60 px-2 py-1 transition-all"
          >
            Done
          </button>
        </div>

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
          {folders.map((f) => {
            const count = folderSelectedCount(f.id)
            return (
              <button
                key={f.id}
                onClick={() => setActiveFolderId(f.id)}
                className={`shrink-0 px-3 py-1 text-xs font-normal border transition-colors ${
                  activeFolderId === f.id
                    ? 'bg-brand-forest text-white border-brand-forest'
                    : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                }`}
              >
                {f.name}
                {count > 0 && (
                  <span className="ml-1.5 bg-brand-rivulet text-white text-[10px] px-1">{count}</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {visibleNotes.length === 0 && (
            <p className="text-brand-ink/40 text-sm font-light py-4 text-center">No notes yet</p>
          )}
          {visibleNotes.map((note) => {
            const selected = selectedIds.has(note.id)
            const expanded = expandedIds.has(note.id)
            const hasMore = (note.body?.length ?? 0) > 80
            const excerpt = hasMore ? note.body.slice(0, 80) + '…' : note.body
            return (
              <div
                key={note.id}
                onClick={() => onToggle(note.id)}
                className={`bg-brand-mint p-3 cursor-pointer border-2 transition-colors ${
                  selected ? 'border-brand-rivulet' : 'border-transparent hover:border-brand-ink/15'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    {note.title && (
                      <p className="text-xs font-bold text-brand-ink mb-0.5">{note.title}</p>
                    )}
                    <p className="text-xs font-normal text-brand-ink/70">
                      {expanded ? note.body : excerpt}
                    </p>
                  </div>
                  {hasMore && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpand(note.id) }}
                      className="shrink-0 text-[10px] text-brand-ink/40 hover:text-brand-ink/60 transition-colors mt-0.5"
                    >
                      {expanded ? 'less' : 'more'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
