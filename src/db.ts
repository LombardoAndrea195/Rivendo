import { createStore, values, clear } from 'idb-keyval'
import { prunePhotos, uploadPhoto } from './photos'
import type { Settings } from './settings'
import { supabase } from './supabase'
import type { Item } from './types'

async function currentUserId() {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('Sessione scaduta: accedi di nuovo.')
  return id
}

export async function loadItems(): Promise<Item[]> {
  const { data, error } = await supabase.from('items').select('data').order('created_at', { ascending: false })
  if (error) throw error
  return data.map((row) => row.data as Item)
}

export async function saveItem(item: Item): Promise<Item> {
  const userId = await currentUserId()
  const photos = await Promise.all(item.photos.map((p) => (p.startsWith('data:') ? uploadPhoto(p, userId, item.id) : p)))
  const saved: Item = { ...item, photos }
  const { error } = await supabase
    .from('items')
    .upsert({ user_id: userId, id: item.id, data: saved, updated_at: new Date().toISOString() })
  if (error) throw error
  await prunePhotos(userId, item.id, photos)
  return saved
}

export async function deleteItem(id: string) {
  const userId = await currentUserId()
  const { error } = await supabase.from('items').delete().eq('user_id', userId).eq('id', id)
  if (error) throw error
  await prunePhotos(userId, id, [])
}

type SyncedSettings = Omit<Settings, 'apiKey'>

export async function loadRemoteSettings(): Promise<Partial<SyncedSettings> | null> {
  const { data, error } = await supabase.from('user_settings').select('data').maybeSingle()
  if (error) throw error
  return (data?.data as Partial<SyncedSettings>) ?? null
}

export async function saveRemoteSettings(settings: Settings) {
  const userId = await currentUserId()
  const { apiKey: _local, ...synced } = settings
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, data: synced, updated_at: new Date().toISOString() })
  if (error) throw error
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
