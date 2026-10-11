import type { AccountType, FeePlatform } from './fees'

export type AiProvider = 'gemini' | 'openai'

export interface Fee {
  percent: number
  fixed: number
}

export interface Settings {
  provider: AiProvider
  apiKey: string
  model: string
  accounts: Record<FeePlatform, AccountType>
  negotiation: Record<FeePlatform, number>
  otherFee: Fee
  staleDays: number
}

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-3.6-flash',
  openai: 'gpt-5-mini',
}

const DEFAULTS: Settings = {
  provider: 'gemini',
  apiKey: '',
  model: DEFAULT_MODELS.gemini,
  accounts: { vinted: 'privato', subito: 'privato', ebay: 'privato' },
  negotiation: { vinted: 10, subito: 0, ebay: 10 },
  otherFee: { percent: 0, fixed: 0 },
  staleDays: 30,
}

const KEY = 'rivendo:settings'

function normalize(parsed: Partial<Settings>): Settings {
  if (parsed.model === 'gemini-flash-latest') parsed.model = DEFAULT_MODELS.gemini
  return {
    ...DEFAULTS,
    ...parsed,
    accounts: { ...DEFAULTS.accounts, ...parsed.accounts },
    negotiation: { ...DEFAULTS.negotiation, ...parsed.negotiation },
  }
}

export function loadSettings(userId: string): Settings {
  try {
    const raw = localStorage.getItem(`${KEY}:${userId}`)
    return raw ? normalize(JSON.parse(raw)) : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(s: Settings, userId: string) {
  localStorage.setItem(`${KEY}:${userId}`, JSON.stringify(s))
}

export function mergeSettings(remote: Partial<Settings>, apiKey: string): Settings {
  return { ...normalize({ ...remote }), apiKey }
}
