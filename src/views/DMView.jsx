import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import InitiativeTracker from '../components/initiative/InitiativeTracker'
import PartyModal from '../components/party/PartyModal'
import Graveyard from '../components/graveyard/Graveyard'
import SessionLogModal from '../components/session/SessionLogModal'
import SplitModal from '../components/session/SplitModal'

export default function DMView({ campaign, campaignCode, onLeave }) {
  const [partyOpen,      setPartyOpen]      = useState(false)
  const [sessionLogOpen, setSessionLogOpen] = useState(false)

  const lastSplit = campaign.combat?.lastSplit
  const [shownAt,        setShownAt]        = useState(lastSplit?.clearedAt ?? null)
  const [showSplitModal, setShowSplitModal] = useState(false)

  useEffect(() => {
    if (lastSplit?.clearedAt && lastSplit.clearedAt !== shownAt) {
      setShownAt(lastSplit.clearedAt)
      setShowSplitModal(true)
    }
  }, [lastSplit?.clearedAt])

  useEffect(() => {
    if (lastSplit?.dismissed) setShowSplitModal(false)
  }, [lastSplit?.dismissed])

  async function handleDismissSplit() {
    setShowSplitModal(false)
    await updateDoc(doc(db, 'campaigns', campaignCode), { 'combat.lastSplit.dismissed': true })
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
          <span className="text-xs font-bold bg-white text-brand-forest px-2 py-1">DM</span>
          <button
            onClick={onLeave}
            className="text-xs font-normal text-white opacity-60 hover:opacity-100 underline transition-opacity"
          >
            Leave
          </button>
        </div>
      </header>

      <div className="py-6 flex flex-col gap-8">
        <InitiativeTracker campaign={campaign} campaignCode={campaignCode} />
        <div className="grid grid-cols-2 gap-8 items-start">
          <Graveyard campaign={campaign} campaignCode={campaignCode} />
          <div>{/* Images — Phase 5 */}</div>
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
          onClose={() => setSessionLogOpen(false)}
        />
      )}
      {showSplitModal && lastSplit && (
        <SplitModal split={lastSplit} onClose={handleDismissSplit} canDismiss />
      )}
    </div>
  )
}
