# Rivendo — Reselling Assistant

Web app per chi compra e rivende oggetti usati su Vinted, Subito ed eBay.

- **Accesso sicuro** con Google o con un link via email: ogni utente vede solo i propri dati.
- **Dati e foto nel cloud** (Appwrite): li ritrovi su ogni dispositivo.
- **Foto → annuncio con AI:** titolo, descrizione, marca, taglia, condizioni e stima del prezzo.
- **Pubblicazione assistita** su Vinted, Subito ed eBay: foto pronte, testi da copiare, pagina "Vendi" a un clic.
- **Margine per le trattative:** pubblichi un po' più alto e accetti le offerte fino al tuo minimo.
- **Profitto reale:** commissioni aggiornate per account privato e professionale, costo d'acquisto e spedizione.
- **Andamento:** profitto, ROI, capitale fermo, tempo medio di vendita, annunci da ribassare.
- **Backup** in JSON con foto incluse ed esportazione CSV per Excel.

## Avvio in locale

```bash
npm install
cp .env.example .env.local   # inserisci API Endpoint e Project ID del tuo progetto Appwrite
npm run dev
```

Apri <http://localhost:5173>. Il progetto Appwrite deve avere `localhost` tra le piattaforme Web.

## Pubblicazione

Vedi **[DEPLOY.md](./DEPLOY.md)** per la guida passo passo: Appwrite, Google e Cloudflare Pages.

Per preparare un rilascio con sponsor entro il 20 ottobre 2026, segui **[SPONSOR_LAUNCH.md](./SPONSOR_LAUNCH.md)**.

## Struttura

| Percorso | Contenuto |
|---|---|
| `src/components/` | Interfaccia: login, inventario, editor, andamento, impostazioni |
| `src/db.ts`, `src/photos.ts` | Salvataggio su Appwrite (database + foto private) |
| `src/ai.ts` | Analisi delle foto con Gemini/OpenAI, con tentativi e modelli di riserva |
| `src/fees.ts` | Commissioni delle piattaforme, con fonti e data di verifica |
| `scripts/setup-appwrite.mjs` | Crea tabelle, permessi, spazio foto e function su Appwrite |
| `appwrite-functions/delete-account/` | Function Appwrite per cancellare account, dati e foto |
| `src/components/PublicPage.tsx` | Privacy, termini e pagina di cancellazione account |
| `public/_headers` | Intestazioni di sicurezza per Cloudflare Pages |
