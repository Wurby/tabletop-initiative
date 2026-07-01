import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Sparkles, Trash } from '../icons'
import { generateLocationImage } from './locationImageGen'

const SECTIONS = [
  { key: 'description', label: 'Description' },
  { key: 'encounters', label: 'Encounters' },
  { key: 'whatIsHere', label: "What's Here" },
  { key: 'whoIsHere', label: "Who's Here" },
  { key: 'quests', label: 'Quests' },
]

export default function PoiDetail({ poi, cluster, onUpdate, onBack, onDelete, campaign, campaignCode }) {
  const [activeSection, setActiveSection] = useState(null) // null = All
  const [editingSection, setEditingSection] = useState(null)
  const [draft, setDraft] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(poi.name)
  const [editLetter, setEditLetter] = useState(poi.letter)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState(null)

  async function handleGenerateImage() {
    setGeneratingImage(true)
    setImageError(null)
    try {
      const descriptionText = [poi.description, poi.whoIsHere, poi.whatIsHere].filter(Boolean).join(' ')
      const url = await generateLocationImage({
        campaignCode, campaign,
        name: `${cluster.name} — ${poi.name}`,
        descriptionText,
        type: 'point of interest',
      })
      onUpdate({ ...poi, imageUrl: url })
    } catch (err) {
      setImageError(err.message || 'Image generation failed.')
    } finally {
      setGeneratingImage(false)
    }
  }

  function startEdit(key) {
    setEditingSection(key)
    setDraft(poi[key] ?? '')
  }

  function saveEdit() {
    onUpdate({ ...poi, [editingSection]: draft })
    setEditingSection(null)
  }

  function cancelEdit() {
    setEditingSection(null)
  }

  function saveName() {
    onUpdate({ ...poi, name: editName.trim() || poi.name, letter: editLetter.trim() || poi.letter })
    setEditingName(false)
  }

  const visibleSections = activeSection ? SECTIONS.filter(s => s.key === activeSection) : SECTIONS

  return (
    <div className="flex flex-col h-full">
      {/* Identity row */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-brand-ink/10 shrink-0">
        {editingName ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              className="w-7 bg-transparent text-brand-ink text-sm text-center border-b border-brand-rivulet/40 focus:outline-none"
              value={editLetter}
              onChange={(e) => setEditLetter(e.target.value)}
            />
            <input
              autoFocus
              className="flex-1 bg-transparent text-brand-ink text-sm border-b border-brand-rivulet/40 focus:outline-none"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
            />
          </div>
        ) : (
          <h3
            className="flex-1 text-base font-normal text-brand-ink cursor-text hover:opacity-70 transition-opacity truncate"
            onClick={() => { setEditName(poi.name); setEditLetter(poi.letter); setEditingName(true) }}
          >
            <span className="text-brand-ink/50 mr-1">{poi.letter}</span>{poi.name}
          </h3>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-brand-ink/50">Delete "{poi.letter} — {poi.name}"?</span>
            <button onClick={() => onDelete(poi.id)} className="text-xs text-brand-danger hover:text-brand-danger-dark transition-colors">Yes</button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-brand-ink/40 hover:text-brand-ink transition-colors">No</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-brand-ink/30 hover:text-brand-danger transition-colors shrink-0"
            title="Delete POI"
          >
            <Trash size={11} />
          </button>
        )}
      </div>

      {/* POI image */}
      {poi.imageUrl ? (
        <div className="relative group/img shrink-0">
          <img src={poi.imageUrl} alt={poi.name} className="w-full h-36 object-cover" />
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage}
            className="absolute bottom-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-white bg-brand-ink/60 hover:bg-brand-ink/80 px-2 py-1 disabled:opacity-40"
          >
            <Sparkles size={9} /> {generatingImage ? 'Generating…' : 'Regenerate'}
          </button>
        </div>
      ) : (
        <div className="px-5 py-2 flex items-center gap-2 shrink-0">
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage}
            className="flex items-center gap-1.5 text-xs font-normal text-brand-ink/50 border border-brand-ink/15 hover:border-brand-ink/30 hover:text-brand-ink px-2.5 py-1.5 transition-colors disabled:opacity-40"
          >
            <Sparkles size={11} /> {generatingImage ? 'Generating…' : 'Generate Image'}
          </button>
          {imageError && <p className="text-brand-danger text-[10px]">{imageError}</p>}
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-1.5 px-5 pt-3 pb-2 shrink-0 flex-wrap border-b border-brand-ink/8">
        <button
          onClick={() => setActiveSection(null)}
          className={`px-3 py-1 text-xs font-normal border transition-colors ${
            activeSection === null
              ? 'bg-brand-forest text-white border-brand-forest'
              : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
          }`}
        >
          All
        </button>
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => { setActiveSection(s.key); setEditingSection(null) }}
            className={`px-3 py-1 text-xs font-normal border transition-colors ${
              activeSection === s.key
                ? 'bg-brand-forest text-white border-brand-forest'
                : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
        {visibleSections.map((s) => (
          <div key={s.key}>
            {activeSection === null && (
              <h4 className="text-xs font-bold text-brand-ink/50 uppercase tracking-wider mb-2 pb-1 border-b border-brand-ink/8">
                {s.label}
              </h4>
            )}

            {editingSection === s.key ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  rows={activeSection ? 12 : 6}
                  className="w-full bg-white border border-brand-rivulet/40 px-3 py-2 text-sm font-normal text-brand-ink focus:outline-none resize-none font-mono leading-relaxed"
                  placeholder={`${s.label}… (Markdown supported)`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit() }}
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveEdit}
                    className="text-xs font-normal text-brand-rivulet border border-brand-rivulet/30 hover:border-brand-rivulet px-2 py-0.5 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-xs text-brand-ink/40 hover:text-brand-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-text group/section relative min-h-8"
                onClick={() => startEdit(s.key)}
              >
                {poi[s.key] ? (
                  <div className="note-prose text-brand-ink text-sm font-normal">
                    <ReactMarkdown>{poi[s.key]}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-brand-ink/25 text-sm font-light italic">Click to add…</p>
                )}
                <span className="absolute top-0 right-0 text-[9px] text-brand-ink/20 group-hover/section:text-brand-ink/40 transition-colors select-none">
                  edit
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
