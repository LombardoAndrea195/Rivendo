import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { analyzeItem } from '../ai'
import { EBAY_PRO_CATEGORIES } from '../fees'
import { fileToResizedDataUrl } from '../image'
import { buildListing, eur, listPrice, negotiationMargin, platformFee, profitOf, titleLimit } from '../listing'
import { SELL_URLS, canShareFiles, copyText, downloadPhotos, sharePhotos } from '../publish'
import Photo from './Photo'
import type { Settings } from '../settings'
import { CONDITIONS, PLATFORMS, STATUSES, today, type Condition, type Item, type Platform, type Status } from '../types'

interface Props {
  initial: Item
  isNew: boolean
  settings: Settings
  onClose: () => void
  onSave: (item: Item) => Promise<void>
  onAutoSave: (item: Item) => Promise<Item>
  onDelete: (id: string) => Promise<void>
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

export default function ItemEditor({ initial, isNew, settings, onClose, onSave, onAutoSave, onDelete }: Props) {
  const [item, setItem] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [persisted, setPersisted] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiStatus, setAiStatus] = useState('')
  const [platform, setPlatform] = useState<Platform>('vinted')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const dirty = item !== saved
  const canShare = useMemo(() => canShareFiles(), [])
  const shareable = canShare && item.photos.length > 0

  const set = <K extends keyof Item>(key: K, value: Item[K]) => setItem((prev) => ({ ...prev, [key]: value }))

