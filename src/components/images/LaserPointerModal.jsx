import { useState, useRef } from 'react'
import { dmUpdate } from '../../lib/campaign'

const DRAG_THRESHOLD = 5 // px — below this, drag tools do nothing

function getRenderedRect(container, img) {
  const { width: W, height: H } = container.getBoundingClientRect()
  const { naturalWidth: nW, naturalHeight: nH } = img
  if (!nW || !nH || !W || !H) return null
  const aspect = nW / nH
  const renderedW = W / H > aspect ? H * aspect : W
  const renderedH = W / H > aspect ? H : W / aspect
  return { offsetX: (W - renderedW) / 2, offsetY: (H - renderedH) / 2, renderedW, renderedH }
}

function positionMarker(m, r) {
  if (m.type === 'dot' || m.type === 'text') {
    return { ...m, px: r.offsetX + m.x * r.renderedW, py: r.offsetY + m.y * r.renderedH }
  }
  if (m.type === 'circle') {
    return { ...m, px: r.offsetX + m.x * r.renderedW, py: r.offsetY + m.y * r.renderedH, pr: m.r * r.renderedW }
  }
  if (m.type === 'square' || m.type === 'arrow') {
    return {
      ...m,
      px1: r.offsetX + m.x1 * r.renderedW, py1: r.offsetY + m.y1 * r.renderedH,
      px2: r.offsetX + m.x2 * r.renderedW, py2: r.offsetY + m.y2 * r.renderedH,
    }
  }
  return m
}

function MarkerShape({ m, onRemove }) {
  const stopDown = (e) => e.stopPropagation()
  const handle = (e) => { e.stopPropagation(); onRemove() }
  const clickProps = { onMouseDown: stopDown, onClick: handle, style: { cursor: 'pointer' } }
  const { type, text, px, py, pr, px1, py1, px2, py2 } = m

  if (type === 'dot') {
    return <circle cx={px} cy={py} r={8} fill="#ef4444" fillOpacity={0.9} {...clickProps} />
  }
  if (type === 'circle') {
    return <circle cx={px} cy={py} r={pr} fill="none" stroke="#ef4444" strokeWidth={3} {...clickProps} />
  }
  if (type === 'square') {
    return (
      <rect
        x={Math.min(px1, px2)} y={Math.min(py1, py2)}
        width={Math.abs(px2 - px1)} height={Math.abs(py2 - py1)}
        fill="none" stroke="#ef4444" strokeWidth={3} {...clickProps}
      />
    )
  }
  if (type === 'arrow') {
    const angle = Math.atan2(py2 - py1, px2 - px1)
    const headLen = 14
    const spread = Math.PI / 6
    const hx1 = px2 - headLen * Math.cos(angle - spread)
    const hy1 = py2 - headLen * Math.sin(angle - spread)
    const hx2 = px2 - headLen * Math.cos(angle + spread)
    const hy2 = py2 - headLen * Math.sin(angle + spread)
    return (
      <g stroke="#ef4444" strokeWidth={3} strokeLinecap="round" fill="none" {...clickProps}>
        <line x1={px1} y1={py1} x2={px2} y2={py2} />
        <polyline points={`${hx1},${hy1} ${px2},${py2} ${hx2},${hy2}`} />
      </g>
    )
  }
  if (type === 'text') {
    return (
      <text
        x={px} y={py} fill="white" stroke="#000" strokeWidth={3} paintOrder="stroke"
        fontSize={16} fontWeight="600" fontFamily="sans-serif" {...clickProps}
      >
        {text}
      </text>
    )
  }
  return null
}

