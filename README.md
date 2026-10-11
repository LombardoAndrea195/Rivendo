# Rivendo — Reselling Assistant

Web app per chi compra e rivende oggetti usati su Vinted, Subito ed eBay.

- **Accesso sicuro** con Google o con un link via email: ogni utente vede solo i propri dati.
- **Dati e foto nel cloud** (Supabase): li ritrovi su ogni dispositivo.
- **Foto → annuncio con AI:** titolo, descrizione, marca, taglia, condizioni e stima del prezzo.
- **Pubblicazione assistita** su Vinted, Subito ed eBay: foto pronte, testi da copiare, pagina "Vendi" a un clic.
- **Margine per le trattative:** pubblichi un po' più alto e accetti le offerte fino al tuo minimo.
- **Profitto reale:** commissioni aggiornate per account privato e professionale, costo d'acquisto e spedizione.
- **Andamento:** profitto, ROI, capitale fermo, tempo medio di vendita, annunci da ribassare.
- **Backup** in JSON con foto incluse ed esportazione CSV per Excel.

## Avvio in locale

Serve Docker per Supabase locale.

```bash
npm install
npm run db:start
cp .env.example .env.local   # inserisci URL e publishable key mostrati da db:start
npm run dev
```

Apri <http://localhost:5173>. Le email di accesso arrivano su Mailpit: <http://127.0.0.1:54324>.

## Pubblicazione

Vedi **[DEPLOY.md](./DEPLOY.md)** per la guida passo passo: Supabase, Google, email e Vercel.

## Struttura

| Percorso | Contenuto |
|---|---|
| `src/components/` | Interfaccia: login, inventario, editor, andamento, impostazioni |
| `src/db.ts`, `src/photos.ts` | Salvataggio su Supabase (database + foto private) |
| `src/ai.ts` | Analisi delle foto con Gemini/OpenAI, con tentativi e modelli di riserva |
| `src/fees.ts` | Commissioni delle piattaforme, con fonti e data di verifica |
| `supabase/migrations/` | Schema del database e regole di sicurezza (RLS) |
| `vercel.json` | Intestazioni di sicurezza per la produzione |
