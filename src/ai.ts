import { splitDataUrl } from './image'
import { photoDataUrl } from './photos'
import type { Settings } from './settings'
import type { Condition, Item, PriceEstimate } from './types'

export interface AiResult {
  title: string
  description: string
  category: string
  brand: string
  size: string
  condition: Condition
  hashtags: string[]
  estimate: PriceEstimate
}

const PROMPT = `Sei un esperto di compravendita dell'usato in Italia (Vinted, Subito, eBay).
Analizza le foto dell'oggetto e prepara un annuncio di vendita in italiano.
Rispondi SOLO con un oggetto JSON con questa forma:
{
  "title": "titolo efficace, max 70 caratteri, con marca, modello, taglia/variante",
  "description": "descrizione onesta e chiara, 3-6 frasi: cos'è, caratteristiche, condizioni visibili, eventuali difetti. Niente emoji, niente prezzo.",
  "category": "categoria breve (es. Abbigliamento donna, Elettronica, Casa)",
  "brand": "marca o stringa vuota se non riconoscibile",
  "size": "taglia/misura o stringa vuota",
  "condition": "uno tra: nuovo-etichetta, nuovo, ottimo, buono, discreto",
  "hashtags": ["5-8 parole chiave senza #"],
  "estimate": {
    "low": numero in euro,
    "high": numero in euro,
    "suggested": numero in euro, il prezzo di partenza consigliato per vendere in 1-3 settimane,
    "reasoning": "1-2 frasi sul perché di questo prezzo nel mercato dell'usato italiano"
  }
}
Se un dettaglio non è visibile, non inventarlo.`

function contextFor(item: Item) {
  const known = [
    item.title && `Titolo attuale: ${item.title}`,
    item.brand && `Marca: ${item.brand}`,
    item.size && `Taglia: ${item.size}`,
    item.notes && `Note del venditore: ${item.notes}`,
    item.purchasePrice != null && `Pagato dal venditore: ${item.purchasePrice} €`,
  ].filter(Boolean)
  return known.length ? `\n\nInformazioni fornite dal venditore:\n${known.join('\n')}` : ''
}

class AiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const RETRYABLE = new Set([429, 500, 502, 503, 504])
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const GEMINI_FALLBACKS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest']

async function callGemini(s: Settings, model: string, text: string, photos: string[]) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': s.apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text },
              ...photos.map((p) => {
                const { mime, data } = splitDataUrl(p)
                return { inline_data: { mime_type: mime, data } }
              }),
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  )
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new AiError(json?.error?.message ?? `Errore Gemini (${res.status})`, res.status)
  return json.candidates?.[0]?.content?.parts?.find((p: { text?: string; thought?: boolean }) => p.text && !p.thought)?.text as string
}

async function callOpenAI(s: Settings, model: string, text: string, photos: string[]) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.apiKey}` },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text },
            ...photos.map((url) => ({ type: 'image_url', image_url: { url } })),
          ],
        },
      ],
    }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new AiError(json?.error?.message ?? `Errore OpenAI (${res.status})`, res.status)
  return json.choices?.[0]?.message?.content as string
}

function friendly(e: unknown) {
  if (e instanceof SyntaxError) return new Error('La risposta dell’AI non era leggibile. Riprova.')
  if (!(e instanceof AiError)) return e instanceof Error ? e : new Error(String(e))
  if (e.status === 400 && /api key/i.test(e.message)) return new Error('Chiave API non valida: controllala in Impostazioni.')
  if (e.status === 401 || e.status === 403) return new Error('Chiave API non valida o senza permessi: controllala in Impostazioni.')
  if (e.status === 429) return new Error('Hai superato il limite di richieste del piano gratuito. Aspetta un minuto e riprova.')
  if (RETRYABLE.has(e.status)) return new Error('I server dell’AI sono sovraccarichi in questo momento. Riprova tra qualche minuto.')
  return new Error(e.message)
}

export async function analyzeItem(s: Settings, item: Item, onStatus?: (msg: string) => void): Promise<AiResult> {
  if (!s.apiKey) throw new Error('Aggiungi una chiave API nelle Impostazioni per usare l’AI.')
  if (!item.photos.length) throw new Error('Aggiungi almeno una foto.')
  const text = PROMPT + contextFor(item)
  const photos = await Promise.all(item.photos.slice(0, 4).map(photoDataUrl))
  const call = s.provider === 'gemini' ? callGemini : callOpenAI
  const models = s.provider === 'gemini' ? [...new Set([s.model, ...GEMINI_FALLBACKS])] : [s.model]

  let lastError: unknown
  for (const [i, model] of models.entries()) {
    if (i > 0) onStatus?.(`Modello occupato, provo con ${model}…`)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await call(s, model, text, photos)
        if (!raw) throw new Error('Risposta vuota dal modello.')
        const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, '')
        return JSON.parse(cleaned) as AiResult
      } catch (e) {
        lastError = e
        const status = e instanceof AiError ? e.status : 0
        if (status === 404) break
        if (!RETRYABLE.has(status)) throw friendly(e)
        if (attempt === 0) {
          onStatus?.(`Server occupato, riprovo…`)
          await sleep(1500)
        }
      }
    }
  }
  throw friendly(lastError)
}
