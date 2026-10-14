import type { AccountType, FeePlatform } from './fees'

export type AiProvider = 'gemini' | 'openai'

export interface Fee {
  percent: number
  fixed: number
}

// Le impostazioni restano solo in memoria, come la chiave API: nulla viene salvato nel browser.
export interface Settings {
  provider: AiProvider
  apiKey: string
  model: string
  accounts: Record<FeePlatform, AccountType>
  negotiation: Record<FeePlatform, number>
  otherFee: Fee
}

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-3.6-flash',
  openai: 'gpt-5-mini',
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini',
  apiKey: '',
  model: DEFAULT_MODELS.gemini,
  accounts: { vinted: 'privato', subito: 'privato', ebay: 'privato' },
  negotiation: { vinted: 10, subito: 0, ebay: 10 },
  otherFee: { percent: 0, fixed: 0 },
}
