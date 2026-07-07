import { useState } from 'react'
import { pushImageToTable, clearTableDisplay } from '../../lib/campaign'
import { Pen } from '../icons'
import LaserPointerModal from './LaserPointerModal'

export default function ImagePreviewModal({ url, label, campaign, campaignCode, onClose }) {
  const [showPointer, setShowPointer] = useState(false)
  const display = campaign?.combat?.display
  const isLive = display?.type === 'image' && display?.url === url

  async function handleShowToTable() {
    await pushImageToTable(campaignCode, url, label)
  }

  async function handleClearFromTable() {
    await clearTableDisplay(campaignCode)
  }

  if (showPointer) {
    return (
      <LaserPointerModal campaign={campaign} campaignCode={campaignCode} onClose={() => setShowPointer(false)} />
    )
  }

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors text-lg z-10"
      >
        ✕
      </button>
      <img
        src={url}
        alt={label || ''}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <div
        className="absolute bottom-0 left-0 right-0 px-6 py-3 bg-black/60 flex items-center justify-between gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {label ? <p className="text-white font-light text-lg truncate">{label}</p> : <span />}
        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            <>
              <button
                onClick={() => setShowPointer(true)}
                className="flex items-center gap-1.5 text-xs font-normal text-white border border-white/40 hover:border-white px-3 py-1.5 transition-colors"
              >
                <Pen size={11} /> Add Pointer / Labels
              </button>
              <button
                onClick={handleClearFromTable}
                className="text-xs font-normal text-white/60 hover:text-white transition-colors"
              >
                Clear from table
              </button>
            </>
          )}
          {campaignCode && (
            <button
              onClick={handleShowToTable}
              disabled={isLive}
              className="shrink-0 text-xs font-normal text-white border border-white/40 hover:border-white px-3 py-1.5 transition-colors disabled:opacity-60 disabled:hover:border-white/40"
            >
              {isLive ? 'Shown on table ✓' : 'Show to Table'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
