import { useState, type FormEvent, type ReactElement } from 'react'
import { ID, OAuthProvider } from 'appwrite'
import { account, AUTH_PROVIDERS, type AuthProvider } from '../appwrite'

const PROVIDERS: Record<AuthProvider, { label: string; icon: ReactElement }> = {
  google: {
    label: 'Continua con Google',
    icon: (
      <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    ),
  },
  apple: {
    label: 'Continua con Apple',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
        <path d="M16.37 12.62c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.27-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.65zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" />
      </svg>
    ),
  },
  microsoft: {
    label: 'Continua con Microsoft',
    icon: (
      <svg viewBox="0 0 21 21" width="18" height="18" aria-hidden>
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
      </svg>
    ),
  },
}

const OAUTH: Record<AuthProvider, OAuthProvider> = {
  google: OAuthProvider.Google,
  apple: OAuthProvider.Apple,
  microsoft: OAuthProvider.Microsoft,
}

function friendly(e: unknown) {
  const message = e instanceof Error ? e.message : String(e)
  const code = (e as { code?: number }).code
  if (code === 429 || /rate limit|too many/i.test(message)) return 'Troppi tentativi. Aspetta un minuto e riprova.'
  if (/provider.*(disabled|not enabled)|unsupported/i.test(message)) return 'Questo metodo di accesso non è ancora attivo. Usa il link via email.'
  if (/smtp|mail.*(fail|disabled)/i.test(message)) return 'Non riesco a inviare l’email in questo momento. Riprova più tardi.'
  if (code === 400 && /email/i.test(message)) return 'Indirizzo email non valido.'
  return message
}

export default function Login({ initialError = '', deletionMode = false }: { initialError?: string; deletionMode?: boolean }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState(initialError)
  const returnTo = `${window.location.origin}${deletionMode ? '/delete-account' : '/'}`

  const signInWith = (provider: AuthProvider) => {
    setError('')
    try {
      account.createOAuth2Token({ provider: OAUTH[provider], success: returnTo, failure: `${returnTo}?error=oauth` })
    } catch (e) {
      setError(friendly(e))
    }
  }

  const sendLink = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setState('sending')
    try {
      await account.createMagicURLToken({ userId: ID.unique(), email: email.trim(), url: returnTo })
      setState('sent')
    } catch (err) {
      setError(friendly(err))
      setState('idle')
    }
  }

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            R
          </span>
          Rivendo
        </div>
        <div className="auth-pitch">
          <h1>Compri, fotografi, rivendi. Al resto pensa Rivendo.</h1>
          <ul>
            <li>
              <span aria-hidden>✨</span> Annuncio e prezzo dalla foto, con l’AI
            </li>
            <li>
              <span aria-hidden>🛍️</span> Pronto per Vinted, Subito ed eBay
            </li>
            <li>
              <span aria-hidden>📈</span> Profitto reale, commissioni incluse
            </li>
          </ul>
        </div>
        <p className="auth-foot">I tuoi dati sono privati: visibili solo a te, protetti da accesso sicuro.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          {deletionMode && (
            <div className="notice">
              Accedi con lo stesso metodo usato per creare l’account. Dopo l’accesso potrai confermare la cancellazione dalle impostazioni.
            </div>
          )}
          {state === 'sent' ? (
            <div className="auth-sent" role="status">
              <div className="auth-icon" aria-hidden>
                ✉️
              </div>
              <h2>Controlla la tua email</h2>
              <p className="muted">
                Ti abbiamo inviato un link di accesso a <strong>{email}</strong>. Aprilo da questo dispositivo per entrare.
              </p>
              <button className="btn btn-ghost" onClick={() => setState('idle')}>
                Usa un’altra email
              </button>
            </div>
          ) : (
            <>
              <div className="auth-head">
                <h2>Accedi a Rivendo</h2>
                <p className="muted">Nessuna password da ricordare.</p>
              </div>

              {AUTH_PROVIDERS.length > 0 && (
                <div className="auth-providers">
                  {AUTH_PROVIDERS.map((p) => (
                    <button key={p} className={`btn btn-provider btn-${p}`} onClick={() => signInWith(p)}>
                      {PROVIDERS[p].icon}
                      {PROVIDERS[p].label}
                    </button>
                  ))}
                </div>
              )}

              {AUTH_PROVIDERS.length > 0 && (
                <div className="auth-divider">
                  <span>oppure</span>
                </div>
              )}

              <form className="auth-form" onSubmit={sendLink}>
                <label className="field">
                  <span className="field-label">Email</span>
                  <input
                    className="input"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="nome@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button className="btn btn-primary" type="submit" disabled={state === 'sending'}>
                  {state === 'sending' && <span className="spinner" aria-hidden />}
                  {state === 'sending' ? 'Invio in corso…' : 'Ricevi il link di accesso'}
                </button>
              </form>
            </>
          )}

          {error && (
            <p className="error small auth-error" role="alert">
              {error}
            </p>
          )}
          <nav className="legal-links" aria-label="Informazioni legali">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Termini</a>
            <a href="/delete-account">Elimina account</a>
          </nav>
        </div>
      </section>
    </div>
  )
}
