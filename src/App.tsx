import { useEffect, useState } from 'react'
import AdSlot from './components/AdSlot'
import Generator from './components/Generator'
import PublicPage from './components/PublicPage'
import { AiKeyPanel } from './components/SettingsPanel'
import { DEFAULT_MODELS, DEFAULT_SETTINGS, rememberedKey, rememberKey, type Settings } from './settings'
import { newItem } from './types'

const path = window.location.pathname.replace(/\/+$/, '') || '/'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP as string | undefined,
  side: import.meta.env.VITE_AD_SLOT_SIDE as string | undefined,
  bottom: import.meta.env.VITE_AD_SLOT_BOTTOM as string | undefined,
}

export default function App() {
  const [remember, setRemember] = useState(() => rememberedKey() != null)
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = rememberedKey()
    return saved ? { ...DEFAULT_SETTINGS, ...saved, model: saved.model || DEFAULT_MODELS[saved.provider] } : DEFAULT_SETTINGS
  })

  const updateSettings = (s: Settings) => {
    setSettings(s)
    if (remember) rememberKey(s)
  }

  const toggleRemember = (on: boolean) => {
    setRemember(on)
    rememberKey(on ? settings : null)
  }
  const [item, setItem] = useState(newItem)

  const hasWork = item.photos.length > 0 || Boolean(item.title || item.description)

  // Niente viene salvato: avvisa prima di chiudere o ricaricare con un annuncio in corso.
  useEffect(() => {
    if (!hasWork) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasWork])

  if (path === '/privacy') return <PublicPage kind="privacy" />
  if (path === '/terms') return <PublicPage kind="terms" />

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            R
          </span>
          Rivendo
        </div>
        <span className="muted small topbar-note">Gratis · nessun account · niente viene salvato</span>
      </header>

      <AdSlot slot={SLOTS.top} className="ad-top" />

      <div className="layout">
        <main className="content stack">
          <div className="intro">
            <h1>Dalla foto all’annuncio in un minuto</h1>
            <p className="muted">
              Carica le foto, l’AI scrive titolo, descrizione e prezzo. Prepariamo tutto per Vinted in un unico passaggio. Quando ricarichi la pagina,
              tutto viene cancellato.
            </p>
          </div>
          <AiKeyPanel settings={settings} onChange={updateSettings} remember={remember} onRemember={toggleRemember} />
          <Generator item={item} onChange={setItem} onReset={() => setItem(newItem())} settings={settings} />
          <AdSlot slot={SLOTS.bottom} className="ad-bottom" />
        </main>
        <AdSlot slot={SLOTS.side} className="ad-side" />
      </div>

      <footer className="legal-links site-foot">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Termini</a>
      </footer>
    </div>
  )
}
