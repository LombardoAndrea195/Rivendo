# Estensione Rivendo per Vinted

L’estensione legge i dati che Rivendo ha appena preparato, quindi compila **titolo, descrizione e prezzo** nella pagina di creazione dell’annuncio Vinted. Non accede al tuo account, non gestisce il login e non preme mai il pulsante **Pubblica**.

## Installazione locale in Chrome e browser Chromium

1. Apri `chrome://extensions`.
2. Attiva **Modalità sviluppatore** in alto a destra.
3. Seleziona **Carica estensione non pacchettizzata**.
4. Scegli la cartella `extension` di questo progetto.

Funziona nello stesso modo anche in Microsoft Edge, Brave, Opera e Vivaldi.

## Safari (macOS)

Apri `safari-extension/Rivendo per Vinted.xcodeproj` con Xcode, seleziona il tuo team Apple in **Signing & Capabilities**, quindi esegui l’app. Safari mostrerà l’estensione in **Safari → Impostazioni → Estensioni**, dove puoi attivarla per Vinted.

Safari richiede un gesto esplicito per leggere gli appunti: dopo avere aperto la pagina Vinted, premi l’icona dell’estensione nella barra di Safari e seleziona **Compila l’annuncio**.

## Firefox

Apri `about:debugging#/runtime/this-firefox`, scegli **Carica estensione temporanea** e seleziona `extension/manifest.json`. Per una distribuzione permanente è necessario pubblicarla e farla firmare su Firefox Add-ons.

## Uso

1. Genera l’annuncio in Rivendo.
2. Clicca **Pubblica su Vinted**.
3. L’estensione inserisce automaticamente i dati. Se dopo alcuni secondi Vinted è ancora vuoto, premi l’icona dell’estensione nel browser e scegli **Compila l’annuncio**.
4. Aggiungi le foto, completa gli eventuali menu a scelta di Vinted, controlla tutto e premi **Pubblica** personalmente.

Vinted può cambiare i propri campi e componenti: se l’interfaccia cambia, i selettori dell’estensione potrebbero richiedere un aggiornamento.
