import { useMemo } from 'react'
import Photo from './Photo'
import { daysBetween, eur, profitOf } from '../listing'
import type { Settings } from '../settings'
import type { Item } from '../types'

interface Props {
  items: Item[]
  settings: Settings
  onOpen: (item: Item) => void
}

export default function Dashboard({ items, settings, onOpen }: Props) {
  const stats = useMemo(() => {
    const sold = items.filter((i) => i.status === 'sold' && i.soldPrice != null)
    const unsold = items.filter((i) => i.status !== 'sold')
    const revenue = sold.reduce((s, i) => s + (i.soldPrice ?? 0), 0)
    const profit = sold.reduce((s, i) => s + (profitOf(i, settings) ?? 0), 0)
    const soldCost = sold.reduce((s, i) => s + (i.purchasePrice ?? 0), 0)
    const stockCost = unsold.reduce((s, i) => s + (i.purchasePrice ?? 0), 0)
    const potential = unsold.reduce((s, i) => s + (i.askingPrice ?? i.estimate?.suggested ?? 0), 0)
    const timed = sold.filter((i) => i.listedDate && i.soldDate)
    const avgDays = timed.length ? timed.reduce((s, i) => s + daysBetween(i.listedDate, i.soldDate), 0) / timed.length : null

    const months = Array.from({ length: 6 }, (_, k) => {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - (5 - k))
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const inMonth = sold.filter((i) => i.soldDate.startsWith(key))
      return {
        key,
        label: d.toLocaleDateString('it-IT', { month: 'short' }),
        profit: inMonth.reduce((s, i) => s + (profitOf(i, settings) ?? 0), 0),
        count: inMonth.length,
      }
    })

    const stale = items
      .filter((i) => i.status === 'listed' && i.listedDate && daysBetween(i.listedDate) >= settings.staleDays)
      .sort((a, b) => a.listedDate.localeCompare(b.listedDate))

    return {
      soldCount: sold.length,
      revenue,
      profit,
      roi: soldCost > 0 ? (profit / soldCost) * 100 : null,
      stockCost,
      stockCount: unsold.length,
      potential,
      avgDays,
      months,
      stale,
    }
  }, [items, settings])

  const max = Math.max(1, ...stats.months.map((m) => Math.abs(m.profit)))

  return (
    <section className="stack">
      <div className="kpis">
        <Kpi label="Profitto netto" value={eur(stats.profit)} hint={`${stats.soldCount} venduti`} tone={stats.profit >= 0 ? 'pos' : 'neg'} />
        <Kpi label="Incassato" value={eur(stats.revenue)} hint={stats.roi != null ? `ROI ${stats.roi.toFixed(0)}%` : 'ROI —'} />
        <Kpi label="Capitale in magazzino" value={eur(stats.stockCost)} hint={`${stats.stockCount} oggetti`} />
        <Kpi label="Valore potenziale" value={eur(stats.potential)} hint="ai prezzi richiesti" />
        <Kpi
          label="Tempo medio di vendita"
          value={stats.avgDays != null ? `${Math.round(stats.avgDays)} gg` : '—'}
          hint="da pubblicato a venduto"
        />
      </div>

      <div className="panel">
        <h2>Profitto negli ultimi 6 mesi</h2>
        <div className="chart" role="img" aria-label="Grafico del profitto mensile">
          {stats.months.map((m) => (
            <div key={m.key} className="bar-col" title={`${eur(m.profit)} · ${m.count} vendite`}>
              <span className="bar-value">{m.count ? eur(m.profit) : ''}</span>
              <div className={`bar ${m.profit < 0 ? 'bar-neg' : ''}`} style={{ height: `${(Math.abs(m.profit) / max) * 100}%` }} />
              <span className="bar-label">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>Fermi da più di {settings.staleDays} giorni</h2>
        {stats.stale.length === 0 ? (
          <p className="muted">Nessun annuncio fermo. Ottimo lavoro.</p>
        ) : (
          <>
            <p className="muted small">Un ribasso del 10% o nuove foto spesso sbloccano la vendita. Ripubblicare l’annuncio lo riporta in cima.</p>
            <ul className="list">
              {stats.stale.map((i) => {
                const price = i.askingPrice ?? i.estimate?.suggested
                return (
                  <li key={i.id}>
                    <button className="row" onClick={() => onOpen(i)}>
                      <span className="thumb">{i.photos[0] ? <Photo path={i.photos[0]} /> : '📷'}</span>
                      <span className="row-main">
                        <span className="row-title">{i.title || 'Senza titolo'}</span>
                        <span className="muted small">online da {daysBetween(i.listedDate)} giorni</span>
                      </span>
                      <span className="row-side">
                        <span>{eur(price)}</span>
                        {price != null && <span className="muted small">prova {eur(Math.floor(price * 0.9))}</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className={`kpi-value ${tone ?? ''}`}>{value}</span>
      {hint && <span className="muted small">{hint}</span>}
    </div>
  )
}
