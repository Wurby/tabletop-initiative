import { useState, useRef } from 'react'

function positionMarker(m, r) {
  if (m.type === 'dot' || m.type === 'text') {
    return { ...m, px: r.offsetX + m.x * r.renderedW, py: r.offsetY + m.y * r.renderedH }
  }
  if (m.type === 'circle') {
    return { ...m, px: r.offsetX + m.x * r.renderedW, py: r.offsetY + m.y * r.renderedH, pr: m.r * r.renderedW }
  }
  if (m.type === 'square') {
    return {
      ...m,
      px1: r.offsetX + m.x1 * r.renderedW, py1: r.offsetY + m.y1 * r.renderedH,
      px2: r.offsetX + m.x2 * r.renderedW, py2: r.offsetY + m.y2 * r.renderedH,
    }
  }
  if (m.type === 'arrow') {
    return {
      ...m,
      px1: r.offsetX + m.x1 * r.renderedW, py1: r.offsetY + m.y1 * r.renderedH,
      px2: r.offsetX + m.x2 * r.renderedW, py2: r.offsetY + m.y2 * r.renderedH,
    }
  }
  return m
}

function MarkerShape({ m }) {
  const { type, text, px, py, pr, px1, py1, px2, py2 } = m
  if (type === 'dot') return <circle cx={px} cy={py} r={8} fill="#ef4444" fillOpacity={0.9} />
  if (type === 'circle') return <circle cx={px} cy={py} r={pr} fill="none" stroke="#ef4444" strokeWidth={3} />
  if (type === 'square') {
    return (
      <rect
        x={Math.min(px1, px2)} y={Math.min(py1, py2)}
        width={Math.abs(px2 - px1)} height={Math.abs(py2 - py1)}
        fill="none" stroke="#ef4444" strokeWidth={3}
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
      <g stroke="#ef4444" strokeWidth={3} strokeLinecap="round" fill="none">
        <line x1={px1} y1={py1} x2={px2} y2={py2} />
        <polyline points={`${hx1},${hy1} ${px2},${py2} ${hx2},${hy2}`} />
      </g>
    )
  }
  if (type === 'text') {
    return (
      <text
        x={px} y={py} fill="white" stroke="#000" strokeWidth={3} paintOrder="stroke"
        fontSize={16} fontWeight="600" fontFamily="sans-serif"
      >
        {text}
      </text>
    )
  }
  return null
}

export default function ImageModal({ campaign, onClose }) {
  const display = campaign.combat?.display
  const markers = display?.markers ?? []
  const [imgLoaded, setImgLoaded] = useState(false)
  const containerRef = useRef(null)
  const imgRef = useRef(null)

  if (display?.type !== 'image' || !display.url) return null

  function positioned() {
    if (!containerRef.current || !imgRef.current || !imgLoaded) return []
    const containerRect = containerRef.current.getBoundingClientRect()
    const { left, top, width, height } = imgRef.current.getBoundingClientRect()
    const r = { offsetX: left - containerRect.left, offsetY: top - containerRect.top, renderedW: width, renderedH: height }
    return markers.map((m) => positionMarker(m, r))
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors text-lg z-10"
        >
          ✕
        </button>
      )}
      <img
        ref={imgRef}
        src={display.url}
        alt={display.label || ''}
        className="max-w-full max-h-full object-contain"
        onLoad={() => setImgLoaded(true)}
      />
      {imgLoaded && markers.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {positioned().map((m) => (
            <MarkerShape key={m.id} m={m} />
          ))}
        </svg>
      )}
      {display.label && (
        <div className="absolute bottom-0 left-0 right-0 px-6 py-3 bg-black/60">
          <p className="text-white font-light text-lg text-center">{display.label}</p>
        </div>
      )}
    </div>
  )
}
