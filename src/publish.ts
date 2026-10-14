import type { Platform } from './types'

const photoBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob()

export const SELL_URLS: Partial<Record<Platform, string>> = {
  vinted: 'https://www.vinted.it/items/new',
  subito: 'https://inserimento.subito.it/',
  ebay: 'https://www.ebay.it/sl/sell',
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'oggetto'

async function photoFiles(photos: string[], title: string) {
  const base = slug(title)
  return Promise.all(
    photos.map(async (p, i) => {
      const blob = await photoBlob(p)
      return new File([blob], `${base}-${i + 1}.jpg`, { type: blob.type || 'image/jpeg' })
    }),
  )
}

export async function downloadPhotos(photos: string[], title: string) {
  for (const file of await photoFiles(photos, title)) {
    const url = URL.createObjectURL(file)
    Object.assign(document.createElement('a'), { href: url, download: file.name }).click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    await new Promise((r) => setTimeout(r, 250))
  }
}

export function canShareFiles() {
  if (!navigator.canShare || !/Android|iPhone|iPad/i.test(navigator.userAgent)) return false
  try {
    return navigator.canShare({ files: [new File([new Uint8Array(1)], 'x.jpg', { type: 'image/jpeg' })] })
  } catch {
    return false
  }
}

export async function sharePhotos(photos: string[], title: string, text: string) {
  try {
    await navigator.share({ files: await photoFiles(photos, title), title, text })
  } catch (e) {
    if (!(e instanceof DOMException && e.name === 'AbortError')) throw e
  }
}

export async function copyText(text: string) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  const ta = Object.assign(document.createElement('textarea'), { value: text })
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  ta.remove()
}
