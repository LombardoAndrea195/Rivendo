import { CONDITIONS, type Item, type Platform } from './types'
import { computeFee, feeRule } from './fees'
import type { Settings } from './settings'

export const eur = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

export const conditionLabel = (c: Item['condition']) => CONDITIONS.find((x) => x.id === c)?.label ?? c

export function platformFee(price: number, platform: Platform, settings: Settings, item?: Pick<Item, 'ebayCategory'>) {
  if (platform === 'altro') return computeFee(price, { tiers: [{ upTo: null, percent: settings.otherFee.percent }], fixed: settings.otherFee.fixed })
  return computeFee(price, feeRule(platform, settings.accounts[platform], item?.ebayCategory))
}

export function profitOf(item: Item, settings: Settings, price = item.soldPrice) {
  if (price == null) return null
  const fee = platformFee(price, item.soldPlatform || 'altro', settings, item)
  return price - fee - (item.purchasePrice ?? 0) - (item.shippingCost ?? 0)
}

export function negotiationMargin(platform: Platform, settings: Settings) {
  return platform === 'altro' ? 0 : settings.negotiation[platform]
}

export function listPrice(target: number, platform: Platform, settings: Settings) {
  const margin = negotiationMargin(platform, settings)
  return margin > 0 ? Math.ceil(target * (1 + margin / 100)) : target
}

export function daysBetween(from: string | number, to: string | number = Date.now()) {
  return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000))
}

const TITLE_LIMIT: Partial<Record<Platform, number>> = { ebay: 80 }

export function titleLimit(p: Platform) {
  return TITLE_LIMIT[p]
}

export function buildListing(item: Item, platform: Platform) {
  const title = item.title.trim()
  const details = [
    item.brand && `Marca: ${item.brand}`,
    item.size && `Taglia/Misura: ${item.size}`,
    `Condizioni: ${conditionLabel(item.condition)}`,
  ].filter(Boolean) as string[]

  const tags = item.hashtags.map((t) => t.replace(/^#/, '').replace(/\s+/g, ''))
  const body = item.description.trim()
  let text: string

  switch (platform) {
    case 'vinted':
      text = [body, '', ...details, '', 'Spedisco in 1-2 giorni, imballato con cura.', tags.length ? '\n' + tags.map((t) => `#${t}`).join(' ') : '']
        .join('\n')
        .trim()
      break
    case 'subito':
      text = [body, '', ...details.map((d) => `• ${d}`), '', 'Disponibile per spedizione o consegna a mano. Scrivimi per qualsiasi domanda.']
        .join('\n')
        .trim()
      break
    case 'ebay':
      text = [body, '', 'DETTAGLI', ...details.map((d) => `- ${d}`), '', 'Spedizione tracciata. Per domande usate i messaggi eBay.'].join('\n').trim()
      break
    default:
      text = [body, '', ...details].join('\n').trim()
  }
  return { title, text }
}
