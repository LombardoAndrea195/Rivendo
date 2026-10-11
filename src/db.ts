import { ExecutionMethod, Query } from 'appwrite'
import { createStore, values, clear } from 'idb-keyval'
import { account, DATABASE_ID, DELETE_ACCOUNT_FUNCTION, functions, ITEMS_TABLE, SETTINGS_TABLE, tablesDB } from './appwrite'
import { deletePhotos, ownerOnly, uploadPhoto } from './photos'
import type { Settings } from './settings'
import type { Item } from './types'

let cachedUserId: string | null = null

async function currentUserId() {
  if (cachedUserId) return cachedUserId
  try {
    cachedUserId = (await account.get()).$id
    return cachedUserId
  } catch {
    throw new Error('Sessione scaduta: accedi di nuovo.')
  }
}

export function forgetUser() {
  cachedUserId = null
}

const parse = (row: object) => JSON.parse(String((row as { data?: unknown }).data)) as Item

export async function loadItems(): Promise<Item[]> {
  const items: Item[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: ITEMS_TABLE,
      queries: [Query.limit(100), Query.orderDesc('$createdAt'), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
    })
    items.push(...page.rows.map(parse))
    if (page.rows.length < 100) return items
    cursor = page.rows[page.rows.length - 1].$id
  }
}

async function storedItem(id: string): Promise<Item | null> {
  try {
    return parse(await tablesDB.getRow({ databaseId: DATABASE_ID, tableId: ITEMS_TABLE, rowId: id }))
  } catch (e) {
    if ((e as { code?: number }).code === 404) return null
    throw e
  }
}

export async function saveItem(item: Item): Promise<Item> {
  const userId = await currentUserId()
  const previous = await storedItem(item.id)
  const photos = await Promise.all(item.photos.map((p) => (p.startsWith('data:') ? uploadPhoto(p, userId) : p)))
  const saved: Item = { ...item, photos }
  await tablesDB.upsertRow({
    databaseId: DATABASE_ID,
    tableId: ITEMS_TABLE,
    rowId: item.id,
    data: { data: JSON.stringify(saved), owner: userId },
    permissions: ownerOnly(userId),
  })
  const removed = (previous?.photos ?? []).filter((p) => !photos.includes(p))
  if (removed.length) await deletePhotos(removed)
  return saved
}

export async function deleteItem(id: string) {
  const previous = await storedItem(id)
  if (!previous) return
  await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId: ITEMS_TABLE, rowId: id })
  await deletePhotos(previous.photos.filter((p) => !p.startsWith('data:')))
}

type SyncedSettings = Omit<Settings, 'apiKey'>

export async function loadRemoteSettings(): Promise<Partial<SyncedSettings> | null> {
  const userId = await currentUserId()
  try {
    const row = await tablesDB.getRow({ databaseId: DATABASE_ID, tableId: SETTINGS_TABLE, rowId: userId })
    return JSON.parse(String(row.data)) as Partial<SyncedSettings>
  } catch (e) {
    if ((e as { code?: number }).code === 404) return null
    throw e
  }
}

export async function saveRemoteSettings(settings: Settings) {
  const userId = await currentUserId()
  const { apiKey: _local, ...synced } = settings
  await tablesDB.upsertRow({
    databaseId: DATABASE_ID,
    tableId: SETTINGS_TABLE,
    rowId: userId,
    data: { data: JSON.stringify(synced) },
    permissions: ownerOnly(userId),
  })
}

// La cancellazione completa (utente, righe e foto) richiede privilegi server: la esegue la Function "delete-account".
export async function deleteAccount() {
  const execution = await functions.createExecution({ functionId: DELETE_ACCOUNT_FUNCTION, async: false, method: ExecutionMethod.POST })
  let body: { ok?: boolean; error?: string } = {}
  try {
    body = JSON.parse(execution.responseBody || '{}')
  } catch {
    // risposta non JSON
  }
  if (execution.status !== 'completed' || execution.responseStatusCode >= 300 || !body.ok) {
    throw new Error(body.error ?? 'Cancellazione non riuscita. Riprova o contatta l’assistenza.')
  }
  cachedUserId = null
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
