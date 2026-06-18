import { useState, useRef } from 'react'
import { dmUpdate } from '../../lib/campaign'

const TOOLS = ['dot', 'circle', 'square', 'text']

function getRenderedRect(container, img) {
  const { width: W, height: H } = container.getBoundingClientRect()
  const { naturalWidth: nW, naturalHeight: nH } = img
  if (!nW || !nH || !W || !H) return null
  const aspect = nW / nH
  const renderedW = W / H > aspect ? H * aspect : W
  const renderedH = W / H > aspect ? H : W / aspect
  return {
    offsetX: (W - renderedW) / 2,
    offsetY: (H - renderedH) / 2,
    renderedW,
    renderedH,
  }
}

function MarkerShape({ type, text, x, y, onRemove }) {
  const handle = (e) => { e.stopPropagation(); onRemove() }
  const outline = { fill: 'none', stroke: '#ef4444', strokeWidth: 3, style: { cursor: 'pointer' }, onClick: handle }
  if (type === 'dot') {
    return <circle cx={x} cy={y} r={10} fill="#ef4444" fillOpacity={0.9} style={{ cursor: 'pointer' }} onClick={handle} />
  }
  if (type === 'circle') {
    return <circle cx={x} cy={y} r={35} {...outline} />
  }
  if (type === 'square') {
    return <rect x={x - 27} y={y - 27} width={54} height={54} {...outline} />
  }
  if (type === 'text') {
    return (
      <text
        x={x} y={y}
        fill="white" stroke="#000" strokeWidth={4} paintOrder="stroke"
        fontSize={20} fontWeight="600" fontFamily="sans-serif"
        style={{ cursor: 'pointer' }}
        onClick={handle}
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
  const [pendingText, setPendingText] = useState(null) // { x, y, px, py, value }
  const containerRef = useRef(null)
  const imgRef = useRef(null)

  if (!display?.url) return null

  function positioned() {
    if (!containerRef.current || !imgRef.current || !imgLoaded) return []
    const r = getRenderedRect(containerRef.current, imgRef.current)
    if (!r) return []
    return markers.map((m) => ({
      ...m,
      px: r.offsetX + m.x * r.renderedW,
      py: r.offsetY + m.y * r.renderedH,
    }))
  }

  async function handleClick(e) {
    if (!containerRef.current || !imgRef.current || !imgLoaded) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const r = getRenderedRect(containerRef.current, imgRef.current)
    if (!r) return
    const x = (e.clientX - containerRect.left - r.offsetX) / r.renderedW
    const y = (e.clientY - containerRect.top - r.offsetY) / r.renderedH
    if (x < 0 || x > 1 || y < 0 || y > 1) return
    if (tool === 'text') {
      setPendingText({ x, y, px: e.clientX - containerRect.left, py: e.clientY - containerRect.top, value: '' })
      return
    }
    await dmUpdate(campaignCode, {
      'combat.display.markers': [...markers, { id: crypto.randomUUID(), type: tool, x, y }],
    })
  }

  async function confirmText() {
    const label = pendingText?.value.trim()
    setPendingText(null)
    if (!label) return
    await dmUpdate(campaignCode, {
      'combat.display.markers': [
        ...markers,
        { id: crypto.randomUUID(), type: 'text', text: label, x: pendingText.x, y: pendingText.y },
      ],
    })
  }

  async function removeMarker(id) {
    await dmUpdate(campaignCode, {
      'combat.display.markers': markers.filter((m) => m.id !== id),
    })
  }

  async function clearMarkers() {
    await dmUpdate(campaignCode, { 'combat.display.markers': [] })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 bg-black/70 px-3 py-2">
        {TOOLS.map((t) => (
          <button
            key={t}
            onClick={() => { setTool(t); setPendingText(null) }}
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
          style={{ cursor: pendingText ? 'default' : 'crosshair', pointerEvents: pendingText ? 'none' : 'all' }}
          onClick={handleClick}
        >
          {positioned().map((m) => (
            <MarkerShape key={m.id} type={m.type} text={m.text} x={m.px} y={m.py} onRemove={() => removeMarker(m.id)} />
          ))}
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
