import { useState } from 'react'
import { FEES_CHECKED, feeRule, type AccountType, type FeePlatform } from '../fees'
import { DEFAULT_MODELS, type AiProvider, type Settings } from '../settings'

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

export function AiKeyPanel({ settings, onChange }: Props) {
  const [showKey, setShowKey] = useState(false)
  return (
    <div className="panel">
      <h2>Chiave AI</h2>
      <p className="muted small">
        La chiave resta solo in questa pagina: non viene salvata da nessuna parte e sparisce quando ricarichi. Viene inviata direttamente al fornitore scelto.
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
      <details>
        <summary className="muted small">Modello avanzato</summary>
        <label className="field">
          <span className="field-label">
            Modello <span className="muted">predefinito: {DEFAULT_MODELS[settings.provider]}</span>
          </span>
          <input className="input" value={settings.model} onChange={(e) => onChange({ ...settings, model: e.target.value.trim() })} />
        </label>
      </details>
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
