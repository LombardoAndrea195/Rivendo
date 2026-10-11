export default function SetupNeeded() {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden>
        🔌
      </div>
      <h1>Collega Appwrite</h1>
      <p className="muted">
        Mancano le variabili <code>VITE_APPWRITE_ENDPOINT</code> e <code>VITE_APPWRITE_PROJECT_ID</code>. Copia <code>.env.example</code> in{' '}
        <code>.env.local</code>, inserisci i valori del tuo progetto e riavvia l’app. Le istruzioni complete sono in <code>DEPLOY.md</code>.
      </p>
    </div>
  )
}
