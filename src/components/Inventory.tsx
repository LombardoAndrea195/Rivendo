import { useMemo, useState } from 'react'
import Photo from './Photo'
import { daysBetween, eur, profitOf } from '../listing'
import type { Settings } from '../settings'
import { PLATFORMS, STATUSES, type Item, type Status } from '../types'

interface Props {
  items: Item[]
  settings: Settings
  onOpen: (item: Item) => void
  onCreate: () => void
  onDemo: () => void
}

type Filter = 'all' | Status

export default function Inventory({ items, settings, onOpen, onCreate, onDemo }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: items.length, draft: 0, listed: 0, sold: 0 }
    items.forEach((i) => c[i.status]++)
    return c
  }, [items])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(
      (i) =>
        (filter === 'all' || i.status === filter) &&
        (!q || [i.title, i.brand, i.category, i.notes, ...i.hashtags].join(' ').toLowerCase().includes(q)),
    )
  }, [items, filter, query])

  if (!items.length) {
    return (
      <section className="empty">
        <div className="empty-art" aria-hidden>
          📦
        </div>
        <h1>Il tuo magazzino è vuoto</h1>
        <p className="muted">
          Fotografa un oggetto da rivendere: Rivendo ti aiuta a scrivere l’annuncio, a scegliere il prezzo e a calcolare quanto ci
          guadagni davvero.
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={onCreate}>
            Aggiungi il primo oggetto
          </button>
          <button className="btn btn-ghost" onClick={onDemo}>
            Prova con dati di esempio
          </button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="Filtra per stato">
          {(['all', ...STATUSES.map((s) => s.id)] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Tutti' : STATUSES.find((s) => s.id === f)!.label}
              <span className="count">{counts[f]}</span>
            </button>
          ))}
        </div>
        <input
          className="input search"
          type="search"
          placeholder="Cerca per titolo, marca, tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cerca"
        />
      </div>

      {visible.length === 0 ? (
        <p className="muted center pad">Nessun oggetto corrisponde ai filtri.</p>
      ) : (
        <ul className="grid">
          {visible.map((item) => (
            <li key={item.id}>
              <Card item={item} settings={settings} onOpen={() => onOpen(item)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Card({ item, settings, onOpen }: { item: Item; settings: Settings; onOpen: () => void }) {
  const profit = item.status === 'sold' ? profitOf(item, settings) : null
  const stale = item.status === 'listed' && item.listedDate && daysBetween(item.listedDate) >= settings.staleDays

  return (
    <button className="card" onClick={onOpen}>
      <div className="card-photo">
        {item.photos[0] ? <Photo path={item.photos[0]} loading="lazy" /> : <span aria-hidden>📷</span>}
        <span className={`badge badge-${item.status}`}>{STATUSES.find((s) => s.id === item.status)!.label}</span>
      </div>
      <div className="card-body">
        <p className="card-title">{item.title || 'Senza titolo'}</p>
        <p className="card-meta">{[item.brand, item.size].filter(Boolean).join(' · ') || item.category || '\u00a0'}</p>
        {item.status === 'listed' && !!item.listedOn?.length && (
          <p className="card-meta">su {item.listedOn.map((p) => PLATFORMS.find((x) => x.id === p)?.label).join(', ')}</p>
        )}
        <div className="card-foot">
          {item.status === 'sold' ? (
            <>
              <span className="price">{eur(item.soldPrice)}</span>
              {profit != null && <span className={profit >= 0 ? 'pos' : 'neg'}>{(profit >= 0 ? '+' : '') + eur(profit)}</span>}
            </>
          ) : (
            <>
              <span className="price">{eur(item.askingPrice ?? item.estimate?.suggested)}</span>
              {stale ? (
                <span className="warn">{daysBetween(item.listedDate)} gg online</span>
              ) : (
                item.purchasePrice != null && <span className="muted small">pagato {eur(item.purchasePrice)}</span>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  )
}
