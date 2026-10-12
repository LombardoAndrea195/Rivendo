type PageKind = 'privacy' | 'terms' | 'delete-account'

const legalInfo = {
    operator: import.meta.env.VITE_LEGAL_OPERATOR_NAME?.trim() ?? '',
    address: import.meta.env.VITE_LEGAL_OPERATOR_ADDRESS?.trim() ?? '',
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL?.trim() ?? '',
    privacyEmail: import.meta.env.VITE_PRIVACY_EMAIL?.trim() ?? '',
    vatNumber: import.meta.env.VITE_LEGAL_VAT_NUMBER?.trim() ?? '',
}

const ready = Boolean(legalInfo.operator && legalInfo.address && legalInfo.supportEmail && legalInfo.privacyEmail)

function Contact({ email }: { email: string }) {
    return email ? <a href={`mailto:${email}`}>{email}</a> : <strong>Da configurare prima del lancio</strong>
}

function Layout({ children }: { children: React.ReactNode }) {
    return (
        <main className="public-page">
            <header className="public-page-head">
                <a className="brand" href="/" aria-label="Rivendo, pagina iniziale">
                    <span className="brand-mark" aria-hidden>R</span>
                    Rivendo
                </a>
                <nav className="legal-links" aria-label="Pagine legali">
                    <a href="/privacy">Privacy</a>
                    <a href="/terms">Termini</a>
                </nav>
            </header>
            <article className="public-copy">{children}</article>
        </main>
    )
}

