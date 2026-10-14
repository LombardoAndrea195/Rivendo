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

// Solo se l'utente lo chiede, la chiave resta nel suo browser: non arriva mai al sito.
const KEY_STORAGE = 'rivendo:api-key'

export function rememberedKey(): { provider: AiProvider; apiKey: string } | null {
  try {
    const raw = localStorage.getItem(KEY_STORAGE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function rememberKey(s: Settings | null) {
  if (s) localStorage.setItem(KEY_STORAGE, JSON.stringify({ provider: s.provider, apiKey: s.apiKey }))
  else localStorage.removeItem(KEY_STORAGE)
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini',
  apiKey: '',
  model: DEFAULT_MODELS.gemini,
  accounts: { vinted: 'privato', subito: 'privato', ebay: 'privato' },
  negotiation: { vinted: 10, subito: 0, ebay: 10 },
  otherFee: { percent: 0, fixed: 0 },
}
