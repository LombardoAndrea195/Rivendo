import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isConfigured = Boolean(url && key)

export const supabase = createClient(url || 'http://localhost', key || 'missing-key')

export type AuthProvider = 'google' | 'apple' | 'azure'

export const AUTH_PROVIDERS = ((import.meta.env.VITE_AUTH_PROVIDERS as string | undefined) ?? 'google')
  .split(',')
  .map((p) => p.trim())
  .filter((p): p is AuthProvider => ['google', 'apple', 'azure'].includes(p))
