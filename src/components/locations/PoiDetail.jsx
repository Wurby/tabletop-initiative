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

export default function PoiDetail({ poi, cluster, onUpdate, onBack }) {
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState({ ...poi })
  const [editName, setEditName] = useState(poi.name)
  const [editLetter, setEditLetter] = useState(poi.letter)
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
      {/* POI header */}
      <div className="bg-brand-forest-dark px-4 py-2 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white/50 hover:text-white text-xs transition-colors shrink-0">
          ← Back
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {editMode ? (
            <>
              <input
                className="w-8 bg-white/15 border border-white/30 text-white text-xs text-center px-1 py-0.5 focus:outline-none"
                value={editLetter}
                onChange={(e) => setEditLetter(e.target.value)}
              />
              <input
                className="flex-1 bg-white/15 border border-white/30 text-white text-sm font-normal px-2 py-0.5 focus:outline-none"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </>
          ) : (
            <h3 className="text-white font-normal text-sm truncate">
              <span className="opacity-60 mr-1">{poi.letter}</span>{poi.name}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editMode ? (
            <>
              <button onClick={saveEditMode} className="text-xs font-normal text-white border border-white/40 hover:border-white px-2 py-0.5 transition-colors">Save</button>
              <button onClick={cancelEditMode} className="text-xs text-white/50 hover:text-white transition-colors">Cancel</button>
            </>
          ) : (
            <button
              onClick={() => { setDraft({ ...poi }); setEditName(poi.name); setEditLetter(poi.letter); setEditMode(true) }}
              className="text-xs font-normal text-white/60 hover:text-white border border-white/20 hover:border-white/50 px-2 py-0.5 transition-colors"
            >
              Edit All
            </button>
          )}
        </div>
      </div>

      {/* Jump nav */}
      <div className="flex gap-0 border-b border-brand-ink/10 shrink-0 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => jumpTo(s.key)}
            className="shrink-0 px-3 py-1.5 text-[10px] font-normal text-brand-ink/50 hover:text-brand-ink hover:bg-brand-ink/5 transition-colors border-r border-brand-ink/10 last:border-0"
          >
            {s.label}
          </button>
        ))}
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