export default function LaserPointerModal({ campaign, campaignCode, onClose }) {
  const display = campaign.combat?.display
  const markers = display?.markers ?? []
  const [tool, setTool] = useState('dot')
  const [imgLoaded, setImgLoaded] = useState(false)
  const [pendingText, setPendingText] = useState(null)
  const [drag, setDrag] = useState(null) // { type, startPX, startPY, currentPX, currentPY }
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  // Tracks mutable drag state without causing stale closures
  const dragRef = useRef(null) // { startX, startY, startNX, startNY, currentX, currentY, moved }

  if (!display?.url) return null

  function getCoords(e) {
    if (!containerRef.current || !imgRef.current || !imgLoaded) return null
    const containerRect = containerRef.current.getBoundingClientRect()
    const r = getRenderedRect(containerRef.current, imgRef.current)
    if (!r) return null
    const x = e.clientX - containerRect.left
    const y = e.clientY - containerRect.top
    return { x, y, nx: (x - r.offsetX) / r.renderedW, ny: (y - r.offsetY) / r.renderedH, r }
  }

  function handleMouseDown(e) {
    if (e.button !== 0 || pendingText) return
    const c = getCoords(e)
    if (!c || c.nx < 0 || c.nx > 1 || c.ny < 0 || c.ny > 1) return
    dragRef.current = { startX: c.x, startY: c.y, startNX: c.nx, startNY: c.ny, currentX: c.x, currentY: c.y, moved: false }
    if (tool === 'circle' || tool === 'square' || tool === 'arrow') {
      setDrag({ type: tool, startPX: c.x, startPY: c.y, currentPX: c.x, currentPY: c.y })
    }
  }

  function handleMouseMove(e) {
    if (!dragRef.current) return
    const c = getCoords(e)
    if (!c) return
    const dx = c.x - dragRef.current.startX
    const dy = c.y - dragRef.current.startY
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) dragRef.current.moved = true
    dragRef.current.currentX = c.x
    dragRef.current.currentY = c.y
    setDrag((d) => (d ? { ...d, currentPX: c.x, currentPY: c.y } : null))
  }

  async function saveMarker(marker) {
    const kept = marker.type === 'dot' ? markers.filter((m) => m.type !== 'dot') : markers
    await dmUpdate(campaignCode, { 'combat.display.markers': [...kept, marker] })
  }

  async function handleMouseUp(e) {
    const start = dragRef.current
    const currentDrag = drag
    dragRef.current = null
    setDrag(null)
    if (!start || pendingText) return

    if (tool === 'circle' && currentDrag) {
      const r = getRenderedRect(containerRef.current, imgRef.current)
      if (!r) return
      const dist = Math.hypot(start.currentX - start.startX, start.currentY - start.startY)
      if (dist < DRAG_THRESHOLD) return
      await saveMarker({ id: crypto.randomUUID(), type: 'circle', x: start.startNX, y: start.startNY, r: dist / r.renderedW })
      return
    }

    if ((tool === 'square' || tool === 'arrow') && currentDrag) {
      const r = getRenderedRect(containerRef.current, imgRef.current)
      if (!r) return
      const dist = Math.hypot(start.currentX - start.startX, start.currentY - start.startY)
      if (dist < DRAG_THRESHOLD) return
      await saveMarker({
        id: crypto.randomUUID(),
        type: tool,
        x1: start.startNX,
        y1: start.startNY,
        x2: Math.max(0, Math.min(1, (start.currentX - r.offsetX) / r.renderedW)),
        y2: Math.max(0, Math.min(1, (start.currentY - r.offsetY) / r.renderedH)),
      })
      return
    }

    if (start.moved) return // dragged with a click-only tool — ignore

    const c = getCoords(e)
    if (!c || c.nx < 0 || c.nx > 1 || c.ny < 0 || c.ny > 1) return

    if (tool === 'dot') {
      await saveMarker({ id: crypto.randomUUID(), type: 'dot', x: c.nx, y: c.ny })
    } else if (tool === 'text') {
      setPendingText({ x: c.nx, y: c.ny, px: c.x, py: c.y, value: '' })
    }
  }

  async function confirmText() {
    const label = pendingText?.value.trim()
    const pos = { x: pendingText.x, y: pendingText.y }
    setPendingText(null)
    if (!label) return
    await saveMarker({ id: crypto.randomUUID(), type: 'text', text: label, ...pos })
  }

  async function removeMarker(id) {
    await dmUpdate(campaignCode, { 'combat.display.markers': markers.filter((m) => m.id !== id) })
  }

  async function clearMarkers() {
    await dmUpdate(campaignCode, { 'combat.display.markers': [] })
  }

  function positioned() {
    if (!containerRef.current || !imgRef.current || !imgLoaded) return []
    const r = getRenderedRect(containerRef.current, imgRef.current)
    if (!r) return []
    return markers.map((m) => positionMarker(m, r))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 bg-black/70 px-3 py-2">
        {['dot', 'circle', 'square', 'arrow', 'text'].map((t) => (
          <button
            key={t}
            onClick={() => { setTool(t); setPendingText(null); setDrag(null); dragRef.current = null }}
            className={`px-3 py-1 text-xs font-normal capitalize transition-colors ${tool === t ? 'bg-red-600 text-white' : 'text-white/60 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
        {markers.length > 0 && (
          <>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button
              onClick={clearMarkers}
              className="px-3 py-1 text-xs font-normal text-white/40 hover:text-white/80 transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors text-lg z-10"
      >
        ✕
      </button>

      <div ref={containerRef} className="flex-1 relative">
        <img
          ref={imgRef}
          src={display.url}
          alt={display.label || ''}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          onLoad={() => setImgLoaded(true)}
        />
        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            cursor: pendingText ? 'default' : 'crosshair',
            pointerEvents: pendingText ? 'none' : 'all',
            userSelect: 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { dragRef.current = null; setDrag(null) }}
        >
          {positioned().map((m) => (
            <MarkerShape key={m.id} m={m} onRemove={() => removeMarker(m.id)} />
          ))}
          {drag?.type === 'circle' && (
            <circle
              cx={drag.startPX} cy={drag.startPY}
              r={Math.hypot(drag.currentPX - drag.startPX, drag.currentPY - drag.startPY)}
              fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3"
              style={{ pointerEvents: 'none' }}
            />
          )}
          {drag?.type === 'square' && (
            <rect
              x={Math.min(drag.startPX, drag.currentPX)} y={Math.min(drag.startPY, drag.currentPY)}
              width={Math.abs(drag.currentPX - drag.startPX)} height={Math.abs(drag.currentPY - drag.startPY)}
              fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3"
              style={{ pointerEvents: 'none' }}
            />
          )}
          {drag?.type === 'arrow' && (
            <line
              x1={drag.startPX} y1={drag.startPY} x2={drag.currentPX} y2={drag.currentPY}
              stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>

        {pendingText && (
          <div
            className="absolute z-20"
            style={{ left: pendingText.px, top: pendingText.py, transform: 'translate(-50%, -50%)' }}
          >
            <input
              autoFocus
              className="bg-black/80 text-white text-sm px-2 py-1 border border-white/40 outline-none min-w-32 placeholder-white/30"
              placeholder="Label…"
              value={pendingText.value}
              onChange={(e) => setPendingText((p) => ({ ...p, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmText()
                if (e.key === 'Escape') setPendingText(null)
              }}
              onBlur={() => setPendingText(null)}
            />
          </div>
        )}
      </div>

      {display.label && (
        <div className="px-6 py-3 bg-black/60">
          <p className="text-white font-light text-lg text-center">{display.label}</p>
        </div>
      )}
    </div>
  )
}
