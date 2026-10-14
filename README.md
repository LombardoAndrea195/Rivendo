# Rivendo — dalla foto all'annuncio

Strumento web gratuito per chi rivende oggetti usati su Vinted, Subito ed eBay.

- **Foto → annuncio con AI:** titolo, descrizione, marca, taglia, condizioni e stima del prezzo.
- **Testi pronti per ogni piattaforma**, con pulsanti per copiare e aprire la pagina "Vendi".
- **Prezzo con margine di trattativa** e quanto ti resta dopo le commissioni di ogni piattaforma.
- **Nessun account e nessun salvataggio:** tutto resta nella pagina aperta e sparisce quando la ricarichi. Anche la chiave AI resta solo in memoria, a meno che l'utente non scelga "Ricorda su questo dispositivo" (salvata solo nel suo browser).
- **Spazi per banner** (Google AdSense) in alto, a lato e in fondo.

La versione precedente, con account e dati salvati su Firebase, è nel branch `dev`.

## Avvio in locale

```bash
npm install
npm run dev
```

Apri <http://localhost:5173>. Non serve configurare nulla: per l'AI incolla nella pagina una chiave gratuita di [Google AI Studio](https://aistudio.google.com/apikey). Senza AdSense configurato vedi dei segnaposto "Spazio pubblicitario".

## Banner pubblicitari

Copia `.env.example` (in locale) o imposta su Render le variabili con il codice editore AdSense (`ca-pub-…`) e gli id dei tre spazi. Per gli utenti europei Google richiede un banner di consenso cookie certificato (per esempio quello di AdSense, "Privacy e messaggi"), e privacy e termini vanno completati con i dati del titolare.

## Pubblicazione

Il sito va su Render con `render.yaml`. Passaggi, AdSense e come scaricare il codice: **[PUBBLICAZIONE.md](./PUBBLICAZIONE.md)**.

## Struttura

| Percorso | Contenuto |
|---|---|
| `src/App.tsx` | Pagina unica: chiave AI, generatore, commissioni, banner |
| `src/components/Generator.tsx` | Foto, AI, dettagli, prezzo e pubblicazione |
| `src/components/AdSlot.tsx` | Spazio pubblicitario AdSense con segnaposto |
| `src/ai.ts` | Analisi delle foto con Gemini/OpenAI, con tentativi e modelli di riserva |
| `src/fees.ts` | Commissioni delle piattaforme, con fonti e data di verifica |
| `src/components/PublicPage.tsx` | Privacy e termini |
| `render.yaml` | Configurazione Render: build, intestazioni di sicurezza, variabili |
