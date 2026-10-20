export type AccountType = 'privato' | 'pro'
export type FeePlatform = 'vinted'

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

export function feeRule(account: AccountType): FeeRule {
  return {
    tiers: [],
    fixed: 0,
    summary: 'Gratis',
    note:
      account === 'privato'
        ? 'La commissione (di solito 5% + 0,70 €) la paga l’acquirente. A pagamento solo Boost e Armadio in evidenza.'
        : 'Vinted Pro non costa nulla al venditore: l’acquirente paga la Protezione acquisti Pro (di solito 5% + 0,70 €). Serve un’attività registrata.',
    source: account === 'privato' ? 'https://www.vinted.it/pricelist' : 'https://www.vinted.it/pro',
  }
}

export function computeFee(price: number, rule: Pick<FeeRule, 'tiers' | 'fixed'>) {
  if (price <= 0) return 0
  let fee = 0
  let previous = 0
  for (const tier of rule.tiers) {
    const top = tier.upTo ?? Infinity
    if (price > previous) fee += ((Math.min(price, top) - previous) * tier.percent) / 100
    previous = top
  }
  return fee + rule.fixed
}
