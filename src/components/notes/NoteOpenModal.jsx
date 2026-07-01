import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function NoteOpenModal({ note, onUpdate, onDelete, onClose }) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title ?? '')
  const [editBody, setEditBody] = useState(note.body ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSave() {
    onUpdate({ ...note, title: editTitle.trim(), body: editBody.trim() })
    setEditing(false)
  }

  function handleDelete() {
    onDelete(note.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/50">
      <div className="bg-white shadow-modal w-[1120px] max-w-[95vw] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-brand-forest px-5 py-3 flex items-center justify-between shrink-0 gap-4">
          {editing ? (
            <input
              autoFocus
              className="flex-1 bg-white/15 border border-white/30 px-2 py-1 text-white font-normal text-sm focus:outline-none focus:border-white/60 placeholder-white/50"
              placeholder="Title (optional)"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          ) : (
            <h2 className="text-white font-normal text-base truncate flex-1">
              {note.title || 'Note'}
            </h2>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="text-xs font-normal text-white border border-white/40 hover:border-white px-3 py-1 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditTitle(note.title ?? ''); setEditBody(note.body ?? '') }}
                  className="text-xs font-normal text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-normal text-white/70 hover:text-white border border-white/30 hover:border-white/60 px-3 py-1 transition-colors"
                >
                  Edit
                </button>
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/70">Delete?</span>
                    <button onClick={handleDelete} className="text-xs font-normal text-brand-danger bg-white px-2 py-0.5 hover:bg-white/90 transition-colors">Yes</button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs font-normal text-white/60 hover:text-white transition-colors">No</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs font-normal text-white/50 hover:text-brand-danger hover:border-brand-danger/50 border border-white/20 px-2 py-1 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6">
          {editing ? (
            <textarea
              rows={20}
              className="w-full bg-transparent border border-brand-ink/15 px-3 py-2 text-sm font-normal text-brand-ink focus:outline-none focus:border-brand-rivulet/50 resize-none font-mono leading-relaxed"
              placeholder="Notes… (Markdown supported)"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setEditing(false); setEditBody(note.body ?? '') } }}
            />
          ) : (
            <div className="note-prose text-brand-ink text-sm font-normal">
              <ReactMarkdown>{note.body || ''}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
