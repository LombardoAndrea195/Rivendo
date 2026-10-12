import { deleteUser } from 'firebase/auth'
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore/lite'
import { createStore, values, clear } from 'idb-keyval'
import { auth, db } from './firebase'
import { deleteAllPhotos, deletePhotos, uploadPhoto } from './photos'
import type { Settings } from './settings'
import type { Item } from './types'

// Struttura: users/{uid} (impostazioni) e users/{uid}/items/{itemId}. Le regole in firestore.rules limitano tutto al proprietario.
function currentUserId() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Sessione scaduta: accedi di nuovo.')
  return uid
}

const userDoc = (uid: string) => doc(db, 'users', uid)
const itemsOf = (uid: string) => collection(db, 'users', uid, 'items')

const parse = (data: { data?: unknown } | undefined) => JSON.parse(String(data?.data)) as Item

export async function loadItems(): Promise<Item[]> {
  const snap = await getDocs(itemsOf(currentUserId()))
  return snap.docs.map((d) => parse(d.data()))
}

async function storedItem(uid: string, id: string): Promise<Item | null> {
  const snap = await getDoc(doc(itemsOf(uid), id))
  return snap.exists() ? parse(snap.data()) : null
}

export async function saveItem(item: Item): Promise<Item> {
  const uid = currentUserId()
  const previous = await storedItem(uid, item.id)
  const photos = await Promise.all(item.photos.map((p) => (p.startsWith('data:') ? uploadPhoto(p, uid) : p)))
  const saved: Item = { ...item, photos }
  await setDoc(doc(itemsOf(uid), item.id), { data: JSON.stringify(saved) })
  const removed = (previous?.photos ?? []).filter((p) => !photos.includes(p))
  if (removed.length) await deletePhotos(removed)
  return saved
}

export async function deleteItem(id: string) {
  const uid = currentUserId()
  const previous = await storedItem(uid, id)
  if (!previous) return
  await deleteDoc(doc(itemsOf(uid), id))
  await deletePhotos(previous.photos.filter((p) => !p.startsWith('data:')))
}

type SyncedSettings = Omit<Settings, 'apiKey'>

export async function loadRemoteSettings(): Promise<Partial<SyncedSettings> | null> {
  const snap = await getDoc(userDoc(currentUserId()))
  return snap.exists() ? (JSON.parse(String(snap.data().settings)) as Partial<SyncedSettings>) : null
}

export async function saveRemoteSettings(settings: Settings) {
  const { apiKey: _local, ...synced } = settings
  await setDoc(userDoc(currentUserId()), { settings: JSON.stringify(synced) })
}

const RECENT_LOGIN_MS = 4 * 60 * 1000

// Firebase permette di eliminare l'utente solo poco dopo l'accesso: lo verifichiamo prima di cancellare i dati.
export async function deleteAccount() {
  const user = auth.currentUser
  if (!user) throw new Error('Sessione scaduta: accedi di nuovo.')
  const { authTime } = await user.getIdTokenResult()
  if (Date.now() - new Date(authTime).getTime() > RECENT_LOGIN_MS) {
    throw new Error('Per sicurezza serve un accesso recente: esci, accedi di nuovo e ripeti la cancellazione entro qualche minuto.')
  }
  const items = await getDocs(itemsOf(user.uid))
  for (let i = 0; i < items.docs.length; i += 400) {
    const batch = writeBatch(db)
    for (const d of items.docs.slice(i, i + 400)) batch.delete(d.ref)
    await batch.commit()
  }
  await deleteAllPhotos(user.uid)
  await deleteDoc(userDoc(user.uid))
  await deleteUser(user)
}

// Dati salvati nel browser dalla prima versione (senza account).
const legacyStore = () => createStore('rivendo', 'items')

export async function loadLegacyItems(): Promise<Item[]> {
  try {
    return await values<Item>(legacyStore())
  } catch {
    return []
  }
}

export const clearLegacyItems = () => clear(legacyStore())
