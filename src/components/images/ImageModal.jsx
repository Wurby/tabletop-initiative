export default function ImageModal({ campaign, onClose }) {
  const display = campaign.combat?.display
  if (display?.type !== 'image' || !display.url) return null

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors text-lg z-10"
        >
          ✕
        </button>
      )}
      <img
        src={display.url}
        alt={display.label || ''}
        className="max-w-full max-h-full object-contain"
      />
      {display.label && (
        <div className="absolute bottom-0 left-0 right-0 px-6 py-3 bg-black/60">
          <p className="text-white font-light text-lg text-center">{display.label}</p>
        </div>
      )}
    </div>
  )
}
