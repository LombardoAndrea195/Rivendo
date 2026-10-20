import { CONDITIONS, type Item } from './types'
import { computeFee, feeRule } from './fees'
import type { Settings } from './settings'

export const eur = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

export const conditionLabel = (c: Item['condition']) => CONDITIONS.find((x) => x.id === c)?.label ?? c

export function platformFee(price: number, settings: Settings) {
  return computeFee(price, feeRule(settings.accounts.vinted))
}

export function negotiationMargin(settings: Settings) {
  return settings.negotiation.vinted
}

export function listPrice(target: number, settings: Settings) {
  const margin = negotiationMargin(settings)
  return margin > 0 ? Math.ceil(target * (1 + margin / 100)) : target
}

export function buildListing(item: Item) {
  const title = item.title.trim()
  const details = [
    item.brand && `Marca: ${item.brand}`,
    item.size && `Taglia/Misura: ${item.size}`,
    `Condizioni: ${conditionLabel(item.condition)}`,
  ].filter(Boolean) as string[]

  const tags = item.hashtags.map((t) => t.replace(/^#/, '').replace(/\s+/g, ''))
  const body = item.description.trim()
  const text = [body, '', ...details, '', 'Spedisco in 1-2 giorni, imballato con cura.', tags.length ? '\n' + tags.map((t) => `#${t}`).join(' ') : '']
    .join('\n')
    .trim()
  return { title, text }
}
