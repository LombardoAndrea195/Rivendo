import { deleteObject, getBlob, listAll, ref, uploadBytes } from 'firebase/storage'
import { useEffect, useState } from 'react'
import { auth, storage } from './firebase'

// Le foto salvate sono identificate da un id (file in users/{uid}/photos/{id}); quelle non ancora salvate sono data URL.
const cache = new Map<string, Promise<Blob>>()
const objectUrls = new Map<string, string>()

export const isLocalPhoto = (p: string) => p.startsWith('data:') || p.startsWith('blob:')

function dataUrlToBlob(dataUrl: string) {
  const [head, b64] = dataUrl.split(',')
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: head.slice(5, head.indexOf(';')) || 'image/jpeg' })
}

function userFolder(userId = auth.currentUser?.uid) {
  if (!userId) throw new Error('Sessione scaduta: accedi di nuovo.')
  return ref(storage, `users/${userId}/photos`)
}

const photoRef = (photoId: string, userId?: string) => ref(userFolder(userId), photoId)

function fetchFile(photoId: string): Promise<Blob> {
  let pending = cache.get(photoId)
  if (!pending) {
    pending = getBlob(photoRef(photoId))
    pending.catch(() => cache.delete(photoId))
    cache.set(photoId, pending)
  }
  return pending
}

export async function photoBlob(photo: string): Promise<Blob> {
  return photo.startsWith('data:') ? dataUrlToBlob(photo) : fetchFile(photo)
}

export async function photoUrl(photo: string): Promise<string> {
  if (isLocalPhoto(photo)) return photo
  const known = objectUrls.get(photo)
  if (known) return known
  const url = URL.createObjectURL(await fetchFile(photo))
  objectUrls.set(photo, url)
  return url
}

export function usePhotoUrl(photo: string | undefined) {
  const [resolved, setResolved] = useState<{ photo: string; url: string } | null>(null)
  useEffect(() => {
    if (!photo) return
    let alive = true
    photoUrl(photo)
      .then((url) => alive && setResolved({ photo, url }))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [photo])
  if (!photo) return undefined
  if (isLocalPhoto(photo)) return photo
  if (resolved?.photo === photo) return resolved.url
  return objectUrls.get(photo)
}

export async function photoDataUrl(photo: string): Promise<string> {
  if (photo.startsWith('data:')) return photo
  const blob = await photoBlob(photo)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function uploadPhoto(dataUrl: string, userId: string) {
  const blob = dataUrlToBlob(dataUrl)
  const photoId = crypto.randomUUID()
  await uploadBytes(photoRef(photoId, userId), blob, { contentType: blob.type })
  cache.set(photoId, Promise.resolve(blob))
  objectUrls.set(photoId, dataUrl)
  return photoId
}

const ignoreMissing = (e: { code?: string }) => {
  if (e.code !== 'storage/object-not-found') throw e
}

export async function deletePhotos(photoIds: string[]) {
  await Promise.all(photoIds.map((id) => deleteObject(photoRef(id)).catch(ignoreMissing)))
  for (const id of photoIds) {
    cache.delete(id)
    objectUrls.delete(id)
  }
}

// Cancella tutte le foto dell'utente, comprese quelle rimaste orfane da un salvataggio interrotto.
export async function deleteAllPhotos(userId: string) {
  const { items } = await listAll(userFolder(userId))
  await Promise.all(items.map((file) => deleteObject(file).catch(ignoreMissing)))
  cache.clear()
  objectUrls.clear()
}