  const run = async (action: () => Promise<void>) => {
    setSaving(true)
    setSaveError('')
    try {
      await action()
    } catch (e) {
      setSaveError(errorText(e))
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = (on: boolean) => {
    const others = (item.listedOn ?? []).filter((p) => p !== platform)
    const next: Item = on
      ? {
        ...item,
        listedOn: [...others, platform],
        status: item.status === 'draft' ? 'listed' : item.status,
        listedDate: item.listedDate || today(),
      }
      : { ...item, listedOn: others }
    setItem(next)
    return run(async () => {
      const stored = await onAutoSave(next)
      setItem((current) => (current === next ? stored : current))
      setSaved(stored)
      setPersisted(true)
    })
  }

  const requestClose = () => {
    if (!dirty || confirm('Chiudere senza salvare le modifiche?')) onClose()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  })

  const addFiles = async (files: FileList | File[]) => {
    const images = [...files].filter((f) => f.type.startsWith('image/'))
    const urls = await Promise.all(images.map(fileToResizedDataUrl))
    setItem((prev) => ({ ...prev, photos: [...prev.photos, ...urls].slice(0, 12) }))
  }

  const setStatus = (status: Status) =>
    setItem((prev) => ({
      ...prev,
      status,
      listedDate: status !== 'draft' && !prev.listedDate ? today() : prev.listedDate,
      soldDate: status === 'sold' && !prev.soldDate ? today() : prev.soldDate,
      soldPrice: status === 'sold' && prev.soldPrice == null ? prev.askingPrice : prev.soldPrice,
      soldPlatform: status === 'sold' && !prev.soldPlatform && prev.listedOn?.length === 1 ? prev.listedOn[0] : prev.soldPlatform,
    }))

  const runAi = async () => {
    if (!settings.apiKey) {
      setAiError('Aggiungi una chiave API nelle Impostazioni per usare l’AI.')
      return
    }
    const providerName = settings.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'
    if (
      !confirm(
        `Per generare l’annuncio, invierai a ${providerName} fino a 4 foto e titolo, marca, taglia e note dell’oggetto. Il prezzo di acquisto non viene inviato. La richiesta usa la tua chiave API. Vuoi continuare?`,
      )
    ) {
      return
    }
    setBusy(true)
    setAiError('')
    setAiStatus('')
    try {
      const r = await analyzeItem(settings, item, setAiStatus)
      setItem((prev) => ({
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

  const listing = buildListing(item, platform)
  const sellUrl = SELL_URLS[platform]
  const platformLabel = PLATFORMS.find((p) => p.id === platform)!.label
  const isListedHere = !!item.listedOn?.includes(platform)
  const publishPrice = item.askingPrice != null ? listPrice(item.askingPrice, platform, settings) : null
  const limit = titleLimit(platform)
  const profit = profitOf(item, settings)
  const soldFee = item.soldPrice != null ? platformFee(item.soldPrice, item.soldPlatform || 'altro', settings, item) : 0
  const ebayCategoryField = settings.accounts.ebay === 'pro' && (
    <Field label="Categoria eBay" hint="per le commissioni da professionista">
      <select className="input" value={item.ebayCategory ?? 'altro'} onChange={(e) => set('ebayCategory', e.target.value)}>
        {EBAY_PRO_CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </Field>
  )
  const titleId = `title-${item.id}`

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="sheet-head">
          <h2 id={titleId}>{isNew ? 'Nuovo oggetto' : item.title || 'Modifica oggetto'}</h2>
          <button className="icon-btn" onClick={requestClose} aria-label="Chiudi">
            ✕
          </button>
        </header>

        <div className="sheet-body">
          <Section title="Foto" aside={`${item.photos.length}/12`}>
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
                  <Photo path={p} alt={`Foto ${idx + 1}`} />
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
                    <button
                      type="button"
                      aria-label="Rimuovi foto"
                      title="Rimuovi"
                      onClick={() => set('photos', item.photos.filter((_, i) => i !== idx))}
                    >
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

            <div className="ai-box">
              <button className="btn btn-ai" onClick={runAi} disabled={busy || !item.photos.length}>
                {busy ? <span className="spinner" aria-hidden /> : <span aria-hidden>✨</span>}
                {busy ? aiStatus || 'Analizzo le foto…' : 'Genera annuncio e prezzo con AI'}
              </button>
              <p className="muted small">
                Se continui, fino a 4 foto e i dettagli dell’oggetto vengono inviati a {settings.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} tramite la tua chiave API.
              </p>
              {!settings.apiKey && <p className="muted small">Serve una chiave API (Gemini ha un piano gratuito): aggiungila in Impostazioni.</p>}
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

          <Section title="Dettagli">
            <Field label="Titolo" hint={limit ? `${item.title.length}/${limit}` : `${item.title.length}`} warn={!!limit && item.title.length > limit}>
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

          <Section title="Acquisto">
            <div className="cols-3">
              <Field label="Prezzo pagato">
                <Money value={item.purchasePrice} onChange={(v) => set('purchasePrice', v)} />
              </Field>
              <Field label="Data">
                <input className="input" type="date" value={item.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} />
              </Field>
              <Field label="Dove">
                <input className="input" value={item.purchaseSource} onChange={(e) => set('purchaseSource', e.target.value)} placeholder="Mercatino, svuota-cantine…" />
              </Field>
            </div>
          </Section>

          <Section title="Vendita">
            <div className="segmented full" role="radiogroup" aria-label="Stato">
              {STATUSES.map((s) => (
                <button key={s.id} role="radio" aria-checked={item.status === s.id} onClick={() => setStatus(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>

            {item.status !== 'sold' ? (
              <>
                <div className="cols-2">
                  <Field label="Prezzo che vuoi incassare" hint="il minimo dopo la trattativa">
                    <Money value={item.askingPrice} onChange={(v) => set('askingPrice', v)} />
                  </Field>
                  {item.status === 'listed' && (
                    <Field label="Pubblicato il">
                      <input className="input" type="date" value={item.listedDate} onChange={(e) => set('listedDate', e.target.value)} />
                    </Field>
                  )}
                </div>
                {item.askingPrice != null && item.askingPrice > 0 && (
                  <table className="price-plan">
                    <thead>
                      <tr>
                        <th scope="col">Piattaforma</th>
                        <th scope="col">Pubblica a</th>
                        <th scope="col">Se scendi a {eur(item.askingPrice)} ti restano</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PLATFORMS.filter((p) => p.id !== 'altro').map((p) => {
                        const margin = negotiationMargin(p.id, settings)
                        const fee = platformFee(item.askingPrice!, p.id, settings, item)
                        const net = item.askingPrice! - fee - (item.purchasePrice ?? 0)
                        return (
                          <tr key={p.id}>
                            <th scope="row">{p.label}</th>
                            <td>
                              <strong>{eur(listPrice(item.askingPrice!, p.id, settings))}</strong>
                              {margin > 0 && <span className="muted small"> +{margin}%</span>}
                            </td>
                            <td>
                              <strong className={net >= 0 ? 'pos' : 'neg'}>{eur(net)}</strong>
                              {fee > 0 && <span className="muted small"> (commissioni {eur(fee)})</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
                {ebayCategoryField}
              </>
            ) : (
              <>
                <div className="cols-2">
                  <Field label="Venduto a">
                    <Money value={item.soldPrice} onChange={(v) => set('soldPrice', v)} />
                  </Field>
                  <Field label="Data vendita">
                    <input className="input" type="date" value={item.soldDate} onChange={(e) => set('soldDate', e.target.value)} />
                  </Field>
                  <Field label="Piattaforma">
                    <select className="input" value={item.soldPlatform} onChange={(e) => set('soldPlatform', e.target.value as Platform)}>
                      <option value="">—</option>
                      {PLATFORMS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Spese a tuo carico" hint="spedizione, imballo">
                    <Money value={item.shippingCost} onChange={(v) => set('shippingCost', v)} />
                  </Field>
                </div>
                {item.soldPlatform === 'ebay' && ebayCategoryField}
                {profit != null && (
                  <div className="profit">
                    <span>
                      Profitto netto
                      {soldFee > 0 && <span className="muted small"> · commissioni {eur(soldFee)}</span>}
                    </span>
                    <strong className={profit >= 0 ? 'pos' : 'neg'}>{eur(profit)}</strong>
                  </div>
                )}
              </>
            )}
          </Section>

          <Section title="Annuncio e pubblicazione">
            <div className="segmented" role="tablist" aria-label="Piattaforma">
              {PLATFORMS.map((p) => (
                <button key={p.id} role="tab" aria-selected={platform === p.id} onClick={() => setPlatform(p.id)}>
                  {p.label}
                  {item.listedOn?.includes(p.id) && <span className="pos" aria-label="pubblicato">●</span>}
                </button>
              ))}
            </div>
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
                {sellUrl && (
                  <ol className="steps">
                    <li className="step">
                      <span className="step-n" aria-hidden>
                        1
                      </span>
                      <div className="step-body">
                        <strong>Prepara le foto</strong>
                        <span className="muted small">
                          {item.photos.length
                            ? shareable
                              ? 'Condividile e scegli l’app di ' + platformLabel
                              : `${item.photos.length} foto, finiscono nella cartella Download`
                            : 'Nessuna foto aggiunta'}
                        </span>
                      </div>
                      {shareable ? (
                        <button className="btn btn-sm btn-ghost" onClick={() => sharePhotos(item.photos, listing.title, listing.text)}>
                          Condividi foto
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-ghost" disabled={!item.photos.length} onClick={() => downloadPhotos(item.photos, listing.title)}>
                          Scarica foto
                        </button>
                      )}
                    </li>
                    <li className="step">
                      <span className="step-n" aria-hidden>
                        2
                      </span>
                      <div className="step-body">
                        <strong>Apri {platformLabel} e incolla</strong>
                        <div className="chips">
                          <CopyButton text={listing.title} label="Titolo" />
                          <CopyButton text={listing.text} label="Descrizione" />
                          {publishPrice != null && <CopyButton text={String(publishPrice).replace('.', ',')} label={`Prezzo ${eur(publishPrice)}`} />}
                        </div>
                        {publishPrice != null && publishPrice > item.askingPrice! && (
                          <span className="muted small">
                            Include il {negotiationMargin(platform, settings)}% di margine: puoi accettare offerte fino a {eur(item.askingPrice)}.
                            {platform === 'ebay' && ' Attiva la “Proposta d’acquisto” e imposta il rifiuto automatico sotto questa cifra.'}
                          </span>
                        )}
                      </div>
                      <a className="btn btn-sm btn-primary" href={sellUrl} target="_blank" rel="noreferrer">
                        Apri {platformLabel} ↗
                      </a>
                    </li>
                    <li className="step">
                      <span className="step-n" aria-hidden>
                        3
                      </span>
                      <div className="step-body">
                        <strong>{isListedHere ? `Pubblicato su ${platformLabel}` : 'Fatto? Segnalo qui'}</strong>
                        <span className="muted small">
                          {isListedHere ? 'L’oggetto risulta in vendita qui.' : 'L’oggetto passa a “In vendita” e viene salvato.'}
                        </span>
                      </div>
                      {isListedHere ? (
                        <button className="btn btn-sm btn-ghost" onClick={() => togglePublished(false)}>
                          Annulla
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-ghost" onClick={() => togglePublished(true)}>
                          Segna come pubblicato
                        </button>
                      )}
                    </li>
                  </ol>
                )}
              </>
            ) : (
              <p className="muted small">Compila titolo e descrizione, oppure usa l’AI, per generare l’annuncio.</p>
            )}
          </Section>

          <Section title="Note private">
            <textarea
              className="input"
              rows={2}
              value={item.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Difetti, misure, dove l’hai messo in casa…"
            />
          </Section>
        </div>

        <footer className="sheet-foot">
          {persisted && (
            <button
              className="btn btn-danger-ghost"
              disabled={saving}
              onClick={() => confirm('Eliminare definitivamente questo oggetto?') && run(() => onDelete(item.id))}
            >
              Elimina
            </button>
          )}
          <span className="spacer">
            {saveError && (
              <span className="error small" role="alert">
                {saveError}
              </span>
            )}
          </span>
          <button className="btn btn-ghost" onClick={requestClose} disabled={saving}>
            Annulla
          </button>
          <button className="btn btn-primary" onClick={() => run(() => onSave(item))} disabled={saving}>
            {saving && <span className="spinner" aria-hidden />}
            {saving ? 'Salvo…' : 'Salva'}
          </button>
        </footer>
      </div>
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section className="section">
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
