import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

const INDEX_SECTIONS = [
  { key: 'arrival', label: 'Arrival' },
  { key: 'situation', label: 'Situation' },
  { key: 'plotHooks', label: 'Plot Hooks' },
]

function EditableField({ value, editMode, onChange, placeholder, rows = 5 }) {
  const [inlineEditing, setInlineEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editMode) {
    return (
      <textarea
        rows={rows}
        className="w-full bg-white border border-brand-ink/15 px-3 py-2 text-sm font-normal text-brand-ink focus:outline-none focus:border-brand-rivulet/50 resize-none font-mono leading-relaxed"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  if (inlineEditing) {
    return (
      <textarea
        autoFocus
        rows={rows}
        className="w-full bg-white border border-brand-rivulet/40 px-3 py-2 text-sm font-normal text-brand-ink focus:outline-none resize-none font-mono leading-relaxed"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setInlineEditing(false) }}
        onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value); setInlineEditing(false) } }}
      />
    )
  }

  return (
    <div
      className="cursor-text group/field relative min-h-8"
      onClick={() => { setDraft(value); setInlineEditing(true) }}
    >
      {value ? (
        <div className="note-prose text-brand-ink text-sm font-normal">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-brand-ink/25 text-sm font-light italic">Click to add…</p>
      )}
      <span className="absolute top-0 right-0 text-[9px] text-brand-ink/20 group-hover/field:text-brand-ink/40 transition-colors select-none">edit</span>
    </div>
  )
}

function PoiGrid({ pois, poiGridRows, poiGridCols, onGridChange, onPoiClick, onAddPoi }) {
  const n = pois.length
  const cols = poiGridCols ?? Math.max(2, Math.ceil(Math.sqrt(n + 2)))
  const rows = poiGridRows ?? Math.ceil((n + 2) / cols)
  const [dragId, setDragId] = useState(null)

  function poiAt(r, c) {
    return pois.find((p) => p.gridRow === r && p.gridCol === c) ?? null
  }

  function handleDrop(r, c) {
    if (dragId == null) return
    const dragged = pois.find((p) => p.id === dragId)
    if (!dragged) return
    const target = poiAt(r, c)
    const next = pois.map((p) => {
      if (p.id === dragId) return { ...p, gridRow: r, gridCol: c }
      if (target && p.id === target.id) return { ...p, gridRow: dragged.gridRow, gridCol: dragged.gridCol }
      return p
    })
    onGridChange(next)
    setDragId(null)
  }

  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ r, c, poi: poiAt(r, c) })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-brand-ink/40">{n} POI{n !== 1 ? 's' : ''}</span>
        <button
          onClick={onAddPoi}
          className="text-[10px] font-normal text-brand-rivulet border border-brand-rivulet/30 hover:border-brand-rivulet px-1.5 py-0.5 transition-colors"
        >
          + POI
        </button>
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cells.map(({ r, c, poi }) => (
          <div
            key={`${r}-${c}`}
            className={`aspect-square border transition-colors ${
              poi
                ? 'border-brand-forest/30 bg-brand-mint cursor-pointer hover:border-brand-forest hover:bg-brand-forest/5'
                : 'border-dashed border-brand-ink/12 bg-transparent hover:border-brand-ink/25'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(r, c)}
            onClick={() => poi && onPoiClick(poi)}
          >
            {poi && (
              <div
                className="w-full h-full p-1 flex flex-col justify-between"
                draggable
                onDragStart={(e) => { e.stopPropagation(); setDragId(poi.id) }}
                onDragEnd={() => setDragId(null)}
                onClick={(e) => { e.stopPropagation(); onPoiClick(poi) }}
              >
                <span className="text-[9px] text-brand-forest/60 font-bold">{poi.letter}</span>
                <p className="text-[9px] font-normal text-brand-ink text-center leading-tight truncate">{poi.name}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ClusterView({ cluster, onPoiClick, onBack, onUpdate, onDelete }) {
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState(cluster.name)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function updateField(key, value) {
    onUpdate({ ...cluster, [key]: value })
  }

  function updatePois(nextPois) {
    onUpdate({ ...cluster, pois: nextPois })
  }

  function addPoi() {
    const existing = cluster.pois ?? []
    const letter = String.fromCharCode(65 + existing.length)
    const n = existing.length
    const cols = cluster.poiGridCols ?? Math.max(2, Math.ceil(Math.sqrt(n + 3)))
    const newPoi = {
      id: crypto.randomUUID(),
      letter,
      name: `Location ${letter}`,
      gridRow: Math.floor(n / cols),
      gridCol: n % cols,
      description: '',
      encounters: '',
      whatIsHere: '',
      whoIsHere: '',
      quests: '',
    }
    onUpdate({ ...cluster, pois: [...existing, newPoi] })
  }

  function saveName() {
    if (editName.trim()) onUpdate({ ...cluster, name: editName.trim() })
    setEditMode(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Body: split layout */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* INDEX content — left/top */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 border-r border-brand-ink/8">
          {/* Cluster name — editable inline */}
          <div className="pb-1 border-b border-brand-ink/10 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              {editMode ? (
                <input
                  autoFocus
                  className="w-full bg-transparent text-brand-ink text-lg font-normal border-b border-brand-rivulet/40 focus:outline-none pb-0.5"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditName(cluster.name); setEditMode(false) } }}
                />
              ) : (
                <h3
                  className="text-lg font-normal text-brand-ink cursor-text hover:opacity-70 transition-opacity truncate"
                  onClick={() => setEditMode(true)}
                >
                  {cluster.name}
                </h3>
              )}
            </div>
            {confirmDelete ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-brand-ink/50">Delete?</span>
                <button onClick={() => onDelete(cluster.id)} className="text-xs text-brand-danger hover:text-brand-danger-dark transition-colors">Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-brand-ink/40 hover:text-brand-ink transition-colors">No</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[10px] text-brand-ink/20 hover:text-brand-danger transition-colors shrink-0"
                title="Delete location"
              >
                ✕
              </button>
            )}
          </div>
          {INDEX_SECTIONS.map((s) => (
            <div key={s.key}>
              <h4 className="text-xs font-bold text-brand-ink/50 uppercase tracking-wider mb-2 pb-1 border-b border-brand-ink/8">
                {s.label}
              </h4>
              <EditableField
                value={cluster[s.key] ?? ''}
                editMode={false}
                onChange={(v) => updateField(s.key, v)}
                placeholder={`${s.label}… (Markdown supported)`}
              />
            </div>
          ))}
        </div>

        {/* POI grid — right/bottom */}
        <div className="w-full md:w-56 shrink-0 overflow-y-auto px-3 py-4 bg-brand-mint/30">
          <PoiGrid
            pois={cluster.pois ?? []}
            poiGridRows={cluster.poiGridRows}
            poiGridCols={cluster.poiGridCols}
            onGridChange={updatePois}
            onPoiClick={onPoiClick}
            onAddPoi={addPoi}
          />
        </div>
      </div>
    </div>
  )
}
