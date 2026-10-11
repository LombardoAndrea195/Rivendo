// Prova di isolamento: un utente di prova e un visitatore anonimo non devono vedere né toccare i dati di un altro utente.
// Uso: npm run appwrite:security-check  (serve almeno un utente con un oggetto e una foto; usa le variabili di .env.setup)
import { Client, ID, Query, Storage, TablesDB, Users } from 'node-appwrite'

const EP = process.env.APPWRITE_ENDPOINT
const PROJECT = process.env.APPWRITE_PROJECT_ID
const admin = new Client().setEndpoint(EP).setProject(PROJECT).setKey(process.env.APPWRITE_API_KEY)
const adminDb = new TablesDB(admin)
const adminStorage = new Storage(admin)
const users = new Users(admin)

const anyFile = (await adminStorage.listFiles({ bucketId: 'photos', queries: [Query.limit(1)] })).files[0]
if (!anyFile) {
  console.error('Serve almeno un utente con un oggetto e una foto: creane uno dall’app e riprova.')
  process.exit(1)
}
const userA = anyFile.name.replace(/\.jpg$/, '')

const rowsA = await adminDb.listRows({ databaseId: 'rivendo', tableId: 'items', queries: [Query.equal('owner', userA), Query.limit(100)] })
const filesA = await adminStorage.listFiles({ bucketId: 'photos', queries: [Query.equal('name', `${userA}.jpg`)] })
const sample = rowsA.rows[0]
console.log(`A possiede: ${rowsA.total} oggetti, ${filesA.total} foto. Permessi di una riga:`, sample.$permissions)

const b = await users.create({ userId: ID.unique(), email: `b${Date.now()}@example.com` })
const session = await users.createSession({ userId: b.$id })
const clientB = new Client().setEndpoint(EP).setProject(PROJECT).setSession(session.secret)
const dbB = new TablesDB(clientB)
const storageB = new Storage(clientB)
const anon = new TablesDB(new Client().setEndpoint(EP).setProject(PROJECT))

const attempt = async (label, fn) => {
  try {
    const r = await fn()
    console.log(`✗ ${label}: RIUSCITO`, JSON.stringify(r).slice(0, 120))
  } catch (e) {
    console.log(`✓ ${label}: bloccato (${e.code})`)
  }
}

const listB = await dbB.listRows({ databaseId: 'rivendo', tableId: 'items' })
console.log(`${listB.total === 0 ? '✓' : '✗'} B elenca gli oggetti: ne vede ${listB.total}`)
await attempt('B legge un oggetto di A', () => dbB.getRow({ databaseId: 'rivendo', tableId: 'items', rowId: sample.$id }))
await attempt('B modifica un oggetto di A', () =>
  dbB.updateRow({ databaseId: 'rivendo', tableId: 'items', rowId: sample.$id, data: { data: '{"hacked":true}' } }),
)
await attempt('B sovrascrive un oggetto di A (upsert)', () =>
  dbB.upsertRow({ databaseId: 'rivendo', tableId: 'items', rowId: sample.$id, data: { data: '{"hacked":true}' } }),
)
await attempt('B cancella un oggetto di A', () => dbB.deleteRow({ databaseId: 'rivendo', tableId: 'items', rowId: sample.$id }))
await attempt('B legge le impostazioni di A', () => dbB.getRow({ databaseId: 'rivendo', tableId: 'user_settings', rowId: userA }))
const filesB = await storageB.listFiles({ bucketId: 'photos' })
console.log(`${filesB.total === 0 ? '✓' : '✗'} B elenca le foto: ne vede ${filesB.total}`)
await attempt('B scarica una foto di A', () => storageB.getFileView({ bucketId: 'photos', fileId: filesA.files[0].$id }))
await attempt('B cancella una foto di A', () => storageB.deleteFile({ bucketId: 'photos', fileId: filesA.files[0].$id }))
await attempt('Anonimo elenca gli oggetti', () => anon.listRows({ databaseId: 'rivendo', tableId: 'items' }).then((r) => (r.total ? r : Promise.reject({ code: 'vuoto' }))))
await attempt('Anonimo legge un oggetto di A', () => anon.getRow({ databaseId: 'rivendo', tableId: 'items', rowId: sample.$id }))

const after = await adminDb.getRow({ databaseId: 'rivendo', tableId: 'items', rowId: sample.$id })
console.log(`${after.data.includes('hacked') ? '✗' : '✓'} L'oggetto di A è intatto`)
await users.delete({ userId: b.$id })
