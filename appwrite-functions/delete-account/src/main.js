// Appwrite Function: cancella l'account di chi la invoca, insieme a inventario, impostazioni e foto.
// Usa la chiave dinamica che Appwrite passa alla Function (scopes definiti in scripts/setup-appwrite.mjs).
import { Client, Query, Storage, TablesDB, Users } from 'node-appwrite'

const DATABASE = 'rivendo'
const BUCKET = 'photos'

const ignoreMissing = (e) => {
  if (e?.code !== 404) throw e
}

export default async ({ req, res, log, error }) => {
  const userId = req.headers['x-appwrite-user-id']
  if (!userId) return res.json({ ok: false, error: 'Accesso richiesto.' }, 401)

  const client = new Client()
    // RIVENDO_API_ENDPOINT serve solo su Appwrite self-hosted, quando la function non raggiunge l'endpoint pubblico.
    .setEndpoint(process.env.RIVENDO_API_ENDPOINT || process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'])
  const db = new TablesDB(client)
  const storage = new Storage(client)
  const users = new Users(client)

  try {
    let rows = 0
    for (;;) {
      const page = await db.listRows({ databaseId: DATABASE, tableId: 'items', queries: [Query.equal('owner', userId), Query.limit(100)] })
      if (!page.rows.length) break
      for (const row of page.rows) {
        await db.deleteRow({ databaseId: DATABASE, tableId: 'items', rowId: row.$id })
        rows++
      }
    }
    await db.deleteRow({ databaseId: DATABASE, tableId: 'user_settings', rowId: userId }).catch(ignoreMissing)

    let files = 0
    for (;;) {
      const page = await storage.listFiles({ bucketId: BUCKET, queries: [Query.equal('name', `${userId}.jpg`), Query.limit(100)] })
      if (!page.files.length) break
      for (const file of page.files) {
        await storage.deleteFile({ bucketId: BUCKET, fileId: file.$id }).catch(ignoreMissing)
        files++
      }
    }

    await users.delete({ userId })
    log(`Account ${userId} eliminato: ${rows} oggetti, ${files} foto.`)
    return res.json({ ok: true })
  } catch (e) {
    error(`Cancellazione di ${userId} non riuscita: ${e?.message ?? e}`)
    return res.json({ ok: false, error: 'Cancellazione non riuscita. Riprova o contatta l’assistenza.' }, 500)
  }
}
