// Crea (o aggiorna) database, tabelle, spazio foto e Function di Rivendo su Appwrite.
// Uso: npm run appwrite:setup  (legge le variabili da .env.setup, vedi .env.setup.example)
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client, Compression, Functions, Permission, Role, Storage, TablesDB, TablesDBIndexType } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_FUNCTION_RUNTIME = 'node-22' } = process.env
if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error('Mancano APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID o APPWRITE_API_KEY (vedi .env.setup.example).')
  process.exit(1)
}

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY)
const db = new TablesDB(client)
const storage = new Storage(client)
const functions = new Functions(client)

const DATABASE = 'rivendo'
// Chi è collegato può creare righe e file; lettura e modifica sono concesse uno per uno solo al proprietario.
const createOnly = [Permission.create(Role.users())]

async function ensure(label, create, update) {
  try {
    await create()
    console.log(`✓ ${label}: creato`)
  } catch (e) {
    if (e.code !== 409) throw e
    if (update) await update()
    console.log(`✓ ${label}: già presente${update ? ', aggiornato' : ''}`)
  }
}

async function waitUntilAvailable(label, read) {
  for (let i = 0; i < 90; i++) {
    const res = await read()
    if (res.status === 'available') return
    if (res.status === 'failed') throw new Error(`${label} non creato: ${res.error}`)
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Timeout in attesa di ${label}`)
}

// Database e tabelle
await ensure('database', () => db.create({ databaseId: DATABASE, name: 'Rivendo' }))

for (const t of [
  { tableId: 'items', name: 'Oggetti' },
  { tableId: 'user_settings', name: 'Impostazioni utente' },
]) {
  const settings = { databaseId: DATABASE, tableId: t.tableId, name: t.name, permissions: createOnly, rowSecurity: true, enabled: true }
  await ensure(`tabella ${t.tableId}`, () => db.createTable(settings), () => db.updateTable(settings))
  await ensure(`colonna ${t.tableId}.data`, () => db.createLongtextColumn({ databaseId: DATABASE, tableId: t.tableId, key: 'data', required: true }))
  await waitUntilAvailable(`${t.tableId}.data`, () => db.getColumn({ databaseId: DATABASE, tableId: t.tableId, key: 'data' }))
}

await ensure('colonna items.owner', () => db.createVarcharColumn({ databaseId: DATABASE, tableId: 'items', key: 'owner', size: 36, required: false }))
await waitUntilAvailable('items.owner', () => db.getColumn({ databaseId: DATABASE, tableId: 'items', key: 'owner' }))
await ensure('indice items.owner', () =>
  db.createIndex({ databaseId: DATABASE, tableId: 'items', key: 'by_owner', type: TablesDBIndexType.Key, columns: ['owner'] }),
)
await waitUntilAvailable('indice items.owner', () => db.getIndex({ databaseId: DATABASE, tableId: 'items', key: 'by_owner' }))

// Spazio foto privato
const bucket = {
  bucketId: 'photos',
  name: 'Foto',
  permissions: createOnly,
  fileSecurity: true,
  enabled: true,
  maximumFileSize: 5 * 1024 * 1024,
  allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  compression: Compression.None,
  encryption: true,
  antivirus: false,
  transformations: false,
}
await ensure('spazio foto', () => storage.createBucket(bucket), () => storage.updateBucket(bucket))

// Function per cancellare l'account (usa una chiave server dinamica, mai esposta al sito)
const fn = {
  functionId: 'delete-account',
  name: 'Elimina account',
  runtime: APPWRITE_FUNCTION_RUNTIME,
  execute: [Role.users()],
  timeout: 60,
  enabled: true,
  logging: true,
  entrypoint: 'src/main.js',
  commands: '',
  scopes: ['users.write', 'rows.read', 'rows.write', 'files.read', 'files.write'],
}
await ensure('function delete-account', () => functions.create(fn), () => functions.update(fn))

// Solo per Appwrite self-hosted: indirizzo interno con cui la function raggiunge l'API.
if (process.env.APPWRITE_FUNCTION_INTERNAL_ENDPOINT) {
  const variable = { functionId: fn.functionId, key: 'RIVENDO_API_ENDPOINT', value: process.env.APPWRITE_FUNCTION_INTERNAL_ENDPOINT }
  const existing = (await functions.listVariables({ functionId: fn.functionId })).variables.find((v) => v.key === variable.key)
  if (existing) await functions.updateVariable({ ...variable, variableId: existing.$id })
  else await functions.createVariable({ ...variable, variableId: 'rivendo-api-endpoint' })
  console.log('✓ endpoint interno della function impostato')
}

// Le dipendenze vengono installate qui e incluse nel pacchetto: la build sul server non deve scaricare nulla.
const source = join(dirname(fileURLToPath(import.meta.url)), '..', 'appwrite-functions', 'delete-account')
execFileSync('npm', ['install', '--omit=dev', '--no-audit', '--no-fund', '--no-package-lock'], { cwd: source, stdio: 'ignore' })
const tmp = mkdtempSync(join(tmpdir(), 'rivendo-fn-'))
const archive = join(tmp, 'code.tar.gz')
execFileSync('tar', ['-czf', archive, '-C', source, 'package.json', 'src', 'node_modules'])
const deployment = await functions.createDeployment({
  functionId: fn.functionId,
  code: InputFile.fromPath(archive, 'code.tar.gz'),
  activate: true,
  entrypoint: fn.entrypoint,
  commands: fn.commands,
})
rmSync(tmp, { recursive: true, force: true })
process.stdout.write('… compilo la function')
for (let i = 0; i < 180; i++) {
  const d = await functions.getDeployment({ functionId: fn.functionId, deploymentId: deployment.$id })
  if (d.status === 'ready') break
  if (d.status === 'failed') throw new Error(`Build della function non riuscita:\n${d.buildLogs}`)
  process.stdout.write('.')
  await new Promise((r) => setTimeout(r, 2000))
}
console.log('\n✓ function delete-account: pubblicata')

console.log('\nFatto: Rivendo è pronto su questo progetto Appwrite.')
