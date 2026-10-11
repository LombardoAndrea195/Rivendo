import { ID, Permission, Role } from 'appwrite'
import { useEffect, useState } from 'react'
import { client, PHOTOS_BUCKET, storage } from './appwrite'

// Le foto salvate sono identificate dall'id del file su Appwrite; quelle non ancora salvate sono data URL.
const cache = new Map<string, Promise<Blob>>()
const objectUrls = new Map<string, string>()

export const isLocalPhoto = (p: string) => p.startsWith('data:') || p.startsWith('blob:')

function dataUrlToBlob(dataUrl: string) {
  const [head, b64] = dataUrl.split(',')
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: head.slice(5, head.indexOf(';')) || 'image/jpeg' })
}

// Scarica la foto passando la sessione anche quando il browser blocca i cookie di terze parti (es. Safari).
function fetchFile(fileId: string): Promise<Blob> {
  let pending = cache.get(fileId)
  if (!pending) {
    const url = new URL(storage.getFileView({ bucketId: PHOTOS_BUCKET, fileId }))
    pending = client.call('get', url, {}, {}, 'arrayBuffer').then((buf: ArrayBuffer) => new Blob([buf], { type: 'image/jpeg' }))
    pending.catch(() => cache.delete(fileId))
    cache.set(fileId, pending)
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

export const ownerOnly = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
]

export async function uploadPhoto(dataUrl: string, userId: string) {
  const blob = dataUrlToBlob(dataUrl)
  const file = await storage.createFile({
    bucketId: PHOTOS_BUCKET,
    fileId: ID.unique(),
    file: new File([blob], `${userId}.jpg`, { type: blob.type }),
    permissions: ownerOnly(userId),
  })
  cache.set(file.$id, Promise.resolve(blob))
  objectUrls.set(file.$id, dataUrl)
  return file.$id
}

export async function deletePhotos(fileIds: string[]) {
  await Promise.all(
    fileIds.map((fileId) =>
      storage.deleteFile({ bucketId: PHOTOS_BUCKET, fileId }).catch((e: { code?: number }) => {
        if (e.code !== 404) throw e
      }),
    ),
  )
  for (const id of fileIds) {
    cache.delete(id)
    objectUrls.delete(id)
  }
}
