import { Account, Client, Functions, Storage, TablesDB, type Models } from 'appwrite'

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined

export const isConfigured = Boolean(endpoint && projectId)

export const client = new Client().setEndpoint(endpoint || 'http://localhost/v1').setProject(projectId || 'missing')
export const account = new Account(client)
export const tablesDB = new TablesDB(client)
export const storage = new Storage(client)
export const functions = new Functions(client)

export type User = Models.User<Models.Preferences>

export const DATABASE_ID = 'rivendo'
export const ITEMS_TABLE = 'items'
export const SETTINGS_TABLE = 'user_settings'
export const PHOTOS_BUCKET = 'photos'
export const DELETE_ACCOUNT_FUNCTION = 'delete-account'

export type AuthProvider = 'google' | 'apple' | 'microsoft'

export const AUTH_PROVIDERS = ((import.meta.env.VITE_AUTH_PROVIDERS as string | undefined) ?? 'google')
  .split(',')
  .map((p) => p.trim())
  .filter((p): p is AuthProvider => ['google', 'apple', 'microsoft'].includes(p))
