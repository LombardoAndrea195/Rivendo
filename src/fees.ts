export type AccountType = 'privato' | 'pro'
export type FeePlatform = 'vinted' | 'subito' | 'ebay'

export const FEES_CHECKED = '11 ottobre 2026'

interface Tier {
  upTo: number | null
  percent: number
}

export interface FeeRule {
  tiers: Tier[]
  fixed: number
  summary: string
  note: string
  source: string
}

const free = (note: string, source: string): FeeRule => ({ tiers: [], fixed: 0, summary: 'Gratis', note, source })

export const EBAY_PRO_CATEGORIES: { id: string; label: string; tiers: Tier[] }[] = [
  { id: 'altro', label: 'Abbigliamento, libri, musica, videogiochi, sport e altre', tiers: [{ upTo: null, percent: 11 }] },
  { id: 'casa', label: 'Casa, arredamento e bricolage', tiers: [{ upTo: null, percent: 11 }] },
  { id: 'tech', label: 'Smartphone, console, PC, tablet, TV, fotocamere, elettrodomestici', tiers: [{ upTo: null, percent: 6.5 }] },
  { id: 'tech-acc', label: 'TV/Audio, Informatica, Foto e video, Strumenti musicali', tiers: [{ upTo: null, percent: 8.5 }] },
  { id: 'acc-elettronici', label: 'Accessori per cellulari, PC, tablet, TV', tiers: [{ upTo: null, percent: 9.5 }] },
  { id: 'scarpe', label: 'Scarpe', tiers: [{ upTo: 100, percent: 11 }, { upTo: null, percent: 5 }] },
  { id: 'borse', label: 'Borse e borsette', tiers: [{ upTo: 990, percent: 11 }, { upTo: null, percent: 2 }] },
  { id: 'gioielli', label: 'Gioielli', tiers: [{ upTo: 990, percent: 11 }, { upTo: null, percent: 4 }] },
  { id: 'orologi', label: 'Orologi', tiers: [{ upTo: 100, percent: 11 }, { upTo: 990, percent: 5 }, { upTo: null, percent: 2 }] },
  { id: 'collezionismo', label: 'Arte, antiquariato, giocattoli, monete, collezionismo', tiers: [{ upTo: 990, percent: 11 }, { upTo: null, percent: 2 }] },
  { id: 'carte', label: 'Carte collezionabili e action figure', tiers: [{ upTo: 990, percent: 6.5 }, { upTo: null, percent: 2 }] },
  { id: 'fumetti', label: 'Fumetti e manga', tiers: [{ upTo: null, percent: 6.5 }] },
  { id: 'bellezza-el', label: 'Bellezza e salute (prodotti elettrici)', tiers: [{ upTo: null, percent: 6.5 }] },
  { id: 'ricambi-casa', label: 'Ricambi per elettrodomestici', tiers: [{ upTo: null, percent: 9.5 }] },
  { id: 'giardino', label: 'Giardino e arredamento esterni', tiers: [{ upTo: null, percent: 12 }] },
  { id: 'ricambi-moto', label: 'Ricambi e accessori moto', tiers: [{ upTo: null, percent: 12 }] },
  { id: 'ricambi-auto', label: 'Ricambi e accessori auto', tiers: [{ upTo: null, percent: 12.5 }] },
]

const EBAY_REGULATORY_PERCENT = 0.35
const EBAY_FIXED_PER_ORDER = 0.35

const SOURCES = {
  vinted: { privato: 'https://www.vinted.it/pricelist', pro: 'https://www.vinted.it/pro' },
  subito: { privato: 'https://www.subito.it/vendere/', pro: 'https://info.subito.it/policies/tutto-subito-per-professionisti.htm' },
  ebay: {
    privato: 'https://www.ebay.it/help/selling/fees-credits-invoices/selling-fees?id=4822',
    pro: 'https://www.ebay.it/help/selling/fees-credits-invoices/servizi-di-pagamento-tariffe-per-venditori-professionali?id=4809',
  },
}

export function feeRule(platform: FeePlatform, account: AccountType, ebayCategory = 'altro'): FeeRule {
  const source = SOURCES[platform][account]
  if (platform === 'vinted') {
    return free(
      account === 'privato'
        ? 'La commissione (di solito 5% + 0,70 €) la paga l’acquirente. A pagamento solo Boost e Armadio in evidenza.'
        : 'Vinted Pro non costa nulla al venditore: l’acquirente paga la Protezione acquisti Pro (di solito 5% + 0,70 €). Serve un’attività registrata.',
      source,
    )
  }
  if (platform === 'subito') {
    return free(
      account === 'privato'
        ? 'Pubblicazione e vendita gratuite. Con TuttoSubito le commissioni le paga l’acquirente.'
        : 'Nessuna commissione sulla vendita: con TuttoSubito per Professionisti l’acquirente paga 1,20 € + 5% (4,5% sopra 300 €). Eventuali abbonamenti Subito per Aziende non sono inclusi.',
      source,
    )
  }
  if (account === 'privato') {
    return free(
      'Gratis dal 1° settembre 2026 per i privati residenti nel SEE. Si paga solo oltre 150 inserzioni al mese, per le opzioni facoltative o le spedizioni fuori Eurozona.',
      source,
    )
  }
  const cat = EBAY_PRO_CATEGORIES.find((c) => c.id === ebayCategory) ?? EBAY_PRO_CATEGORIES[0]
  const tiers = cat.tiers.map((t) => ({ ...t, percent: t.percent + EBAY_REGULATORY_PERCENT }))
  const base = cat.tiers
    .map((t, i) => {
      const from = i === 0 ? null : cat.tiers[i - 1].upTo
      const pct = `${t.percent.toLocaleString('it-IT')}%`
      if (t.upTo != null && from == null) return `${pct} fino a ${t.upTo} €`
      if (t.upTo != null) return `${pct} da ${from} a ${t.upTo} €`
      return from != null ? `${pct} oltre ${from} €` : pct
    })
    .join(', ')
  return {
    tiers,
    fixed: EBAY_FIXED_PER_ORDER,
    summary: `${base} + 0,35 € a ordine + 0,35%`,
    note: 'Commissione sul valore finale + 0,35 € per ordine + tariffa normativa 0,35%. Calcolate sul totale pagato (spedizione inclusa), IVA esclusa. Tariffe d’inserzione oltre la quota gratuita non incluse.',
    source,
  }
}

export function computeFee(price: number, rule: Pick<FeeRule, 'tiers' | 'fixed'>) {
  if (price <= 0) return 0
  let fee = 0
  let prev = 0
  for (const t of rule.tiers) {
    const top = t.upTo ?? Infinity
    if (price > prev) fee += ((Math.min(price, top) - prev) * t.percent) / 100
    prev = top
  }
  return fee + rule.fixed
}
