# Mettere Rivendo online

Tempo stimato: 30–45 minuti la prima volta. Tutto gratuito per iniziare.

| Servizio | A cosa serve | Piano gratuito |
|---|---|---|
| **Supabase** | Login (Google + link via email), database, foto private | 500 MB di database, 1 GB di foto, 50.000 utenti al mese |
| **Vercel** | Ospita il sito con `https` | Hobby, gratis per uso personale |
| **Google Cloud** | Pulsante "Continua con Google" | Gratis |
| **Resend** (o altro SMTP) | Invio delle email di accesso a chiunque | 3.000 email al mese |

> **Prima di vendere l'app:** il piano Hobby di Vercel vale solo per uso personale e non commerciale. Se la fai pagare passa a Vercel Pro (20 $/mese) oppure a Netlify o Cloudflare Pages. Sul piano gratuito di Supabase, un progetto inattivo per 7 giorni viene messo in pausa; con il piano Pro (25 $/mese) no, e in più hai i backup giornalieri.

---

## 1. Crea il progetto Supabase

1. Vai su <https://supabase.com>, registrati e premi **New project**.
2. Scegli:
   - **Name:** `rivendo`
   - **Database password:** generala e conservala in un posto sicuro
   - **Region:** `Central EU (Frankfurt)`, così i dati restano in Europa (GDPR)
3. Attendi un paio di minuti che il progetto sia pronto.

### Crea le tabelle e le regole di sicurezza

**Metodo semplice:**
1. Apri **SQL Editor** → **New query**.
2. Incolla tutto il contenuto di `supabase/migrations/20261011120000_init.sql`.
3. Premi **Run**.

**Metodo da terminale** (comodo per gli aggiornamenti futuri):
```bash
npx supabase login
npx supabase link --project-ref IL_TUO_PROJECT_REF   # il codice nell'URL del progetto
npx supabase db push
```

Controlla in **Table Editor** che `items` e `user_settings` mostrino l'etichetta **RLS enabled**, e in **Storage** che ci sia il bucket `photos` con la dicitura **Private**.

### Copia le chiavi

