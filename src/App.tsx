import { useEffect, useState } from 'react'
import { account, isConfigured, type User } from './appwrite'
import Login from './components/Login'
import PublicPage from './components/PublicPage'
import SetupNeeded from './components/SetupNeeded'
import Workspace from './components/Workspace'
import { forgetUser } from './db'

const path = window.location.pathname.replace(/\/+$/, '') || '/'

// Lo scambio del link (userId + secret) va fatto una sola volta, anche se l'effetto parte due volte.
let startup: Promise<{ user: User | null; error: string }> | null = null

function startSession() {
  startup ??= (async () => {
    const params = new URLSearchParams(window.location.search)
    const userId = params.get('userId')
    const secret = params.get('secret')
    const failed = params.has('error')
    if (userId || secret || failed) {
      for (const key of ['userId', 'secret', 'expire', 'project', 'error']) params.delete(key)
      const rest = params.toString()
      window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''))
    }
    let error = failed ? 'Accesso non riuscito. Riprova o usa il link via email.' : ''
    if (userId && secret) {
      try {
        await account.createSession({ userId, secret })
      } catch {
        error = 'Il link di accesso non è valido o è scaduto. Richiedine uno nuovo.'
      }
    }
    try {
      return { user: await account.get(), error }
    } catch {
      return { user: null, error }
    }
  })()
  return startup
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(isConfigured ? undefined : null)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!isConfigured) return
    let alive = true
    startSession().then(({ user, error }) => {
      if (!alive) return
      setAuthError(error)
      setUser(user)
    })
    return () => {
      alive = false
    }
  }, [])

  const signOut = async (everywhere = false) => {
    try {
      if (everywhere) await account.deleteSessions()
      else await account.deleteSession({ sessionId: 'current' })
    } finally {
      forgetUser()
      setUser(null)
    }
  }

  if (path === '/privacy') return <PublicPage kind="privacy" />
  if (path === '/terms') return <PublicPage kind="terms" />

  const deletion = path === '/delete-account'
  if (!isConfigured) return deletion ? <PublicPage kind="delete-account" /> : <SetupNeeded />
  if (user === undefined) return <div className="splash" aria-label="Caricamento" />
  if (!user) {
    if (deletion && !new URLSearchParams(window.location.search).has('login') && !authError) return <PublicPage kind="delete-account" />
    return <Login initialError={authError} deletionMode={deletion} />
  }
  return <Workspace key={user.$id} user={user} onSignOut={signOut} initialView={deletion ? 'settings' : 'inventory'} />
}
