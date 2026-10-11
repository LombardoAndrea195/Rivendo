import { newItem, type Item } from './types'

const daysAgo = (n: number) => {
  const d = new Date(Date.now() - n * 86_400_000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function demoItems(): Item[] {
  const rows: Partial<Item>[] = [
    { title: 'Lampada Kartell Bourgie trasparente', brand: 'Kartell', category: 'Casa', purchasePrice: 40, askingPrice: 120, status: 'sold', listedDate: daysAgo(75), soldDate: daysAgo(60), soldPrice: 110, soldPlatform: 'subito' },
    { title: 'Nintendo Switch Lite turchese', brand: 'Nintendo', category: 'Videogiochi', purchasePrice: 90, askingPrice: 140, status: 'sold', listedDate: daysAgo(30), soldDate: daysAgo(21), soldPrice: 135, soldPlatform: 'ebay', shippingCost: 6 },
    { title: 'Nike Air Max 90 bianche, taglia 42', brand: 'Nike', size: '42', category: 'Scarpe uomo', purchasePrice: 25, askingPrice: 65, status: 'sold', listedDate: daysAgo(12), soldDate: daysAgo(5), soldPrice: 60, soldPlatform: 'vinted' },
    { title: 'Moka Bialetti Express 6 tazze', brand: 'Bialetti', category: 'Casa', purchasePrice: 5, askingPrice: 22, status: 'listed', listedDate: daysAgo(52) },
    { title: 'Giacca Levi’s Trucker in denim, taglia M', brand: 'Levi’s', size: 'M', category: 'Abbigliamento uomo', purchasePrice: 12, askingPrice: 38, status: 'listed', listedDate: daysAgo(6) },
    { title: 'Cofanetto Harry Potter, 7 libri', category: 'Libri', purchasePrice: 15, askingPrice: 45, status: 'draft' },
  ]
  return rows.map((r, i) => ({
    ...newItem(),
    description: 'Oggetto di esempio: aprilo per vedere il calcolo del profitto e l’annuncio pronto da copiare.',
    purchaseDate: daysAgo(90 - i * 10),
    createdAt: Date.now() - i * 1000,
    ...r,
  }))
}
