import type { User } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { clearLegacyItems, deleteItem, loadLegacyItems, saveItem } from '../db'
import { FEES_CHECKED, feeRule, type AccountType, type FeePlatform } from '../fees'
import { profitOf } from '../listing'
import { photoDataUrl } from '../photos'
import { DEFAULT_MODELS, type AiProvider, type Settings } from '../settings'
import { supabase } from '../supabase'
import type { Item } from '../types'

const FEE_PLATFORMS: { id: FeePlatform; label: string }[] = [
  { id: 'vinted', label: 'Vinted' },
  { id: 'subito', label: 'Subito' },
  { id: 'ebay', label: 'eBay' },
]

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
  items: Item[]
  user: User
  onImported: () => void
}

const KEY_LINKS: Record<AiProvider, { label: string; url: string }> = {
  gemini: { label: 'Google AI Studio (gratuito)', url: 'https://aistudio.google.com/apikey' },
  openai: { label: 'OpenAI Platform', url: 'https://platform.openai.com/api-keys' },
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export default function SettingsView({ settings, onChange, items, user, onImported }: Props) {
  const [showKey, setShowKey] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [legacy, setLegacy] = useState<Item[]>([])
  const importRef = useRef<HTMLInputElement>(null)
  const stamp = () => new Date().toISOString().slice(0, 10)
  const provider = user.app_metadata?.provider as string | undefined

  useEffect(() => {
    loadLegacyItems().then(setLegacy)
  }, [])

  const task = async (label: string, fn: () => Promise<string>) => {
    setBusy(true)
    setMessage(label)
    try {
      setMessage(await fn())
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Operazione non riuscita.')
    } finally {
      setBusy(false)
    }
  }

  const exportBackup = async () => {
    const full = await Promise.all(items.map(async (i) => ({ ...i, photos: await Promise.all(i.photos.map(photoDataUrl)) })))
    download(`rivendo-backup-${stamp()}.json`, JSON.stringify({ version: 2, items: full }), 'application/json')
    return 'Backup scaricato.'
  }

  const importLegacy = async () => {
    for (const it of legacy) await saveItem(it)
    await clearLegacyItems()
    setLegacy([])
    onImported()
    return `Importati ${legacy.length} oggetti nel tuo account.`
  }

  const exportCsv = () => {
    const head = ['Titolo', 'Marca', 'Categoria', 'Stato', 'Pagato', 'Data acquisto', 'Prezzo richiesto', 'Venduto a', 'Data vendita', 'Piattaforma', 'Spese', 'Profitto']
    const rows = items.map((i) =>
      [i.title, i.brand, i.category, i.status, i.purchasePrice, i.purchaseDate, i.askingPrice, i.soldPrice, i.soldDate, i.soldPlatform, i.shippingCost, profitOf(i, settings)?.toFixed(2)]
        .map(csvCell)
        .join(';'),
    )
    download(`rivendo-${stamp()}.csv`, '\ufeff' + [head.map(csvCell).join(';'), ...rows].join('\n'), 'text/csv')
  }

  const importJson = async (file: File) => {
    let list: Item[]
    try {
      const data = JSON.parse(await file.text())
      list = Array.isArray(data) ? data : data.items
      if (!Array.isArray(list)) throw new Error()
    } catch {
      return 'File non valido.'
    }
    for (const it of list) if (it?.id) await saveItem(it)
    onImported()
    return `Importati ${list.length} oggetti.`
  }

  return (
    <section className="stack narrow">
      <div className="panel">
        <h2>Account</h2>
        <div className="account-row">
          <div className="account-id">
            <strong>{(user.user_metadata?.full_name as string | undefined) ?? user.email}</strong>
            <span className="muted small">
              {user.email} · accesso con {provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : provider === 'azure' ? 'Microsoft' : 'link via email'}
            </span>
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>
              Esci
            </button>
            <button className="btn btn-danger-ghost" onClick={() => supabase.auth.signOut({ scope: 'global' })}>
              Esci da tutti i dispositivi
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Assistente AI</h2>
        <p className="muted small">
          Per sicurezza la chiave resta solo su questo dispositivo (non viene salvata nel tuo account) e viene inviata direttamente al fornitore scelto.
        </p>
        <div className="segmented" role="radiogroup" aria-label="Fornitore AI">
          {(['gemini', 'openai'] as AiProvider[]).map((p) => (
            <button
              key={p}
              role="radio"
              aria-checked={settings.provider === p}
              onClick={() => onChange({ ...settings, provider: p, model: DEFAULT_MODELS[p] })}
            >
              {p === 'gemini' ? 'Google Gemini' : 'OpenAI'}
            </button>
          ))}
        </div>
        <label className="field">
          <span className="field-label">
            Chiave API
            <a href={KEY_LINKS[settings.provider].url} target="_blank" rel="noreferrer">
              Ottienila su {KEY_LINKS[settings.provider].label} ↗
            </a>
          </span>
          <div className="input-row">
            <input
              className="input"
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              value={settings.apiKey}
              onChange={(e) => onChange({ ...settings, apiKey: e.target.value.trim() })}
              placeholder="Incolla qui la chiave"
            />
            <button className="btn btn-ghost" onClick={() => setShowKey((v) => !v)}>
              {showKey ? 'Nascondi' : 'Mostra'}
            </button>
          </div>
        </label>
        <label className="field">
          <span className="field-label">
            Modello <span className="muted">predefinito: {DEFAULT_MODELS[settings.provider]}</span>
          </span>
          <input className="input" value={settings.model} onChange={(e) => onChange({ ...settings, model: e.target.value.trim() })} />
        </label>
      </div>

      <div className="panel">
        <h2>Commissioni delle piattaforme</h2>
        <p className="muted small">
          Scegli il tipo di account che usi su ogni piattaforma: le commissioni a carico del venditore vengono applicate in automatico al calcolo del
          profitto. Tariffe verificate sulle pagine ufficiali il {FEES_CHECKED}.
        </p>
        <ul className="fee-list">
          {FEE_PLATFORMS.map((p) => {
            const account = settings.accounts[p.id]
            const rule = feeRule(p.id, account)
            const summary = p.id === 'ebay' && account === 'pro' ? '6,5–12,5% secondo la categoria + 0,35 € a ordine + 0,35%' : rule.summary
            return (
              <li key={p.id} className="fee-row">
                <div className="fee-head">
                  <strong>{p.label}</strong>
                  <div className="segmented" role="radiogroup" aria-label={`Account ${p.label}`}>
                    {(['privato', 'pro'] as AccountType[]).map((a) => (
                      <button
                        key={a}
                        role="radio"
                        aria-checked={account === a}
                        onClick={() => onChange({ ...settings, accounts: { ...settings.accounts, [p.id]: a } })}
                      >
                        {a === 'privato' ? 'Privato' : 'Professionale'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className={`fee-summary ${rule.tiers.length ? '' : 'pos'}`}>{summary}</p>
                <p className="muted small">
                  {rule.note}{' '}
                  <a href={rule.source} target="_blank" rel="noreferrer">
                    Fonte ufficiale ↗
                  </a>
                </p>
                <label className="field inline">
                  <span className="field-label">Margine per le trattative</span>
                  <div className="input-row">
                    <input
                      className="input short"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      step={1}
                      value={settings.negotiation[p.id]}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          negotiation: { ...settings.negotiation, [p.id]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) },
                        })
                      }
                    />
                    <span className="muted">%</span>
                  </div>
                </label>
              </li>
            )
          })}
          <li className="fee-row">
            <div className="fee-head">
              <strong>Altro</strong>
              <span className="muted small">mercatini, Facebook, Wallapop…</span>
            </div>
            <div className="input-row">
              <label className="field">
                <span className="field-label">% sul prezzo</span>
                <input
                  className="input short"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={settings.otherFee.percent}
                  onChange={(e) => onChange({ ...settings, otherFee: { ...settings.otherFee, percent: Number(e.target.value) || 0 } })}
                />
              </label>
              <label className="field">
                <span className="field-label">Fisso €</span>
                <input
                  className="input short"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.05"
                  value={settings.otherFee.fixed}
                  onChange={(e) => onChange({ ...settings, otherFee: { ...settings.otherFee, fixed: Number(e.target.value) || 0 } })}
                />
              </label>
            </div>
          </li>
        </ul>
        <label className="field inline">
          <span className="field-label">Segnala annunci fermi dopo</span>
          <div className="input-row">
            <input
              className="input short"
              type="number"
              min={1}
              value={settings.staleDays}
              onChange={(e) => onChange({ ...settings, staleDays: Math.max(1, Number(e.target.value) || 30) })}
            />
            <span className="muted">giorni</span>
          </div>
        </label>
      </div>

      <div className="panel">
        <h2>Dati e backup</h2>
        <p className="muted small">
          I tuoi {items.length} oggetti sono salvati nel tuo account e li ritrovi su ogni dispositivo. Il backup è un file con tutti i dati e le foto,
          da conservare dove vuoi.
        </p>
        {legacy.length > 0 && (
          <div className="notice">
            <span>
              In questo browser ci sono <strong>{legacy.length} oggetti</strong> salvati prima dell’arrivo degli account.
            </span>
            <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => task('Importo…', importLegacy)}>
              Importa nel mio account
            </button>
          </div>
        )}
        <div className="btn-row">
          <button className="btn btn-ghost" disabled={busy || !items.length} onClick={() => task('Preparo il backup…', exportBackup)}>
            Scarica backup
          </button>
          <button className="btn btn-ghost" disabled={busy} onClick={() => importRef.current?.click()}>
            Ripristina backup
          </button>
          <button className="btn btn-ghost" onClick={exportCsv} disabled={busy || !items.length}>
            Esporta CSV (Excel)
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) task('Importo…', () => importJson(f))
              e.target.value = ''
            }}
          />
        </div>
        {message && (
          <p className="small" role="status">
            {message}
          </p>
        )}
        <hr />
        <button
          className="btn btn-danger-ghost"
          disabled={busy || !items.length}
          onClick={() => {
            if (!confirm(`Eliminare tutti i ${items.length} oggetti e le loro foto? L’operazione non è reversibile.`)) return
            task('Elimino…', async () => {
              for (const it of items) await deleteItem(it.id)
              onImported()
              return 'Tutti gli oggetti sono stati eliminati.'
            })
          }}
        >
          Elimina tutti i dati
        </button>
      </div>
    </section>
  )
}
