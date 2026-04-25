import { useState, useEffect } from 'react'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './lib/firebase'
import JoinScreen from './views/JoinScreen'
import DMView from './views/DMView'
import TableView from './views/TableView'

const SESSION_KEY = 'tbi-session'

function loadSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export default function App() {
  const [uid, setUid] = useState(null)
  const [session, setSession] = useState(loadSavedSession)
  const [campaign, setCampaign] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
      } else {
        signInAnonymously(auth)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!session) return
    const unsub = onSnapshot(doc(db, 'campaigns', session.campaignCode), (snap) => {
      if (snap.exists()) {
        setCampaign(snap.data())
      } else {
        clearSession()
        setSession(null)
        setCampaign(null)
      }
    })
    return unsub
  }, [session])

  function handleJoin(code, viewMode) {
    const newSession = { campaignCode: code, viewMode }
    saveSession(newSession)
    setSession(newSession)
  }

  function handleLeave() {
    clearSession()
    setSession(null)
    setCampaign(null)
  }

  if (!uid) {
    return (
      <div className="min-h-screen bg-brand-mint flex items-center justify-center">
        <p className="text-brand-ink font-light text-lg">Connecting…</p>
      </div>
    )
  }

  if (!session) {
    return <JoinScreen uid={uid} onJoin={handleJoin} />
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-brand-mint flex items-center justify-center">
        <p className="text-brand-ink font-light text-lg">Loading campaign…</p>
      </div>
    )
  }

  if (session.viewMode === 'dm') {
    return <DMView campaign={campaign} campaignCode={session.campaignCode} onLeave={handleLeave} />
  }

  return <TableView campaign={campaign} campaignCode={session.campaignCode} onLeave={handleLeave} />
}
