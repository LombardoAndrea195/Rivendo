import type { AccountType, FeePlatform } from './fees'

export type AiProvider = 'gemini' | 'openai'

// Le impostazioni restano solo in memoria, come la chiave API: nulla viene salvato nel browser.
export interface Settings {
  provider: AiProvider
  apiKey: string
  model: string
  accounts: Record<FeePlatform, AccountType>
  negotiation: Record<FeePlatform, number>
}

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-3.6-flash',
  openai: 'gpt-5-mini',
}

export interface ModelOption {
  id: string
  label: string
  note: string
}

// Modelli che leggono le immagini, verificati sulle pagine ufficiali il 14 ottobre 2026.
export const MODEL_OPTIONS: Record<AiProvider, ModelOption[]> = {
  gemini: [
    { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', note: 'Consigliato: veloce e preciso' },
    { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', note: 'Il più recente' },
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', note: 'Il più economico, più margine nel piano gratuito' },
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', note: 'Qualità massima, più lento (anteprima)' },
  ],
  openai: [
    { id: 'gpt-5-mini', label: 'GPT-5 mini', note: 'Consigliato: buon rapporto qualità/prezzo' },
    { id: 'gpt-5-nano', label: 'GPT-5 nano', note: 'Il più economico' },
    { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini', note: 'Più preciso, costa circa il triplo' },
    { id: 'gpt-5.5', label: 'GPT-5.5', note: 'Qualità massima, il più costoso' },
  ],
}

const NOT_FOR_LISTINGS = /tts|audio|realtime|live|image|embed|transcribe|search|codex|cyber|translate|omni|veo|lyria|imagen|aqa|research|antigravity|robotics|computer|moderation|dall-e|whisper|sora/

// Elenca i modelli disponibili per la chiave dell'utente, escludendo quelli che non servono a scrivere testi.
export async function fetchModels(provider: AiProvider, apiKey: string): Promise<string[]> {
  if (provider === 'gemini') {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', { headers: { 'x-goog-api-key': apiKey } })
    if (!res.ok) throw new Error('Non riesco a leggere i modelli: controlla la chiave.')
    const json = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] }
    return (json.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''))
      .filter((id) => id.startsWith('gemini') && !NOT_FOR_LISTINGS.test(id))
      .sort()
      .reverse()
  }
  const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${apiKey}` } })
  if (!res.ok) throw new Error('Non riesco a leggere i modelli: controlla la chiave.')
  const json = (await res.json()) as { data?: { id: string }[] }
  return (json.data ?? [])
    .map((m) => m.id)
    .filter((id) => /^(gpt-[4-9]|o\d)/.test(id) && !NOT_FOR_LISTINGS.test(id))
    .sort()
    .reverse()
}

// Solo se l'utente lo chiede, la chiave resta nel suo browser: non arriva mai al sito.
const KEY_STORAGE = 'rivendo:api-key'

export function rememberedKey(): { provider: AiProvider; apiKey: string; model?: string } | null {
  try {
    const raw = localStorage.getItem(KEY_STORAGE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function rememberKey(s: Settings | null) {
  if (s) localStorage.setItem(KEY_STORAGE, JSON.stringify({ provider: s.provider, apiKey: s.apiKey, model: s.model }))
  else localStorage.removeItem(KEY_STORAGE)
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini',
  apiKey: '',
  model: DEFAULT_MODELS.gemini,
  accounts: { vinted: 'privato' },
  negotiation: { vinted: 10 },
}
