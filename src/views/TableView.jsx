import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import InitiativeList from '../components/initiative/InitiativeList'
import GraveyardView from '../components/graveyard/GraveyardView'
import SplitModal from '../components/session/SplitModal'

export default function TableView({ campaign, campaignCode, onLeave }) {
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
        <h1 className="text-2xl font-light">{campaign.meta?.name}</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold bg-brand-rivulet text-white px-2 py-1">TABLE</span>
          <button
            onClick={onLeave}
            className="text-xs font-normal text-white opacity-60 hover:opacity-100 underline transition-opacity"
          >
            Leave
          </button>
        </div>
      </header>

      <div className="py-6 flex flex-col gap-8">
        <InitiativeList campaign={campaign} />
        <GraveyardView campaign={campaign} />
      </div>

      {showSplitModal && lastSplit && (
        <SplitModal split={lastSplit} onClose={handleDismissSplit} />
      )}
    </div>
  )
}
