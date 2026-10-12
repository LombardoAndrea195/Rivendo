# Mettere Rivendo online

Servizi usati: **Firebase** (login, database, foto) e **Cloudflare Pages** (sito). Tempo stimato: circa 30 minuti la prima volta.

| Servizio | A cosa serve | Costo |
|---|---|---|
| **Firebase Authentication** | Login con Google e con link via email (le email le invia Firebase) | Gratis (fino a 20.000 link di accesso al giorno) |
| **Cloud Firestore** | Database di oggetti e impostazioni | Gratis fino a 1 GB, 50.000 letture e 20.000 scritture al giorno |
| **Cloud Storage** | Foto private | Gratis fino a 5 GB e 100 GB di traffico al mese se il bucket è negli USA; in Europa pochi centesimi per GB |
| **Cloudflare Pages** | Ospita il sito con `https` | Gratis, traffico illimitato, uso commerciale consentito |

Firebase **non mette in pausa** i progetti inattivi. Per le foto serve però il piano a consumo **Blaze**, quindi una carta di credito: finché resti nelle quote gratuite non paghi nulla.

---

## 1. Crea il progetto Firebase (5 min)

1. Vai su <https://console.firebase.google.com> → **Crea un progetto** → nome `Rivendo`. Google Analytics non serve: disattivalo.
2. In basso a sinistra **Spark → Esegui l'upgrade** al piano **Blaze** e collega una carta.
3. Imposta un avviso di spesa: <https://console.cloud.google.com/billing> → **Budget e avvisi** → **Crea budget**, per esempio 5 €. È solo un avviso: Google ti scrive, ma non blocca la spesa.
4. Nella pagina del progetto premi l'icona **`</>`** (Aggiungi app web), nome `Rivendo`, senza Firebase Hosting. Copia i valori di `firebaseConfig`: ti servono al passo 5.

## 2. Attiva il login (3 min)

**Build → Authentication → Inizia → Metodo di accesso:**
1. **Google** → Attiva → scegli l'email di assistenza → Salva.
2. **Email/password** → Attiva **solo** l'opzione **Link via email (accesso senza password)** → Salva.

In **Authentication → Impostazioni → Domini autorizzati**, `localhost` c'è già. Il dominio del sito lo aggiungi al passo 7.

> Apple o Microsoft: attivali qui allo stesso modo e aggiungili a `VITE_AUTH_PROVIDERS` (es. `google,microsoft`).

## 3. Crea database e spazio foto (5 min)

1. **Build → Firestore Database → Crea database**:
   - edizione **Standard**;
   - località **`eur3 (Europe)`**: i dati restano in Europa;
   - modalità **produzione**.
2. **Build → Storage → Inizia**, modalità **produzione**. Scegli la località:
   - **`US-CENTRAL1`**: completamente gratis nelle quote. Le foto stanno negli USA: va indicato nella privacy policy;
   - **una regione europea** (es. `EUROPE-WEST8`, Milano): tutto in Europa, con un costo di pochi centesimi per GB al mese più il traffico.

## 4. Pubblica le regole di sicurezza e il CORS (5 min)

Le regole (`firestore.rules`, `storage.rules`) fanno sì che ogni utente veda e modifichi solo i propri dati. Dalla cartella del progetto:

```bash
npx firebase-tools login                              # si apre il browser: autorizza
npm run firebase:rules -- --project IL-TUO-PROJECT-ID
```

Poi serve il permesso di scaricare le foto dal sito, cioè la configurazione CORS:
1. Apri <https://console.cloud.google.com>, seleziona il progetto Rivendo e premi l'icona **Cloud Shell** (`>_`, in alto a destra).
2. Incolla questo comando, sostituendo il nome del bucket (lo trovi in **Storage**, è il tuo `storageBucket`, es. `rivendo-xxxx.firebasestorage.app`):
   ```bash
   echo '[{"origin":["*"],"method":["GET"],"maxAgeSeconds":3600}]' > cors.json && gcloud storage buckets update gs://IL-TUO-BUCKET --cors-file=cors.json
   ```
   Le foto restano private: senza accesso il download viene rifiutato dalle regole.

## 5. Configura il sito (2 min)

```bash
cp .env.example .env.production.local
```
Compila `.env.production.local`:

| Variabile | Valore |
|---|---|
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | i valori di `firebaseConfig` del passo 1 |
| `VITE_AUTH_PROVIDERS` | `google` |
| `VITE_LEGAL_OPERATOR_NAME` | nome o ragione sociale del titolare |
| `VITE_LEGAL_OPERATOR_ADDRESS` | indirizzo completo del titolare |
| `VITE_LEGAL_VAT_NUMBER` | partita IVA, se applicabile |
| `VITE_SUPPORT_EMAIL` | email pubblica di assistenza |
| `VITE_PRIVACY_EMAIL` | contatto per le richieste privacy |

