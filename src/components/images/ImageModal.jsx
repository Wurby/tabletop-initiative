import { useState, useRef } from 'react'

function MarkerShape({ type, text, x, y }) {
  if (type === 'dot') return <circle cx={x} cy={y} r={10} fill="#ef4444" fillOpacity={0.9} />
  if (type === 'circle') return <circle cx={x} cy={y} r={35} fill="none" stroke="#ef4444" strokeWidth={3} />
  if (type === 'square') return <rect x={x - 27} y={y - 27} width={54} height={54} fill="none" stroke="#ef4444" strokeWidth={3} />
  if (type === 'text') {
    return (
      <text
        x={x} y={y}
        fill="white" stroke="#000" strokeWidth={4} paintOrder="stroke"
        fontSize={20} fontWeight="600" fontFamily="sans-serif"
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
    return markers.map((m) => ({
      ...m,
      px: left - containerRect.left + m.x * width,
      py: top - containerRect.top + m.y * height,
    }))
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
            <MarkerShape key={m.id} type={m.type} text={m.text} x={m.px} y={m.py} />
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
