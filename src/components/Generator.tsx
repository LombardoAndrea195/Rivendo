import { useMemo, useRef, useState, type ReactNode } from 'react'
import { analyzeItem } from '../ai'
import { fileToResizedDataUrl } from '../image'
import { buildListing, eur, listPrice, negotiationMargin, platformFee } from '../listing'
import { VINTED_SELL_URL, canShareFiles, copyText, downloadPhotos, sharePhotos } from '../publish'
import type { Settings } from '../settings'
import { CONDITIONS, type Condition, type Item } from '../types'

interface Props {
  item: Item
  onChange: (update: (prev: Item) => Item) => void
  onReset: () => void
  settings: Settings
}

export default function Generator({ item, onChange, onReset, settings }: Props) {
  const [busy, setBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiStatus, setAiStatus] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const canShare = useMemo(() => canShareFiles(), [])
  const shareable = canShare && item.photos.length > 0

  const set = <K extends keyof Item>(key: K, value: Item[K]) => onChange((prev) => ({ ...prev, [key]: value }))

  const addFiles = async (files: FileList | File[]) => {
    const images = [...files].filter((f) => f.type.startsWith('image/'))
    const urls = await Promise.all(images.map(fileToResizedDataUrl))
    onChange((prev) => ({ ...prev, photos: [...prev.photos, ...urls].slice(0, 12) }))
  }

  const runAi = async () => {
    if (!settings.apiKey) {
      setAiError('Inserisci prima la tua chiave AI qui sopra.')
      return
    }
    setBusy(true)
    setAiError('')
    setAiStatus('')
    try {
      const r = await analyzeItem(settings, item, setAiStatus)
      onChange((prev) => ({
        ...prev,
        title: r.title || prev.title,
        description: r.description || prev.description,
        category: r.category || prev.category,
        brand: r.brand || prev.brand,
        size: r.size || prev.size,
        condition: CONDITIONS.some((c) => c.id === r.condition) ? r.condition : prev.condition,
        hashtags: Array.isArray(r.hashtags) && r.hashtags.length ? r.hashtags : prev.hashtags,
        estimate: r.estimate ?? prev.estimate,
        askingPrice: prev.askingPrice ?? r.estimate?.suggested ?? null,
      }))
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const listing = buildListing(item)
  const publishPrice = item.askingPrice != null ? listPrice(item.askingPrice, settings) : null
  const hasContent = item.photos.length > 0 || item.title || item.description

  const publishOnVinted = async () => {
    setPublishing(true)
    setPublishError('')
    try {
      const transfer = JSON.stringify({
        version: 1,
        source: 'rivendo',
        title: listing.title,
        description: listing.text,
        price: publishPrice,
        brand: item.brand,
        size: item.size,
        category: item.category,
        condition: CONDITIONS.find((c) => c.id === item.condition)?.label ?? item.condition,
      })
      await copyText(transfer)
      window.open(VINTED_SELL_URL, '_blank', 'noopener,noreferrer')
    } catch {
      setPublishError('Non riesco a preparare il trasferimento. Copia i dati qui sotto e riprova.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="generator">
      <Section title="1. Foto" aside={`${item.photos.length}/12`}>
        <div
          className={`photos ${dragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            addFiles(e.dataTransfer.files)
          }}
        >
          {item.photos.map((p, idx) => (
            <div key={idx} className="photo">
              <img src={p} alt={`Foto ${idx + 1}`} />
              {idx === 0 && <span className="photo-tag">Copertina</span>}
              <div className="photo-actions">
                {idx > 0 && (
                  <button
                    type="button"
                    aria-label="Imposta come copertina"
                    title="Imposta come copertina"
                    onClick={() => set('photos', [p, ...item.photos.filter((_, i) => i !== idx)])}
                  >
                    ★
                  </button>
                )}
                <button type="button" aria-label="Rimuovi foto" title="Rimuovi" onClick={() => set('photos', item.photos.filter((_, i) => i !== idx))}>
                  ✕
                </button>
              </div>
            </div>
          ))}
          {item.photos.length < 12 && (
            <button type="button" className="photo-add" onClick={() => fileRef.current?.click()}>
              <span aria-hidden>＋</span>
              {item.photos.length ? 'Aggiungi' : 'Aggiungi foto o trascinale qui'}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        <Field label="Note per l’AI" hint="facoltativo">
          <input
            className="input"
            value={item.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Difetti, misure, modello esatto…"
          />
        </Field>

        <div className="ai-box">
          <button className="btn btn-ai" onClick={runAi} disabled={busy || !item.photos.length}>
            {busy ? <span className="spinner" aria-hidden /> : <span aria-hidden>✨</span>}
            {busy ? aiStatus || 'Analizzo le foto…' : 'Genera annuncio e prezzo con AI'}
          </button>
          <p className="muted small">
            Fino a 4 foto e le note vengono inviate a {settings.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} con la tua chiave. Il prezzo pagato non viene inviato.
          </p>
          {aiError && (
            <p className="error small" role="alert">
              {aiError}
            </p>
          )}
          {item.estimate && (
            <div className="estimate">
              <div className="estimate-range">
                <span className="muted small">Prezzo di mercato stimato</span>
                <strong>
                  {eur(item.estimate.low)} – {eur(item.estimate.high)}
                </strong>
              </div>
              <p className="small">{item.estimate.reasoning}</p>
              {item.askingPrice !== item.estimate.suggested && (
                <button className="btn btn-ghost btn-sm" onClick={() => set('askingPrice', item.estimate!.suggested)}>
                  Usa {eur(item.estimate.suggested)} come prezzo
                </button>
              )}
            </div>
          )}
        </div>
      </Section>

      <Section title="2. Dettagli">
        <Field label="Titolo" hint={`${item.title.length}`}>
          <input className="input" value={item.title} onChange={(e) => set('title', e.target.value)} placeholder="Es. Giacca Levi’s in jeans taglia M" />
        </Field>
        <Field label="Descrizione">
          <textarea className="input" rows={5} value={item.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div className="cols-3">
          <Field label="Marca">
            <input className="input" value={item.brand} onChange={(e) => set('brand', e.target.value)} />
          </Field>
          <Field label="Taglia / misura">
            <input className="input" value={item.size} onChange={(e) => set('size', e.target.value)} />
          </Field>
          <Field label="Categoria">
            <input className="input" value={item.category} onChange={(e) => set('category', e.target.value)} />
          </Field>
        </div>
        <div className="cols-2">
          <Field label="Condizioni">
            <select className="input" value={item.condition} onChange={(e) => set('condition', e.target.value as Condition)}>
              {CONDITIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Parole chiave" hint="separate da virgola">
            <TagsInput key={item.hashtags.join(',')} value={item.hashtags} onChange={(v) => set('hashtags', v)} />
          </Field>
        </div>
      </Section>

      <Section title="3. Prezzo">
        <div className="cols-2">
          <Field label="Prezzo che vuoi incassare" hint="il minimo dopo la trattativa">
            <Money value={item.askingPrice} onChange={(v) => set('askingPrice', v)} />
          </Field>
          <Field label="Quanto l’hai pagato" hint="facoltativo">
            <Money value={item.purchasePrice} onChange={(v) => set('purchasePrice', v)} />
          </Field>
        </div>
        {item.askingPrice != null && item.askingPrice > 0 && (
          <table className="price-plan">
            <thead>
              <tr>
                <th scope="col">Vinted</th>
                <th scope="col">Prezzo di pubblicazione</th>
                <th scope="col">Se scendi a {eur(item.askingPrice)} ti restano</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const margin = negotiationMargin(settings)
                const fee = platformFee(item.askingPrice!, settings)
                const net = item.askingPrice! - fee - (item.purchasePrice ?? 0)
                return <tr>
                  <th scope="row">Vinted</th>
                  <td><strong>{eur(listPrice(item.askingPrice!, settings))}</strong>{margin > 0 && <span className="muted small"> +{margin}%</span>}</td>
                  <td><strong className={net >= 0 ? 'pos' : 'neg'}>{eur(net)}</strong>{fee > 0 && <span className="muted small"> (commissioni {eur(fee)})</span>}</td>
                </tr>
              })()}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="4. Pubblica">
        {item.title || item.description ? (
          <>
            <div className="listing">
              <div className="listing-row">
                <p className="listing-title">{listing.title || '—'}</p>
                <CopyButton text={listing.title} label="Copia titolo" />
              </div>
              <pre className="listing-text">{listing.text}</pre>
              <div className="listing-actions">
                <CopyButton text={listing.text} label="Copia descrizione" />
                <CopyButton text={`${listing.title}\n\n${listing.text}`} label="Copia tutto" primary />
              </div>
            </div>
            <div className="vinted-publish">
              <div>
                <strong>Invia l’annuncio a Vinted</strong>
                <p className="muted small">Con l’estensione Rivendo per Chrome, il pulsante invia titolo, descrizione, prezzo e dettagli direttamente ai campi di Vinted. Tu controlli l’annuncio e premi Pubblica.</p>
              </div>
              <button className="btn btn-primary" onClick={publishOnVinted} disabled={publishing}>
                {publishing ? 'Preparo…' : 'Pubblica su Vinted ↗'}
              </button>
            </div>
            <div className="steps">
              <div className="step">
                <span className="step-n" aria-hidden>1</span>
                <div className="step-body"><strong>Foto pronte</strong><span className="muted small">{item.photos.length ? `${item.photos.length} foto pronte per Vinted` : 'Nessuna foto aggiunta'}</span></div>
                {shareable ? (
                  <button className="btn btn-sm btn-ghost" onClick={() => sharePhotos(item.photos, listing.title, listing.text)}>Condividi foto</button>
                ) : (
                  <button className="btn btn-sm btn-ghost" disabled={!item.photos.length} onClick={() => downloadPhotos(item.photos, listing.title)}>Scarica foto</button>
                )}
              </div>
              <div className="step">
                <span className="step-n" aria-hidden>2</span>
                <div className="step-body"><strong>Controlla e pubblica</strong><span className="muted small">L’estensione compila i campi di testo. Per ragioni di sicurezza del browser, le foto restano da aggiungere in Vinted.</span></div>
              </div>
            </div>
            {publishError && <p className="error small" role="alert">{publishError}</p>}
          </>
        ) : (
          <p className="muted small">Compila titolo e descrizione, oppure usa l’AI, per generare l’annuncio.</p>
        )}
      </Section>

      {hasContent && (
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={() => confirm('Cancellare tutto e iniziare un nuovo annuncio?') && onReset()}>
            Nuovo annuncio
          </button>
        </div>
      )}
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section className="section panel">
      <div className="section-head">
        <h3>{title}</h3>
        {aside && <span className="muted small">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function Field({ label, hint, warn, children }: { label: string; hint?: string; warn?: boolean; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {hint && <span className={warn ? 'error' : 'muted'}>{hint}</span>}
      </span>
      {children}
    </label>
  )
}

function Money({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="money">
      <span aria-hidden>€</span>
      <input
        className="input"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </div>
  )
}

function TagsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(', '))
  return (
    <input
      className="input"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const next = text
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
        if (next.join(',') !== value.join(',')) onChange(next)
      }}
      placeholder="vintage, denim, anni 90"
    />
  )
}

function CopyButton({ text, label, primary }: { text: string; label: string; primary?: boolean }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className={`btn btn-sm ${primary ? 'btn-primary' : 'btn-ghost'}`}
      onClick={async () => {
        await copyText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1500)
      }}
    >
      {done ? 'Copiato ✓' : label}
    </button>
  )
}