Sono tutti dati pubblici che finiscono nel sito, compresa la `apiKey` di Firebase: non è una chiave segreta. **Non inserire mai chiavi segrete nelle variabili `VITE_`.** Per lo sviluppo copia gli stessi valori Firebase anche in `.env.local`.

## 6. Pubblica su Cloudflare Pages collegato a GitHub (5 min)

1. Crea un account gratuito su <https://dash.cloudflare.com/sign-up>.
2. **Workers & Pages → Create → scheda Pages → Import an existing Git repository.** Se vedi solo Workers, cerca il link "Looking to deploy Pages? Get started".
3. **Connect GitHub**: autorizza Cloudflare e scegli il repository di Rivendo.
4. Impostazioni di build:
   - **Project name:** `rivendo`, che dà l'indirizzo `rivendo.pages.dev`
   - **Production branch:** `main`
   - **Framework preset:** `React (Vite)`, oppure `None`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. In **Environment variables** aggiungi le stesse variabili `VITE_*` del passo 5, più `NODE_VERSION` = `22`. Il file `.env.production.local` non va su GitHub: Cloudflare legge i valori solo da qui.
6. **Save and Deploy.** Dopo un paio di minuti il sito è online su **`https://rivendo.pages.dev`**.

Da quel momento **ogni `git push` su `main` pubblica il sito automaticamente**. Gli altri branch ricevono un indirizzo di anteprima. Se cambi una variabile, ripubblica da **Deployments → … → Retry deployment**.

> In alternativa, senza GitHub: `npx wrangler login`, poi `npx wrangler pages project create rivendo --production-branch main` e infine `npm run deploy`. Funziona solo per un progetto creato così, non per uno collegato a Git.

Le intestazioni di sicurezza (`public/_headers`) e il ritorno alla pagina giusta per `/privacy`, `/terms` e `/delete-account` funzionano già senza configurazioni.

## 7. Collega il sito al login (1 min)

**Firebase → Authentication → Impostazioni → Domini autorizzati → Aggiungi dominio:** `rivendo.pages.dev`, oppure il tuo dominio.

**Prova finale:**
1. Apri il sito ed entra con Google o con il link via email.
2. Crea un oggetto con una foto, esci e rientra da un altro dispositivo: devi ritrovare tutto.
3. Prova **Impostazioni → Elimina account e dati** con un account di test, entro qualche minuto dall'accesso: Firebase lo richiede per sicurezza.

### Dominio personalizzato
1. **Cloudflare Pages → rivendo → Custom domains:** collega il sito, per esempio `app.rivendo.it`.
2. Aggiungi il dominio ai **Domini autorizzati** di Firebase Authentication.

---

## Prima di aprire al pubblico

1. Compila tutti i dati legali (`VITE_LEGAL_*`, `VITE_SUPPORT_EMAIL`, `VITE_PRIVACY_EMAIL`). Finché mancano, `/privacy` e `/terms` mostrano un avviso di bozza.
2. Indica nella privacy policy le regioni scelte per Firestore e Storage.
3. Verifica che `https://IL-TUO-DOMINIO/privacy`, `/terms` e `/delete-account` si aprano senza login.
4. Prova la cancellazione con un account di test. Devono sparire l'utente (**Authentication**), i suoi dati (**Firestore → users**) e le sue foto (**Storage → users**).
5. Segui [SPONSOR_LAUNCH.md](./SPONSOR_LAUNCH.md) per i passaggi legali, store e permessi ancora da completare.

---

## Sicurezza: cosa è già attivo

- **Login obbligatorio:** senza accesso non si vede nulla dell'app, tranne le pagine legali.
- **Regole per utente** (`firestore.rules`, `storage.rules`): ogni utente legge e scrive solo `users/{il suo id}`. Le foto accettano solo immagini fino a 10 MB.
- **Foto private:** il sito le scarica solo con la sessione dell'utente.
- **Cancellazione account:** la esegue l'app stessa (oggetti, impostazioni, foto e utente). Nessuna chiave segreta è presente nel sito.
- **Chiave AI (Gemini/OpenAI):** resta solo sul dispositivo dell'utente. Prima di ogni analisi l'utente conferma l'invio delle foto, e il prezzo di acquisto non viene mai inviato.
- **Intestazioni di sicurezza** (`public/_headers`):
  - CSP: il sito può contattare solo Google/Firebase e i servizi AI;
  - protezione dal clickjacking;
  - HSTS, che obbliga a usare `https`.

## Sviluppo in locale

```bash
npm install
cp .env.example .env.local   # valori Firebase (lo stesso progetto va bene: localhost è già autorizzato)
npm run dev                  # http://localhost:5173
```
