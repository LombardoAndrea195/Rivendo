# Checklist lancio con sponsor

Obiettivo operativo: avere Rivendo pubblicabile entro martedì 20 ottobre 2026. È una checklist di preparazione, non una garanzia di approvazione degli store.

## Dati da concordare con lo sponsor

- [ ] Identificare il titolare effettivo del servizio. Lo sponsor non diventa automaticamente titolare solo perché finanzia il progetto.
- [ ] Raccogliere ragione sociale/nome, indirizzo, partita IVA se applicabile, email assistenza e contatto privacy.
- [ ] Stabilire chi possiede il dominio, gli account Apple/Google, il progetto Appwrite e l’account Cloudflare; attivare MFA e conservare i recovery code.
- [ ] Definire se il rilascio iniziale è web/PWA o anche app iOS/Android. Questa repository è una web app Vite: la pubblicazione sugli store richiede packaging e test mobile separati.
- [ ] Definire modello di prezzo, eventuali abbonamenti, responsabilità di supporto e budget per hosting e uso AI.

## Variabili e servizio

- [ ] Impostare in `.env.production.local` le variabili Appwrite, provider di accesso e `VITE_LEGAL_*`, `VITE_SUPPORT_EMAIL`, `VITE_PRIVACY_EMAIL` descritte in `.env.example`, poi pubblicare con `npm run deploy`.
- [ ] Usare la regione Appwrite Frankfurt e registrare i fornitori (Appwrite, Cloudflare, Google, provider AI), i loro termini e gli eventuali trasferimenti internazionali nella policy verificata.
- [ ] Verificare le email di accesso inviate da Appwrite; per mittente e dominio personalizzati configurare un SMTP in Appwrite (Settings → SMTP).
- [ ] Eseguire `npm run appwrite:setup` (crea anche la function `delete-account`) e verificare la cancellazione di un account di test: utente, righe e foto devono sparire.
- [ ] Aggiungere il dominio definitivo come piattaforma Web in Appwrite e nelle origini del client Google (i ritorni a `/` e `/delete-account` usano lo stesso dominio).
- [ ] Passare ad Appwrite Pro prima dell’apertura: sul piano gratuito il progetto va in pausa dopo 7 giorni senza attività di sviluppo. Cloudflare Pages gratuito è utilizzabile anche per uso commerciale.

## Privacy, termini e permessi

- [ ] Far verificare privacy e termini dal titolare/consulente prima dell’apertura. Le pagine `/privacy` e `/terms` mostrano un avviso finché mancano i dati obbligatori.
- [ ] Confermare la mappa dati: email/profilo, inventario, prezzi inseriti, foto private, impostazioni locali, provider di login, Appwrite, Cloudflare e provider AI scelto dall’utente.
- [ ] Verificare i tempi di conservazione e backup in base ai piani effettivamente acquistati; aggiornare il testo se cambia un fornitore o il flusso AI.
- [ ] La selezione delle foto usa il file picker del dispositivo: non richiede accesso completo alla libreria. Non chiedere posizione, microfono, contatti o accesso in background.
- [ ] La fotocamera non è richiesta separatamente dal codice web attuale. Se in futuro si aggiunge una funzione di scatto nativa, dichiararne lo scopo e chiedere il permesso solo quando viene usata.
- [ ] Le notifiche non sono attive e non vanno richieste finché non esiste una funzione che ne ha bisogno.
- [ ] Prima dell’analisi AI l’utente vede e conferma l’invio a Gemini/OpenAI di massimo quattro foto e dei dettagli annuncio; il prezzo di acquisto non viene inviato.
- [ ] Verificare un percorso di cancellazione da `/delete-account` e dall’interno dell’app. Testare account, righe, foto e dati locali.

## Se si pubblica sugli store

- [ ] Apple Developer Program e Google Play Console intestati al titolare concordato; completare verifica identità e pagamenti richiesti dagli store.
- [ ] Per iOS, verificare login Apple quando resta attivo il login Google; configurare provider e piattaforme su Appwrite.
- [ ] Completare schede privacy App Store e Data safety Google Play, coerenti con SDK, backend e provider AI reali.
- [ ] Preparare nome, icona, screenshot, descrizione, categoria, classificazione età, URL privacy, assistenza e cancellazione account.
- [ ] Fornire agli auditor un account/demo funzionante e backend attivo; eseguire test su dispositivi reali e prova di accessibilità/funzionalità mobile.
- [ ] Non inviare un semplice contenitore web senza valore mobile aggiunto: Apple applica requisiti di funzionalità minima e può rifiutarlo.
- [ ] Se si introducono acquisti digitali o abbonamenti in app, decidere prima l’integrazione dei pagamenti e controllare commissioni e regole correnti di ciascuno store.

## Verifica finale del 20 ottobre

- [ ] Policy approvate e senza campi da configurare.
- [ ] Nessuna credenziale server inclusa nel bundle web.
- [ ] Login, caricamento foto, analisi AI con consenso, export e cancellazione provati in produzione.
- [ ] Dominio HTTPS, redirect, email, supporto e dashboard di spesa verificati.
- [ ] Per gli store: invio/revisione completati. Le tempistiche e l’approvazione dipendono da Apple e Google; perciò il 20 ottobre è una data obiettivo per la preparazione, non una data garantita di presenza sugli store.