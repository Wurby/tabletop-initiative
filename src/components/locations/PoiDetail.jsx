import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

const SECTIONS = [
  { key: 'description', label: 'Description' },
  { key: 'encounters', label: 'Encounters' },
  { key: 'whatIsHere', label: "What's Here" },
  { key: 'whoIsHere', label: 'Who\'s Here' },
  { key: 'quests', label: 'Quests' },
]

function EditableSection({ sectionKey, value, editMode, onSave }) {
  const [inlineEditing, setInlineEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  // In full edit mode, parent controls the textarea
  if (editMode) {
    return (
      <textarea
        rows={8}
        className="w-full bg-white border border-brand-ink/15 px-3 py-2 text-sm font-normal text-brand-ink focus:outline-none focus:border-brand-rivulet/50 resize-none font-mono leading-relaxed"
        placeholder={`${SECTIONS.find(s => s.key === sectionKey)?.label ?? sectionKey}… (Markdown supported)`}
        value={value}
        onChange={(e) => onSave(e.target.value)}
      />
    )
  }

  if (inlineEditing) {
    return (
      <textarea
        autoFocus
        rows={6}
        className="w-full bg-white border border-brand-rivulet/40 px-3 py-2 text-sm font-normal text-brand-ink focus:outline-none resize-none font-mono leading-relaxed"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setInlineEditing(false) }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setDraft(value); setInlineEditing(false) }
        }}
      />
    )
  }

  return (
    <div
      className="cursor-text group/section relative min-h-8"
      onClick={() => { setDraft(value); setInlineEditing(true) }}
      title="Click to edit"
    >
      {value ? (
        <div className="note-prose text-brand-ink text-sm font-normal">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-brand-ink/25 text-sm font-light italic">Click to add…</p>
      )}
      <span className="absolute top-0 right-0 text-[9px] text-brand-ink/20 group-hover/section:text-brand-ink/40 transition-colors select-none">
        edit
      </span>
    </div>
  )
}

export default function PoiDetail({ poi, cluster, onUpdate, onBack, onDelete }) {
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState({ ...poi })
  const [editName, setEditName] = useState(poi.name)
  const [editLetter, setEditLetter] = useState(poi.letter)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const sectionRefs = useRef({})

  function jumpTo(key) {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function updateField(key, value) {
    if (editMode) {
      setDraft((d) => ({ ...d, [key]: value }))
    } else {
      onUpdate({ ...poi, [key]: value })
    }
  }

  function saveEditMode() {
    onUpdate({ ...draft, name: editName.trim() || poi.name, letter: editLetter.trim() || poi.letter })
    setEditMode(false)
  }

  function cancelEditMode() {
    setDraft({ ...poi })
    setEditName(poi.name)
    setEditLetter(poi.letter)
    setEditMode(false)
  }

  const data = editMode ? draft : poi

  return (
    <div className="flex flex-col h-full">
      {/* Jump nav + controls */}
      <div className="flex items-center border-b border-brand-ink/10 shrink-0 overflow-x-auto">
        {/* POI identity */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-r border-brand-ink/10 shrink-0">
          {editMode ? (
            <>
              <input
                className="w-6 bg-transparent text-brand-ink text-xs text-center border-b border-brand-rivulet/40 focus:outline-none"
                value={editLetter}
                onChange={(e) => setEditLetter(e.target.value)}
              />
              <input
                className="bg-transparent text-brand-ink text-xs border-b border-brand-rivulet/40 focus:outline-none w-28"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </>
          ) : (
            <span className="text-xs font-normal text-brand-ink/60">
              <span className="font-bold mr-0.5">{poi.letter}</span>{poi.name}
            </span>
          )}
        </div>
        {/* Section jumps */}
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => jumpTo(s.key)}
            className="shrink-0 px-3 py-1.5 text-[10px] font-normal text-brand-ink/50 hover:text-brand-ink hover:bg-brand-ink/5 transition-colors border-r border-brand-ink/10"
          >
            {s.label}
          </button>
        ))}
        {/* Edit controls — pushed right */}
        <div className="ml-auto border-l border-brand-ink/10 shrink-0 flex">
          {confirmDelete ? (
            <>
              <span className="px-3 py-1.5 text-[10px] text-brand-ink/50 border-r border-brand-ink/10">Delete "{poi.letter} — {poi.name}"?</span>
              <button onClick={() => onDelete(poi.id)} className="px-3 py-1.5 text-[10px] font-normal text-brand-danger hover:bg-brand-ink/5 transition-colors border-r border-brand-ink/10">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-[10px] font-normal text-brand-ink/40 hover:text-brand-ink hover:bg-brand-ink/5 transition-colors">No</button>
            </>
          ) : editMode ? (
            <>
              <button onClick={saveEditMode} className="px-3 py-1.5 text-[10px] font-normal text-brand-rivulet hover:bg-brand-ink/5 transition-colors border-r border-brand-ink/10">Save</button>
              <button onClick={cancelEditMode} className="px-3 py-1.5 text-[10px] font-normal text-brand-ink/40 hover:text-brand-ink hover:bg-brand-ink/5 transition-colors">Cancel</button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setDraft({ ...poi }); setEditName(poi.name); setEditLetter(poi.letter); setEditMode(true) }}
                className="px-3 py-1.5 text-[10px] font-normal text-brand-ink/40 hover:text-brand-ink hover:bg-brand-ink/5 transition-colors border-r border-brand-ink/10"
              >
                Edit All
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 text-[10px] text-brand-ink/20 hover:text-brand-danger transition-colors"
                title="Delete POI"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-6">
        {SECTIONS.map((s) => (
          <div key={s.key} ref={(el) => (sectionRefs.current[s.key] = el)}>
            <h4 className="text-xs font-bold text-brand-ink/50 uppercase tracking-wider mb-2 pb-1 border-b border-brand-ink/8">
              {s.label}
            </h4>
            <EditableSection
              sectionKey={s.key}
              value={data[s.key] ?? ''}
              editMode={editMode}
              onSave={(v) => updateField(s.key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
