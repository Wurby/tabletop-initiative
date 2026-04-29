import { useState, useEffect, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import InitiativeList from '../components/initiative/InitiativeList'
import GraveyardView from '../components/graveyard/GraveyardView'
import SplitModal from '../components/session/SplitModal'
import ImageModal from '../components/images/ImageModal'

export default function TableView({ campaign, campaignCode, onLeave }) {
  const lastSplit = campaign.combat?.lastSplit
  const [shownAt, setShownAt] = useState(lastSplit?.clearedAt ?? null)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const wakeLockRef = useRef(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let active = true

    async function acquire() {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {}
    }

    acquire()

    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && active) acquire()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisibilityChange)
      wakeLockRef.current?.release()
    }
  }, [])

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
      updateDoc(doc(db, 'campaigns', campaignCode), {
        'combat.tableError': 'Failed to save — check your connection.',
      }).catch(() => {})
    }
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

      {showSplitModal && lastSplit && <SplitModal split={lastSplit} onClose={handleDismissSplit} />}
      <ImageModal campaign={campaign} />
    </div>
  )
}
