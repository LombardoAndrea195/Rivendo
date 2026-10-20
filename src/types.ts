export type Condition = 'nuovo-etichetta' | 'nuovo' | 'ottimo' | 'buono' | 'discreto'

export interface PriceEstimate {
  low: number
  high: number
  suggested: number
  reasoning: string
}

// Esiste solo in memoria: ricaricando la pagina si riparte da zero.
export interface Item {
  photos: string[]
  title: string
  description: string
  category: string
  brand: string
  size: string
  condition: Condition
  hashtags: string[]
  purchasePrice: number | null
  askingPrice: number | null
  notes: string
  estimate: PriceEstimate | null
}

export const CONDITIONS: { id: Condition; label: string }[] = [
  { id: 'nuovo-etichetta', label: 'Nuovo con etichetta' },
  { id: 'nuovo', label: 'Nuovo senza etichetta' },
  { id: 'ottimo', label: 'Ottime condizioni' },
  { id: 'buono', label: 'Buone condizioni' },
  { id: 'discreto', label: 'Discrete condizioni' },
]

export function newItem(): Item {
  return {
    photos: [],
    title: '',
    description: '',
    category: '',
    brand: '',
    size: '',
    condition: 'ottimo',
    hashtags: [],
    purchasePrice: null,
    askingPrice: null,
    notes: '',
    estimate: null,
  }
}
