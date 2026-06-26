import { useState } from 'react'

export function NotesEditor({ folders, notes, onFoldersChange, onNotesChange }) {
  const [activeFolderId, setActiveFolderId] = useState(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [showNewNote, setShowNewNote] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const visibleNotes =
    activeFolderId === null ? notes : notes.filter((n) => n.folderId === activeFolderId)

  function createFolder() {
    const name = newFolderName.trim()
    if (!name) return
    const folder = { id: crypto.randomUUID(), name }
    onFoldersChange([...folders, folder])
    setNewFolderName('')
    setShowNewFolder(false)
    setActiveFolderId(folder.id)
  }

  function deleteFolder(folderId) {
    const nextFolders = folders.filter((f) => f.id !== folderId)
    const nextNotes = notes.map((n) => (n.folderId === folderId ? { ...n, folderId: null } : n))
    onFoldersChange(nextFolders)
    onNotesChange(nextNotes)
    if (activeFolderId === folderId) setActiveFolderId(null)
  }

  function addNote() {
    if (!newBody.trim() && !newTitle.trim()) return
    const note = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      body: newBody.trim(),
      folderId: activeFolderId ?? null,
      createdAt: Date.now(),
    }
    onNotesChange([...notes, note])
    setNewTitle('')
    setNewBody('')
    setShowNewNote(false)
  }

  function startEdit(note) {
    setEditingId(note.id)
    setEditTitle(note.title ?? '')
    setEditBody(note.body ?? '')
    setShowNewNote(false)
  }

  function saveEdit(note) {
    onNotesChange(
      notes.map((n) =>
        n.id === note.id ? { ...note, title: editTitle.trim(), body: editBody.trim() } : n
      )
    )
    setEditingId(null)
  }

  function deleteNote(noteId) {
    onNotesChange(notes.filter((n) => n.id !== noteId))
    setConfirmDeleteId(null)
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      {/* Folder tabs */}
      <div className="flex gap-1.5 flex-wrap items-center px-4">
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
              onClick={() => setActiveFolderId(f.id)}
              className={`pl-3 pr-6 py-1 text-xs font-normal border transition-colors ${
                activeFolderId === f.id
                  ? 'bg-brand-forest text-white border-brand-forest'
                  : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
              }`}
            >
              {f.name}
            </button>
            <button
              onClick={() => deleteFolder(f.id)}
              className="absolute top-0.5 right-0.5 w-4 h-4 text-white/80 text-[9px] opacity-0 group-hover/tab:opacity-100 transition-opacity flex items-center justify-center leading-none bg-brand-danger/70 hover:bg-brand-danger"
              title="Delete folder"
            >
              ×
            </button>
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
                if (e.key === 'Escape') {
                  setShowNewFolder(false)
                  setNewFolderName('')
                }
              }}
            />
            <button
              onClick={createFolder}
              className="text-xs text-brand-rivulet hover:text-brand-rivulet/70 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false)
                setNewFolderName('')
              }}
              className="text-xs text-brand-ink/40 hover:text-brand-ink/60 transition-colors"
            >
              ✕
            </button>
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

      {/* Note list */}
      <div className="px-4 flex flex-col gap-2">
        {visibleNotes.length === 0 && !showNewNote && (
          <p className="text-brand-ink opacity-40 text-sm font-light py-4 text-center">
            {notes.length === 0 ? 'No notes yet…' : 'No notes in this folder…'}
          </p>
        )}

        {visibleNotes.map((note) => (
          <div key={note.id} className="bg-brand-mint p-3 relative group/note">
            {editingId === note.id ? (
              <div className="flex flex-col gap-2">
                <input
                  className="bg-white border border-brand-ink/20 px-2 py-1 text-xs font-bold text-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-rivulet w-full"
                  placeholder="Title (optional)"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <textarea
                  autoFocus
                  rows={3}
                  className="bg-white border border-brand-ink/20 px-2 py-1 text-xs font-normal text-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-rivulet w-full resize-none"
                  placeholder="Notes…"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(note)}
                    className="text-xs text-brand-rivulet hover:text-brand-rivulet/70 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs text-brand-ink/40 hover:text-brand-ink/60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {note.title && (
                  <p className="text-xs font-bold text-brand-ink mb-1 pr-10">{note.title}</p>
                )}
                <p
                  className={`text-xs font-normal text-brand-ink whitespace-pre-wrap ${note.title ? '' : 'pr-10'}`}
                >
                  {note.body}
                </p>
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(note)}
                    className="px-1.5 py-0.5 text-xs font-normal text-brand-ink/50 hover:text-brand-ink border border-brand-ink/15 hover:border-brand-ink/35 transition-colors"
                    title="Edit note"
                  >
                    Edit
                  </button>
                  {confirmDeleteId === note.id ? (
                    <>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-xs font-normal text-brand-danger hover:text-brand-danger-dark transition-colors px-1"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-normal text-brand-ink/40 hover:text-brand-ink/60 transition-colors"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(note.id)}
                      className="px-1.5 py-0.5 text-xs font-normal text-brand-ink/50 hover:text-brand-danger border border-brand-ink/15 hover:border-brand-danger/40 transition-colors"
                      title="Delete note"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {showNewNote && (
          <div className="bg-brand-mint p-3 flex flex-col gap-2">
            <input
              className="bg-white border border-brand-ink/20 px-2 py-1 text-xs font-bold text-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-rivulet w-full"
              placeholder="Title (optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              autoFocus
              rows={3}
              className="bg-white border border-brand-ink/20 px-2 py-1 text-xs font-normal text-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-rivulet w-full resize-none"
              placeholder="Notes…"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowNewNote(false)
                  setNewTitle('')
                  setNewBody('')
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={addNote}
                className="text-xs text-brand-rivulet hover:text-brand-rivulet/70 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowNewNote(false)
                  setNewTitle('')
                  setNewBody('')
                }}
                className="text-xs text-brand-ink/40 hover:text-brand-ink/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {!showNewNote && (
        <div className="px-4">
          <button
            onClick={() => {
              setShowNewNote(true)
              setEditingId(null)
            }}
            className="w-full py-1.5 text-xs font-normal text-brand-rivulet border border-dashed border-brand-rivulet/30 hover:border-brand-rivulet transition-colors"
          >
            + Note
          </button>
        </div>
      )}
    </div>
  )
}

export default function UnitNotesModal({ unit, onUpdate, onClose }) {
  function handleFoldersChange(nextFolders) {
    onUpdate({ ...unit, noteFolders: nextFolders })
  }

  function handleNotesChange(nextNotes) {
    onUpdate({ ...unit, notes: nextNotes })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40">
      <div className="bg-brand-mint-dark shadow-modal w-96 flex flex-col max-h-[80vh]">
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base truncate">{unit.name}</h2>
          <button
            onClick={onClose}
            className="shrink-0 ml-3 text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <NotesEditor
            folders={unit.noteFolders ?? []}
            notes={unit.notes ?? []}
            onFoldersChange={handleFoldersChange}
            onNotesChange={handleNotesChange}
          />
        </div>
      </div>
    </div>
  )
}
