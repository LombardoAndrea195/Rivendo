import { useState } from 'react'
import { DEFAULT_MODELS, MODEL_OPTIONS, fetchModels, type AiProvider, type Settings } from '../settings'

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
