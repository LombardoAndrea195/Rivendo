import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const BUCKET = 'photos'
const TTL = 3600

const cache = new Map<string, { url: string; exp: number }>()
let queue: { path: string; resolve: (url: string) => void; reject: (e: unknown) => void }[] = []
let scheduled = false

export const isLocalPhoto = (p: string) => p.startsWith('data:') || p.startsWith('blob:')

function dataUrlToBlob(dataUrl: string) {
  const [head, b64] = dataUrl.split(',')
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: head.slice(5, head.indexOf(';')) || 'image/jpeg' })
}

function flush() {
  scheduled = false
  const batch = queue
  queue = []
  const paths = [...new Set(batch.map((b) => b.path))]
  supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, TTL)
    .then(({ data, error }) => {
      const found = new Map<string, string>()
      for (const d of data ?? []) {
        if (d.path && d.signedUrl) {
          found.set(d.path, d.signedUrl)
          cache.set(d.path, { url: d.signedUrl, exp: Date.now() + (TTL - 120) * 1000 })
        }
      }
      for (const b of batch) {
        const url = found.get(b.path)
        if (url) b.resolve(url)
        else b.reject(error ?? new Error('Foto non trovata'))
      }
    })
}

export function photoUrl(path: string): Promise<string> {
  if (isLocalPhoto(path)) return Promise.resolve(path)
  const hit = cache.get(path)
  if (hit && hit.exp > Date.now()) return Promise.resolve(hit.url)
  return new Promise((resolve, reject) => {
    queue.push({ path, resolve, reject })
    if (!scheduled) {
      scheduled = true
      queueMicrotask(flush)
    }
  })
}

export function usePhotoUrl(path: string | undefined) {
  const [resolved, setResolved] = useState<{ path: string; url: string } | null>(null)
  useEffect(() => {
    if (!path) return
    let alive = true
    photoUrl(path)
      .then((url) => alive && setResolved({ path, url }))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [path])
  if (!path) return undefined
  if (isLocalPhoto(path)) return path
  if (resolved?.path === path) return resolved.url
  return cache.get(path)?.url
}

export async function photoBlob(path: string): Promise<Blob> {
  if (path.startsWith('data:')) return dataUrlToBlob(path)
  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error || !data) throw error ?? new Error('Impossibile scaricare la foto')
  return data
}

export async function photoDataUrl(path: string): Promise<string> {
  if (path.startsWith('data:')) return path
  const blob = await photoBlob(path)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

const randomId = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`

export async function uploadPhoto(dataUrl: string, userId: string, itemId: string) {
  const blob = dataUrlToBlob(dataUrl)
  const path = `${userId}/${itemId}/${randomId()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'image/jpeg', cacheControl: '3600' })
  if (error) throw error
  cache.set(path, { url: dataUrl, exp: Number.MAX_SAFE_INTEGER })
  return path
}

export async function prunePhotos(userId: string, itemId: string, keep: string[]) {
  const folder = `${userId}/${itemId}`
  const { data } = await supabase.storage.from(BUCKET).list(folder, { limit: 100 })
  const stale = (data ?? []).map((f) => `${folder}/${f.name}`).filter((p) => !keep.includes(p))
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale)
}
