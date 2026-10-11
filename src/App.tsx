import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Login from './components/Login'
import SetupNeeded from './components/SetupNeeded'
import Workspace from './components/Workspace'
import { isConfigured, supabase } from './supabase'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(isConfigured ? undefined : null)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isConfigured) return <SetupNeeded />
  if (session === undefined) return <div className="splash" aria-label="Caricamento" />
  if (!session) return <Login />
  return <Workspace key={session.user.id} user={session.user} />
}
