# Pubblicare Rivendo e collegare i servizi

Il sito è statico: nessun server e nessun database. Su Render il piano gratuito basta.

## 1. Prendere il codice

Il codice è su GitHub: <https://github.com/LombardoAndrea195/Rivendo>.

```bash
git clone https://github.com/LombardoAndrea195/Rivendo.git
cd Rivendo
npm install
npm run dev          # prova in locale su http://localhost:5173
npm run build        # crea il sito pronto da pubblicare nella cartella dist/
```

- `main`: versione pubblica senza account (quella che va su Render).
- `dev`: versione precedente con account e Firebase (`git checkout dev`).
- Per un archivio .zip senza git: su GitHub → **Code → Download ZIP**, oppure `git archive -o rivendo.zip main`.

## 2. Pubblicare su Render (5 min)

1. Accedi a <https://dashboard.render.com> con il tuo account GitHub.
2. **New → Blueprint** → scegli il repository `Rivendo` → branch `main`.
3. Render legge `render.yaml` e propone il servizio statico `rivendo`. Le variabili `VITE_*` puoi lasciarle vuote per ora → **Apply**.
4. Dopo 1-2 minuti il sito è su `https://rivendo.onrender.com` (o un nome simile).

Ogni `git push` su `main` ripubblica il sito da solo.

**Dominio tuo (facoltativo):** servizio → **Settings → Custom Domains** → aggiungi il dominio e copia i record DNS indicati presso il tuo registrar.

## 3. Collegare Google AdSense

1. Iscriviti su <https://adsense.google.com> con l'indirizzo del sito e attendi l'approvazione (da qualche giorno a qualche settimana).
2. **Codice editore:** AdSense → **Account → Informazioni sull'account** → "ID editore" `pub-…`. Il valore da usare è `ca-pub-…`.
3. **Id degli spazi:** **Annunci → Per unità pubblicitaria → Annunci display**. Creane tre (alto, laterale, fondo). Da ogni codice copia il numero in `data-ad-slot="1234567890"`.
4. **ads.txt:** AdSense mostra una riga tipo `google.com, pub-…, DIRECT, f08c47fec0942fa0`. Crea il file `public/ads.txt` con quella riga, poi fai commit e push.
5. **Consenso cookie (obbligatorio per l'Europa):** AdSense → **Privacy e messaggi → GDPR** → crea e pubblica il messaggio. Lo script degli annunci lo mostra da solo.
6. Su Render: servizio → **Environment** → imposta:

| Variabile | Valore |
|---|---|
| `VITE_ADSENSE_CLIENT` | `ca-pub-…` |
| `VITE_AD_SLOT_TOP` | id spazio in alto |
| `VITE_AD_SLOT_SIDE` | id spazio laterale |
| `VITE_AD_SLOT_BOTTOM` | id spazio in fondo |

7. **Manual Deploy → Clear build cache & deploy**: i valori vengono inseriti nel sito durante la build, quindi va rifatta.

## 4. Dati per privacy e termini

Sempre in **Environment** imposta `VITE_LEGAL_OPERATOR_NAME`, `VITE_LEGAL_OPERATOR_ADDRESS`, `VITE_SUPPORT_EMAIL`, `VITE_PRIVACY_EMAIL` (e `VITE_LEGAL_VAT_NUMBER` se hai la partita IVA), poi rifai il deploy. Finché mancano, `/privacy` e `/terms` mostrano un avviso di bozza.

## Note

- Il piano gratuito di Render per i siti statici non va in pausa e include il certificato `https`.
- Le intestazioni di sicurezza (inclusi i domini consentiti per AdSense e per l'AI) sono in `render.yaml`. Se aggiungi altri servizi esterni, aggiungi i loro domini alla `Content-Security-Policy`.
