import { useState } from 'react'
import { Sparkles } from '../icons'

function defaultGridDims(n) {
  const slots = n + 2
  const cols = Math.max(2, Math.ceil(Math.sqrt(slots)))
  const rows = Math.ceil(slots / cols)
  return { rows, cols }
}

export default function ClusterGrid({ clusters, gridRows, gridCols, onGridChange, onClusterClick, onAddCluster, onAddBlankCluster }) {
  const n = clusters.length
  const dims = defaultGridDims(n)
  const rows = gridRows ?? dims.rows
  const cols = gridCols ?? dims.cols

  const [dragId, setDragId] = useState(null)
  const [editingDims, setEditingDims] = useState(false)
  const [draftRows, setDraftRows] = useState(String(rows))
  const [draftCols, setDraftCols] = useState(String(cols))

  function clusterAt(r, c) {
    return clusters.find((cl) => cl.gridRow === r && cl.gridCol === c) ?? null
  }

  function handleDrop(r, c) {
    if (dragId == null) return
    const dragged = clusters.find((cl) => cl.id === dragId)
    if (!dragged) return
    const target = clusterAt(r, c)

    let next = clusters.map((cl) => {
      if (cl.id === dragId) return { ...cl, gridRow: r, gridCol: c }
      if (target && cl.id === target.id) return { ...cl, gridRow: dragged.gridRow, gridCol: dragged.gridCol }
      return cl
    })
    onGridChange(next)
    setDragId(null)
  }

  function saveDims() {
    const r = Math.max(1, Number(draftRows) || rows)
    const c = Math.max(1, Number(draftCols) || cols)
    onGridChange(clusters, r, c)
    setEditingDims(false)
  }

  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ r, c, cluster: clusterAt(r, c) })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Grid controls */}
      <div className="flex items-center justify-between px-4">
        <span className="text-xs text-brand-ink/40 font-normal">{n} cluster{n !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          {editingDims ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-brand-ink/50">Rows</span>
              <input
                className="w-8 text-center text-xs border border-brand-ink/20 bg-white focus:outline-none px-1 py-0.5"
                value={draftRows}
                onChange={(e) => setDraftRows(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveDims(); if (e.key === 'Escape') setEditingDims(false) }}
              />
              <span className="text-[10px] text-brand-ink/50">Cols</span>
              <input
                className="w-8 text-center text-xs border border-brand-ink/20 bg-white focus:outline-none px-1 py-0.5"
                value={draftCols}
                onChange={(e) => setDraftCols(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveDims(); if (e.key === 'Escape') setEditingDims(false) }}
              />
              <button onClick={saveDims} className="text-[10px] text-brand-rivulet hover:text-brand-rivulet-dark transition-colors">Save</button>
              <button onClick={() => setEditingDims(false)} className="text-[10px] text-brand-ink/40 hover:text-brand-ink/60 transition-colors">✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setDraftRows(String(rows)); setDraftCols(String(cols)); setEditingDims(true) }}
              className="text-[10px] text-brand-ink/30 hover:text-brand-ink/60 transition-colors"
            >
              {rows}×{cols}
            </button>
          )}
          <button
            onClick={onAddCluster}
            className="text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark px-2 py-0.5 transition-colors flex items-center gap-1"
          >
            <Sparkles size={15} /> New
          </button>
          {onAddBlankCluster && (
            <button
              onClick={onAddBlankCluster}
              className="text-xs font-normal text-brand-ink/40 hover:text-brand-ink/70 border border-brand-ink/15 hover:border-brand-ink/30 px-2 py-0.5 transition-colors"
            >
              + Blank
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div
        className="px-4 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cells.map(({ r, c, cluster }) => (
          <div
            key={`${r}-${c}`}
            className={`aspect-square border transition-colors ${
              cluster
                ? 'border-brand-forest/30 bg-brand-mint cursor-pointer hover:border-brand-forest hover:bg-brand-forest/5'
                : 'border-dashed border-brand-ink/15 bg-transparent hover:border-brand-ink/30'
            } ${dragId && !cluster ? 'border-brand-rivulet/30 bg-brand-rivulet/5' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(r, c)}
            onClick={() => cluster && onClusterClick(cluster)}
          >
            {cluster ? (
              <div
                className="w-full h-full p-2 flex flex-col justify-between"
                draggable
                onDragStart={(e) => { e.stopPropagation(); setDragId(cluster.id) }}
                onDragEnd={() => setDragId(null)}
                onClick={(e) => { e.stopPropagation(); onClusterClick(cluster) }}
              >
                <div className="w-full h-1 bg-brand-forest/40" />
                <p className="text-xs font-normal text-brand-ink text-center leading-tight truncate px-1">
                  {cluster.name}
                </p>
                <p className="text-[9px] text-brand-ink/40 text-center">
                  {(cluster.pois ?? []).length} POI{(cluster.pois ?? []).length !== 1 ? 's' : ''}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
