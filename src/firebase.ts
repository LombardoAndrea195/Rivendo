import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type User as FirebaseUser } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore/lite'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

// Modalità offline (`npm run offline`): tutto gira negli emulatori locali, nessun progetto Firebase reale.
const useEmulators = import.meta.env.VITE_FIREBASE_EMULATORS === 'true'

const emulatorConfig = {
  apiKey: 'demo-key',
  authDomain: 'demo-rivendo.firebaseapp.com',
  projectId: 'demo-rivendo',
  storageBucket: 'demo-rivendo.appspot.com',
  appId: 'demo-app',
}

const config = useEmulators ? emulatorConfig : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const isConfigured = Object.values(config).every(Boolean)

const app = initializeApp(isConfigured ? config : { apiKey: 'missing', projectId: 'missing', appId: 'missing' })
export const auth = getAuth(app)
auth.languageCode = 'it'
export const db = getFirestore(app)
export const storage = getStorage(app)

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}

export type User = FirebaseUser

// Email per cui è stato chiesto il link di accesso: serve a completarlo senza richiederla di nuovo.
export const EMAIL_FOR_SIGN_IN = 'rivendo:email-for-sign-in'

export type AuthProvider = 'google' | 'apple' | 'microsoft'

export const AUTH_PROVIDERS = ((import.meta.env.VITE_AUTH_PROVIDERS as string | undefined) ?? 'google')
  .split(',')
  .map((p) => p.trim())
  .filter((p): p is AuthProvider => ['google', 'apple', 'microsoft'].includes(p))
