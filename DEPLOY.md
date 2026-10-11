# Mettere Rivendo online

Servizi usati: **Appwrite Cloud** (login, database, foto, function) e **Cloudflare Pages** (sito). Tempo stimato: circa 40 minuti la prima volta.

| Servizio | A cosa serve | Piano gratuito |
|---|---|---|
| **Appwrite Cloud** | Login (Google + link via email, email incluse), database, foto private, cancellazione account | 75.000 utenti/mese, 2 GB di foto, 5 GB di traffico/mese, 2 progetti per account |
| **Cloudflare Pages** | Ospita il sito con `https` | Traffico illimitato, 500 pubblicazioni/mese, **uso commerciale consentito** |
| **Google Cloud** | Pulsante "Continua con Google" | Gratis |

> ⚠️ **Limite importante del piano gratuito Appwrite:** un progetto viene **messo in pausa dopo 7 giorni senza attività di sviluppo** (modifiche dalla console o dalla CLI), anche se gli utenti lo usano. Se resta in pausa per 90 giorni viene cancellato. Per un servizio aperto al pubblico o con sponsor serve il piano **Pro (25 $/mese)**, che non va mai in pausa e include i backup giornalieri. Il gratuito va bene per prove e demo.

---

## 1. Crea il progetto Appwrite (5 min)

1. Vai su <https://cloud.appwrite.io>, registrati e crea un progetto:
   - **Name:** `Rivendo`
   - **Region:** **Frankfurt**, così i dati restano in Europa (GDPR)
2. Nella pagina **Overview** del progetto copia:
   - **Project ID**
   - **API Endpoint**, del tipo `https://fra.cloud.appwrite.io/v1`
3. **Add platform → Web**, con hostname `localhost`. Aggiungerai il dominio del sito al passo 5.

### Crea tabelle, spazio foto e function con un comando

1. **Overview → Integrations → API keys → Create API key**:
   - **Name:** `setup`
   - **Expiration:** 1 giorno
   - **Scopes:** seleziona tutto
2. Nella cartella del progetto:
   ```bash
   cp .env.setup.example .env.setup     # inserisci Endpoint, Project ID e la API key appena creata
   npm install
   npm run appwrite:setup
   ```
   Lo script crea:
   - il database `rivendo`, con le tabelle `items` e `user_settings` e la sicurezza per riga attiva;
   - lo spazio foto privato e cifrato `photos`;
   - la function `delete-account`, che compila e pubblica.

   Puoi rilanciarlo senza rischi: aggiorna quello che esiste già.
3. Finito il setup **elimina la API key** dalla console, oppure lasciala scadere: il sito non ne ha bisogno.

---

## 2. Attiva "Continua con Google" (10 min)

1. In Appwrite apri **Auth → Settings → OAuth2 Providers → Google**, attivalo e **copia l'URI di redirect** mostrato (`https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/...`).
2. Vai su <https://console.cloud.google.com>, crea un progetto "Rivendo" e apri **Google Auth Platform**:
   - **Branding:** nome `Rivendo` e la tua email
   - **Audience:** scegli **External**, poi **Publish app**
   - **Clients → Create client → Web application**, con **Authorized redirect URIs** = l'URI copiato da Appwrite
3. Incolla **Client ID** e **Client secret** nella schermata Google di Appwrite e premi **Update**.

Il **link via email** funziona subito: le email le invia Appwrite, senza configurare altro.

> Apple o Microsoft: attivali in Appwrite allo stesso modo e aggiungili a `VITE_AUTH_PROVIDERS` (es. `google,microsoft`).

---

## 3. Configura il sito (2 min)

```bash
cp .env.example .env.production.local
```
Compila `.env.production.local`:

| Variabile | Valore |
|---|---|
| `VITE_APPWRITE_ENDPOINT` | l'API Endpoint del passo 1 |
| `VITE_APPWRITE_PROJECT_ID` | il Project ID |
| `VITE_AUTH_PROVIDERS` | `google` |
| `VITE_LEGAL_OPERATOR_NAME` | nome o ragione sociale del titolare |
| `VITE_LEGAL_OPERATOR_ADDRESS` | indirizzo completo del titolare |
| `VITE_LEGAL_VAT_NUMBER` | partita IVA, se applicabile |
| `VITE_SUPPORT_EMAIL` | email pubblica di assistenza |
| `VITE_PRIVACY_EMAIL` | contatto per le richieste privacy |

Sono tutti dati pubblici: finiscono nel sito. **Non inserire mai chiavi segrete nelle variabili `VITE_`.** Per lo sviluppo copia gli stessi valori di Appwrite anche in `.env.local`.