export default function PublicPage({ kind }: { kind: PageKind }) {
    if (kind === 'delete-account') {
        return (
            <Layout>
                <p className="eyebrow">RIVENDo / ACCOUNT</p>
                <h1>Richiedi la cancellazione</h1>
                <p>Per proteggere i dati, la richiesta deve essere confermata accedendo all’account che vuoi eliminare.</p>
                <ol>
                    <li>Accedi con Google o con il link email usato per creare l’account.</li>
                    <li>Nelle impostazioni scegli <strong>Elimina account e dati</strong>.</li>
                    <li>Conferma l’operazione: verranno eliminati account, inventario, impostazioni e foto.</li>
                </ol>
                <a className="btn btn-primary" href="/delete-account?login=1">Accedi per eliminare l’account</a>
                <p className="muted small">Se non riesci ad accedere, contatta l’assistenza: <Contact email={legalInfo.supportEmail} />.</p>
                <a href="/privacy">Informativa privacy</a>
            </Layout>
        )
    }

    return (
        <Layout>
            {!ready && (
                <div className="notice launch-draft" role="status">
                    Bozza pre-lancio: completare titolare, indirizzo e recapiti nelle variabili VITE_LEGAL_* (file .env.production.local) prima di rendere pubblico il servizio.
                </div>
            )}
            {kind === 'privacy' ? (
                <>
                    <p className="eyebrow">RIVENDo / INFORMATIVA</p>
                    <h1>Informativa privacy</h1>
                    <p className="muted small">Aggiornata l’11 ottobre 2026</p>
                    <p>Questa bozza descrive il trattamento dei dati nell’app Rivendo. Prima del lancio il titolare deve verificarla e completare i dati identificativi e i recapiti.</p>
                    <h2>Titolare del trattamento</h2>
                    <p><strong>{legalInfo.operator || '[Nome o ragione sociale da configurare]'}</strong>{legalInfo.vatNumber && `, P. IVA ${legalInfo.vatNumber}`}</p>
                    <p>{legalInfo.address || '[Indirizzo completo da configurare]'}</p>
                    <p>Contatto privacy: <Contact email={legalInfo.privacyEmail} />. Assistenza: <Contact email={legalInfo.supportEmail} />.</p>
                    <h2>Dati trattati e finalità</h2>
                    <ul>
                        <li>Email e dati essenziali del profilo forniti dal metodo di accesso, per autenticare l’utente e proteggere l’account.</li>
                        <li>Dati dell’inventario inseriti dall’utente, incluse descrizioni, foto, prezzi, date e impostazioni, per offrire le funzioni dell’app.</li>
                        <li>Chiavi API Gemini o OpenAI inserite dall’utente: sono conservate nel local storage del browser e non nel database Rivendo.</li>
                        <li>Dati tecnici necessari a erogare e proteggere il servizio, come richieste di rete e registri tecnici forniti dall’infrastruttura.</li>
                    </ul>
                    <h2>Fornitori e trasferimenti</h2>
                    <p>Google Firebase fornisce autenticazione, invio delle email di accesso, database e archivio privato delle foto; Cloudflare ospita il sito e fornisce la rete di distribuzione. Google gestisce anche l’accesso con account Google e, se scelto dall’utente, il servizio Gemini. OpenAI riceve i dati solo quando l’utente sceglie il relativo provider AI.</p>
                    <p>Quando l’utente avvia l’analisi AI, fino a quattro foto e titolo, marca, taglia e note dell’oggetto sono inviati direttamente al provider scelto con la chiave API personale. Il prezzo di acquisto non viene inviato. Si applicano anche le condizioni e le informative del provider AI; verificare e indicare nella versione definitiva le impostazioni di conservazione e trasferimento applicabili.</p>
                    <p>Le regioni del database e dell’archivio foto Firebase e gli eventuali trasferimenti fuori dallo Spazio economico europeo (per esempio verso server negli Stati Uniti) devono essere verificati e indicati dal titolare prima del lancio.</p>
                    <h2>Conservazione e cancellazione</h2>
                    <p>I dati dell’account restano disponibili finché l’account è attivo. L’utente può esportare i dati o avviare la cancellazione dalle impostazioni, oppure dalla pagina <a href="/delete-account">Elimina account</a>. La cancellazione rimuove account, oggetti, impostazioni e foto; le impostazioni locali vengono rimosse dal dispositivo usato per la richiesta. Le chiavi API salvate localmente su altri dispositivi vanno rimosse da quei dispositivi. Copie tecniche nei backup possono seguire i tempi di conservazione del piano dei fornitori. Il titolare deve completare qui eventuali obblighi di conservazione previsti dalla legge.</p>
                    <h2>Diritti</h2>
                    <p>L’utente può chiedere accesso, rettifica, cancellazione, limitazione o portabilità dei dati scrivendo a <Contact email={legalInfo.privacyEmail} />. Può inoltre proporre reclamo al Garante per la protezione dei dati personali.</p>
                    <h2>Archiviazione locale e tracciamento</h2>
                    <p>Rivendo usa l’archiviazione locale del browser (local storage e IndexedDB) per mantenere la sessione e le impostazioni necessarie al servizio. Il progetto non integra strumenti pubblicitari o analytics di terze parti. Eventuali strumenti aggiunti in futuro richiedono aggiornamento dell’informativa e delle dichiarazioni store.</p>
                </>
            ) : (
                <>
                    <p className="eyebrow">RIVENDo / CONDIZIONI</p>
                    <h1>Termini di servizio</h1>
                    <p className="muted small">Bozza da verificare prima del lancio commerciale.</p>
                    <p>Il servizio Rivendo aiuta a organizzare un inventario di oggetti usati, preparare bozze di annunci e calcolare stime di prezzo e profitto.</p>
                    <h2>Account e uso del servizio</h2>
                    <p>L’utente è responsabile dell’accesso al proprio account, dei dati inseriti e della verifica dei contenuti prima di pubblicarli o condividerli. Non inserire dati personali di terzi nelle descrizioni o nelle foto senza averne titolo.</p>
                    <h2>Funzioni AI e stime</h2>
                    <p>Testi, classificazioni e stime sono generati automaticamente e possono essere inesatti o incompleti. Non costituiscono valutazioni professionali né garanzie di vendita o di prezzo. L’utente deve verificare descrizioni, condizioni, prezzi e conformità alle regole del marketplace prima di usarli.</p>
                    <h2>Servizi di terzi</h2>
                    <p>Vinted, Subito, eBay, Google Gemini e OpenAI sono servizi indipendenti con condizioni proprie. Rivendo non è affiliata né approvata da tali piattaforme e non pubblica automaticamente gli annunci. L’utente è responsabile del rispetto delle condizioni d’uso delle piattaforme.</p>
                    <h2>Disponibilità e dati</h2>
                    <p>Il servizio è fornito nello stato disponibile; l’utente può esportare un backup dalle impostazioni. L’eliminazione dell’account e dei dati è disponibile in app e su <a href="/delete-account">questa pagina</a>.</p>
                    <h2>Titolare e assistenza</h2>
                    <p><strong>{legalInfo.operator || '[Nome o ragione sociale da configurare]'}</strong>, {legalInfo.address || '[Indirizzo completo da configurare]'}{legalInfo.vatNumber && `, P. IVA ${legalInfo.vatNumber}`}.</p>
                    <p>Contatto: <Contact email={legalInfo.supportEmail} />.</p>
                    <p>Prima di vendere abbonamenti o rivolgersi a consumatori, completare queste condizioni con disciplina applicabile, prezzi, rinnovi, recessi, rimborsi e foro competente dopo verifica legale.</p>
                </>
            )}
            <p className="legal-links"><a href="/privacy">Privacy</a><a href="/terms">Termini</a><a href="/delete-account">Elimina account</a></p>
        </Layout>
    )
}