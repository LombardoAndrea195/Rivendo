export type Status = 'draft' | 'listed' | 'sold'
export type Platform = 'vinted' | 'subito' | 'ebay' | 'altro'
export type Condition = 'nuovo-etichetta' | 'nuovo' | 'ottimo' | 'buono' | 'discreto'

export interface PriceEstimate {
  low: number
  high: number
  suggested: number
  reasoning: string
}

export interface Item {
  id: string
  createdAt: number
  updatedAt: number
  photos: string[]
  title: string
  description: string
  category: string
  brand: string
  size: string
  condition: Condition
  hashtags: string[]
  purchasePrice: number | null
  purchaseDate: string
  purchaseSource: string
  askingPrice: number | null
  status: Status
  listedDate: string
  listedOn?: Platform[]
  soldPrice: number | null
  soldDate: string
  soldPlatform: Platform | ''
  shippingCost: number | null
  ebayCategory?: string
  notes: string
  estimate: PriceEstimate | null
}

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'vinted', label: 'Vinted' },
  { id: 'subito', label: 'Subito' },
  { id: 'ebay', label: 'eBay' },
  { id: 'altro', label: 'Altro' },
]

export const CONDITIONS: { id: Condition; label: string }[] = [
  { id: 'nuovo-etichetta', label: 'Nuovo con etichetta' },
  { id: 'nuovo', label: 'Nuovo senza etichetta' },
  { id: 'ottimo', label: 'Ottime condizioni' },
  { id: 'buono', label: 'Buone condizioni' },
  { id: 'discreto', label: 'Discrete condizioni' },
]

export const STATUSES: { id: Status; label: string }[] = [
  { id: 'draft', label: 'Da pubblicare' },
  { id: 'listed', label: 'In vendita' },
  { id: 'sold', label: 'Venduto' },
]

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function newItem(): Item {
  const now = Date.now()
  return {
    id: crypto.randomUUID?.() ?? `${now.toString(36)}-${Math.random().toString(36).slice(2)}`,
    createdAt: now,
    updatedAt: now,
    photos: [],
    title: '',
    description: '',
    category: '',
    brand: '',
    size: '',
    condition: 'ottimo',
    hashtags: [],
    purchasePrice: null,
    purchaseDate: today(),
    purchaseSource: '',
    askingPrice: null,
    status: 'draft',
    listedDate: '',
    soldPrice: null,
    soldDate: '',
    soldPlatform: '',
    shippingCost: null,
    notes: '',
    estimate: null,
  }
}