In **Project Settings → API Keys** (e **Data API** per l'URL):
- **Project URL**, del tipo `https://abcdefgh.supabase.co`
- **Publishable key**, che inizia con `sb_publishable_...`

La publishable key può stare nel sito perché i dati sono protetti dalle regole del database. **Non usare mai la `secret key` nel sito.**

---

## 2. Attiva "Continua con Google"

1. Vai su <https://console.cloud.google.com>, crea un progetto (es. "Rivendo") e apri **Google Auth Platform**.
2. **Branding:** nome app `Rivendo`, email di supporto, logo (facoltativo).
3. **Audience:** scegli **External**, poi **Publish app**. Con i soli dati base (email e nome) non serve la verifica di Google.
4. **Clients → Create client → Web application**:
   - **Authorized JavaScript origins:** `https://IL-TUO-SITO.vercel.app` (aggiungerai il dominio definitivo al passo 5)
   - **Authorized redirect URIs:** `https://IL_TUO_PROJECT_REF.supabase.co/auth/v1/callback`
5. Copia **Client ID** e **Client secret**.
6. In Supabase vai su **Authentication → Sign In / Providers → Google**: attivalo, incolla ID e secret e salva.

> Vuoi anche Apple o Microsoft? Attivali allo stesso modo in Supabase e aggiungili alla variabile `VITE_AUTH_PROVIDERS` (es. `google,azure`). Per Apple serve l'Apple Developer Program (99 $/anno).

---

## 3. Fai arrivare le email di accesso a tutti

Il servizio email incluso in Supabase invia messaggi **solo agli indirizzi del tuo team**: serve per le prove, non per gli utenti veri.

1. Crea un account su <https://resend.com>, aggiungi il tuo dominio (es. `rivendo.it`) e crea una API key.
2. In Supabase vai su **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** la API key di Resend
   - **Sender:** `accesso@rivendo.it`, nome `Rivendo`
3. In **Authentication → Emails → Templates → Magic Link**:
   - **Subject:** `Il tuo link per entrare in Rivendo`
   - **Body:** incolla il contenuto di `supabase/templates/magic_link.html`

Se ti basta Google per accedere, puoi saltare questo passo e lasciare il link via email solo per le prove.

---

## 4. Pubblica su Vercel

### Metodo GitHub (consigliato: ogni modifica si pubblica da sola)
1. Crea un repository **privato** su <https://github.com/new>, chiamato `rivendo`.
2. Dalla cartella del progetto:
   ```bash
   git remote add origin https://github.com/TUO_UTENTE/rivendo.git
   git push -u origin main
   ```
3. Su <https://vercel.com/new> importa il repository. Vercel riconosce Vite da solo.
4. In **Environment Variables** aggiungi:
   | Nome | Valore |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://IL_TUO_PROJECT_REF.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
   | `VITE_AUTH_PROVIDERS` | `google` |
5. Premi **Deploy**. In un minuto avrai un indirizzo del tipo `https://rivendo-xyz.vercel.app`.

### Metodo da terminale (senza GitHub)
```bash
npx vercel            # la prima volta collega l'account e crea il progetto
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
npx vercel env add VITE_AUTH_PROVIDERS production
npx vercel --prod
```

---

## 5. Collega il dominio del sito al login

Adesso che conosci l'indirizzo definitivo:

1. **Supabase → Authentication → URL Configuration**
   - **Site URL:** `https://rivendo-xyz.vercel.app` (o il tuo dominio)
   - **Redirect URLs:** aggiungi `https://rivendo-xyz.vercel.app/**` e, per lo sviluppo, `http://localhost:5173/**`
2. **Google Cloud → Clients → il tuo client:** aggiungi lo stesso indirizzo in **Authorized JavaScript origins**.
3. *(Facoltativo)* **Vercel → Settings → Domains:** collega un tuo dominio (es. `app.rivendo.it`) e ripeti i passi 1 e 2 con quel dominio.

**Prova finale:** apri il sito, entra con Google, crea un oggetto con una foto, esci, rientra da un altro dispositivo e verifica di ritrovare tutto.

---

## Sicurezza: cosa è già attivo

- **Login obbligatorio:** senza accesso non si vede nulla dell'app.
- **Isolamento dei dati:** ogni riga del database e ogni foto appartiene a un utente. Le regole RLS fanno in modo che nessuno possa leggere o modificare i dati di un altro, nemmeno chiamando le API a mano. Verificato in locale: un altro utente e un visitatore anonimo vedono 0 oggetti e 0 foto.
- **Foto private:** si vedono solo tramite link firmati che scadono dopo un'ora.
- **Chiave AI (Gemini/OpenAI):** resta solo sul dispositivo dell'utente e non viene salvata nel database.
- **Intestazioni di sicurezza** (in `vercel.json`):
  - CSP: il sito può contattare solo Supabase e i servizi AI;
  - protezione dal clickjacking;
  - HSTS, che obbliga a usare `https`.
- **Nessuna password da gestire:** si accede con Google o con un link via email.

> Se un giorno colleghi a Supabase un dominio personalizzato (es. `api.rivendo.it`), aggiungilo a `connect-src` e `img-src` nella CSP dentro `vercel.json`.

## Sviluppo in locale

Serve Docker (Rancher Desktop o Docker Desktop).

```bash
npm install
npm run db:start      # avvia Supabase in locale e applica lo schema
cp .env.example .env.local   # poi inserisci URL e publishable key mostrati da db:start
npm run dev           # http://localhost:5173
```

- Le email di accesso in locale arrivano su **Mailpit**: <http://127.0.0.1:54324>
- `npm run db:stop` ferma Supabase; `npm run db:reset` riparte da un database vuoto.

## Aggiornare il database in futuro

Crea un nuovo file in `supabase/migrations/` (es. `20261101090000_nuova_colonna.sql`), provalo in locale con `npm run db:reset` e poi applicalo online con `npx supabase db push`.