---

## 4. Pubblica su Cloudflare Pages (5 min)

1. Crea un account gratuito su <https://dash.cloudflare.com/sign-up>.
2. Dalla cartella del progetto:
   ```bash
   npx wrangler login                                                   # si apre il browser: autorizza
   npx wrangler pages project create rivendo --production-branch main   # solo la prima volta
   npm run deploy                                                       # compila e pubblica
   ```
3. Alla fine compare l'indirizzo del sito, del tipo **`https://rivendo.pages.dev`**. Per gli aggiornamenti successivi basta `npm run deploy`.

Le intestazioni di sicurezza (`public/_headers`) e il ritorno alla pagina giusta per `/privacy`, `/terms` e `/delete-account` funzionano già senza configurazioni.

---

## 5. Collega il sito al login (2 min)

1. **Appwrite → Overview → Add platform → Web**, con hostname `rivendo.pages.dev`, oppure il tuo dominio.
2. **Google Cloud → Clients → il tuo client:** aggiungi `https://rivendo.pages.dev` in **Authorized JavaScript origins**.

**Prova finale:**
1. Apri il sito, entra con Google o con il link via email.
2. Crea un oggetto con una foto, esci e rientra da un altro dispositivo: devi ritrovare tutto.
3. Prova **Impostazioni → Elimina account e dati** con un account di test.

### Consigliato per la produzione: domini personalizzati
1. **Cloudflare Pages → rivendo → Custom domains:** collega il sito, per esempio `app.rivendo.it`.
2. **Appwrite → Settings → Custom domains:** collega l'API, per esempio `api.rivendo.it`.

Con l'API sullo stesso dominio del sito, la sessione usa un cookie sicuro invece del salvataggio nel browser: è più protetta e funziona meglio su Safari. Dopo il collegamento:
- aggiorna `VITE_APPWRITE_ENDPOINT` (es. `https://api.rivendo.it/v1`);
- aggiungi il dominio a `connect-src` in `public/_headers`;
- aggiungi la piattaforma Web in Appwrite;
- ripubblica con `npm run deploy`.

---

## Prima di aprire al pubblico

1. Compila tutti i dati legali (`VITE_LEGAL_*`, `VITE_SUPPORT_EMAIL`, `VITE_PRIVACY_EMAIL`). Finché mancano, `/privacy` e `/terms` mostrano un avviso di bozza.
2. Verifica che `https://IL-TUO-DOMINIO/privacy`, `/terms` e `/delete-account` si aprano senza login.
3. Prova la cancellazione con un account di test. In Appwrite devono sparire l'utente (**Auth**), le sue righe (**Databases**) e le sue foto (**Storage**). La function registra l'esito in **Functions → delete-account → Executions**.
4. Valuta il piano Appwrite Pro: vedi l'avviso sulla pausa in cima a questa guida.
5. Segui [SPONSOR_LAUNCH.md](./SPONSOR_LAUNCH.md) per i passaggi legali, store e permessi ancora da completare.

---

## Sicurezza: cosa è già attivo

- **Login obbligatorio:** senza accesso non si vede nulla dell'app, tranne le pagine legali.
- **Permessi per riga e per file:** ogni oggetto, impostazione e foto è leggibile e modificabile solo dal proprietario (`Role.user`). Le tabelle e lo spazio foto permettono agli utenti collegati solo di *creare*, mai di leggere i dati altrui.
- **Foto:** private e cifrate; il sito le scarica solo con la sessione dell'utente.
- **Cancellazione account:** la esegue una function con una chiave server temporanea generata da Appwrite. Nessuna chiave segreta è presente nel sito.
- **Chiave AI (Gemini/OpenAI):** resta solo sul dispositivo dell'utente. Prima di ogni analisi l'utente conferma l'invio delle foto, e il prezzo di acquisto non viene mai inviato.
- **Intestazioni di sicurezza** (`public/_headers`):
  - CSP: il sito può contattare solo Appwrite e i servizi AI;
  - protezione dal clickjacking;
  - HSTS, che obbliga a usare `https`.

## Sviluppo in locale

```bash
npm install
cp .env.example .env.local   # Endpoint e Project ID (anche dello stesso progetto cloud: basta la piattaforma Web "localhost")
npm run dev                  # http://localhost:5173
```

Vuoi un Appwrite tutto locale? Installalo con Docker seguendo <https://appwrite.io/docs/advanced/self-hosting>, crea un progetto e una API key dalla console locale e lancia `npm run appwrite:setup` con l'endpoint locale.
