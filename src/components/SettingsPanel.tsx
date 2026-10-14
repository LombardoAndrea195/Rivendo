import { useState } from 'react'
import { FEES_CHECKED, feeRule, type AccountType, type FeePlatform } from '../fees'
import { DEFAULT_MODELS, MODEL_OPTIONS, fetchModels, type AiProvider, type Settings } from '../settings'

const FEE_PLATFORMS: { id: FeePlatform; label: string }[] = [
  { id: 'vinted', label: 'Vinted' },
  { id: 'subito', label: 'Subito' },
  { id: 'ebay', label: 'eBay' },
]

const KEY_LINKS: Record<AiProvider, { label: string; url: string }> = {
  gemini: { label: 'Google AI Studio (gratuito)', url: 'https://aistudio.google.com/apikey' },
  openai: { label: 'OpenAI Platform', url: 'https://platform.openai.com/api-keys' },
}

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
}

export function AiKeyPanel({ settings, onChange, remember, onRemember }: Props & { remember: boolean; onRemember: (on: boolean) => void }) {
  const [showKey, setShowKey] = useState(false)
  return (
    <div className="panel">
      <h2>Chiave AI</h2>
      <p className="muted small">
        {remember
          ? 'La chiave è ricordata solo in questo browser: non viene mai inviata al sito, solo direttamente al fornitore scelto.'
          : 'La chiave resta solo in questa pagina: non viene salvata da nessuna parte e sparisce quando ricarichi. Viene inviata direttamente al fornitore scelto.'}
      </p>
      <div className="segmented" role="radiogroup" aria-label="Fornitore AI">
        {(['gemini', 'openai'] as AiProvider[]).map((p) => (
          <button key={p} role="radio" aria-checked={settings.provider === p} onClick={() => onChange({ ...settings, provider: p, model: DEFAULT_MODELS[p] })}>
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
      <label className="check">
        <input type="checkbox" checked={remember} onChange={(e) => onRemember(e.target.checked)} />
        <span>
          Ricorda su questo dispositivo <span className="muted small">— non usarlo su computer condivisi</span>
        </span>
      </label>
      <ModelPicker key={settings.provider} settings={settings} onChange={onChange} />
    </div>
  )
}

const CUSTOM = '__custom__'

function ModelPicker({ settings, onChange }: Props) {
  const curated = MODEL_OPTIONS[settings.provider]
  const [fetched, setFetched] = useState<{ provider: AiProvider; ids: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [custom, setCustom] = useState(false)

  const fetchedIds = fetched?.provider === settings.provider ? fetched.ids : []
  const extra = [...new Set([...fetchedIds, ...(custom ? [] : [settings.model])])].filter((id) => id && !curated.some((m) => m.id === id))
  const showCustom = custom
  const note = curated.find((m) => m.id === settings.model)?.note

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setFetched({ provider: settings.provider, ids: await fetchModels(settings.provider, settings.apiKey) })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stack">
      <label className="field">
        <span className="field-label">
          Modello
          {note && !showCustom && <span className="muted">{note}</span>}
        </span>
        <div className="input-row">
          <select
            className="input"
            value={showCustom ? CUSTOM : settings.model}
            onChange={(e) => {
              const v = e.target.value
              setCustom(v === CUSTOM)
              if (v !== CUSTOM) onChange({ ...settings, model: v })
            }}
          >
            <optgroup label="Consigliati">
              {curated.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </optgroup>
            {extra.length > 0 && (
              <optgroup label={fetchedIds.length ? "Altri disponibili con la tua chiave" : "Altri"}>
                {extra.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </optgroup>
            )}
            <option value={CUSTOM}>Altro: scrivi il nome…</option>
          </select>
          <button className="btn btn-ghost" onClick={load} disabled={!settings.apiKey || loading} title={settings.apiKey ? '' : 'Inserisci prima la chiave'}>
            {loading ? 'Carico…' : 'Mostra tutti'}
          </button>
        </div>
      </label>
      {showCustom && (
        <input
          className="input"
          aria-label="Nome del modello"
          value={settings.model}
          onChange={(e) => onChange({ ...settings, model: e.target.value.trim() })}
          placeholder={DEFAULT_MODELS[settings.provider]}
        />
      )}
      {error && (
        <p className="error small" role="alert">
          {error}
        </p>
      )}
      {fetched?.provider === settings.provider && !fetchedIds.some((id) => !curated.some((m) => m.id === id)) && !error && <p className="muted small">Nessun altro modello adatto trovato.</p>}
    </div>
  )
}

export function FeesPanel({ settings, onChange }: Props) {
  return (
    <details className="panel">
      <summary>
        <h2>Commissioni e margine di trattativa</h2>
      </summary>
      <p className="muted small">
        Scegli il tipo di account che usi su ogni piattaforma: le commissioni vengono applicate al calcolo di quanto ti resta. Tariffe verificate il {FEES_CHECKED}.
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
                    <button key={a} role="radio" aria-checked={account === a} onClick={() => onChange({ ...settings, accounts: { ...settings.accounts, [p.id]: a } })}>
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
                      onChange({ ...settings, negotiation: { ...settings.negotiation, [p.id]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } })
                    }
                  />
                  <span className="muted">%</span>
                </div>
              </label>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
