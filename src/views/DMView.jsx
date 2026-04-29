import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useToast } from '../lib/toast'
import { dmUpdate } from '../lib/campaign'
import InitiativeTracker from '../components/initiative/InitiativeTracker'
import PartyModal from '../components/party/PartyModal'
import Graveyard from '../components/graveyard/Graveyard'
import SessionLogModal from '../components/session/SessionLogModal'
import SplitModal from '../components/session/SplitModal'
import ImageLibrary from '../components/images/ImageLibrary'
import AdminModal from '../components/admin/AdminModal'
import { Lock, LockOpen } from '../components/icons'

export default function DMView({ campaign, campaignCode, onLeave }) {
  const showError = useToast()
  const [partyOpen, setPartyOpen] = useState(false)
  const [sessionLogOpen, setSessionLogOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const locked = campaign.meta?.locked ?? false

  async function handleToggleLock() {
    setLockDialogOpen(false)
    try {
      await dmUpdate(campaignCode, { 'meta.locked': !locked })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  const lastSplit = campaign.combat?.lastSplit
  const tableError = campaign.combat?.tableError
  const [shownAt, setShownAt] = useState(lastSplit?.clearedAt ?? null)
  const [showSplitModal, setShowSplitModal] = useState(false)

  useEffect(() => {
    if (!tableError) return
    showError(`Table: ${tableError}`)
    updateDoc(doc(db, 'campaigns', campaignCode), { 'combat.tableError': null }).catch(() => {})
  }, [tableError, showError, campaignCode])

  useEffect(() => {
    if (lastSplit?.clearedAt && lastSplit.clearedAt !== shownAt) {
      setShownAt(lastSplit.clearedAt)
      setShowSplitModal(true)
    }
  }, [lastSplit?.clearedAt, shownAt])

  useEffect(() => {
    if (lastSplit?.dismissed) setShowSplitModal(false)
  }, [lastSplit?.dismissed])

  async function handleDismissSplit() {
    setShowSplitModal(false)
    try {
      await updateDoc(doc(db, 'campaigns', campaignCode), { 'combat.lastSplit.dismissed': true })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <div className="min-h-screen bg-brand-mint text-brand-ink">
      <header className="bg-brand-forest text-white px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light">{campaign.meta?.name}</h1>
          <p className="text-xs font-normal tracking-widest opacity-70 mt-0.5">{campaignCode}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSessionLogOpen(true)}
            className="text-xs font-normal text-white opacity-70 hover:opacity-100 border border-white/30 hover:border-white/60 px-2 py-1 transition-all"
          >
            Log
          </button>
          <button
            onClick={() => setPartyOpen(true)}
            className="text-xs font-normal text-white opacity-70 hover:opacity-100 border border-white/30 hover:border-white/60 px-2 py-1 transition-all"
          >
            Party
          </button>
          <button
            onClick={() => setLockDialogOpen(true)}
            className={`transition-colors ${locked ? 'text-white opacity-80 hover:opacity-100' : 'text-white opacity-30 hover:opacity-60'}`}
            title={locked ? 'Campaign locked from cleanup' : 'Lock campaign from cleanup'}
          >
            {locked ? <Lock size={13} /> : <LockOpen size={13} />}
          </button>
          <span className="text-xs font-bold bg-white text-brand-forest px-2 py-1">DM</span>
          <button
            onClick={onLeave}
            className="text-xs font-normal text-white opacity-60 hover:opacity-100 underline transition-opacity"
          >
            Leave
          </button>
          <button
            onClick={() => setAdminOpen(true)}
            className="text-white opacity-10 hover:opacity-30 transition-opacity text-xs select-none"
            tabIndex={-1}
          >
            ·
          </button>
        </div>
      </header>

      <div className="py-6 flex flex-col gap-8">
        <InitiativeTracker campaign={campaign} campaignCode={campaignCode} />
        <div className="grid grid-cols-2 gap-8 items-start">
          <Graveyard campaign={campaign} campaignCode={campaignCode} />
          <ImageLibrary campaign={campaign} campaignCode={campaignCode} />
        </div>
      </div>

      {partyOpen && (
        <PartyModal
          campaign={campaign}
          campaignCode={campaignCode}
          onClose={() => setPartyOpen(false)}
        />
      )}
      {sessionLogOpen && (
        <SessionLogModal
          campaign={campaign}
          campaignCode={campaignCode}
          onClose={() => setSessionLogOpen(false)}
        />
      )}
      {showSplitModal && lastSplit && (
        <SplitModal split={lastSplit} onClose={handleDismissSplit} canDismiss />
      )}
      {adminOpen && <AdminModal onClose={() => setAdminOpen(false)} />}

      {lockDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40">
          <div className="bg-brand-mint-dark shadow-modal w-72 flex flex-col">
            <div className="bg-brand-forest px-4 py-3 flex items-center gap-2">
              {locked ? <Lock size={13} className="text-white shrink-0" /> : <LockOpen size={13} className="text-white shrink-0" />}
              <h2 className="text-white font-normal text-base">
                {locked ? 'Unlock Campaign' : 'Lock Campaign'}
              </h2>
            </div>
            <div className="px-4 py-4">
              <p className="text-brand-ink text-sm font-normal leading-relaxed">
                {locked
                  ? 'Unlocking makes this campaign eligible for automatic cleanup if it goes inactive for 30+ days.'
                  : 'Locking protects this campaign from being automatically deleted during cleanup, no matter how long it sits idle.'}
              </p>
            </div>
            <div className="flex border-t border-brand-mint">
              <button
                onClick={handleToggleLock}
                className="flex-1 py-2 text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark transition-colors"
              >
                {locked ? 'Unlock' : 'Lock'}
              </button>
              <button
                onClick={() => setLockDialogOpen(false)}
                className="flex-1 py-2 text-xs font-normal text-brand-ink hover:bg-brand-mint transition-colors border-l border-brand-mint"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
