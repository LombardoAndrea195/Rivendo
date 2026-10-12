export default function SetupNeeded() {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden>
        🔌
      </div>
      <h1>Collega Firebase</h1>
      <p className="muted">
        Mancano le variabili <code>VITE_FIREBASE_*</code>. Copia <code>.env.example</code> in <code>.env.local</code>, inserisci i valori
        del tuo progetto Firebase e riavvia l’app. Le istruzioni complete sono in <code>DEPLOY.md</code>.
      </p>
    </div>
  )
}
