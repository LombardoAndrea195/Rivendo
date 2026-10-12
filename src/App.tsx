import { useEffect, useState } from 'react'
import { isSignInWithEmailLink, onAuthStateChanged, signInWithEmailLink, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, EMAIL_FOR_SIGN_IN, isConfigured, type User } from './firebase'
import Login from './components/Login'
import PublicPage from './components/PublicPage'
import SetupNeeded from './components/SetupNeeded'
import Workspace from './components/Workspace'

const path = window.location.pathname.replace(/\/+$/, '') || '/'

// Il link via email va completato una sola volta, anche se l'effetto parte due volte.
let startup: Promise<string> | null = null

function startSession() {
  startup ??= (async () => {
    const href = window.location.href
    if (!isSignInWithEmailLink(auth, href)) return ''
    const params = new URLSearchParams(window.location.search)
    for (const key of ['apiKey', 'oobCode', 'mode', 'lang', 'continueUrl', 'tenantId']) params.delete(key)
    const rest = params.toString()
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''))
    const email = localStorage.getItem(EMAIL_FOR_SIGN_IN) || window.prompt('Per completare l’accesso, conferma la tua email:')
    if (!email) return 'Accesso annullato. Richiedi un nuovo link.'
    try {
      await signInWithEmailLink(auth, email.trim(), href)
      localStorage.removeItem(EMAIL_FOR_SIGN_IN)
      return ''
    } catch {
      return 'Il link di accesso non è valido o è scaduto. Richiedine uno nuovo.'
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
    let unsubscribe = () => {}
    startSession().then((error) => {
      if (!alive) return
      setAuthError(error)
      unsubscribe = onAuthStateChanged(auth, setUser)
    })
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  const signOut = () => firebaseSignOut(auth)

  if (path === '/privacy') return <PublicPage kind="privacy" />
  if (path === '/terms') return <PublicPage kind="terms" />

  const deletion = path === '/delete-account'
  if (!isConfigured) return deletion ? <PublicPage kind="delete-account" /> : <SetupNeeded />
  if (user === undefined) return <div className="splash" aria-label="Caricamento" />
  if (!user) {
    if (deletion && !new URLSearchParams(window.location.search).has('login') && !authError) return <PublicPage kind="delete-account" />
    return <Login initialError={authError} deletionMode={deletion} />
  }
  return <Workspace key={user.uid} user={user} onSignOut={signOut} initialView={deletion ? 'settings' : 'inventory'} />
}
