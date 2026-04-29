import { useState } from 'react'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useToast } from '../../lib/toast'

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function SessionLogModal({ campaign, campaignCode, onClose }) {
  const showError = useToast()
  const logs = [...(campaign.sessionLogs ?? [])].reverse()
  const [confirmClear, setConfirmClear] = useState(false)

  async function handleClearAll() {
    try {
      await updateDoc(doc(db, 'campaigns', campaignCode), {
        sessionLogs: [],
        'combat.lastSplit': deleteField(),
      })
      setConfirmClear(false)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40">
      <div className="bg-brand-mint-dark shadow-modal w-80 max-h-[80vh] flex flex-col">
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base">Session Log</h2>
          <div className="flex items-center gap-3">
            {logs.length > 0 && !confirmClear && (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-white/50 hover:text-white text-xs font-normal transition-colors"
              >
                Clear all
              </button>
            )}
            {confirmClear && (
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-xs font-normal">Clear all?</span>
                <button
                  onClick={handleClearAll}
                  className="text-xs font-normal text-white bg-brand-danger px-2 py-0.5 hover:bg-brand-danger-dark transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs font-normal text-white/60 hover:text-white transition-colors"
                >
                  No
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {logs.length === 0 && (
            <p className="text-brand-ink opacity-40 font-light text-sm py-8 text-center">
              No sessions logged yet
            </p>
          )}
          {logs.map((log) => (
            <div
              key={log.id}
              className="px-4 py-3 border-b border-brand-mint flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-brand-ink/50 text-xs">{formatDate(log.clearedAt)}</span>
                <span className="text-brand-ink text-sm font-normal">
                  {log.totalXp.toLocaleString()} XP
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-ink/50 text-xs">{log.partySize} players</span>
                <span className="text-brand-forest font-light">
                  {log.xpPerMember.toLocaleString()} each
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
